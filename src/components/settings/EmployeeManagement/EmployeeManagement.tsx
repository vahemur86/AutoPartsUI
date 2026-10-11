import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Wallet, CalendarCheck2, Calculator, Percent, UserCog, Check, CircleX, Search, X, Pencil, Power, ChevronDown } from "lucide-react";
import { PrpServiceLoader } from "@/components/common/PrpServiceLoader";
import { FormDrawer } from "@/components/common/FormDrawer";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchServiceCategories } from "@/store/slices/serviceCategorySlice";
import { fetchServicesCatalog } from "@/store/slices/servicesCatalogSlice";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import {
  activateEmployee,
  calculateEmployeeSalary,
  createEmployee,
  createEmployeeDeposit,
  deactivateEmployee,
  getAllEmployeeDeposits,
  getAttendanceByDate,
  getEmployeeAttendanceHistory,
  getEmployeeDeposits,
  getEmployeeSalaryHistory,
  getEmployeeUnpaidSalarySummary,
  getEmployeeServicePercentages,
  getEmployeeServicePercentagesByService,
  getSalaryByDate,
  payEmployeeUnpaidSalary,
  upsertEmployeeAttendance,
  upsertEmployeeServicePercentage,
  updateEmployee,
} from "@/services/settings/workshopPricing";

// ui-kit
import { Button, ConfirmationModal, DataTable, Select, Tab, TabGroup, TextField, Textarea } from "@/ui-kit";

// types
import type {
  EmployeeAttendanceItem,
  EmployeeAttendancePayload,
  EmployeeAttendanceStatus,
  EmployeeCreatePayload,
  EmployeeDepositItem,
  EmployeeDepositPayload,
  EmployeeItem,
  EmployeeSalaryRecordItem,
  EmployeeSalaryType,
  EmployeeUnpaidSalarySummary,
  EmployeeType,
  EmployeeServicePercentageItem,
  EmployeeServicePercentagePayload,
  EmployeeUpdatePayload,
  ServiceCatalogItem,
  ServiceCategoryItem,
} from "@/types/settings";

// styles
import styles from "./EmployeeManagement.module.css";

const employeeColumnHelper = createColumnHelper<EmployeeItem>();
const percentageColumnHelper = createColumnHelper<EmployeeServicePercentageItem>();
const attendanceColumnHelper = createColumnHelper<EmployeeAttendanceItem>();
const salaryColumnHelper = createColumnHelper<EmployeeSalaryRecordItem>();

const money = (value: number): string =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayValue = (): string => toDateString(new Date());

const dateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateString(date);
};

const hasSalaryMonthEnded = (value: string): boolean => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= monthEnd;
};

const salaryMonthEndDate = (value: string): string => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return toDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

const isDirectorSalary = (
  record: EmployeeSalaryRecordItem,
  employee?: EmployeeItem,
): boolean => record.employeeType === "Director" || employee?.employeeType === "Director";

const sortPayrollRecords = (
  records: EmployeeSalaryRecordItem[],
): EmployeeSalaryRecordItem[] => {
  return [...records].sort((a, b) => {
    const paidOrder = Number(Boolean(a.isPaid)) - Number(Boolean(b.isPaid));
    if (paidOrder !== 0) return paidOrder;

    const dateOrder = String(b.workDate || "").localeCompare(String(a.workDate || ""));
    if (dateOrder !== 0) return dateOrder;

    return String(a.employeeFullName || "").localeCompare(String(b.employeeFullName || ""));
  });
};

const emptyEmployeeForm = () => ({
  id: null as number | null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  shopId: 0,
  serviceCategoryId: 0,
  hireDate: todayValue(),
  salaryType: "FixedDaily" as EmployeeSalaryType,
  fixedDailySalary: 0,
  employeeType: "Regular" as EmployeeType,
  powderBonusKgThreshold: 0,
  powderBonusAmount: 0,
  notes: "",
});

const emptyDepositForm = () => ({
  employeeId: 0,
  amount: 0,
  notes: "",
});

const emptyPercentageForm = () => ({
  employeeId: 0,
  serviceId: 0,
  percentage: 0,
});

type ManagementTab = "employees" | "percentages" | "deposits" | "attendance" | "payroll";

