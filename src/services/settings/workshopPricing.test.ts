import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn() };
  return { api, default: api };
});

import { api } from "@/services/index";
import {
  createEmployee,
  getVehicleServiceTemplates,
  isNoOpenCashierSessionError,
  markEmployeeSalaryAsPaid,
  payEmployeeUnpaidSalary,
  updateEmployee,
} from "./workshopPricing";

describe("getVehicleServiceTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cashier session payment errors", () => {
    it("recognizes missing open cashier sessions", () => {
      expect(
        isNoOpenCashierSessionError(
          new Error("No open cashbox session for operator."),
        ),
      ).toBe(true);
      expect(
        isNoOpenCashierSessionError(
          new Error("No open cash register session found for this shop."),
        ),
      ).toBe(true);
      expect(
        isNoOpenCashierSessionError(
          new Error("There is no open session in any cash register for this shop."),
        ),
      ).toBe(true);
      expect(isNoOpenCashierSessionError(new Error("Insufficient balance."))).toBe(
        false,
      );
    });

    it("keeps the API error message for accumulated salary payment failures", async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { error: "No open cashbox session for operator." } },
      });

      await expect(
        payEmployeeUnpaidSalary(12, "2026-11-02"),
      ).rejects.toThrow("No open cashbox session for operator.");
    });

    it("keeps the API error message for salary-record payment failures", async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { error: "No open cashbox session for operator." } },
      });

      await expect(markEmployeeSalaryAsPaid(42)).rejects.toThrow(
        "No open cashbox session for operator.",
      );
    });
  });

  describe("employee salary type API mapping", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("sends ProgrammerPricing as SalaryType 2 when creating an employee", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { id: 12, salaryType: 2 },
      });

      const result = await createEmployee({
        firstName: "Ani",
        lastName: "Example",
        email: null,
        phone: "123456",
        shopId: 6,
        serviceCategoryId: 7,
        hireDate: "2026-11-02T00:00:00Z",
        employeeType: "Regular",
        salaryType: "ProgrammerPricing",
        fixedDailySalary: 0,
      });

      expect(api.post).toHaveBeenCalledWith(
        "/Employee",
        expect.objectContaining({ salaryType: 2, fixedDailySalary: 0 }),
      );
      expect(result.salaryType).toBe("ProgrammerPricing");
    });

    it("sends ProgrammerPricing as SalaryType 2 when updating an employee", async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { id: 12, salaryType: 2 },
      });

      const result = await updateEmployee({
        id: 12,
        firstName: "Ani",
        lastName: "Example",
        email: null,
        phone: "123456",
        shopId: 6,
        serviceCategoryId: 7,
        employeeType: "Regular",
        salaryType: "ProgrammerPricing",
        fixedDailySalary: 0,
      });

      expect(api.put).toHaveBeenCalledWith(
        "/Employee",
        expect.objectContaining({ id: 12, salaryType: 2, fixedDailySalary: 0 }),
      );
      expect(result.salaryType).toBe("ProgrammerPricing");
    });
  });

  it("preserves each service category when flattening template categories", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 4,
          brandId: 2,
          modelId: 5,
          year: 2017,
          location: "Usa",
          categories: [
            {
              serviceCategoryId: 7,
              serviceCategoryName: "Programming",
              items: [{ serviceId: 9, serviceName: "EURO 2", customerPrice: 30000 }],
            },
            {
              serviceCategoryId: 5,
              serviceCategoryName: "Mechanic",
              items: [
                { serviceId: 11, serviceName: "Exhaust", customerPrice: 80000 },
              ],
            },
          ],
        },
      ],
    });

    const [template] = await getVehicleServiceTemplates();

    expect(template.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceId: 9, serviceCategoryId: 7 }),
        expect.objectContaining({ serviceId: 11, serviceCategoryId: 5 }),
      ]),
    );
    expect(template.categories?.[1].services[0]).toEqual(
      expect.objectContaining({
        serviceId: 11,
        serviceCategoryId: 5,
        serviceCategoryName: "Mechanic",
      }),
    );
  });
});
