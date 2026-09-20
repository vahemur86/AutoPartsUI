export const getAgentSummaryCounts = (total: number, active: number) => ({
  total,
  active,
  inactive: Math.max(total - active, 0),
});
