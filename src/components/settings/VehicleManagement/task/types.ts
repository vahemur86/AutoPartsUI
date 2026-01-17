export type Task = {
  id: string;
  name: string;
  type: "Mechanical" | "Inspection" | "Refine";
  laborCost: number;
  linkedVehiclesCount: number | null;
};
