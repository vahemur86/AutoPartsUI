export interface StatusConfig {
  label: string;
  className: string;
}

export type StatusMap = Record<number, StatusConfig>;

export const createStatusMap = (styles: Record<string, string>): StatusMap => ({
  1: { label: "Available", className: styles.statusAvailable },
  2: { label: "Depleted", className: styles.statusDepleted },
  3: { label: "Cancelled", className: styles.statusCancelled },
  4: { label: "Empty", className: styles.statusEmpty },
});

export const getStatusConfig = (
  statusValue: number,
  statusMap: StatusMap,
): StatusConfig => {
  return (
    statusMap[statusValue] || {
      label: "Unknown",
      className: "",
    }
  );
};

