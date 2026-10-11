import { useEffect, useMemo, useState, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Package,
  Plus,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

// ui-kit
import { Button, Select, TextField, DatePicker } from "@/ui-kit";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";

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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting && !isSupplierModalOpen) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSubmitting, isSupplierModalOpen, onOpenChange, open]);

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
      {open && createPortal(
        <div
          className={styles.drawerBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              onOpenChange(false);
            }
          }}
        >
          <aside
            className={styles.converterDrawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.drawerHeader}>
              <div className={styles.drawerIcon} aria-hidden="true">
                <ShoppingCart size={20} />
              </div>
              <div className={styles.drawerHeaderCopy}>
                <span>{t("catalyticConverters.title")}</span>
                <h2 id="purchase-drawer-title">
                  {t("catalyticConverters.purchase.title")}
                </h2>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                aria-label={t("common.close")}
                title={t("common.close")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.drawerBody}>
              <div className={styles.drawerSectionHeading}>
                <BadgeCheck size={15} aria-hidden="true" />
                <span>{t("catalyticConverters.purchase.title")}</span>
              </div>

              <div className={`${styles.formGrid} ${styles.purchaseFormGrid}`}>
                <div className={styles.autocompleteField}>
                  <TextField
                    label={t("catalyticConverters.purchase.form.supplier")}
                    value={supplierSearch}
                    onFocus={() => setIsSupplierDropdownOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsSupplierDropdownOpen(false), 150);
                    }}
                    onChange={(event) => {
                      setSupplierSearch(event.target.value);
                      setSupplierId("");
                      setIsSupplierDropdownOpen(true);
                    }}
                    placeholder={t("catalyticConverters.purchase.form.supplierSearchPlaceholder")}
                    helperText={
                      selectedSupplier
                        ? selectedSupplier.displayName
                        : t("catalyticConverters.purchase.form.supplierSearch")
                    }
                    icon={<Search size={15} aria-hidden="true" />}
                    disabled={isSubmitting}
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

                  <Button
                    variant="secondary"
                    size="small"
                    className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                    onClick={() => setIsSupplierModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t("catalyticSuppliers.actions.create")}
                  </Button>
                </div>

                <TextField
                  label={t("catalyticConverters.purchase.form.quantity")}
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  icon={<Package size={15} aria-hidden="true" />}
                  disabled={isSubmitting}
                />

                <TextField
                  label={t("catalyticConverters.purchase.form.purchasePrice")}
                  type="number"
                  value={purchasePrice}
                  onChange={(event) => setPurchasePrice(event.target.value)}
                  icon={<CircleDollarSign size={15} aria-hidden="true" />}
                  disabled={isSubmitting}
                />

                <TextField
                  label={t("catalyticConverters.purchase.form.totalAmount")}
                  value={totalAmount.toFixed(2)}
                  readOnly
                  disabled
                  icon={<CircleDollarSign size={15} aria-hidden="true" />}
                />

                <Select
                  label={t("catalyticConverters.purchase.form.warehouse")}
                  value={warehouseId}
                  onChange={(event) => setWarehouseId(event.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">{t("common.select")}</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code}
                    </option>
                  ))}
                </Select>

                <div className={styles.purchaseDateField}>
                  <label className={styles.purchaseDateLabel}>
                    <CalendarClock size={14} aria-hidden="true" />
                    <span>{t("catalyticConverters.purchase.form.purchasedAt")}</span>
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
                  icon={<UserRound size={15} aria-hidden="true" />}
                />

              </div>
            </div>

            <footer className={styles.drawerFooter}>
              <Button
                variant="secondary"
                className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X size={15} aria-hidden="true" />
                {t("common.cancel")}
              </Button>
              <Button
                className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                onClick={handleSave}
                disabled={isSubmitting}
              >
                <ShoppingCart size={15} aria-hidden="true" />
                {isSubmitting ? t("common.loading") : t("common.add")}
              </Button>
            </footer>
          </aside>
        </div>,
        document.body,
      )}

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
