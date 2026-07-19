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
import { Button, DataTable, IconButton, Modal, Select, TextField } from "@/ui-kit";

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

// columns
import { getIronTypeColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createIronType,
  fetchCarModels,
  fetchIronTypes,
  updateIronTypeName,
} from "@/store/slices/ironCarShopSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// styles
import styles from "./IronManagement.module.css";

export const IronTypes: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { carModels, ironTypes, isLoading } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { languages } = useAppSelector((state) => state.languages);

  const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(
    null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [editingIronType, setEditingIronType] = useState<{
    id: number;
    code: string;
    name: string;
    translations: Record<string, string>;
  } | null>(null);

  const anchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    const apiLang = mapI18nCodeToApiCode(i18n.language);
    dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));
    if (languages.length === 0) {
      dispatch(fetchLanguages());
    }
  }, [dispatch, cashRegisterId, languages.length]);

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
  }, [dispatch, selectedCarModelId, cashRegisterId]);

  const handleOpenAdd = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!selectedCarModelId) {
        toast.error(t("ironManagement.error.selectCarModel"));
        return;
      }
      anchorRef.current = e.currentTarget;
      setIsDropdownOpen(true);
    },
    [selectedCarModelId, t],
  );

  const handleOpenEdit = useCallback(
    (ironType: { id: number; name: string; code?: string; translations?: Record<string, string> }) => {
      setEditingIronType({
        id: ironType.id,
        code: ironType.code ?? "",
        name: ironType.name ?? "",
        translations: ironType.translations ?? {},
      });
    },
    [],
  );

  const handleSaveIronType = useCallback(
    async (data: IronTypeForm) => {
      if (!selectedCarModelId) {
        toast.error(t("ironManagement.error.selectCarModel"));
        return;
      }
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
          fetchIronTypes({
            carModelId: selectedCarModelId,
            cashRegisterId,
            lang: apiLang,
          }),
        ).unwrap();
        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save iron type:", error);
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

  const handleSaveIronTypeEdit = useCallback(async () => {
    if (!editingIronType || !selectedCarModelId) return;

    try {
      setIsMutating(true);
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      await dispatch(
        updateIronTypeName({
          id: editingIronType.id,
          payload: {
            code: editingIronType.code.trim() || editingIronType.name.trim(),
            translations: Object.fromEntries(
              Object.entries(editingIronType.translations).filter(
                ([, value]) => value.trim().length > 0,
              ),
            ),
          },
          cashRegisterId,
          lang: apiLang,
        }),
      ).unwrap();

      toast.success(t("ironManagement.success.ironTypeUpdated"));
      await dispatch(
        fetchIronTypes({
          carModelId: selectedCarModelId,
          cashRegisterId,
          lang: apiLang,
        }),
      ).unwrap();
      setEditingIronType(null);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        t("ironManagement.error.failedToUpdateIronType"),
      );
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [cashRegisterId, dispatch, editingIronType, selectedCarModelId, t]);

  const handleCarModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const carModelId = Number(e.target.value);
      setSelectedCarModelId(carModelId || null);
    },
    [],
  );

  const columns = useMemo(
    () => getIronTypeColumns({ onEdit: handleOpenEdit }),
    [handleOpenEdit],
  );

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
            onClick={handleOpenAdd}
            disabled={!selectedCarModelId}
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
            onClick={handleOpenAdd}
            disabled={!selectedCarModelId}
          />
          <span className={styles.addButtonText}>
            {t("ironManagement.addIronType")}
          </span>
        </div>
      </div>

      <IronTypeDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveIronType}
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
              label={t("ironManagement.form.code")}
              value={editingIronType.code}
              onChange={(event) =>
                setEditingIronType((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    code: event.target.value,
                  };
                })
              }
              disabled={isMutating}
            />

            <TextField
              label={t("ironManagement.columns.name")}
              value={editingIronType.name}
              onChange={(event) =>
                setEditingIronType((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    name: event.target.value,
                  };
                })
              }
              disabled={isMutating}
            />

            {languages.map((lang) => (
              <TextField
                key={lang.code}
                label={`${t("ironManagement.form.name")} (${lang.name})`}
                value={editingIronType.translations[lang.code] ?? ""}
                onChange={(event) => {
                  setEditingIronType((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [lang.code]: event.target.value,
                      },
                    };
                  });
                }}
                disabled={isMutating}
              />
            ))}

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

      <div className={styles.tableWrapper}>
        <DataTable data={ironTypes} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
