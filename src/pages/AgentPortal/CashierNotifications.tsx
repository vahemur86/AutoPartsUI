import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Bell, ExternalLink, LoaderCircle, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import api from "@/services";
import { getCashRegisterId } from "@/utils";
import { useAppSelector } from "@/store/hooks";
import { agentPortalService } from "@/services/agentPortal";
import type { CashierNotification, CashierNotificationPage } from "@/types/agentPortal";
import styles from "./CashierNotifications.module.css";

const PAGE_SIZE = 50;
const ARMENIAN_MONTHS = [
  "հունվարի",
  "փետրվարի",
  "մարտի",
  "ապրիլի",
  "մայիսի",
  "հունիսի",
  "հուլիսի",
  "օգոստոսի",
  "սեպտեմբերի",
  "հոկտեմբերի",
  "նոյեմբերի",
  "դեկտեմբերի",
];

const isCashierNotification = (value: unknown): value is CashierNotification => {
  if (!value || typeof value !== "object") return false;
  const notification = value as Record<string, unknown>;
  return typeof notification.id === "string" &&
    typeof notification.agentOrderRequestId === "string" &&
    typeof notification.title === "string" &&
    typeof notification.message === "string" &&
    typeof notification.createdAt === "string";
};

const formatTimestamp = (value: string, language: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (language.startsWith("am")) {
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
    return `${date.getDate()} ${ARMENIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
  }
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

interface CashierNotificationsProps {
  accessToken: string | null;
  onOpenRequest: (requestId: string) => void;
  onRefreshPendingRequests?: () => void;
}

export const CashierNotifications = ({
  accessToken,
  onOpenRequest,
  onRefreshPendingRequests,
}: CashierNotificationsProps) => {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const cashRegisterId = getCashRegisterId(user?.cashRegisterId ?? 0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CashierNotification[]>([]);
  const [page, setPage] = useState<CashierNotificationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");
  const [connectionRetry, setConnectionRetry] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());
  const onOpenRequestRef = useRef(onOpenRequest);
  const onRefreshPendingRequestsRef = useRef(onRefreshPendingRequests);
  onOpenRequestRef.current = onOpenRequest;
  onRefreshPendingRequestsRef.current = onRefreshPendingRequests;

  const getNotificationTitle = useCallback((title: string) =>
    title.trim().toLocaleLowerCase() === "new agent order request"
      ? t("agentPortal.cashierNotifications.newAgentOrderRequest")
      : title, [t]);
  const getNotificationMessage = useCallback((message: string) => {
    const match = /^(.*?)\s+\((.*?)\)\s+submitted an order request for cashier approval\.$/.exec(message.trim());
    return match
      ? t("agentPortal.cashierNotifications.agentOrderRequestSubmitted", { agentName: match[1], agentCode: match[2] })
      : message;
  }, [t]);

  const loadNotifications = useCallback(async (nextPage = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError("");
    try {
      const result = await agentPortalService.getCashierNotifications(nextPage, PAGE_SIZE);
      if (!result || !Array.isArray(result.results)) {
        throw new Error(t("agentPortal.cashierNotifications.invalidResponse"));
      }
      result.results.forEach((notification) => seenIdsRef.current.add(notification.id));
      setPage(result);
      setNotifications((current) => append
        ? [...current, ...result.results.filter((item) => !current.some((existing) => existing.id === item.id))]
        : result.results);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t("agentPortal.cashierNotifications.loadError");
      setError(message);
      if (!append) toast.error(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!accessToken || !cashRegisterId) {
      setConnectionState("disconnected");
      return;
    }
    const configuredApiBase = api.defaults.baseURL?.replace(/\/+$/, "");
    if (!configuredApiBase) {
      setConnectionState("disconnected");
      return;
    }
    const hubBase = configuredApiBase.endsWith("/api")
      ? configuredApiBase
      : `${configuredApiBase}/api`;
    const cashierHubUrl = new URL(`${hubBase}/hubs/cash`);
    cashierHubUrl.searchParams.set("cashRegisterId", String(cashRegisterId));
    const connection = new HubConnectionBuilder()
      .withUrl(cashierHubUrl.toString(), {
        accessTokenFactory: () => accessToken,
        headers: { "X-CashRegister-Id": String(cashRegisterId) },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("CashierNotificationCreated", (value: unknown) => {
      if (!isCashierNotification(value) || seenIdsRef.current.has(value.id)) return;
      seenIdsRef.current.add(value.id);
      setNotifications((current) => [value, ...current].slice(0, PAGE_SIZE));
      setPage((current) => current ? { ...current, totalItems: current.totalItems + 1, page: 1 } : current);
      toast.info(`${getNotificationTitle(value.title)}: ${getNotificationMessage(value.message)}`);
      onRefreshPendingRequestsRef.current?.();
    });

    connection.onreconnecting(() => setConnectionState("reconnecting"));
    connection.onreconnected(async () => {
      setConnectionState("connected");
      try {
        await connection.invoke("JoinCashierNotifications");
      } catch (reconnectError) {
        const message = reconnectError instanceof Error ? reconnectError.message : t("agentPortal.cashierNotifications.reconnectError");
        setError(message);
        setConnectionState("disconnected");
        toast.error(message);
      }
      await loadNotifications();
      onRefreshPendingRequestsRef.current?.();
    });
    connection.onclose(() => setConnectionState("disconnected"));

    let active = true;
    void connection.start()
      .then(async () => {
        await connection.invoke("JoinCashierNotifications");
        if (active) {
          setConnectionState("connected");
        }
      })
      .catch((connectionError: unknown) => {
        if (!active) return;
        setConnectionState("disconnected");
        const message = connectionError instanceof Error ? connectionError.message : t("agentPortal.cashierNotifications.connectionError");
        setError(message);
      });

    return () => {
      active = false;
      void connection.stop();
    };
  }, [accessToken, cashRegisterId, connectionRetry, getNotificationMessage, getNotificationTitle, loadNotifications, t]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const updateBusy = (id: string, busy: boolean) => {
    setBusyIds((current) => busy
      ? current.includes(id) ? current : [...current, id]
      : current.filter((item) => item !== id));
  };

  const deleteNotification = async (notification: CashierNotification) => {
    if (busyIds.includes(notification.id)) return;
    updateBusy(notification.id, true);
    setError("");
    try {
      await agentPortalService.deleteCashierNotification(notification.id);
      seenIdsRef.current.add(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setPage((current) => current ? { ...current, totalItems: Math.max(0, current.totalItems - 1) } : current);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("agentPortal.cashierNotifications.deleteError");
      setError(message);
      toast.error(message);
    } finally {
      updateBusy(notification.id, false);
    }
  };

  const connectionLabel = t(`agentPortal.notifications.connection.${connectionState}`);
  const hasMore = Boolean(page && page.page * page.pageSize < page.totalItems);
  const dateLanguage = i18n.resolvedLanguage || i18n.language;

  return (
    <div className={styles.notifications} ref={panelRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label={t("agentPortal.cashierNotifications.open", { count: page?.totalItems ?? 0 })}
        aria-expanded={isOpen}
        aria-controls="cashier-notifications-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={18} aria-hidden="true" />
        {(page?.totalItems ?? 0) > 0 && <span className={styles.badge}>{page!.totalItems > 99 ? "99+" : page!.totalItems}</span>}
      </button>
      {isOpen && (
        <section className={styles.panel} id="cashier-notifications-panel" aria-label={t("agentPortal.cashierNotifications.title")}>
          <header className={styles.panelHeader}>
            <div>
              <h2>{t("agentPortal.cashierNotifications.title")}</h2>
              <span className={styles.connectionState} data-state={connectionState}>
                <span aria-hidden="true" />{connectionLabel}
              </span>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label={t("common.close")}>
              <X size={17} aria-hidden="true" />
            </button>
          </header>
          {error && <div className={styles.panelError} role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void loadNotifications()}>{t("agentPortal.retry")}</button>
          </div>}
          {isLoading ? <div className={styles.panelState}><LoaderCircle size={18} className={styles.spinner} />{t("agentPortal.cashierNotifications.loading")}</div> : (
            <div className={styles.notificationList}>
              {notifications.map((notification) => (
                <article className={styles.notificationItem} key={notification.id}>
                  <button
                    type="button"
                    className={styles.notificationBody}
                    onClick={() => {
                      setIsOpen(false);
                      onOpenRequestRef.current(notification.agentOrderRequestId);
                    }}
                  >
                    <span className={styles.notificationTitle}>{getNotificationTitle(notification.title)}</span>
                    <span className={styles.notificationMessage}>{getNotificationMessage(notification.message)}</span>
                    <span className={styles.notificationDate}>{formatTimestamp(notification.createdAt, dateLanguage)}</span>
                    <span className={styles.openHint}><ExternalLink size={13} aria-hidden="true" />{t("agentPortal.cashierNotifications.openRequest")}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    aria-label={t("agentPortal.cashierNotifications.delete")}
                    title={t("agentPortal.cashierNotifications.delete")}
                    disabled={busyIds.includes(notification.id)}
                    onClick={() => void deleteNotification(notification)}
                  >
                    {busyIds.includes(notification.id)
                      ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" />
                      : <Trash2 size={16} aria-hidden="true" />}
                  </button>
                </article>
              ))}
              {!notifications.length && <div className={styles.panelState}>{t("agentPortal.cashierNotifications.empty")}</div>}
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              className={styles.loadMore}
              disabled={isLoadingMore}
              onClick={() => void loadNotifications((page?.page ?? 1) + 1, true)}
            >
              {isLoadingMore ? <LoaderCircle size={15} className={styles.spinner} /> : <RefreshCw size={15} aria-hidden="true" />}
              {isLoadingMore ? t("agentPortal.cashierNotifications.loadingMore") : t("agentPortal.cashierNotifications.loadMore")}
            </button>
          )}
          {connectionState === "disconnected" && (
            <button type="button" className={styles.retryConnection} onClick={() => setConnectionRetry((retry) => retry + 1)}>
              <RefreshCw size={14} aria-hidden="true" />{t("agentPortal.cashierNotifications.retryConnection")}
            </button>
          )}
        </section>
      )}
    </div>
  );
};
