import { beforeEach, describe, expect, it } from "vitest";

import {
  createReferralPerson,
  getReferralPerson,
  getReferralPersons,
  updateReferralPerson,
} from "./referralPersons";

const mockStorage = (() => {
  const map = new Map<string, string>();

  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
})();

describe("referral persons service", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    mockStorage.clear();
  });

  it("creates and retrieves a referral person with persisted data", async () => {
    const created = await createReferralPerson({
      code: "ARAM001",
      name: "Aram Sargsyan",
      phone: "+37491234567",
      email: "aram@example.com",
      notes: "Referred by word of mouth",
    });

    expect(created.code).toBe("ARAM001");

    const list = await getReferralPersons();
    expect(list.totalItems).toBe(1);
    expect(list.results[0].name).toBe("Aram Sargsyan");

    const found = await getReferralPerson(String(created.id));
    expect(found?.email).toBe("aram@example.com");

    const updated = await updateReferralPerson(String(created.id), {
      name: "Aram Sargsyan Updated",
      phone: "+37491000000",
      email: "updated@example.com",
      notes: "Updated note",
    });

    expect(updated.name).toBe("Aram Sargsyan Updated");
    expect(updated.email).toBe("updated@example.com");
  });
});
