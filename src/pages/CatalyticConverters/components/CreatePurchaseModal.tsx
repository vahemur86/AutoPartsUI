import { useEffect, useMemo, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, Modal, Select, TextField, DatePicker } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addCatalyticPurchase } from "@/store/slices/catalyticConvertersSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// services
import {
  createCatalyticConverterSupplier,
  searchCatalyticConverterSuppliers,
} from "@/services/settings/catalyticConverters";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CatalyticConverterSupplierLookup,
  CreateCatalyticConverterSupplierRequest,
} from "@/types/catalyticConverters";

// components
import { SupplierModal } from "@/pages/CatalyticSuppliers/components/SupplierModal";

// styles
import styles from "../CatalyticConverters.module.css";

interface CreatePurchaseModalProps {
  open: boolean;
  catalyticConverterId: number | null;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreatePurchaseModal: FC<CreatePurchaseModalProps> = ({
  open,
  catalyticConverterId,
  onOpenChange,
  onCreated,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { warehouses } = useAppSelector((state) => state.warehouses);
  const authUser = useAppSelector((state) => state.auth.user);

  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<
    CatalyticConverterSupplierLookup[]
  >([]);
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [purchasedAt, setPurchasedAt] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;

    setSupplierId("");
    setSupplierSearch("");
    setSupplierOptions([]);
    setIsSupplierDropdownOpen(false);
    setQuantity("");
    setPurchasePrice("");
    setWarehouseId(authUser?.warehouseId ? String(authUser.warehouseId) : "");
    setPurchasedAt(new Date());
  }, [authUser, open]);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingSuppliers(true);
      try {
        const data = await searchCatalyticConverterSuppliers(
          supplierSearch.trim() || undefined,
        );
        setSupplierOptions(data);
      } catch {
        toast.error(t("catalyticSuppliers.errors.failedToLoad"));
      } finally {
        setIsLoadingSuppliers(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [open, supplierSearch, t]);

  const totalAmount =
    (Number(quantity) || 0) * (purchasePrice === "" ? 0 : Number(purchasePrice));

  const selectedSupplier = useMemo(
    () => supplierOptions.find((supplier) => String(supplier.id) === supplierId),
    [supplierId, supplierOptions],
  );

  const validate = () => {
    if (!supplierId || Number(supplierId) <= 0) {
      toast.error(t("catalyticConverters.purchase.validation.supplier"));
      return false;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error(t("catalyticConverters.purchase.validation.quantity"));
      return false;
    }
    if (purchasePrice === "" || Number(purchasePrice) < 0) {
      toast.error(t("catalyticConverters.purchase.validation.purchasePrice"));
      return false;
    }
    if (!warehouseId) {
      toast.error(t("catalyticConverters.purchase.validation.warehouse"));
      return false;
    }
    if (!purchasedAt) {
      toast.error(t("catalyticConverters.purchase.validation.purchasedAt"));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!catalyticConverterId || !validate()) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        addCatalyticPurchase({
          supplierId: Number(supplierId),
          catalyticConverterId,
          quantity: Number(quantity),
          purchasePrice: Number(purchasePrice),
          warehouseId: Number(warehouseId),
          purchasedAt: (purchasedAt as Date).toISOString(),
        }),
      ).unwrap();

      onCreated();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("catalyticConverters.purchase.error.failedToCreate"),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async (
    payload: CreateCatalyticConverterSupplierRequest,
  ) => {
    setIsSubmitting(true);
    try {
      const createdSupplier = await createCatalyticConverterSupplier(payload);
      const createdLookup: CatalyticConverterSupplierLookup = {
        id: createdSupplier.id,
        fullName: createdSupplier.fullName,
        phone: createdSupplier.phone,
        displayName: `${createdSupplier.fullName} (${createdSupplier.phone})`,
        notes: createdSupplier.notes ?? null,
      };

      setSupplierOptions((prev) => [createdLookup, ...prev]);
      setSupplierId(String(createdSupplier.id));
      setSupplierSearch(createdLookup.displayName);
      setIsSupplierDropdownOpen(false);
      setIsSupplierModalOpen(false);
      toast.success(t("catalyticSuppliers.success.created"));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("catalyticSuppliers.errors.failedToSave")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={t("catalyticConverters.purchase.title")}
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.add")}
            </Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.autocompleteField}>
            <TextField
              label={t("catalyticConverters.purchase.form.supplier")}
              value={supplierSearch}
              onFocus={() => setIsSupplierDropdownOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSupplierDropdownOpen(false), 150);
              }}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setSupplierId("");
                setIsSupplierDropdownOpen(true);
              }}
              placeholder={t(
                "catalyticConverters.purchase.form.supplierSearchPlaceholder",
              )}
              helperText={
                selectedSupplier
                  ? selectedSupplier.displayName
                  : t("catalyticConverters.purchase.form.supplierSearch")
              }
            />

            {isSupplierDropdownOpen && (
              <div className={styles.autocompleteDropdown}>
                {isLoadingSuppliers ? (
                  <div className={styles.autocompleteEmpty}>
                    {t("common.loading")}
                  </div>
                ) : supplierOptions.length > 0 ? (
                  supplierOptions.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      className={styles.autocompleteOption}
                      onMouseDown={() => {
                        setSupplierId(String(supplier.id));
                        setSupplierSearch(supplier.displayName);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      <span className={styles.autocompleteOptionPrimary}>
                        {supplier.fullName}
                      </span>
                      <span className={styles.autocompleteOptionMeta}>
                        {supplier.phone}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className={styles.autocompleteEmpty}>
                    {t("catalyticSuppliers.emptyState")}
                  </div>
                )}
              </div>
            )}
          </div>

          <TextField
            label={t("catalyticConverters.purchase.form.quantity")}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <TextField
            label={t("catalyticConverters.purchase.form.purchasePrice")}
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />

          <TextField
            label={t("catalyticConverters.purchase.form.totalAmount")}
            value={totalAmount.toFixed(2)}
            readOnly
            disabled
          />

          <Select
            label={t("catalyticConverters.purchase.form.warehouse")}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">{t("common.select")}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code}
              </option>
            ))}
          </Select>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              {t("catalyticConverters.purchase.form.purchasedAt")}
            </label>
            <DatePicker
              selected={purchasedAt}
              onChange={(date) => setPurchasedAt(date)}
              showTimeSelect
              dateFormat="MM/dd/yyyy HH:mm"
            />
          </div>

          <TextField
            label={t("catalyticConverters.purchase.form.operator")}
            value={authUser?.username ?? "-"}
            readOnly
            disabled
          />
        </div>

        <div className={styles.filtersActions} style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsSupplierModalOpen(true)}
            disabled={isSubmitting}
          >
            {t("catalyticSuppliers.actions.create")}
          </Button>
        </div>
      </Modal>

      <SupplierModal
        open={isSupplierModalOpen}
        onOpenChange={setIsSupplierModalOpen}
        onSave={handleCreateSupplier}
        supplier={null}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
