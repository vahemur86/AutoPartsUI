import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// utils
import { getApiErrorMessage } from "@/utils";

// components
import {
  CustomerTypeDropdown,
  type CustomerTypeForm,
} from "./customerTypesActions/CustomerTypeDropdown";

// columns
import { getCustomerTypeColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCustomerType,
  editCustomerType,
  fetchCustomerTypes,
} from "@/store/slices/customerTypesSlice";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./CustomerTypes.module.css";

export const CustomerTypes: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { customerTypes } = useAppSelector((state) => state.customerTypes);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCustomerType, setActiveCustomerType] =
    useState<CustomerType | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveCustomerType(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (customerType: CustomerType, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveCustomerType(customerType);
      setIsDropdownOpen(true);
    },
    []
  );

  const handleSaveCustomerType = useCallback(
    async (data: CustomerTypeForm) => {
      try {
        setIsMutating(true);
        if (activeCustomerType) {
          // For edit, isActive is always included from the dropdown
          await dispatch(
            editCustomerType({
              id: activeCustomerType.id,
              ...data,
              isActive: data.isActive ?? true,
            })
          ).unwrap();
          toast.success(t("customerTypes.success.updated"));
        } else {
          // For create, exclude isActive as it's not in the POST payload
          const { isActive, ...createData } = data;
          await dispatch(addCustomerType(createData)).unwrap();
          toast.success(t("customerTypes.success.created"));
        }
        await dispatch(fetchCustomerTypes()).unwrap();
        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save customer type:", error);
        const errorMessage = getApiErrorMessage(
          error,
          activeCustomerType
            ? t("customerTypes.error.failedToUpdate")
            : t("customerTypes.error.failedToCreate")
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [activeCustomerType, dispatch, t]
  );

  const columns = useMemo(
    () => getCustomerTypeColumns({ onEdit: handleOpenEdit }),
    [handleOpenEdit]
  );

  return (
    <div className={styles.customerTypesWrapper}>
      <div className={styles.header}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("customerTypes.addCustomerType")}
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("customerTypes.addCustomerType")}
          </span>
        </div>
      </div>

      <div className={styles.addCustomerTypeButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("customerTypes.addCustomerType")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("customerTypes.addCustomerType")}
          </span>
        </div>
      </div>

      <CustomerTypeDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeCustomerType}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveCustomerType}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={customerTypes} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
