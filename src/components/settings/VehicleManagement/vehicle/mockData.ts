import type { Vehicle } from "./types";

export const vehicles: Vehicle[] = [
  {
    id: "1",
    brand: "Toyota",
    model: "Camry",
    year: 2018,
    engine: "2.5L L4",
    fuelType: "Gasoline",
    status: "Active",
  },
  {
    id: "2",
    brand: "Honda",
    model: "Civic",
    year: 2020,
    engine: "1.5T",
    fuelType: "Gasoline",
    status: "Active",
  },
  {
    id: "3",
    brand: "Ford",
    model: "F-150",
    year: 2022,
    engine: "3.5L V6",
    fuelType: "Gasoline",
    status: "Maintenance",
  },
  {
    id: "4",
    brand: "Tesla",
    model: "Model 3",
    year: 2021,
    engine: "Electric",
    fuelType: "Electric",
    status: "Active",
  },
  {
    id: "5",
    brand: "Chevrolet",
    model: "Silverado",
    year: 2019,
    engine: "5.3L V8",
    fuelType: "Gasoline",
    status: "Inactive",
  },
];
