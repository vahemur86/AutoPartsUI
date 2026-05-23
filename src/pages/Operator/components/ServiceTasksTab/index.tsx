import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Select, TextField } from "@/ui-kit";
import { useTranslation } from "react-i18next";
import styles from "./ServiceTasksTab.module.css";
import sharedStyles from "../../OperatorPage.module.css";
import { getServiceTasksWithoutPrice, payServiceTasks } from "@/services/operator";
import { toast } from "react-toastify";
import { PaymentMethod } from "@/types/operator";

interface Props {
  cashRegisterId?: number;
  onSuccess?: () => void;
}

type Item = {
  id: number;
  code: string;
  selected: boolean;
  price: string;
  paymentType: PaymentMethod;
};

export const ServiceTasksTab = ({ cashRegisterId, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getServiceTasksWithoutPrice({ cashRegisterId });
        setItems(
          data.map((d) => ({
            id: d.id,
            code: d.code,
            selected: false,
            price: "",
            paymentType: PaymentMethod.Cash,
          })),
        );
      } catch (e) {
        console.error(e);
        toast.error(t("operatorPage.services.error.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [cashRegisterId, t]);

  const cashTotal = useMemo(() => {
    return items
      .filter((i) => i.selected && i.paymentType === PaymentMethod.Cash)
      .reduce((s, it) => s + Number(it.price || 0), 0);
  }, [items]);

  const nonCashTotal = useMemo(() => {
    return items
      .filter((i) => i.selected && i.paymentType !== PaymentMethod.Cash)
      .reduce((s, it) => s + Number(it.price || 0), 0);
  }, [items]);

  const total = useMemo(() => cashTotal + nonCashTotal, [cashTotal, nonCashTotal]);

  const selectedCount = useMemo(() => items.filter((item) => item.selected).length, [items]);

  const toggleSelect = (id: number, value: boolean) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, selected: value } : p)));
  };

  const setPrice = (id: number, price: string) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, price } : p)));
  };

  const setPaymentType = (id: number, paymentType: PaymentMethod) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, paymentType } : p)));
  };

  const handleSubmit = async () => {
    const selected = items.filter((i) => i.selected && i.price && !Number.isNaN(Number(i.price)));
    if (!selected.length) {
      toast.error(t("operatorPage.services.error.nothingSelected"));
      return;
    }

    setIsLoading(true);
    try {
      await payServiceTasks({
        cashRegisterId,
        items: selected.map((s) => ({
          serviceTaskId: s.id,
          price: Number(s.price),
          paymentType: s.paymentType,
        })),
      });

      toast.success(t("operatorPage.services.success.paid"));
      if (onSuccess) onSuccess();
      setItems((prev) => prev.map((p) => ({ ...p, selected: false, price: "" })));
    } catch (e) {
      console.error(e);
      toast.error(t("operatorPage.services.error.payFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={sharedStyles.cardTitle}>{t("operatorPage.services.title")}</h2>
      <div className={sharedStyles.divider} />

      <div className={styles.listHeader}>
        <div />
        <div>{t("operatorPage.services.columns.code")}</div>
        <div>{t("operatorPage.services.columns.price")}</div>
        <div>{t("operatorPage.services.columns.paymentType")}</div>
      </div>
      <div className={styles.list}>
        {isLoading && <div>{t("common.loading")}</div>}
        {!isLoading && items.length === 0 && <div>{t("operatorPage.services.noItems")}</div>}
        {items.map((item) => (
          <div key={item.id} className={`${styles.itemRow} ${item.selected ? styles.selectedRow : ""}`}>
            <Checkbox checked={item.selected} onCheckedChange={(v) => toggleSelect(item.id, v)} />
            <div className={styles.itemCode}>{item.code}</div>
            <TextField
              type="number"
              min="0"
              placeholder="0 AMD"
              value={item.price}
              onChange={(e) => setPrice(item.id, e.target.value)}
              disabled={!item.selected}
              inputMode="decimal"
              className={styles.priceInput}
            />
            <Select
              value={item.paymentType}
              onChange={(e) => setPaymentType(item.id, Number(e.target.value) as PaymentMethod)}
              disabled={!item.selected}
              className={styles.paymentSelect}
            >
              <option value={PaymentMethod.Cash}>{t("operatorPage.services.paymentTypes.cash")}</option>
              <option value={PaymentMethod.NonCash}>{t("operatorPage.services.paymentTypes.nonCash")}</option>
            </Select>
          </div>
        ))}
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span>{t("operatorPage.services.selectedCount")}</span>
            <strong>{selectedCount}</strong>
          </div>
          <div className={styles.summaryLine}>
            <span>{t("operatorPage.services.cashTotal")}</span>
            <strong>{cashTotal.toLocaleString()} AMD</strong>
          </div>
          <div className={styles.summaryLine}>
            <span>{t("operatorPage.services.nonCashTotal")}</span>
            <strong>{nonCashTotal.toLocaleString()} AMD</strong>
          </div>
          <div className={styles.summaryLine}>
            <span>{t("operatorPage.services.totalAmount")}</span>
            <strong className={styles.summaryTotal}>{total.toLocaleString()} AMD</strong>
          </div>
        </div>
        <Button variant="primary" className={styles.payButton} onClick={handleSubmit} disabled={isLoading || selectedCount === 0}>
          {t("operatorPage.services.pay")}
        </Button>
      </div>
    </div>
  );
};

export default ServiceTasksTab;
