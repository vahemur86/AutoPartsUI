import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper, type ColumnDef, type Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";

// ui-kit
import { IconButton, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import { getShopInventoryStatus } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import type { ShopInventoryStatusItem } from "@/types/financeReports";
import { FinanceDataTable } from "./FinanceDataTable";
import { FinanceReportState } from "./FinanceReportState";
import { FinanceReportLoadButton } from "./FinanceReportLoadButton";

// local
import styles from "./FinanceReports.module.css";
import { FinanceFilterHeading } from "./FinanceFilterHeading";

const columnHelper = createColumnHelper<ShopInventoryStatusItem>();

const formatMoney = (value: number) =>
  `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD`;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const ShopInventoryStatus = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ShopInventoryStatusItem[] | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
  }, [dispatch, cashRegisterId]);

  useEffect(() => {
    if (shops.length > 0 && shopId === 0) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  const handleLoad = useCallback(async () => {
    if (!shopId) {
      toast.error(t("financeReports.validation.selectShop"));
      return;
    }

    const parsedProductId = Number(productId);
    const hasProductFilter =
      productId.trim().length > 0 && !Number.isNaN(parsedProductId) && parsedProductId > 0;

    setIsLoading(true);
    try {
      const response = await getShopInventoryStatus(shopId, {
        productId: hasProductFilter ? parsedProductId : undefined,
        cashRegisterId,
      });
      setData(response);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("financeReports.error.failedToLoad")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [shopId, productId, cashRegisterId, t]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<ShopInventoryStatusItem, any>[]>(
    () => [
      columnHelper.display({
        id: "product",
        header: t("financeReports.shopReports.columns.productCode"),
        cell: ({ row }) => (
          <div className={styles.shopInventoryProduct}>
            <strong>{row.original.productCode || "—"}</strong>
            <span>{row.original.productSku || "—"}</span>
          </div>
        ),
      }),
      columnHelper.accessor("totalQuantity", {
        header: t("financeReports.shopReports.columns.quantity"),
        cell: ({ getValue }) => getValue().toLocaleString(),
      }),
      columnHelper.accessor("currentSalePrice", {
        header: t("financeReports.shopReports.columns.salePrice"),
        cell: ({ getValue }) => <span className={styles.moneyValue}>{formatMoney(getValue())}</span>,
      }),
      columnHelper.accessor("weightedAverageCost", {
        header: t("financeReports.shopReports.columns.avgCostPrice"),
        cell: ({ getValue }) => formatMoney(getValue()),
      }),
      columnHelper.accessor("potentialProfit", {
        header: t("financeReports.shopReports.columns.profit"),
        cell: ({ getValue }) => (
          <span className={`${styles.moneyValue} ${getValue() < 0 ? styles.negativeValue : styles.positiveValue}`}>
            {formatMoney(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "batches",
        header: t("common.details"),
        cell: ({ row }) => (
          <IconButton
            variant="secondary"
            size="small"
            icon={row.getIsExpanded() ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            ariaLabel={`${t(row.getIsExpanded() ? "common.hide" : "common.details")} ${row.original.productCode}`}
            title={t(row.getIsExpanded() ? "common.hide" : "common.details")}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          />
        ),
      }),
    ],
    [t],
  );

  const renderBatchDetails = useCallback(
    ({ row }: { row: Row<ShopInventoryStatusItem> }) => {
      const batches = row.original.batches ?? [];
      if (batches.length === 0) {
        return <div className={styles.shopInventoryEmptyBatches}>{t("financeReports.shopInventory.emptyBatches")}</div>;
      }

      return (
        <section className={styles.shopInventoryBatchDetails}>
          <h4>
            {t("financeReports.shopInventory.batchesTitle")}
            <span>{batches.length}</span>
          </h4>
          <div className={styles.shopInventoryBatchGrid}>
            {batches.map((batch, index) => (
              <article className={styles.shopInventoryBatch} key={`${batch.transferredDate}-${index}`}>
                <div className={styles.shopInventoryBatchDate}>
                  <span>{t("financeReports.shopInventory.batchLabel", { number: index + 1 })}</span>
                  <time>{formatDateTime(batch.transferredDate)}</time>
                </div>
                <div className={styles.shopInventoryBatchMetrics}>
                  <div>
                    <span>{t("financeReports.shopInventory.remainingQuantity")}</span>
                    <strong>{batch.quantityRemaining.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>{t("financeReports.shopInventory.costPrice")}</span>
                    <strong>{formatMoney(batch.costPrice)}</strong>
                  </div>
                  <div>
                    <span>{t("financeReports.shopInventory.salePrice")}</span>
                    <strong>{formatMoney(batch.salePrice)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    },
    [t],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <FinanceFilterHeading />
        <Select
          label={t("financeReports.filters.shop")}
          value={shopId > 0 ? String(shopId) : ""}
          onChange={(e) => setShopId(Number(e.target.value) || 0)}
        >
          <option value="">{t("financeReports.filters.selectShop")}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.code}
            </option>
          ))}
        </Select>

        <TextField
          label={t("financeReports.filters.productId")}
          placeholder={t("financeReports.filters.productIdOptional")}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <FinanceReportLoadButton loading={isLoading} label={t("financeReports.actions.load")} onClick={handleLoad} />
      </div>

      {isLoading ? (
        <FinanceReportState loading label={t("common.loading")} />
      ) : data === null ? (
        <FinanceReportState loading={false} label={t("financeReports.empty")} />
      ) : data.length === 0 ? (
        <FinanceReportState loading={false} label={t("common.noData")} />
      ) : (
        <div className={`${styles.result} ${styles.shopInventoryTable}`}>
          <FinanceDataTable
            data={data}
            columns={columns}
            pageSize={10}
            fitContainer
            renderSubComponent={renderBatchDetails}
            noResultsText={t("common.noData")}
            loadingText={t("common.loading")}
          />
        </div>
      )}
    </div>
  );
};