export const EmployeeManagement = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    items: employees,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useAppSelector((state) => state.employees);
  const showEmployeesLoader = useMinimumLoadingDuration(isEmployeesLoading);
  const { shops } = useAppSelector((state) => state.shops);
  const { items: serviceCategories } = useAppSelector((state) => state.serviceCategory);
  const { items: servicesCatalog } = useAppSelector((state) => state.servicesCatalog);
  const { user } = useAppSelector((state) => state.auth);
  const canMarkSalaryPaid = ["admin", "superadmin", "manager"].includes(
    user?.role?.toLowerCase() || "",
  );

  const [activeTab, setActiveTab] = useState<ManagementTab>("employees");
  const [categoryFilterId, setCategoryFilterId] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [employeePageIndex, setEmployeePageIndex] = useState(0);
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm());
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(0);
  const [servicePercentageForm, setServicePercentageForm] = useState(emptyPercentageForm());
  const [percentageResultsView, setPercentageResultsView] = useState<"employee" | "service">("employee");
  const [percentageEmployeeFilterId, setPercentageEmployeeFilterId] = useState(0);
  const [percentageServiceFilterId, setPercentageServiceFilterId] = useState(0);
  const [isPercentageDrawerOpen, setIsPercentageDrawerOpen] = useState(false);
  const [percentageRefreshKey, setPercentageRefreshKey] = useState(0);
  const [isSavingPercentage, setIsSavingPercentage] = useState(false);
  const [isLoadingEmployeePercentages, setIsLoadingEmployeePercentages] = useState(false);
  const [isLoadingServicePercentages, setIsLoadingServicePercentages] = useState(false);
  const [employeePercentagesError, setEmployeePercentagesError] = useState(false);
  const [servicePercentagesError, setServicePercentagesError] = useState(false);
  const [depositForm, setDepositForm] = useState(emptyDepositForm());
  const [depositHistory, setDepositHistory] = useState<EmployeeDepositItem[]>([]);
  const [allDeposits, setAllDeposits] = useState<EmployeeDepositItem[]>([]);
  const [allDepositsShopId, setAllDepositsShopId] = useState(0);
  const [allDepositsActiveOnly, setAllDepositsActiveOnly] = useState(false);
  const [depositView, setDepositView] = useState<"employee" | "all">("employee");
  const [depositHistoryEmployeeId, setDepositHistoryEmployeeId] = useState(0);
  const [depositRefreshKey, setDepositRefreshKey] = useState(0);
  const [isDepositDrawerOpen, setIsDepositDrawerOpen] = useState(false);
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);
  const [isLoadingDepositHistory, setIsLoadingDepositHistory] = useState(false);
  const [isLoadingAllDeposits, setIsLoadingAllDeposits] = useState(false);
  const [depositHistoryError, setDepositHistoryError] = useState(false);
  const [allDepositsError, setAllDepositsError] = useState(false);
  const [employeePercentages, setEmployeePercentages] = useState<EmployeeServicePercentageItem[]>([]);
  const [servicePercentagesByService, setServicePercentagesByService] = useState<EmployeeServicePercentageItem[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(todayValue());
  const [attendanceShopId, setAttendanceShopId] = useState(0);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [attendanceLoadError, setAttendanceLoadError] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  const [attendanceNotes, setAttendanceNotes] = useState<Record<number, string>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, EmployeeAttendanceStatus>>({});
  const [attendanceHistoryEmployeeId, setAttendanceHistoryEmployeeId] = useState(0);
  const [attendanceHistoryFromDate, setAttendanceHistoryFromDate] = useState(dateDaysAgo(29));
  const [attendanceHistoryToDate, setAttendanceHistoryToDate] = useState(todayValue());
  const [isLoadingAttendanceHistory, setIsLoadingAttendanceHistory] = useState(false);
  const [attendanceHistoryLoadError, setAttendanceHistoryLoadError] = useState(false);
  const [attendanceHistoryRefreshKey, setAttendanceHistoryRefreshKey] = useState(0);
  const [payrollDate, setPayrollDate] = useState(todayValue());
  const [payrollShopId, setPayrollShopId] = useState(0);
  const [payrollEmployeeId, setPayrollEmployeeId] = useState(0);
  const [salaryHistoryEmployeeId, setSalaryHistoryEmployeeId] = useState(0);
  const [salaryHistoryFromDate, setSalaryHistoryFromDate] = useState(todayValue());
  const [salaryHistoryToDate, setSalaryHistoryToDate] = useState(todayValue());
  const [salaryPaymentEmployeeId, setSalaryPaymentEmployeeId] = useState(0);
  const [dailyPayroll, setDailyPayroll] = useState<EmployeeSalaryRecordItem[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalaryRecordItem[]>([]);
  const [unpaidSalarySummary, setUnpaidSalarySummary] = useState<EmployeeUnpaidSalarySummary | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<EmployeeAttendanceItem[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryHistoryLoading, setSalaryHistoryLoading] = useState(false);
  const [unpaidSummaryLoading, setUnpaidSummaryLoading] = useState(false);
  const [unpaidSummaryError, setUnpaidSummaryError] = useState(false);
  const [unpaidSummaryRefreshKey, setUnpaidSummaryRefreshKey] = useState(0);
  const [isPayingUnpaidSalary, setIsPayingUnpaidSalary] = useState(false);
  const [salaryToPayConfirm, setSalaryToPayConfirm] =
    useState<{ summary: EmployeeUnpaidSalarySummary; toDate: string } | null>(null);
  const [salaryCalculationNotice, setSalaryCalculationNotice] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchEmployees({ includeInactive: true }));
    dispatch(fetchShops());
    dispatch(fetchServiceCategories());
    dispatch(fetchServicesCatalog());
  }, [dispatch]);

  const categoryOptions = useMemo(
    () => serviceCategories.filter((item: ServiceCategoryItem) => item.isActive !== false),
    [serviceCategories],
  );

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      if (categoryFilterId > 0 && employee.serviceCategoryId !== categoryFilterId) {
        return false;
      }
      if (
        employeeStatusFilter !== "all" &&
        (employeeStatusFilter === "active" ? !employee.isActive : employee.isActive)
      ) {
        return false;
      }
      if (
        query &&
        ![
          employee.fullName,
          employee.firstName,
          employee.lastName,
          employee.email,
          employee.phone,
          employee.shopCode,
          employee.serviceCategoryName,
        ]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(query))
      ) {
        return false;
      }
      return true;
    });
  }, [employees, categoryFilterId, employeeSearch, employeeStatusFilter]);

  const employeeListPageCount = Math.ceil(filteredEmployees.length / employeePageSize);

  useEffect(() => {
    const lastPageIndex = Math.max(0, employeeListPageCount - 1);
    if (employeePageIndex > lastPageIndex) {
      setEmployeePageIndex(lastPageIndex);
    }
  }, [employeeListPageCount, employeePageIndex]);

  const attendanceRosterEmployees = useMemo(() => {
    return !attendanceShopId
      ? employees
      : employees.filter(
          (employee) => Number(employee.shopId || 0) === attendanceShopId,
        );
  }, [attendanceShopId, employees]);

  const attendanceEmployees = useMemo(() => {
    const query = attendanceSearch.trim().toLocaleLowerCase();
    if (!query) return attendanceRosterEmployees;
    return attendanceRosterEmployees.filter((employee) =>
      [employee.fullName, employee.firstName, employee.lastName, employee.phone]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [attendanceRosterEmployees, attendanceSearch]);

  const payrollEmployees = useMemo(() => {
    if (!payrollShopId) {
      return [];
    }
    return employees.filter((employee) => Number(employee.shopId || 0) === payrollShopId);
  }, [employees, payrollShopId]);

  const payrollCandidateEmployees = useMemo(
    () => employees.filter((employee) => {
      if (!employee.isActive) return false;
      if (payrollShopId > 0 && Number(employee.shopId || 0) !== payrollShopId) return false;
      if (payrollEmployeeId > 0 && employee.id !== payrollEmployeeId) return false;
      return true;
    }),
    [employees, payrollEmployeeId, payrollShopId],
  );

  const employeesWithoutPayrollRecord = useMemo(
    () => payrollCandidateEmployees.filter((employee) =>
      !dailyPayroll.some((record) => record.employeeId === employee.id),
    ),
    [dailyPayroll, payrollCandidateEmployees],
  );

  const historyEmployees = useMemo(() => {
    if (!payrollShopId) {
      return employees;
    }
    return payrollEmployees;
  }, [employees, payrollEmployees, payrollShopId]);

  const serviceOptions = useMemo(() => {
    return servicesCatalog.filter((item: ServiceCatalogItem) => item.isActive !== false);
  }, [servicesCatalog]);

  const selectedPercentageEmployeeId = percentageEmployeeFilterId;

  useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
      return;
    }

    if (selectedEmployeeId && !employees.some((item) => item.id === selectedEmployeeId)) {
      setSelectedEmployeeId(employees[0]?.id ?? 0);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    if (!payrollShopId) {
      setPayrollEmployeeId(0);
      return;
    }

    if (!payrollEmployees.some((employee) => employee.id === payrollEmployeeId)) {
      setPayrollEmployeeId(0);
    }
  }, [payrollEmployeeId, payrollEmployees, payrollShopId]);

  useEffect(() => {
    if (!salaryHistoryEmployeeId) return;

    if (!historyEmployees.some((employee) => employee.id === salaryHistoryEmployeeId)) {
      setSalaryHistoryEmployeeId(0);
    }
  }, [historyEmployees, salaryHistoryEmployeeId]);

  useEffect(() => {
    if (activeTab !== "percentages" || percentageResultsView !== "employee") return;

    if (!selectedPercentageEmployeeId) {
      setEmployeePercentages([]);
      setIsLoadingEmployeePercentages(false);
      setEmployeePercentagesError(false);
      return;
    }

    let isCurrentRequest = true;
    setIsLoadingEmployeePercentages(true);
    setEmployeePercentagesError(false);
    const loadEmployeePercentages = async () => {
      try {
        const percentages = await getEmployeeServicePercentages(selectedPercentageEmployeeId);
        if (isCurrentRequest) setEmployeePercentages(percentages);
      } catch {
        if (isCurrentRequest) {
          setEmployeePercentages([]);
          setEmployeePercentagesError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoadingEmployeePercentages(false);
      }
    };

    void loadEmployeePercentages();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, percentageResultsView, selectedPercentageEmployeeId, percentageRefreshKey]);

  useEffect(() => {
    if (activeTab !== "deposits" || depositView !== "employee") return;

    if (!depositHistoryEmployeeId) {
      setDepositHistory([]);
      setIsLoadingDepositHistory(false);
      setDepositHistoryError(false);
      return;
    }

    let isCurrentRequest = true;
    setIsLoadingDepositHistory(true);
    setDepositHistoryError(false);
    const loadDepositContext = async () => {
      try {
        const depositItems = await getEmployeeDeposits(depositHistoryEmployeeId);

        if (isCurrentRequest) {
          setDepositHistory(depositItems);
        }
      } catch {
        if (isCurrentRequest) {
          setDepositHistory([]);
          setDepositHistoryError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoadingDepositHistory(false);
      }
    };

    void loadDepositContext();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, depositView, depositHistoryEmployeeId, depositRefreshKey]);

  useEffect(() => {
    if (activeTab !== "deposits" || depositView !== "all") return;

    let isCurrentRequest = true;
    setIsLoadingAllDeposits(true);
    setAllDepositsError(false);
    const loadAllDeposits = async () => {
      try {
        const items = await getAllEmployeeDeposits({
          shopId: allDepositsShopId > 0 ? allDepositsShopId : undefined,
          activeOnly: allDepositsActiveOnly,
        });
        if (isCurrentRequest) setAllDeposits(items);
      } catch {
        if (isCurrentRequest) {
          setAllDeposits([]);
          setAllDepositsError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoadingAllDeposits(false);
      }
    };

    void loadAllDeposits();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, depositView, allDepositsActiveOnly, allDepositsShopId, depositRefreshKey]);

  useEffect(() => {
    if (activeTab !== "attendance") return;

    if (!attendanceHistoryEmployeeId) {
      setAttendanceHistory([]);
      setIsLoadingAttendanceHistory(false);
      setAttendanceHistoryLoadError(false);
      return;
    }

    if (attendanceHistoryFromDate > attendanceHistoryToDate) {
      setAttendanceHistory([]);
      setIsLoadingAttendanceHistory(false);
      setAttendanceHistoryLoadError(false);
      return;
    }

    let isCurrentRequest = true;
    setIsLoadingAttendanceHistory(true);
    setAttendanceHistoryLoadError(false);
    const loadAttendanceHistory = async () => {
      try {
        const attendanceItems = await getEmployeeAttendanceHistory(attendanceHistoryEmployeeId, {
          from: attendanceHistoryFromDate,
          to: attendanceHistoryToDate,
        });
        if (isCurrentRequest) setAttendanceHistory(attendanceItems);
      } catch {
        if (isCurrentRequest) {
          setAttendanceHistory([]);
          setAttendanceHistoryLoadError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoadingAttendanceHistory(false);
      }
    };

    void loadAttendanceHistory();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, attendanceHistoryEmployeeId, attendanceHistoryFromDate, attendanceHistoryToDate, attendanceHistoryRefreshKey]);

  useEffect(() => {
    if (activeTab !== "attendance") return;

    let isCurrentRequest = true;
    setIsLoadingAttendance(true);
    setAttendanceLoadError(false);
    const loadAttendance = async () => {
      try {
        const data = await getAttendanceByDate(
          attendanceDate,
          attendanceShopId > 0 ? attendanceShopId : undefined,
        );

        const nextStatus: Record<number, EmployeeAttendanceStatus> = {};
        const nextNotes: Record<number, string> = {};
        data.forEach((item) => {
          nextStatus[item.employeeId] = item.status;
          nextNotes[item.employeeId] = item.notes ?? "";
        });

        attendanceRosterEmployees.forEach((employee) => {
          if (!nextStatus[employee.id]) {
            nextStatus[employee.id] = "Present";
          }
          if (nextNotes[employee.id] === undefined) {
            nextNotes[employee.id] = "";
          }
        });

        if (isCurrentRequest) {
          setAttendanceStatus(nextStatus);
          setAttendanceNotes(nextNotes);
        }
      } catch {
        if (isCurrentRequest) setAttendanceLoadError(true);
      } finally {
        if (isCurrentRequest) setIsLoadingAttendance(false);
      }
    };

    void loadAttendance();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, attendanceDate, attendanceShopId, attendanceRosterEmployees, attendanceRefreshKey]);

  useEffect(() => {
    if (activeTab !== "percentages" || percentageResultsView !== "service") return;

    let isCurrentRequest = true;
    const loadServicePercentages = async () => {
      if (!percentageServiceFilterId) {
        setServicePercentagesByService([]);
        setIsLoadingServicePercentages(false);
        setServicePercentagesError(false);
        return;
      }

      setIsLoadingServicePercentages(true);
      setServicePercentagesError(false);
      try {
        const data = await getEmployeeServicePercentagesByService(percentageServiceFilterId);
        if (isCurrentRequest) setServicePercentagesByService(data);
      } catch {
        if (isCurrentRequest) {
          setServicePercentagesByService([]);
          setServicePercentagesError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoadingServicePercentages(false);
      }
    };

    void loadServicePercentages();
    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, percentageResultsView, percentageServiceFilterId, percentageRefreshKey]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    setDepositHistoryEmployeeId((current) => current || selectedEmployeeId);
    setServicePercentageForm((prev) => ({ ...prev, employeeId: selectedEmployeeId }));
  }, [selectedEmployeeId]);

  const handleEmployeeSubmit = async () => {
    const payloadBase = {
      firstName: employeeForm.firstName.trim(),
      lastName: employeeForm.lastName.trim(),
      email: employeeForm.email.trim() || null,
      phone: employeeForm.phone.trim(),
      shopId: employeeForm.shopId,
      serviceCategoryId: employeeForm.serviceCategoryId,
      employeeType: employeeForm.employeeType,
      ...(employeeForm.employeeType === "Director"
        ? {
            powderBonusKgThreshold: Number(employeeForm.powderBonusKgThreshold || 0),
            powderBonusAmount: Number(employeeForm.powderBonusAmount || 0),
          }
        : {}),
      notes: employeeForm.notes.trim() || undefined,
      salaryType: employeeForm.salaryType,
      fixedDailySalary:
        employeeForm.salaryType === "FixedDaily"
          ? Number(employeeForm.fixedDailySalary || 0)
          : 0,
    };

    if (!payloadBase.firstName || !payloadBase.lastName || !payloadBase.phone || !payloadBase.shopId || !payloadBase.serviceCategoryId) {
      toast.error(t("serviceTemplates.employeeManagement.messages.validationFailed"));
      return;
    }

    if (
      employeeForm.employeeType === "Director" &&
      (Number(employeeForm.powderBonusKgThreshold || 0) <= 0 ||
        Number(employeeForm.powderBonusAmount || 0) < 0)
    ) {
      toast.error(t("serviceTemplates.employeeManagement.messages.directorBonusValidationFailed"));
      return;
    }

    setIsSavingEmployee(true);
    try {
      if (employeeForm.id) {
        const payload: EmployeeUpdatePayload = {
          id: employeeForm.id,
          ...payloadBase,
        };
        await updateEmployee(payload);
        toast.success(t("serviceTemplates.employeeManagement.messages.updated"));
      } else {
        const payload: EmployeeCreatePayload = {
          ...payloadBase,
          hireDate: `${employeeForm.hireDate}T00:00:00Z`,
        };
        await createEmployee(payload);
        toast.success(t("serviceTemplates.employeeManagement.messages.created"));
      }

      setEmployeeForm(emptyEmployeeForm());
      setIsEmployeeDrawerOpen(false);
      await dispatch(fetchEmployees({ includeInactive: true }));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const handleEmployeeDrawerOpenChange = (open: boolean) => {
    if (open) {
      setIsEmployeeDrawerOpen(true);
      return;
    }
    if (isSavingEmployee) return;

    setEmployeeForm(emptyEmployeeForm());
    setIsEmployeeDrawerOpen(false);
  };

  const handleOpenEmployeeCreate = () => {
    setEmployeeForm(emptyEmployeeForm());
    setIsEmployeeDrawerOpen(true);
  };

  const handleEmployeeEdit = (employee: EmployeeItem) => {
    setEmployeeForm({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || "",
      phone: employee.phone || "",
      shopId: Number(employee.shopId || 0),
      serviceCategoryId: employee.serviceCategoryId || 0,
      hireDate: employee.hireDate ? employee.hireDate.slice(0, 10) : todayValue(),
      salaryType: employee.salaryType || "FixedDaily",
      fixedDailySalary: Number(employee.fixedDailySalary || 0),
      employeeType: employee.employeeType || "Regular",
      powderBonusKgThreshold: Number(employee.powderBonusKgThreshold || 0),
      powderBonusAmount: Number(employee.powderBonusAmount || 0),
      notes: employee.notes || "",
    });
    setActiveTab("employees");
    setIsEmployeeDrawerOpen(true);
  };

  const handleToggleEmployee = useCallback(async (employee: EmployeeItem) => {
    try {
      if (employee.isActive) {
        await deactivateEmployee(employee.id);
      } else {
        await activateEmployee(employee.id);
      }
      await dispatch(fetchEmployees({ includeInactive: true }));
      toast.success(t("serviceTemplates.employeeManagement.messages.statusUpdated"));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.statusUpdateFailed"));
    }
  }, [dispatch, t]);

  const handleSavePercentage = async () => {
    const employeeId = Number(servicePercentageForm.employeeId || 0);
    const serviceId = Number(servicePercentageForm.serviceId || 0);
    if (!employeeId || !serviceId) {
      toast.error(t("serviceTemplates.employeeManagement.messages.validationFailed"));
      return;
    }

    setIsSavingPercentage(true);
    try {
      const payload: EmployeeServicePercentagePayload = {
        employeeId,
        serviceId,
        percentage: Number(servicePercentageForm.percentage || 0),
      };
      await upsertEmployeeServicePercentage(payload);
      toast.success(t("serviceTemplates.employeeManagement.messages.saved"));
      setPercentageEmployeeFilterId(employeeId);
      setPercentageServiceFilterId(serviceId);
      setPercentageResultsView("employee");
      setServicePercentageForm(emptyPercentageForm());
      setIsPercentageDrawerOpen(false);
      setPercentageRefreshKey((current) => current + 1);
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    } finally {
      setIsSavingPercentage(false);
    }
  };

  const handlePercentageDrawerOpenChange = (open: boolean) => {
    if (open) {
      setIsPercentageDrawerOpen(true);
      return;
    }
    if (isSavingPercentage) return;

    setServicePercentageForm(emptyPercentageForm());
    setIsPercentageDrawerOpen(false);
  };

  const handleOpenPercentageDrawer = () => {
    setServicePercentageForm({
      ...emptyPercentageForm(),
      employeeId: percentageEmployeeFilterId || selectedEmployeeId,
      serviceId: percentageServiceFilterId,
    });
    setIsPercentageDrawerOpen(true);
  };

  const handleCreateDeposit = async () => {
    const employeeId = Number(depositForm.employeeId || 0);
    if (!employeeId || Number(depositForm.amount || 0) <= 0) {
      toast.error(t("serviceTemplates.employeeManagement.messages.validationFailed"));
      return;
    }

    setIsCreatingDeposit(true);
    try {
      const payload: EmployeeDepositPayload = {
        employeeId,
        amount: Number(depositForm.amount || 0),
        notes: depositForm.notes.trim() || undefined,
      };
      await createEmployeeDeposit(payload);
      toast.success(t("serviceTemplates.employeeManagement.messages.saved"));
      setDepositHistoryEmployeeId(employeeId);
      setDepositView("employee");
      setDepositRefreshKey((current) => current + 1);
      setDepositForm(emptyDepositForm());
      setIsDepositDrawerOpen(false);
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const handleDepositDrawerOpenChange = (open: boolean) => {
    if (open) {
      setIsDepositDrawerOpen(true);
      return;
    }
    if (isCreatingDeposit) return;

    setDepositForm(emptyDepositForm());
    setIsDepositDrawerOpen(false);
  };

  const handleOpenDepositDrawer = () => {
    setDepositForm({
      ...emptyDepositForm(),
      employeeId: depositHistoryEmployeeId || selectedEmployeeId,
    });
    setIsDepositDrawerOpen(true);
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    try {
      const tasks = attendanceRosterEmployees.map((employee) => {
        const payload: EmployeeAttendancePayload = {
          employeeId: employee.id,
          workDate: attendanceDate,
          status: attendanceStatus[employee.id] ?? "Present",
          notes: attendanceNotes[employee.id] || undefined,
        };
        return upsertEmployeeAttendance(payload);
      });

      await Promise.all(tasks);
      toast.success(t("serviceTemplates.employeeManagement.messages.saved"));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.attendanceSaveFailed"));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const setAllAttendance = (status: EmployeeAttendanceStatus) => {
    setAttendanceStatus((current) => ({
      ...current,
      ...Object.fromEntries(attendanceEmployees.map((employee) => [employee.id, status])),
    }));
  };

  const handleCalculateSalary = async () => {
    try {
      setSalaryLoading(true);
      setSalaryCalculationNotice(null);
      setDailyPayroll([]);
      const attendance = await getAttendanceByDate(payrollDate, payrollShopId || undefined);
      const presentEmployees = attendance.filter((item) => {
        if (item.status !== "Present") return false;
        return payrollEmployeeId <= 0 || item.employeeId === payrollEmployeeId;
      });

      if (presentEmployees.length === 0) {
        setSalaryCalculationNotice("serviceTemplates.employeeManagement.messages.noPresentEmployees");
        toast.info(t("serviceTemplates.employeeManagement.messages.noPresentEmployees"));
        return;
      }

      const calculatedRecords = await calculateEmployeeSalary({
        workDate: `${payrollDate}T00:00:00Z`,
        shopId: payrollShopId > 0 ? Number(payrollShopId) : undefined,
        employeeId: payrollEmployeeId > 0 ? Number(payrollEmployeeId) : undefined,
      });

      const salaryByDate = await getSalaryByDate(payrollDate);
      const filteredSalary = salaryByDate.filter((record) => {
        const matchesShop = payrollShopId > 0
          ? Number(record.shopId || 0) === Number(payrollShopId)
          : true;
        const matchesEmployee = payrollEmployeeId > 0
          ? Number(record.employeeId || 0) === Number(payrollEmployeeId)
          : true;
        return matchesShop && matchesEmployee;
      });
      setDailyPayroll(sortPayrollRecords(filteredSalary));
      if (calculatedRecords.length === 0 || filteredSalary.length === 0) {
        setSalaryCalculationNotice("serviceTemplates.employeeManagement.messages.noSalaryCalculated");
        toast.info(t("serviceTemplates.employeeManagement.messages.noSalaryCalculated"));
      } else {
        toast.success(t("serviceTemplates.employeeManagement.messages.calculated"));
      }
    } catch (error) {
      toast.error(error instanceof Error
        ? error.message
        : t("serviceTemplates.employeeManagement.messages.salaryFailed"));
    } finally {
      setSalaryLoading(false);
    }
  };

  const handlePayUnpaidSalary = async () => {
    const summary = salaryToPayConfirm?.summary;
    const toDate = salaryToPayConfirm?.toDate;
    if (!summary || !toDate) return;
    if (!canMarkSalaryPaid || !summary.paymentAllowed || summary.netPayableAmount <= 0) {
      return;
    }

    try {
      setIsPayingUnpaidSalary(true);
      await payEmployeeUnpaidSalary(summary.employeeId, toDate);
      setSalaryToPayConfirm(null);
      toast.success(t("serviceTemplates.employeeManagement.messages.salaryMarkedPaid"));
      try {
        const [salaryByDate, unpaidSummary] = await Promise.all([
          getSalaryByDate(toDate),
          getEmployeeUnpaidSalarySummary(summary.employeeId, toDate),
        ]);
        setDailyPayroll(sortPayrollRecords(salaryByDate.filter((record) => {
          const matchesShop = payrollShopId <= 0 || Number(record.shopId || 0) === payrollShopId;
          const matchesEmployee = payrollEmployeeId <= 0 || record.employeeId === payrollEmployeeId;
          return matchesShop && matchesEmployee;
        })));
        setUnpaidSalarySummary(unpaidSummary);
      } catch {
        setUnpaidSummaryRefreshKey((current) => current + 1);
        toast.error(t("serviceTemplates.employeeManagement.messages.salaryRefreshAfterPaymentFailed"));
      }
    } catch (error) {
      toast.error(error instanceof Error
        ? error.message
        : t("serviceTemplates.employeeManagement.messages.salaryMarkPaidFailed"));
    } finally {
      setIsPayingUnpaidSalary(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "payroll") return;
    let isCurrent = true;

    const loadPayrollByDate = async () => {
      try {
        setSalaryLoading(true);
        setDailyPayroll([]);
        const salaryByDate = await getSalaryByDate(payrollDate);
        if (!isCurrent) return;
        const filteredSalary = salaryByDate.filter((record) => {
          const matchesShop = payrollShopId > 0
            ? Number(record.shopId || 0) === Number(payrollShopId)
            : true;
          const matchesEmployee = payrollEmployeeId > 0
            ? Number(record.employeeId || 0) === Number(payrollEmployeeId)
            : true;
          return matchesShop && matchesEmployee;
        });

        setDailyPayroll(sortPayrollRecords(filteredSalary));

      } catch {
        if (isCurrent) {
          toast.error(t("serviceTemplates.employeeManagement.messages.salaryByDateLoadFailed"));
        }
      } finally {
        if (isCurrent) setSalaryLoading(false);
      }
    };

    void loadPayrollByDate();
    return () => {
      isCurrent = false;
    };
  }, [activeTab, payrollDate, payrollShopId, payrollEmployeeId, t]);

  useEffect(() => {
    if (activeTab !== "payroll") return;
    if (!salaryPaymentEmployeeId) {
      setUnpaidSalarySummary(null);
      setUnpaidSummaryError(false);
      setUnpaidSummaryLoading(false);
      return;
    }

    let isCurrent = true;
    const loadUnpaidSummary = async () => {
      try {
        setUnpaidSummaryLoading(true);
        setUnpaidSummaryError(false);
        setUnpaidSalarySummary(null);
        const summary = await getEmployeeUnpaidSalarySummary(salaryPaymentEmployeeId, payrollDate);
        if (isCurrent) setUnpaidSalarySummary(summary);
      } catch {
        if (isCurrent) {
          setUnpaidSummaryError(true);
          setUnpaidSalarySummary(null);
        }
      } finally {
        if (isCurrent) setUnpaidSummaryLoading(false);
      }
    };

    void loadUnpaidSummary();
    return () => {
      isCurrent = false;
    };
  }, [activeTab, payrollDate, salaryPaymentEmployeeId, unpaidSummaryRefreshKey]);

  useEffect(() => {
    if (activeTab !== "payroll") return;

    if (!salaryHistoryEmployeeId) {
      setSalaryHistory([]);
      setSalaryHistoryLoading(false);
      return;
    }

    if (salaryHistoryFromDate > salaryHistoryToDate) {
      setSalaryHistory([]);
      setSalaryHistoryLoading(false);
      return;
    }

    let isCurrent = true;
    const loadSalaryHistory = async () => {
      try {
        setSalaryHistoryLoading(true);
        setSalaryHistory([]);
        const history = await getEmployeeSalaryHistory(salaryHistoryEmployeeId, {
          from: `${salaryHistoryFromDate}T00:00:00Z`,
          to: `${salaryHistoryToDate}T23:59:59Z`,
        });
        if (isCurrent) setSalaryHistory(history);
      } catch {
        if (isCurrent) {
          toast.error(t("serviceTemplates.employeeManagement.messages.salaryHistoryLoadFailed"));
        }
      } finally {
        if (isCurrent) setSalaryHistoryLoading(false);
      }
    };

    void loadSalaryHistory();
    return () => {
      isCurrent = false;
    };
  }, [
    activeTab,
    salaryHistoryEmployeeId,
    salaryHistoryFromDate,
    salaryHistoryToDate,
    t,
  ]);

  const employeeColumns = useMemo(
    () => [
      employeeColumnHelper.display({
        id: "fullName",
        header: t("serviceTemplates.employeeManagement.columns.fullName"),
        cell: ({ row }) => (
          <div className={styles.employeeIdentity}>
            <strong>{row.original.fullName || `${row.original.firstName} ${row.original.lastName}`}</strong>
            <span>{[row.original.email, row.original.phone].filter(Boolean).join(" · ") || "-"}</span>
          </div>
        ),
      }),
      employeeColumnHelper.display({
        id: "assignment",
        header: t("serviceTemplates.employeeManagement.columns.assignment"),
        cell: ({ row }) => {
          const shopCode = row.original.shopCode ||
            shops.find((shop) => shop.id === Number(row.original.shopId))?.code ||
            `#${row.original.shopId}`;
          return (
            <div className={styles.employeeAssignment}>
              <strong>{shopCode}</strong>
              <span>{row.original.serviceCategoryName || `#${row.original.serviceCategoryId}`}</span>
            </div>
          );
        },
      }),
      employeeColumnHelper.display({
        id: "compensation",
        header: t("serviceTemplates.employeeManagement.columns.compensation"),
        cell: ({ row }) => (
          <div className={styles.employeeCompensation}>
            <span className={row.original.employeeType === "Director" ? styles.directorBadge : styles.employeeTypeBadge}>
              {t(`serviceTemplates.employeeManagement.employeeTypes.${row.original.employeeType}`)}
            </span>
            <span>{t(`serviceTemplates.employeeManagement.salaryTypes.${row.original.salaryType}`)}</span>
            {row.original.salaryType === "FixedDaily" && Number(row.original.fixedDailySalary || 0) > 0 && (
              <strong>{money(Number(row.original.fixedDailySalary))}</strong>
            )}
            {row.original.employeeType === "Director" && Number(row.original.powderBonusKgThreshold || 0) > 0 && (
              <span className={styles.employeePowderBonus}>
                {t("serviceTemplates.employeeManagement.list.powderBonusSummary", {
                  amount: money(Number(row.original.powderBonusAmount || 0)),
                  threshold: Number(row.original.powderBonusKgThreshold).toLocaleString(),
                })}
              </span>
            )}
          </div>
        ),
      }),
      employeeColumnHelper.display({
        id: "isActive",
        header: t("serviceTemplates.employeeManagement.columns.status"),
        cell: ({ row }) => (
          <span className={row.original.isActive ? styles.employeeActiveBadge : styles.employeeInactiveBadge}>
            {row.original.isActive ? t("common.active") : t("common.inactive")}
          </span>
        ),
      }),
      employeeColumnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.rowAction} ${styles.rowActionEdit}`}
              onClick={() => handleEmployeeEdit(row.original)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.rowAction} ${row.original.isActive ? styles.rowActionDeactivate : styles.rowActionActivate}`}
              onClick={() => void handleToggleEmployee(row.original)}
              aria-label={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
              title={row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
              aria-pressed={row.original.isActive}
            >
              <Power size={14} aria-hidden="true" />
            </button>
          </div>
        ),
      }),
    ],
    [t, shops, handleToggleEmployee],
  );

  const percentageColumns = useMemo(
    () => [
      percentageColumnHelper.display({
        id: "serviceName",
        header: t("serviceTemplates.employeeManagement.columns.serviceName"),
        cell: ({ row }) => row.original.serviceName || `#${row.original.serviceId}`,
      }),
      percentageColumnHelper.display({
        id: "employeeFullName",
        header: t("serviceTemplates.employeeManagement.columns.employee"),
        cell: ({ row }) => row.original.employeeFullName || `#${row.original.employeeId}`,
      }),
      percentageColumnHelper.display({
        id: "percentage",
        header: t("serviceTemplates.employeeManagement.columns.percentage"),
        cell: ({ row }) => `${Number(row.original.percentage || 0).toFixed(2)}%`,
      }),
    ],
    [t],
  );

  const attendanceColumns = useMemo(
    () => [
      attendanceColumnHelper.display({
        id: "employeeFullName",
        header: t("serviceTemplates.employeeManagement.columns.employee"),
        cell: ({ row }) => row.original.employeeFullName,
      }),
      attendanceColumnHelper.display({
        id: "workDate",
        header: t("serviceTemplates.employeeManagement.columns.workDate"),
        cell: ({ row }) => row.original.workDate,
      }),
      attendanceColumnHelper.display({
        id: "status",
        header: t("serviceTemplates.employeeManagement.columns.status"),
        cell: ({ row }) => t(`serviceTemplates.employeeManagement.attendanceStatus.${row.original.status}`),
      }),
      attendanceColumnHelper.display({
        id: "notes",
        header: t("serviceTemplates.employeeManagement.columns.notes"),
        cell: ({ row }) => row.original.notes || "-",
      }),
    ],
    [t],
  );

  const salaryColumns = useMemo(
    () => {
      const columns = [
      salaryColumnHelper.display({
        id: "employeeFullName",
        header: t("serviceTemplates.employeeManagement.columns.employee"),
        cell: ({ row }) => {
          const record = row.original;
          const employee = employees.find((item) => item.id === record.employeeId);
          const employeeType = isDirectorSalary(record, employee) ? "Director" : "Regular";
          return (
            <div className={styles.salaryEmployee}>
              <strong>{record.employeeFullName}</strong>
              <span>
                {t(`serviceTemplates.employeeManagement.employeeTypes.${employeeType}`)}
                {" · "}
                {t(`serviceTemplates.employeeManagement.salaryTypes.${record.salaryType}`)}
              </span>
            </div>
          );
        },
      }),
      salaryColumnHelper.display({
        id: "calculationSource",
        header: t("serviceTemplates.employeeManagement.columns.calculationSource"),
        cell: ({ row }) => {
          const source = row.original.calculationSource;
          const isProgrammerFallback = source === "ProgrammerInternalCostFallback";
          return (
            <div className={styles.salarySource}>
              <span>{source
                ? t(`serviceTemplates.employeeManagement.calculationSources.${source}`, { defaultValue: source })
                : t("serviceTemplates.employeeManagement.labels.sourceUnavailable")}</span>
              {isProgrammerFallback && (
                <small>{t("serviceTemplates.employeeManagement.labels.programmerPriceWarning")}</small>
              )}
            </div>
          );
        },
      }),
      salaryColumnHelper.display({
        id: "grossSalary",
        header: t("serviceTemplates.employeeManagement.columns.grossSalary"),
        cell: ({ row }) => {
          const record = row.original;
          const employee = employees.find((item) => item.id === record.employeeId);
          const isDirector = isDirectorSalary(record, employee);
          const bonus = Number(record.directorPowderBonus || 0);
          const hasBonus = isDirector || bonus > 0 || Number(record.directorPowderQuantityKg || 0) > 0;
          const bonusIncluded = record.directorPowderBonusIncludedInNetPayable === true;
          const bonusStatus = bonusIncluded
            ? "serviceTemplates.employeeManagement.labels.bonusIncluded"
            : hasSalaryMonthEnded(record.workDate)
              ? "serviceTemplates.employeeManagement.labels.bonusNotIncluded"
              : "serviceTemplates.employeeManagement.labels.bonusAccrued";

          return (
            <div className={styles.salaryAmount}>
              <strong>{money(Number(record.grossSalary || 0))}</strong>
              {hasBonus && (
                <div className={styles.salaryBonus}>
                  <span>{t("serviceTemplates.employeeManagement.columns.powderBonus")}: {money(bonus)}</span>
                  {record.directorPowderQuantityKg != null && (
                    <small>
                      {t("serviceTemplates.employeeManagement.labels.powderReceived", {
                        amount: Number(record.directorPowderQuantityKg).toLocaleString(),
                      })}
                    </small>
                  )}
                  <small className={bonusIncluded ? styles.salaryBonusIncluded : styles.salaryBonusAccrued}>
                    {t(bonusStatus)}
                  </small>
                  {!bonusIncluded && (
                    <small>
                      {t("serviceTemplates.employeeManagement.labels.estimatedFinalPayable", {
                        amount: money(Number(record.netPayable || 0) + bonus),
                      })}
                    </small>
                  )}
                </div>
              )}
            </div>
          );
        },
      }),
      salaryColumnHelper.display({
        id: "depositDeduction",
        header: t("serviceTemplates.employeeManagement.columns.advance"),
        cell: ({ row }) => (
          <div className={styles.salaryAmount}>
            <strong>{money(Number(row.original.depositDeduction || 0))}</strong>
            <small>{t("serviceTemplates.employeeManagement.labels.advanceDeducted")}</small>
            <span>{money(Number(row.original.depositRemainingAfter || 0))}</span>
            <small>{t("serviceTemplates.employeeManagement.labels.advanceBalanceAfter")}</small>
          </div>
        ),
      }),
      salaryColumnHelper.display({
        id: "netPayable",
        header: t("serviceTemplates.employeeManagement.columns.netPayable"),
        cell: ({ row }) => {
          const record = row.original;
          const employee = employees.find((item) => item.id === record.employeeId);
          const isDirector = isDirectorSalary(record, employee);
          const bonusIncluded = record.directorPowderBonusIncludedInNetPayable === true;
          const paymentHint = isDirector
            ? bonusIncluded
              ? "serviceTemplates.employeeManagement.labels.bonusIncluded"
              : hasSalaryMonthEnded(record.workDate)
                ? "serviceTemplates.employeeManagement.labels.bonusNotIncluded"
                : "serviceTemplates.employeeManagement.labels.bonusAccrued"
            : null;

          return (
            <div className={styles.salaryAmount}>
              <strong>{money(Number(record.netPayable || 0))}</strong>
              {paymentHint && (
                <small className={bonusIncluded ? styles.salaryBonusIncluded : styles.salaryBonusAccrued}>
                  {t(paymentHint)}
                </small>
              )}
            </div>
          );
        },
      }),
      salaryColumnHelper.display({
        id: "paidStatus",
        header: t("serviceTemplates.employeeManagement.columns.paidStatus"),
        cell: ({ row }) => {
          const record = row.original;
          const isPaid = Boolean(record.isPaid);
          const hasPayableAmount = Number(record.netPayable || 0) > 0;
          const statusLabel = isPaid
            ? "serviceTemplates.employeeManagement.labels.paid"
            : hasPayableAmount
              ? "serviceTemplates.employeeManagement.labels.unpaid"
              : "serviceTemplates.employeeManagement.labels.noPaymentDue";
          const statusClass = isPaid
            ? styles.paidBadge
            : hasPayableAmount
              ? styles.unpaidBadge
              : styles.noPaymentBadge;

          return (
            <div className={styles.salaryPaymentStatus}>
              <span className={statusClass}>{t(statusLabel)}</span>
              {record.paidAt && (
                <small>{record.paidAt.replace("T", " ").slice(0, 16)}</small>
              )}
              {record.paidByUserId != null && (
                <small>{t("serviceTemplates.employeeManagement.labels.paidBy", {
                  user: record.paidByUserId,
                })}</small>
              )}
            </div>
          );
        },
      }),
      salaryColumnHelper.display({
        id: "workDate",
        header: t("serviceTemplates.employeeManagement.columns.workDate"),
        cell: ({ row }) => row.original.workDate.slice(0, 10),
      }),
      ];

      return columns;
    },
    [employees, t],
  );

  const dailySalaryColumns = useMemo(
    () => salaryColumns.filter((column) => column.id !== "workDate" && column.id !== "actions"),
    [salaryColumns],
  );

  const salaryHistoryColumns = useMemo(
    () => salaryColumns.filter((column) => column.id !== "actions"),
    [salaryColumns],
  );

  const attendanceSummary = useMemo(() => {
    const present = attendanceEmployees.filter((employee) => attendanceStatus[employee.id] === "Present").length;
    const absent = attendanceEmployees.length - present;
    return { present, absent };
  }, [attendanceEmployees, attendanceStatus]);

  const payrollSummary = useMemo(
    () => ({
      totalPayable: dailyPayroll.reduce((sum, record) => sum + Number(record.netPayable || 0), 0),
      unpaidCount: dailyPayroll.filter((record) =>
        !record.isPaid && Number(record.netPayable || 0) > 0,
      ).length,
      paidCount: dailyPayroll.filter((record) => record.isPaid).length,
    }),
    [dailyPayroll],
  );

  const selectedUnpaidEmployee = employees.find(
    (employee) => employee.id === salaryPaymentEmployeeId,
  );
  const selectedEmployeeDailySalary = dailyPayroll.find(
    (record) => record.employeeId === salaryPaymentEmployeeId,
  );
  const isDirectorUnpaidSummary = unpaidSalarySummary?.employeeType === "Director" ||
    selectedUnpaidEmployee?.employeeType === "Director" ||
    selectedEmployeeDailySalary?.employeeType === "Director";
  const directorPowderQuantityKg = unpaidSalarySummary?.directorPowderQuantityKg ??
    selectedEmployeeDailySalary?.directorPowderQuantityKg;
  const directorPowderBonus = unpaidSalarySummary?.directorPowderBonus ??
    selectedEmployeeDailySalary?.directorPowderBonus;
  const directorBonusIncluded = unpaidSalarySummary?.directorPowderBonusIncludedInNetPayable ??
    selectedEmployeeDailySalary?.directorPowderBonusIncludedInNetPayable;
  const directorSalaryPeriodEndDate = unpaidSalarySummary?.salaryPeriodEndDate?.slice(0, 10) ||
    salaryMonthEndDate(unpaidSalarySummary?.lastIncludedDate || payrollDate);

  const employeeDepositOutstandingBalance = useMemo(
    () => depositHistory.reduce(
      (total, deposit) => total + Number(deposit.remainingBalance || 0),
      0,
    ),
    [depositHistory],
  );

  const groupedAllDeposits = useMemo(() => {
    const groups = new Map<number, {
      employeeId: number;
      employeeFullName: string;
      advances: EmployeeDepositItem[];
      outstandingBalance: number;
    }>();

    allDeposits.forEach((deposit) => {
      let group = groups.get(deposit.employeeId);
      if (!group) {
        group = {
          employeeId: deposit.employeeId,
          employeeFullName: deposit.employeeFullName,
          advances: [],
          outstandingBalance: 0,
        };
        groups.set(deposit.employeeId, group);
      }
      group.advances.push(deposit);
      group.outstandingBalance += Number(deposit.remainingBalance || 0);
    });

    return Array.from(groups.values()).sort((left, right) =>
      left.employeeFullName.localeCompare(right.employeeFullName),
    );
  }, [allDeposits]);

  const formatDepositDate = (value?: string | null) => {
    if (!value) return "-";
    return value.slice(0, 10);
  };

  const renderDepositRecord = (deposit: EmployeeDepositItem) => (
    <article className={styles.depositAdvanceRow} key={deposit.id}>
      <div className={styles.depositAdvanceDate}>
        <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.issuedAt")}</span>
        <strong>{formatDepositDate(deposit.createdAt)}</strong>
      </div>
      <div className={styles.depositAdvanceAmount}>
        <span>{t("serviceTemplates.employeeManagement.columns.amount")}</span>
        <strong>{money(Number(deposit.amount || 0))}</strong>
      </div>
      <div className={styles.depositAdvanceBalance}>
        <span>{t("serviceTemplates.employeeManagement.columns.remainingBalance")}</span>
        <strong>{money(Number(deposit.remainingBalance || 0))}</strong>
      </div>
      <div className={styles.depositAdvanceDetails}>
        {deposit.notes && <span>{deposit.notes}</span>}
        {deposit.fullyRecoveredAt && (
          <span>
            {t("serviceTemplates.employeeManagement.columns.fullyRecoveredAt")}: {formatDepositDate(deposit.fullyRecoveredAt)}
          </span>
        )}
      </div>
      <span className={deposit.isActive ? styles.employeeActiveBadge : styles.employeeInactiveBadge}>
        {deposit.isActive ? t("common.active") : t("common.inactive")}
      </span>
    </article>
  );

  const percentageResults = percentageResultsView === "employee"
    ? employeePercentages
    : servicePercentagesByService;
  const percentageResultsLoading = percentageResultsView === "employee"
    ? isLoadingEmployeePercentages
    : isLoadingServicePercentages;
  const percentageResultsError = percentageResultsView === "employee"
    ? employeePercentagesError
    : servicePercentagesError;
  const hasPercentageResultTarget = percentageResultsView === "employee"
    ? selectedPercentageEmployeeId > 0
    : servicePercentageForm.serviceId > 0;
  const percentageResultContext = percentageResultsView === "employee"
    ? employees.find((employee) => employee.id === selectedPercentageEmployeeId)?.fullName
    : serviceOptions.find((service) => service.id === servicePercentageForm.serviceId)?.name;

  return (
    <div className={styles.employeeManagement}>
      <div className={styles.managementTabs}>
        <TabGroup variant="segmented">
          <Tab
            variant="segmented"
            active={activeTab === "employees"}
            text={t("serviceTemplates.employeeManagement.tabs.employees")}
            icon={<UserCog size={14} />}
            onClick={() => {
              if (activeTab !== "employees" && !isEmployeesLoading) {
                dispatch(fetchEmployees({ includeInactive: true }));
              }
              setActiveTab("employees");
            }}
          />
          <Tab
            variant="segmented"
            active={activeTab === "percentages"}
            text={t("serviceTemplates.employeeManagement.tabs.percentages")}
            icon={<Percent size={14} />}
            onClick={() => setActiveTab("percentages")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "deposits"}
            text={t("serviceTemplates.employeeManagement.tabs.deposits")}
            icon={<Wallet size={14} />}
            onClick={() => setActiveTab("deposits")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "attendance"}
            text={t("serviceTemplates.employeeManagement.tabs.attendance")}
            icon={<CalendarCheck2 size={14} />}
            onClick={() => setActiveTab("attendance")}
          />
          <Tab
            variant="segmented"
            active={activeTab === "payroll"}
            text={t("serviceTemplates.employeeManagement.tabs.payroll")}
            icon={<Calculator size={14} />}
            onClick={() => setActiveTab("payroll")}
          />
        </TabGroup>
      </div>

      {activeTab === "employees" && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <div className={styles.employeeHeader}>
              <div className={styles.employeeHeaderCopy}>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.employeeList")}</h3>
                <p>{t("serviceTemplates.employeeManagement.list.description")}</p>
              </div>
              <span className={styles.employeeCount}>
                {t("serviceTemplates.employeeManagement.list.totalCount", { count: employees.length })}
              </span>
              <Button onClick={handleOpenEmployeeCreate}>
                <Plus size={15} aria-hidden="true" />
                {t("serviceTemplates.employeeManagement.list.addEmployee")}
              </Button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.employeeFilters}>
              <TextField
                className={styles.employeeSearch}
                label={t("serviceTemplates.employeeManagement.list.searchLabel")}
                placeholder={t("serviceTemplates.employeeManagement.list.searchPlaceholder")}
                value={employeeSearch}
                onChange={(event) => {
                  setEmployeeSearch(event.target.value);
                  setEmployeePageIndex(0);
                }}
                icon={<Search size={15} aria-hidden="true" />}
              />
              <Select
                className={styles.employeeFilter}
                label={t("serviceTemplates.fields.serviceCategory")}
                value={String(categoryFilterId)}
                onChange={(event) => {
                  setCategoryFilterId(Number(event.target.value) || 0);
                  setEmployeePageIndex(0);
                }}
              >
                <option value="0">{t("serviceTemplates.fields.allCategories")}</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.code}</option>
                ))}
              </Select>
              <Select
                className={styles.employeeFilter}
                label={t("serviceTemplates.employeeManagement.list.statusLabel")}
                value={employeeStatusFilter}
                onChange={(event) => {
                  setEmployeeStatusFilter(event.target.value as typeof employeeStatusFilter);
                  setEmployeePageIndex(0);
                }}
              >
                <option value="all">{t("common.all")}</option>
                <option value="active">{t("common.active")}</option>
                <option value="inactive">{t("common.inactive")}</option>
              </Select>
              {(employeeSearch || categoryFilterId > 0 || employeeStatusFilter !== "all") && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEmployeeSearch("");
                    setCategoryFilterId(0);
                    setEmployeeStatusFilter("all");
                    setEmployeePageIndex(0);
                  }}
                >
                  <X size={14} aria-hidden="true" />
                  {t("serviceTemplates.filters.reset")}
                </Button>
              )}
            </div>
          </section>

          <section className={`${styles.section} ${styles.employeeTableSection}`}>
            <div className={styles.employeeTableMeta}>
              {t("serviceTemplates.employeeManagement.list.resultCount", {
                filtered: filteredEmployees.length,
                total: employees.length,
              })}
            </div>
            {showEmployeesLoader ? (
              <PrpServiceLoader />
            ) : employeesError ? (
              <div className={styles.employeeError} role="alert">
                <span>{t("serviceTemplates.employeeManagement.list.loadFailed")}</span>
                <Button
                  variant="secondary"
                  onClick={() => void dispatch(fetchEmployees({ includeInactive: true }))}
                >
                  {t("serviceTemplates.employeeManagement.list.retry")}
                </Button>
              </div>
            ) : (
              <DataTable
                data={filteredEmployees}
                columns={employeeColumns}
                pageSize={employeePageSize}
                pageSizeOptions={[10, 20, 50]}
                pageSizeLabel={t("serviceTemplates.employeeManagement.list.pageSizeLabel")}
                pageIndex={employeePageIndex}
                onPaginationChange={setEmployeePageIndex}
                onPageSizeChange={(pageSize) => {
                  setEmployeePageSize(pageSize);
                  setEmployeePageIndex(0);
                }}
                paginationRangeLabel={({ from, to, total }) =>
                  total > 0
                    ? t("serviceTemplates.employeeManagement.list.rangeLabel", { from, to, total })
                    : null
                }
                noResultsText={t("serviceTemplates.employeeManagement.list.emptyState")}
              />
            )}
          </section>

          <FormDrawer
            open={isEmployeeDrawerOpen}
            onOpenChange={handleEmployeeDrawerOpenChange}
            eyebrow={t("serviceTemplates.employeeManagement.tabs.employees")}
            title={employeeForm.id
              ? t("serviceTemplates.employeeManagement.list.editTitle")
              : t("serviceTemplates.employeeManagement.list.addTitle")}
            titleId="employee-form-drawer-title"
            closeLabel={t("common.close")}
            icon={<UserCog size={20} />}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleEmployeeDrawerOpenChange(false)}
                  disabled={isSavingEmployee}
                >
                  {t("common.cancel")}
                </Button>
                <Button onClick={() => void handleEmployeeSubmit()} disabled={isSavingEmployee}>
                  {isSavingEmployee
                    ? t("common.saving")
                    : employeeForm.id
                      ? t("serviceTemplates.actions.update")
                      : t("serviceTemplates.actions.create")}
                </Button>
              </>
            }
          >
            <div className={styles.employeeDrawerForm}>
              <section className={styles.employeeFormSection}>
                <h3>{t("serviceTemplates.employeeManagement.list.personalSection")}</h3>
                <div className={styles.gridTwo}>
                  <TextField label={t("serviceTemplates.fields.firstName")} value={employeeForm.firstName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, firstName: event.target.value }))} disabled={isSavingEmployee} />
                  <TextField label={t("serviceTemplates.fields.lastName")} value={employeeForm.lastName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, lastName: event.target.value }))} disabled={isSavingEmployee} />
                  <TextField label={t("serviceTemplates.fields.email")} value={employeeForm.email} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))} disabled={isSavingEmployee} />
                  <TextField label={t("serviceTemplates.fields.phone")} value={employeeForm.phone} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, phone: event.target.value }))} disabled={isSavingEmployee} />
                  <TextField label={t("serviceTemplates.fields.hireDate")} type="date" value={employeeForm.hireDate} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, hireDate: event.target.value }))} disabled={isSavingEmployee} />
                </div>
              </section>
              <section className={styles.employeeFormSection}>
                <h3>{t("serviceTemplates.employeeManagement.list.assignmentSection")}</h3>
                <div className={styles.gridTwo}>
                  <Select label={t("serviceTemplates.employeeManagement.fields.shop")} value={String(employeeForm.shopId || "")} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, shopId: Number(event.target.value) || 0 }))} disabled={isSavingEmployee}>
                    <option value="">{t("serviceTemplates.employeeManagement.fields.selectShop")}</option>
                    {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.code}</option>)}
                  </Select>
                  <Select label={t("serviceTemplates.fields.serviceCategory")} value={String(employeeForm.serviceCategoryId || "")} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, serviceCategoryId: Number(event.target.value) || 0 }))} placeholder={t("common.select")} disabled={isSavingEmployee}>
                    <option value="">{t("common.select")}</option>
                    {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.code}</option>)}
                  </Select>
                </div>
              </section>
              <section className={styles.employeeFormSection}>
                <h3>{t("serviceTemplates.employeeManagement.list.compensationSection")}</h3>
                <div className={styles.gridTwo}>
                  <Select label={t("serviceTemplates.employeeManagement.fields.employeeType")} value={employeeForm.employeeType} onChange={(event) => setEmployeeForm((prev) => ({
                    ...prev,
                    employeeType: event.target.value as EmployeeType,
                    ...(event.target.value === "Regular" ? { powderBonusKgThreshold: 0, powderBonusAmount: 0 } : {}),
                  }))} disabled={isSavingEmployee}>
                    <option value="Regular">{t("serviceTemplates.employeeManagement.employeeTypes.Regular")}</option>
                    <option value="Director">{t("serviceTemplates.employeeManagement.employeeTypes.Director")}</option>
                  </Select>
                  <Select label={t("serviceTemplates.employeeManagement.fields.salaryType")} value={employeeForm.salaryType} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, salaryType: event.target.value as EmployeeSalaryType }))} disabled={isSavingEmployee}>
                    <option value="FixedDaily">{t("serviceTemplates.employeeManagement.salaryTypes.FixedDaily")}</option>
                    <option value="PercentageBased">{t("serviceTemplates.employeeManagement.salaryTypes.PercentageBased")}</option>
                  </Select>
                  <TextField label={t("serviceTemplates.employeeManagement.fields.fixedDailySalary")} type="number" min="0" value={String(employeeForm.fixedDailySalary || 0)} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, fixedDailySalary: Number(event.target.value) || 0 }))} disabled={isSavingEmployee || employeeForm.salaryType !== "FixedDaily"} />
                  {employeeForm.employeeType === "Director" && (
                    <>
                      <TextField label={t("serviceTemplates.employeeManagement.fields.powderBonusKgThreshold")} type="number" min="1" value={String(employeeForm.powderBonusKgThreshold || 0)} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, powderBonusKgThreshold: Number(event.target.value) || 0 }))} disabled={isSavingEmployee} />
                      <TextField label={t("serviceTemplates.employeeManagement.fields.powderBonusAmount")} type="number" min="0" value={String(employeeForm.powderBonusAmount || 0)} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, powderBonusAmount: Number(event.target.value) || 0 }))} disabled={isSavingEmployee} />
                    </>
                  )}
                </div>
              </section>
              <Textarea label={t("serviceTemplates.fields.notes")} value={employeeForm.notes} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, notes: event.target.value }))} rows={4} disabled={isSavingEmployee} />
            </div>
          </FormDrawer>
        </div>
      )}

      {activeTab === "percentages" && (
        <div className={styles.stack}>
          <section className={`${styles.section} ${styles.percentageResults}`}>
            <div className={styles.percentageResultsHeader}>
              <div>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.servicePercentages")}</h3>
                <p>{t("serviceTemplates.employeeManagement.percentageWorkspace.description")}</p>
              </div>
              <Button onClick={handleOpenPercentageDrawer}>
                <Plus size={15} aria-hidden="true" />
                {t("serviceTemplates.employeeManagement.percentageWorkspace.setPercentage")}
              </Button>
            </div>
            <div className={styles.percentageBrowseControls}>
              <div className={styles.percentageViewTabs}>
                <TabGroup variant="segmented">
                  <Tab
                    variant="segmented"
                    active={percentageResultsView === "employee"}
                    text={t("serviceTemplates.employeeManagement.percentageWorkspace.byEmployee")}
                    onClick={() => setPercentageResultsView("employee")}
                  />
                  <Tab
                    variant="segmented"
                    active={percentageResultsView === "service"}
                    text={t("serviceTemplates.employeeManagement.percentageWorkspace.byService")}
                    onClick={() => setPercentageResultsView("service")}
                  />
                </TabGroup>
              </div>
              {percentageResultsView === "employee" ? (
                <Select
                  className={styles.percentageViewFilter}
                  label={t("serviceTemplates.employeeManagement.percentageWorkspace.employeeFilterLabel")}
                  value={String(percentageEmployeeFilterId)}
                  onChange={(event) => setPercentageEmployeeFilterId(Number(event.target.value) || 0)}
                >
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
              ) : (
                <Select
                  className={styles.percentageViewFilter}
                  label={t("serviceTemplates.employeeManagement.percentageWorkspace.serviceFilterLabel")}
                  value={String(percentageServiceFilterId)}
                  onChange={(event) => setPercentageServiceFilterId(Number(event.target.value) || 0)}
                >
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectService")}</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>{service.name || service.code}</option>
                  ))}
                </Select>
              )}
              <Button
                variant="secondary"
                onClick={() => setPercentageRefreshKey((current) => current + 1)}
                disabled={!hasPercentageResultTarget || percentageResultsLoading}
              >
                {t("common.refresh")}
              </Button>
            </div>
            <div className={styles.percentageResultsHeader}>
              <div>
                <h3 className={styles.percentageResultsTitle}>
                  {percentageResultsView === "employee"
                    ? t("serviceTemplates.employeeManagement.percentageWorkspace.employeeResultsTitle")
                    : t("serviceTemplates.employeeManagement.percentageWorkspace.serviceResultsTitle")}
                </h3>
                <p>{percentageResultContext || t("serviceTemplates.employeeManagement.percentageWorkspace.selectContext")}</p>
              </div>
              <span className={styles.percentageCount}>{percentageResults.length}</span>
            </div>
            {!hasPercentageResultTarget ? (
              <div className={styles.percentageEmptyState}>
                {percentageResultsView === "employee"
                  ? t("serviceTemplates.employeeManagement.percentageWorkspace.selectEmployee")
                  : t("serviceTemplates.employeeManagement.percentageWorkspace.selectService")}
              </div>
            ) : percentageResultsLoading ? (
              <PrpServiceLoader />
            ) : percentageResultsError ? (
              <div className={styles.percentageError} role="alert">
                <span>
                  {percentageResultsView === "employee"
                    ? t("serviceTemplates.employeeManagement.percentageWorkspace.employeeLoadFailed")
                    : t("serviceTemplates.employeeManagement.percentageWorkspace.serviceLoadFailed")}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPercentageRefreshKey((current) => current + 1)}
                >
                  {t("serviceTemplates.employeeManagement.percentageWorkspace.retry")}
                </Button>
              </div>
            ) : percentageResults.length === 0 ? (
              <div className={styles.percentageEmptyState}>
                {percentageResultsView === "employee"
                  ? t("serviceTemplates.employeeManagement.percentageWorkspace.noEmployeeRates")
                  : t("serviceTemplates.employeeManagement.percentageWorkspace.noServiceRates")}
              </div>
            ) : (
              <DataTable
                key={percentageResultsView}
                data={percentageResults}
                columns={percentageColumns}
                pageSize={10}
                pageSizeOptions={[10, 20, 50]}
                pageSizeLabel={t("serviceTemplates.employeeManagement.list.pageSizeLabel")}
                noResultsText={t("common.noData")}
              />
            )}
          </section>

          <FormDrawer
            open={isPercentageDrawerOpen}
            onOpenChange={handlePercentageDrawerOpenChange}
            eyebrow={t("serviceTemplates.employeeManagement.tabs.percentages")}
            title={t("serviceTemplates.employeeManagement.percentageWorkspace.drawerTitle")}
            titleId="employee-percentage-drawer-title"
            closeLabel={t("common.close")}
            icon={<Percent size={20} />}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (isSavingPercentage) return;
                    setServicePercentageForm(emptyPercentageForm());
                    setIsPercentageDrawerOpen(false);
                  }}
                  disabled={isSavingPercentage}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => void handleSavePercentage()}
                  disabled={!servicePercentageForm.employeeId || !servicePercentageForm.serviceId || isSavingPercentage}
                >
                  {isSavingPercentage ? t("common.saving") : t("serviceTemplates.employeeManagement.actions.save")}
                </Button>
              </>
            }
          >
            <div className={styles.percentageDrawerForm}>
              <Select
                label={t("serviceTemplates.employeeManagement.fields.selectEmployee")}
                value={String(servicePercentageForm.employeeId || 0)}
                onChange={(event) => setServicePercentageForm((prev) => ({
                  ...prev,
                  employeeId: Number(event.target.value) || 0,
                }))}
                disabled={isSavingPercentage}
              >
                <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                ))}
              </Select>
              <Select
                label={t("serviceTemplates.employeeManagement.fields.selectService")}
                value={String(servicePercentageForm.serviceId || 0)}
                onChange={(event) => setServicePercentageForm((prev) => ({
                  ...prev,
                  serviceId: Number(event.target.value) || 0,
                }))}
                disabled={isSavingPercentage}
              >
                <option value="0">{t("serviceTemplates.employeeManagement.fields.selectService")}</option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>{service.name || service.code}</option>
                ))}
              </Select>
              <TextField
                label={t("serviceTemplates.employeeManagement.fields.percentage")}
                type="number"
                min="0"
                step="0.01"
                value={String(servicePercentageForm.percentage || 0)}
                onChange={(event) => setServicePercentageForm((prev) => ({
                  ...prev,
                  percentage: Number(event.target.value) || 0,
                }))}
                icon={<Percent size={14} aria-hidden="true" />}
                disabled={isSavingPercentage}
              />
              <p className={styles.percentageHint}>
                {t("serviceTemplates.employeeManagement.percentageWorkspace.upsertHint")}
              </p>
            </div>
          </FormDrawer>
        </div>
      )}

      {activeTab === "deposits" && (
        <div className={styles.stack}>
          <section className={`${styles.section} ${styles.depositWorkspace}`}>
            <div className={styles.depositHeader}>
              <div className={styles.depositHeaderCopy}>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.deposits")}</h3>
                <p>{t("serviceTemplates.employeeManagement.depositsWorkspace.description")}</p>
              </div>
              <Button onClick={handleOpenDepositDrawer}>
                <Plus size={15} aria-hidden="true" />
                <Wallet size={15} aria-hidden="true" />
                {t("serviceTemplates.employeeManagement.actions.giveDeposit")}
              </Button>
            </div>
            <div className={styles.depositViewTabs}>
              <TabGroup variant="segmented">
                <Tab
                  variant="segmented"
                  active={depositView === "employee"}
                  text={t("serviceTemplates.employeeManagement.depositsWorkspace.byEmployee")}
                  icon={<UserCog size={14} aria-hidden="true" />}
                  onClick={() => setDepositView("employee")}
                />
                <Tab
                  variant="segmented"
                  active={depositView === "all"}
                  text={t("serviceTemplates.employeeManagement.depositsWorkspace.allDeposits")}
                  icon={<Wallet size={14} aria-hidden="true" />}
                  onClick={() => setDepositView("all")}
                />
              </TabGroup>
            </div>

            {depositView === "employee" ? (
              <>
                <div className={styles.depositEmployeeContext}>
                  <Select
                    className={styles.depositEmployeeFilter}
                    label={t("serviceTemplates.employeeManagement.depositsWorkspace.employeeFilterLabel")}
                    value={String(depositHistoryEmployeeId || 0)}
                    onChange={(event) => {
                      setDepositHistory([]);
                      setDepositHistoryEmployeeId(Number(event.target.value) || 0);
                    }}
                  >
                    <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                    ))}
                  </Select>
                  <div className={styles.depositBalanceSummary}>
                    <Wallet size={17} aria-hidden="true" />
                    <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.remainingBalance")}</span>
                    <strong>
                      {isLoadingDepositHistory
                        ? t("common.loading")
                        : money(employeeDepositOutstandingBalance)}
                    </strong>
                    <span className={styles.depositBalanceMeta}>
                      {depositHistory.length > 0
                        ? t("serviceTemplates.employeeManagement.depositsWorkspace.balanceAcrossAdvances", { count: depositHistory.length })
                        : t("serviceTemplates.employeeManagement.depositsWorkspace.noActiveDeposit")}
                    </span>
                  </div>
                </div>
                <div className={styles.depositHistoryHeader}>
                  <div>
                    <h4>{t("serviceTemplates.employeeManagement.sections.depositHistory")}</h4>
                    <span>{depositHistory.length}</span>
                  </div>
                </div>
                {isLoadingDepositHistory ? (
                  <PrpServiceLoader />
                ) : depositHistoryError ? (
                  <div className={styles.depositError} role="alert">
                    <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.historyLoadFailed")}</span>
                    <Button variant="secondary" onClick={() => setDepositRefreshKey((current) => current + 1)}>
                      {t("serviceTemplates.employeeManagement.depositsWorkspace.retry")}
                    </Button>
                  </div>
                ) : !depositHistoryEmployeeId ? (
                  <div className={styles.depositEmptyState}>
                    {t("serviceTemplates.employeeManagement.depositsWorkspace.selectEmployee")}
                  </div>
                ) : depositHistory.length === 0 ? (
                  <div className={styles.depositEmptyState}>
                    {t("serviceTemplates.employeeManagement.depositsWorkspace.noHistory")}
                  </div>
                ) : (
                  <div className={styles.depositAdvanceList}>
                    {[...depositHistory]
                      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                      .map(renderDepositRecord)}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.depositAllHeader}>
                  <div>
                    <h4>{t("serviceTemplates.employeeManagement.sections.depositsAll")}</h4>
                    <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.allCount", { count: allDeposits.length })}</span>
                  </div>
                  <div className={styles.depositAllFilters}>
                    <Select
                      label={t("serviceTemplates.employeeManagement.fields.shop")}
                      value={String(allDepositsShopId || 0)}
                      onChange={(event) => setAllDepositsShopId(Number(event.target.value) || 0)}
                    >
                      <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                      {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.code}</option>)}
                    </Select>
                    <Select
                      label={t("serviceTemplates.employeeManagement.depositsWorkspace.statusFilter")}
                      value={allDepositsActiveOnly ? "1" : "0"}
                      onChange={(event) => setAllDepositsActiveOnly(event.target.value === "1")}
                    >
                      <option value="0">{t("serviceTemplates.employeeManagement.fields.allDeposits")}</option>
                      <option value="1">{t("serviceTemplates.employeeManagement.fields.activeOnly")}</option>
                    </Select>
                  </div>
                </div>
                {isLoadingAllDeposits ? (
                  <PrpServiceLoader />
                ) : allDepositsError ? (
                  <div className={styles.depositError} role="alert">
                    <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.allLoadFailed")}</span>
                    <Button variant="secondary" onClick={() => setDepositRefreshKey((current) => current + 1)}>
                      {t("serviceTemplates.employeeManagement.depositsWorkspace.retry")}
                    </Button>
                  </div>
                ) : allDeposits.length === 0 ? (
                  <div className={styles.depositEmptyState}>
                    {t("serviceTemplates.employeeManagement.depositsWorkspace.noAllDeposits")}
                  </div>
                ) : (
                  <div className={styles.depositEmployeeGroups}>
                    {groupedAllDeposits.map((group, index) => (
                      <details
                        className={styles.depositEmployeeGroup}
                        key={group.employeeId}
                        open={index === 0}
                      >
                        <summary>
                          <div className={styles.depositGroupIdentity}>
                            <strong>{group.employeeFullName}</strong>
                            <span>
                              {t("serviceTemplates.employeeManagement.depositsWorkspace.advanceCount", {
                                count: group.advances.length,
                              })}
                            </span>
                          </div>
                          <div className={styles.depositGroupBalance}>
                            <span>{t("serviceTemplates.employeeManagement.depositsWorkspace.remainingBalance")}</span>
                            <strong>{money(group.outstandingBalance)}</strong>
                          </div>
                          <ChevronDown size={17} aria-hidden="true" />
                        </summary>
                        <div className={styles.depositAdvanceList}>
                          {[...group.advances]
                            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                            .map(renderDepositRecord)}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <FormDrawer
            open={isDepositDrawerOpen}
            onOpenChange={handleDepositDrawerOpenChange}
            eyebrow={t("serviceTemplates.employeeManagement.tabs.deposits")}
            title={t("serviceTemplates.employeeManagement.depositsWorkspace.drawerTitle")}
            titleId="employee-deposit-drawer-title"
            closeLabel={t("common.close")}
            icon={<Wallet size={20} />}
            footer={
              <div className={styles.depositDrawerActions}>
                <Button
                  className={styles.depositDrawerCancel}
                  variant="secondary"
                  onClick={() => handleDepositDrawerOpenChange(false)}
                  disabled={isCreatingDeposit}
                >
                  <X size={15} aria-hidden="true" />
                  {t("common.cancel")}
                </Button>
                <Button
                  className={styles.depositDrawerSubmit}
                  onClick={() => void handleCreateDeposit()}
                  disabled={!depositForm.employeeId || Number(depositForm.amount || 0) <= 0 || isCreatingDeposit}
                >
                  <Wallet size={15} aria-hidden="true" />
                  {isCreatingDeposit
                    ? t("common.saving")
                    : t("serviceTemplates.employeeManagement.actions.giveDeposit")}
                </Button>
              </div>
            }
          >
            <div className={styles.depositDrawerForm}>
              <p className={styles.depositDrawerHint}>
                {t("serviceTemplates.employeeManagement.depositsWorkspace.drawerDescription")}
              </p>
              <Select
                label={t("serviceTemplates.employeeManagement.fields.selectEmployee")}
                value={String(depositForm.employeeId || 0)}
                onChange={(event) => setDepositForm((prev) => ({
                  ...prev,
                  employeeId: Number(event.target.value) || 0,
                }))}
                disabled={isCreatingDeposit}
              >
                <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                ))}
              </Select>
              <TextField
                label={t("serviceTemplates.employeeManagement.fields.amount")}
                type="number"
                min="1"
                value={String(depositForm.amount || 0)}
                onChange={(event) => setDepositForm((prev) => ({
                  ...prev,
                  amount: Number(event.target.value) || 0,
                }))}
                disabled={isCreatingDeposit}
              />
              <Textarea
                label={t("serviceTemplates.employeeManagement.fields.notes")}
                value={depositForm.notes}
                onChange={(event) => setDepositForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                disabled={isCreatingDeposit}
              />
            </div>
          </FormDrawer>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className={styles.stack}>
          <section className={`${styles.section} ${styles.attendanceWorkspace}`}>
            <div className={styles.workflowHeader}>
              <div className={styles.workflowTitle}>
                <span className={styles.sectionEyebrow}>{t("serviceTemplates.employeeManagement.sections.attendance")}</span>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.attendance")}</h3>
                <p className={styles.payrollHint}>{t("serviceTemplates.employeeManagement.attendanceWorkspace.description")}</p>
              </div>
              <div className={styles.attendanceFilters}>
                <TextField label={t("serviceTemplates.employeeManagement.fields.workDate")} type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                <Select label={t("serviceTemplates.employeeManagement.fields.shop")} value={String(attendanceShopId || 0)} onChange={(e) => setAttendanceShopId(Number(e.target.value) || 0)}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.code}</option>
                  ))}
                </Select>
                <TextField
                  className={styles.attendanceSearch}
                  label={t("serviceTemplates.employeeManagement.attendanceWorkspace.searchLabel")}
                  placeholder={t("serviceTemplates.employeeManagement.attendanceWorkspace.searchPlaceholder")}
                  value={attendanceSearch}
                  onChange={(event) => setAttendanceSearch(event.target.value)}
                  icon={<Search size={14} aria-hidden="true" />}
                />
              </div>
            </div>
            <div className={styles.attendanceToolbar}>
              <div className={styles.attendanceSummary}>
                <div className={`${styles.attendanceMetric} ${styles.attendancePresentMetric}`}>
                  <span>{t("serviceTemplates.employeeManagement.attendanceWorkspace.presentCount")}</span>
                  <strong>{attendanceSummary.present}</strong>
                </div>
                <div className={`${styles.attendanceMetric} ${styles.attendanceAbsentMetric}`}>
                  <span>{t("serviceTemplates.employeeManagement.attendanceWorkspace.absentCount")}</span>
                  <strong>{attendanceSummary.absent}</strong>
                </div>
                <div className={styles.attendanceMetric}>
                  <span>{t("serviceTemplates.employeeManagement.attendanceWorkspace.employeeCount")}</span>
                  <strong>{attendanceEmployees.length} / {attendanceRosterEmployees.length}</strong>
                </div>
              </div>
              <div className={styles.attendanceActions}>
                <Button variant="secondary" size="small" onClick={() => setAllAttendance("Present")} disabled={attendanceEmployees.length === 0 || isLoadingAttendance || isSavingAttendance}>
                  <Check size={14} />{t(attendanceSearch ? "serviceTemplates.employeeManagement.attendanceWorkspace.markShownPresent" : "serviceTemplates.employeeManagement.actions.markAllPresent")}
                </Button>
                <Button variant="secondary" size="small" onClick={() => setAllAttendance("Absent")} disabled={attendanceEmployees.length === 0 || isLoadingAttendance || isSavingAttendance}>
                  <CircleX size={14} />{t(attendanceSearch ? "serviceTemplates.employeeManagement.attendanceWorkspace.markShownAbsent" : "serviceTemplates.employeeManagement.actions.markAllAbsent")}
                </Button>
                <Button onClick={() => void handleSaveAttendance()} disabled={attendanceRosterEmployees.length === 0 || isLoadingAttendance || isSavingAttendance}>
                  <CalendarCheck2 size={15} />{isSavingAttendance ? t("common.saving") : t("serviceTemplates.employeeManagement.actions.saveAttendance")}
                </Button>
              </div>
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.rosterHeader}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.attendanceRoster")}</h3>
              <span className={styles.rosterCount}>{attendanceEmployees.length} / {attendanceRosterEmployees.length}</span>
            </div>
            {isLoadingAttendance ? (
              <PrpServiceLoader />
            ) : attendanceLoadError ? (
              <div className={styles.attendanceState} role="alert">
                <span>{t("serviceTemplates.employeeManagement.messages.attendanceLoadFailed")}</span>
                <Button variant="secondary" onClick={() => setAttendanceRefreshKey((current) => current + 1)}>
                  {t("serviceTemplates.employeeManagement.attendanceWorkspace.retry")}
                </Button>
              </div>
            ) : attendanceRosterEmployees.length === 0 ? (
              <div className={styles.attendanceState}>
                {t("serviceTemplates.employeeManagement.attendanceWorkspace.noEmployees")}
              </div>
            ) : attendanceEmployees.length === 0 ? (
              <div className={styles.attendanceState}>
                {t("serviceTemplates.employeeManagement.attendanceWorkspace.noSearchMatches")}
              </div>
            ) : (
              <div className={styles.attendanceRoster}>
                {attendanceEmployees.map((employee) => {
                  const employeeId = employee.id;
                  const status = attendanceStatus[employeeId] ?? "Present";
                  const isPresent = status === "Present";
                  return (
                    <article className={styles.attendanceRosterRow} key={employeeId}>
                      <div className={styles.attendanceEmployeeIdentity}>
                        <strong>{employee.fullName}</strong>
                        <span>{employee.phone || employee.shopCode || "-"}</span>
                      </div>
                      <div className={styles.attendanceChoice} role="group" aria-label={t("serviceTemplates.employeeManagement.attendanceWorkspace.statusForEmployee", { employee: employee.fullName })}>
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          aria-pressed={isPresent}
                          className={`${styles.attendanceChoiceButton} ${isPresent ? styles.attendancePresentSelected : ""}`}
                          onClick={() => setAttendanceStatus((previous) => ({ ...previous, [employeeId]: "Present" }))}
                          disabled={isSavingAttendance}
                        >
                          <Check size={14} />{t("serviceTemplates.employeeManagement.attendanceStatus.Present")}
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          aria-pressed={!isPresent}
                          className={`${styles.attendanceChoiceButton} ${!isPresent ? styles.attendanceAbsentSelected : ""}`}
                          onClick={() => setAttendanceStatus((previous) => ({ ...previous, [employeeId]: "Absent" }))}
                          disabled={isSavingAttendance}
                        >
                          <CircleX size={14} />{t("serviceTemplates.employeeManagement.attendanceStatus.Absent")}
                        </Button>
                      </div>
                      <TextField
                        className={styles.attendanceNoteField}
                        aria-label={t("serviceTemplates.employeeManagement.attendanceWorkspace.noteForEmployee", { employee: employee.fullName })}
                        placeholder={t("serviceTemplates.employeeManagement.attendanceWorkspace.notePlaceholder")}
                        value={attendanceNotes[employeeId] || ""}
                        onChange={(event) => setAttendanceNotes((previous) => ({
                          ...previous,
                          [employeeId]: event.target.value,
                        }))}
                        disabled={isSavingAttendance}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.attendanceHistory")}</h3>
              <div className={styles.attendanceHistoryFilters}>
                <Select
                  label={t("serviceTemplates.employeeManagement.columns.employee")}
                  value={String(attendanceHistoryEmployeeId || 0)}
                  onChange={(event) => setAttendanceHistoryEmployeeId(Number(event.target.value) || 0)}
                >
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <TextField
                  label={t("serviceTemplates.employeeManagement.fields.fromDate")}
                  type="date"
                  value={attendanceHistoryFromDate}
                  max={attendanceHistoryToDate || undefined}
                  onChange={(event) => setAttendanceHistoryFromDate(event.target.value)}
                />
                <TextField
                  label={t("serviceTemplates.employeeManagement.fields.toDate")}
                  type="date"
                  value={attendanceHistoryToDate}
                  min={attendanceHistoryFromDate || undefined}
                  onChange={(event) => setAttendanceHistoryToDate(event.target.value)}
                />
              </div>
            </div>
            {attendanceHistoryEmployeeId > 0 ? (
              isLoadingAttendanceHistory ? (
                <PrpServiceLoader />
              ) : attendanceHistoryLoadError ? (
                <div className={styles.attendanceState} role="alert">
                  <span>{t("serviceTemplates.employeeManagement.messages.loadFailed")}</span>
                  <Button variant="secondary" onClick={() => setAttendanceHistoryRefreshKey((current) => current + 1)}>
                    {t("serviceTemplates.employeeManagement.attendanceWorkspace.retry")}
                  </Button>
                </div>
              ) : attendanceHistory.length > 0 ? (
                <DataTable data={attendanceHistory} columns={attendanceColumns} pageSize={10} />
              ) : (
                <div className={styles.attendanceState}>
                  {t("serviceTemplates.employeeManagement.attendanceWorkspace.noHistory")}
                </div>
              )
            ) : (
              <div className={styles.historyPrompt}>
                {t("serviceTemplates.employeeManagement.messages.selectEmployeeForAttendanceHistory")}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className={styles.stack}>
          <section className={`${styles.section} ${styles.payrollWorkspace}`}>
            <div className={styles.workflowHeader}>
              <div className={styles.workflowTitle}>
                <span className={styles.sectionEyebrow}>{t("serviceTemplates.employeeManagement.sections.payroll")}</span>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.tabs.payroll")}</h3>
              </div>
              <div className={styles.payrollFilters}>
                <TextField label={t("serviceTemplates.employeeManagement.fields.workDate")} type="date" value={payrollDate} onChange={(e) => { setSalaryCalculationNotice(null); setPayrollDate(e.target.value); }} disabled={salaryLoading || isPayingUnpaidSalary} />
                <Select label={t("serviceTemplates.employeeManagement.fields.shop")} value={String(payrollShopId || 0)} onChange={(e) => { setSalaryCalculationNotice(null); setPayrollShopId(Number(e.target.value) || 0); }} disabled={salaryLoading || isPayingUnpaidSalary}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.code}</option>
                  ))}
                </Select>
                <Select label={t("serviceTemplates.employeeManagement.columns.employee")} value={String(payrollEmployeeId || 0)} onChange={(e) => { setSalaryCalculationNotice(null); setPayrollEmployeeId(Number(e.target.value) || 0); }} disabled={!payrollShopId || salaryLoading || isPayingUnpaidSalary}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allEmployees")}</option>
                  {payrollEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <Button onClick={handleCalculateSalary} disabled={salaryLoading || isPayingUnpaidSalary}>
                  <Calculator size={15} />{salaryLoading ? t("common.loading") : t("serviceTemplates.employeeManagement.actions.calculate")}
                </Button>
              </div>
            </div>
            {salaryCalculationNotice && (
              <div className={styles.payrollCalculationNotice} role="status">
                <span>{t(salaryCalculationNotice)}</span>
                {salaryCalculationNotice === "serviceTemplates.employeeManagement.messages.noPresentEmployees" && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      setAttendanceDate(payrollDate);
                      setAttendanceShopId(payrollShopId);
                      setActiveTab("attendance");
                    }}
                  >
                    {t("serviceTemplates.employeeManagement.actions.openAttendance")}
                  </Button>
                )}
              </div>
            )}
            {!payrollShopId && <p className={styles.payrollHint}>{t("serviceTemplates.employeeManagement.messages.payrollShopHint")}</p>}
          </section>

          <section className={styles.section}>
            <div className={styles.payrollResultsHeader}>
              <div>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.payroll")}</h3>
                <span className={styles.resultsDate}>{new Date(`${payrollDate}T00:00:00`).toLocaleDateString()}</span>
              </div>
              <span className={styles.resultsCount}>
                {dailyPayroll.length} {t("serviceTemplates.employeeManagement.labels.payrollCount")}
              </span>
            </div>
            {dailyPayroll.length > 0 ? (
              <>
                <div className={styles.payrollSummary}>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.totalPayable")}</span>
                    <strong>{money(payrollSummary.totalPayable)}</strong>
                  </div>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.unpaidCount")}</span>
                    <strong>{payrollSummary.unpaidCount}</strong>
                  </div>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.paid")}</span>
                    <strong>{payrollSummary.paidCount}</strong>
                  </div>
                </div>
                <div className={styles.payrollTable}>
                  <DataTable data={dailyPayroll} columns={dailySalaryColumns} pageSize={10} fitContainer />
                </div>
              </>
            ) : (
              <div className={styles.payrollEmptyState}>
                <Calculator size={20} aria-hidden="true" />
                <p>{salaryLoading ? t("common.loading") : t("serviceTemplates.employeeManagement.messages.noPayrollRecords")}</p>
              </div>
            )}
            {!salaryLoading && employeesWithoutPayrollRecord.length > 0 && (
              <div className={styles.payrollMissing}>
                <div className={styles.payrollMissingHeader}>
                  <strong>
                    {t("serviceTemplates.employeeManagement.labels.missingPayrollRecords", {
                      count: employeesWithoutPayrollRecord.length,
                    })}
                  </strong>
                  <span>{t("serviceTemplates.employeeManagement.messages.missingPayrollRecordsHint")}</span>
                </div>
                <ul>
                  {employeesWithoutPayrollRecord.map((employee) => (
                    <li key={employee.id}>{employee.fullName}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section className={`${styles.section} ${styles.unpaidSalaryWorkspace}`}>
            <div className={styles.payrollResultsHeader}>
              <div>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.unpaidSalary")}</h3>
                <span className={styles.resultsDate}>
                  {t("serviceTemplates.employeeManagement.labels.paymentThroughDate", {
                    date: new Date(`${payrollDate}T00:00:00`).toLocaleDateString(),
                  })}
                </span>
              </div>
              <div className={styles.unpaidSalaryEmployee}>
                <Select
                  label={t("serviceTemplates.employeeManagement.columns.employee")}
                  value={String(salaryPaymentEmployeeId || 0)}
                  onChange={(event) => setSalaryPaymentEmployeeId(Number(event.target.value) || 0)}
                  disabled={isPayingUnpaidSalary}
                >
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {historyEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
              </div>
            </div>
            {!salaryPaymentEmployeeId ? (
              <div className={styles.noteBox}>
                {t("serviceTemplates.employeeManagement.messages.selectEmployeeForUnpaidSalary")}
              </div>
            ) : unpaidSummaryLoading ? (
              <PrpServiceLoader />
            ) : unpaidSummaryError ? (
              <div className={styles.payrollEmptyState} role="alert">
                <span>{t("serviceTemplates.employeeManagement.messages.unpaidSummaryLoadFailed")}</span>
                <Button
                  variant="secondary"
                  onClick={() => setUnpaidSummaryRefreshKey((current) => current + 1)}
                >
                  {t("serviceTemplates.employeeManagement.attendanceWorkspace.retry")}
                </Button>
              </div>
            ) : !unpaidSalarySummary || unpaidSalarySummary.unpaidRecordCount <= 0 ? (
              <div className={styles.payrollEmptyState}>
                {t("serviceTemplates.employeeManagement.messages.noUnpaidSalary")}
              </div>
            ) : (
              <>
                <div className={styles.unpaidSalaryPeriod}>
                  <span>
                    {t("serviceTemplates.employeeManagement.labels.unpaidPeriod", {
                      from: unpaidSalarySummary.firstUnpaidDate?.slice(0, 10) || "-",
                      to: unpaidSalarySummary.lastIncludedDate?.slice(0, 10) || payrollDate,
                    })}
                  </span>
                  <strong>
                    {t("serviceTemplates.employeeManagement.labels.unpaidRecordCount", {
                      count: unpaidSalarySummary.unpaidRecordCount,
                    })}
                  </strong>
                </div>
                <div className={styles.unpaidSalaryMetrics}>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.unpaidGrossSalary")}</span>
                    <strong>{money(Number(unpaidSalarySummary.totalUnpaidGrossSalary || 0))}</strong>
                  </div>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.advanceDeduction")}</span>
                    <strong>{money(Number(unpaidSalarySummary.recordedDepositDeductions || 0))}</strong>
                  </div>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.labels.activeAdvanceBalance")}</span>
                    <strong>{money(Number(unpaidSalarySummary.activeAdvanceBalance || 0))}</strong>
                  </div>
                  <div className={styles.payrollMetric}>
                    <span>{t("serviceTemplates.employeeManagement.columns.netPayable")}</span>
                    <strong>{money(Number(unpaidSalarySummary.netPayableAmount || 0))}</strong>
                  </div>
                </div>
                {isDirectorUnpaidSummary && (
                  <div className={styles.directorSalarySummary}>
                    <span>{t("serviceTemplates.employeeManagement.labels.salaryPeriodEnds", {
                      date: directorSalaryPeriodEndDate || "-",
                    })}</span>
                    <span>{t("serviceTemplates.employeeManagement.labels.powderReceived", {
                      amount: directorPowderQuantityKg == null
                        ? "-"
                        : Number(directorPowderQuantityKg).toLocaleString(),
                    })}</span>
                    <strong>{t("serviceTemplates.employeeManagement.columns.powderBonus")}: {directorPowderBonus == null
                      ? "-"
                      : money(Number(directorPowderBonus))}</strong>
                    <span className={directorBonusIncluded ? styles.salaryBonusIncluded : styles.salaryBonusAccrued}>
                      {t(directorBonusIncluded
                        ? "serviceTemplates.employeeManagement.labels.bonusIncluded"
                        : "serviceTemplates.employeeManagement.labels.bonusAccrued")}
                    </span>
                  </div>
                )}
                {unpaidSalarySummary.paymentBlockedReason && (
                  <div className={styles.salaryPaymentBlocked} role="status">
                    {unpaidSalarySummary.paymentBlockedReason}
                  </div>
                )}
                {Number(unpaidSalarySummary.netPayableAmount || 0) <= 0 ? (
                  <div className={styles.salaryPaymentBlocked} role="status">
                    {t("serviceTemplates.employeeManagement.labels.noCashPaymentRequired")}
                  </div>
                ) : !canMarkSalaryPaid ? (
                  <div className={styles.salaryPaymentBlocked} role="status">
                    {t("serviceTemplates.employeeManagement.labels.noPaymentPermission")}
                  </div>
                ) : unpaidSalarySummary.paymentAllowed ? (
                  <div className={styles.unpaidSalaryActions}>
                    <Button
                      variant="primary"
                      disabled={isPayingUnpaidSalary}
                      onClick={() => setSalaryToPayConfirm({ summary: unpaidSalarySummary, toDate: payrollDate })}
                    >
                      <Wallet size={15} aria-hidden="true" />
                      {t("serviceTemplates.employeeManagement.actions.payUnpaidSalary")}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.salaryHistory")}</h3>
              <div className={styles.salaryHistoryFilters}>
                <Select
                  label={t("serviceTemplates.employeeManagement.columns.employee")}
                  value={String(salaryHistoryEmployeeId || 0)}
                  onChange={(e) => setSalaryHistoryEmployeeId(Number(e.target.value) || 0)}
                >
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {historyEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <TextField
                  label={t("serviceTemplates.employeeManagement.fields.fromDate")}
                  type="date"
                  value={salaryHistoryFromDate}
                  max={salaryHistoryToDate || undefined}
                  onChange={(e) => setSalaryHistoryFromDate(e.target.value)}
                />
                <TextField
                  label={t("serviceTemplates.employeeManagement.fields.toDate")}
                  type="date"
                  value={salaryHistoryToDate}
                  min={salaryHistoryFromDate || undefined}
                  onChange={(e) => setSalaryHistoryToDate(e.target.value)}
                />
              </div>
            </div>
            {salaryHistoryEmployeeId > 0 ? (
              salaryHistoryLoading ? (
                <PrpServiceLoader />
              ) : salaryHistory.length > 0 ? (
                <div className={styles.payrollTable}>
                  <DataTable data={salaryHistory} columns={salaryHistoryColumns} pageSize={10} fitContainer />
                </div>
              ) : (
                <div className={styles.payrollEmptyState}>
                  {t("serviceTemplates.employeeManagement.messages.noSalaryHistory")}
                </div>
              )
            ) : (
              <div className={styles.noteBox}>
                {t("serviceTemplates.employeeManagement.messages.selectEmployeeForSalaryHistory")}
              </div>
            )}
          </section>
        </div>
      )}

      {!!salaryToPayConfirm && (
        <ConfirmationModal
          open={!!salaryToPayConfirm}
          onOpenChange={(open) => {
            if (!open) setSalaryToPayConfirm(null);
          }}
          title={t("serviceTemplates.employeeManagement.confirmation.payUnpaidSalaryTitle")}
          description={t("serviceTemplates.employeeManagement.confirmation.payUnpaidSalaryDescription", {
            employee: salaryToPayConfirm.summary.employeeFullName,
            amount: money(Number(salaryToPayConfirm.summary.netPayableAmount || 0)),
            date: new Date(`${salaryToPayConfirm.toDate}T00:00:00`).toLocaleDateString(),
          })}
          confirmText={t("serviceTemplates.employeeManagement.actions.payUnpaidSalary")}
          cancelText={t("common.cancel")}
          confirmLoading={isPayingUnpaidSalary}
          confirmDisabled={!salaryToPayConfirm.summary.paymentAllowed || Number(salaryToPayConfirm.summary.netPayableAmount || 0) <= 0}
          preventClose
          onConfirm={() => void handlePayUnpaidSalary()}
          onCancel={() => setSalaryToPayConfirm(null)}
        />
      )}
    </div>
  );
};
