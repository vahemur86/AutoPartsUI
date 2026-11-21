import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Ban, CircleX, Minus, PackageCheck, Plus, RefreshCw, Send, ShoppingBag, Trash2, Truck } from "lucide-react";

import { Button, ConfirmationModal, Select } from "@/ui-kit";
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import { getWarehouses } from "@/services/settings/warehouses";
import { powderPackagesService } from "@/services/powderPackages";
import type { Warehouse } from "@/types/settings";
import type {
  CreateIronPowderPackageRequest,
  CreatePowderPackageRequest,
  IronPowderPackageSourceBatch,
  PowderPackage,
  PowderPackageSourceBatch,
} from "@/types/powderPackages";
import styles from "./PowderPackages.module.css";

interface DraftPackage {
  clientId: string;
  sealNumber: string;
  powderKg: string;
}

type PackageSource = "catalyst" | "iron";

const milliKg = (value: number) => Math.round(value * 1000);
const validKg = (value: string) => /^\d+(?:[.,]\d{1,3})?$/.test(value.trim());
const valueAsMilliKg = (value: string) => {
  if (!validKg(value)) return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? milliKg(parsed) : 0;
};
const formatKg = (value: number) =>
  (milliKg(value) / 1000).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
const formatDate = (value: string) => new Date(value).toLocaleString();
const packageStatusLabel = (status: PowderPackage["status"], t: (key: string) => string) =>
  t(`warehouses.packages.statuses.${status}`);
const createDraft = (): DraftPackage => ({
  clientId: `${Date.now()}-${Math.random()}`,
  sealNumber: "",
  powderKg: "",
});

