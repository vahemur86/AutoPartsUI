import { describe, expect, it } from "vitest";

import { getYearOptions } from "./yearOptions";

describe("getYearOptions", () => {
  it("returns a descending list of years from the supplied range", () => {
    expect(getYearOptions(2020, 2022)).toEqual([2022, 2021, 2020]);
  });

  it("uses the current year as the default upper bound", () => {
    const currentYear = new Date().getFullYear();
    expect(getYearOptions(1970)).toEqual(
      Array.from({ length: currentYear - 1970 + 1 }, (_, index) => currentYear - index),
    );
  });
});
