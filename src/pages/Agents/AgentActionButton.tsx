import type { ReactNode } from "react";
import { Button, IconButton, type ButtonProps, type IconButtonProps } from "@/ui-kit";
import styles from "./AgentActionButton.module.css";

type AgentActionTone = "primary" | "secondary";

interface AgentActionButtonProps extends Omit<ButtonProps, "children" | "variant"> {
  children: ReactNode;
  icon: ReactNode;
  tone?: AgentActionTone;
}

export const AgentActionButton = ({
  children,
  icon,
  tone = "primary",
  className = "",
  type = "button",
  ...props
}: AgentActionButtonProps) => (
  <Button
    {...props}
    type={type}
    variant={tone}
    className={[styles.actionButton, styles[tone], className].filter(Boolean).join(" ")}
  >
    <span className={styles.icon} aria-hidden="true">{icon}</span>
    {children}
  </Button>
);

type AgentIconTone = "primary" | "secondary" | "danger";

interface AgentIconButtonProps extends Omit<IconButtonProps, "variant"> {
  tone?: AgentIconTone;
}

export const AgentIconButton = ({
  tone = "secondary",
  className = "",
  ...props
}: AgentIconButtonProps) => (
  <IconButton
    {...props}
    variant={tone === "danger" ? "secondary" : tone}
    className={[styles.iconButton, styles[tone], className].filter(Boolean).join(" ")}
  />
);