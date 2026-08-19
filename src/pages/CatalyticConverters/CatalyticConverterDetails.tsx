import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Pencil, ShoppingCart } from "lucide-react";

// ui-kit
import { Button, Table, TableBody, TableCell, TableHeader, TableRow } from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common";
import { CreatePurchaseModal } from "./components/CreatePurchaseModal";
import { CreateCatalyticConverterModal } from "./components/CreateCatalyticConverterModal";

// services
import { getVehicleDefinitions } from "@/services/settings/vehicles";

// types
import type { VehicleDefinition } from "@/types/settings";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCatalyticConverterById,
  clearSelectedCatalyticConverter,
} from "@/store/slices/catalyticConvertersSlice";

// styles
import styles from "./CatalyticConverters.module.css";

export const CatalyticConverterDetails = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();

  const { selected, isLoadingDetails } = useAppSelector(
    (state) => state.catalyticConverters,
  );

  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(null);

  const numericId = Number(id);
  const compatibilities = selected?.compatibilities ?? [];
  const canEditProduct = !!selected && Array.isArray(selected.compatibilities);

  useEffect(() => {
    if (!numericId) return;
    dispatch(fetchCatalyticConverterById(numericId));

    return () => {
      dispatch(clearSelectedCatalyticConverter());
    };
  }, [dispatch, numericId]);

  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        const data = await getVehicleDefinitions();
        setDefinitions(data);
      } catch {
        toast.error(t("catalyticConverters.errors.loadingLookups"));
      }
    };

    loadDefinitions();
  }, [t]);

  const handlePurchaseCreated = () => {
    setIsPurchaseOpen(false);
    toast.success(t("catalyticConverters.purchase.success"));
    if (numericId) dispatch(fetchCatalyticConverterById(numericId));
  };

  const handleProductSaved = () => {
    setIsEditOpen(false);
    if (numericId) {
      dispatch(fetchCatalyticConverterById(numericId));
    }
  };

  if (!numericId) {
    return (
      <div className={styles.container}>
        {t("catalyticConverters.details.notFound")}
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={selected?.code ?? t("catalyticConverters.details.title")}
        goBack
        actions={
          <div className={styles.rowActions}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setIsEditOpen(true)}
              disabled={!canEditProduct}
            >
              <Pencil size={16} />
              {t("common.edit")}
            </Button>
            <Button size="small" onClick={() => setIsPurchaseOpen(true)}>
              <ShoppingCart size={16} />
              {t("catalyticConverters.actions.createPurchase")}
            </Button>
          </div>
        }
      />

      <div className={styles.container}>
        {isLoadingDetails && !selected ? (
          <div>{t("common.loading")}</div>
        ) : !selected ? (
          <div>{t("catalyticConverters.details.notFound")}</div>
        ) : (
          <>
            <div className={styles.tableSection}>
              <h3 className={styles.tableTitle}>
                {t("catalyticConverters.details.summary")}
              </h3>

              <div className={styles.formGrid}>
                <div>
                  <span>{t("catalyticConverters.columns.code")}</span>
                  <div>
                    <b>{selected.code}</b>
                  </div>
                </div>
                <div>
                  <span>{t("catalyticConverters.columns.description")}</span>
                  <div>{selected.description || "-"}</div>
                </div>
                <div>
                  <span>{t("catalyticConverters.columns.sellingPrice")}</span>
                  <div>
                    {selected.sellingPrice != null
                      ? `$${Number(selected.sellingPrice).toFixed(2)}`
                      : "-"}
                  </div>
                </div>
                <div>
                  <span>{t("catalyticConverters.columns.available")}</span>
                  <div>
                    <span className={styles.badge}>
                      {selected.totalAvailableQuantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tableSection}>
              <h3 className={styles.tableTitle}>
                {t("catalyticConverters.details.compatibilities")}
              </h3>

              {compatibilities.length === 0 ? (
                <div>{t("catalyticConverters.details.noCompatibilities")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell asHeader>
                        {t("catalyticConverters.filters.brand")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.filters.model")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.filters.engine")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.filters.fuelType")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.form.enginePowerHp")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.form.yearFrom")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.form.yearTo")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.form.maxMileageKm")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compatibilities.map((item, index) => (
                      <TableRow key={`${item.brandId}-${item.modelId}-${index}`}>
                            <TableCell>{item.brandName ?? item.brandId ?? "-"}</TableCell>
                            <TableCell>{item.modelName ?? item.modelId ?? "-"}</TableCell>
                            <TableCell>{item.engineName ?? item.engineId ?? "-"}</TableCell>
                            <TableCell>
                              {item.fuelTypeName ?? item.fuelTypeId ?? "-"}
                            </TableCell>
                            <TableCell>{item.enginePowerHp ?? "-"}</TableCell>
                            <TableCell>{item.yearFrom ?? "-"}</TableCell>
                            <TableCell>{item.yearTo ?? "-"}</TableCell>
                            <TableCell>{item.maxMileageKm ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className={styles.tableSection}>
              <h3 className={styles.tableTitle}>
                {t("catalyticConverters.details.batches")}
              </h3>

              {selected.batches.length === 0 ? (
                <div>{t("catalyticConverters.details.noBatches")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.id")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.warehouse")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.quantity")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.remaining")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.purchasePrice")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.supplier")}
                      </TableCell>
                      <TableCell asHeader>
                        {t("catalyticConverters.details.batchColumns.createdAt")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.id}</TableCell>
                        <TableCell>
                          {batch.warehouseName ?? batch.warehouseId}
                        </TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                        <TableCell>{batch.remainingQuantity}</TableCell>
                        <TableCell>
                          ${Number(batch.purchasePrice).toFixed(2)}
                        </TableCell>
                        <TableCell>{batch.supplierName ?? batch.supplierId}</TableCell>
                        <TableCell>
                          {new Date(batch.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}
      </div>

      <CreatePurchaseModal
        open={isPurchaseOpen}
        catalyticConverterId={numericId}
        onOpenChange={setIsPurchaseOpen}
        onCreated={handlePurchaseCreated}
      />

      {selected && (
        <CreateCatalyticConverterModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSaved={handleProductSaved}
          definitions={definitions}
          mode="edit"
          catalyticConverterId={selected.id}
          initialData={{
            code: selected.code,
            description: selected.description,
            sellingPrice: selected.sellingPrice,
            compatibilities: selected.compatibilities ?? [],
          }}
        />
      )}
    </>
  );
};
