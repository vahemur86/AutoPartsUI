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
import {
  Button,
  ConfirmationModal,
  DataTable,
  IconButton,
  Modal,
  TextField,
} from "@/ui-kit";

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
  removeCarModel,
  updateCarModelName,
} from "@/store/slices/ironCarShopSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// styles
import styles from "./IronManagement.module.css";
import type { CarModel } from "@/types/ironCarShop";

export const CarModels: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { carModels } = useAppSelector((state) => state.ironCarShop);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<{
    id: number;
    code: string;
    name: string;
    translations: Record<string, string>;
  } | null>(null);
  const [deletingCarModel, setDeletingCarModel] = useState<CarModel | null>(
    null,
  );

  const anchorRef = useRef<HTMLElement | null>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const { languages } = useAppSelector((state) => state.languages);

  useEffect(() => {
    const apiLang = mapI18nCodeToApiCode(i18n.language);
    dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));
    if (languages.length === 0) {
      dispatch(fetchLanguages());
    }
  }, [dispatch, cashRegisterId, languages.length]);

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
        await dispatch(
          fetchCarModels({ cashRegisterId, lang: apiLang }),
        ).unwrap();
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

  const handleOpenEdit = useCallback((carModel: CarModel) => {
    setEditingCarModel({
      id: carModel.id,
      code: "",
      name: carModel.name ?? "",
      translations: {},
    });
  }, []);

  const handleSaveCarModelEdit = useCallback(async () => {
    if (!editingCarModel) return;

    try {
      setIsMutating(true);
      const apiLang = mapI18nCodeToApiCode(i18n.language);
      await dispatch(
        updateCarModelName({
          id: editingCarModel.id,
          payload: {
            code: editingCarModel.code.trim() || editingCarModel.name.trim(),
            translations: Object.fromEntries(
              Object.entries(editingCarModel.translations).filter(
                ([, value]) => value.trim().length > 0,
              ),
            ),
          },
          cashRegisterId,
          lang: apiLang,
        }),
      ).unwrap();

      toast.success(t("ironManagement.success.carModelUpdated"));
      await dispatch(fetchCarModels({ cashRegisterId, lang: apiLang })).unwrap();
      setEditingCarModel(null);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        t("ironManagement.error.failedToUpdateCarModel"),
      );
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  }, [cashRegisterId, dispatch, editingCarModel, t]);

  const handleDeleteCarModel = useCallback(
    async (carModel: CarModel) => {
      try {
        setIsMutating(true);
        await dispatch(removeCarModel(carModel.id)).unwrap();

        toast.success(t("ironManagement.success.carModelDeleted"));

        const apiLang = mapI18nCodeToApiCode(i18n.language);
        await dispatch(fetchCarModels({ cashRegisterId, lang: apiLang }));

        setDeletingCarModel(null);
      } catch (error) {
        console.error("Failed to delete car model:", error);
        toast.error(
          getApiErrorMessage(
            error,
            t("ironManagement.error.failedToDeleteCarModel"),
          ),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, cashRegisterId, t],
  );

  const columns = useMemo(
    () =>
      getCarModelColumns({
        onEdit: handleOpenEdit,
        onDelete: (carModel) => setDeletingCarModel(carModel),
      }),
    [handleOpenEdit],
  );

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

      {!!deletingCarModel && (
        <ConfirmationModal
          open={!!deletingCarModel}
          onOpenChange={(open) => !open && setDeletingCarModel(null)}
          title={t("ironManagement.confirmation.deleteTitle")}
          description={t("ironManagement.confirmation.deleteDescription", {
            name: deletingCarModel?.name,
          })}
          confirmText={
            isMutating
              ? t("ironManagement.confirmation.deleting")
              : t("ironManagement.confirmation.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={() =>
            deletingCarModel && handleDeleteCarModel(deletingCarModel)
          }
          onCancel={() => setDeletingCarModel(null)}
        />
      )}

      <Modal
        open={!!editingCarModel}
        onOpenChange={(open) => {
          if (!open) setEditingCarModel(null);
        }}
        title={t("common.edit")}
        width="560px"
      >
        {editingCarModel && (
          <div className={styles.editModalContent}>
            <TextField
              label={t("ironManagement.form.code")}
              value={editingCarModel.code}
              onChange={(event) =>
                setEditingCarModel((prev) => {
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
              value={editingCarModel.name}
              onChange={(event) =>
                setEditingCarModel((prev) => {
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
                value={editingCarModel.translations[lang.code] ?? ""}
                onChange={(event) => {
                  setEditingCarModel((prev) => {
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
                onClick={() => setEditingCarModel(null)}
                disabled={isMutating}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSaveCarModelEdit}
                disabled={isMutating}
              >
                {t("common.update")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className={styles.tableWrapper}>
        <DataTable data={carModels} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
