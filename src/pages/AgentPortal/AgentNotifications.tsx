import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Bell, Check, CheckCheck, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { agentPortalService } from "@/services/agentPortal";
import type { AgentNotification, AgentNotificationPage } from "@/types/agentPortal";
import styles from "./AgentNotifications.module.css";

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

const getNotificationTitle = (notification: AgentNotification, t: (key: string) => string) => {
  if (
    notification.type === "ContractUpdated" &&
    notification.title.toLocaleLowerCase().includes("terms")
  ) {
    return t("agentPortal.notifications.types.contractTermsUpdated");
  }
  return t(`agentPortal.notifications.types.${notification.type}`);
};

const getNotificationMessage = (
  notification: AgentNotification,
  t: (key: string, options?: Record<string, string>) => string,
) => {
  const contractTermsUpdate = notification.type === "ContractUpdated"
    ? notification.message.match(/^The product-credit terms for contract (.+) have been updated\.$/i)
    : null;

  if (contractTermsUpdate) {
    return t("agentPortal.notifications.messages.contractTermsUpdated", {
      contractNumber: contractTermsUpdate[1],
    });
  }

  return notification.message;
};

interface AgentNotificationsProps {
  accessToken: string | null;
  onOpenNotification: (notification: AgentNotification) => void;
}

