import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import {
  siAudi,
  siBmw,
  siChevrolet,
  siFiat,
  siFord,
  siHonda,
  siHyundai,
  siKia,
  siMazda,
  siNissan,
  siPorsche,
  siSubaru,
  siTesla,
  siToyota,
  siVolkswagen,
  type SimpleIcon,
} from "simple-icons";
import {
  BadgeCheck,
  Car,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Eye,
  FileText,
  Hash,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicleDefinitions } from "@/store/slices/vehiclesSlice";
import {
  addServiceCategory,
  editServiceCategory,
  fetchServiceCategories,
  toggleServiceCategoryActive,
} from "@/store/slices/serviceCategorySlice";
import {
  addEmployee,
  editEmployee,
  fetchEmployees,
  fetchEmployeesByCategory,
  toggleEmployeeActive,
} from "@/store/slices/employeesSlice";
import {
  addServiceCatalogItem,
  editServiceCatalogItem,
  fetchServicesCatalog,
  toggleServiceCatalogActive,
} from "@/store/slices/servicesCatalogSlice";
import {
  addVehicleServiceTemplate,
  editVehicleServiceTemplate,
  fetchVehicleServiceTemplates,
} from "@/store/slices/vehicleServicePricingSlice";
import { EmployeeManagement } from "@/components/settings/EmployeeManagement/EmployeeManagement";
import { ProgrammingPricingAdmin } from "@/components/settings/ProgrammingPricingAdmin";
import { SectionHeader } from "@/components/common";
import { FormDrawer } from "@/components/common/FormDrawer";
import { PrpServiceLoader } from "@/components/common/PrpServiceLoader";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";

import { DataTable, Button, Select, Tab, TabGroup, TextField, Textarea } from "@/ui-kit";

import type {
  EmployeeCreatePayload,
  EmployeeItem,
  EmployeeUpdatePayload,
  ServiceCreatePayload,
  ServiceCatalogItem,
  ServiceCategoryCreatePayload,
  ServiceCategoryItem,
  ServiceCategoryUpdatePayload,
  ServiceUpdatePayload,
  VehicleServiceTemplateItem,
  VehicleServiceTemplateUpdatePayload,
} from "@/types/settings";
import {
  getProgrammingServicesWithPricing,
  getServicesByCategory as getPricingServicesByCategory,
} from "@/services/settings/workshopPricing";
import { isProgrammingServiceCategory } from "@/constants/serviceCategories";

import styles from "./ServiceTemplates.module.css";

type ServiceLine = {
  serviceId: number;
  customerPrice: number;
  serviceName?: string;
  internalCost?: number;
};

type TemplateCategoryForm = {
  serviceCategoryId: number;
  services: ServiceLine[];
};

type FormState = {
  id: number | null;
  vehicleBrandId: number;
  vehicleModelId: number;
  year: number;
  fuelTypeId: number;
  engineId: number;
  locationId: number;
  notes: string;
  categories: TemplateCategoryForm[];
};

type ServiceTemplateTab =
  | "pricing"
  | "categories"
  | "employees"
  | "services"
  | "programmers";

type VehicleBrandLogo = SimpleIcon | "mercedes" | "dodge";

const vehicleBrandLogos: Record<string, VehicleBrandLogo> = {
  audi: siAudi,
  bmw: siBmw,
  chevrolet: siChevrolet,
  dodge: "dodge",
  fiat: siFiat,
  ford: siFord,
  honda: siHonda,
  hyundai: siHyundai,
  kia: siKia,
  mazda: siMazda,
  mercedes: "mercedes",
  mercedesbenz: "mercedes",
  nissan: siNissan,
  porsche: siPorsche,
  subaru: siSubaru,
  tesla: siTesla,
  toyota: siToyota,
  volkswagen: siVolkswagen,
  vw: siVolkswagen,
};

