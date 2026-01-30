import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button } from "@/ui-kit";

// components
import { OfferOptionsContent } from "./OfferOptionsContent";
import { OfferIncreaseOptionDropdown } from "./offerOptionsActions/OfferOptionsDropdown";

// Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchOfferOptions,
  saveOfferOption,
  deleteOfferOption,
} from "@/store/slices/offerOptionsSlice";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./OfferOptions.module.css";

export const OfferIncreaseOptions = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { options, isLoading } = useAppSelector((state) => state.offerOptions);

  const [activeOptionId, setActiveOptionId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);
  const fetchInitiatedRef = useRef(false);

  const { shopId, cashRegisterId } = useMemo(() => {
    try {
      const rawData = localStorage.getItem("user_data");
      const userData = rawData ? JSON.parse(rawData) : {};

      return {
        shopId:
          userData.shopId && userData.shopId !== "—"
            ? Number(userData.shopId)
            : null,
        cashRegisterId: userData.cashRegisterId
          ? Number(userData.cashRegisterId)
          : undefined,
      };
    } catch {
      return { shopId: null, cashRegisterId: undefined };
    }
  }, []);

  useEffect(() => {
    if (fetchInitiatedRef.current || !shopId) return;
    fetchInitiatedRef.current = true;

    dispatch(fetchOfferOptions({ shopId, cashRegisterId }))
      .unwrap()
      .catch((error) => {
        toast.error(getErrorMessage(error, t("offers.error.failedToLoad")));
      });
  }, [dispatch, shopId, cashRegisterId, t]);

  const handleAddNewClick = useCallback((anchorEl: HTMLElement | null) => {
    if (!anchorEl) return;
    anchorRef.current = anchorEl;
    setActiveOptionId(null);
    setIsDropdownOpen(true);
  }, []);

  const handleEditClick = useCallback(
    (optionId: number, anchorEl: HTMLElement | null) => {
      anchorRef.current = anchorEl;
      setActiveOptionId(optionId);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
    setActiveOptionId(null);
    anchorRef.current = null;
  }, []);

  const handleSaveOption = useCallback(
    async (data: { percent: number; isActive: boolean; id?: number }) => {
      if (!shopId) return;
      const action = data.id ? "update" : "create";

      try {
        const result = await dispatch(
          saveOfferOption({ shopId, cashRegisterId, ...data, action }),
        );

        if (saveOfferOption.fulfilled.match(result)) {
          toast.success(
            t(
              `offers.success.option${action === "create" ? "Created" : "Updated"}`,
            ),
          );

          // Re-fetch to ensure store is 100% in sync with DB
          dispatch(fetchOfferOptions({ shopId, cashRegisterId }));

          handleCloseDropdown();
        } else {
          toast.error(
            getErrorMessage(result.payload, t("offers.error.failedToSave")),
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t("offers.error.failedToSave")));
      }
    },
    [dispatch, shopId, cashRegisterId, t, handleCloseDropdown],
  );

  const handleDeleteOption = useCallback(
    async (id: number) => {
      if (!shopId) return;
      try {
        const result = await dispatch(
          deleteOfferOption({ shopId, cashRegisterId, id }),
        );
        if (deleteOfferOption.fulfilled.match(result)) {
          toast.success(t("offers.success.optionDeleted"));
          handleCloseDropdown();
        } else {
          toast.error(
            getErrorMessage(result.payload, t("offers.error.failedToDelete")),
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t("offers.error.failedToDelete")));
      }
    },
    [dispatch, shopId, cashRegisterId, t, handleCloseDropdown],
  );

  const selectedOption = activeOptionId
    ? options.find((o) => o.id === activeOptionId)
    : undefined;

  return (
    <div className={styles.container}>
      <div className={styles.settingsWrapper}>
        <OfferOptionsContent
          options={options}
          isLoading={isLoading}
          onAddNewClick={handleAddNewClick}
          activeOptionId={activeOptionId}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteOption}
        />
      </div>

      <OfferIncreaseOptionDropdown
        open={isDropdownOpen}
        option={selectedOption}
        anchorRef={anchorRef}
        onOpenChange={(open) => {
          if (!open) handleCloseDropdown();
        }}
        onSave={handleSaveOption}
        onDelete={handleDeleteOption}
      />

      <div className={styles.footerActions}>
        <Button variant="secondary" size="medium">
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="medium">
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
};
