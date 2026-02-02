import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// ui-kit
import { Select } from "@/ui-kit";

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
import { fetchShops } from "@/store/slices/shopsSlice";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./OfferOptions.module.css";

export const OfferIncreaseOptions = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { options, isLoading } = useAppSelector((state) => state.offerOptions);
  const { shops } = useAppSelector((state) => state.shops);

  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  const { cashRegisterId } = useMemo(() => {
    try {
      const rawData = localStorage.getItem("user_data");
      const userData = rawData ? JSON.parse(rawData) : {};
      return {
        cashRegisterId: userData.cashRegisterId
          ? Number(userData.cashRegisterId)
          : undefined,
      };
    } catch {
      return { cashRegisterId: undefined };
    }
  }, []);

  // 1. Fetch shops on mount
  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  // 2. Auto-select first shop when loaded
  useEffect(() => {
    if (shops.length > 0 && selectedShopId === null) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  // 3. Fetch options based on selection
  useEffect(() => {
    if (selectedShopId) {
      dispatch(fetchOfferOptions({ shopId: selectedShopId, cashRegisterId }))
        .unwrap()
        .catch((error) => {
          toast.error(getErrorMessage(error, t("offers.error.failedToLoad")));
        });
    }
  }, [dispatch, selectedShopId, cashRegisterId, t]);

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShopId(Number(e.target.value));
  };

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
      if (!selectedShopId) return;

      const action = data.id ? "update" : "create";
      try {
        const result = await dispatch(
          saveOfferOption({
            ...data,
            shopId: selectedShopId,
            cashRegisterId,
            action,
          }),
        );

        if (saveOfferOption.fulfilled.match(result)) {
          toast.success(
            t(
              `offers.success.option${action === "create" ? "Created" : "Updated"}`,
            ),
          );
          dispatch(
            fetchOfferOptions({ shopId: selectedShopId, cashRegisterId }),
          );
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
    [dispatch, cashRegisterId, t, handleCloseDropdown, selectedShopId],
  );

  const handleDeleteOption = useCallback(
    async (id: number) => {
      if (!selectedShopId) return;
      try {
        const result = await dispatch(
          deleteOfferOption({ shopId: selectedShopId, cashRegisterId, id }),
        );
        if (deleteOfferOption.fulfilled.match(result)) {
          toast.success(t("offers.success.optionDeleted"));
        } else {
          toast.error(
            getErrorMessage(result.payload, t("offers.error.failedToDelete")),
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t("offers.error.failedToDelete")));
      }
    },
    [dispatch, selectedShopId, cashRegisterId, t],
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
          shopSelector={
            <div className={styles.shopSelectorSection}>
              <Select
                label={t("offers.selectShop")}
                value={selectedShopId || ""}
                onChange={handleShopChange}
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.code}
                  </option>
                ))}
              </Select>
            </div>
          }
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
      />
    </div>
  );
};