const normalizeVehicleBrandKey = (value?: string) =>
  (value ?? "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

type EmployeeFormState = {
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shopId: number;
  serviceCategoryId: number;
  hireDate: string;
  notes: string;
};

type CategoryFormState = {
  id: number | null;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
};

type ServiceFormState = {
  id: number | null;
  code: string;
  name: string;
  description: string;
  serviceCategoryId: number;
  internalCost: number;
  estimatedDurationMinutes: number;
};

const getEmptyLine = (): ServiceLine => ({
  serviceId: 0,
  customerPrice: 0,
});

const getInitialForm = (): FormState => ({
  id: null,
  vehicleBrandId: 0,
  vehicleModelId: 0,
  year: new Date().getFullYear(),
  fuelTypeId: 0,
  engineId: 0,
  locationId: 0,
  notes: "",
  categories: [{ serviceCategoryId: 0, services: [getEmptyLine()] }],
});

const getInitialEmployeeForm = (): EmployeeFormState => ({
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  shopId: 0,
  serviceCategoryId: 0,
  hireDate: new Date().toISOString().slice(0, 10),
  notes: "",
});

const getInitialCategoryForm = (): CategoryFormState => ({
  id: null,
  code: "",
  name: "",
  description: "",
  displayOrder: 1,
});

const getInitialServiceForm = (): ServiceFormState => ({
  id: null,
  code: "",
  name: "",
  description: "",
  serviceCategoryId: 0,
  internalCost: 0,
  estimatedDurationMinutes: 0,
});

const toDisplayNumber = (value: number) => (value === 0 ? "" : String(value));

export const ServiceTemplatePage = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const { definitions, isDefinitionsLoading } = useAppSelector(
    (state) => state.vehicles,
  );
  const {
    items: serviceCategories,
    isLoading: isServiceCategoriesLoading,
    error: serviceCategoriesError,
  } = useAppSelector((state) => state.serviceCategory);
  const { items: employees, isLoading: isEmployeesLoading } = useAppSelector(
    (state) => state.employees,
  );
  const { items: serviceCatalog, isLoading: isServiceCatalogLoading } =
    useAppSelector((state) => state.servicesCatalog);
  const { items: pricingItems, isLoading: isPricingLoading } = useAppSelector(
    (state) => state.vehicleServicePricing,
  );
  const showPricingTableSkeleton = useMinimumLoadingDuration(isPricingLoading);
  const showCategoryTableSkeleton = useMinimumLoadingDuration(isServiceCategoriesLoading);
  const showServiceTableSkeleton = useMinimumLoadingDuration(
    isServiceCatalogLoading,
  );

  const [form, setForm] = useState<FormState>(getInitialForm());
  const [activeTab, setActiveTab] = useState<ServiceTemplateTab>("pricing");
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    getInitialCategoryForm(),
  );
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryPageIndex, setCategoryPageIndex] = useState(0);
  const [categoryPageSize, setCategoryPageSize] = useState(10);

  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(
    getInitialEmployeeForm(),
  );
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [isPricingFormOpen, setIsPricingFormOpen] = useState(false);
  const [isPricingSaving, setIsPricingSaving] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);
  const [employeeCategoryFilterId, setEmployeeCategoryFilterId] = useState(0);
  const [pricingFuelTypeFilterId, setPricingFuelTypeFilterId] = useState(0);
  const [pricingEngineFilterId, setPricingEngineFilterId] = useState(0);
  const [pricingSearch, setPricingSearch] = useState("");

  const [serviceForm, setServiceForm] = useState<ServiceFormState>(
    getInitialServiceForm(),
  );
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isServiceViewOnly, setIsServiceViewOnly] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [pricingServiceOptionsByCategoryId, setPricingServiceOptionsByCategoryId] =
    useState<Record<number, ServiceCatalogItem[]>>({});
  const [isPricingServicesLoading, setIsPricingServicesLoading] = useState(false);
  const [isProgrammingPricingLoading, setIsProgrammingPricingLoading] =
    useState(false);
  const [programmingResolvedByServiceId, setProgrammingResolvedByServiceId] =
    useState<
      Record<
        number,
        {
          hasProgrammerPricing: boolean;
          programmerSellingPrice: number;
          bestProgrammerUsername: string | null;
        }
      >
    >({});

  const rootServiceCategories = useMemo(
    () =>
      serviceCategories.filter(
        (item: ServiceCategoryItem) => item.isActive !== false,
      ),
    [serviceCategories],
  );

  const filteredServiceCategories = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase();
    return (serviceCategories ?? []).filter((item: ServiceCategoryItem) => {
      const matchesSearch = !query || [item.code, item.name]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query));
      const matchesStatus =
        categoryStatusFilter === "all" ||
        (categoryStatusFilter === "active"
          ? item.isActive !== false
          : item.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [serviceCategories, categorySearch, categoryStatusFilter]);

  useEffect(() => {
    const lastPageIndex = Math.max(
      0,
      Math.ceil(filteredServiceCategories.length / categoryPageSize) - 1,
    );
    if (categoryPageIndex > lastPageIndex) {
      setCategoryPageIndex(lastPageIndex);
    }
  }, [filteredServiceCategories.length, categoryPageIndex, categoryPageSize]);

  const filteredServiceCatalog = useMemo(() => {
    const query = serviceSearch.trim().toLocaleLowerCase();
    if (!query) return serviceCatalog ?? [];

    return (serviceCatalog ?? []).filter((item) =>
      [item.code, item.name, item.description, item.serviceCategoryName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [serviceCatalog, serviceSearch]);

  const getServiceOptionsForCategory = (categoryId: number) =>
    (pricingServiceOptionsByCategoryId[categoryId] ?? []).filter(
      (item: ServiceCatalogItem) => item.isActive !== false,
    );

  const modelOptions = useMemo(() => definitions?.models ?? [], [definitions]);
  const fuelTypeOptions = useMemo(() => definitions?.fuelTypes ?? [], [definitions]);
  const engineOptions = useMemo(() => definitions?.engines ?? [], [definitions]);
  const locationOptions = useMemo(
    () => definitions?.markets ?? [],
    [definitions],
  );

  const serviceTotal = useMemo(
    () => form.categories.reduce((sum, category) => {
      const selectedCategory = rootServiceCategories.find(
        (item) => item.id === category.serviceCategoryId,
      );
      const isProgrammingCategory =
        isProgrammingServiceCategory(selectedCategory?.code) ||
        isProgrammingServiceCategory(selectedCategory?.name);

      return sum + category.services.reduce(
        (categorySum, service) => categorySum + Number(
          isProgrammingCategory
            ? programmingResolvedByServiceId[service.serviceId]?.programmerSellingPrice || 0
            : service.customerPrice || 0,
        ),
        0,
      );
    }, 0),
    [form.categories, rootServiceCategories, programmingResolvedByServiceId],
  );

  const filteredPricingItems = useMemo(
    () => {
      const query = pricingSearch.trim().toLocaleLowerCase();
      const queryTerms = query.split(/\s+/).filter(Boolean);

      return (pricingItems ?? []).filter((item) => {
        const matchesFuel =
          pricingFuelTypeFilterId === 0 ||
          Number(item.fuelTypeId || 0) === pricingFuelTypeFilterId;
        const matchesEngine =
          pricingEngineFilterId === 0 ||
          Number(item.engineId || 0) === pricingEngineFilterId;
        const brand = definitions?.brands.find((entry) => entry.id === item.brandId);
        const model = definitions?.models.find((entry) => entry.id === item.modelId);
        const searchText = [
          item.brandName,
          brand?.name,
          brand?.code,
          item.modelName,
          model?.name,
          model?.code,
          String(item.year),
          item.location,
          item.fuelTypeName,
          item.engineName,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ")
          .toLocaleLowerCase();
        const matchesSearch = queryTerms.every((term) => searchText.includes(term));

        return matchesFuel && matchesEngine && matchesSearch;
      });
    },
    [definitions, pricingEngineFilterId, pricingFuelTypeFilterId, pricingItems, pricingSearch],
  );

  const hasPricingFilters = Boolean(
    pricingSearch.trim() || pricingFuelTypeFilterId || pricingEngineFilterId,
  );

  const resetPricingFilters = () => {
    setPricingSearch("");
    setPricingFuelTypeFilterId(0);
    setPricingEngineFilterId(0);
  };

  const selectedServicesSummary = useMemo(
    () =>
      form.categories.flatMap((category) =>
        category.services
          .filter((line) => line.serviceId > 0)
          .map((line) => {
            const selectedService = getServiceOptionsForCategory(
              category.serviceCategoryId,
            ).find((item) => item.id === line.serviceId);
            const selectedCategory = rootServiceCategories.find(
              (item) => item.id === category.serviceCategoryId,
            );
            const isProgrammingCategory =
              isProgrammingServiceCategory(selectedCategory?.code) ||
              isProgrammingServiceCategory(selectedCategory?.name);
          const resolvedProgramming = programmingResolvedByServiceId[line.serviceId];

          return {
            id: line.serviceId,
            label: selectedService
              ? `${selectedService.name || selectedService.code} (${selectedService.code})`
              : line.serviceName || `#${line.serviceId}`,
            categoryLabel:
              selectedCategory?.name || selectedCategory?.code || `#${category.serviceCategoryId}`,
            price: isProgrammingCategory
              ? Number(resolvedProgramming?.programmerSellingPrice ?? 0)
              : Number(line.customerPrice || 0),
            isAutoResolved: isProgrammingCategory,
            hasProgrammerPricing:
              isProgrammingCategory && !resolvedProgramming
                ? false
                : Boolean(resolvedProgramming?.hasProgrammerPricing),
          };
          }),
      ),
    [
      form.categories,
      rootServiceCategories,
      programmingResolvedByServiceId,
      pricingServiceOptionsByCategoryId,
    ],
  );

  const selectedProgrammingServiceIds = useMemo(
    () =>
      form.categories
        .flatMap((category) => {
          const selectedCategory = rootServiceCategories.find(
            (item) => item.id === category.serviceCategoryId,
          );
          const isProgrammingCategory =
            isProgrammingServiceCategory(selectedCategory?.code) ||
            isProgrammingServiceCategory(selectedCategory?.name);

          if (!isProgrammingCategory) {
            return [];
          }

          return category.services
            .map((line) => Number(line.serviceId || 0))
            .filter((serviceId) => serviceId > 0);
        }),
    [form.categories, rootServiceCategories],
  );

  const selectedProgrammingServiceIdsKey = useMemo(
    () =>
      selectedProgrammingServiceIds
        .slice()
        .sort((a, b) => a - b)
        .join(","),
    [selectedProgrammingServiceIds],
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, index) => currentYear - index);
  }, []);

  useEffect(() => {
    dispatch(fetchServiceCategories());
    dispatch(fetchEmployees());
    dispatch(fetchVehicleDefinitions({ lang: i18n.language }));
    dispatch(fetchVehicleServiceTemplates());
  }, [dispatch, i18n.language]);

  useEffect(() => {
    dispatch(
      fetchVehicleDefinitions({
        brandId: form.vehicleBrandId || undefined,
        lang: i18n.language,
      }),
    );
  }, [dispatch, form.vehicleBrandId, i18n.language]);

  useEffect(() => {
    if (activeTab === "services") {
      dispatch(fetchServicesCatalog());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === "pricing") {
      dispatch(fetchVehicleServiceTemplates());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (
      !form.vehicleBrandId ||
      !form.vehicleModelId ||
      !form.year ||
      !form.fuelTypeId ||
      !form.engineId ||
      selectedProgrammingServiceIds.length === 0
    ) {
      setProgrammingResolvedByServiceId({});
      setIsProgrammingPricingLoading(false);
      return;
    }

    const loadProgrammingPricing = async () => {
      try {
        setIsProgrammingPricingLoading(true);
        const items = await getProgrammingServicesWithPricing({
          brandId: Number(form.vehicleBrandId),
          modelId: Number(form.vehicleModelId),
          year: Number(form.year),
          fuelTypeId: Number(form.fuelTypeId),
          engineId: Number(form.engineId),
        });

        const resolved = items.reduce<
          Record<
            number,
            {
              hasProgrammerPricing: boolean;
              programmerSellingPrice: number;
              bestProgrammerUsername: string | null;
            }
          >
        >((acc, item) => {
          const serviceId = Number(item.id || 0);
          if (serviceId <= 0) {
            return acc;
          }

          acc[serviceId] = {
            hasProgrammerPricing: Boolean(item.hasProgrammerPricing),
            programmerSellingPrice: Number(item.programmerSellingPrice || 0),
            bestProgrammerUsername: item.bestProgrammerUsername ?? null,
          };

          return acc;
        }, {});

        setProgrammingResolvedByServiceId(resolved);

        setForm((prev) => ({
          ...prev,
          categories: prev.categories.map((category) => {
            const selectedCategory = rootServiceCategories.find(
              (item) => item.id === category.serviceCategoryId,
            );
            const isProgrammingCategory =
              isProgrammingServiceCategory(selectedCategory?.code) ||
              isProgrammingServiceCategory(selectedCategory?.name);

            if (!isProgrammingCategory) {
              return category;
            }

            return {
              ...category,
              services: category.services.map((line) => {
                const serviceId = Number(line.serviceId || 0);
                if (serviceId <= 0) {
                  return line;
                }

                const resolvedLine = resolved[serviceId];
                const nextPrice = resolvedLine?.hasProgrammerPricing
                  ? Number(resolvedLine.programmerSellingPrice || 0)
                  : 0;

                if (Number(line.customerPrice || 0) === nextPrice) {
                  return line;
                }

                return {
                  ...line,
                  customerPrice: nextPrice,
                };
              }),
            };
          }),
        }));
      } catch {
        setProgrammingResolvedByServiceId({});
        toast.error(t("serviceTemplates.messages.loadFailed"));
      } finally {
        setIsProgrammingPricingLoading(false);
      }
    };

    void loadProgrammingPricing();
  }, [
    form.vehicleBrandId,
    form.vehicleModelId,
    form.year,
    form.fuelTypeId,
    form.engineId,
    selectedProgrammingServiceIdsKey,
    rootServiceCategories,
    t,
  ]);

  const handleCreateOrUpdateCategory = async () => {
    const code = categoryForm.code.trim();
    const name = categoryForm.name.trim();
    const description = categoryForm.description.trim();

    if (!name || (!categoryForm.id && !code)) {
      toast.error(t("serviceTemplates.categoryCatalog.messages.validationFailed"));
      return;
    }

    setIsCategorySaving(true);
    try {
      if (categoryForm.id) {
        const payload: ServiceCategoryUpdatePayload = {
          id: categoryForm.id,
          name,
          description,
          displayOrder: Number(categoryForm.displayOrder || 0),
        };
        await dispatch(editServiceCategory(payload)).unwrap();
        toast.success(t("serviceTemplates.categoryCatalog.messages.updated"));
      } else {
        const payload: ServiceCategoryCreatePayload = {
          code,
          name,
          description,
          displayOrder: Number(categoryForm.displayOrder || 0),
        };
        await dispatch(addServiceCategory(payload)).unwrap();
        toast.success(t("serviceTemplates.categoryCatalog.messages.created"));
      }

      setCategoryForm(getInitialCategoryForm());
      setIsCategoryFormOpen(false);
      dispatch(fetchServiceCategories());
    } catch {
      toast.error(
        categoryForm.id
          ? t("serviceTemplates.categoryCatalog.messages.updateFailed")
          : t("serviceTemplates.categoryCatalog.messages.createFailed"),
      );
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleCategoryOpenChange = (open: boolean) => {
    if (open) {
      setIsCategoryFormOpen(true);
      return;
    }
    if (isCategorySaving) return;

    setCategoryForm(getInitialCategoryForm());
    setIsCategoryFormOpen(false);
  };

  const handleOpenCreateCategory = () => {
    setCategoryForm(getInitialCategoryForm());
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (item: ServiceCategoryItem) => {
    setCategoryForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      displayOrder: Number(item.displayOrder || 0),
    });
    setIsCategoryFormOpen(true);
  };

  const handleCancelCategory = () => {
    setCategoryForm(getInitialCategoryForm());
    setIsCategoryFormOpen(false);
  };

  const handleCreateOrUpdateEmployee = async () => {
    const firstName = employeeForm.firstName.trim();
    const lastName = employeeForm.lastName.trim();
    const email = employeeForm.email.trim();
    const phone = employeeForm.phone.trim();
    const notes = employeeForm.notes.trim();

    if (!firstName || !lastName || !email || !phone || !employeeForm.serviceCategoryId) {
      toast.error(t("serviceTemplates.messages.validationFailed"));
      return;
    }

    try {
      if (employeeForm.id) {
        const payload: EmployeeUpdatePayload = {
          id: employeeForm.id,
          firstName,
          lastName,
          email,
          phone,
          shopId: employeeForm.shopId,
          serviceCategoryId: employeeForm.serviceCategoryId,
          employeeType: "Regular",
          salaryType: "FixedDaily",
          fixedDailySalary: 0,
          notes,
        };

        await dispatch(editEmployee(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.updated"));
      } else {
        const payload: EmployeeCreatePayload = {
          firstName,
          lastName,
          email,
          phone,
          shopId: employeeForm.shopId,
          serviceCategoryId: employeeForm.serviceCategoryId,
          hireDate: new Date(employeeForm.hireDate).toISOString(),
          employeeType: "Regular",
          salaryType: "FixedDaily",
          fixedDailySalary: 0,
          notes,
        };

        await dispatch(addEmployee(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.created"));
      }

      setEmployeeForm(getInitialEmployeeForm());
      setIsEmployeeFormOpen(false);

      if (employeeCategoryFilterId > 0) {
        await dispatch(fetchEmployeesByCategory({ categoryId: employeeCategoryFilterId, includeInactive: true })).unwrap();
      } else {
        await dispatch(fetchEmployees()).unwrap();
      }
    } catch {
      toast.error(
        employeeForm.id
          ? t("serviceTemplates.messages.updateFailed")
          : t("serviceTemplates.messages.createFailed"),
      );
    }
  };

  const handleEditEmployee = (item: EmployeeItem) => {
    setEmployeeForm({
      id: item.id,
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      email: item.email || "",
      phone: item.phone || "",
      shopId: Number(item.shopId || 0),
      serviceCategoryId: item.serviceCategoryId || 0,
      hireDate: (item.hireDate || new Date().toISOString()).slice(0, 10),
      notes: item.notes || "",
    });
    setIsEmployeeFormOpen(true);
  };

  const handleCancelEmployee = () => {
    setEmployeeForm(getInitialEmployeeForm());
    setIsEmployeeFormOpen(false);
  };

  const handleEmployeeCategoryFilter = async (categoryId: number) => {
    setEmployeeCategoryFilterId(categoryId);

    try {
      if (categoryId > 0) {
        await dispatch(fetchEmployeesByCategory({ categoryId, includeInactive: true })).unwrap();
      } else {
        await dispatch(fetchEmployees()).unwrap();
      }
    } catch {
      toast.error(t("serviceTemplates.messages.loadFailed"));
    }
  };

  const handleCreateOrUpdateService = async () => {
    if (isServiceViewOnly) return;

    const code = serviceForm.code.trim();
    const name = serviceForm.name.trim();
    const description = serviceForm.description.trim();

    if (!name || !serviceForm.serviceCategoryId || (!serviceForm.id && !code)) {
      toast.error(t("serviceTemplates.messages.validationFailed"));
      return;
    }

    try {
      if (serviceForm.id) {
        const payload: ServiceUpdatePayload = {
          id: serviceForm.id,
          name,
          description,
          serviceCategoryId: serviceForm.serviceCategoryId,
          internalCost: Number(serviceForm.internalCost),
          estimatedDurationMinutes: Number(serviceForm.estimatedDurationMinutes),
        };
        await dispatch(editServiceCatalogItem(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.updated"));
      } else {
        const payload: ServiceCreatePayload = {
          code,
          name,
          description,
          serviceCategoryId: serviceForm.serviceCategoryId,
          internalCost: Number(serviceForm.internalCost),
          estimatedDurationMinutes: Number(serviceForm.estimatedDurationMinutes),
        };
        await dispatch(addServiceCatalogItem(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.created"));
      }

      setServiceForm(getInitialServiceForm());
      setIsServiceFormOpen(false);
      setIsServiceViewOnly(false);
      dispatch(fetchServicesCatalog());
    } catch {
      toast.error(
        serviceForm.id
          ? t("serviceTemplates.messages.updateFailed")
          : t("serviceTemplates.messages.createFailed"),
      );
    }
  };

  const handleEditService = (item: ServiceCatalogItem) => {
    setServiceForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      serviceCategoryId: item.serviceCategoryId || 0,
      internalCost: Number(item.internalCost || 0),
      estimatedDurationMinutes: Number(item.estimatedDurationMinutes || 0),
    });
    setIsServiceViewOnly(false);
    setIsServiceFormOpen(true);
  };

  const handleViewService = (item: ServiceCatalogItem) => {
    setServiceForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      serviceCategoryId: item.serviceCategoryId || 0,
      internalCost: Number(item.internalCost || 0),
      estimatedDurationMinutes: Number(item.estimatedDurationMinutes || 0),
    });
    setIsServiceViewOnly(true);
    setIsServiceFormOpen(true);
  };

  const handleNewService = () => {
    setServiceForm(getInitialServiceForm());
    setIsServiceViewOnly(false);
    setIsServiceFormOpen(true);
  };

  const handleCancelService = () => {
    setServiceForm(getInitialServiceForm());
    setIsServiceViewOnly(false);
    setIsServiceFormOpen(false);
  };

  useEffect(() => {
    if (!isServiceFormOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setServiceForm(getInitialServiceForm());
        setIsServiceViewOnly(false);
        setIsServiceFormOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isServiceFormOpen]);

  const validateForm = () => {
    if (!form.vehicleBrandId || !form.vehicleModelId) return false;
    if (!form.year || form.year < 1900) return false;
    if (!form.fuelTypeId || !form.engineId) return false;
    if (!form.locationId) return false;
    if (form.categories.length === 0) return false;

    return form.categories.every(
      (category) =>
        category.serviceCategoryId > 0 &&
        category.services.length > 0 &&
        category.services.every(
          (service) =>
            service.serviceId > 0 && Number(service.customerPrice) >= 0,
        ),
    );
  };

  const handleLoadVehiclePricing = async () => {
    try {
      await dispatch(fetchVehicleServiceTemplates()).unwrap();
    } catch {
      toast.error(t("serviceTemplates.messages.loadFailed"));
    }
  };

  const handlePricingOpenChange = (open: boolean) => {
    if (open) {
      setIsPricingFormOpen(true);
      return;
    }
    if (isPricingSaving) return;

    setForm(getInitialForm());
    setPricingServiceOptionsByCategoryId({});
    setIsPricingFormOpen(false);
  };

  const handleOpenPricingForm = () => {
    setForm(getInitialForm());
    setPricingServiceOptionsByCategoryId({});
    setIsPricingFormOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t("serviceTemplates.messages.validationFailed"));
      return;
    }

    setIsPricingSaving(true);
    try {
      const selectedLocation = locationOptions.find(
        (item) => item.id === form.locationId,
      );

      if (!selectedLocation?.name) {
        toast.error(t("serviceTemplates.messages.validationFailed"));
        return;
      }

      const payloadBase = {
        brandId: form.vehicleBrandId,
        modelId: form.vehicleModelId,
        year: form.year,
        fuelTypeId: form.fuelTypeId,
        engineId: form.engineId,
        location: selectedLocation.name,
        electricityPrice: 0,
        notes: form.notes.trim(),
        categories: form.categories
          .filter((category) => category.serviceCategoryId > 0)
          .map((category) => {
            const selectedCategory = rootServiceCategories.find(
              (item) => item.id === category.serviceCategoryId,
            );
            const isProgrammingCategory =
              isProgrammingServiceCategory(selectedCategory?.code) ||
              isProgrammingServiceCategory(selectedCategory?.name);

            return {
              serviceCategoryId: category.serviceCategoryId,
              services: category.services
                .filter((service) => service.serviceId > 0)
                .map((service) => ({
                  serviceId: service.serviceId,
                  customerPrice: isProgrammingCategory
                    ? 0
                    : Number(service.customerPrice),
                })),
            };
          }),
      };

      if (form.id) {
        const payload: VehicleServiceTemplateUpdatePayload = {
          id: form.id,
          ...payloadBase,
        };
        await dispatch(editVehicleServiceTemplate(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.updated"));
      } else {
        await dispatch(addVehicleServiceTemplate(payloadBase)).unwrap();
        toast.success(t("serviceTemplates.messages.created"));
      }

      await dispatch(fetchVehicleServiceTemplates()).unwrap();
      setForm(getInitialForm());
      setPricingServiceOptionsByCategoryId({});
      setIsPricingFormOpen(false);
    } catch {
      toast.error(
        form.id
          ? t("serviceTemplates.messages.updateFailed")
          : t("serviceTemplates.messages.createFailed"),
      );
    } finally {
      setIsPricingSaving(false);
    }
  };

  const handleEditPricingTemplate = async (item: VehicleServiceTemplateItem) => {
    const matchedLocation = locationOptions.find(
      (location) => location.name === item.location,
    );

    const rawTemplate = item as unknown as Record<string, unknown>;
    const rawCategories = Array.isArray(rawTemplate.categories)
      ? (rawTemplate.categories as Array<Record<string, unknown>>)
      : [];

    const normalizedCategories =
      rawCategories.length > 0
        ? rawCategories.map((category) => ({
            serviceCategoryId: Number(category.serviceCategoryId || 0),
            services: Array.isArray(category.services)
              ? (category.services as Array<Record<string, unknown>>)
                  .map((service) => ({
                    serviceId: Number(service.serviceId || 0),
                    customerPrice: Number(service.customerPrice || 0),
                    serviceName:
                      service.serviceName != null
                        ? String(service.serviceName)
                        : undefined,
                    internalCost:
                      service.internalCost != null
                        ? Number(service.internalCost)
                        : undefined,
                  }))
                  .filter((service) => service.serviceId > 0)
              : [getEmptyLine()],
          }))
        : [
            {
              serviceCategoryId: Number(item.serviceCategoryId || 0),
              services:
                item.items?.length > 0
                  ? item.items.map((service) => ({
                      serviceId: service.serviceId,
                      customerPrice: Number(service.customerPrice || 0),
                      serviceName: service.serviceName,
                      internalCost: service.internalCost,
                    }))
                  : [getEmptyLine()],
            },
          ];

    setForm({
      id: item.id,
      vehicleBrandId: item.brandId,
      vehicleModelId: item.modelId,
      year: item.year,
      fuelTypeId: Number(item.fuelTypeId || 0),
      engineId: Number(item.engineId || 0),
      locationId: matchedLocation?.id ?? 0,
      notes: item.notes || "",
      categories:
        normalizedCategories.length > 0
          ? normalizedCategories
          : [{ serviceCategoryId: 0, services: [getEmptyLine()] }],
    });

    try {
      setIsPricingServicesLoading(true);
      const categoriesToLoad = normalizedCategories
        .map((category) => Number(category.serviceCategoryId || 0))
        .filter((categoryId) => categoryId > 0);

      const optionsEntries = await Promise.all(
        categoriesToLoad.map(async (categoryId) => {
          const options = await getPricingServicesByCategory(categoryId);
          return [categoryId, Array.isArray(options) ? options : []] as const;
        }),
      );

      setPricingServiceOptionsByCategoryId(
        optionsEntries.reduce<Record<number, ServiceCatalogItem[]>>(
          (acc, [categoryId, options]) => ({
            ...acc,
            [categoryId]: options,
          }),
          {},
        ),
      );
    } catch {
      setPricingServiceOptionsByCategoryId({});
    } finally {
      setIsPricingServicesLoading(false);
    }

    setIsPricingFormOpen(true);
  };

  const setLine = (
    categoryIndex: number,
    lineIndex: number,
    patch: Partial<ServiceLine>,
  ) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              services: category.services.map((line, currentLineIndex) =>
                currentLineIndex === lineIndex ? { ...line, ...patch } : line,
              ),
            }
          : category,
      ),
    }));
  };

  const addCategory = () => {
    setForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { serviceCategoryId: 0, services: [getEmptyLine()] },
      ],
    }));
  };

  const removeCategory = (categoryIndex: number) => {
    setForm((prev) => ({
      ...prev,
      categories:
        prev.categories.length === 1
          ? [{ serviceCategoryId: 0, services: [getEmptyLine()] }]
          : prev.categories.filter((_, index) => index !== categoryIndex),
    }));
  };

  const setCategory = async (categoryIndex: number, serviceCategoryId: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, index) =>
        index === categoryIndex
          ? { serviceCategoryId, services: [getEmptyLine()] }
          : category,
      ),
    }));

    if (!serviceCategoryId) {
      return;
    }

    try {
      setIsPricingServicesLoading(true);
      const items = await getPricingServicesByCategory(serviceCategoryId);
      setPricingServiceOptionsByCategoryId((prev) => ({
        ...prev,
        [serviceCategoryId]: Array.isArray(items) ? items : [],
      }));
    } catch {
      toast.error(t("serviceTemplates.messages.loadFailed"));
      setPricingServiceOptionsByCategoryId((prev) => ({
        ...prev,
        [serviceCategoryId]: [],
      }));
    } finally {
      setIsPricingServicesLoading(false);
    }
  };

  const addLine = (categoryIndex: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, index) =>
        index === categoryIndex
          ? { ...category, services: [...category.services, getEmptyLine()] }
          : category,
      ),
    }));
  };

  const removeLine = (categoryIndex: number, lineIndex: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category, index) => {
        if (index !== categoryIndex) {
          return category;
        }

        return {
          ...category,
          services:
            category.services.length === 1
              ? [getEmptyLine()]
              : category.services.filter((_, currentLineIndex) => currentLineIndex !== lineIndex),
        };
      }),
    }));
  };

  const formatDateValue = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const getTemplateCategories = (template: VehicleServiceTemplateItem) => {
    const rawTemplate = template as unknown as Record<string, unknown>;
    const rawCategories = Array.isArray(rawTemplate.categories)
      ? (rawTemplate.categories as Array<Record<string, unknown>>)
      : [];

    if (rawCategories.length > 0) {
      return rawCategories.map((category) => ({
        serviceCategoryId: Number(category.serviceCategoryId || 0),
      }));
    }

    if (Number(template.serviceCategoryId || 0) > 0) {
      return [{ serviceCategoryId: Number(template.serviceCategoryId || 0) }];
    }

    return [];
  };

  const getTemplateItems = (template: VehicleServiceTemplateItem) => {
    const rawTemplate = template as unknown as Record<string, unknown>;
    const rawCategories = Array.isArray(rawTemplate.categories)
      ? (rawTemplate.categories as Array<Record<string, unknown>>)
      : [];

    if (rawCategories.length > 0) {
      return rawCategories.flatMap((category) =>
        Array.isArray(category.services)
          ? (category.services as VehicleServiceTemplateItem["items"])
          : [],
      );
    }

    return template.items ?? [];
  };

  return (
    <div className={styles.container}>
      <SectionHeader
        title={t("serviceTemplates.title")}
        icon={<Wrench size={17} color="#d2bf8a" aria-hidden="true" />}
      />

      <div className={`${styles.section} ${styles.tabNavigation}`}>
        <TabGroup>
          <Tab
            variant="segmented"
            active={activeTab === "pricing"}
            text={t("serviceTemplates.tabs.pricing")}
            onClick={() => setActiveTab("pricing")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "categories"}
            text={t("serviceTemplates.tabs.categories")}
            onClick={() => {
              if (activeTab !== "categories" && !isServiceCategoriesLoading) {
                dispatch(fetchServiceCategories());
              }
              setActiveTab("categories");
            }}
          />
          <Tab
            variant="segmented"
            active={activeTab === "employees"}
            text={t("serviceTemplates.tabs.employees")}
            onClick={() => setActiveTab("employees")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "services"}
            text={t("serviceTemplates.tabs.services")}
            onClick={() => setActiveTab("services")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "programmers"}
            text={t("serviceTemplates.tabs.programmers")}
            onClick={() => setActiveTab("programmers")}
          />
        </TabGroup>
      </div>

      {activeTab === "pricing" && (
        <>
          <div className={`${styles.section} ${styles.pricingSection}`}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.tabs.pricing")}</h3>
              <div className={styles.pricingToolbar}>
                <div className={styles.pricingFilters}>
                  <TextField
                    className={styles.pricingSearch}
                    aria-label={t("serviceTemplates.filters.search")}
                    placeholder={t("serviceTemplates.filters.searchPlaceholder")}
                    value={pricingSearch}
                    onChange={(event) => setPricingSearch(event.target.value)}
                    icon={<Search size={14} aria-hidden="true" />}
                  />
                  <Select
                    className={styles.filterControl}
                    value={String(pricingFuelTypeFilterId)}
                    onChange={(e) => setPricingFuelTypeFilterId(Number(e.target.value) || 0)}
                    placeholder={t("serviceTemplates.fields.fuelType")}
                  >
                    <option value="0">{t("serviceTemplates.fields.allFuelTypes")}</option>
                    {fuelTypeOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    className={styles.filterControl}
                    value={String(pricingEngineFilterId)}
                    onChange={(e) => setPricingEngineFilterId(Number(e.target.value) || 0)}
                    placeholder={t("serviceTemplates.fields.engine")}
                  >
                    <option value="0">{t("serviceTemplates.fields.allEngines")}</option>
                    {engineOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  {hasPricingFilters && (
                    <Button
                      className={styles.pricingResetButton}
                      size="small"
                      variant="secondary"
                      onClick={resetPricingFilters}
                    >
                      <X size={13} aria-hidden="true" />
                      {t("serviceTemplates.filters.reset")}
                    </Button>
                  )}
                </div>

                <div className={styles.pricingActions}>
                  <Button
                    variant="secondary"
                    onClick={handleLoadVehiclePricing}
                    disabled={isPricingLoading}
                    aria-label={t("common.refresh")}
                    title={t("common.refresh")}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    {t("common.refresh")}
                  </Button>
                  <Button
                    variant={isPricingFormOpen ? "secondary" : "primary"}
                    onClick={handleOpenPricingForm}
                    disabled={isPricingFormOpen}
                  >
                    <Plus size={15} aria-hidden="true" />
                    {t("serviceTemplates.actions.addPricing")}
                  </Button>
                </div>
              </div>
            </div>

            {showPricingTableSkeleton ? (
              <PrpServiceLoader />
            ) : filteredPricingItems.length === 0 ? (
              <div className={styles.pricingEmptyState}>
                <Car size={24} aria-hidden="true" />
                <span>{t("serviceTemplates.messages.noPricingMatches")}</span>
              </div>
            ) : (
              <div className={styles.pricingCardGrid}>
                {filteredPricingItems.map((item) => {
                  const items = getTemplateItems(item);
                  const categories = getTemplateCategories(item)
                    .map((category) => rootServiceCategories.find(
                      (serviceCategory) => serviceCategory.id === category.serviceCategoryId,
                    ))
                    .filter((category): category is ServiceCategoryItem => Boolean(category));
                  const total = items.reduce(
                    (sum, service) => sum + Number(
                      service.isProgrammerService
                        ? service.programmerSellingPrice || 0
                        : service.customerPrice || 0,
                    ),
                    0,
                  );
                  const fuelTypeLabel = item.fuelTypeName ||
                    fuelTypeOptions.find((option) => option.id === item.fuelTypeId)?.name ||
                    (item.fuelTypeId ? `#${item.fuelTypeId}` : "");
                  const engineLabel = item.engineName ||
                    engineOptions.find((option) => option.id === item.engineId)?.name ||
                    (item.engineId ? `#${item.engineId}` : "");
                  const brandDefinition = definitions?.brands.find(
                    (brand) => brand.id === item.brandId,
                  );
                  const modelDefinition = definitions?.models.find(
                    (model) => model.id === item.modelId,
                  );
                  const brandName = item.brandName || brandDefinition?.name || `#${item.brandId}`;
                  const brandLogoKeys = [
                    normalizeVehicleBrandKey(brandDefinition?.code),
                    normalizeVehicleBrandKey(item.brandName),
                    normalizeVehicleBrandKey(brandDefinition?.name),
                  ];
                  const brandLogo = brandLogoKeys
                    .map((key) => vehicleBrandLogos[key])
                    .find(Boolean);
                  const isExpanded = expandedTemplateId === item.id;

                  return (
                    <article key={item.id} className={styles.pricingCard}>
                      <div className={styles.pricingCardHeader}>
                        <div className={styles.pricingCardVehicle}>
                          <span className={styles.pricingCardIcon} aria-hidden="true">
                            {brandLogo === "mercedes" ? (
                              <svg className={styles.pricingBrandLogo} viewBox="0 0 24 24" aria-label={brandName}>
                                <circle cx="12" cy="12" r="9" fill="none" stroke="#a7acb2" strokeWidth="1.5" />
                                <path d="M12 3v9m0 0 7.8 4.5M12 12 4.2 16.5" fill="none" stroke="#a7acb2" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            ) : brandLogo === "dodge" ? (
                              <svg className={styles.dodgeBrandLogo} viewBox="0 0 36 24" aria-label={brandName}>
                                <text x="2" y="12" fill="#e7e5e4" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">DODGE</text>
                                <path d="m21 15 12-4m-10 7 10-3" fill="none" stroke="#d71920" strokeWidth="1.8" strokeLinecap="square" />
                              </svg>
                            ) : brandLogo ? (
                              <svg
                                className={styles.pricingBrandLogo}
                                viewBox="0 0 24 24"
                                role="img"
                                aria-label={brandName}
                                style={{ color: `#${brandLogo.hex}` }}
                              >
                                <path d={brandLogo.path} fill="currentColor" />
                              </svg>
                            ) : <Car size={17} />}
                          </span>
                          <div>
                            <h3>{brandName} {item.modelName || modelDefinition?.name || `#${item.modelId}`}</h3>
                            <span>{item.year}{item.location ? ` · ${item.location}` : ""}</span>
                          </div>
                        </div>
                        <span className={`${styles.pricingStatus} ${item.isActive ? styles.pricingStatusActive : styles.pricingStatusInactive}`}>
                          {item.isActive ? t("common.active") : t("common.inactive")}
                        </span>
                      </div>

                      {(fuelTypeLabel || engineLabel) && (
                        <div className={styles.pricingCardSpecs}>
                          {fuelTypeLabel && <span>{fuelTypeLabel}</span>}
                          {engineLabel && <span>{engineLabel}</span>}
                        </div>
                      )}

                      <div className={styles.pricingCardCategories}>
                        {categories.length > 0 ? categories.map((category) => (
                          <span key={category.id} className={styles.pricingCategoryBadge}>
                            {category.name || category.code}
                          </span>
                        )) : <span className={styles.pricingMuted}>-</span>}
                      </div>

                      <div className={styles.pricingCardSummary}>
                        <span>{t("serviceTemplates.table.services")}: <strong>{items.length}</strong></span>
                        <strong className={`${styles.pricingAmount} ${items.length === 0 ? styles.pricingAmountEmpty : ""}`}>
                          {items.length > 0
                            ? `${total.toLocaleString(i18n.language)} AMD`
                            : t("serviceTemplates.pricingForm.noServicesPrice")}
                        </strong>
                      </div>

                      {isExpanded && (
                        <div className={styles.pricingCardDetails}>
                          {items.length === 0 ? (
                            <span className={styles.pricingMuted}>{t("common.noData")}</span>
                          ) : items.map((service, index) => (
                            <div className={styles.pricingCardService} key={`${service.id || service.serviceId}-${index}`}>
                              <span>{service.serviceName || `#${service.serviceId}`}</span>
                              <strong>
                                {Number(service.isProgrammerService
                                  ? service.programmerSellingPrice || 0
                                  : service.customerPrice || 0).toLocaleString(i18n.language)} AMD
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.pricingCardActions}>
                        <button
                          type="button"
                          className={styles.pricingExpandButton}
                          onClick={() => setExpandedTemplateId((previous) => previous === item.id ? null : item.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          {t(isExpanded ? "serviceTemplates.actions.hideItems" : "serviceTemplates.actions.viewItems")}
                        </button>
                        <button
                          type="button"
                          className={styles.serviceRowAction}
                          onClick={() => handleEditPricingTemplate(item)}
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {isPricingFormOpen && (
            <FormDrawer
              open={isPricingFormOpen}
              onOpenChange={handlePricingOpenChange}
              eyebrow={t("serviceTemplates.tabs.pricing")}
              title={t(form.id ? "serviceTemplates.pricingForm.editTitle" : "serviceTemplates.pricingForm.createTitle")}
              titleId="vehicle-service-pricing-title"
              closeLabel={t("common.close")}
              icon={<Car size={20} />}
              footer={
                <>
                  <Button
                    className={styles.pricingSecondaryButton}
                    variant="secondary"
                    onClick={() => handlePricingOpenChange(false)}
                    disabled={isPricingSaving}
                  >
                    <X size={15} aria-hidden="true" />
                    {t("common.cancel")}
                  </Button>
                  <Button
                    className={styles.pricingDrawerSaveButton}
                    onClick={handleSave}
                    disabled={isPricingSaving || !validateForm()}
                  >
                    <Save size={15} aria-hidden="true" />
                    {isPricingSaving
                      ? t("common.saving")
                      : t(form.id ? "serviceTemplates.actions.update" : "serviceTemplates.actions.create")}
                  </Button>
                </>
              }
            >
              <div className={`${styles.form} ${styles.pricingDrawerForm}`}>
                <section className={styles.pricingFormSection}>
                  <h3 className={styles.pricingFormSectionTitle}>
                    {t("serviceTemplates.pricingForm.vehicleSection")}
                  </h3>
                  <div className={styles.gridTwo}>
                <Select
                  label={t("serviceTemplates.fields.vehicleBrand")}
                  value={String(form.vehicleBrandId || "")}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    setForm((prev) => ({
                      ...prev,
                      vehicleBrandId: value,
                      vehicleModelId: 0,
                    }));
                  }}
                  searchable
                  placeholder={t("common.select")}
                  disabled={isDefinitionsLoading}
                >
                  <option value="">{t("common.select")}</option>
                  {(definitions?.brands ?? []).map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label={t("serviceTemplates.fields.vehicleModel")}
                  value={String(form.vehicleModelId || "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      vehicleModelId: Number(e.target.value) || 0,
                    }))
                  }
                  searchable
                  placeholder={t("common.select")}
                  disabled={isDefinitionsLoading || !form.vehicleBrandId}
                >
                  <option value="">{t("common.select")}</option>
                  {modelOptions.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label={t("serviceTemplates.fields.year")}
                  value={String(form.year || "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      year: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder={t("common.select")}
                >
                  <option value="">{t("common.select")}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>

                <Select
                  label={t("serviceTemplates.fields.fuelType")}
                  value={String(form.fuelTypeId || "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fuelTypeId: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder={t("common.select")}
                  disabled={isDefinitionsLoading}
                >
                  <option value="">{t("common.select")}</option>
                  {fuelTypeOptions.map((fuelType) => (
                    <option key={fuelType.id} value={fuelType.id}>
                      {fuelType.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label={t("serviceTemplates.fields.engine")}
                  value={String(form.engineId || "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      engineId: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder={t("common.select")}
                  disabled={isDefinitionsLoading}
                >
                  <option value="">{t("common.select")}</option>
                  {engineOptions.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label={t("serviceTemplates.fields.location")}
                  value={String(form.locationId || "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      locationId: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder={t("common.select")}
                  disabled={isDefinitionsLoading}
                >
                  <option value="">{t("common.select")}</option>
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Select>

                  </div>
                </section>

                <section className={styles.pricingFormSection}>
                  <div className={styles.pricingFormSectionHeader}>
                    <h3 className={styles.pricingFormSectionTitle}>
                      {t("serviceTemplates.pricingForm.servicesSection")}
                    </h3>
                    <Button className={styles.pricingSecondaryButton} size="small" variant="secondary" onClick={addCategory}>
                      <Plus size={14} aria-hidden="true" />
                      {t("serviceTemplates.actions.addCategory")}
                    </Button>
                  </div>

                  {form.categories.map((category, categoryIndex) => {
                const selectedCategory = rootServiceCategories.find(
                  (item) => item.id === category.serviceCategoryId,
                );
                const isProgrammingCategory =
                  isProgrammingServiceCategory(selectedCategory?.code) ||
                  isProgrammingServiceCategory(selectedCategory?.name);
                const serviceOptions = getServiceOptionsForCategory(
                  category.serviceCategoryId,
                );

                return (
                  <div
                    key={`category-${categoryIndex}`}
                    className={styles.serviceLinesBlock}
                  >
                    <div className={styles.serviceLinesHeader}>
                      <span>{t("serviceTemplates.fields.services")}</span>
                      <div className={styles.actions}>
                        <Button
                          className={styles.pricingSecondaryButton}
                          size="small"
                          variant="secondary"
                          onClick={() => addLine(categoryIndex)}
                        >
                          <Plus size={14} aria-hidden="true" />
                          {t("serviceTemplates.actions.addService")}
                        </Button>
                        <button
                          type="button"
                          className={`${styles.serviceRowAction} ${styles.pricingDeleteAction}`}
                          onClick={() => removeCategory(categoryIndex)}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <Select
                      label={t("serviceTemplates.fields.serviceCategory")}
                      value={String(category.serviceCategoryId || "")}
                      onChange={(e) =>
                        void setCategory(
                          categoryIndex,
                          Number(e.target.value) || 0,
                        )
                      }
                      placeholder={t("common.select")}
                    >
                      <option value="">{t("common.select")}</option>
                      {rootServiceCategories.map((item: ServiceCategoryItem) => (
                        <option key={item.id} value={item.id}>
                          {item.code}
                        </option>
                      ))}
                    </Select>

                    {isProgrammingCategory && (
                      <div className={styles.autoPricingInfo}>
                        {t("serviceTemplates.messages.programmingPriceAutoResolved")}
                      </div>
                    )}

                    {category.services.map((line, lineIndex) => (
                      <div key={lineIndex} className={styles.serviceLineRow}>
                        <Select
                          label={t("serviceTemplates.fields.service")}
                          value={String(line.serviceId || "")}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value) || 0;
                            const selectedService = serviceOptions.find(
                              (item) => item.id === selectedId,
                            );
                            setLine(categoryIndex, lineIndex, {
                              serviceId: selectedId,
                              serviceName:
                                selectedService?.name || selectedService?.code,
                              internalCost: selectedService?.internalCost,
                            });
                          }}
                          placeholder={t("common.select")}
                          searchable
                          disabled={isPricingServicesLoading || !category.serviceCategoryId}
                        >
                          <option value="">{t("common.select")}</option>
                          {category.serviceCategoryId > 0 &&
                            serviceOptions.length === 0 && (
                              <option value="" disabled>
                                {t("common.noData")}
                              </option>
                            )}
                          {serviceOptions.map((item: ServiceCatalogItem) => (
                            <option key={item.id} value={item.id}>
                              {item.name || item.code} ({item.code})
                            </option>
                          ))}
                        </Select>

                        {isProgrammingCategory ? (
                          <div className={styles.autoPricingInline}>
                            {line.serviceId <= 0
                              ? t("serviceTemplates.messages.programmingPriceAutoResolved")
                              : isProgrammingPricingLoading
                                ? t("common.loading")
                                : programmingResolvedByServiceId[line.serviceId]
                                    ?.hasProgrammerPricing
                                  ? `${Number(
                                      programmingResolvedByServiceId[line.serviceId]
                                        ?.programmerSellingPrice || 0,
                                    ).toLocaleString()} AMD`
                                  : t("serviceTemplates.messages.noProgrammerForVehicle")}
                          </div>
                        ) : (
                          <TextField
                            label={t("serviceTemplates.fields.servicePrice")}
                            type="number"
                            value={toDisplayNumber(Number(line.customerPrice || 0))}
                            onChange={(e) =>
                              setLine(categoryIndex, lineIndex, {
                                customerPrice: Number(e.target.value),
                              })
                            }
                          />
                        )}

                        <button
                          type="button"
                          className={`${styles.serviceRowAction} ${styles.pricingDeleteAction}`}
                          onClick={() => removeLine(categoryIndex, lineIndex)}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
                  })}

                  {selectedServicesSummary.length > 0 && (
                    <div className={styles.selectedServicesSummary}>
                    <div className={styles.selectedServicesTitle}>
                      {t("serviceTemplates.fields.services")}
                    </div>
                      {selectedServicesSummary.map((item) => (
                        <div key={`${item.id}-${item.categoryLabel}`} className={styles.selectedServiceItem}>
                          <span>{item.categoryLabel}: {item.label}</span>
                          <b>
                            {item.isAutoResolved
                              ? item.hasProgrammerPricing
                                ? `${Number(item.price || 0).toLocaleString()} AMD`
                                : t("serviceTemplates.messages.noProgrammerForVehicle")
                              : `${Number(item.price || 0).toLocaleString()} AMD`}
                          </b>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <TextField
                  label={t("serviceTemplates.fields.notes")}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
                <div className={styles.pricingTotalsPanel}>
                  <span>{t("serviceTemplates.fields.servicesTotal")}</span>
                  <strong>{serviceTotal.toLocaleString(i18n.language)} AMD</strong>
                </div>
              </div>
            </FormDrawer>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <>
          <div className={styles.section}>
            <div className={styles.categoryHeading}>
              <div className={styles.categoryHeadingCopy}>
                <h3>{t("serviceTemplates.tabs.categories")}</h3>
                <p>{t("serviceTemplates.categoryCatalog.description")}</p>
              </div>
              <span className={styles.categoryTotal}>
                {t("serviceTemplates.categoryCatalog.totalCount", { count: serviceCategories.length })}
              </span>
              <Button onClick={handleOpenCreateCategory}>
                <Plus size={15} aria-hidden="true" />
                {t("serviceTemplates.actions.addCategory")}
              </Button>
            </div>
            <div className={styles.categoryToolbar}>
              <TextField
                className={styles.categorySearch}
                label={t("serviceTemplates.categoryCatalog.searchLabel")}
                placeholder={t("serviceTemplates.categoryCatalog.searchPlaceholder")}
                value={categorySearch}
                onChange={(event) => {
                  setCategorySearch(event.target.value);
                  setCategoryPageIndex(0);
                }}
                icon={<Search size={15} aria-hidden="true" />}
              />
              <Select
                className={styles.categoryStatusFilter}
                label={t("serviceTemplates.fields.status")}
                value={categoryStatusFilter}
                onChange={(event) => {
                  setCategoryStatusFilter(event.target.value as typeof categoryStatusFilter);
                  setCategoryPageIndex(0);
                }}
              >
                <option value="all">{t("common.all")}</option>
                <option value="active">{t("common.active")}</option>
                <option value="inactive">{t("serviceTemplates.categoryCatalog.inactiveLabel")}</option>
              </Select>
              {(categorySearch || categoryStatusFilter !== "all") && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCategorySearch("");
                    setCategoryStatusFilter("all");
                    setCategoryPageIndex(0);
                  }}
                >
                  <X size={14} aria-hidden="true" />
                  {t("serviceTemplates.filters.reset")}
                </Button>
              )}
            </div>
          </div>

          <div className={`${styles.section} ${styles.tableSection} ${styles.categoryTableSection}`}>
            <div className={styles.categoryTableHeader}>
              <span>
                {t("serviceTemplates.categoryCatalog.resultCount", {
                  filtered: filteredServiceCategories.length,
                  total: serviceCategories.length,
                })}
              </span>
            </div>
            {showCategoryTableSkeleton ? (
              <PrpServiceLoader />
            ) : serviceCategoriesError ? (
              <div className={styles.categoryError} role="alert">
                <span>{t("serviceTemplates.categoryCatalog.loadFailed")}</span>
                <Button
                  variant="secondary"
                  onClick={() => void dispatch(fetchServiceCategories())}
                >
                  {t("serviceTemplates.categoryCatalog.retryLabel")}
                </Button>
              </div>
            ) : (
              <DataTable
                data={filteredServiceCategories}
                pageSize={categoryPageSize}
                pageSizeOptions={[10, 20, 50]}
                pageSizeLabel={t("serviceTemplates.categoryCatalog.pageSizeLabel")}
                pageIndex={categoryPageIndex}
                onPaginationChange={setCategoryPageIndex}
                onPageSizeChange={(pageSize) => {
                  setCategoryPageSize(pageSize);
                  setCategoryPageIndex(0);
                }}
                paginationRangeLabel={({ from, to, total }) =>
                  total > 0
                    ? t("serviceTemplates.categoryCatalog.rangeLabel", { from, to, total })
                    : null
                }
                noResultsText={t("serviceTemplates.categoryCatalog.emptyState")}
                columns={[
                  {
                    header: t("serviceTemplates.fields.code"),
                    accessorKey: "code",
                  },
                  {
                    header: t("serviceTemplates.categoryCatalog.nameLabel"),
                    accessorKey: "name",
                    cell: ({ row }) => (
                      <div className={styles.categoryNameCell}>
                        <strong>{row.original.name}</strong>
                        <div className={styles.categoryNameMeta}>
                          {row.original.description && <span>{row.original.description}</span>}
                          <span>
                            {t("serviceTemplates.categoryCatalog.displayOrderLabel", {
                              order: row.original.displayOrder,
                            })}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: t("serviceTemplates.fields.status"),
                    accessorKey: "isActive",
                    cell: ({ row }) =>
                      <span className={`${styles.categoryStatus} ${row.original.isActive !== false ? styles.categoryStatusActive : styles.categoryStatusInactive}`}>
                        {row.original.isActive !== false
                          ? t("common.active")
                          : t("serviceTemplates.categoryCatalog.inactiveLabel")}
                      </span>,
                  },
                  {
                    header: t("common.actions"),
                    accessorKey: "id",
                    cell: ({ row }) => (
                      <div className={styles.serviceRowActions}>
                        <button
                          type="button"
                          className={styles.serviceRowAction}
                          onClick={() => handleEditCategory(row.original)}
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.serviceRowAction}
                          onClick={() =>
                            void dispatch(
                              toggleServiceCategoryActive({
                                id: row.original.id,
                                isActive: !row.original.isActive,
                              }),
                            )
                          }
                          aria-label={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
                          title={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
                          aria-pressed={row.original.isActive}
                        >
                          <Power size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>

          <FormDrawer
            open={isCategoryFormOpen}
            onOpenChange={handleCategoryOpenChange}
            eyebrow={t("serviceTemplates.tabs.categories")}
            title={categoryForm.id
              ? t("serviceTemplates.categoryCatalog.editTitle")
              : t("serviceTemplates.categoryCatalog.addTitle")}
            titleId="service-category-drawer-title"
            closeLabel={t("common.close")}
            icon={<Wrench size={20} />}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancelCategory}
                  disabled={isCategorySaving}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => void handleCreateOrUpdateCategory()}
                  disabled={isCategorySaving}
                >
                  {isCategorySaving
                    ? t("common.loading")
                    : categoryForm.id
                      ? t("common.save")
                      : t("common.add")}
                </Button>
              </>
            }
          >
            <div className={styles.categoryDrawerForm}>
              <div className={styles.gridTwo}>
                <TextField
                  label={t("serviceTemplates.fields.code")}
                  value={categoryForm.code}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                  disabled={Boolean(categoryForm.id) || isCategorySaving}
                />
                <TextField
                  label={t("serviceTemplates.categoryCatalog.nameLabel")}
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  disabled={isCategorySaving}
                />
              </div>
              <Textarea
                label={t("serviceTemplates.fields.description")}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                disabled={isCategorySaving}
              />
              <TextField
                label={t("serviceTemplates.fields.displayOrder")}
                type="number"
                min="0"
                step="1"
                value={String(categoryForm.displayOrder)}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    displayOrder: Number(event.target.value) || 0,
                  }))
                }
                disabled={isCategorySaving}
              />
            </div>
          </FormDrawer>
        </>
      )}

      {activeTab === "employees" && <EmployeeManagement />}

      {false && activeTab === "employees" && (
        <>
          <div className={`${styles.section} ${styles.tableSection}`}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.tabs.employees")}</h3>
              <div className={styles.actions}>
                <div className={styles.filterControl}>
                  <Select
                    label={t("serviceTemplates.fields.filterByCategory")}
                    value={String(employeeCategoryFilterId)}
                    onChange={(e) => {
                      const selectedValue = Number(e.target.value);
                      handleEmployeeCategoryFilter(Number.isNaN(selectedValue) ? 0 : selectedValue);
                    }}
                    placeholder={t("common.select")}
                  >
                    <option value="0">{t("serviceTemplates.fields.allCategories")}</option>
                    {rootServiceCategories.map((item: ServiceCategoryItem) => (
                      <option key={item.id} value={item.id}>
                        {item.code}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  variant={isEmployeeFormOpen ? "secondary" : "primary"}
                  onClick={() => {
                    if (isEmployeeFormOpen) {
                      handleCancelEmployee();
                    } else {
                      setEmployeeForm(getInitialEmployeeForm());
                      setIsEmployeeFormOpen(true);
                    }
                  }}
                >
                  {isEmployeeFormOpen ? t("common.cancel") : t("common.add")}
                </Button>
              </div>
            </div>

            {isEmployeesLoading ? (
              <PrpServiceLoader />
            ) : (
              <DataTable
                data={employees ?? []}
                columns={[
                  {
                    header: t("serviceTemplates.fields.fullName"),
                    accessorKey: "fullName",
                    cell: ({ row }) =>
                      row.original.fullName ||
                      `${row.original.firstName || ""} ${row.original.lastName || ""}`.trim(),
                  },
                  {
                    header: t("serviceTemplates.fields.email"),
                    accessorKey: "email",
                  },
                  {
                    header: t("serviceTemplates.fields.phone"),
                    accessorKey: "phone",
                  },
                  {
                    header: t("serviceTemplates.fields.serviceCategory"),
                    accessorKey: "serviceCategoryName",
                    cell: ({ row }) =>
                      row.original.serviceCategoryName || `#${row.original.serviceCategoryId}`,
                  },
                  {
                    header: t("serviceTemplates.fields.hireDate"),
                    accessorKey: "hireDate",
                    cell: ({ row }) => formatDateValue(row.original.hireDate),
                  },
                  {
                    header: t("serviceTemplates.fields.notes"),
                    accessorKey: "notes",
                    cell: ({ row }) => row.original.notes || "-",
                  },
                  {
                    header: t("serviceTemplates.fields.status"),
                    accessorKey: "isActive",
                    cell: ({ getValue }) =>
                      getValue<boolean>() ? t("common.active") : t("common.inactive"),
                  },
                  {
                    header: t("common.actions"),
                    accessorKey: "id",
                    cell: ({ row }) => (
                      <div className={styles.actions}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleEditEmployee(row.original)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            dispatch(
                              toggleEmployeeActive({
                                id: row.original.id,
                                isActive: !row.original.isActive,
                              }),
                            )
                          }
                        >
                          {row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>

          {isEmployeeFormOpen && (
            <div className={`${styles.section} ${styles.collapsiblePanel}`}>
              <div className={styles.header}>
                <h3 className={styles.title}>
                  {employeeForm.id
                    ? t("serviceTemplates.actions.update")
                    : t("serviceTemplates.actions.create")}
                </h3>
                <div className={styles.actions}>
                  <Button onClick={handleCreateOrUpdateEmployee}>
                    {employeeForm.id ? t("serviceTemplates.actions.update") : t("common.add")}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEmployee}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <TextField
                  label={t("serviceTemplates.fields.firstName")}
                  value={employeeForm.firstName}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
                <TextField
                  label={t("serviceTemplates.fields.lastName")}
                  value={employeeForm.lastName}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
                <TextField
                  label={t("serviceTemplates.fields.email")}
                  value={employeeForm.email}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
                <TextField
                  label={t("serviceTemplates.fields.phone")}
                  value={employeeForm.phone}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
                <Select
                  label={t("serviceTemplates.fields.serviceCategory")}
                  value={String(employeeForm.serviceCategoryId || "")}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({
                      ...prev,
                      serviceCategoryId: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder={t("common.select")}
                >
                  <option value="">{t("common.select")}</option>
                  {rootServiceCategories.map((item: ServiceCategoryItem) => (
                    <option key={item.id} value={item.id}>
                      {item.code}
                    </option>
                  ))}
                </Select>
                <TextField
                  label={t("serviceTemplates.fields.hireDate")}
                  type="date"
                  value={employeeForm.hireDate}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, hireDate: e.target.value }))
                  }
                  disabled={Boolean(employeeForm.id)}
                />
                <TextField
                  label={t("serviceTemplates.fields.notes")}
                  value={employeeForm.notes}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "services" && (
        <>
          <div className={styles.serviceCatalogPage}>
            <SectionHeader
              title={t("serviceTemplates.tabs.services")}
              icon={<Wrench size={17} color="#d2bf8a" aria-hidden="true" />}
              actions={
                <Button
                  className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                  onClick={handleNewService}
                >
                  <Plus size={15} aria-hidden="true" />
                  {t("serviceTemplates.actions.addService")}
                </Button>
              }
            />

            <div className={styles.serviceCatalogToolbar}>
              <TextField
                className={styles.serviceCatalogSearch}
                label={t("serviceTemplates.serviceCatalog.searchLabel")}
                placeholder={t("serviceTemplates.serviceCatalog.searchPlaceholder")}
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                icon={<Search size={15} aria-hidden="true" />}
              />
            </div>

            <div className={styles.serviceCatalogTable}>
              <div className={styles.serviceCatalogTableHeader}>
                <h3>{t("serviceTemplates.serviceCatalog.listTitle")}</h3>
                <span>
                  {filteredServiceCatalog.length} / {serviceCatalog?.length ?? 0}
                </span>
              </div>

              {showServiceTableSkeleton ? (
                <PrpServiceLoader />
              ) : (
                <DataTable
                  data={filteredServiceCatalog}
                  columns={[
                    { header: t("serviceTemplates.fields.code"), accessorKey: "code" },
                    { header: t("serviceTemplates.fields.name"), accessorKey: "name" },
                    {
                      header: t("serviceTemplates.fields.description"),
                      accessorKey: "description",
                      cell: ({ row }) => row.original.description || "-",
                    },
                    {
                      header: t("serviceTemplates.fields.serviceCategory"),
                      accessorKey: "serviceCategoryName",
                      cell: ({ row }) =>
                        row.original.serviceCategoryName || `#${row.original.serviceCategoryId}`,
                    },
                    { header: t("serviceTemplates.table.internalCost"), accessorKey: "internalCost" },
                    {
                      header: t("serviceTemplates.fields.estimatedDurationMinutes"),
                      accessorKey: "estimatedDurationMinutes",
                    },
                    {
                      header: t("serviceTemplates.fields.status"),
                      accessorKey: "isActive",
                      cell: ({ getValue }) =>
                        getValue<boolean>() ? t("common.active") : t("common.inactive"),
                    },
                    {
                      header: t("serviceTemplates.table.actions"),
                      accessorKey: "id",
                      cell: ({ row }) => (
                        <div className={styles.serviceRowActions}>
                          <button
                            type="button"
                            className={styles.serviceRowAction}
                            onClick={() => handleViewService(row.original)}
                            aria-label={t("serviceTemplates.serviceCatalog.view")}
                            title={t("serviceTemplates.serviceCatalog.view")}
                          >
                            <Eye size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.serviceRowAction}
                            onClick={() => handleEditService(row.original)}
                            aria-label={t("common.edit")}
                            title={t("common.edit")}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.serviceRowAction} ${row.original.isActive ? styles.serviceDeactivate : styles.serviceActivate}`}
                            onClick={() =>
                              void dispatch(
                                toggleServiceCatalogActive({
                                  id: row.original.id,
                                  isActive: !row.original.isActive,
                                }),
                              )
                            }
                            aria-label={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
                            title={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
                          >
                            <Power size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  isLoading={false}
                  noResultsText={t("serviceTemplates.serviceCatalog.emptyState")}
                />
              )}
            </div>
          </div>

          {isServiceFormOpen &&
            createPortal(
              <div
                className={styles.serviceDrawerBackdrop}
                onMouseDown={handleCancelService}
              >
                <aside
                  className={styles.serviceDrawer}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="service-catalog-drawer-title"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <header className={styles.serviceDrawerHeader}>
                    <div className={styles.serviceDrawerIcon} aria-hidden="true">
                      <Wrench size={20} />
                    </div>
                    <div className={styles.serviceDrawerHeaderCopy}>
                      <span>{t("serviceTemplates.tabs.services")}</span>
                      <h2 id="service-catalog-drawer-title">
                        {isServiceViewOnly
                          ? t("serviceTemplates.serviceCatalog.viewTitle")
                          : serviceForm.id
                            ? t("serviceTemplates.serviceCatalog.editTitle")
                            : t("serviceTemplates.serviceCatalog.addTitle")}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className={styles.serviceDrawerClose}
                      onClick={handleCancelService}
                      aria-label={t("common.close")}
                      title={t("common.close")}
                    >
                      <X size={18} />
                    </button>
                  </header>

                  <div className={styles.serviceDrawerBody}>
                    <div className={styles.serviceDrawerSectionHeading}>
                      <BadgeCheck size={15} aria-hidden="true" />
                      <span>{t("serviceTemplates.serviceCatalog.details")}</span>
                    </div>

                    <div className={styles.serviceDrawerGrid}>
                      <TextField
                        label={t("serviceTemplates.fields.code")}
                        value={serviceForm.code}
                        onChange={(event) =>
                          setServiceForm((previous) => ({ ...previous, code: event.target.value }))
                        }
                        icon={<Hash size={15} aria-hidden="true" />}
                        disabled={Boolean(serviceForm.id) || isServiceViewOnly}
                      />
                      <TextField
                        label={t("serviceTemplates.fields.name")}
                        value={serviceForm.name}
                        onChange={(event) =>
                          setServiceForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        icon={<Wrench size={15} aria-hidden="true" />}
                        disabled={isServiceViewOnly}
                      />
                      <div className={styles.serviceDrawerWide}>
                        <label className={styles.serviceDrawerLabel}>
                          <FileText size={14} aria-hidden="true" />
                          <span>{t("serviceTemplates.fields.description")}</span>
                        </label>
                        <Textarea
                          value={serviceForm.description}
                          onChange={(event) =>
                            setServiceForm((previous) => ({ ...previous, description: event.target.value }))
                          }
                          rows={3}
                          resizable={false}
                          disabled={isServiceViewOnly}
                        />
                      </div>
                      <Select
                        label={t("serviceTemplates.fields.serviceCategory")}
                        value={String(serviceForm.serviceCategoryId || "")}
                        onChange={(event) =>
                          setServiceForm((previous) => ({
                            ...previous,
                            serviceCategoryId: Number(event.target.value) || 0,
                          }))
                        }
                        placeholder={t("common.select")}
                        disabled={isServiceViewOnly}
                      >
                        <option value="">{t("common.select")}</option>
                        {(isServiceViewOnly ? serviceCategories : rootServiceCategories).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.code}
                          </option>
                        ))}
                      </Select>
                      <TextField
                        label={t("serviceTemplates.table.internalCost")}
                        type="number"
                        value={toDisplayNumber(serviceForm.internalCost)}
                        onChange={(event) =>
                          setServiceForm((previous) => ({
                            ...previous,
                            internalCost: Number(event.target.value) || 0,
                          }))
                        }
                        icon={<CircleDollarSign size={15} aria-hidden="true" />}
                        disabled={isServiceViewOnly}
                      />
                      <TextField
                        label={t("serviceTemplates.fields.estimatedDurationMinutes")}
                        type="number"
                        value={toDisplayNumber(serviceForm.estimatedDurationMinutes)}
                        onChange={(event) =>
                          setServiceForm((previous) => ({
                            ...previous,
                            estimatedDurationMinutes: Number(event.target.value) || 0,
                          }))
                        }
                        icon={<Clock3 size={15} aria-hidden="true" />}
                        disabled={isServiceViewOnly}
                      />
                    </div>
                  </div>

                  <footer className={styles.serviceDrawerFooter}>
                    <Button
                      variant="secondary"
                      className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                      onClick={handleCancelService}
                      disabled={isServiceCatalogLoading}
                    >
                      {isServiceViewOnly ? t("common.close") : t("common.cancel")}
                    </Button>
                    {!isServiceViewOnly && (
                      <Button
                        className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                        onClick={() => void handleCreateOrUpdateService()}
                        disabled={isServiceCatalogLoading}
                      >
                        {isServiceCatalogLoading
                          ? t("common.loading")
                          : t("common.save")}
                      </Button>
                    )}
                  </footer>
                </aside>
              </div>,
              document.body,
            )}
        </>
      )}

      {activeTab === "programmers" && <ProgrammingPricingAdmin />}
    </div>
  );
};
