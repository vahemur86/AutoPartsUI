export const agentContractStatusMap = {
  1: "Draft",
  2: "Active",
  3: "Completed",
  4: "Cancelled",
  5: "Defaulted",
} as const;

export const normalizeAgentStatus = (value?: unknown): string => {
  if (typeof value === "number") {
    return agentContractStatusMap[value as keyof typeof agentContractStatusMap] ?? "";
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return "";

    const key = normalized.toLowerCase();
    if (key === "draft" || key === "1") return "Draft";
    if (key === "active" || key === "2") return "Active";
    if (key === "completed" || key === "3") return "Completed";
    if (key === "cancelled" || key === "canceled" || key === "4") return "Cancelled";
    if (key === "defaulted" || key === "5") return "Defaulted";

    return normalized;
  }

  return "";
};

export const isDraftAgentStatus = (value?: unknown) => normalizeAgentStatus(value) === "Draft";
export const isActiveAgentStatus = (value?: unknown) => normalizeAgentStatus(value) === "Active";
