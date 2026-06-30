import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { useTranslation } from "react-i18next";

import sharedStyles from "../../OperatorPage.module.css";
import styles from "./WorkshopMode.module.css";
import { getShopProducts } from "@/services/warehouses/warehouseProduct";
import type { VehicleServiceTemplateItem } from "@/types/settings";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";

interface WorkshopModeProps {
  vehicleTemplates: VehicleServiceTemplateItem[];
  vehicleTemplatesLoading: boolean;
  cashRegisterId?: number;
  shopId?: number;
  operatorName?: string;
  cashRegisterName?: string;
  onSubmit: (payload: {
    vehicleBrandId: number;
    vehicleModelId: number;
    vehicleYear: number;
    vehicleFuelTypeId: number;
    vehicleEngineId: number;
    location: string;
    vinCode: string;
    mileage: number;
    notes: string;
    services: Array<{
      serviceId: number;
      customerPrice: number;
      employeeId?: number;
    }>;
  }) => Promise<{ id: number; estimateNumber: string } | null | undefined>;
  isSubmitting: boolean;
}

type WorkshopProductLine = {
  productId: number;
  shopStockId: number;
  sku: string;
  code: string;
  unitPrice: number;
  quantity: number;
};

type NormalizedTemplate = {
  id: number;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  year: number;
  fuelTypeId: number;
  fuelTypeName: string;
  engineId: number;
  engineName: string;
  location: string;
  electricityPrice: number;
  isActive: boolean;
  items: Array<{
    serviceId: number;
    customerPrice?: number;
    employeeId?: number;
  }>;
};

