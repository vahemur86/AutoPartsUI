import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Plus, RefreshCw, Send, Sparkles, Trash2 } from "lucide-react";

import { Button, Select } from "@/ui-kit";
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
  PowderPackageSourceItem,
} from "@/types/powderPackages";
import styles from "./PowderPackages.module.css";

interface DraftPackage {
  clientId: string;
  powderBatchId: number;
  sealNumber: string;
  itemWeights: Record<number, string>;
}

interface IronDraftPackage {
  clientId: string;
  ironProcessingBatchId: number;
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
const formatAmd = (value: number) => value.toLocaleString(undefined, {
  maximumFractionDigits: 2,
});
const formatDate = (value: string) => new Date(value).toLocaleString();
const packageStatusLabel = (status: PowderPackage["status"], t: (key: string) => string) =>
  t(`warehouses.packages.statuses.${status}`);

const getMixError = (
  item: PowderPackageSourceItem,
  selectedItems: PowderPackageSourceItem[],
  t: (key: string) => string,
) => {
  if (selectedItems.length === 0) return "";
  const selectedSpecial = selectedItems[0].isSpecialCustomerLot;
  if (selectedSpecial !== item.isSpecialCustomerLot) {
    return t("warehouses.packages.mixingNotAllowed");
  }
  if (
    item.isSpecialCustomerLot &&
    selectedItems.some((selected) => selected.specialCustomerId !== item.specialCustomerId)
  ) {
    return t("warehouses.packages.differentSpecialCustomers");
  }
  return "";
};

export const PowderPackages = () => {
  const { t } = useTranslation();
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [packageSource, setPackageSource] = useState<PackageSource>("catalyst");
  const [sourceBatches, setSourceBatches] = useState<PowderPackageSourceBatch[]>([]);
  const [ironSourceBatches, setIronSourceBatches] = useState<IronPowderPackageSourceBatch[]>([]);
  const [packages, setPackages] = useState<PowderPackage[]>([]);
  const [draftPackages, setDraftPackages] = useState<DraftPackage[]>([]);
  const [ironDraftPackages, setIronDraftPackages] = useState<IronDraftPackage[]>([]);
  const [batchId, setBatchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("1");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyPackageId, setBusyPackageId] = useState<number | null>(null);
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
  const batchesById = useMemo(
    () => new Map(sourceBatches.map((batch) => [batch.powderBatchId, batch])),
    [sourceBatches],
  );

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
    setIronDraftPackages([]);
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

  const allocatedByItem = useMemo(() => {
    const allocations = new Map<number, number>();
    for (const draft of draftPackages) {
      for (const [rawItemId, rawWeight] of Object.entries(draft.itemWeights)) {
        const itemId = Number(rawItemId);
        allocations.set(itemId, (allocations.get(itemId) ?? 0) + valueAsMilliKg(rawWeight));
      }
    }
    return allocations;
  }, [draftPackages]);

  const plannedKg = useMemo(() => (
    draftPackages
      .filter((draft) => draft.powderBatchId === selectedBatch?.powderBatchId)
      .reduce(
        (total, draft) => total + Object.values(draft.itemWeights).reduce(
          (sum, value) => sum + valueAsMilliKg(value),
          0,
        ),
        0,
      ) / 1000
  ), [draftPackages, selectedBatch?.powderBatchId]);

  const plannedIronMilliKg = useMemo(
    () =>
      ironDraftPackages
        .filter((draft) => draft.ironProcessingBatchId === selectedIronBatch?.ironProcessingBatchId)
        .reduce((total, draft) => total + valueAsMilliKg(draft.powderKg), 0),
    [ironDraftPackages, selectedIronBatch?.ironProcessingBatchId],
  );

  const addDraft = () => {
    if (!selectedBatch) return;
    setDraftPackages((current) => [
      ...current,
      {
        clientId: `${Date.now()}-${Math.random()}`,
        powderBatchId: selectedBatch.powderBatchId,
        sealNumber: "",
        itemWeights: {},
      },
    ]);
  };

  const changeDraft = (clientId: string, update: Partial<DraftPackage>) => {
    setDraftPackages((current) =>
      current.map((draft) => draft.clientId === clientId ? { ...draft, ...update } : draft),
    );
  };

  const setDraftWeight = (
    draft: DraftPackage,
    item: PowderPackageSourceItem,
    value: string,
  ) => {
    const batch = batchesById.get(draft.powderBatchId);
    if (!batch) return;
    const selectedItems = batch.items.filter((candidate) =>
      candidate.powderBatchItemId !== item.powderBatchItemId &&
      valueAsMilliKg(draft.itemWeights[candidate.powderBatchItemId] ?? "") > 0,
    );
    if (valueAsMilliKg(value) > 0) {
      const mixError = getMixError(item, selectedItems, t);
      if (mixError) {
        toast.error(mixError);
        return;
      }
      const otherDraftAllocation = draftPackages.reduce((total, otherDraft) => {
        if (otherDraft.clientId === draft.clientId) return total;
        return total + valueAsMilliKg(otherDraft.itemWeights[item.powderBatchItemId] ?? "");
      }, 0);
      const maxMilliKg = milliKg(item.availablePowderKg) - otherDraftAllocation;
      if (valueAsMilliKg(value) > Math.max(0, maxMilliKg)) {
        toast.error(t("warehouses.packages.errors.overAvailable", {
          item: item.powderBatchItemId,
          remaining: formatKg(Math.max(0, maxMilliKg) / 1000),
        }));
        return;
      }
    }
    changeDraft(draft.clientId, {
      itemWeights: { ...draft.itemWeights, [item.powderBatchItemId]: value },
    });
  };

  const addIronDraft = () => {
    if (!selectedIronBatch) return;
    setIronDraftPackages((current) => [
      ...current,
      {
        clientId: `${Date.now()}-${Math.random()}`,
        ironProcessingBatchId: selectedIronBatch.ironProcessingBatchId,
        sealNumber: "",
        powderKg: "",
      },
    ]);
  };

  const changeIronDraft = (clientId: string, update: Partial<IronDraftPackage>) => {
    setIronDraftPackages((current) =>
      current.map((draft) => draft.clientId === clientId ? { ...draft, ...update } : draft),
    );
  };

  const setIronDraftWeight = (draft: IronDraftPackage, value: string) => {
    const batch = ironSourceBatches.find(
      (candidate) => candidate.ironProcessingBatchId === draft.ironProcessingBatchId,
    );
    if (!batch || value.trim() === "" || !validKg(value)) {
      changeIronDraft(draft.clientId, { powderKg: value });
      return;
    }

    const otherDraftWeight = ironDraftPackages
      .filter((candidate) =>
        candidate.clientId !== draft.clientId &&
        candidate.ironProcessingBatchId === draft.ironProcessingBatchId,
      )
      .reduce((total, candidate) => total + valueAsMilliKg(candidate.powderKg), 0);
    const remainingMilliKg = Math.max(0, milliKg(batch.availablePowderKg) - otherDraftWeight);
    if (valueAsMilliKg(value) > remainingMilliKg) {
      toast.error(t("warehouses.packages.errors.overAvailableBatch", {
        remaining: formatKg(remainingMilliKg / 1000),
      }));
      return;
    }

    changeIronDraft(draft.clientId, { powderKg: value });
  };

  const draftRequest = (draft: DraftPackage): CreatePowderPackageRequest | null => {
    const sealNumber = draft.sealNumber.trim();
    const itemEntries = Object.entries(draft.itemWeights)
      .filter(([, value]) => value.trim() !== "")
      .map(([itemId, value]) => ({ itemId: Number(itemId), value: value.trim() }));
    if (!sealNumber || sealNumber.length > 50 || itemEntries.length === 0) return null;
    if (itemEntries.some(({ value }) => !validKg(value) || valueAsMilliKg(value) <= 0)) return null;
    return {
      powderBatchId: draft.powderBatchId,
      sealNumber,
      items: itemEntries.map(({ itemId, value }) => ({
        powderBatchItemId: itemId,
        powderKg: valueAsMilliKg(value) / 1000,
      })),
    };
  };

  const ironDraftRequest = (draft: IronDraftPackage): CreateIronPowderPackageRequest | null => {
    const sealNumber = draft.sealNumber.trim();
    if (
      !sealNumber ||
      sealNumber.length > 50 ||
      !validKg(draft.powderKg) ||
      valueAsMilliKg(draft.powderKg) <= 0
    ) return null;
    return {
      ironProcessingBatchId: draft.ironProcessingBatchId,
      sealNumber,
      powderKg: valueAsMilliKg(draft.powderKg) / 1000,
    };
  };

  const saveDrafts = async () => {
    if (saving || draftPackages.length === 0) return;
    const duplicateSeals = new Set<string>();
    for (const draft of draftPackages) {
      const key = draft.sealNumber.trim().toLocaleLowerCase();
      if (!draftRequest(draft)) {
        toast.error(t("warehouses.packages.errors.invalidDraft", { number: draftPackages.indexOf(draft) + 1 }));
        return;
      }
      if (duplicateSeals.has(key)) {
        toast.error(t("warehouses.packages.errors.duplicateSeal", { seal: draft.sealNumber.trim() }));
        return;
      }
      duplicateSeals.add(key);
    }

    setSaving(true);
    try {
      for (const draft of draftPackages) {
        const payload = draftRequest(draft);
        if (!payload) break;
        try {
          const created = await powderPackagesService.create(payload);
          setDraftPackages((current) => current.filter((entry) => entry.clientId !== draft.clientId));
          setPackages((current) =>
            statusFilter === "" || statusFilter === "1" ? [created, ...current] : current,
          );
          try {
            await Promise.all([
              loadSourceBatches(Number(warehouseId)),
              loadPackages(Number(warehouseId), statusFilter),
            ]);
          } catch (refreshError: unknown) {
            toast.error(t("warehouses.packages.errors.createdRefreshFailed", {
              seal: payload.sealNumber,
              error: getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")),
            }));
            return;
          }
        } catch (error: unknown) {
          toast.error(t("warehouses.packages.errors.createFailed", {
            seal: payload.sealNumber,
            error: getApiErrorMessage(error, t("warehouses.packages.errors.create")),
          }));
          try {
            await Promise.all([
              loadSourceBatches(Number(warehouseId)),
              loadPackages(Number(warehouseId), statusFilter),
            ]);
          } catch (refreshError: unknown) {
            toast.error(getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")));
          }
          return;
        }
      }
      toast.success(t("warehouses.packages.success.created"));
    } finally {
      setSaving(false);
    }
  };

  const saveIronDrafts = async () => {
    if (saving || ironDraftPackages.length === 0 || !selectedIronBatch) return;

    const duplicateSeals = new Set<string>();
    const payloads: Array<{ draft: IronDraftPackage; payload: CreateIronPowderPackageRequest }> = [];
    for (const [index, draft] of ironDraftPackages.entries()) {
      const payload = ironDraftRequest(draft);
      if (!payload) {
        toast.error(t("warehouses.packages.errors.invalidIronDraft", { number: index + 1 }));
        return;
      }
      const key = payload.sealNumber.toLocaleLowerCase();
      if (duplicateSeals.has(key)) {
        toast.error(t("warehouses.packages.errors.duplicateSeal", { seal: payload.sealNumber }));
        return;
      }
      duplicateSeals.add(key);
      payloads.push({ draft, payload });
    }

    const plannedMilliKg = payloads.reduce(
      (total, entry) => total + milliKg(entry.payload.powderKg),
      0,
    );
    if (plannedMilliKg > milliKg(selectedIronBatch.availablePowderKg)) {
      toast.error(t("warehouses.packages.errors.overAvailableBatch", {
        remaining: formatKg(selectedIronBatch.availablePowderKg),
      }));
      return;
    }

    const packageSummary = payloads
      .map(({ payload }) => `${payload.sealNumber}: ${formatKg(payload.powderKg)} kg`)
      .join("\n");
    if (!window.confirm(t("warehouses.packages.confirmIronCreate", {
      batch: selectedIronBatch.ironProcessingBatchId,
      packages: packageSummary,
      total: formatKg(plannedMilliKg / 1000),
      available: formatKg(selectedIronBatch.availablePowderKg),
    }))) return;

    setSaving(true);
    try {
      for (const { draft, payload } of payloads) {
        try {
          const created = await powderPackagesService.createIron(payload);
          setIronDraftPackages((current) =>
            current.filter((entry) => entry.clientId !== draft.clientId),
          );
          setPackages((current) =>
            statusFilter === "" || statusFilter === "1" ? [created, ...current] : current,
          );
          try {
            await Promise.all([
              loadSourceBatches(Number(warehouseId), "iron"),
              loadPackages(Number(warehouseId), statusFilter),
            ]);
          } catch (refreshError: unknown) {
            toast.error(t("warehouses.packages.errors.createdRefreshFailed", {
              seal: payload.sealNumber,
              error: getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")),
            }));
            return;
          }
        } catch (error: unknown) {
          toast.error(t("warehouses.packages.errors.createFailed", {
            seal: payload.sealNumber,
            error: getApiErrorMessage(error, t("warehouses.packages.errors.create")),
          }));
          try {
            await Promise.all([
              loadSourceBatches(Number(warehouseId), "iron"),
              loadPackages(Number(warehouseId), statusFilter),
            ]);
          } catch (refreshError: unknown) {
            toast.error(getApiErrorMessage(refreshError, t("warehouses.packages.errors.refresh")));
          }
          return;
        }
      }
      toast.success(t("warehouses.packages.success.created"));
    } finally {
      setSaving(false);
    }
  };

  const runPackageAction = async (item: PowderPackage, action: "send" | "cancel") => {
    if (busyPackageId !== null) return;
    if (
      action === "cancel" &&
      !window.confirm(t("warehouses.packages.confirmCancel", {
        seal: item.sealNumber,
        weight: formatKg(item.totalPowderKg),
      }))
    ) return;
    setBusyPackageId(item.id);
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
          : await powderPackagesService.cancel(item.id);
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(
          error,
          t(`warehouses.packages.errors.${action === "send" ? "send" : "cancel"}`),
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
      toast.success(t(`warehouses.packages.success.${action === "send" ? "sent" : "cancelled"}`, {
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
    }
  };

  const removeDraft = (clientId: string) =>
    setDraftPackages((current) => current.filter((draft) => draft.clientId !== clientId));

  const removeIronDraft = (clientId: string) =>
    setIronDraftPackages((current) => current.filter((draft) => draft.clientId !== clientId));

  const changeWarehouse = (nextWarehouseId: string) => {
    if (
      (draftPackages.length > 0 || ironDraftPackages.length > 0) &&
      !window.confirm(t("warehouses.packages.discardDrafts"))
    ) return;
    setWarehouseId(nextWarehouseId);
  };

  const changePackageSource = (nextSource: PackageSource) => {
    if (nextSource === packageSource) return;
    if (
      (draftPackages.length > 0 || ironDraftPackages.length > 0) &&
      !window.confirm(t("warehouses.packages.discardDrafts"))
    ) return;
    setDraftPackages([]);
    setIronDraftPackages([]);
    setPackageSource(nextSource);
  };

  const changeBatch = (nextBatchId: string) => {
    const hasCurrentDrafts = packageSource === "iron"
      ? ironDraftPackages.length > 0
      : draftPackages.length > 0;
    if (nextBatchId !== batchId && hasCurrentDrafts) {
      if (!window.confirm(t("warehouses.packages.discardBatchDrafts"))) return;
      if (packageSource === "iron") setIronDraftPackages([]);
      else setDraftPackages([]);
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
              <p>{t("warehouses.packages.ironBatchCreated", {
                purchase: selectedIronBatch.ironPurchaseId,
                date: formatDate(selectedIronBatch.createdAt),
              })}</p>
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
              <span>{t("warehouses.packages.sourceWeight")}</span>
              <strong>{formatKg(selectedIronBatch.sourceWeightKg)} kg</strong>
            </div>
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

          <article className={styles.sourceItem}>
            <div>
              <strong>{t("warehouses.packages.ironComposition")}</strong>
              <span className={`${styles.badge} ${styles.generalBadge}`}>
                {t("warehouses.packages.ironPurchase", { id: selectedIronBatch.ironPurchaseId })}
              </span>
            </div>
            <div className={styles.sourceNumbers}>
              <span>Pt: {formatKg(selectedIronBatch.ptPerKg)} g/kg</span>
              <span>Pd: {formatKg(selectedIronBatch.pdPerKg)} g/kg</span>
              <span>Rh: {formatKg(selectedIronBatch.rhPerKg)} g/kg</span>
              <strong>{t("warehouses.packages.totalCost")}: {formatAmd(selectedIronBatch.totalCost)} AMD</strong>
            </div>
          </article>

          <p className={styles.packageTotal}>
            {t("warehouses.packages.planSummary", {
              planned: formatKg(plannedIronMilliKg / 1000),
              available: formatKg(selectedIronBatch.availablePowderKg),
              remaining: formatKg(Math.max(
                0,
                milliKg(selectedIronBatch.availablePowderKg) - plannedIronMilliKg,
              ) / 1000),
            })}
          </p>

          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={addIronDraft}
              disabled={loadingData || saving || selectedIronBatch.availablePowderKg <= 0}
            >
              <Plus size={16} aria-hidden="true" />
              {t("warehouses.packages.addPackage")}
            </Button>
            <Button
              onClick={() => void saveIronDrafts()}
              disabled={saving || ironDraftPackages.length === 0}
            >
              {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
            </Button>
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
            <div>
              <span>{t("warehouses.packages.planned")}</span>
              <strong>{formatKg(plannedKg)} / {formatKg(selectedBatch.availablePowderKg)} kg</strong>
            </div>
            <div>
              <span>{t("warehouses.packages.remaining")}</span>
              <strong>{formatKg(Math.max(0, selectedBatch.availablePowderKg -
                (draftPackages.filter((draft) => draft.powderBatchId === selectedBatch.powderBatchId)
                  .reduce((sum, draft) => sum + Object.values(draft.itemWeights).reduce(
                    (draftSum, value) => draftSum + valueAsMilliKg(value),
                    0,
                  ), 0) / 1000)))} kg</strong>
            </div>
          </div>

          <div className={styles.sourceList}>
            {selectedBatch.items.map((item) => {
              const remainingMilliKg = Math.max(
                0,
                milliKg(item.availablePowderKg) - (allocatedByItem.get(item.powderBatchItemId) ?? 0),
              );
              return (
                <article className={styles.sourceItem} key={item.powderBatchItemId}>
                  <div>
                    <strong>#{item.intakeId} · {item.supplierClientName}</strong>
                    {item.isSpecialCustomerLot ? (
                      <span className={`${styles.badge} ${styles.specialBadge}`}>
                        <Sparkles size={13} aria-hidden="true" />
                        {t("warehouses.packages.specialCustomer")}: {item.specialCustomerName ?? `#${item.specialCustomerId}`}
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.generalBadge}`}>
                        {t("warehouses.packages.generalPowder")}
                      </span>
                    )}
                  </div>
                  <div className={styles.sourceNumbers}>
                    <span>{t("warehouses.packages.initial")}: {formatKg(item.powderKg)} kg</span>
                    <span>{t("warehouses.packages.allocated")}: {formatKg(item.allocatedPowderKg)} kg</span>
                    <strong>{t("warehouses.packages.remaining")}: {formatKg(remainingMilliKg / 1000)} kg</strong>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={addDraft} disabled={loadingData || saving}>
              <Plus size={16} aria-hidden="true" />
              {t("warehouses.packages.addPackage")}
            </Button>
            <Button onClick={() => void saveDrafts()} disabled={saving || draftPackages.length === 0}>
              {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
            </Button>
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

      {packageSource === "iron" && ironDraftPackages.length > 0 && (
        <section className={styles.drafts}>
          <h2>{t("warehouses.packages.draftTitle", { count: ironDraftPackages.length })}</h2>
          <p className={styles.packageTotal}>
            {t("warehouses.packages.planSummary", {
              planned: formatKg(plannedIronMilliKg / 1000),
              available: formatKg(selectedIronBatch?.availablePowderKg ?? 0),
              remaining: formatKg(Math.max(
                0,
                milliKg(selectedIronBatch?.availablePowderKg ?? 0) - plannedIronMilliKg,
              ) / 1000),
            })}
          </p>
          <div className={styles.draftGrid}>
            {ironDraftPackages.map((draft, index) => {
              const batch = ironSourceBatches.find(
                (candidate) => candidate.ironProcessingBatchId === draft.ironProcessingBatchId,
              );
              if (!batch) return null;
              const otherDraftWeight = ironDraftPackages
                .filter((candidate) =>
                  candidate.clientId !== draft.clientId &&
                  candidate.ironProcessingBatchId === draft.ironProcessingBatchId,
                )
                .reduce((total, candidate) => total + valueAsMilliKg(candidate.powderKg), 0);
              const maxMilliKg = Math.max(0, milliKg(batch.availablePowderKg) - otherDraftWeight);
              const weightValid = validKg(draft.powderKg) && valueAsMilliKg(draft.powderKg) > 0;
              return (
                <article className={styles.draftCard} key={draft.clientId}>
                  <div className={styles.draftHeading}>
                    <h3>{t("warehouses.packages.packageNumber", { number: index + 1 })}</h3>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={t("warehouses.packages.removeDraft")}
                      title={t("warehouses.packages.removeDraft")}
                      disabled={saving}
                      onClick={() => removeIronDraft(draft.clientId)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <p className={styles.sectionHeading}>
                    {t("warehouses.packages.ironSourceBatch", { id: draft.ironProcessingBatchId })}
                  </p>
                  <label className={styles.fieldLabel}>
                    {t("warehouses.packages.sealNumber")}
                    <input
                      value={draft.sealNumber}
                      maxLength={50}
                      onChange={(event) =>
                        changeIronDraft(draft.clientId, { sealNumber: event.target.value })
                      }
                      placeholder={t("warehouses.packages.sealPlaceholder")}
                      disabled={saving}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    {t("warehouses.packages.ironPackageWeight")}
                    <span className={styles.weightInput}>
                      <input
                        type="number"
                        min="0.001"
                        max={maxMilliKg / 1000}
                        step="0.001"
                        value={draft.powderKg}
                        aria-label={t("warehouses.packages.ironPackageWeight")}
                        onChange={(event) => setIronDraftWeight(draft, event.target.value)}
                        disabled={saving}
                      />
                      <span>kg</span>
                    </span>
                  </label>
                  <small className={!weightValid && draft.powderKg ? styles.error : ""}>
                    {weightValid || !draft.powderKg
                      ? t("warehouses.packages.remainingForIronPackage", {
                        remaining: formatKg(maxMilliKg / 1000),
                      })
                      : t("warehouses.packages.errors.invalidIronWeight")}
                  </small>
                </article>
              );
            })}
          </div>
          <div className={styles.actions}>
            <Button
              onClick={() => void saveIronDrafts()}
              disabled={saving || ironDraftPackages.length === 0 || !selectedIronBatch}
            >
              {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
            </Button>
          </div>
        </section>
      )}

      {packageSource === "catalyst" && draftPackages.length > 0 && (
        <section className={styles.drafts}>
          <h2>{t("warehouses.packages.draftTitle", { count: draftPackages.length })}</h2>
          <div className={styles.draftGrid}>
            {draftPackages.map((draft, index) => {
              const batch = batchesById.get(draft.powderBatchId);
              if (!batch) return null;
              const packageTotal = Object.values(draft.itemWeights).reduce(
                (sum, value) => sum + valueAsMilliKg(value),
                0,
              );
              const selectedItems = batch.items.filter((item) =>
                valueAsMilliKg(draft.itemWeights[item.powderBatchItemId] ?? "") > 0,
              );
              return (
                <article className={styles.draftCard} key={draft.clientId}>
                  <div className={styles.draftHeading}>
                    <h3>{t("warehouses.packages.packageNumber", { number: index + 1 })}</h3>
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
                  <p className={styles.packageTotal}>
                    {t("warehouses.packages.packageTotal")}: <strong>{formatKg(packageTotal / 1000)} kg</strong>
                  </p>
                  <div className={styles.draftItems}>
                    {batch.items.map((item) => {
                      const mixError = getMixError(item, selectedItems.filter(
                        (selected) => selected.powderBatchItemId !== item.powderBatchItemId,
                      ), t);
                      const otherDraftAllocation = draftPackages.reduce((total, otherDraft) =>
                        otherDraft.clientId === draft.clientId
                          ? total
                          : total + valueAsMilliKg(otherDraft.itemWeights[item.powderBatchItemId] ?? ""),
                      0);
                      const maxMilliKg = Math.max(
                        0,
                        milliKg(item.availablePowderKg) - otherDraftAllocation,
                      );
                      return (
                        <div className={styles.draftItem} key={item.powderBatchItemId}>
                          <label className={styles.fieldLabel}>
                            <span>
                              #{item.intakeId} · {item.supplierClientName}
                              {item.isSpecialCustomerLot && (
                                <span className={styles.itemType}>{t("warehouses.packages.specialShort")}</span>
                              )}
                            </span>
                            <span className={styles.weightInput}>
                              <input
                                type="number"
                                min="0"
                                max={maxMilliKg / 1000}
                                step="0.001"
                                value={draft.itemWeights[item.powderBatchItemId] ?? ""}
                                aria-label={t("warehouses.packages.weightForIntake", { intake: item.intakeId })}
                                onChange={(event) => setDraftWeight(draft, item, event.target.value)}
                                disabled={saving || !!mixError}
                              />
                              <span>kg</span>
                            </span>
                          </label>
                          <small className={mixError ? styles.error : ""}>
                            {mixError || t("warehouses.packages.remainingForItem", {
                              remaining: formatKg(maxMilliKg / 1000),
                            })}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
          <div className={styles.actions}>
            <Button onClick={() => void saveDrafts()} disabled={saving || draftPackages.length === 0}>
              {saving ? t("warehouses.packages.saving") : t("warehouses.packages.createSelected")}
            </Button>
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
                  {item.status === 1 && (
                    <div className={styles.packageActions}>
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
                        onClick={() => void runPackageAction(item, "cancel")}
                        disabled={busyPackageId !== null}
                      >
                        {t("warehouses.packages.cancel")}
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
