import {
  useState,
  useCallback,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, ConfirmationModal, IconButton } from "@/ui-kit";

// icons
import { CalendarDays, Coins, Pencil, Plus, Trash2 } from "lucide-react";

// components
import {
  MetalRateDropdown,
  type MetalRateForm,
} from "./metalRatesActions/MetalRateDropdown";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMetalRate,
  editMetalRate,
  fetchMetalRates,
  removeMetalRate,
} from "@/store/slices/metalRatesSlice";

// types
import type { MetalRate } from "@/types/settings";

// styles
import styles from "./MetalRates.module.css";

export const MetalRates: FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { metalRates } = useAppSelector((state) => state.metalRates);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRate, setActiveRate] = useState<MetalRate | null>(null);
  const [deletingRate, setDeletingRate] = useState<MetalRate | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const sortedMetalRates = [...metalRates].sort(
    (left, right) => Number(right.isActive) - Number(left.isActive),
  );

  useEffect(() => {
    dispatch(fetchMetalRates());
  }, [dispatch]);

  const handleOpenAdd = useCallback(() => {
    setActiveRate(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (rate: MetalRate) => {
      setActiveRate(rate);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleSaveRate = useCallback(
    async (data: MetalRateForm) => {
      try {
        setIsMutating(true);
        if (activeRate) {
          await dispatch(
            editMetalRate({ id: activeRate.id, ...data }),
          ).unwrap();
        } else {
          await dispatch(addMetalRate(data)).unwrap();
        }
        await dispatch(fetchMetalRates()).unwrap();
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("Failed to save metal rate:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [activeRate, dispatch],
  );

  const handleDeleteRate = useCallback(
    async (rate: MetalRate) => {
      try {
        setIsMutating(true);
        await dispatch(removeMetalRate(rate.id)).unwrap();
        await dispatch(fetchMetalRates()).unwrap();
        setDeletingRate(null);
      } catch (error) {
        console.error("Failed to delete metal rate:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const language = i18n.resolvedLanguage ?? i18n.language;
  const formatLocale = language.startsWith("am")
    ? "hy-AM"
    : language.startsWith("ru")
      ? "ru-RU"
      : "en-US";
  const numberFormat = new Intl.NumberFormat(formatLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dateLocale = language.startsWith("en") ? "en-US" : "en-GB";
  const dateFormat = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className={styles.metalRatesWrapper}>
      <div className={styles.header}>
        <Button className={styles.createButton} onClick={handleOpenAdd}>
          <Plus size={16} />
          {t("metals.addRate")}
        </Button>
      </div>

      <MetalRateDropdown
        open={isDropdownOpen}
        initialData={activeRate}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveRate}
      />

      {!!deletingRate && (
        <ConfirmationModal
          open={!!deletingRate}
          onOpenChange={(open) => !open && setDeletingRate(null)}
          title={t("metals.confirmation.deleteTitle")}
          description={t("metals.confirmation.deleteDescription", {
            name: deletingRate?.currencyCode,
          })}
          confirmText={isMutating ? t("common.deleting") : t("common.delete")}
          cancelText={t("common.cancel")}
          onConfirm={() => deletingRate && handleDeleteRate(deletingRate)}
          onCancel={() => setDeletingRate(null)}
        />
      )}

      {metalRates.length === 0 ? (
        <div className={styles.emptyState}>
          <Coins size={24} aria-hidden="true" />
          <span>{t("common.noData")}</span>
        </div>
      ) : (
        <div className={styles.rateGrid}>
          {sortedMetalRates.map((rate) => (
            <article
              className={`${styles.rateCard} ${rate.isActive ? styles.rateCardActive : ""}`}
              key={rate.id}
            >
              <header className={styles.cardHeader}>
                <div className={styles.currencyIdentity}>
                  <span className={styles.currencyIcon} aria-hidden="true">
                    <Coins size={19} />
                  </span>
                  <div className={styles.currencyCopy}>
                    <span className={styles.cardEyebrow}>
                      {t("metals.columns.currency")}
                    </span>
                    <h2>{rate.currencyCode}</h2>
                  </div>
                </div>
                <span
                  className={`${styles.status} ${rate.isActive ? styles.statusActive : styles.statusInactive}`}
                >
                  <span className={styles.statusDot} />
                  {rate.isActive ? t("common.active") : t("common.inactive")}
                </span>
              </header>

              <div className={styles.priceGrid}>
                <div className={styles.priceMetric}>
                  <span className={styles.priceLabel}>
                    {t("metals.columns.platinum")}
                  </span>
                  <strong>${numberFormat.format(rate.ptPricePerGram)}</strong>
                </div>
                <div className={styles.priceMetric}>
                  <span className={styles.priceLabel}>
                    {t("metals.columns.palladium")}
                  </span>
                  <strong>${numberFormat.format(rate.pdPricePerGram)}</strong>
                </div>
                <div className={styles.priceMetric}>
                  <span className={styles.priceLabel}>
                    {t("metals.columns.rhodium")}
                  </span>
                  <strong>${numberFormat.format(rate.rhPricePerGram)}</strong>
                </div>
              </div>

              <footer className={styles.cardFooter}>
                <span className={styles.effectiveDate}>
                  <CalendarDays size={14} aria-hidden="true" />
                  <span>{t("metals.columns.effectiveFrom")}</span>
                  <time dateTime={rate.effectiveFrom}>
                    {dateFormat.format(new Date(rate.effectiveFrom))}
                  </time>
                </span>
                <div className={styles.cardActions}>
                  <IconButton
                    variant="secondary"
                    size="medium"
                    icon={<Pencil size={15} />}
                    ariaLabel={`${t("common.edit")} ${rate.currencyCode}`}
                    title={`${t("common.edit")} ${rate.currencyCode}`}
                    onClick={() => handleOpenEdit(rate)}
                  />
                  <IconButton
                    variant="secondary"
                    size="medium"
                    className={styles.deleteAction}
                    icon={<Trash2 size={15} />}
                    ariaLabel={`${t("common.delete")} ${rate.currencyCode}`}
                    title={`${t("common.delete")} ${rate.currencyCode}`}
                    onClick={() => setDeletingRate(rate)}
                  />
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
