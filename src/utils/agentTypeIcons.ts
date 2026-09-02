import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  User,
  CheckCircle,
  Zap,
  AlertCircle,
} from "lucide-react";

/**
 * Maps agent type codes to appropriate icons
 * Standard agent type codes:
 * - NEW: New Agent (new, starting)
 * - REGULAR: Regular Agent (standard user)
 * - TRUSTED: Trusted Agent (verified, reliable)
 * - HIGH_PERF: High Performance Agent (excellent performer)
 * - RISKY: Risky Agent (caution, monitoring)
 */
export const agentTypeIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  NEW: {
    icon: Sparkles,
    color: "#3b82f6", // Blue - fresh, new
  },
  REGULAR: {
    icon: User,
    color: "#6b7280", // Gray - standard
  },
  TRUSTED: {
    icon: CheckCircle,
    color: "#22c55e", // Green - verified, trusted
  },
  HIGH_PERF: {
    icon: Zap,
    color: "#f59e0b", // Amber - high energy, excellent
  },
  RISKY: {
    icon: AlertCircle,
    color: "#ef4444", // Red - caution, risk
  },
};

/**
 * Get icon and color for agent type by code
 */
export const getAgentTypeIconConfig = (
  code?: string,
): { icon: LucideIcon; color: string } => {
  if (!code) {
    return agentTypeIconMap.REGULAR;
  }

  return agentTypeIconMap[code.toUpperCase()] || agentTypeIconMap.REGULAR;
};

/**
 * Get icon component for agent type
 */
export const getAgentTypeIcon = (code?: string): LucideIcon => {
  return getAgentTypeIconConfig(code).icon;
};

/**
 * Get color for agent type
 */
export const getAgentTypeColor = (code?: string): string => {
  return getAgentTypeIconConfig(code).color;
};