export const AgentNotifications = ({
  accessToken,
  onOpenNotification,
}: AgentNotificationsProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [page, setPage] = useState<AgentNotificationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");
  const panelRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());
  const liveNotificationsRef = useRef(new Map<string, AgentNotification>());

  const loadNotifications = useCallback(async (nextPage: number, append = false) => {
    if (append) setIsLoadingMore(true);
    else if (nextPage === 1) setIsLoading(true);
    setError("");
    try {
      const result = await agentPortalService.getNotifications(nextPage, PAGE_SIZE);
      result.results.forEach((notification) => seenIdsRef.current.add(notification.id));
      const resultIds = new Set(result.results.map((notification) => notification.id));
      const unlistedLiveNotifications = append
        ? []
        : [...liveNotificationsRef.current.values()].filter((item) => !resultIds.has(item.id));
      result.results.forEach((notification) => liveNotificationsRef.current.delete(notification.id));
      setPage({
        ...result,
        totalItems: result.totalItems + unlistedLiveNotifications.length,
        unreadCount: result.unreadCount + unlistedLiveNotifications.filter((item) => item.readAt === null).length,
      });
      setNotifications((current) => {
        const merged = append
          ? [...current, ...result.results.filter((item) => !current.some((existing) => existing.id === item.id))]
          : [...result.results, ...unlistedLiveNotifications];
        return merged
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
          .slice(0, append ? undefined : PAGE_SIZE);
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t("agentPortal.notifications.loadError");
      setError(message);
      if (!append) toast.error(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNotifications(1);
  }, [loadNotifications]);

  useEffect(() => {
    if (!accessToken) {
      setConnectionState("disconnected");
      return;
    }

    const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
    if (!configuredApiBase) {
      setConnectionState("disconnected");
      return;
    }
    const hubBase = configuredApiBase.endsWith("/api")
      ? configuredApiBase
      : `${configuredApiBase}/api`;
    const connection = new HubConnectionBuilder()
      .withUrl(`${hubBase}/hubs/agent-notifications`, {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("AgentNotificationCreated", (notification: AgentNotification) => {
      if (!notification?.id || seenIdsRef.current.has(notification.id)) return;
      seenIdsRef.current.add(notification.id);
      liveNotificationsRef.current.set(notification.id, notification);
      setNotifications((current) => [notification, ...current].slice(0, PAGE_SIZE));
      setPage((current) => current ? {
        ...current,
        page: 1,
        totalItems: current.totalItems + 1,
        unreadCount: current.unreadCount + (notification.readAt === null ? 1 : 0),
      } : current);
      toast.info(`${getNotificationTitle(notification, t)}: ${getNotificationMessage(notification, t)}`);
    });
    connection.onreconnecting(() => setConnectionState("reconnecting"));
    connection.onreconnected(() => {
      setConnectionState("connected");
      void loadNotifications(1);
    });
    connection.onclose(() => setConnectionState("disconnected"));

    let active = true;
    void connection.start()
      .then(() => {
        if (active) setConnectionState("connected");
      })
      .catch(() => {
        if (active) setConnectionState("disconnected");
      });

    return () => {
      active = false;
      void connection.stop();
    };
  }, [accessToken, loadNotifications, t]);

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

  const updateBusy = (id: string, busy: boolean) =>
    setBusyIds((current) => busy
      ? current.includes(id) ? current : [...current, id]
      : current.filter((item) => item !== id));

  const markRead = async (notification: AgentNotification) => {
    if (notification.readAt || busyIds.includes(notification.id)) return;
    updateBusy(notification.id, true);
    try {
      await agentPortalService.markNotificationAsRead(notification.id);
      liveNotificationsRef.current.set(notification.id, {
        ...notification,
        readAt: new Date().toISOString(),
      });
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
      ));
      setPage((current) => current ? { ...current, unreadCount: Math.max(0, current.unreadCount - 1) } : current);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : t("agentPortal.notifications.actionError");
      setError(message);
      toast.error(message);
    } finally {
      updateBusy(notification.id, false);
    }
  };

  const markAllRead = async () => {
    if (!page?.unreadCount || isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await agentPortalService.markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      liveNotificationsRef.current.forEach((notification, id) => {
        liveNotificationsRef.current.set(id, { ...notification, readAt: notification.readAt ?? readAt });
      });
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
      setPage((current) => current ? { ...current, unreadCount: 0 } : current);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : t("agentPortal.notifications.actionError");
      setError(message);
      toast.error(message);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const deleteNotification = async (notification: AgentNotification) => {
    if (busyIds.includes(notification.id)) return;
    updateBusy(notification.id, true);
    try {
      await agentPortalService.deleteNotification(notification.id);
      liveNotificationsRef.current.delete(notification.id);
      seenIdsRef.current.add(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setPage((current) => current ? {
        ...current,
        totalItems: Math.max(0, current.totalItems - 1),
        unreadCount: Math.max(0, current.unreadCount - (notification.readAt === null ? 1 : 0)),
      } : current);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : t("agentPortal.notifications.actionError");
      setError(message);
      toast.error(message);
    } finally {
      updateBusy(notification.id, false);
    }
  };

  const hasMore = Boolean(page && page.page * page.pageSize < page.totalItems);
  const connectionLabel = t(`agentPortal.notifications.connection.${connectionState}`);

  return (
    <div className={styles.notifications} ref={panelRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label={t("agentPortal.notifications.open", { count: page?.unreadCount ?? 0 })}
        aria-expanded={isOpen}
        aria-controls="agent-notifications-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={18} aria-hidden="true" />
        {(page?.unreadCount ?? 0) > 0 && <span className={styles.unreadBadge}>
          {page!.unreadCount > 99 ? "99+" : page!.unreadCount}
        </span>}
      </button>
      {isOpen && (
        <section className={styles.panel} id="agent-notifications-panel" aria-label={t("agentPortal.notifications.title")}>
          <header className={styles.panelHeader}>
            <div>
              <h2>{t("agentPortal.notifications.title")}</h2>
              <span className={styles.connectionState} data-state={connectionState}>
                <span aria-hidden="true" />{connectionLabel}
              </span>
            </div>
            <div className={styles.panelActions}>
              {Boolean(page?.unreadCount) && (
                <button
                  type="button"
                  className={styles.textAction}
                  disabled={isMarkingAllRead}
                  onClick={() => void markAllRead()}
                >
                  <CheckCheck size={14} aria-hidden="true" />{t("agentPortal.notifications.markAllRead")}
                </button>
              )}
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label={t("common.close")}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>
          {error && <div className={styles.panelError} role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void loadNotifications(1)}>{t("agentPortal.retry")}</button>
          </div>}
          {isLoading ? (
            <div className={styles.panelState} role="status"><LoaderCircle size={17} className={styles.spinner} />{t("agentPortal.notifications.loading")}</div>
          ) : notifications.length === 0 ? (
            <div className={styles.panelState}>{t("agentPortal.notifications.empty")}</div>
          ) : (
            <div className={styles.notificationList}>
              {notifications.map((notification) => {
                const busy = busyIds.includes(notification.id);
                const unread = notification.readAt === null;
                return (
                  <article className={`${styles.notification} ${unread ? styles.notificationUnread : ""}`} key={notification.id}>
                    <div className={styles.notificationCopy}>
                      <div className={styles.notificationHeading}>
                        <strong>{getNotificationTitle(notification, t)}</strong>
                        {unread && <span className={styles.unreadDot} aria-label={t("agentPortal.notifications.unread")} />}
                      </div>
                      <p>{getNotificationMessage(notification, t)}</p>
                      <time dateTime={notification.createdAt}>{formatTimestamp(notification.createdAt, i18n.resolvedLanguage || i18n.language)}</time>
                    </div>
                    <div className={styles.notificationActions}>
                      {(notification.relatedEntityId || notification.type.startsWith("Order")) && (
                        <button
                          type="button"
                          className={styles.iconAction}
                          onClick={() => {
                            onOpenNotification(notification);
                            setIsOpen(false);
                          }}
                          aria-label={t("agentPortal.notifications.openRelated")}
                          title={t("agentPortal.notifications.openRelated")}
                        >
                          <FileText size={15} aria-hidden="true" />
                        </button>
                      )}
                      {unread && <button
                        type="button"
                        className={styles.iconAction}
                        disabled={busy}
                        onClick={() => void markRead(notification)}
                        aria-label={t("agentPortal.notifications.markRead")}
                        title={t("agentPortal.notifications.markRead")}
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>}
                      <button
                        type="button"
                        className={`${styles.iconAction} ${styles.deleteAction}`}
                        disabled={busy}
                        onClick={() => void deleteNotification(notification)}
                        aria-label={t("agentPortal.notifications.delete")}
                        title={t("agentPortal.notifications.delete")}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              className={styles.loadMore}
              disabled={isLoadingMore}
              onClick={() => void loadNotifications((page?.page ?? 1) + 1, true)}
            >
              {isLoadingMore ? t("agentPortal.notifications.loadingMore") : t("agentPortal.notifications.loadMore")}
            </button>
          )}
        </section>
      )}
    </div>
  );
};
