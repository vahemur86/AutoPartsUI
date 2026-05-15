import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchServiceTemplates,
  addServiceTemplate,
  updateServiceTemplate,
} from "@/store/slices/serviceTemplatesSlice";

import { Button, TextField, DataTable } from "@/ui-kit";
import styles from "./ServiceTemplates.module.css";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type FormState = {
  name: string;
  mechanicPrice: number;
  electricianPrice: number;
  sparePartsPrice: number;
};

const initialForm: FormState = {
  name: "",
  mechanicPrice: 0,
  electricianPrice: 0,
  sparePartsPrice: 0,
};

export const ServiceTemplatePage = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { list, isLoading } = useAppSelector(
    (state) => state.serviceTemplates
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<boolean>(true);
  const [form, setForm] = useState<FormState>(initialForm);

  const isEditMode = editingId !== null;

  useEffect(() => {
    dispatch(fetchServiceTemplates());
  }, [dispatch]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setEditStatus(true);
  };

  // CREATE
  const onSubmit = async () => {
    try {
      await dispatch(addServiceTemplate(form)).unwrap();

      toast.success(t("serviceTemplates.createdSuccess"));
      resetForm();
      dispatch(fetchServiceTemplates());
    } catch {
      toast.error(t("serviceTemplates.createFailed"));
    }
  };

  // UPDATE
  const onUpdate = async () => {
    if (editingId === null) return;

    try {
      await dispatch(
        updateServiceTemplate({
          id: editingId,
          data: {
            name: form.name,
            mechanicPrice: form.mechanicPrice,
            electricianPrice: form.electricianPrice,
            sparePartsPrice: form.sparePartsPrice,
            isActive: editStatus,
          },
        })
      ).unwrap();

      toast.success(t("serviceTemplates.updateSuccess"));
      resetForm();
      dispatch(fetchServiceTemplates());
    } catch {
      toast.error(t("serviceTemplates.updateFailed"));
    }
  };

  // EDIT
  const onEdit = (item: any) => {
    setEditingId(item.id);

    setForm({
      name: item.name ?? "",
      mechanicPrice: item.mechanicPrice ?? 0,
      electricianPrice: item.electricianPrice ?? 0,
      sparePartsPrice: item.sparePartsPrice ?? 0,
    });

    setEditStatus(item.isActive ?? true);
  };

  const displayValue = (v: number) => (v === 0 ? "" : String(v));

  return (
    <div className={styles.container}>
      {/* FORM */}
      <div className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {t("serviceTemplates.title")}
          </h3>

          <div className={styles.actions}>
            <Button onClick={isEditMode ? onUpdate : onSubmit}>
              {isEditMode
                ? t("serviceTemplates.actions.update")
                : t("serviceTemplates.actions.create")}
            </Button>
          </div>
        </div>

        <div className={styles.form}>
          <TextField
            label={t("serviceTemplates.fields.name")}
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
          />

       
<TextField
  label={t("serviceTemplates.fields.mechanicPrice")}
  type="number"
  value={displayValue(form.mechanicPrice)}
  onChange={(e) =>
    setForm((p) => ({
      ...p,
      mechanicPrice: Number(e.target.value),
    }))
  }
/>

<TextField
  label={t("serviceTemplates.fields.electricianPrice")}
  type="number"
  value={displayValue(form.electricianPrice)}
  onChange={(e) =>
    setForm((p) => ({
      ...p,
      electricianPrice: Number(e.target.value),
    }))
  }
/>

         <TextField
  label={t("serviceTemplates.fields.sparePartsPrice")}
  type="number"
  value={displayValue(form.sparePartsPrice)}
  onChange={(e) =>
    setForm((p) => ({
      ...p,
      sparePartsPrice: Number(e.target.value),
    }))
  }
/>

          {/* STATUS ONLY IN EDIT */}
          {isEditMode && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                {t("serviceTemplates.fields.status")}
              </label>

              <select
                value={String(editStatus)}
                onChange={(e) =>
                  setEditStatus(e.target.value === "true")
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
                <option value="true">
                  {t("common.active")}
                </option>
                <option value="false">
                  {t("serviceTemplates.fields.inactive")}
                </option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className={`${styles.section} ${styles.tableSection}`}>
        {isLoading ? (
          <div className={styles.loading}>
            {t("common.loading")}
          </div>
        ) : (
          <DataTable
            data={list ?? []}
            columns={[
              {
                header: t("serviceTemplates.table.name"),
                accessorKey: "name",
              },
              {
                header: t("serviceTemplates.table.mechanic"),
                accessorKey: "mechanicPrice",
              },
              {
                header: t("serviceTemplates.table.electrician"),
                accessorKey: "electricianPrice",
              },
              {
                header: t("serviceTemplates.table.spareParts"),
                accessorKey: "sparePartsPrice",
              },

              {
                header: t("serviceTemplates.table.totalAmount"),
                accessorKey: "totalAmount",
                cell: ({ getValue }) => getValue<number>() ?? 0,
              },

              {
                header: t("serviceTemplates.fields.status"),
                accessorKey: "isActive",
                cell: ({ getValue }) => {
                  const isActive = getValue<boolean>();

                  return (
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: isActive
                          ? "#e6f7ee"
                          : "#fdeaea",
                        color: isActive ? "#1a7f37" : "#c62828",
                        border: `1px solid ${
                          isActive ? "#1a7f37" : "#c62828"
                        }`,
                      }}
                    >
                      {isActive
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  );
                },
              },

              {
                header: t("common.actions"),
                accessorKey: "id",
                cell: ({ row }) => (
                  <Button
                    size="small"
                    onClick={() => onEdit(row.original)}
                  >
                    {t("common.edit")}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};