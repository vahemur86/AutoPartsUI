export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  fuelType: string;
  status: "Active" | "Inactive" | "Maintenance";
};