export const PowderPackages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [packageSource, setPackageSource] = useState<PackageSource>("catalyst");
  const [sourceBatches, setSourceBatches] = useState<PowderPackageSourceBatch[]>([]);
  const [ironSourceBatches, setIronSourceBatches] = useState<IronPowderPackageSourceBatch[]>([]);
  const [packages, setPackages] = useState<PowderPackage[]>([]);
  const [draftPackages, setDraftPackages] = useState<DraftPackage[]>([]);
  const [packageCount, setPackageCount] = useState("");
  const [batchId, setBatchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("1");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyPackageId, setBusyPackageId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    item: PowderPackage;
    action: "send" | "cancel" | "invalidate";
  } | null>(null);
  const [sendingAnimation, setSendingAnimation] = useState<PowderPackage | null>(null);
  const [loadError, setLoadError] = useState("");
  const warehouseIdRef = useRef(Number(warehouseId));
  const packageSourceRef = useRef(packageSource);
  const statusFilterRef = useRef(statusFilter);
  warehouseIdRef.current = Number(warehouseId);
  packageSourceRef.current = packageSource;
  statusFilterRef.current = statusFilter;

  const selectedBatch = packageSource === "catalyst"
    ? sourceBatches.find((batch) => String(batch.powderBatchId) === batchId)
    : undefined;
  const selectedIronBatch = packageSource === "iron"
    ? ironSourceBatches.find((batch) => String(batch.ironProcessingBatchId) === batchId)
    : undefined;
  const loadSourceBatches = useCallback(async (id: number, source: PackageSource = packageSourceRef.current) => {
    if (source === "iron") {
      const rows = (await powderPackagesService.listIronSourceBatches(id))
        .filter((batch) => batch.availablePowderKg > 0);
      if (warehouseIdRef.current === id && packageSourceRef.current === source) {
        setIronSourceBatches(rows);
        setBatchId((current) =>
          rows.some((batch) => String(batch.ironProcessingBatchId) === current)
            ? current
            : String(rows[0]?.ironProcessingBatchId ?? ""),
        );
      }
      return rows;
    }

    const rows = await powderPackagesService.listSourceBatches(id);
    if (warehouseIdRef.current === id && packageSourceRef.current === source) {
      setSourceBatches(rows);
      setBatchId((current) =>
        rows.some((batch) => String(batch.powderBatchId) === current)
          ? current
          : String(rows[0]?.powderBatchId ?? ""),
      );
    }
    return rows;
  }, []);

  const loadPackages = useCallback(async (id: number, selectedStatus: string) => {
    const rows = await powderPackagesService.list(id, selectedStatus ? Number(selectedStatus) : undefined);
    if (warehouseIdRef.current === id && statusFilterRef.current === selectedStatus) {
      setPackages(rows);
    }
    return rows;
  }, []);

  const reloadData = useCallback(async () => {
    const selectedWarehouse = Number(warehouseId);
    if (!selectedWarehouse) return;
    setLoadingData(true);
    setLoadError("");
    try {
      await Promise.all([
        loadSourceBatches(selectedWarehouse, packageSource),
        loadPackages(selectedWarehouse, statusFilter),
      ]);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, t("warehouses.packages.errors.load"));
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  }, [loadPackages, loadSourceBatches, packageSource, statusFilter, t, warehouseId]);

  useEffect(() => {
    let active = true;
    getWarehouses(cashRegisterId)
      .then((rows) => {
        if (!active) return;
        const warehouseRows = rows as Warehouse[];
        setWarehouses(warehouseRows);
        setWarehouseId(String(warehouseRows[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (active) {
          const message = getApiErrorMessage(error, t("warehouses.packages.errors.loadWarehouses"));
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoadingWarehouses(false);
      });
    return () => { active = false; };
  }, [cashRegisterId, t]);

  useEffect(() => {
    setDraftPackages([]);
    setPackageCount("");
    setSourceBatches([]);
    setIronSourceBatches([]);
    setBatchId("");
    if (!warehouseId) return;
    let active = true;
    setLoadingData(true);
    setLoadError("");
    loadSourceBatches(Number(warehouseId), packageSource)
      .catch((error: unknown) => {
        if (active) {
          const message = getApiErrorMessage(error, t("warehouses.packages.errors.load"));
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => { active = false; };
  }, [loadSourceBatches, packageSource, t, warehouseId]);

  useEffect(() => {
    setPackages([]);
  }, [warehouseId]);

  useEffect(() => {
    if (!warehouseId) return;
    loadPackages(Number(warehouseId), statusFilter).catch((error: unknown) => {
      const message = getApiErrorMessage(error, t("warehouses.packages.errors.load"));
      setLoadError(message);
      toast.error(message);
    });
  }, [loadPackages, statusFilter, t, warehouseId]);

  const availableKg = packageSource === "iron"
    ? selectedIronBatch?.availablePowderKg ?? 0
    : selectedBatch?.availablePowderKg ?? 0;
  const plannedMilliKg = useMemo(
    () => draftPackages.reduce((total, draft) => total + valueAsMilliKg(draft.powderKg), 0),
    [draftPackages],
  );
  const remainingMilliKg = Math.max(0, milliKg(availableKg) - plannedMilliKg);

  const changePackageCount = (value: string) => {
    setPackageCount(value);
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 1) return;
    setDraftPackages((current) => count <= current.length
      ? current.slice(0, count)
      : [...current, ...Array.from({ length: count - current.length }, createDraft)]);
  };

  const adjustPackageCount = (delta: number) => {
    const currentCount = Number(packageCount);
    const nextCount = Math.max(1, (Number.isSafeInteger(currentCount) ? currentCount : 0) + delta);
    changePackageCount(String(nextCount));
  };

  const changeDraft = (clientId: string, update: Partial<DraftPackage>) => {
    setDraftPackages((current) =>
      current.map((draft) => draft.clientId === clientId ? { ...draft, ...update } : draft),
    );
  };

  const setDraftWeight = (clientId: string, value: string) => {
    if (value.trim() === "") {
      changeDraft(clientId, { powderKg: value });
      return;
    }
    if (!validKg(value)) {
      changeDraft(clientId, { powderKg: value });
      return;
    }
    const incomingMilliKg = valueAsMilliKg(value);
    const otherMilliKg = draftPackages
      .filter((draft) => draft.clientId !== clientId)
      .reduce((total, draft) => total + valueAsMilliKg(draft.powderKg), 0);
    const maxMilliKg = Math.max(0, milliKg(availableKg) - otherMilliKg);
    if (incomingMilliKg > maxMilliKg) {
      toast.error(t("warehouses.packages.errors.overAvailableBatch", {
        remaining: formatKg(maxMilliKg / 1000),
      }));
      return;
    }
    changeDraft(clientId, { powderKg: value });
  };

  const removeDraft = (clientId: string) => {
    setDraftPackages((current) => {
      const next = current.filter((draft) => draft.clientId !== clientId);
      setPackageCount(String(next.length));
      return next;
    });
  };

  const saveDrafts = async () => {
    if (saving || !Number.isSafeInteger(Number(packageCount)) || Number(packageCount) < 1) {
      toast.error(t("warehouses.packages.errors.invalidCount"));
      return;
    }
    if (draftPackages.length !== Number(packageCount)) {
      toast.error(t("warehouses.packages.errors.invalidCount"));
      return;
    }
    const batchIdForRequest = packageSource === "iron"
      ? selectedIronBatch?.ironProcessingBatchId
      : selectedBatch?.powderBatchId;
    if (!batchIdForRequest) return;

    const requestPackages: CreatePowderPackageRequest["packages"] = [];
    const draftSeals = new Set<string>();
    for (const [index, draft] of draftPackages.entries()) {
      const sealNumber = draft.sealNumber.trim();
      if (
        !sealNumber ||
        sealNumber.length > 50 ||
        !validKg(draft.powderKg) ||
        valueAsMilliKg(draft.powderKg) <= 0
      ) {
        toast.error(t("warehouses.packages.errors.invalidDraft", { number: index + 1 }));
        return;
      }
      const key = sealNumber.toLowerCase();
      if (draftSeals.has(key)) {
        toast.error(t("warehouses.packages.errors.duplicateSeal", { seal: sealNumber }));
        return;
      }
      draftSeals.add(key);
      requestPackages.push({
        sealNumber,
        powderKg: valueAsMilliKg(draft.powderKg) / 1000,
      });
    }

    if (plannedMilliKg > milliKg(availableKg)) {
      toast.error(t("warehouses.packages.errors.overAvailableBatch", {
        remaining: formatKg(availableKg),
      }));
      return;
    }

    setSaving(true);
    try {
      const allPackages = await Promise.all(
        warehouses.map((warehouse) => powderPackagesService.list(warehouse.id)),
      );
      const existingSeals = new Set(
        allPackages.flat()
          .filter((item) => item.status !== 4)
          .map((item) => item.sealNumber.toLowerCase()),
      );
      const alreadyUsed = requestPackages.find((item) => existingSeals.has(item.sealNumber.toLowerCase()));
      if (alreadyUsed) {
        toast.error(t("warehouses.packages.errors.sealAlreadyUsed", { seal: alreadyUsed.sealNumber }));
        return;
      }

      const created = packageSource === "iron"
        ? await powderPackagesService.createIron({
          ironProcessingBatchId: batchIdForRequest,
          packages: requestPackages,
        } satisfies CreateIronPowderPackageRequest)
        : await powderPackagesService.create({
          powderBatchId: batchIdForRequest,
          packages: requestPackages,
        });

      setDraftPackages([]);
      setPackageCount("");
      setPackages((current) => statusFilter === "" || statusFilter === "1"
        ? [...created, ...current.filter((item) => !created.some((entry) => entry.id === item.id))]
        : current);
      toast.success(t("warehouses.packages.success.created"));
      try {
        await Promise.all([
          loadSourceBatches(Number(warehouseId), packageSource),
          loadPackages(Number(warehouseId), statusFilter),
        ]);
      } catch (refreshError: unknown) {
        toast.error(t("warehouses.packages.errors.createdRefreshFailed", {
          error: getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")),
        }));
      }
    } catch (error: unknown) {
      toast.error(t("warehouses.packages.errors.createFailed", {
        error: getApiErrorMessage(error, t("warehouses.packages.errors.create")),
      }));
      try {
        await loadSourceBatches(Number(warehouseId), packageSource);
      } catch (refreshError: unknown) {
        toast.error(getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")));
      }
    } finally {
      setSaving(false);
    }
  };

  const runPackageAction = async (
    item: PowderPackage,
    action: "send" | "cancel" | "invalidate",
  ) => {
    if (busyPackageId !== null) return;
    setPendingAction({ item, action });
  };

  const executePendingAction = async () => {
    if (!pendingAction || busyPackageId !== null) return;
    const { item, action } = pendingAction;
    setPendingAction(null);
    setBusyPackageId(item.id);
    if (action === "send") setSendingAnimation(item);
    const sourceToRefresh: PackageSource = item.sourceType === "Iron"
      ? "iron"
      : item.sourceType === "Catalyst"
        ? "catalyst"
        : packageSource;
    const refreshData = () => Promise.all([
      loadSourceBatches(Number(warehouseId), sourceToRefresh),
      loadPackages(Number(warehouseId), statusFilter),
    ]);
    try {
      let updated: PowderPackage;
      try {
        updated = action === "send"
          ? await powderPackagesService.sendToWarehouse(item.id)
          : action === "cancel"
            ? await powderPackagesService.cancel(item.id)
            : await powderPackagesService.invalidate(item.id);
      } catch (error: unknown) {
        if (action === "send") setSendingAnimation(null);
        toast.error(getApiErrorMessage(
          error,
          t(`warehouses.packages.errors.${action}`),
        ));
        try {
          await refreshData();
        } catch (refreshError: unknown) {
          toast.error(getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")));
        }
        return;
      }

      setPackages((current) => {
        const matchesFilter = !statusFilter || Number(statusFilter) === updated.status;
        if (!matchesFilter) return current.filter((entry) => entry.id !== updated.id);
        return [updated, ...current.filter((entry) => entry.id !== updated.id)];
      });
      toast.success(t(`warehouses.packages.success.${action === "send"
        ? "sent"
        : action === "cancel"
          ? "cancelled"
          : "invalidated"}`, {
        seal: item.sealNumber,
      }));
      try {
        await refreshData();
      } catch (refreshError: unknown) {
        toast.error(t("warehouses.packages.errors.actionRefreshFailed", {
          seal: item.sealNumber,
          error: getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")),
        }));
      }
    } finally {
      setBusyPackageId(null);
      if (action === "send") {
        window.setTimeout(() => {
          setSendingAnimation((current) =>
            current?.id === item.id ? null : current,
          );
          navigate("/warehouses/total-batches");
        }, 3500);
      }
    }
  };

  const changeWarehouse = (nextWarehouseId: string) => {
    if (
      draftPackages.length > 0 &&
      !window.confirm(t("warehouses.packages.discardDrafts"))
    ) return;
    setDraftPackages([]);
    setPackageCount("");
    setWarehouseId(nextWarehouseId);
  };

  const changePackageSource = (nextSource: PackageSource) => {
    if (nextSource === packageSource) return;
    if (
      draftPackages.length > 0 &&
      !window.confirm(t("warehouses.packages.discardDrafts"))
    ) return;
    setDraftPackages([]);
    setPackageCount("");
    setPackageSource(nextSource);
  };

  const changeBatch = (nextBatchId: string) => {
    if (nextBatchId !== batchId && draftPackages.length > 0) {
      if (!window.confirm(t("warehouses.packages.discardBatchDrafts"))) return;
      setDraftPackages([]);
      setPackageCount("");
    }
    setBatchId(nextBatchId);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("warehouses.packages.eyebrow")}</p>
          <h1>{t("warehouses.packages.title")}</h1>
          <p>{t("warehouses.packages.description")}</p>
        </div>
        <Button variant="secondary" onClick={() => void reloadData()} disabled={!warehouseId || loadingData}>
          <RefreshCw size={16} aria-hidden="true" />
          {t("warehouses.packages.refresh")}
        </Button>
      </header>

      <section className={styles.toolbar}>
        <Select
          label={t("warehouses.packages.packageSource")}
          value={packageSource}
          disabled={saving || busyPackageId !== null}
          onChange={(event) => {
            const nextSource = event.target.value;
            if (nextSource === "catalyst" || nextSource === "iron") {
              changePackageSource(nextSource);
            }
          }}
        >
          <option value="catalyst">{t("warehouses.packages.sources.catalyst")}</option>
          <option value="iron">{t("warehouses.packages.sources.iron")}</option>
        </Select>
        <Select
          label={t("warehouses.form.warehouse")}
          value={warehouseId}
          disabled={loadingWarehouses || warehouses.length === 0 || saving || busyPackageId !== null}
          onChange={(event) => changeWarehouse(event.target.value)}
        >
          <option value="">{t("warehouses.form.selectWarehouse")}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
          ))}
        </Select>
        <Select
          label={t("warehouses.packages.packageFilter")}
          value={statusFilter}
          disabled={saving || busyPackageId !== null}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t("warehouses.packages.filters.all")}</option>
          <option value="1">{t("warehouses.packages.statuses.1")}</option>
          <option value="2">{t("warehouses.packages.statuses.2")}</option>
          <option value="3">{t("warehouses.packages.statuses.3")}</option>
          <option value="4">{t("warehouses.packages.statuses.4")}</option>
        </Select>
      </section>

      {loadError && <p className={styles.error} role="alert">{loadError}</p>}

      {packageSource === "iron" && (selectedIronBatch ? (
        <section className={styles.batchPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>{t("warehouses.packages.ironSourceBatch", {
                id: selectedIronBatch.ironProcessingBatchId,
              })}</h2>
              <p>{formatDate(selectedIronBatch.createdAt)}</p>
            </div>
            <div className={styles.batchSelector}>
              <Select
                label={t("warehouses.packages.selectBatch")}
                value={batchId}
                onChange={(event) => changeBatch(event.target.value)}
              >
                {ironSourceBatches.map((batch) => (
                  <option key={batch.ironProcessingBatchId} value={batch.ironProcessingBatchId}>
                    #{batch.ironProcessingBatchId} · {formatKg(batch.availablePowderKg)} kg {t("warehouses.packages.available")}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className={styles.summary}>
            <div>
              <span>{t("warehouses.packages.totalPowder")}</span>
              <strong>{formatKg(selectedIronBatch.powderWeightKg)} kg</strong>
            </div>
            <div>
              <span>{t("warehouses.packages.allocated")}</span>
              <strong>{formatKg(selectedIronBatch.allocatedPowderKg)} kg</strong>
            </div>
            <div>
              <span>{t("warehouses.packages.available")}</span>
              <strong>{formatKg(selectedIronBatch.availablePowderKg)} kg</strong>
            </div>
          </div>

          <p className={styles.packageTotal}>
            {t("warehouses.packages.planSummary", {
              planned: formatKg(plannedMilliKg / 1000),
              available: formatKg(selectedIronBatch.availablePowderKg),
              remaining: formatKg(remainingMilliKg / 1000),
            })}
          </p>

          <div className={styles.creationControls}>
            <label className={`${styles.fieldLabel} ${styles.countField}`}>
              {t("warehouses.packages.packageCount")}
              <div className={styles.packageCountControl}>
                <button
                  type="button"
                  aria-label={t("warehouses.packages.decreasePackageCount")}
                  onClick={() => adjustPackageCount(-1)}
                  disabled={saving || loadingData || Number(packageCount) <= 1}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={packageCount}
                  onChange={(event) => changePackageCount(event.target.value)}
                  disabled={saving || loadingData}
                />
                <button
                  type="button"
                  aria-label={t("warehouses.packages.increasePackageCount")}
                  onClick={() => adjustPackageCount(1)}
                  disabled={saving || loadingData}
                >
                  <Plus size={14} />
                </button>
              </div>
            </label>
            <div className={styles.createAction}>
              <Button onClick={() => void saveDrafts()} disabled={saving || draftPackages.length === 0}>
                {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <p className={styles.emptyState}>
          {loadingWarehouses || loadingData
            ? t("warehouses.packages.loading")
            : ironSourceBatches.length === 0
              ? t("warehouses.packages.noIronSourceBatches")
              : t("warehouses.packages.noBatchSelected")}
        </p>
      ))}

      {packageSource === "catalyst" && (selectedBatch ? (
        <section className={styles.batchPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>{t("warehouses.packages.sourceBatch", { id: selectedBatch.powderBatchId })}</h2>
              <p>{t("warehouses.packages.sessionCreated", {
                session: selectedBatch.sessionId,
                date: formatDate(selectedBatch.createdAt),
              })}</p>
            </div>
            <div className={styles.batchSelector}>
              <Select
                label={t("warehouses.packages.selectBatch")}
                value={batchId}
                onChange={(event) => changeBatch(event.target.value)}
              >
                {sourceBatches.map((batch) => (
                  <option key={batch.powderBatchId} value={batch.powderBatchId}>
                    #{batch.powderBatchId} · {formatKg(batch.availablePowderKg)} kg {t("warehouses.packages.available")}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className={styles.summary}>
            <div>
              <span>{t("warehouses.packages.totalPowder")}</span>
              <strong>{formatKg(selectedBatch.totalPowderKg)} kg</strong>
            </div>
            <div>
              <span>{t("warehouses.packages.available")}</span>
              <strong>{formatKg(selectedBatch.availablePowderKg)} kg</strong>
            </div>
          </div>

          <p className={styles.packageTotal}>
            {t("warehouses.packages.planSummary", {
              planned: formatKg(plannedMilliKg / 1000),
              available: formatKg(selectedBatch.availablePowderKg),
              remaining: formatKg(remainingMilliKg / 1000),
            })}
          </p>

          <div className={styles.creationControls}>
            <label className={`${styles.fieldLabel} ${styles.countField}`}>
              {t("warehouses.packages.packageCount")}
              <div className={styles.packageCountControl}>
                <button
                  type="button"
                  aria-label={t("warehouses.packages.decreasePackageCount")}
                  onClick={() => adjustPackageCount(-1)}
                  disabled={saving || loadingData || Number(packageCount) <= 1}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={packageCount}
                  onChange={(event) => changePackageCount(event.target.value)}
                  disabled={saving || loadingData}
                />
                <button
                  type="button"
                  aria-label={t("warehouses.packages.increasePackageCount")}
                  onClick={() => adjustPackageCount(1)}
                  disabled={saving || loadingData}
                >
                  <Plus size={14} />
                </button>
              </div>
            </label>
            <div className={styles.createAction}>
              <Button onClick={() => void saveDrafts()} disabled={saving || draftPackages.length === 0}>
                {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <p className={styles.emptyState}>
          {loadingWarehouses || loadingData
            ? t("warehouses.packages.loading")
            : sourceBatches.length === 0
              ? t("warehouses.packages.noSourceBatches")
              : t("warehouses.packages.noBatchSelected")}
        </p>
      ))}

      {draftPackages.length > 0 && (
        <section className={styles.drafts}>
          <h2>{t("warehouses.packages.draftTitle", { count: draftPackages.length })}</h2>
          <p className={styles.packageTotal}>
            {t("warehouses.packages.planSummary", {
              planned: formatKg(plannedMilliKg / 1000),
              available: formatKg(availableKg),
              remaining: formatKg(remainingMilliKg / 1000),
            })}
          </p>
          <div className={styles.draftGrid}>
            {draftPackages.map((draft, index) => {
              const weightValid = validKg(draft.powderKg) && valueAsMilliKg(draft.powderKg) > 0;
              return (
                <article className={styles.draftCard} key={draft.clientId}>
                  <div className={styles.draftHeading}>
                    <h3>
                      <span className={styles.packageIcon}>
                        <ShoppingBag size={18} aria-hidden="true" />
                      </span>
                      <span>
                        <small>{t("warehouses.packages.packageLabel")}</small>
                        <strong>#{index + 1}</strong>
                      </span>
                    </h3>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={t("warehouses.packages.removeDraft")}
                      title={t("warehouses.packages.removeDraft")}
                      disabled={saving}
                      onClick={() => removeDraft(draft.clientId)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className={styles.draftFields}>
                    <label className={styles.fieldLabel}>
                      {t("warehouses.packages.sealNumber")}
                      <input
                        value={draft.sealNumber}
                        maxLength={50}
                        onChange={(event) => changeDraft(draft.clientId, { sealNumber: event.target.value })}
                        placeholder={t("warehouses.packages.sealPlaceholder")}
                        disabled={saving}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      {t("warehouses.packages.packageWeight")}
                      <span className={styles.weightInput}>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={draft.powderKg}
                          aria-label={t("warehouses.packages.packageWeight")}
                          onChange={(event) => setDraftWeight(draft.clientId, event.target.value)}
                          disabled={saving}
                        />
                        <span>kg</span>
                      </span>
                    </label>
                  </div>
                  {!weightValid && draft.powderKg && (
                    <small className={styles.error}>
                      {t("warehouses.packages.errors.invalidWeight")}
                    </small>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.savedPackages}>
        <div className={styles.sectionHeading}>
          <h2>{t("warehouses.packages.savedTitle")}</h2>
          {loadingData && <span className={styles.loading}>{t("warehouses.packages.loading")}</span>}
        </div>
        {packages.length === 0 && !loadingData ? (
          <p className={styles.emptyState}>{t("warehouses.packages.noPackages")}</p>
        ) : (
          <div className={styles.packageList}>
            {packages.map((item) => {
              const sourceLabel = item.sourceType === "Iron"
                ? t("warehouses.packages.sources.iron")
                : item.sourceType === "Catalyst"
                  ? t("warehouses.packages.sources.catalyst")
                  : t("warehouses.packages.sources.unknown");
              const sourceBatchLabel = item.sourceType === "Iron" && item.ironProcessingBatchId != null
                ? t("warehouses.packages.ironSourceBatch", { id: item.ironProcessingBatchId })
                : item.sourceType === "Catalyst" && item.powderBatchId != null
                  ? t("warehouses.packages.sourceBatch", { id: item.powderBatchId })
                  : sourceLabel;
              return (
                <article className={styles.packageCard} key={item.id}>
                  <div className={styles.savedPackageHeading}>
                    <div>
                      <h3>{t("warehouses.packages.savedPackage", { seal: item.sealNumber })}</h3>
                      <p>{sourceLabel} · {sourceBatchLabel} · {formatDate(item.createdAt)}</p>
                    </div>
                    <span className={`${styles.status} ${styles[`status${item.status}`]}`}>
                      {packageStatusLabel(item.status, t)}
                    </span>
                  </div>
                  <strong className={styles.savedWeight}>{formatKg(item.totalPowderKg)} kg</strong>
                  {item.items.length > 0 && (
                    <ul className={styles.composition}>
                      {item.items.map((source) => (
                        <li key={`${item.id}-${source.powderBatchItemId}`}>
                          #{source.intakeId} · {source.supplierClientName}: {formatKg(source.powderKg)} kg
                        </li>
                      ))}
                    </ul>
                  )}
                  {(item.status === 1 || item.status === 3) && (
                    <div className={styles.packageActions}>
                      {item.status === 1 && (
                        <>
                          <Button
                            size="small"
                            onClick={() => void runPackageAction(item, "send")}
                            disabled={busyPackageId !== null}
                          >
                            <Send size={14} aria-hidden="true" />
                            {busyPackageId === item.id ? t("warehouses.packages.sending") : t("warehouses.packages.send")}
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            className={styles.cancelPackageButton}
                            onClick={() => void runPackageAction(item, "cancel")}
                            disabled={busyPackageId !== null}
                          >
                            <CircleX size={14} aria-hidden="true" />
                            {t("warehouses.packages.cancel")}
                          </Button>
                        </>
                      )}
                      <Button
                        size="small"
                        variant="secondary"
                        className={styles.invalidatePackageButton}
                        onClick={() => void runPackageAction(item, "invalidate")}
                        disabled={busyPackageId !== null}
                      >
                        <Ban size={14} aria-hidden="true" />
                        {t("warehouses.packages.invalidate")}
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingAction && (
        <ConfirmationModal
          open
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={
            pendingAction.action === "send"
              ? t("warehouses.packages.confirmSendTitle")
              : pendingAction.action === "cancel"
                ? t("warehouses.packages.confirmCancelTitle")
                : t("warehouses.packages.confirmInvalidateTitle")
          }
          description={
            pendingAction.action === "send"
              ? t("warehouses.packages.confirmSend", {
                  seal: pendingAction.item.sealNumber,
                  weight: formatKg(pendingAction.item.totalPowderKg),
                })
              : pendingAction.action === "cancel"
                ? t("warehouses.packages.confirmCancel", {
                    seal: pendingAction.item.sealNumber,
                    weight: formatKg(pendingAction.item.totalPowderKg),
                  })
                : t("warehouses.packages.confirmInvalidate", {
                    seal: pendingAction.item.sealNumber,
                    weight: formatKg(pendingAction.item.totalPowderKg),
                  })
          }
          confirmText={
            pendingAction.action === "send"
              ? t("warehouses.packages.send")
              : pendingAction.action === "cancel"
                ? t("warehouses.packages.cancel")
                : t("warehouses.packages.invalidate")
          }
          cancelText={t("common.cancel")}
          confirmVariant={pendingAction.action === "invalidate" ? "secondary" : "danger"}
          confirmLoading={busyPackageId === pendingAction.item.id}
          confirmIcon={
            pendingAction.action === "send"
              ? <Send size={16} aria-hidden="true" />
              : pendingAction.action === "cancel"
                ? <CircleX size={16} aria-hidden="true" />
                : <Ban size={16} aria-hidden="true" />
          }
          onConfirm={() => void executePendingAction()}
        >
          {pendingAction.action === "cancel" && (
            <div className={`${styles.confirmVisual} ${styles.cancelConfirmVisual}`} aria-hidden="true">
              <CircleX size={28} />
            </div>
          )}
          {pendingAction.action === "invalidate" && (
            <div className={styles.confirmVisual} aria-hidden="true">
              <Ban size={28} />
            </div>
          )}
          {pendingAction.action === "send" && (
            <div className={styles.confirmVisual} aria-hidden="true">
              <PackageCheck size={28} />
            </div>
          )}
        </ConfirmationModal>
      )}

      {sendingAnimation && (
        <div className={styles.sendOverlay} role="status" aria-live="polite">
          <div className={styles.warehouseScene}>
            <div className={styles.routeLine} />
            <div className={styles.loadedTruck}>
              <div className={styles.truckCargo}>
                <ShoppingBag size={24} aria-hidden="true" />
                <span>{formatKg(sendingAnimation.totalPowderKg)} kg</span>
              </div>
              <Truck size={104} strokeWidth={1.45} aria-hidden="true" />
            </div>
            <div className={styles.warehouseIcon}>
              <div className={styles.warehouseRoof} />
              <div className={styles.warehouseDoor} />
            </div>
            <div className={styles.sendCaption}>
              <strong>{t("warehouses.packages.sendAnimationTitle")}</strong>
              <span>{t("warehouses.packages.savedPackage", { seal: sendingAnimation.sealNumber })}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
