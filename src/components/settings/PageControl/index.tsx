import { useState, useMemo, useCallback, useEffect } from "react";
import { DataTable, Button } from "@/ui-kit";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { getOtpPages, saveOtpPages } from "@/services/verificationOTP";
import styles from "./PageControl.module.css";
import { toast } from "react-toastify";
import { t } from "i18next";

interface PageItem {
  id: number;
  name: string;
  requiresOtp: boolean;
}

export const PageControl = () => {
  const [items, setItems] = useState<PageItem[]>([]);
  const [originalItems, setOriginalItems] = useState<PageItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const pages = await getOtpPages();
        const formatted = pages.map((p) => ({
          id: p.pageId,
          name: p.name,
          requiresOtp: !!p.requiresOtp,
        }));
        setItems(formatted);
        setOriginalItems(formatted);
      } catch (error) {
        console.error("Failed to fetch pages:", error);
      }
    };
    fetchPages();
  }, []);

  const toggleRequiresOtp = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, requiresOtp: !item.requiresOtp } : item,
      ),
    );
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pagesToSave = items
        .filter(
          (item, index) =>
            item.requiresOtp !== originalItems[index].requiresOtp,
        )
        .map((item) => ({
          pageId: item.id,
          requiresOtp: item.requiresOtp,
        }));

      if (pagesToSave.length === 0) {
        toast.info(t("pageControl.toast.noChanges"));
        setIsSaving(false);
        return;
      }

      await saveOtpPages(pagesToSave);
      const updatedPages = await getOtpPages();
      const formatted = updatedPages.map((p) => ({
        id: p.pageId,
        name: p.name,
        requiresOtp: !!p.requiresOtp,
      }));
      setItems(formatted);
      setOriginalItems(formatted);
      setOriginalItems([...items]);

      toast.info(t("pageControl.toast.pagesUpdated"));
    } catch (error) {
      console.error("Failed to save OTP pages:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const columnHelper = createColumnHelper<PageItem>();

  const columns: ColumnDef<PageItem, any>[] = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: "",
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.original.requiresOtp}
            onChange={() => toggleRequiresOtp(row.original.id)}
          />
        ),
        size: 50,
      }),
      columnHelper.accessor("name", {
        header: t("pageControl.columns.name"),
      }),
      columnHelper.accessor("requiresOtp", {
        header: t("pageControl.columns.isVerified"),
        cell: ({ getValue }) => (getValue() ? "✅" : "❌"),
      }),
    ],
    [toggleRequiresOtp, columnHelper],
  );

  return (
    <div className={styles.pageControlWrapper}>
      <h2>{t("pageControl.title")}</h2>

      <div className={styles.tableWrapper}>
        <DataTable data={items} columns={columns} pageSize={30} />
      </div>

      <div className={styles.saveButtonWrapper}>
        <Button
          variant="primary"
          size="medium"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
