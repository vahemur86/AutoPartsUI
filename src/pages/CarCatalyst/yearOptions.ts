export const getYearOptions = (fromYear = 1970, toYear = new Date().getFullYear()) => {
  if (fromYear > toYear) {
    return [];
  }

  const years: number[] = [];

  for (let year = toYear; year >= fromYear; year -= 1) {
    years.push(year);
  }

  return years;
};
