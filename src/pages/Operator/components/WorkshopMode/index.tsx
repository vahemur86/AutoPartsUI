import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Checkbox, Select, TextField, Textarea } from "@/ui-kit";
import { useTranslation } from "react-i18next";
import { CountryPhoneInput } from "@/components/common/CountryPhoneInput";
import type { CountryCode } from "libphonenumber-js";

import sharedStyles from "../../OperatorPage.module.css";
import styles from "./WorkshopMode.module.css";
import {
  getEmployeeServicePercentagesByService,
  getEmployeesOnDuty,
  getProgrammingServicesWithPricing,
  getServiceCategories,
} from "@/services/settings/workshopPricing";
import { getCategoriesTree } from "@/services/settings/productSettings";
import { getShopProducts } from "@/services/warehouses/warehouseProduct";
import type { CategoryNode, EmployeeItem, EmployeeServicePercentageItem, ServiceCategoryItem } from "@/types/settings";
import type { VehicleServiceTemplateItem } from "@/types/settings";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";
import { isProgrammingServiceCategory } from "@/constants/serviceCategories";

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
    customerPhone: string;
    notes: string;
    services: Array<{
      serviceId: number;
      customerPrice: number;
      employeeId?: number;
    }>;
    products: Array<{
      shopStockId: number;
      productId: number;
      quantity: number;
      unitPrice: number;
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

type ProductOption = {
  stockId: number;
  productId: number;
  sku: string;
  code: string;
  salePrice: number;
  categoryId: number;
  categoryPath: number[];
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
  serviceCategoryId: number;
  serviceCategoryName?: string;
  isActive: boolean;
  items: Array<{
    serviceId: number;
    serviceName?: string;
    customerPrice?: number;
    employeeId?: number;
    serviceCategoryId?: number;
    serviceCategoryName?: string;
    isProgrammerService?: boolean;
    hasProgrammerPricing?: boolean;
    bestProgrammerUsername?: string | null;
    programmerServiceCost?: number | null;
    programmerSellingPrice?: number | null;
    programmerProfit?: number | null;
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
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [products, setProducts] = useState<ShopProductItem[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  const [brandId, setBrandId] = useState(0);
  const [modelId, setModelId] = useState(0);
  const [fuelTypeId, setFuelTypeId] = useState(0);
  const [engineId, setEngineId] = useState(0);
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [vinCode, setVinCode] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [orderComment, setOrderComment] = useState("");
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productLines, setProductLines] = useState<WorkshopProductLine[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [onDutyEmployees, setOnDutyEmployees] = useState<EmployeeItem[]>([]);
  const [selectedEmployeeByServiceId, setSelectedEmployeeByServiceId] = useState<Record<number, number>>({});
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryItem[]>([]);
  const [serviceEmployeePercentagesByServiceId, setServiceEmployeePercentagesByServiceId] = useState<
    Record<number, EmployeeServicePercentageItem[]>
  >({});
  const [programmingVehicleServices, setProgrammingVehicleServices] = useState<
    NormalizedTemplate["items"] | null
  >(null);
  const [isProgrammingServicesLoading, setIsProgrammingServicesLoading] = useState(false);
  const [isOnDutyLoading, setIsOnDutyLoading] = useState(false);
  const [isServiceEmployeePercentagesLoading, setIsServiceEmployeePercentagesLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [createdEstimate, setCreatedEstimate] = useState<{
    id: number;
    estimateNumber: string;
  } | null>(null);

  useEffect(() => {
    if (!cashRegisterId || !shopId) return;

    const loadProducts = async () => {
      setIsProductsLoading(true);
      setIsCategoriesLoading(true);
      try {
        const [productsResponse, categoriesResponse, serviceCategoriesResponse] =
          await Promise.all([
            getShopProducts({
              shopId,
              cashRegisterId,
            }),
            getCategoriesTree(cashRegisterId),
            getServiceCategories(cashRegisterId),
          ]);

        setProducts(productsResponse);
        setCategoryTree(categoriesResponse.rootCategories ?? []);
        setServiceCategories(serviceCategoriesResponse || []);
      } catch {
        toast.error(t("operatorPage.workshop.error.loadProductsFailed"));
      } finally {
        setIsProductsLoading(false);
        setIsCategoriesLoading(false);
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
        const rawCategories = Array.isArray(raw.categories)
          ? (raw.categories as Array<Record<string, unknown>>)
          : [];
        const normalizedFromItems = Array.isArray(raw.items)
          ? (raw.items
              .map((i: Record<string, unknown>) => ({
                serviceId: Number(i.serviceId ?? 0),
                serviceName: String(i.serviceName ?? i.serviceCode ?? "").trim() || undefined,
                customerPrice:
                  i.customerPrice != null ? Number(i.customerPrice) : undefined,
                employeeId: i.employeeId != null ? Number(i.employeeId) : undefined,
                serviceCategoryId:
                  i.serviceCategoryId != null ? Number(i.serviceCategoryId) : undefined,
                serviceCategoryName:
                  i.serviceCategoryName != null
                    ? String(i.serviceCategoryName)
                    : undefined,
                isProgrammerService:
                  i.isProgrammerService != null
                    ? Boolean(i.isProgrammerService)
                    : undefined,
                hasProgrammerPricing:
                  i.hasProgrammerPricing != null
                    ? Boolean(i.hasProgrammerPricing)
                    : Boolean(i["hasПrogrammerPricing"]),
                bestProgrammerUsername:
                  i.bestProgrammerUsername != null
                    ? String(i.bestProgrammerUsername)
                    : null,
                programmerServiceCost:
                  i.programmerServiceCost != null
                    ? Number(i.programmerServiceCost)
                    : null,
                programmerSellingPrice:
                  i.programmerSellingPrice != null
                    ? Number(i.programmerSellingPrice)
                    : null,
                programmerProfit:
                  i.programmerProfit != null
                    ? Number(i.programmerProfit)
                    : null,
              }))
              .filter((i) => i.serviceId > 0))
          : [];

        const normalizedFromCategories = rawCategories.flatMap((category) => {
          const categoryId = Number(category.serviceCategoryId ?? 0);
          const categoryName =
            category.serviceCategoryName != null
              ? String(category.serviceCategoryName)
              : undefined;
          const categoryIsProgrammer =
            category.isProgrammerCategory != null
              ? Boolean(category.isProgrammerCategory)
              : undefined;

          const categoryServices = Array.isArray(category.items)
            ? (category.items as Array<Record<string, unknown>>)
            : Array.isArray(category.services)
              ? (category.services as Array<Record<string, unknown>>)
              : [];

          if (categoryServices.length === 0) {
            return [];
          }

          return categoryServices
            .map((service) => ({
              serviceId: Number(service.serviceId ?? 0),
              serviceName:
                String(service.serviceName ?? service.serviceCode ?? "").trim() ||
                undefined,
              customerPrice:
                service.customerPrice != null
                  ? Number(service.customerPrice)
                  : undefined,
              employeeId:
                service.employeeId != null ? Number(service.employeeId) : undefined,
              serviceCategoryId: categoryId > 0 ? categoryId : undefined,
              serviceCategoryName: categoryName,
              isProgrammerService:
                service.isProgrammerService != null
                  ? Boolean(service.isProgrammerService)
                  : categoryIsProgrammer,
              hasProgrammerPricing:
                service.hasProgrammerPricing != null
                  ? Boolean(service.hasProgrammerPricing)
                  : Boolean(service["hasПrogrammerPricing"]),
              bestProgrammerUsername:
                service.bestProgrammerUsername != null
                  ? String(service.bestProgrammerUsername)
                  : null,
              programmerServiceCost:
                service.programmerServiceCost != null
                  ? Number(service.programmerServiceCost)
                  : null,
              programmerSellingPrice:
                service.programmerSellingPrice != null
                  ? Number(service.programmerSellingPrice)
                  : null,
              programmerProfit:
                service.programmerProfit != null
                  ? Number(service.programmerProfit)
                  : null,
            }))
            .filter((service) => service.serviceId > 0);
        });

        const items =
          normalizedFromItems.length > 0
            ? normalizedFromItems
            : normalizedFromCategories;

        const fallbackCategoryId = Number(raw.serviceCategoryId ?? 0);
        const derivedCategoryId =
          fallbackCategoryId > 0
            ? fallbackCategoryId
            : Number(rawCategories[0]?.serviceCategoryId ?? 0);
        const fallbackCategoryName =
          raw.serviceCategoryName != null
            ? String(raw.serviceCategoryName)
            : rawCategories[0]?.serviceCategoryName != null
              ? String(rawCategories[0]?.serviceCategoryName)
              : undefined;

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
          serviceCategoryId: derivedCategoryId,
          serviceCategoryName: fallbackCategoryName,
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

  useEffect(() => {
    setSelectedCategoryPath([]);
    setSelectedProductId("");
  }, [categoryTree, products]);

  const categoryParentById = useMemo(() => {
    const parentMap = new Map<number, number | null>();

    const walk = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        parentMap.set(node.id, node.parentCategoryId ?? null);
        if (Array.isArray(node.subCategories) && node.subCategories.length > 0) {
          walk(node.subCategories);
        }
      });
    };

    walk(categoryTree);
    return parentMap;
  }, [categoryTree]);

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

  const selectedTemplateServiceCategory = useMemo(() => {
    if (!selectedTemplate) return undefined;
    return serviceCategories.find(
      (category) => category.id === selectedTemplate.serviceCategoryId,
    );
  }, [selectedTemplate, serviceCategories]);

  const isSelectedTemplateProgramming = useMemo(
    () =>
      isProgrammingServiceCategory(selectedTemplateServiceCategory?.code) ||
      isProgrammingServiceCategory(selectedTemplateServiceCategory?.name) ||
      isProgrammingServiceCategory(selectedTemplate?.serviceCategoryName),
    [selectedTemplate, selectedTemplateServiceCategory],
  );

  useEffect(() => {
    setSelectedServiceIds([]);
    setOnDutyEmployees([]);
    setSelectedEmployeeByServiceId({});
    setProgrammingVehicleServices(null);
    setHasCalculated(false);
  }, [selectedTemplate?.id]);

  useEffect(() => {
    if (!selectedTemplate) {
      setProgrammingVehicleServices(null);
      setIsProgrammingServicesLoading(false);
      return;
    }

    const selectedIds = new Set(selectedServiceIds);
    const selectedProgrammerIds = (selectedTemplate.items ?? [])
      .filter(
        (item) =>
          item.isProgrammerService &&
          selectedIds.has(Number(item.serviceId || 0)) &&
          Number(item.serviceId || 0) > 0,
      )
      .map((item) => Number(item.serviceId || 0));

    if (selectedProgrammerIds.length === 0) {
      setProgrammingVehicleServices(null);
      setIsProgrammingServicesLoading(false);
      return;
    }

    const loadProgrammingServices = async () => {
      try {
        setIsProgrammingServicesLoading(true);

        const response = await getProgrammingServicesWithPricing({
          brandId: Number(selectedTemplate.brandId || 0),
          modelId: Number(selectedTemplate.modelId || 0),
          year: Number(selectedTemplate.year || 0),
          fuelTypeId: Number(selectedTemplate.fuelTypeId || 0),
          engineId: Number(selectedTemplate.engineId || 0),
        }, cashRegisterId);

        const apiServices = response
          .filter((item) => Number(item.id || 0) > 0)
          .map((item) => ({
            serviceId: Number(item.id || 0),
            serviceName: item.name || item.code || `#${item.id}`,
            customerPrice: item.programmerSellingPrice ?? 0,
            employeeId: undefined,
            hasProgrammerPricing: Boolean(item.hasProgrammerPricing),
            bestProgrammerUsername: item.bestProgrammerUsername ?? null,
            programmerServiceCost: item.programmerServiceCost ?? null,
            programmerSellingPrice: item.programmerSellingPrice ?? null,
            programmerProfit: item.programmerProfit ?? null,
          }));

        const apiServiceById = new Map(
          apiServices.map((service) => [service.serviceId, service]),
        );

        const templateServices = (selectedTemplate.items ?? []).filter(
          (item) => Number(item.serviceId || 0) > 0 && item.isProgrammerService,
        );

        const mergedTemplateServices = templateServices.map((templateItem) => {
          const serviceId = Number(templateItem.serviceId || 0);
          const matchedApi = apiServiceById.get(serviceId);

          if (matchedApi) {
            apiServiceById.delete(serviceId);
            return {
              ...matchedApi,
              serviceName:
                matchedApi.serviceName ||
                templateItem.serviceName ||
                `#${serviceId}`,
            };
          }

          return {
            serviceId,
            serviceName: templateItem.serviceName || `#${serviceId}`,
            customerPrice: Number(templateItem.customerPrice || 0),
            employeeId: templateItem.employeeId,
            hasProgrammerPricing: false,
            bestProgrammerUsername: null,
            serviceCategoryId: templateItem.serviceCategoryId,
            serviceCategoryName: templateItem.serviceCategoryName,
            isProgrammerService: true,
            programmerServiceCost: null,
            programmerSellingPrice: null,
            programmerProfit: null,
          };
        });

        const remainingApiServices = Array.from(apiServiceById.values());

        const services = [...mergedTemplateServices, ...remainingApiServices];

        setProgrammingVehicleServices(services);
      } catch {
        setProgrammingVehicleServices([]);
        toast.error(t("operatorPage.workshop.error.loadProgrammingServicesFailed"));
      } finally {
        setIsProgrammingServicesLoading(false);
      }
    };

    void loadProgrammingServices();
  }, [cashRegisterId, selectedServiceIds, selectedTemplate, t]);

  useEffect(() => {
    const selectedIds = new Set(selectedServiceIds);
    const selectedProgrammerServices = (selectedTemplate?.items ?? []).filter(
      (item) =>
        item.isProgrammerService &&
        selectedIds.has(Number(item.serviceId || 0)) &&
        Number(item.serviceId || 0) > 0,
    );

    const programmerCategoryId = selectedProgrammerServices.find(
      (item) => Number(item.serviceCategoryId || 0) > 0,
    )?.serviceCategoryId;

    if (!shopId || !programmerCategoryId || selectedProgrammerServices.length === 0) {
      setOnDutyEmployees([]);
      return;
    }

    const loadOnDutyEmployees = async () => {
      try {
        setIsOnDutyLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        const employees = await getEmployeesOnDuty({
          shopId,
          serviceCategoryId: Number(programmerCategoryId || 0),
          date: today,
          cashRegisterId,
        });
        setOnDutyEmployees(employees);
      } catch {
        setOnDutyEmployees([]);
      } finally {
        setIsOnDutyLoading(false);
      }
    };

    void loadOnDutyEmployees();
  }, [
    cashRegisterId,
    selectedServiceIds,
    selectedTemplate,
    shopId,
  ]);

  const productOptions = useMemo<ProductOption[]>(
    () =>
      products
        .filter((item) => Number(item.productId || item.product?.id || 0) > 0)
        .map((item) => ({
          categoryId: Number(item.product?.categoryId || 0),
          stockId: item.id,
          productId: Number(item.productId || item.product?.id || 0),
          sku: (item.product?.sku || item.product?.code || `#${item.productId}`).trim(),
          code: (item.product?.code || item.product?.sku || `#${item.productId}`).trim(),
          salePrice: Number(item.salePrice || 0),
          categoryPath: [],
        }))
        .map((item) => {
          const categoryId = item.categoryId;
          if (!categoryId || !categoryParentById.has(categoryId)) {
            return item;
          }

          const path: number[] = [];
          let current: number | null = categoryId;

          while (current != null && current > 0) {
            path.push(current);
            current = categoryParentById.get(current) ?? null;
          }

          return {
            ...item,
            categoryPath: path.reverse(),
          };
        }),
    [products, categoryParentById],
  );

  const categorySelection = useMemo(() => {
    const levels: Array<Array<{ id: number; name: string }>> = [];
    let resolvedPath: number[] = [];
    let currentNodes = categoryTree;
    let lastSelectedNode: CategoryNode | null = null;

    while (Array.isArray(currentNodes) && currentNodes.length > 0) {
      const nextOptions = currentNodes
        .map((node) => ({
          id: Number(node.id || 0),
          name: String(node.name || node.code || `#${node.id}`),
        }))
        .filter((node) => node.id > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!nextOptions.length) {
        break;
      }

      levels.push(nextOptions);

      const selectedId = selectedCategoryPath[resolvedPath.length];
      if (!selectedId) {
        break;
      }

      const selectedNode = currentNodes.find(
        (node) => Number(node.id || 0) === Number(selectedId),
      );
      if (!selectedNode) {
        break;
      }

      resolvedPath = [...resolvedPath, selectedId];
      lastSelectedNode = selectedNode;
      currentNodes = Array.isArray(selectedNode.subCategories)
        ? selectedNode.subCategories
        : [];
    }

    const isLeafSelected =
      !!lastSelectedNode &&
      (Array.isArray(lastSelectedNode.subCategories)
        ? lastSelectedNode.subCategories.length === 0
        : true);

    const selectedCategoryCanHaveProducts =
      !!lastSelectedNode && lastSelectedNode.canHaveProducts === true;

    return {
      levels,
      resolvedPath,
      isComplete:
        resolvedPath.length > 0 && (isLeafSelected || selectedCategoryCanHaveProducts),
    };
  }, [categoryTree, selectedCategoryPath]);

  const selectedCategoryBreadcrumb = useMemo(
    () =>
      categorySelection.resolvedPath
        .map((id, levelIndex) => {
          const label = categorySelection.levels[levelIndex]?.find(
            (item) => item.id === id,
          )?.name;
          return label || `#${id}`;
        })
        .join(" > "),
    [categorySelection],
  );

  const filteredProductOptions = useMemo(() => {
    if (!categorySelection.isComplete) return [];

    return productOptions.filter((item) =>
      categorySelection.resolvedPath.every(
        (id, index) => item.categoryPath[index] === id,
      ),
    );
  }, [productOptions, categorySelection]);

  const renderedServiceLines = useMemo(() => {
    const baseServices = selectedTemplate?.items ?? [];
    if (!programmingVehicleServices?.length) {
      return baseServices;
    }

    const programmingByServiceId = new Map(
      programmingVehicleServices.map((item) => [Number(item.serviceId || 0), item]),
    );

    return baseServices.map((line) => {
      const serviceId = Number(line.serviceId || 0);
      const override = programmingByServiceId.get(serviceId);

      if (!override) {
        return line;
      }

      return {
        ...line,
        ...override,
        serviceName: override.serviceName || line.serviceName,
      };
    });
  }, [programmingVehicleServices, selectedTemplate]);

  const getServiceLinePrice = (item: NormalizedTemplate["items"][number]) => {
    if (item.isProgrammerService) {
      if (item.hasProgrammerPricing) {
        return Number(item.programmerSellingPrice || 0);
      }
      return 0;
    }

    return Number(item.customerPrice || 0);
  };

  const selectedServiceLines = useMemo(
    () =>
      renderedServiceLines.filter((item) =>
        selectedServiceIds.includes(Number(item.serviceId || 0)),
      ),
    [renderedServiceLines, selectedServiceIds],
  );

  const selectedNonProgrammerServiceIds = useMemo(
    () =>
      selectedServiceLines
        .filter((line) => !line.isProgrammerService)
        .map((line) => Number(line.serviceId || 0))
        .filter((id) => id > 0),
    [selectedServiceLines],
  );

  const assignedEmployeeByServiceId = useMemo(() => {
    const assignments = new Map<number, EmployeeItem | null>();
    if (!selectedServiceLines.length) return assignments;

    let onDutyIndex = 0;
    selectedServiceLines.forEach((line) => {
      const serviceId = Number(line.serviceId || 0);
      if (serviceId <= 0) return;

      const templateEmployeeId = Number(line.employeeId || 0);

      if (line.isProgrammerService) {
        if (templateEmployeeId > 0) {
          const fromOnDutyTemplate = onDutyEmployees.find(
            (employee) => Number(employee.id || 0) === templateEmployeeId,
          );
          assignments.set(serviceId, fromOnDutyTemplate ?? null);
          return;
        }

        if (!onDutyEmployees.length) {
          assignments.set(serviceId, null);
          return;
        }

        const assigned = onDutyEmployees[onDutyIndex % onDutyEmployees.length] ?? null;
        onDutyIndex += 1;
        assignments.set(serviceId, assigned);
        return;
      }

      const percentages = serviceEmployeePercentagesByServiceId[serviceId] ?? [];
      if (templateEmployeeId > 0) {
        const matchedTemplateEmployee = percentages.find(
          (item) => Number(item.employeeId || 0) === templateEmployeeId,
        );

        if (matchedTemplateEmployee) {
          assignments.set(serviceId, {
            id: Number(matchedTemplateEmployee.employeeId || 0),
            fullName:
              matchedTemplateEmployee.employeeFullName ||
              `#${matchedTemplateEmployee.employeeId}`,
          } as EmployeeItem);
          return;
        }
      }

      if (!percentages.length) {
        assignments.set(serviceId, null);
        return;
      }

      const bestByPercentage = percentages.reduce((best, current) =>
        Number(current.percentage || 0) < Number(best.percentage || 0)
          ? current
          : best,
      );

      assignments.set(serviceId, {
        id: Number(bestByPercentage.employeeId || 0),
        fullName: bestByPercentage.employeeFullName || `#${bestByPercentage.employeeId}`,
      } as EmployeeItem);
    });

    return assignments;
  }, [
    onDutyEmployees,
    selectedServiceLines,
    serviceEmployeePercentagesByServiceId,
  ]);

  useEffect(() => {
    if (selectedNonProgrammerServiceIds.length === 0) {
      setServiceEmployeePercentagesByServiceId({});
      return;
    }

    const loadServiceEmployeePercentages = async () => {
      try {
        setIsServiceEmployeePercentagesLoading(true);
        const serviceIds = Array.from(new Set(selectedNonProgrammerServiceIds));

        const results = await Promise.all(
          serviceIds.map((serviceId) =>
            getEmployeeServicePercentagesByService(serviceId, cashRegisterId).then((items) => ({
              serviceId,
              items,
            })),
          ),
        );

        setServiceEmployeePercentagesByServiceId(
          results.reduce<Record<number, EmployeeServicePercentageItem[]>>(
            (acc, result) => ({
              ...acc,
              [result.serviceId]: Array.isArray(result.items) ? result.items : [],
            }),
            {},
          ),
        );
      } catch {
        setServiceEmployeePercentagesByServiceId({});
      } finally {
        setIsServiceEmployeePercentagesLoading(false);
      }
    };

    void loadServiceEmployeePercentages();
  }, [cashRegisterId, selectedNonProgrammerServiceIds]);

  const servicesPrice = useMemo(
    () =>
      selectedServiceLines.reduce(
        (sum, item) => sum + getServiceLinePrice(item),
        0,
      ),
    [selectedServiceLines, isSelectedTemplateProgramming],
  );

  const productsPrice = useMemo(
    () =>
      productLines.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [productLines],
  );

  const totalPrice = servicesPrice + productsPrice;
  const printedAt = useMemo(() => new Date().toLocaleString(), [hasCalculated]);

  const addProductLine = () => {
    const stockId = Number(selectedProductId || 0);
    if (!stockId) return;

    const selected = filteredProductOptions.find((item) => item.stockId === stockId);
    if (!selected) return;

    setProductLines((prev) => {
      const existing = prev.find((line) => line.shopStockId === stockId);
      if (existing) {
        return prev.map((line) =>
          line.shopStockId === stockId
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

  const updateQuantity = (shopStockId: number, quantity: string) => {
    const value = Number(quantity);
    if (Number.isNaN(value) || value < 0) return;

    setProductLines((prev) =>
      prev.map((line) =>
        line.shopStockId === shopStockId
          ? { ...line, quantity: value }
          : line,
      ),
    );
    setHasCalculated(false);
  };

  const removeLine = (shopStockId: number) => {
    setProductLines((prev) => prev.filter((line) => line.shopStockId !== shopStockId));
    setHasCalculated(false);
  };

  const createEstimate = async () => {
    if (!selectedTemplate || !hasCalculated) return null;

    if (
      !vinCode.trim() ||
      !mileageKm.trim() ||
      Number(mileageKm) <= 0 ||
      !customerPhone.trim() ||
      !orderComment.trim()
    ) {
      toast.error(t("operatorPage.workshop.error.requiredOrderFields"));
      return null;
    }

    const services = selectedServiceLines
      .map((item) => {
        const serviceId = Number(item.serviceId || 0);
        const assignedEmployeeId = Number(
          (selectedEmployeeByServiceId[serviceId] ?? assignedEmployeeByServiceId.get(serviceId)?.id) || 0,
        );

        return {
          serviceId,
          customerPrice: getServiceLinePrice(item),
          employeeId:
            Number(item.employeeId || 0) ||
            assignedEmployeeId ||
            undefined,
        };
      })
      .filter((item) => item.serviceId > 0);

    if (!services.length) {
      toast.error(t("operatorPage.workshop.error.estimateNeedsServices"));
      return null;
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
      customerPhone: customerPhone.trim(),
      notes: orderComment.trim(),
      services,
      products: productLines.map((line) => ({
        shopStockId: line.shopStockId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });

    return estimate ?? null;
  };

  const resetWorkshopState = (options?: { keepEstimate?: boolean }) => {
    setBrandId(0);
    setModelId(0);
    setFuelTypeId(0);
    setEngineId(0);
    setLocation("");
    setYear("");
    setVinCode("");
    setMileageKm("");
    setCustomerPhone("");
    setOrderComment("");
    setSelectedCategoryPath([]);
    setSelectedProductId("");
    setProductLines([]);
    setSelectedServiceIds([]);
    setOnDutyEmployees([]);
    // When keepEstimate is true, preserve `createdEstimate` so printing remains available
    if (!options?.keepEstimate) {
      setHasCalculated(false);
      setCreatedEstimate(null);
    }
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

    if (!selectedServiceLines.length) {
      toast.error(t("operatorPage.workshop.error.selectAtLeastOneService"));
      return;
    }

    setHasCalculated(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedTemplate || !hasCalculated) return;

    const estimate = await createEstimate();
    if (estimate?.estimateNumber) {
      setCreatedEstimate(estimate);
      // success toast is shown by the shared order creation hook
    }
  };

  const handlePrintCheck = () => {
    if (!createdEstimate?.estimateNumber) {
      toast.error(t("operatorPage.workshop.error.createBeforePrint"));
      return;
    }

    // Print only after order creation so receipt includes order number,
    // then clear the workshop state for next order.
    window.print();
    resetWorkshopState();
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
        {selectedTemplate && (renderedServiceLines.length > 0 || isProgrammingServicesLoading) && (
          <div className={styles.servicesSelector}>
            <div className={styles.orderInfoTitle}>{t("operatorPage.workshop.fields.services")}</div>
            {isSelectedTemplateProgramming && isProgrammingServicesLoading && (
              <div className={styles.emptyProducts}>
                {t("operatorPage.workshop.programming.loading")}
              </div>
            )}
            <div className={styles.servicesList}>
              {renderedServiceLines.map((line) => {
                const serviceId = Number(line.serviceId || 0);
                const checked = selectedServiceIds.includes(serviceId);
                const assignedEmployee = assignedEmployeeByServiceId.get(serviceId) ?? null;
                const servicePercentageEmployees =
                  serviceEmployeePercentagesByServiceId[serviceId] ?? [];
                return (
                  <div key={serviceId} className={styles.serviceLine}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedServiceIds((prev) => {
                          if (value) {
                            return prev.includes(serviceId) ? prev : [...prev, serviceId];
                          }
                          return prev.filter((id) => id !== serviceId);
                        });
                        setHasCalculated(false);
                      }}
                    />
                    <div className={styles.serviceLineText}>
                      <span>{line.serviceName || `#${serviceId}`}</span>
                      <strong>{getServiceLinePrice(line).toLocaleString()} AMD</strong>
                    </div>
                    {checked && (
                      <div className={styles.emptyProducts}>
                        {isOnDutyLoading || isServiceEmployeePercentagesLoading ? (
                          t("operatorPage.workshop.onDuty.loading")
                        ) : line.isProgrammerService && assignedEmployee ? (
                          t("operatorPage.workshop.onDuty.assigned", {
                            employee: assignedEmployee.fullName,
                          })
                        ) : line.isProgrammerService && onDutyEmployees.length ? (
                          <div>
                            {onDutyEmployees.map((emp, idx) => (
                              <span key={emp.id}>
                                {emp.fullName}
                                {idx < onDutyEmployees.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        ) : !line.isProgrammerService && servicePercentageEmployees.length ? (
                          <div>
                            {servicePercentageEmployees.map((emp, idx) => (
                              <span key={`${serviceId}-${emp.employeeId}`}>
                                {emp.employeeFullName || `#${emp.employeeId}`}
                                {idx < servicePercentageEmployees.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        ) : assignedEmployee ? (
                          t("operatorPage.workshop.onDuty.assigned", {
                            employee: assignedEmployee.fullName,
                          })
                        ) : (
                          t("operatorPage.workshop.onDuty.none")
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.productPickerRow}>
          {selectedCategoryBreadcrumb ? (
            <div className={styles.categoryBreadcrumb}>
              {selectedCategoryBreadcrumb}
            </div>
          ) : null}

          {categorySelection.levels.map((options, levelIndex) => (
            <Select
              key={`category-level-${levelIndex}`}
              label={
                levelIndex === 0
                  ? t("operatorPage.workshop.fields.parentCategory")
                  : t("operatorPage.workshop.fields.categoryLevel", {
                      level: levelIndex + 1,
                    })
              }
              value={String(selectedCategoryPath[levelIndex] || "")}
              onChange={(e) => {
                const selectedId = Number(e.target.value) || 0;
                setSelectedCategoryPath((prev) => {
                  const next = prev.slice(0, levelIndex);
                  if (selectedId > 0) {
                    next[levelIndex] = selectedId;
                  }
                  return next;
                });
                setSelectedProductId("");
              }}
              disabled={
                isProductsLoading ||
                isCategoriesLoading ||
                (levelIndex > 0 && !selectedCategoryPath[levelIndex - 1])
              }
              searchable
            >
              <option value="">{t("common.select")}</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          ))}

          <Select
            label={t("operatorPage.workshop.fields.product")}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={
              isProductsLoading ||
              isCategoriesLoading ||
              !categorySelection.isComplete
            }
            searchable
          >
            <option value="">{t("common.select")}</option>
            {filteredProductOptions.map((item) => (
              <option key={`${item.stockId}-${item.productId}`} value={item.stockId}>
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
          {productLines.length === 0 ? (
            <div className={styles.emptyProducts}>{t("operatorPage.workshop.emptyProducts")}</div>
          ) : (
            productLines.map((line) => (
              <div key={line.shopStockId} className={styles.productLine}>
                <div className={styles.productCode}>{line.code}</div>
                <TextField
                  type="number"
                  value={String(line.quantity)}
                  onChange={(e) => updateQuantity(line.shopStockId, e.target.value)}
                  label={t("operatorPage.workshop.fields.quantity")}
                />
                <div className={styles.productPrice}>{line.unitPrice.toLocaleString()} AMD</div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeLine(line.shopStockId)}
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
            <div>
              <label className={sharedStyles.fieldLabel}>{t("operatorPage.workshop.fields.customerPhone")}</label>
              <CountryPhoneInput
                phone={customerPhone}
                selectedCountry={selectedCountry}
                onCountryChange={(c) => {
                  setSelectedCountry(c);
                  // reset phone local part when country changes
                  setCustomerPhone("");
                }}
                onPhoneChange={(full) => setCustomerPhone(full)}
              />
            </div>
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
          <span>{t("operatorPage.workshop.sparePartsPrice")}</span>
          <strong>{productsPrice.toLocaleString()} AMD</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>{t("operatorPage.workshop.totalAmount")}</span>
          <strong>{totalPrice.toLocaleString()} AMD</strong>
        </div>
      </div>

      {selectedServiceLines.length > 0 && (
        <div className={styles.selectedServicesBreakdown}>
          <div className={styles.selectedServicesTitle}>
            {t("operatorPage.workshop.receipt.servicesSection")}
          </div>
          <div className={styles.selectedServicesList}>
            {selectedServiceLines.map((line) => (
              <div key={line.serviceId} className={styles.selectedServiceRow}>
                <span>{line.serviceName || `#${line.serviceId}`}</span>
                <strong>{getServiceLinePrice(line).toLocaleString()} AMD</strong>
              </div>
            ))}
          </div>
        </div>
      )}

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
          disabled={!createdEstimate?.estimateNumber}
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
                <div className={styles.receiptRow}>
                  <span>{t("operatorPage.workshop.fields.customerPhone")}</span>
                  <strong>{customerPhone || "-"}</strong>
                </div>
              </div>
            </div>

            {selectedServiceLines.length > 0 && (
              <div className={styles.receiptSection}>
                <div className={styles.receiptSectionTitle}>{t("operatorPage.workshop.receipt.servicesSection")}</div>
                <div className={styles.receiptProductsList}>
                  {selectedServiceLines.map((line) => {
                      const serviceId = Number(line.serviceId || 0);
                      const assignedEmployee = selectedEmployeeByServiceId[serviceId]
                        ? onDutyEmployees.find((e) => Number(e.id) === Number(selectedEmployeeByServiceId[Number(line.serviceId || 0)]))
                        : assignedEmployeeByServiceId.get(serviceId);
                      const servicePercentageEmployees =
                        serviceEmployeePercentagesByServiceId[serviceId] ?? [];
                      const employeeLabel = line.isProgrammerService
                        ? assignedEmployee?.fullName || "-"
                        : servicePercentageEmployees.length > 0
                          ? servicePercentageEmployees
                              .map((employee) => employee.employeeFullName || `#${employee.employeeId}`)
                              .join(", ")
                          : assignedEmployee?.fullName || "-";

                      return (
                        <div key={line.serviceId} className={styles.receiptProductRow}>
                          <div className={styles.receiptProductCode}>{line.serviceName || `#${line.serviceId}`}</div>
                          <div className={styles.receiptProductMeta}>
                            <span>
                              {t("operatorPage.workshop.receipt.assignedEmployee")}: {employeeLabel}
                            </span>
                            <strong>{getServiceLinePrice(line).toLocaleString()} AMD</strong>
                          </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}

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