export const WorkshopMode = ({
  vehicleTemplates,
  vehicleTemplatesLoading,
  cashRegisterId,
  shopId,
  operatorName,
  cashRegisterName,
  onSubmit,
  isSubmitting,
}: WorkshopModeProps) => {
  const { t } = useTranslation();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [products, setProducts] = useState<ShopProductItem[]>([]);

  const [brandId, setBrandId] = useState(0);
  const [modelId, setModelId] = useState(0);
  const [fuelTypeId, setFuelTypeId] = useState(0);
  const [engineId, setEngineId] = useState(0);
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [vinCode, setVinCode] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [orderComment, setOrderComment] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productLines, setProductLines] = useState<WorkshopProductLine[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [createdEstimate, setCreatedEstimate] = useState<{
    id: number;
    estimateNumber: string;
  } | null>(null);

  useEffect(() => {
    if (!cashRegisterId || !shopId) return;

    const loadProducts = async () => {
      setIsProductsLoading(true);
      try {
        const response = await getShopProducts({
          shopId,
          cashRegisterId,
        });
        setProducts(response);
      } catch {
        toast.error(t("operatorPage.workshop.error.loadProductsFailed"));
      } finally {
        setIsProductsLoading(false);
      }
    };

    void loadProducts();
  }, [cashRegisterId, shopId, t]);

  const normalizedTemplates = useMemo<NormalizedTemplate[]>(() => {
    return vehicleTemplates
      .map((template) => {
        const raw = template as unknown as Record<string, unknown>;
        const id = Number(raw.id ?? 0);
        const brandId = Number(raw.brandId ?? raw.vehicleBrandId ?? 0);
        const modelId = Number(raw.modelId ?? raw.vehicleModelId ?? 0);
        const fuelTypeId = Number(raw.fuelTypeId ?? 0);
        const engineId = Number(raw.engineId ?? 0);
        const yearValue = Number(raw.year ?? 0);
        const locationValue =
          String(raw.location ?? raw.locationName ?? raw.marketName ?? "").trim();
     const items = Array.isArray(raw.items)
  ? (raw.items
      .map((i: any) => ({
        serviceId: Number(i.serviceId),
        customerPrice: i.customerPrice != null ? Number(i.customerPrice) : undefined,
        employeeId: i.employeeId != null ? Number(i.employeeId) : undefined,
      }))
      .filter((i) => i.serviceId > 0))
  : [];

        return {
          id,
          brandId,
          brandName: String(raw.brandName ?? raw.vehicleBrandName ?? `#${brandId}`),
          modelId,
          modelName: String(raw.modelName ?? raw.vehicleModelName ?? `#${modelId}`),
          year: yearValue,
          fuelTypeId,
          fuelTypeName: String(raw.fuelTypeName ?? `#${fuelTypeId}`),
          engineId,
          engineName: String(raw.engineName ?? `#${engineId}`),
          location: locationValue,
          electricityPrice: Number(raw.electricityPrice ?? 0),
          isActive: raw.isActive !== false,
          items,
        };
      })
      .filter(
        (template) =>
          template.id > 0 &&
          template.brandId > 0 &&
          template.modelId > 0 &&
          template.fuelTypeId > 0 &&
          template.engineId > 0 &&
          template.year > 0,
      );
  }, [vehicleTemplates]);

  const activeTemplates = useMemo(
    () => normalizedTemplates.filter((template) => template.isActive),
    [normalizedTemplates],
  );

  const brandOptions = useMemo(() => {
    const map = new Map<number, string>();
    activeTemplates.forEach((template) => {
      if (!map.has(template.brandId)) {
        map.set(template.brandId, template.brandName || `#${template.brandId}`);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activeTemplates]);

  const modelOptions = useMemo(() => {
    const map = new Map<number, string>();
    activeTemplates
      .filter((template) => template.brandId === brandId)
      .forEach((template) => {
        if (!map.has(template.modelId)) {
          map.set(template.modelId, template.modelName || `#${template.modelId}`);
        }
      });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activeTemplates, brandId]);

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          activeTemplates
            .filter(
              (template) =>
                template.brandId === brandId &&
                template.modelId === modelId &&
                template.fuelTypeId === fuelTypeId &&
                template.engineId === engineId,
            )
            .map((template) => template.location)
            .filter((value) => !!value),
        ),
      ),
    [activeTemplates, brandId, modelId, fuelTypeId, engineId],
  );

  const fuelTypeOptions = useMemo(() => {
    const map = new Map<number, string>();
    activeTemplates
      .filter(
        (template) =>
          template.brandId === brandId && template.modelId === modelId,
      )
      .forEach((template) => {
        if (!map.has(template.fuelTypeId)) {
          map.set(template.fuelTypeId, template.fuelTypeName || `#${template.fuelTypeId}`);
        }
      });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activeTemplates, brandId, modelId]);

  const engineOptions = useMemo(() => {
    const map = new Map<number, string>();
    activeTemplates
      .filter(
        (template) =>
          template.brandId === brandId &&
          template.modelId === modelId &&
          template.fuelTypeId === fuelTypeId,
      )
      .forEach((template) => {
        if (!map.has(template.engineId)) {
          map.set(template.engineId, template.engineName || `#${template.engineId}`);
        }
      });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activeTemplates, brandId, modelId, fuelTypeId]);

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          activeTemplates
            .filter(
              (template) =>
                template.brandId === brandId &&
                template.modelId === modelId &&
                template.fuelTypeId === fuelTypeId &&
                template.engineId === engineId &&
                template.location === location,
            )
            .map((template) => template.year),
        ),
      ).sort((a, b) => b - a),
    [activeTemplates, brandId, modelId, fuelTypeId, engineId, location],
  );

  useEffect(() => {
    if (!brandId) return;
    if (!brandOptions.some((brand) => brand.id === brandId)) {
      setBrandId(0);
      setModelId(0);
      setFuelTypeId(0);
      setEngineId(0);
      setLocation("");
      setYear("");
      setHasCalculated(false);
    }
  }, [brandId, brandOptions]);

  useEffect(() => {
    if (!modelId || !brandId) return;
    if (!modelOptions.some((model) => model.id === modelId)) {
      setModelId(0);
      setFuelTypeId(0);
      setEngineId(0);
      setLocation("");
      setYear("");
      setHasCalculated(false);
    }
  }, [brandId, modelId, modelOptions]);

  useEffect(() => {
    if (!fuelTypeId) return;
    if (!fuelTypeOptions.some((item) => item.id === fuelTypeId)) {
      setFuelTypeId(0);
      setEngineId(0);
      setLocation("");
      setYear("");
      setHasCalculated(false);
    }
  }, [fuelTypeId, fuelTypeOptions]);

  useEffect(() => {
    if (!engineId) return;
    if (!engineOptions.some((item) => item.id === engineId)) {
      setEngineId(0);
      setLocation("");
      setYear("");
      setHasCalculated(false);
    }
  }, [engineId, engineOptions]);

  useEffect(() => {
    if (!location) return;
    if (!locationOptions.includes(location)) {
      setLocation("");
      setYear("");
      setHasCalculated(false);
    }
  }, [location, locationOptions]);

  useEffect(() => {
    if (!year) return;
    if (!yearOptions.includes(Number(year))) {
      setYear("");
      setHasCalculated(false);
    }
  }, [year, yearOptions]);

  useEffect(() => {
    if (!hasCalculated) return;

    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [hasCalculated]);

  useEffect(() => {
    if (!hasCalculated) {
      setCreatedEstimate(null);
    }
  }, [hasCalculated]);

  const selectedTemplate = useMemo(() => {
    const yearNumber = Number(year || 0);
    if (!brandId || !modelId || !yearNumber || !location) return null;

    return (
      activeTemplates.find(
        (item) =>
          item.brandId === brandId &&
          item.modelId === modelId &&
          item.fuelTypeId === fuelTypeId &&
          item.engineId === engineId &&
          item.year === yearNumber &&
          String(item.location || "").toLowerCase() === String(location || "").toLowerCase(),
      ) ?? null
    );
  }, [activeTemplates, brandId, modelId, fuelTypeId, engineId, year, location]);

  const productOptions = useMemo(
    () =>
      products
        .filter((item) => Number(item.productId || item.product?.id || 0) > 0)
        .map((item) => ({
          stockId: item.id,
          productId: Number(item.productId || item.product?.id || 0),
          sku: (item.product?.sku || item.product?.code || `#${item.productId}`).trim(),
          code: (item.product?.code || item.product?.sku || `#${item.productId}`).trim(),
          salePrice: Number(item.salePrice || 0),
        })),
    [products],
  );

  const servicesPrice = useMemo(
    () =>
      (selectedTemplate?.items ?? []).reduce(
        (sum, item) => sum + Number(item.customerPrice || 0),
        0,
      ),
    [selectedTemplate],
  );

  const electricityPrice = Number(selectedTemplate?.electricityPrice || 0);

  const productsPrice = useMemo(
    () =>
      productLines.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [productLines],
  );

  const totalPrice = servicesPrice + electricityPrice + productsPrice;
  const printedAt = useMemo(() => new Date().toLocaleString(), [hasCalculated]);

  const addProductLine = () => {
    const productId = Number(selectedProductId || 0);
    if (!productId) return;

    const selected = productOptions.find((item) => item.productId === productId);
    if (!selected) return;

    setProductLines((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }

      return [
        ...prev,
        {
          productId: selected.productId,
          shopStockId: selected.stockId,
          sku: selected.sku,
          code: selected.code,
          unitPrice: selected.salePrice,
          quantity: 1,
        },
      ];
    });

    setSelectedProductId("");
    setHasCalculated(false);
  };

  const updateQuantity = (productId: number, quantity: string) => {
    const value = Number(quantity);
    if (Number.isNaN(value) || value < 0) return;

    setProductLines((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: value }
          : line,
      ),
    );
    setHasCalculated(false);
  };

  const removeLine = (productId: number) => {
    setProductLines((prev) => prev.filter((line) => line.productId !== productId));
    setHasCalculated(false);
  };

  const handleCalculate = () => {
    if (!brandId || !modelId || !fuelTypeId || !engineId || !location || !year) {
      toast.error(t("operatorPage.workshop.error.requiredVehicleFields"));
      return;
    }

    if (!selectedTemplate) {
      toast.error(t("operatorPage.workshop.error.templateNotFound"));
      return;
    }

    setHasCalculated(true);
  };

 const handleCreateOrder = async () => {
  if (!selectedTemplate || !hasCalculated) return;

  if (
    !vinCode.trim() ||
    !mileageKm.trim() ||
    Number(mileageKm) <= 0 ||
    !orderComment.trim()
  ) {
    toast.error(t("operatorPage.workshop.error.requiredOrderFields"));
    return;
  }

  const services = (selectedTemplate.items ?? [])
    .map((item) => ({
      serviceId: Number(item.serviceId || 0),
      customerPrice: Number(item.customerPrice || 0),
      employeeId: Number(item.employeeId || 0) || undefined,
    }))
    .filter((item) => item.serviceId > 0);

  if (!services.length) {
    toast.error(t("operatorPage.workshop.error.estimateNeedsServices"));
    return;
  }

  const estimate = await onSubmit({
    vehicleBrandId: selectedTemplate.brandId,
    vehicleModelId: selectedTemplate.modelId,
    vehicleYear: selectedTemplate.year,
    vehicleFuelTypeId: selectedTemplate.fuelTypeId,
    vehicleEngineId: selectedTemplate.engineId,
    location: selectedTemplate.location,
    vinCode: vinCode.trim(),
    mileage: Number(mileageKm),
    notes: orderComment.trim(),
    services,
  });

  if (estimate?.estimateNumber) {
    setCreatedEstimate({
      id: Number(estimate.id || 0),
      estimateNumber: String(estimate.estimateNumber),
    });
  }
};

  const handlePrintCheck = () => {
    if (!hasCalculated) {
      toast.error(t("operatorPage.workshop.error.calculateBeforePrint"));
      return;
    }

    if (!createdEstimate?.estimateNumber) {
      toast.error(t("operatorPage.workshop.error.createBeforePrint"));
      return;
    }

    window.print();
  };

  return (
    <div className={styles.workshopCard}>
      <h2 className={sharedStyles.cardTitle}>{t("operatorPage.workshop.title")}</h2>
      <div className={sharedStyles.divider} />

      <div className={styles.fieldBlock}>
        <div className={styles.gridTwo}>
          <Select
            label={t("operatorPage.workshop.fields.brand")}
            value={String(brandId || "")}
            onChange={(e) => {
              setBrandId(Number(e.target.value) || 0);
              setModelId(0);
              setFuelTypeId(0);
              setEngineId(0);
              setLocation("");
              setYear("");
              setHasCalculated(false);
            }}
            disabled={vehicleTemplatesLoading}
            searchable
          >
            <option value="">{t("common.select")}</option>
            {brandOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            label={t("operatorPage.workshop.fields.model")}
            value={String(modelId || "")}
            onChange={(e) => {
              setModelId(Number(e.target.value) || 0);
              setFuelTypeId(0);
              setEngineId(0);
              setLocation("");
              setYear("");
              setHasCalculated(false);
            }}
            disabled={vehicleTemplatesLoading || !brandId}
            searchable
          >
            <option value="">{t("common.select")}</option>
            {modelOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            label={t("operatorPage.workshop.fields.fuelType")}
            value={String(fuelTypeId || "")}
            onChange={(e) => {
              setFuelTypeId(Number(e.target.value) || 0);
              setEngineId(0);
              setLocation("");
              setYear("");
              setHasCalculated(false);
            }}
            disabled={vehicleTemplatesLoading || !brandId || !modelId}
            searchable
          >
            <option value="">{t("common.select")}</option>
            {fuelTypeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            label={t("operatorPage.workshop.fields.engine")}
            value={String(engineId || "")}
            onChange={(e) => {
              setEngineId(Number(e.target.value) || 0);
              setLocation("");
              setYear("");
              setHasCalculated(false);
            }}
            disabled={vehicleTemplatesLoading || !brandId || !modelId || !fuelTypeId}
            searchable
          >
            <option value="">{t("common.select")}</option>
            {engineOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            label={t("operatorPage.workshop.fields.location")}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setYear("");
              setHasCalculated(false);
            }}
            disabled={
              vehicleTemplatesLoading ||
              !brandId ||
              !modelId ||
              !fuelTypeId ||
              !engineId
            }
          >
            <option value="">{t("common.select")}</option>
            {locationOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <Select
            label={t("operatorPage.workshop.fields.year")}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setHasCalculated(false);
            }}
            disabled={
              vehicleTemplatesLoading ||
              !brandId ||
              !modelId ||
              !fuelTypeId ||
              !engineId ||
              !location
            }
          >
            <option value="">{t("common.select")}</option>
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.fieldBlock}>
        <div className={styles.productPickerRow}>
          <Select
            label={t("operatorPage.workshop.fields.product")}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={isProductsLoading}
            searchable
          >
            <option value="">{t("common.select")}</option>
            {productOptions.map((item) => (
              <option key={`${item.stockId}-${item.productId}`} value={item.productId}>
                {item.sku} / {item.code} ({item.salePrice})
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            onClick={addProductLine}
            disabled={!selectedProductId}
          >
            {t("operatorPage.workshop.actions.addProduct")}
          </Button>
        </div>

        <div className={styles.productLines}>
          {productLines.length === 0 ? (
            <div className={styles.emptyProducts}>{t("operatorPage.workshop.emptyProducts")}</div>
          ) : (
            productLines.map((line) => (
              <div key={line.productId} className={styles.productLine}>
                <div className={styles.productCode}>{line.code}</div>
                <TextField
                  type="number"
                  value={String(line.quantity)}
                  onChange={(e) => updateQuantity(line.productId, e.target.value)}
                  label={t("operatorPage.workshop.fields.quantity")}
                />
                <div className={styles.productPrice}>{line.unitPrice.toLocaleString()} AMD</div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeLine(line.productId)}
                >
                  {t("common.remove")}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.fieldBlock}>
        <div className={styles.orderInfoBlock}>
          <div className={styles.orderInfoTitle}>{t("operatorPage.workshop.orderInfo.title")}</div>
          <div className={styles.gridTwo}>
            <TextField
              label={t("operatorPage.workshop.fields.vinCode")}
              value={vinCode}
              onChange={(e) => setVinCode(e.target.value.toUpperCase())}
              placeholder="WVWZZZ1JZXW000001"
            />
            <TextField
              type="number"
              label={t("operatorPage.workshop.fields.mileageKm")}
              value={mileageKm}
              onChange={(e) => setMileageKm(e.target.value)}
              placeholder="150000"
            />
          </div>
          <Textarea
            label={t("operatorPage.workshop.commentLabel")}
            value={orderComment}
            onChange={(e) => setOrderComment(e.target.value)}
            placeholder={t("operatorPage.workshop.commentPlaceholder")}
            rows={4}
          />
        </div>
      </div>

      <div ref={resultsRef} className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span>{t("operatorPage.workshop.mechanicPrice")}</span>
          <strong>{servicesPrice.toLocaleString()} AMD</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>{t("operatorPage.workshop.electricianPrice")}</span>
          <strong>{electricityPrice.toLocaleString()} AMD</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>{t("operatorPage.workshop.sparePartsPrice")}</span>
          <strong>{productsPrice.toLocaleString()} AMD</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>{t("operatorPage.workshop.totalAmount")}</span>
          <strong>{totalPrice.toLocaleString()} AMD</strong>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <Button
          variant="secondary"
          onClick={handleCalculate}
          disabled={vehicleTemplatesLoading || isSubmitting}
        >
          {t("operatorPage.workshop.actions.calculate")}
        </Button>
        <Button
          variant="secondary"
          onClick={handlePrintCheck}
          disabled={!hasCalculated || !createdEstimate?.estimateNumber}
        >
          {t("operatorPage.workshop.actions.printCheck")}
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateOrder}
          disabled={!hasCalculated || isSubmitting}
          className={styles.submitButton}
        >
          {t("operatorPage.workshop.createOrder")}
        </Button>
      </div>

      {hasCalculated && (
        <div className={styles.printArea}>
          <div className={styles.receiptBlock}>
            <div className={styles.receiptHeader}>
              <div>
                <div className={styles.receiptTitle}>{t("operatorPage.workshop.receipt.title")}</div>
                <div className={styles.receiptSubtitle}>{t("operatorPage.workshop.receipt.subtitle")}</div>
                <div className={styles.receiptHeaderMeta}>
                  <span>
                    {t("operatorPage.workshop.receipt.cashRegister")}: {cashRegisterName || "-"}
                  </span>
                  <span>
                    {t("operatorPage.workshop.receipt.operator")}: {operatorName || "-"}
                  </span>
                  <span>
                    {t("operatorPage.workshop.receipt.estimateNumber")}: {createdEstimate?.estimateNumber || "-"}
                  </span>
                </div>
              </div>
              <div className={styles.receiptMeta}>{printedAt}</div>
            </div>

            <div className={styles.receiptSection}>
              <div className={styles.receiptSectionTitle}>{t("operatorPage.workshop.receipt.vehicleSection")}</div>
              <div className={styles.receiptGrid}>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.brand")}</span>
                  <strong>{brandOptions.find((item) => item.id === brandId)?.name || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.model")}</span>
                  <strong>{modelOptions.find((item) => item.id === modelId)?.name || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.year")}</span>
                  <strong>{year || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.location")}</span>
                  <strong>{location || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.fuelType")}</span>
                  <strong>{fuelTypeOptions.find((item) => item.id === fuelTypeId)?.name || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.engine")}</span>
                  <strong>{engineOptions.find((item) => item.id === engineId)?.name || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.vinCode")}</span>
                  <strong>{vinCode || "-"}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.mileageKm")}</span>
                  <strong>{mileageKm || "-"} km</strong>
                </div>
              </div>
            </div>

            {productLines.length > 0 && (
              <div className={styles.receiptSection}>
                <div className={styles.receiptSectionTitle}>{t("operatorPage.workshop.receipt.productsSection")}</div>
                <div className={styles.receiptProductsList}>
                  {productLines.map((line) => (
                    <div key={line.productId} className={styles.receiptProductRow}>
                      <div className={styles.receiptProductCode}>{line.code}</div>
                      <div className={styles.receiptProductMeta}>
                        <span>{t("operatorPage.workshop.receipt.productSku")}: {line.sku || "-"}</span>
                        <span>{t("operatorPage.workshop.fields.quantity")}: {line.quantity}</span>
                        <span>{line.unitPrice.toLocaleString()} AMD</span>
                        <strong>{(line.quantity * line.unitPrice).toLocaleString()} AMD</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.receiptSection}>
              <div className={styles.receiptSectionTitle}>{t("operatorPage.workshop.receipt.summarySection")}</div>
              <div className={styles.receiptRow}>
                <span>{t("operatorPage.workshop.receipt.serviceTotal")}</span>
                <strong>{servicesPrice.toLocaleString()} AMD</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>{t("operatorPage.workshop.receipt.electricityTotal")}</span>
                <strong>{electricityPrice.toLocaleString()} AMD</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>{t("operatorPage.workshop.receipt.productsTotal")}</span>
                <strong>{productsPrice.toLocaleString()} AMD</strong>
              </div>
              <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
                <span>{t("operatorPage.workshop.totalAmount")}</span>
                <strong>{totalPrice.toLocaleString()} AMD</strong>
              </div>
            </div>

            <div className={styles.receiptSection}>
              <div className={styles.receiptSectionTitle}>{t("operatorPage.workshop.commentLabel")}</div>
              <div className={styles.receiptComment}>{orderComment || "-"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
