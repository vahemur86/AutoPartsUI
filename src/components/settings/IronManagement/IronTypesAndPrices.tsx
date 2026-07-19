import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { toast } from "react-toastify";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

// ui-kit
import {
  Button,
  ConfirmationModal,
  DataTable,
  IconButton,
  Modal,
  Select,
  TextField,
} from "@/ui-kit";
import type { AnchorRect } from "@/ui-kit";

// icons
import { Plus, RecycleIcon } from "lucide-react";

// utils
import {
  getApiErrorMessage,
  getCashRegisterId,
  mapI18nCodeToApiCode,
} from "@/utils";

// services
import { getVehicleDefinitions } from "@/services/settings/vehicles";

// components
import {
  IronTypeDropdown,
  type IronTypeForm,
} from "./ironTypeActions/IronTypeDropdown";
import {
  IronPriceDropdown,
  type IronPriceForm,
} from "./ironPriceActions/IronPriceDropdown";
import { AddRecalculationPriceDropdown } from "./ironPriceActions/AddRecalculationPriceDropdown";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createIronType,
  createIronPrice,
  createRecalculationPrice,
  fetchIronTypes,
  fetchIronTypesByCar,
  removeIronType,
  updateIronTypePricesBulk,
} from "@/store/slices/ironCarShopSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// styles
import styles from "./IronManagement.module.css";

/** One row in the flat table: iron type + price per customer type (or null = dash) */
export interface FlatIronTypeRow {
  ironTypeId: number;
  name: string;
  code?: string;
  prices: Record<number, number | null>;
}

