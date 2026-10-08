import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ArrowRight, Banknote, Building2, Landmark, Plus, Sparkles, Wallet } from "lucide-react";

import { Button, Select, TextField } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { capitalSourcesService } from "@/services/capitalSources";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CapitalSourceDto, CapitalSourceStatus, CapitalSourceType } from "@/types/capitalSources";
import styles from "./CapitalSources.module.css";

const typeOptions: Array<{ value: CapitalSourceType | ""; label: string }> = [
  { value: "", label: "capitalSources.filters.allTypes" },
  { value: "BankLoan", label: "capitalSources.types.BankLoan" },
  { value: "OwnerInvestment", label: "capitalSources.types.OwnerInvestment" },
  { value: "Other", label: "capitalSources.types.Other" },
];

const statusOptions: Array<{ value: CapitalSourceStatus | ""; label: string }> = [
  { value: "", label: "capitalSources.filters.allStatuses" },
  { value: "Active", label: "capitalSources.statuses.Active" },
  { value: "Inactive", label: "capitalSources.statuses.Inactive" },
  { value: "Closed", label: "capitalSources.statuses.Closed" },
];

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getSourceMeta = (type: CapitalSourceType) => {
  switch (type) {
    case "BankLoan":
      return { icon: Landmark, accent: styles.bankAccent };
    case "OwnerInvestment":
      return { icon: Wallet, accent: styles.ownerAccent };
    default:
      return { icon: Sparkles, accent: styles.otherAccent };
  }
};

const getStatusClass = (status?: CapitalSourceStatus | string | null) => {
  switch (status) {
    case "Active":
      return styles.statusActive;
    case "Inactive":
      return styles.statusInactive;
    case "Closed":
      return styles.statusClosed;
    default:
      return styles.statusInactive;
  }
};

export const CapitalSourcesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<CapitalSourceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "10");
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const code = searchParams.get("code") || "";
  const name = searchParams.get("name") || "";

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await capitalSourcesService.listCapitalSources({
        type: type || undefined,
        status: status || undefined,
        code: code || undefined,
        name: name || undefined,
        page,
        pageSize,
      });
      setItems(result.results ?? []);
      setTotalItems(result.totalItems ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.loadFailed", "Failed to load capital sources.")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, type, status, code, name]);

  const applyFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({ page: "1", pageSize: String(pageSize) });
  };

  const totalBalance = items.reduce((sum, item) => sum + (item.currentBalance ?? 0), 0);

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("capitalSources.title")}
        actions={
          <div className={styles.headerActions}>
            <Button onClick={() => navigate("/capital-sources/create")}>
              <Plus size={14} /> {t("capitalSources.actions.create")}
            </Button>
          </div>
        }
      />

      <div className={styles.portfolioShell}>
        <section className={styles.heroCard} aria-label={t("capitalSources.portfolio.title")}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>{t("capitalSources.portfolio.eyebrow")}</p>
            <h2>{t("capitalSources.portfolio.title")}</h2>
            <p className={styles.heroDescription}>{t("capitalSources.portfolio.description")}</p>
          </div>
          <div className={styles.heroValue}>
            <span>{t("capitalSources.fields.currentBalance")}</span>
            <strong>{formatMoney(totalBalance)} AMD</strong>
          </div>
        </section>

        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <Select value={type} onChange={(e) => applyFilter("type", e.target.value)}>
              {typeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </Select>

            <Select value={status} onChange={(e) => applyFilter("status", e.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </Select>

            <TextField
              label={t("capitalSources.fields.code")}
              value={code}
              onChange={(e) => applyFilter("code", e.target.value)}
            />

            <TextField
              label={t("capitalSources.fields.name")}
              value={name}
              onChange={(e) => applyFilter("name", e.target.value)}
            />
          </div>

          <div className={styles.filterFooter}>
            <span>{t("capitalSources.summary.totalItems", { count: totalItems })}</span>
            <Button variant="secondary" size="small" onClick={resetFilters}>
              {t("common.reset")}
            </Button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statTile}>
            <span className={styles.statIcon}><Banknote size={18} /></span>
            <div>
              <span>{t("capitalSources.portfolio.totalSources")}</span>
              <strong>{totalItems}</strong>
            </div>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statIcon}><Building2 size={18} /></span>
            <div>
              <span>{t("capitalSources.portfolio.activeSources")}</span>
              <strong>{items.filter((item) => item.status === "Active").length}</strong>
            </div>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statIcon}><Wallet size={18} /></span>
            <div>
              <span>{t("capitalSources.portfolio.available")}</span>
              <strong>{formatMoney(totalBalance)} AMD</strong>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>{t("common.loading")}</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={24} />
            <h3>{t("capitalSources.emptyState")}</h3>
            <p>{t("capitalSources.portfolio.emptyHint")}</p>
            <Button onClick={() => navigate("/capital-sources/create")}>
              <Plus size={16} /> {t("capitalSources.actions.create")}
            </Button>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {items.map((item) => {
              const sourceMeta = getSourceMeta(item.type);
              const SourceIcon = sourceMeta.icon;

              return (
                <article key={item.id} className={styles.sourceCard}>
                  <div className={`${styles.cardTop} ${sourceMeta.accent}`}>
                    <div className={styles.cardBrand}>
                      <span className={styles.cardIcon}><SourceIcon size={18} /></span>
                      <div>
                        <span className={styles.cardCode}>{item.code}</span>
                        <h3>{item.name}</h3>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                      {t(`capitalSources.statuses.${item.status}`, { defaultValue: item.status })}
                    </span>
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.balanceBlock}>
                      <span>{t("capitalSources.fields.currentBalance")}</span>
                      <strong>{formatMoney(item.currentBalance)} AMD</strong>
                    </div>

                    <div className={styles.cardMetrics}>
                      <div>
                        <span>{t("capitalSources.fields.initialAmount")}</span>
                        <strong>{formatMoney(item.initialAmount)} AMD</strong>
                      </div>
                      <div>
                        <span>{t("capitalSources.fields.interestRate")}</span>
                        <strong>{item.interestRate != null ? `${item.interestRate}%` : "—"}</strong>
                      </div>
                    </div>

                    <div className={styles.cardMeta}>
                      <span><strong>{t("capitalSources.fields.type")}:</strong> {t(`capitalSources.types.${item.type}`, { defaultValue: item.type })}</span>
                      <span><strong>{t("capitalSources.fields.startDate")}:</strong> {item.startDate ? new Date(item.startDate).toLocaleDateString() : "—"}</span>
                      <span><strong>{t("capitalSources.fields.endDate")}:</strong> {item.endDate ? new Date(item.endDate).toLocaleDateString() : "—"}</span>
                    </div>

                    {item.description && <p className={styles.cardDescription}>{item.description}</p>}
                  </div>

                  <div className={styles.cardActions}>
                    <Button variant="secondary" size="small" onClick={() => navigate(`/capital-sources/${item.id}`)}>
                      {t("capitalSources.actions.view")}
                      <ArrowRight size={14} />
                    </Button>
                    <Button variant="secondary" size="small" onClick={() => navigate(`/capital-sources/${item.id}/edit`)}>
                      {t("capitalSources.actions.edit")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
