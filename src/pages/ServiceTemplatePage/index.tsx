import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

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

import { DataTable, Button, Select, Tab, TabGroup, TextField } from "@/ui-kit";

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
  const { items: serviceCategories } = useAppSelector(
    (state) => state.serviceCategory,
  );
  const { items: employees, isLoading: isEmployeesLoading } = useAppSelector(
    (state) => state.employees,
  );
  const { items: serviceCatalog, isLoading: isServiceCatalogLoading } =
    useAppSelector((state) => state.servicesCatalog);
  const { items: pricingItems, isLoading: isPricingLoading } = useAppSelector(
    (state) => state.vehicleServicePricing,
  );

  const [form, setForm] = useState<FormState>(getInitialForm());
  const [activeTab, setActiveTab] = useState<ServiceTemplateTab>("pricing");
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    getInitialCategoryForm(),
  );

  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(
    getInitialEmployeeForm(),
  );
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [isPricingFormOpen, setIsPricingFormOpen] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);
  const [employeeCategoryFilterId, setEmployeeCategoryFilterId] = useState(0);
  const [pricingFuelTypeFilterId, setPricingFuelTypeFilterId] = useState(0);
  const [pricingEngineFilterId, setPricingEngineFilterId] = useState(0);

  const [serviceForm, setServiceForm] = useState<ServiceFormState>(
    getInitialServiceForm(),
  );
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
    () =>
      form.categories.reduce(
        (sum, category) =>
          sum +
          category.services.reduce(
            (servicesSum, service) => servicesSum + Number(service.customerPrice || 0),
            0,
          ),
        0,
      ),
    [form.categories],
  );

  const expandedTemplate = useMemo(
    () =>
      pricingItems.find((item) => item.id === expandedTemplateId) ?? null,
    [expandedTemplateId, pricingItems],
  );

  const filteredPricingItems = useMemo(
    () =>
      (pricingItems ?? []).filter((item) => {
        const matchesFuel =
          pricingFuelTypeFilterId === 0 ||
          Number(item.fuelTypeId || 0) === pricingFuelTypeFilterId;
        const matchesEngine =
          pricingEngineFilterId === 0 ||
          Number(item.engineId || 0) === pricingEngineFilterId;

        return matchesFuel && matchesEngine;
      }),
    [pricingItems, pricingFuelTypeFilterId, pricingEngineFilterId],
  );

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
      toast.error(t("serviceTemplates.messages.validationFailed"));
      return;
    }

    try {
      if (categoryForm.id) {
        const payload: ServiceCategoryUpdatePayload = {
          id: categoryForm.id,
          name,
          description,
          displayOrder: Number(categoryForm.displayOrder || 0),
        };
        await dispatch(editServiceCategory(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.updated"));
      } else {
        const payload: ServiceCategoryCreatePayload = {
          code,
          name,
          description,
          displayOrder: Number(categoryForm.displayOrder || 0),
        };
        await dispatch(addServiceCategory(payload)).unwrap();
        toast.success(t("serviceTemplates.messages.created"));
      }

      setCategoryForm(getInitialCategoryForm());
      dispatch(fetchServiceCategories());
    } catch {
      toast.error(
        categoryForm.id
          ? t("serviceTemplates.messages.updateFailed")
          : t("serviceTemplates.messages.createFailed"),
      );
    }
  };

  const handleEditCategory = (item: ServiceCategoryItem) => {
    setCategoryForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      displayOrder: Number(item.displayOrder || 0),
    });
  };

  const handleCancelCategory = () => {
    setCategoryForm(getInitialCategoryForm());
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
  };

  const handleCancelService = () => {
    setServiceForm(getInitialServiceForm());
  };

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

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t("serviceTemplates.messages.validationFailed"));
      return;
    }

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
      <div className={styles.section}>
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
            onClick={() => setActiveTab("categories")}
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
          <div className={`${styles.section} ${styles.tableSection}`}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.title")}</h3>
              <div className={styles.pricingToolbar}>
                <div className={styles.pricingFilters}>
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
                </div>

                <div className={styles.pricingActions}>
                  <Button variant="secondary" onClick={handleLoadVehiclePricing}>
                    {t("serviceTemplates.actions.loadPricing")}
                  </Button>
                  <Button
                    variant={isPricingFormOpen ? "secondary" : "primary"}
                    onClick={() => setIsPricingFormOpen((prev) => !prev)}
                  >
                    {isPricingFormOpen ? t("common.cancel") : t("common.add")}
                  </Button>
                </div>
              </div>
            </div>

            {isPricingLoading ? (
              <div className={styles.loading}>{t("common.loading")}</div>
            ) : (
              <DataTable
                data={filteredPricingItems}
                columns={[
                  {
                    header: t("serviceTemplates.fields.vehicleBrand"),
                    accessorKey: "brandName",
                    cell: ({ row }) => row.original.brandName || `#${row.original.brandId}`,
                  },
                  {
                    header: t("serviceTemplates.fields.vehicleModel"),
                    accessorKey: "modelName",
                    cell: ({ row }) => row.original.modelName || `#${row.original.modelId}`,
                  },
                  {
                    header: t("serviceTemplates.fields.year"),
                    accessorKey: "year",
                  },
                  {
                    header: t("serviceTemplates.fields.fuelType"),
                    accessorKey: "fuelTypeName",
                    cell: ({ row }) => row.original.fuelTypeName || `#${row.original.fuelTypeId || 0}`,
                  },
                  {
                    header: t("serviceTemplates.fields.engine"),
                    accessorKey: "engineName",
                    cell: ({ row }) => row.original.engineName || `#${row.original.engineId || 0}`,
                  },
                  {
                    header: t("serviceTemplates.fields.location"),
                    accessorKey: "location",
                  },
                  {
                    header: t("serviceTemplates.fields.serviceCategory"),
                    accessorKey: "serviceCategoryName",
                    cell: ({ row }) => {
                      const categoryLabels = getTemplateCategories(row.original)
                        .map((category) => {
                          const selectedCategory = rootServiceCategories.find(
                            (item) => item.id === category.serviceCategoryId,
                          );
                          return (
                            selectedCategory?.name ||
                            selectedCategory?.code ||
                            `#${category.serviceCategoryId}`
                          );
                        })
                        .filter((label) => !!label);

                      return categoryLabels.length > 0 ? categoryLabels.join(", ") : "-";
                    },
                  },
                  {
                    header: t("serviceTemplates.fields.services"),
                    accessorKey: "items",
                    cell: ({ row }) =>
                      getTemplateItems(row.original)
                        ?.map((item) => {
                          const serviceName = item.serviceName || `#${item.serviceId}`;

                          if (!item.isProgrammerService) {
                            return serviceName;
                          }

                          if (!item.bestProgrammerUsername) {
                            return `${serviceName} (${t("serviceTemplates.messages.noProgrammerForVehicle")})`;
                          }

                          return `${serviceName} (${item.bestProgrammerUsername})`;
                        })
                        .join(", ") || "-",
                  },
                  {
                    header: t("serviceTemplates.table.totalAmount"),
                    accessorKey: "electricityPrice",
                    cell: ({ row }) => {
                      const servicesTotal = getTemplateItems(row.original)?.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.isProgrammerService
                              ? item.programmerSellingPrice || 0
                              : item.customerPrice || 0,
                          ),
                        0,
                      );
                      return servicesTotal ?? 0;
                    },
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
                          onClick={() => handleEditPricingTemplate(row.original)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            setExpandedTemplateId((prev) =>
                              prev === row.original.id ? null : row.original.id,
                            )
                          }
                        >
                          {expandedTemplateId === row.original.id
                            ? t("serviceTemplates.actions.hideItems")
                            : t("serviceTemplates.actions.viewItems")}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            )}

            {expandedTemplate && (
              <div className={styles.templateItemsPanel}>
                <div className={styles.templateItemsTitle}>
                  {expandedTemplate.brandName || "-"} / {expandedTemplate.modelName || "-"} / {expandedTemplate.year}
                </div>
                {getTemplateItems(expandedTemplate).length === 0 ? (
                  <div className={styles.templateItemsEmpty}>{t("common.noData")}</div>
                ) : (
                  <div className={styles.templateItemsAccordion}>
                    {getTemplateItems(expandedTemplate).map((item) => (
                      <details
                        key={item.id || item.serviceId}
                        className={styles.templateItemCard}
                      >
                        <summary className={styles.templateItemSummary}>
                          <span>{item.serviceName || `#${item.serviceId}`}</span>
                          <span className={styles.templateItemSummaryPrice}>
                            {t("serviceTemplates.table.servicePrice")}: {item.customerPrice ?? 0}
                          </span>
                        </summary>
                        <div className={styles.templateItemMetrics}>
                          {!item.isProgrammerService ? (
                            <>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.internalCost")}</span>
                                <strong>{item.internalCost ?? 0}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.servicePrice")}</span>
                                <strong>{item.customerPrice ?? 0}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.profit")}</span>
                                <strong>{item.profit ?? 0}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.marginPercent")}</span>
                                <strong>{item.profitMargin ?? 0}%</strong>
                              </div>
                            </>
                          ) : item.bestProgrammerUsername ? (
                            <>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.bestProgrammer")}</span>
                                <strong>{item.bestProgrammerUsername}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.servicePrice")}</span>
                                <strong>{item.programmerSellingPrice ?? 0}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.programmerCost")}</span>
                                <strong>{item.programmerServiceCost ?? 0}</strong>
                              </div>
                              <div className={styles.templateItemMetric}>
                                <span>{t("serviceTemplates.table.profit")}</span>
                                <strong>{item.programmerProfit ?? 0}</strong>
                              </div>
                            </>
                          ) : (
                            <div className={styles.noProgrammerWarning}>
                              {t("serviceTemplates.messages.noProgrammerForVehicle")}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isPricingFormOpen && (
            <div className={`${styles.section} ${styles.collapsiblePanel}`}>
              <div className={styles.header}>
                <h3 className={styles.title}>
                  {form.id
                    ? t("serviceTemplates.actions.update")
                    : t("serviceTemplates.actions.create")}
                </h3>
                <div className={styles.actions}>
                  <Button onClick={handleSave}>
                    {form.id
                      ? t("serviceTemplates.actions.update")
                      : t("serviceTemplates.actions.create")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setForm(getInitialForm());
                      setPricingServiceOptionsByCategoryId({});
                      setIsPricingFormOpen(false);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>

              <div className={styles.form}>
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

              <div className={styles.actions}>
                <Button size="small" variant="secondary" onClick={addCategory}>
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
                          size="small"
                          variant="secondary"
                          onClick={() => addLine(categoryIndex)}
                        >
                          {t("serviceTemplates.actions.addService")}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => removeCategory(categoryIndex)}
                        >
                          {t("common.delete")}
                        </Button>
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

                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => removeLine(categoryIndex, lineIndex)}
                        >
                          {t("common.delete")}
                        </Button>
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
                            : item.price}
                        </b>
                      </div>
                    ))}
                  </div>
                )}

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
              </div>

              <div className={styles.totalsPanel}>
                <div>
                  {t("serviceTemplates.fields.servicesTotal")}: <b>{serviceTotal}</b>
                </div>
                <div>
                  {t("serviceTemplates.table.totalAmount")}: <b>{serviceTotal}</b>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <>
          <div className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.tabs.categories")}</h3>
              <div className={styles.actions}>
                <Button onClick={handleCreateOrUpdateCategory}>
                  {categoryForm.id ? t("serviceTemplates.actions.update") : t("common.add")}
                </Button>
                {categoryForm.id && (
                  <Button variant="secondary" onClick={handleCancelCategory}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            </div>
            <div className={styles.gridTwo}>
              <TextField
                label={t("serviceTemplates.fields.code")}
                value={categoryForm.code}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, code: e.target.value }))
                }
                disabled={Boolean(categoryForm.id)}
              />
              <TextField
                label={t("serviceTemplates.fields.name")}
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <TextField
                label={t("serviceTemplates.fields.description")}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <TextField
                label={t("serviceTemplates.fields.displayOrder")}
                type="number"
                value={String(categoryForm.displayOrder)}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    displayOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className={`${styles.section} ${styles.tableSection}`}>
            <DataTable
              data={serviceCategories ?? []}
              columns={[
                {
                  header: t("serviceTemplates.fields.code"),
                  accessorKey: "code",
                },
                {
                  header: t("serviceTemplates.fields.name"),
                  accessorKey: "name",
                },
                {
                  header: t("serviceTemplates.fields.description"),
                  accessorKey: "description",
                  cell: ({ row }) => row.original.description || "-",
                },
                {
                  header: t("serviceTemplates.fields.displayOrder"),
                  accessorKey: "displayOrder",
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
                        onClick={() => handleEditCategory(row.original)}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() =>
                          dispatch(
                            toggleServiceCategoryActive({
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
          </div>
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
              <div className={styles.loading}>{t("common.loading")}</div>
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
          <div className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.tabs.services")}</h3>
              <div className={styles.actions}>
                <Button onClick={handleCreateOrUpdateService}>
                  {serviceForm.id ? t("serviceTemplates.actions.update") : t("common.add")}
                </Button>
                {serviceForm.id && (
                  <Button variant="secondary" onClick={handleCancelService}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            </div>
            <div className={styles.gridTwo}>
              <TextField
                label={t("serviceTemplates.fields.code")}
                value={serviceForm.code}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, code: e.target.value }))
                }
                disabled={Boolean(serviceForm.id)}
              />
              <TextField
                label={t("serviceTemplates.fields.name")}
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <TextField
                label={t("serviceTemplates.fields.description")}
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <Select
                label={t("serviceTemplates.fields.serviceCategory")}
                value={String(serviceForm.serviceCategoryId || "")}
                onChange={(e) =>
                  setServiceForm((prev) => ({
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
                label={t("serviceTemplates.table.internalCost")}
                type="number"
                value={toDisplayNumber(serviceForm.internalCost)}
                onChange={(e) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    internalCost: Number(e.target.value) || 0,
                  }))
                }
              />
              <TextField
                label={t("serviceTemplates.fields.estimatedDurationMinutes")}
                type="number"
                value={toDisplayNumber(serviceForm.estimatedDurationMinutes)}
                onChange={(e) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    estimatedDurationMinutes: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className={`${styles.section} ${styles.tableSection}`}>
            {isServiceCatalogLoading ? (
              <div className={styles.loading}>{t("common.loading")}</div>
            ) : (
              <DataTable
                data={serviceCatalog ?? []}
                columns={[
                  {
                    header: t("serviceTemplates.fields.code"),
                    accessorKey: "code",
                  },
                  {
                    header: t("serviceTemplates.fields.name"),
                    accessorKey: "name",
                  },
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
                  {
                    header: t("serviceTemplates.table.internalCost"),
                    accessorKey: "internalCost",
                  },
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
                    header: t("common.actions"),
                    accessorKey: "id",
                    cell: ({ row }) => (
                      <div className={styles.actions}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleEditService(row.original)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            dispatch(
                              toggleServiceCatalogActive({
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
        </>
      )}

      {activeTab === "programmers" && <ProgrammingPricingAdmin />}
    </div>
  );
};
