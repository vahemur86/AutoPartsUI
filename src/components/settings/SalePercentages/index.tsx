import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button } from "@/ui-kit";

// components
import { SalePercentagesContent } from "./SalePercentagesContent";
import { EditSalePercentageDropdown } from "./salePercentageActions/EditSalePercentageDropdown";
import { AddSalePercentageDropdown } from "./salePercentageActions/AddSalePercentageDropdown";

// Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSalePercentages,
  addSalePercentage,
  updateSalePercentageInStore,
  removeSalePercentage,
  clearActiveFlags,
} from "@/store/slices/salePercentagesSlice";

// services
import { updateSalePercentage } from "@/services/settings/salePercentages";

// types
import type { SalePercentage } from "@/types/settings";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./SalePercentages.module.css";

export const SalePercentages = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { salePercentages, isLoading } = useAppSelector(
    (state) => state.salePercentages,
  );
  const [editingSalePercentageId, setEditingSalePercentageId] = useState<
    number | null
  >(null);
  const [isAddingSalePercentage, setIsAddingSalePercentage] = useState(false);

  const editAnchorRef = useRef<HTMLElement>(null);
  const addAnchorRef = useRef<HTMLElement>(null);
  const fetchInitiatedRef = useRef(false);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;
    dispatch(fetchSalePercentages()).then((result) => {
      if (fetchSalePercentages.rejected.match(result)) {
        toast.error(
          getErrorMessage(
            result.payload,
            t("salePercentages.error.failedToLoad"),
          ),
        );
      }
    });
  }, [dispatch, t]);

  const handleAddNewClick = useCallback((anchorEl: HTMLElement | null) => {
    if (!anchorEl) return;
    addAnchorRef.current = anchorEl;
    setIsAddingSalePercentage(true);
  }, []);

  const handleEditClick = useCallback(
    (salePercentageId: number, anchorEl: HTMLElement | null) => {
      if (!anchorEl) return;
      editAnchorRef.current = anchorEl;
      setEditingSalePercentageId(salePercentageId);
    },
    [],
  );

  const handleCloseEditDropdown = useCallback(() => {
    setEditingSalePercentageId(null);
    editAnchorRef.current = null;
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingSalePercentage(false);
    addAnchorRef.current = null;
  }, []);

  const unsetOtherActivePercentages = useCallback(
    async (excludeId?: number) => {
      const toUnset = salePercentages.filter(
        (sp) => sp.isActive && sp.id !== excludeId,
      );
      if (toUnset.length === 0) return;

      try {
        await Promise.all(
          toUnset.map((sp) =>
            updateSalePercentage(sp.id, sp.percentage, false),
          ),
        );

        dispatch(clearActiveFlags({ excludeId }));
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(
            error,
            t("salePercentages.error.failedToUpdateActive"),
          ),
        );
        throw error;
      }
    },
    [salePercentages, t, dispatch],
  );

  const handleAddSalePercentage = useCallback(
    async (data: Omit<SalePercentage, "id">) => {
      try {
        if (data.isActive) {
          await unsetOtherActivePercentages();
        }

        const result = await dispatch(
          addSalePercentage({
            percentage: data.percentage,
            isActive: data.isActive,
          }),
        );

        if (addSalePercentage.fulfilled.match(result)) {
          toast.success(t("salePercentages.success.salePercentageCreated"));
          handleCloseAddDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("salePercentages.error.failedToCreate"),
            ),
          );
        }
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, t("salePercentages.error.failedToCreate")),
        );
        dispatch(fetchSalePercentages());
      }
    },
    [dispatch, t, handleCloseAddDropdown, unsetOtherActivePercentages],
  );

  const handleUpdateSalePercentage = useCallback(
    async (data: SalePercentage) => {
      if (!editingSalePercentageId) return;

      try {
        if (data.isActive) {
          await unsetOtherActivePercentages(data.id);
        }

        const result = await dispatch(
          updateSalePercentageInStore({
            id: data.id,
            percentage: data.percentage,
            isActive: data.isActive,
          }),
        );

        if (updateSalePercentageInStore.fulfilled.match(result)) {
          toast.success(t("salePercentages.success.salePercentageUpdated"));
          handleCloseEditDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("salePercentages.error.failedToUpdate"),
            ),
          );
        }
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, t("salePercentages.error.failedToUpdate")),
        );
        dispatch(fetchSalePercentages());
      }
    },
    [
      dispatch,
      editingSalePercentageId,
      t,
      handleCloseEditDropdown,
      unsetOtherActivePercentages,
    ],
  );

  const handleDeleteSalePercentage = useCallback(
    async (id: number) => {
      try {
        const result = await dispatch(removeSalePercentage(id));
        if (removeSalePercentage.fulfilled.match(result)) {
          toast.success(t("salePercentages.success.salePercentageDeleted"));
          handleCloseEditDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("salePercentages.error.failedToDelete"),
            ),
          );
        }
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, t("salePercentages.error.failedToDelete")),
        );
        dispatch(fetchSalePercentages());
      }
    },
    [dispatch, t, handleCloseEditDropdown],
  );

  const editingSalePercentage = editingSalePercentageId
    ? (salePercentages.find((sp) => sp.id === editingSalePercentageId) ?? null)
    : null;

  return (
    <div className={styles.salePercentages}>
      <div className={styles.salePercentagesSettings}>
        <SalePercentagesContent
          salePercentages={salePercentages}
          isLoading={isLoading}
          onAddNewClick={handleAddNewClick}
          activeSalePercentageId={editingSalePercentageId}
          onEditClick={handleEditClick}
        />
      </div>

      {editingSalePercentage && (
        <EditSalePercentageDropdown
          open={editingSalePercentageId !== null}
          salePercentage={editingSalePercentage}
          anchorRef={editAnchorRef}
          onOpenChange={(open) => {
            if (!open) handleCloseEditDropdown();
          }}
          onSave={handleUpdateSalePercentage}
          onDelete={handleDeleteSalePercentage}
        />
      )}

      <AddSalePercentageDropdown
        open={isAddingSalePercentage}
        anchorRef={addAnchorRef}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddSalePercentage}
      />

      <div className={styles.actionButtons}>
        <Button variant="secondary" size="medium" onClick={() => {}}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="medium" onClick={() => {}}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
};
