import {
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

// ui-kit
import { IconButton, Select, DataTable } from "@/ui-kit";

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
  IronPriceDropdown,
  type IronPriceForm,
} from "./ironPriceActions/IronPriceDropdown";

// columns
import { getIronPriceColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createIronPrice,
  fetchCarModels,
  fetchIronTypes,
  fetchIronPriceList,
  clearIronPriceList,
} from "@/store/slices/ironCarShopSlice";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// styles
import styles from "./IronManagement.module.css";

export const IronPrices: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { carModels, ironTypes, ironPriceList, isLoading } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { customerTypes } = useAppSelector((state) => state.customerTypes);

  const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(
    null,
  );
  const [selectedIronTypeId, setSelectedIronTypeId] = useState<number | null>(
    null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    const apiLang = mapI18nCodeToApiCode(i18n.language);
    dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));
    dispatch(fetchCustomerTypes());
  }, [dispatch, cashRegisterId, i18n.language]);

  useEffect(() => {
    if (carModels.length > 0 && selectedCarModelId === null) {
      setSelectedCarModelId(carModels[0].id);
    }
  }, [carModels, selectedCarModelId]);

  useEffect(() => {
    if (selectedCarModelId) {
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      dispatch(
        fetchIronTypes({
          carModelId: selectedCarModelId,
          cashRegisterId,
          lang: apiLang,
        }),
      );
    }
  }, [dispatch, selectedCarModelId, cashRegisterId, i18n.language]);

  useEffect(() => {
    if (ironTypes.length > 0 && selectedIronTypeId === null) {
      setSelectedIronTypeId(ironTypes[0].id);
    } else if (ironTypes.length === 0) {
      setSelectedIronTypeId(null);
    }
  }, [ironTypes, selectedIronTypeId]);

  useEffect(() => {
    if (selectedIronTypeId && selectedCarModelId && customerTypes.length > 0) {
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      const firstCustomerTypeId = customerTypes[0].id;
      dispatch(
        fetchIronPriceList({
          ironTypeId: selectedIronTypeId,
          cashRegisterId,
          lang: apiLang,
          carModelId: selectedCarModelId,
          customerTypeId: firstCustomerTypeId,
        }),
      );
    } else {
      dispatch(clearIronPriceList());
    }
  }, [
    dispatch,
    selectedIronTypeId,
    selectedCarModelId,
    cashRegisterId,
    i18n.language,
    customerTypes,
  ]);

  const handleOpenAdd = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!selectedIronTypeId) {
        toast.error(t("ironManagement.error.selectIronType"));
        return;
      }
      anchorRef.current = e.currentTarget;
      setIsDropdownOpen(true);
    },
    [selectedIronTypeId, t],
  );

  const handleSaveIronPrice = useCallback(
    async (data: IronPriceForm) => {
      if (!selectedIronTypeId) {
        toast.error(t("ironManagement.error.selectIronType"));
        return;
      }
      try {
        setIsMutating(true);
        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(
          createIronPrice({
            ironTypeId: selectedIronTypeId,
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
        if (selectedCarModelId && customerTypes.length > 0) {
          await dispatch(
            fetchIronPriceList({
              ironTypeId: selectedIronTypeId,
              cashRegisterId,
              lang: apiLang,
              carModelId: selectedCarModelId,
              customerTypeId: customerTypes[0].id,
            }),
          ).unwrap();
        }
        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save iron price:", error);
        const errorMessage = getApiErrorMessage(
          error,
          t("ironManagement.error.failedToCreateIronPrice"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [
      dispatch,
      selectedIronTypeId,
      selectedCarModelId,
      cashRegisterId,
      customerTypes,
      t,
    ],
  );

  const handleCarModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const carModelId = Number(e.target.value);
      setSelectedCarModelId(carModelId || null);
      setSelectedIronTypeId(null);
    },
    [],
  );

  const handleIronTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const ironTypeId = Number(e.target.value);
      setSelectedIronTypeId(ironTypeId || null);
    },
    [],
  );

  const columns = useMemo(() => getIronPriceColumns(), []);

  console.log(ironPriceList, "0000000000000ironPriceList");

  const priceListWithCustomerTypes = useMemo(() => {
    return ironPriceList.map((price) => {
      const customerType = customerTypes.find(
        (ct) => ct.id === price.customerTypeId,
      );
      return {
        ...price,
        customerTypeName: customerType?.code || `ID: ${price.customerTypeId}`,
      };
    });
  }, [ironPriceList, customerTypes]);

  return (
    <div className={styles.ironPricesWrapper}>
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

      <div className={styles.selectWrapper}>
        <Select
          label={t("ironManagement.selectIronType")}
          value={selectedIronTypeId?.toString() || ""}
          onChange={handleIronTypeChange}
          disabled={isLoading || !selectedCarModelId || ironTypes.length === 0}
        >
          <option value="">{t("ironManagement.selectIronType")}</option>
          {ironTypes.map((ironType) => (
            <option key={ironType.id} value={ironType.id}>
              {ironType.name}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.header}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("ironManagement.addIronPrice")}
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            onClick={handleOpenAdd}
            disabled={!selectedIronTypeId}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addIronPrice")}
          </span>
        </div>
      </div>

      <div className={styles.addIronPriceButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("ironManagement.addIronPrice")}
            onClick={handleOpenAdd}
            disabled={!selectedIronTypeId}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addIronPrice")}
          </span>
        </div>
      </div>

      <IronPriceDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        customerTypes={customerTypes}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveIronPrice}
      />

      {selectedIronTypeId && (
        <div className={styles.tableWrapper}>
          <DataTable
            data={priceListWithCustomerTypes}
            columns={columns}
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};
