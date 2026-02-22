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
import { DataTable, IconButton, Select } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// utils
import {
  getApiErrorMessage,
  getCashRegisterId,
  mapI18nCodeToApiCode,
} from "@/utils";

// components
import {
  IronTypeDropdown,
  type IronTypeForm,
} from "./ironTypeActions/IronTypeDropdown";
import {
  IronPriceDropdown,
  type IronPriceForm,
} from "./ironPriceActions/IronPriceDropdown";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createIronType,
  createIronPrice,
  fetchCarModels,
  fetchIronTypes,
  fetchIronTypesByCar,
} from "@/store/slices/ironCarShopSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// styles
import styles from "./IronManagement.module.css";

/** One row in the flat table: iron type + price per customer type (or null = dash) */
export interface FlatIronTypeRow {
  ironTypeId: number;
  name: string;
  prices: Record<number, number | null>;
}

export const IronTypesAndPrices: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { carModels, ironTypesByCar, isLoading } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { customerTypes } = useAppSelector((state) => state.customerTypes);
  const { languages } = useAppSelector((state) => state.languages);

  const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(
    null,
  );
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [priceDropdownIronTypeId, setPriceDropdownIronTypeId] = useState<
    number | null
  >(null);
  const [isMutating, setIsMutating] = useState(false);

  const typeAnchorRef = useRef<HTMLElement | null>(null);
  const priceAnchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    const apiLang = mapI18nCodeToApiCode(i18n.language);
    dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));
    dispatch(fetchCustomerTypes());
    if (languages.length === 0) {
      dispatch(fetchLanguages());
    }
  }, [dispatch, cashRegisterId, languages.length, i18n.language]);

  useEffect(() => {
    if (carModels.length > 0 && selectedCarModelId === null) {
      setSelectedCarModelId(carModels[0].id);
    }
  }, [carModels, selectedCarModelId]);

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
  }, [dispatch, selectedCarModelId, cashRegisterId, i18n.language]);

  const handleCarModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const carModelId = Number(e.target.value);
      setSelectedCarModelId(carModelId || null);
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
      priceAnchorRef.current = e.currentTarget;
      setPriceDropdownIronTypeId(ironTypeId);
      setIsPriceDropdownOpen(true);
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

  const flatColumns = useMemo((): ColumnDef<FlatIronTypeRow, any>[] => {
    const cols: ColumnDef<FlatIronTypeRow, any>[] = [
      flatRowHelper.accessor("name", {
        header: t("ironManagement.columns.name"),
      }),
      ...customerTypesWithData.map(
        (ct): ColumnDef<FlatIronTypeRow, any> =>
          flatRowHelper.display({
            id: `price_${ct.id}`,
            header: ct.code,
            cell: ({ row }) => {
              const val = row.original.prices[ct.id];
              return val != null ? val.toLocaleString() : "—";
            },
          }),
      ),
      flatRowHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
          return (
            <div className={styles.addButtonWrapper}>
              <IconButton
                ariaLabel={t("ironManagement.addIronPrice")}
                size="small"
                variant="primary"
                icon={<Plus size={12} color="#0e0f11" />}
                onClick={(e) => handleOpenAddPrice(e, row.original.ironTypeId)}
              />
              <span className={styles.addButtonText}>
                {t("ironManagement.addPrice")}
              </span>
            </div>
          );
        },
      }),
    ];
    return cols;
  }, [customerTypesWithData, t, handleOpenAddPrice]);

  const flatData = useMemo((): FlatIronTypeRow[] => {
    return ironTypesByCar.map((item) => ({
      ironTypeId: item.ironTypeId,
      name: item.name,
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
          disabled={isLoading || carModels.length === 0}
        >
          <option value="">{t("ironManagement.selectCarModel")}</option>
          {carModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.header}>
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
        customerTypes={customerTypes}
        isLoading={isMutating}
        onOpenChange={(open) => {
          setIsPriceDropdownOpen(open);
          if (!open) setPriceDropdownIronTypeId(null);
        }}
        onSave={handleSaveIronPrice}
      />

      {renderTableContent()}
    </div>
  );
};
