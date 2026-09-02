import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import styles from "./Agents.module.css";

export const ClassifyAgent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [currentType, setCurrentType] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const agent = await agentsService.getAgent(id);
        setCurrentType(agent.agentType?.code ?? "NEW");
      } catch {
        setCurrentType(null);
      }
    })();
  }, [id]);

  const handleClassify = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const nextType = await agentsService.classifyAgent(id);
      const changed = currentType !== nextType.code;
      toast.success(
        changed
          ? t("agents.messages.classifiedChanged", { type: nextType.code })
          : t("agents.messages.classifiedUnchanged", { type: nextType.code }),
      );
      navigate(`/agents/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.classifyFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agents.classify.title")} goBack />
      <div className={styles.banner}>{t("agents.info.metricsUnavailable")}</div>
      <div className={styles.infoCard}>
        <div className={styles.detailRow}><strong>{t("agents.classify.currentType")}:</strong> {currentType ?? "—"}</div>
        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
          <Button onClick={handleClassify} disabled={isLoading}>
            {isLoading ? t("agents.classify.classifying") : t("agents.classify.button")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassifyAgent;
