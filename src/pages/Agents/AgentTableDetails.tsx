import type { ReactNode } from "react";
import styles from "./AgentTableDetails.module.css";

interface AgentTableDetailsProps {
  fields: Array<{ label: string; value: ReactNode }>;
}

export const AgentTableDetails = ({ fields }: AgentTableDetailsProps) => (
  <dl className={styles.details}>
    {fields.map(({ label, value }) => (
      <div className={styles.detail} key={label}>
        <dt>{label}</dt>
        <dd>{value ?? "—"}</dd>
      </div>
    ))}
  </dl>
);