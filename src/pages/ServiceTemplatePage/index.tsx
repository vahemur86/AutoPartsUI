console.log("🔥 serviceTemplatesSlice LOADED");
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchServiceTemplates,
  addServiceTemplate,
} from "@/store/slices/serviceTemplatesSlice";
import { Button, TextField } from "@/ui-kit";
import styles from "./ServiceTemplates.module.css";
import { toast } from "react-toastify";

export const ServiceTemplatePage = () => {
  const dispatch = useAppDispatch();
  const { list, isLoading } = useAppSelector(
    (state) => state.serviceTemplates
  );

  const [form, setForm] = useState({
    name: "",
    mechanicPrice: 0,
    electricianPrice: 0,
    sparePartsPrice: 0,
  });

  useEffect(() => {
    dispatch(fetchServiceTemplates());
  }, [dispatch]);

  const onSubmit = async () => {
    try {
      await dispatch(addServiceTemplate(form)).unwrap();

      toast.success("Template created successfully");

      setForm({
        name: "",
        mechanicPrice: 0,
        electricianPrice: 0,
        sparePartsPrice: 0,
      });

      dispatch(fetchServiceTemplates());
    } catch {
      toast.error("Failed to create template");
    }
  };

  return (
    <div className={styles.container}>
      {/* FORM SECTION */}
      <div className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.title}>Service Templates</h3>
          <div className={styles.actions}>
            <Button onClick={onSubmit}>Create</Button>
          </div>
        </div>

        <div className={styles.form}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
          />

          <TextField
            label="Mechanic Price"
            type="number"
            value={form.mechanicPrice}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                mechanicPrice: Number(e.target.value),
              }))
            }
          />

          <TextField
            label="Electrician Price"
            type="number"
            value={form.electricianPrice}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                electricianPrice: Number(e.target.value),
              }))
            }
          />

          <TextField
            label="Spare Parts Price"
            type="number"
            value={form.sparePartsPrice}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                sparePartsPrice: Number(e.target.value),
              }))
            }
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.title}>List</h3>
        </div>

        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <table width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mechanic</th>
                  <th>Electrician</th>
                  <th>Spare Parts</th>
                </tr>
              </thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td>{x.name}</td>
                    <td>{x.mechanicPrice}</td>
                    <td>{x.electricianPrice}</td>
                    <td>{x.sparePartsPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};