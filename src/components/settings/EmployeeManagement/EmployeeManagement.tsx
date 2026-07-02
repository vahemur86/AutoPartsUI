import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Wallet, CalendarCheck2, Calculator, Percent, UserCog } from "lucide-react";

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
  getEmployeeServicePercentages,
  getEmployeeServicePercentagesByService,
  getSalaryByDate,
  markEmployeeSalaryAsPaid,
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
const depositColumnHelper = createColumnHelper<EmployeeDepositItem>();
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

const getActiveDepositFromHistory = (
  deposits: EmployeeDepositItem[],
): EmployeeDepositItem | null => {
  return deposits.find((item) => item.isActive) ?? null;
};

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

  const { items: employees, isLoading: isEmployeesLoading } = useAppSelector(
    (state) => state.employees,
  );
  const { shops } = useAppSelector((state) => state.shops);
  const { items: serviceCategories } = useAppSelector((state) => state.serviceCategory);
  const { items: servicesCatalog } = useAppSelector((state) => state.servicesCatalog);

  const [activeTab, setActiveTab] = useState<ManagementTab>("employees");
  const [categoryFilterId, setCategoryFilterId] = useState(0);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(0);
  const [servicePercentageForm, setServicePercentageForm] = useState(emptyPercentageForm());
  const [depositForm, setDepositForm] = useState(emptyDepositForm());
  const [depositHistory, setDepositHistory] = useState<EmployeeDepositItem[]>([]);
  const [allDeposits, setAllDeposits] = useState<EmployeeDepositItem[]>([]);
  const [activeDeposit, setActiveDeposit] = useState<EmployeeDepositItem | null>(null);
  const [allDepositsShopId, setAllDepositsShopId] = useState(0);
  const [allDepositsActiveOnly, setAllDepositsActiveOnly] = useState(false);
  const [employeePercentages, setEmployeePercentages] = useState<EmployeeServicePercentageItem[]>([]);
  const [servicePercentagesByService, setServicePercentagesByService] = useState<EmployeeServicePercentageItem[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(todayValue());
  const [attendanceShopId, setAttendanceShopId] = useState(0);
  const [attendanceNotes, setAttendanceNotes] = useState<Record<number, string>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, EmployeeAttendanceStatus>>({});
  const [payrollDate, setPayrollDate] = useState(todayValue());
  const [payrollShopId, setPayrollShopId] = useState(0);
  const [payrollEmployeeId, setPayrollEmployeeId] = useState(0);
  const [salaryHistoryEmployeeId, setSalaryHistoryEmployeeId] = useState(0);
  const [salaryHistoryFromDate, setSalaryHistoryFromDate] = useState(todayValue());
  const [salaryHistoryToDate, setSalaryHistoryToDate] = useState(todayValue());
  const [dailyPayroll, setDailyPayroll] = useState<EmployeeSalaryRecordItem[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalaryRecordItem[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<EmployeeAttendanceItem[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [markingSalaryId, setMarkingSalaryId] = useState<number | null>(null);
  const [salaryToConfirm, setSalaryToConfirm] =
    useState<EmployeeSalaryRecordItem | null>(null);

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
    return employees.filter((employee) => {
      if (categoryFilterId > 0 && employee.serviceCategoryId !== categoryFilterId) {
        return false;
      }
      return true;
    });
  }, [employees, categoryFilterId]);

  const attendanceEmployees = useMemo(() => {
    if (!attendanceShopId) {
      return filteredEmployees;
    }
    return filteredEmployees.filter(
      (employee) => Number(employee.shopId || 0) === attendanceShopId,
    );
  }, [attendanceShopId, filteredEmployees]);

  const payrollEmployees = useMemo(() => {
    if (!payrollShopId) {
      return [];
    }
    return employees.filter((employee) => Number(employee.shopId || 0) === payrollShopId);
  }, [employees, payrollShopId]);

  const historyEmployees = useMemo(() => {
    if (!payrollShopId) {
      return employees;
    }
    return payrollEmployees;
  }, [employees, payrollEmployees, payrollShopId]);

  const serviceOptions = useMemo(() => {
    return servicesCatalog.filter((item: ServiceCatalogItem) => item.isActive !== false);
  }, [servicesCatalog]);

  const selectedPercentageEmployeeId =
    servicePercentageForm.employeeId || selectedEmployeeId;

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
    if (activeTab !== "percentages") return;

    if (!selectedPercentageEmployeeId) {
      setEmployeePercentages([]);
      return;
    }

    const loadEmployeePercentages = async () => {
      try {
        const percentages = await getEmployeeServicePercentages(selectedPercentageEmployeeId);
        setEmployeePercentages(percentages);
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.loadFailed"));
      }
    };

    void loadEmployeePercentages();
  }, [activeTab, selectedPercentageEmployeeId, t]);

  useEffect(() => {
    if (activeTab !== "deposits") return;

    if (!selectedEmployeeId) {
      setDepositHistory([]);
      setActiveDeposit(null);
      return;
    }

    const loadDepositContext = async () => {
      try {
        const depositItems = await getEmployeeDeposits(selectedEmployeeId);

        setDepositHistory(depositItems);
        setActiveDeposit(getActiveDepositFromHistory(depositItems));
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.loadFailed"));
      }
    };

    void loadDepositContext();
  }, [activeTab, selectedEmployeeId, t]);

  useEffect(() => {
    if (activeTab !== "deposits") return;

    const loadAllDeposits = async () => {
      try {
        const items = await getAllEmployeeDeposits({
          shopId: allDepositsShopId > 0 ? allDepositsShopId : undefined,
          activeOnly: allDepositsActiveOnly,
        });
        setAllDeposits(items);
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.depositsAllLoadFailed"));
      }
    };

    void loadAllDeposits();
  }, [activeTab, allDepositsActiveOnly, allDepositsShopId, t]);

  useEffect(() => {
    if (activeTab !== "attendance") return;

    if (!selectedEmployeeId) {
      setAttendanceHistory([]);
      return;
    }

    const loadAttendanceHistory = async () => {
      try {
        const attendanceItems = await getEmployeeAttendanceHistory(selectedEmployeeId, {
          from: attendanceDate,
          to: attendanceDate,
        });
        setAttendanceHistory(attendanceItems);
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.loadFailed"));
      }
    };

    void loadAttendanceHistory();
  }, [activeTab, attendanceDate, selectedEmployeeId, t]);

  useEffect(() => {
    if (activeTab !== "attendance") return;

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

        attendanceEmployees.forEach((employee) => {
          if (!nextStatus[employee.id]) {
            nextStatus[employee.id] = "Present";
          }
          if (nextNotes[employee.id] === undefined) {
            nextNotes[employee.id] = "";
          }
        });

        setAttendanceStatus(nextStatus);
        setAttendanceNotes(nextNotes);
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.attendanceLoadFailed"));
      }
    };

    void loadAttendance();
  }, [activeTab, attendanceDate, attendanceEmployees, attendanceShopId, t]);

  useEffect(() => {
    const loadServicePercentages = async () => {
      if (!servicePercentageForm.serviceId) {
        setServicePercentagesByService([]);
        return;
      }

      try {
        const data = await getEmployeeServicePercentagesByService(servicePercentageForm.serviceId);
        setServicePercentagesByService(data);
      } catch {
        setServicePercentagesByService([]);
      }
    };

    void loadServicePercentages();
  }, [servicePercentageForm.serviceId]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    setDepositForm((prev) => ({ ...prev, employeeId: selectedEmployeeId }));
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
      await dispatch(fetchEmployees({ includeInactive: true }));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    }
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
      notes: employee.notes || "",
    });
    setActiveTab("employees");
  };

  const handleToggleEmployee = async (employee: EmployeeItem) => {
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
  };

  const handleSavePercentage = async () => {
    if (!servicePercentageForm.employeeId || !servicePercentageForm.serviceId) {
      toast.error(t("serviceTemplates.employeeManagement.messages.validationFailed"));
      return;
    }

    try {
      const payload: EmployeeServicePercentagePayload = {
        employeeId: servicePercentageForm.employeeId,
        serviceId: servicePercentageForm.serviceId,
        percentage: Number(servicePercentageForm.percentage || 0),
      };
      await upsertEmployeeServicePercentage(payload);
      toast.success(t("serviceTemplates.employeeManagement.messages.saved"));
      const [byEmployee, byService] = await Promise.all([
        getEmployeeServicePercentages(servicePercentageForm.employeeId),
        getEmployeeServicePercentagesByService(servicePercentageForm.serviceId),
      ]);
      setEmployeePercentages(byEmployee);
      setServicePercentagesByService(byService);
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    }
  };

  const handleCreateDeposit = async () => {
    if (!depositForm.employeeId || !depositForm.amount) {
      toast.error(t("serviceTemplates.employeeManagement.messages.validationFailed"));
      return;
    }

    try {
      const payload: EmployeeDepositPayload = {
        employeeId: depositForm.employeeId,
        amount: Number(depositForm.amount || 0),
        notes: depositForm.notes.trim() || undefined,
      };
      await createEmployeeDeposit(payload);
      toast.success(t("serviceTemplates.employeeManagement.messages.saved"));
      const history = await getEmployeeDeposits(depositForm.employeeId);
      setActiveDeposit(getActiveDepositFromHistory(history));
      setDepositHistory(history);
      const allItems = await getAllEmployeeDeposits({
        shopId: allDepositsShopId > 0 ? allDepositsShopId : undefined,
        activeOnly: allDepositsActiveOnly,
      });
      setAllDeposits(allItems);
      setDepositForm(emptyDepositForm());
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.saveFailed"));
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const tasks = attendanceEmployees.map((employee) => {
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
    }
  };

  const handleCalculateSalary = async () => {
    try {
      setSalaryLoading(true);
      await calculateEmployeeSalary({
        workDate: `${payrollDate}T00:00:00Z`,
        shopId: Number(payrollShopId || 0),
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

      if (salaryHistoryEmployeeId > 0) {
        const history = await getEmployeeSalaryHistory(salaryHistoryEmployeeId, {
          from: `${salaryHistoryFromDate}T00:00:00Z`,
          to: `${salaryHistoryToDate}T23:59:59Z`,
        });
        setSalaryHistory(history);
      } else {
        setSalaryHistory([]);
      }

      toast.success(t("serviceTemplates.employeeManagement.messages.calculated"));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.salaryFailed"));
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleMarkSalaryPaid = async (record: EmployeeSalaryRecordItem) => {
    if (!record.id) {
      toast.error(t("serviceTemplates.employeeManagement.messages.salaryRecordIdMissing"));
      return;
    }

    try {
      setMarkingSalaryId(record.id);
      await markEmployeeSalaryAsPaid(record.id);

      const salaryByDate = await getSalaryByDate(payrollDate);
      const filteredSalary = salaryByDate.filter((item) => {
        const matchesShop = payrollShopId > 0
          ? Number(item.shopId || 0) === Number(payrollShopId)
          : true;
        const matchesEmployee = payrollEmployeeId > 0
          ? Number(item.employeeId || 0) === Number(payrollEmployeeId)
          : true;
        return matchesShop && matchesEmployee;
      });
      setDailyPayroll(sortPayrollRecords(filteredSalary));

      if (salaryHistoryEmployeeId > 0) {
        const history = await getEmployeeSalaryHistory(salaryHistoryEmployeeId, {
          from: `${salaryHistoryFromDate}T00:00:00Z`,
          to: `${salaryHistoryToDate}T23:59:59Z`,
        });
        setSalaryHistory(history);
      } else {
        setSalaryHistory([]);
      }

      toast.success(t("serviceTemplates.employeeManagement.messages.salaryMarkedPaid"));
    } catch {
      toast.error(t("serviceTemplates.employeeManagement.messages.salaryMarkPaidFailed"));
    } finally {
      setMarkingSalaryId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== "payroll") return;

    const loadPayrollByDate = async () => {
      try {
        setSalaryLoading(true);
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

      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.salaryByDateLoadFailed"));
      } finally {
        setSalaryLoading(false);
      }
    };

    void loadPayrollByDate();
  }, [activeTab, payrollDate, payrollShopId, payrollEmployeeId, t]);

  useEffect(() => {
    if (activeTab !== "payroll") return;

    if (!salaryHistoryEmployeeId) {
      setSalaryHistory([]);
      return;
    }

    if (salaryHistoryFromDate > salaryHistoryToDate) {
      setSalaryHistory([]);
      return;
    }

    const loadSalaryHistory = async () => {
      try {
        const history = await getEmployeeSalaryHistory(salaryHistoryEmployeeId, {
          from: `${salaryHistoryFromDate}T00:00:00Z`,
          to: `${salaryHistoryToDate}T23:59:59Z`,
        });
        setSalaryHistory(history);
      } catch {
        toast.error(t("serviceTemplates.employeeManagement.messages.salaryHistoryLoadFailed"));
      }
    };

    void loadSalaryHistory();
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
        cell: ({ row }) => row.original.fullName || `${row.original.firstName} ${row.original.lastName}`,
      }),
      employeeColumnHelper.display({
        id: "shop",
        header: t("serviceTemplates.employeeManagement.columns.shop"),
        cell: ({ row }) => row.original.shopCode || `#${row.original.shopId}`,
      }),
      employeeColumnHelper.display({
        id: "serviceCategory",
        header: t("serviceTemplates.employeeManagement.columns.serviceCategory"),
        cell: ({ row }) => row.original.serviceCategoryName || `#${row.original.serviceCategoryId}`,
      }),
      employeeColumnHelper.display({
        id: "salaryType",
        header: t("serviceTemplates.employeeManagement.columns.salaryType"),
        cell: ({ row }) => t(`serviceTemplates.employeeManagement.salaryTypes.${row.original.salaryType}`),
      }),
      employeeColumnHelper.display({
        id: "fixedDailySalary",
        header: t("serviceTemplates.employeeManagement.columns.fixedDailySalary"),
        cell: ({ row }) => money(Number(row.original.fixedDailySalary || 0)),
      }),
      employeeColumnHelper.display({
        id: "phone",
        header: t("serviceTemplates.employeeManagement.columns.phone"),
        cell: ({ row }) => row.original.phone || "-",
      }),
      employeeColumnHelper.display({
        id: "isActive",
        header: t("serviceTemplates.employeeManagement.columns.status"),
        cell: ({ row }) =>
          row.original.isActive ? t("common.active") : t("common.inactive"),
      }),
      employeeColumnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <Button size="small" variant="secondary" onClick={() => handleEmployeeEdit(row.original)}>
              {t("common.edit")}
            </Button>
            <Button size="small" variant="secondary" onClick={() => handleToggleEmployee(row.original)}>
              {row.original.isActive ? t("actions.deactivate") : t("actions.activate")}
            </Button>
          </div>
        ),
      }),
    ],
    [t],
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

  const depositColumns = useMemo(
    () => [
      depositColumnHelper.display({
        id: "employeeFullName",
        header: t("serviceTemplates.employeeManagement.columns.employee"),
        cell: ({ row }) => row.original.employeeFullName,
      }),
      depositColumnHelper.display({
        id: "amount",
        header: t("serviceTemplates.employeeManagement.columns.amount"),
        cell: ({ row }) => money(Number(row.original.amount || 0)),
      }),
      depositColumnHelper.display({
        id: "remainingBalance",
        header: t("serviceTemplates.employeeManagement.columns.remainingBalance"),
        cell: ({ row }) => money(Number(row.original.remainingBalance || 0)),
      }),
      depositColumnHelper.display({
        id: "fullyRecoveredAt",
        header: t("serviceTemplates.employeeManagement.columns.fullyRecoveredAt"),
        cell: ({ row }) => row.original.fullyRecoveredAt ? row.original.fullyRecoveredAt.slice(0, 10) : "-",
      }),
      depositColumnHelper.display({
        id: "status",
        header: t("serviceTemplates.employeeManagement.columns.status"),
        cell: ({ row }) => (row.original.isActive ? t("common.active") : t("common.inactive")),
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
        cell: ({ row }) => row.original.status,
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
    () => [
      salaryColumnHelper.display({
        id: "employeeFullName",
        header: t("serviceTemplates.employeeManagement.columns.employee"),
        cell: ({ row }) => row.original.employeeFullName,
      }),
      salaryColumnHelper.display({
        id: "salaryType",
        header: t("serviceTemplates.employeeManagement.columns.salaryType"),
        cell: ({ row }) => t(`serviceTemplates.employeeManagement.salaryTypes.${row.original.salaryType}`),
      }),
      salaryColumnHelper.display({
        id: "grossSalary",
        header: t("serviceTemplates.employeeManagement.columns.grossSalary"),
        cell: ({ row }) => money(Number(row.original.grossSalary || 0)),
      }),
      salaryColumnHelper.display({
        id: "depositDeduction",
        header: t("serviceTemplates.employeeManagement.columns.depositDeduction"),
        cell: ({ row }) => money(Number(row.original.depositDeduction || 0)),
      }),
      salaryColumnHelper.display({
        id: "depositRemainingAfter",
        header: t("serviceTemplates.employeeManagement.columns.depositRemainingAfter"),
        cell: ({ row }) => money(Number(row.original.depositRemainingAfter || 0)),
      }),
      salaryColumnHelper.display({
        id: "netPayable",
        header: t("serviceTemplates.employeeManagement.columns.netPayable"),
        cell: ({ row }) => money(Number(row.original.netPayable || 0)),
      }),
      salaryColumnHelper.display({
        id: "paidStatus",
        header: t("serviceTemplates.employeeManagement.columns.paidStatus"),
        cell: ({ row }) => (
          <span
            className={row.original.isPaid ? styles.paidBadge : styles.unpaidBadge}
          >
            {row.original.isPaid
              ? t("serviceTemplates.employeeManagement.labels.paid")
              : t("serviceTemplates.employeeManagement.labels.unpaid")}
          </span>
        ),
      }),
      salaryColumnHelper.display({
        id: "paidAt",
        header: t("serviceTemplates.employeeManagement.columns.paidAt"),
        cell: ({ row }) =>
          row.original.paidAt
            ? row.original.paidAt.replace("T", " ").slice(0, 16)
            : "-",
      }),
      salaryColumnHelper.display({
        id: "workDate",
        header: t("serviceTemplates.employeeManagement.columns.workDate"),
        cell: ({ row }) => row.original.workDate.slice(0, 10),
      }),
      salaryColumnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
          const recordId = Number(row.original.id || 0);
          if (row.original.isPaid) {
            return (
              <span className={styles.paidText}>
                {t("serviceTemplates.employeeManagement.labels.paid")}
              </span>
            );
          }

          return (
            <Button
              size="small"
              variant="secondary"
              disabled={!recordId || markingSalaryId === recordId}
              onClick={() => setSalaryToConfirm(row.original)}
            >
              {markingSalaryId === recordId
                ? t("common.loading")
                : t("serviceTemplates.employeeManagement.actions.markPaid")}
            </Button>
          );
        },
      }),
    ],
    [markingSalaryId, t],
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

  return (
    <div className={styles.employeeManagement}>
      <div className={styles.managementTabs}>
        <TabGroup variant="segmented">
          <Tab
            variant="segmented"
            active={activeTab === "employees"}
            text={t("serviceTemplates.employeeManagement.tabs.employees")}
            icon={<UserCog size={14} />}
            onClick={() => setActiveTab("employees")}
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
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.employeeForm")}</h3>
              <div className={styles.actions}>
                <Button onClick={handleEmployeeSubmit}>
                  <Plus size={16} />
                  {employeeForm.id ? t("serviceTemplates.actions.update") : t("serviceTemplates.actions.create")}
                </Button>
                <Button variant="secondary" onClick={() => setEmployeeForm(emptyEmployeeForm())}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>

            <div className={styles.gridThree}>
              <TextField label={t("serviceTemplates.fields.firstName")} value={employeeForm.firstName} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))} />
              <TextField label={t("serviceTemplates.fields.lastName")} value={employeeForm.lastName} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))} />
              <TextField label={t("serviceTemplates.fields.email")} value={employeeForm.email} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))} />
              <TextField label={t("serviceTemplates.fields.phone")} value={employeeForm.phone} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Select label={t("serviceTemplates.employeeManagement.fields.shop")} value={String(employeeForm.shopId || "")} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, shopId: Number(e.target.value) || 0 }))}>
                <option value="">{t("serviceTemplates.employeeManagement.fields.selectShop")}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.code}</option>
                ))}
              </Select>
              <Select label={t("serviceTemplates.fields.serviceCategory")} value={String(employeeForm.serviceCategoryId || "")} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, serviceCategoryId: Number(e.target.value) || 0 }))} placeholder={t("common.select")}>
                <option value="">{t("common.select")}</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.code}</option>
                ))}
              </Select>
              <TextField label={t("serviceTemplates.fields.hireDate")} type="date" value={employeeForm.hireDate} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, hireDate: e.target.value }))} />
              <Select label={t("serviceTemplates.employeeManagement.fields.salaryType")} value={employeeForm.salaryType} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, salaryType: e.target.value as EmployeeSalaryType }))}>
                <option value="FixedDaily">{t("serviceTemplates.employeeManagement.salaryTypes.FixedDaily")}</option>
                <option value="PercentageBased">{t("serviceTemplates.employeeManagement.salaryTypes.PercentageBased")}</option>
              </Select>
              <TextField label={t("serviceTemplates.employeeManagement.fields.fixedDailySalary")} type="number" value={String(employeeForm.fixedDailySalary || 0)} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, fixedDailySalary: Number(e.target.value) || 0 }))} disabled={employeeForm.salaryType !== "FixedDaily"} />
              <Textarea label={t("serviceTemplates.fields.notes")} value={employeeForm.notes} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, notes: e.target.value }))} rows={4} />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.employeeList")}</h3>
              <div className={styles.actions}>
                <Select value={String(categoryFilterId)} onChange={(e) => setCategoryFilterId(Number(e.target.value) || 0)}>
                  <option value="0">{t("serviceTemplates.fields.allCategories")}</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.code}</option>
                  ))}
                </Select>
              </div>
            </div>
            {isEmployeesLoading ? (
              <div className={styles.loading}>{t("common.loading")}</div>
            ) : (
              <DataTable data={filteredEmployees} columns={employeeColumns} pageSize={12} />
            )}
          </section>
        </div>
      )}

      {activeTab === "percentages" && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.servicePercentages")}</h3>
              <div className={styles.actions}>
                <Select value={String(servicePercentageForm.employeeId || selectedEmployeeId || 0)} onChange={(e) => setServicePercentageForm((prev) => ({ ...prev, employeeId: Number(e.target.value) || 0 }))}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <Select value={String(servicePercentageForm.serviceId || 0)} onChange={(e) => setServicePercentageForm((prev) => ({ ...prev, serviceId: Number(e.target.value) || 0 }))}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectService")}</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>{service.name || service.code}</option>
                  ))}
                </Select>
                <TextField label={t("serviceTemplates.employeeManagement.fields.percentage")} type="number" value={String(servicePercentageForm.percentage || 0)} onChange={(e) => setServicePercentageForm((prev) => ({ ...prev, percentage: Number(e.target.value) || 0 }))} />
                <Button onClick={handleSavePercentage}>{t("serviceTemplates.employeeManagement.actions.save")}</Button>
              </div>
            </div>
          </section>

          <section className={styles.gridTwo}>
            <div className={styles.section}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.byEmployee")}</h3>
              <DataTable data={employeePercentages} columns={percentageColumns} pageSize={10} />
            </div>
            <div className={styles.section}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.byService")}</h3>
              <DataTable data={servicePercentagesByService} columns={percentageColumns} pageSize={10} />
            </div>
          </section>
        </div>
      )}

      {activeTab === "deposits" && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.deposits")}</h3>
              <div className={styles.actions}>
                <Select value={String(depositForm.employeeId || selectedEmployeeId || 0)} onChange={(e) => setDepositForm((prev) => ({ ...prev, employeeId: Number(e.target.value) || 0 }))}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.selectEmployee")}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <TextField label={t("serviceTemplates.employeeManagement.fields.amount")} type="number" value={String(depositForm.amount || 0)} onChange={(e) => setDepositForm((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))} />
                <TextField label={t("serviceTemplates.employeeManagement.fields.notes")} value={depositForm.notes} onChange={(e) => setDepositForm((prev) => ({ ...prev, notes: e.target.value }))} />
                <Button onClick={handleCreateDeposit}>{t("serviceTemplates.employeeManagement.actions.giveDeposit")}</Button>
              </div>
            </div>
            {activeDeposit && (
              <div className={styles.summaryRow}>
                <span>{t("serviceTemplates.employeeManagement.labels.activeDeposit")}:</span>
                <strong>{money(Number(activeDeposit.remainingBalance || 0))}</strong>
              </div>
            )}
          </section>
          <section className={styles.gridTwo}>
            <div className={styles.section}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.depositHistory")}</h3>
              <DataTable data={depositHistory} columns={depositColumns} pageSize={10} />
            </div>
            <div className={styles.section}>
              <div className={styles.header}>
                <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.depositsAll")}</h3>
                <div className={styles.actions}>
                  <Select
                    value={String(allDepositsShopId || 0)}
                    onChange={(e) => setAllDepositsShopId(Number(e.target.value) || 0)}
                  >
                    <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>{shop.code}</option>
                    ))}
                  </Select>
                  <Select
                    value={allDepositsActiveOnly ? "1" : "0"}
                    onChange={(e) => setAllDepositsActiveOnly(e.target.value === "1")}
                  >
                    <option value="0">{t("serviceTemplates.employeeManagement.fields.allDeposits")}</option>
                    <option value="1">{t("serviceTemplates.employeeManagement.fields.activeOnly")}</option>
                  </Select>
                </div>
              </div>
              <DataTable data={allDeposits} columns={depositColumns} pageSize={10} />
            </div>
          </section>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.attendance")}</h3>
              <div className={styles.actions}>
                <TextField label={t("serviceTemplates.employeeManagement.fields.workDate")} type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                <Select value={String(attendanceShopId || 0)} onChange={(e) => setAttendanceShopId(Number(e.target.value) || 0)}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.code}</option>
                  ))}
                </Select>
                <Button onClick={handleSaveAttendance}>{t("serviceTemplates.employeeManagement.actions.saveAttendance")}</Button>
              </div>
            </div>
            <div className={styles.summaryRow}>
              <span>{t("serviceTemplates.employeeManagement.labels.presentCount")}:</span>
              <strong>{attendanceSummary.present}</strong>
              <span>{t("serviceTemplates.employeeManagement.labels.absentCount")}:</span>
              <strong>{attendanceSummary.absent}</strong>
            </div>
          </section>
          <section className={styles.section}>
            <DataTable
              data={attendanceEmployees.map((employee) => ({
                id: employee.id,
                employeeId: employee.id,
                employeeFullName: employee.fullName,
                workDate: attendanceDate,
                status: attendanceStatus[employee.id] ?? "Present",
                notes: attendanceNotes[employee.id] || null,
                createdAt: "",
              }))}
              columns={[
                attendanceColumnHelper.display({
                  id: "employeeFullName",
                  header: t("serviceTemplates.employeeManagement.columns.employee"),
                  cell: ({ row }) => row.original.employeeFullName,
                }),
                attendanceColumnHelper.display({
                  id: "statusControl",
                  header: t("serviceTemplates.employeeManagement.columns.status"),
                  cell: ({ row }) => (
                    <Select
                      value={row.original.status}
                      onChange={(e) =>
                        setAttendanceStatus((prev) => ({
                          ...prev,
                          [row.original.employeeId]: e.target.value as EmployeeAttendanceStatus,
                        }))
                      }
                    >
                      <option value="Present">{t("serviceTemplates.employeeManagement.attendanceStatus.Present")}</option>
                      <option value="Absent">{t("serviceTemplates.employeeManagement.attendanceStatus.Absent")}</option>
                    </Select>
                  ),
                }),
                attendanceColumnHelper.display({
                  id: "notesControl",
                  header: t("serviceTemplates.employeeManagement.columns.notes"),
                  cell: ({ row }) => (
                    <TextField
                      value={attendanceNotes[row.original.employeeId] || ""}
                      onChange={(e) =>
                        setAttendanceNotes((prev) => ({
                          ...prev,
                          [row.original.employeeId]: e.target.value,
                        }))
                      }
                    />
                  ),
                }),
              ]}
              pageSize={10}
            />
          </section>
          <section className={styles.section}>
            <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.attendanceHistory")}</h3>
            <DataTable data={attendanceHistory} columns={attendanceColumns} pageSize={10} />
          </section>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.payroll")}</h3>
              <div className={styles.actions}>
                <TextField label={t("serviceTemplates.employeeManagement.fields.workDate")} type="date" value={payrollDate} onChange={(e) => setPayrollDate(e.target.value)} />
                <Select value={String(payrollShopId || 0)} onChange={(e) => setPayrollShopId(Number(e.target.value) || 0)}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allShops")}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.code}</option>
                  ))}
                </Select>
                <Select value={String(payrollEmployeeId || 0)} onChange={(e) => setPayrollEmployeeId(Number(e.target.value) || 0)} disabled={!payrollShopId}>
                  <option value="0">{t("serviceTemplates.employeeManagement.fields.allEmployees")}</option>
                  {payrollEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </Select>
                <Button onClick={handleCalculateSalary} disabled={salaryLoading}>{salaryLoading ? t("common.loading") : t("serviceTemplates.employeeManagement.actions.calculate")}</Button>
              </div>
            </div>
            <DataTable data={dailyPayroll} columns={salaryColumns} pageSize={10} />
          </section>
          <section className={styles.section}>
            <div className={styles.header}>
              <h3 className={styles.title}>{t("serviceTemplates.employeeManagement.sections.salaryHistory")}</h3>
              <div className={styles.actions}>
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
                  onChange={(e) => setSalaryHistoryFromDate(e.target.value)}
                />
                <TextField
                  label={t("serviceTemplates.employeeManagement.fields.toDate")}
                  type="date"
                  value={salaryHistoryToDate}
                  onChange={(e) => setSalaryHistoryToDate(e.target.value)}
                />
              </div>
            </div>
            {salaryHistoryEmployeeId > 0 ? (
              <DataTable data={salaryHistory} columns={salaryHistoryColumns} pageSize={10} />
            ) : (
              <div className={styles.noteBox}>
                {t("serviceTemplates.employeeManagement.messages.selectEmployeeForSalaryHistory")}
              </div>
            )}
          </section>
        </div>
      )}

      {!!salaryToConfirm && (
        <ConfirmationModal
          open={!!salaryToConfirm}
          onOpenChange={(open) => {
            if (!open) setSalaryToConfirm(null);
          }}
          title={t("serviceTemplates.employeeManagement.confirmation.markPaidTitle")}
          description={t("serviceTemplates.employeeManagement.confirmation.markPaidDescription", {
            employee: salaryToConfirm.employeeFullName,
            amount: money(Number(salaryToConfirm.netPayable || 0)),
          })}
          confirmText={t("serviceTemplates.employeeManagement.actions.markPaid")}
          cancelText={t("common.cancel")}
          confirmLoading={markingSalaryId === Number(salaryToConfirm.id || 0)}
          onConfirm={() => {
            if (salaryToConfirm) {
              void handleMarkSalaryPaid(salaryToConfirm);
            }
          }}
          onCancel={() => setSalaryToConfirm(null)}
        />
      )}
    </div>
  );
};
