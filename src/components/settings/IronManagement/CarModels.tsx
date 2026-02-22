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
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// utils
import { getApiErrorMessage, getCashRegisterId, mapI18nCodeToApiCode } from "@/utils";

// components
import {
  CarModelDropdown,
  type CarModelForm,
} from "./carModelActions/CarModelDropdown";

// columns
import { getCarModelColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createCarModel,
  fetchCarModels,
} from "@/store/slices/ironCarShopSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// styles
import styles from "./IronManagement.module.css";

export const CarModels: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { carModels } = useAppSelector((state) => state.ironCarShop);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const { languages } = useAppSelector((state) => state.languages);

  useEffect(() => {
    const apiLang = mapI18nCodeToApiCode(i18n.language);
    dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));
    if (languages.length === 0) {
      dispatch(fetchLanguages());
    }
  }, [dispatch, cashRegisterId, languages.length, i18n.language]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setIsDropdownOpen(true);
  }, []);

  const handleSaveCarModel = useCallback(
    async (data: CarModelForm) => {
      try {
        setIsMutating(true);
        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(
          createCarModel({
            payload: data,
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
        toast.success(t("ironManagement.success.carModelCreated"));
        await dispatch(fetchCarModels({ cashRegisterId, lang: apiLang })).unwrap();
        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save car model:", error);
        const errorMessage = getApiErrorMessage(
          error,
          t("ironManagement.error.failedToCreateCarModel"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, cashRegisterId, t],
  );

  const columns = useMemo(() => getCarModelColumns(), []);

  return (
    <div className={styles.carModelsWrapper}>
      <div className={styles.header}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("ironManagement.addCarModel")}
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addCarModel")}
          </span>
        </div>
      </div>

      <div className={styles.addCarModelButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("ironManagement.addCarModel")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addCarModel")}
          </span>
        </div>
      </div>

      <CarModelDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveCarModel}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={carModels} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