export const IronTypesAndPrices: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { ironTypesByCar, isLoading } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { customerTypes } = useAppSelector((state) => state.customerTypes);
  const { languages } = useAppSelector((state) => state.languages);

  const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(
    null,
  );
  const [brandOptions, setBrandOptions] = useState<
    Array<{ id: number; code: string; name: string }>
  >([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [deletingIronType, setDeletingIronType] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [priceDropdownIronTypeId, setPriceDropdownIronTypeId] = useState<
    number | null
  >(null);
  const [isRecalculationDropdownOpen, setIsRecalculationDropdownOpen] =
    useState(false);
  const [recalculationIronTypeId, setRecalculationIronTypeId] = useState<
    number | null
  >(null);
  const [isMutating, setIsMutating] = useState(false);
  const [editingIronType, setEditingIronType] = useState<{
    ironTypeId: number;
    name: string;
    prices: Record<number, string>;
  } | null>(null);
  /** Captured at click when opening from table so dropdown positions correctly */
  const [priceAnchorRect, setPriceAnchorRect] = useState<AnchorRect | null>(
    null,
  );
  const [recalculationAnchorRect, setRecalculationAnchorRect] =
    useState<AnchorRect | null>(null);

  const typeAnchorRef = useRef<HTMLElement | null>(null);
  const priceAnchorRef = useRef<HTMLElement | null>(null);
  const recalculationAnchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    const loadBrands = async () => {
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      try {
        setIsLoadingBrands(true);
        const data = await getVehicleDefinitions(undefined, apiLang, cashRegisterId);
        const nextBrands = Array.isArray(data?.brands)
          ? data.brands.filter(
              (item): item is { id: number; code: string; name: string } =>
                Boolean(item?.id && item?.name),
            )
          : [];
        setBrandOptions(nextBrands);
        if (nextBrands.length > 0 && selectedCarModelId === null) {
          setSelectedCarModelId(nextBrands[0].id);
        } else if (nextBrands.length === 0) {
          setSelectedCarModelId(null);
        }
      } catch (error) {
        console.error("Failed to load vehicle definition brands:", error);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    void loadBrands();
    dispatch(fetchCustomerTypes());
    if (languages.length === 0) {
      dispatch(fetchLanguages());
    }
  }, [dispatch, cashRegisterId, languages.length]);

  useEffect(() => {
    if (selectedCarModelId) {
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      dispatch(
        fetchIronTypesByCar({
          carModelId: selectedCarModelId,
          cashRegisterId,
          lang: apiLang,
        }),
      );
      dispatch(
        fetchIronTypes({
          carModelId: selectedCarModelId,
          cashRegisterId,
          lang: apiLang,
        }),
      );
    }
  }, [dispatch, selectedCarModelId, cashRegisterId]);

  const handleCarModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const carModelId = Number(e.target.value);
      setSelectedCarModelId(carModelId || null);
      setEditingIronType(null);
    },
    [],
  );

  const handleOpenAddType = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!selectedCarModelId) {
        toast.error(t("ironManagement.error.selectCarModel"));
        return;
      }
      typeAnchorRef.current = e.currentTarget;
      setIsTypeDropdownOpen(true);
    },
    [selectedCarModelId, t],
  );

  const handleSaveIronType = useCallback(
    async (data: IronTypeForm) => {
      if (!selectedCarModelId) return;
      try {
        setIsMutating(true);
        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(
          createIronType({
            carModelId: selectedCarModelId,
            payload: data,
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
        toast.success(t("ironManagement.success.ironTypeCreated"));
        await dispatch(
          fetchIronTypesByCar({
            carModelId: selectedCarModelId,
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
        setIsTypeDropdownOpen(false);
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(
          error,
          t("ironManagement.error.failedToCreateIronType"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, selectedCarModelId, cashRegisterId, t],
  );

  const handleOpenAddPrice = useCallback(
    (e: React.MouseEvent<HTMLElement>, ironTypeId: number) => {
      const el = e.currentTarget;
      priceAnchorRef.current = el;
      const r = el.getBoundingClientRect();
      setPriceAnchorRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        right: r.right,
        bottom: r.bottom,
      });
      setPriceDropdownIronTypeId(ironTypeId);
      setIsPriceDropdownOpen(true);
    },
    [],
  );

  const handleOpenAddRecalculationPrice = useCallback(
    (e: React.MouseEvent<HTMLElement>, ironTypeId: number) => {
      const el = e.currentTarget;
      recalculationAnchorRef.current = el;
      const r = el.getBoundingClientRect();
      setRecalculationAnchorRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        right: r.right,
        bottom: r.bottom,
      });
      setRecalculationIronTypeId(ironTypeId);
      setIsRecalculationDropdownOpen(true);
    },
    [],
  );

  const handleSaveIronPrice = useCallback(
    async (data: IronPriceForm) => {
      if (!priceDropdownIronTypeId) return;
      try {
        setIsMutating(true);
        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(
          createIronPrice({
            ironTypeId: priceDropdownIronTypeId,
            payload: {
              id: 0,
              customerTypeId: data.customerTypeId,
              pricePerKg: data.pricePerKg,
            },
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
        toast.success(t("ironManagement.success.ironPriceCreated"));
        if (selectedCarModelId) {
          await dispatch(
            fetchIronTypesByCar({
              carModelId: selectedCarModelId,
              cashRegisterId,
              lang: apiLang,
            }),
          ).unwrap();
        }
        setIsPriceDropdownOpen(false);
        setPriceDropdownIronTypeId(null);
        setPriceAnchorRect(null);
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(
          error,
          t("ironManagement.error.failedToCreateIronPrice"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, priceDropdownIronTypeId, selectedCarModelId, cashRegisterId, t],
  );

  const handleSaveRecalculationPrice = useCallback(
    async (data: IronPriceForm) => {
      if (!recalculationIronTypeId) return;
      try {
        setIsMutating(true);
        await dispatch(
          createRecalculationPrice({
            payload: {
              ironTypeId: recalculationIronTypeId,
              customerTypeId: data.customerTypeId,
              pricePerKg: data.pricePerKg,
            },
            cashRegisterId,
          }),
        ).unwrap();
        toast.success(t("ironManagement.success.recalculationPriceCreated"));
        if (selectedCarModelId) {
          const apiLang = mapI18nCodeToApiCode(i18n.language);
          await dispatch(
            fetchIronTypesByCar({
              carModelId: selectedCarModelId,
              cashRegisterId,
              lang: apiLang,
            }),
          ).unwrap();
        }
        setIsRecalculationDropdownOpen(false);
        setRecalculationIronTypeId(null);
        setRecalculationAnchorRect(null);
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(
          error,
          t("ironManagement.error.failedToCreateRecalculationPrice"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, recalculationIronTypeId, selectedCarModelId, cashRegisterId, t],
  );

  const handleDeleteIronType = useCallback(async () => {
    console.log(
      "🚀 ~ IronTypesAndPrices ~ deletingIronType:",
      deletingIronType,
    );
    if (!deletingIronType) return;
    try {
      setIsMutating(true);
      await dispatch(removeIronType(deletingIronType.id)).unwrap();
      toast.success(t("ironManagement.success.ironTypeDeleted"));
      if (selectedCarModelId) {
        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(
          fetchIronTypesByCar({
            carModelId: selectedCarModelId,
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
      }
      setDeletingIronType(null);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        t("ironManagement.error.failedToDeleteIronType"),
      );
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [dispatch, deletingIronType, selectedCarModelId, cashRegisterId, t]);

  const flatRowHelper = createColumnHelper<FlatIronTypeRow>();

  /** Only customer types that have at least one price in the current data (no empty columns) */
  const customerTypesWithData = useMemo(() => {
    const idSet = new Set<number>();
    const order: number[] = [];
    ironTypesByCar.forEach((item) => {
      item.prices.forEach((p) => {
        if (!idSet.has(p.customerTypeId)) {
          idSet.add(p.customerTypeId);
          order.push(p.customerTypeId);
        }
      });
    });
    return order
      .map((id) => customerTypes.find((ct) => ct.id === id))
      .filter((ct): ct is NonNullable<typeof ct> => ct != null);
  }, [ironTypesByCar, customerTypes]);

  const handleOpenEditIronType = useCallback(
    (row: FlatIronTypeRow) => {
      setEditingIronType({
        ironTypeId: row.ironTypeId,
        name: row.name,
        prices: Object.fromEntries(
          customerTypesWithData.map((ct) => [
            ct.id,
            row.prices[ct.id] != null ? String(row.prices[ct.id]) : "",
          ]),
        ),
      });
    },
    [customerTypesWithData],
  );

  const handleEditingPriceChange = useCallback((customerTypeId: number, value: string) => {
    setEditingIronType((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        prices: {
          ...prev.prices,
          [customerTypeId]: value,
        },
      };
    });
  }, []);

  const handleSaveIronTypeEdit = useCallback(async () => {
    if (!selectedCarModelId || !editingIronType) return;

    const priceUpdates = Object.entries(editingIronType.prices).flatMap(
      ([customerTypeIdRaw, value]) => {
        if (value.trim() === "") return [];

        const customerTypeId = Number(customerTypeIdRaw);
        const pricePerKg = Number(value);

        if (!Number.isFinite(pricePerKg)) return [];

        return [{ ironTypeId: editingIronType.ironTypeId, customerTypeId, pricePerKg }];
      },
    );

    try {
      setIsMutating(true);
      const apiLang = mapI18nCodeToApiCode(i18n.language);

      if (priceUpdates.length > 0) {
        await dispatch(
          updateIronTypePricesBulk({
            payload: {
              carModelId: selectedCarModelId,
              priceUpdates,
            },
            cashRegisterId,
          }),
        ).unwrap();
      }

      if (priceUpdates.length > 0) {
        toast.success(t("ironManagement.success.ironPricesUpdated"));
      }
      await dispatch(
        fetchIronTypesByCar({
          carModelId: selectedCarModelId,
          cashRegisterId,
          lang: apiLang,
        }),
      ).unwrap();
      setEditingIronType(null);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        t("ironManagement.error.failedToUpdateIronPrices"),
      );
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [cashRegisterId, dispatch, editingIronType, ironTypesByCar, selectedCarModelId, t]);

  const flatColumns = useMemo((): ColumnDef<FlatIronTypeRow, unknown>[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<FlatIronTypeRow, any>[] = [
      flatRowHelper.display({
        id: "name",
        header: t("ironManagement.columns.name"),
        cell: ({ row }) => {
          return <span className={styles.readOnlyValue}>{row.original.name}</span>;
        },
      }),
      ...customerTypesWithData.map(
        (ct): ColumnDef<FlatIronTypeRow, unknown> =>
          flatRowHelper.display({
            id: `price_${ct.id}`,
            header: ct.code,
            cell: ({ row }) => {
              const currentValue = row.original.prices[ct.id];
              return (
                <span className={styles.readOnlyValue}>
                  {currentValue != null ? String(currentValue) : "—"}
                </span>
              );
            },
          }),
      ),
      flatRowHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
          return (
            <div className={styles.actionsCellWrapper}>
              <div className={styles.addButtonWrapper}>
                <IconButton
                  ariaLabel={t("common.edit")}
                  size="small"
                  variant="primary"
                  icon={<Plus size={12} color="#0e0f11" />}
                  onClick={() => handleOpenEditIronType(row.original)}
                />
                <span className={styles.addButtonText}>{t("common.edit")}</span>
              </div>
              <div className={styles.addButtonWrapper}>
                <IconButton
                  ariaLabel={t("ironManagement.addIronPrice")}
                  size="small"
                  variant="primary"
                  icon={<Plus size={12} color="#0e0f11" />}
                  onClick={(e) =>
                    handleOpenAddPrice(e, row.original.ironTypeId)
                  }
                />
                <span className={styles.addButtonText}>
                  {t("ironManagement.addPrice")}
                </span>
              </div>
              <div className={styles.addButtonWrapper}>
                <IconButton
                  ariaLabel={t("ironManagement.addRecalculationPrice")}
                  size="small"
                  variant="primary"
                  icon={<Plus size={12} color="#0e0f11" />}
                  onClick={(e) =>
                    handleOpenAddRecalculationPrice(e, row.original.ironTypeId)
                  }
                />
                <span className={styles.addButtonText}>
                  {t("ironManagement.addRecalculationPrice")}
                </span>
              </div>
              <div className={styles.addButtonWrapper}>
                <IconButton
                  ariaLabel={t("ironManagement.deleteIronType")}
                  size="small"
                  variant="primary"
                  icon={<RecycleIcon size={14} color="#0e0f11" />}
                  onClick={() =>
                    setDeletingIronType({
                      id: row.original.ironTypeId,
                      name: row.original.name,
                    })
                  }
                />
                <span className={styles.addButtonText}>
                  {t("ironManagement.confirmation.delete")}
                </span>
              </div>
            </div>
          );
        },
      }),
    ];
    return cols;
  }, [
    flatRowHelper,
    t,
    customerTypesWithData,
    handleOpenAddPrice,
    handleOpenAddRecalculationPrice,
    handleOpenEditIronType,
    isMutating,
  ]);

  const flatData = useMemo((): FlatIronTypeRow[] => {
    return ironTypesByCar.map((item) => ({
      ironTypeId: item.ironTypeId,
      name: item.name,
      code: item.code,
      prices: customerTypes.reduce<Record<number, number | null>>((acc, ct) => {
        acc[ct.id] =
          item.prices.find((p) => p.customerTypeId === ct.id)?.pricePerKg ??
          null;
        return acc;
      }, {}),
    }));
  }, [ironTypesByCar, customerTypes]);

  function renderTableContent() {
    if (!selectedCarModelId) return null;
    if (isLoading) {
      return (
        <div className={styles.tableWrapper}>
          <span>{t("ironManagement.loading")}</span>
        </div>
      );
    }
    if (flatData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <span>{t("ironManagement.noIronTypesForCarModel")}</span>
        </div>
      );
    }
    return (
      <div className={styles.tableWrapper}>
        <DataTable
          data={flatData}
          columns={flatColumns}
          pageSize={20}
          frozenConfig={{
            right: ["actions"],
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.ironTypesWrapper}>
      <div className={styles.selectWrapper}>
        <Select
          label={t("ironManagement.selectCarModel")}
          value={selectedCarModelId?.toString() || ""}
          onChange={handleCarModelChange}
          disabled={isLoading || isLoadingBrands || brandOptions.length === 0}
        >
          <option value="">{t("ironManagement.selectCarModel")}</option>
          {brandOptions.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name || brand.code}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div className={styles.addButtonWrapper}>
            <IconButton
              ariaLabel={t("ironManagement.addIronType")}
              size="small"
              variant="primary"
              icon={<Plus size={12} color="#0e0f11" />}
              onClick={handleOpenAddType}
              disabled={!selectedCarModelId || isLoading}
            />
            <span className={styles.addButtonText}>
              {t("ironManagement.addIronType")}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.addIronTypeButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("ironManagement.addIronType")}
            onClick={handleOpenAddType}
            disabled={!selectedCarModelId || isLoading}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addIronType")}
          </span>
        </div>
      </div>

      <IronTypeDropdown
        open={isTypeDropdownOpen}
        anchorRef={typeAnchorRef}
        isLoading={isMutating}
        onOpenChange={setIsTypeDropdownOpen}
        onSave={handleSaveIronType}
      />

      <IronPriceDropdown
        open={isPriceDropdownOpen}
        anchorRef={priceAnchorRef}
        anchorRect={priceAnchorRect}
        customerTypes={customerTypes}
        isLoading={isMutating}
        onOpenChange={(open) => {
          setIsPriceDropdownOpen(open);
          if (!open) {
            setPriceDropdownIronTypeId(null);
            setPriceAnchorRect(null);
          }
        }}
        onSave={handleSaveIronPrice}
      />

      <AddRecalculationPriceDropdown
        open={isRecalculationDropdownOpen}
        anchorRef={recalculationAnchorRef}
        anchorRect={recalculationAnchorRect}
        customerTypes={customerTypes}
        isLoading={isMutating}
        onOpenChange={(open) => {
          setIsRecalculationDropdownOpen(open);
          if (!open) {
            setRecalculationIronTypeId(null);
            setRecalculationAnchorRect(null);
          }
        }}
        onSave={handleSaveRecalculationPrice}
      />

      <Modal
        open={!!editingIronType}
        onOpenChange={(open) => {
          if (!open) setEditingIronType(null);
        }}
        title={t("common.edit")}
        width="560px"
      >
        {editingIronType && (
          <div className={styles.editModalContent}>
            <TextField
              label={t("ironManagement.columns.name")}
              value={editingIronType.name}
              onChange={(event) => {
                setEditingIronType((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    name: event.target.value,
                  };
                });
              }}
              disabled={isMutating}
            />

            <div className={styles.editModalGrid}>
              {customerTypesWithData.map((ct) => (
                <TextField
                  key={ct.id}
                  label={ct.code}
                  type="text"
                  inputMode="decimal"
                  value={editingIronType.prices[ct.id] ?? ""}
                  onChange={(event) =>
                    handleEditingPriceChange(ct.id, event.target.value)
                  }
                  disabled={isMutating}
                  placeholder="0"
                />
              ))}
            </div>

            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                size="medium"
                onClick={() => setEditingIronType(null)}
                disabled={isMutating}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSaveIronTypeEdit}
                disabled={isMutating}
              >
                {t("common.update")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {!!deletingIronType && (
        <ConfirmationModal
          open={!!deletingIronType}
          onOpenChange={(open) => !open && setDeletingIronType(null)}
          title={t("ironManagement.confirmation.deleteIronTypeTitle")}
          description={t(
            "ironManagement.confirmation.deleteIronTypeDescription",
            {
              name: deletingIronType?.name,
            },
          )}
          confirmText={
            isMutating
              ? t("ironManagement.confirmation.deleting")
              : t("common.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={handleDeleteIronType}
          onCancel={() => setDeletingIronType(null)}
        />
      )}

      {renderTableContent()}
    </div>
  );
};
