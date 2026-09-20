import { beforeEach, describe, expect, it, vi } from "vitest";

const { changeLanguageMock, hasResourceBundleMock } = vi.hoisted(() => ({
  changeLanguageMock: vi.fn(),
  hasResourceBundleMock: vi.fn(() => true),
}));

vi.mock("i18next", () => ({
  default: {
    hasResourceBundle: hasResourceBundleMock,
    changeLanguage: changeLanguageMock,
  },
}));

vi.mock("@/services/userLanguage", () => ({
  getUserLanguagePreference: vi.fn(),
}));

import { getUserLanguagePreference } from "@/services/userLanguage";
import { applyUserLanguagePreference } from "./applyUserLanguagePreference";

describe("applyUserLanguagePreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
      configurable: true,
    });

    hasResourceBundleMock.mockReturnValue(true);
    changeLanguageMock.mockResolvedValue(undefined);
  });

  it("uses the active backend language when the API returns only the language value", async () => {
    vi.mocked(getUserLanguagePreference).mockResolvedValue({
      language: "am",
    } as any);

    await applyUserLanguagePreference();

    expect(changeLanguageMock).toHaveBeenCalledWith("am");
    expect(localStorage.getItem("i18nextLng")).toBe("am");
    expect(hasResourceBundleMock).toHaveBeenCalledWith("am", "translation");
  });
});
