import englandFlag from "@/assets/images/england.svg";
import russiaFlag from "@/assets/images/russia.svg";
import armeniaFlag from "@/assets/images/armenia.svg";
import franceFlag from "@/assets/images/france.svg";
import type { Language } from "@/types.ts/settings";

export const LANGUAGES: Language[] = [
  {
    id: 1,
    code: "en",
    name: "English",
    flag: englandFlag,
    isDefault: true,
  },
  {
    id: 2,
    code: "ru",
    name: "Russian",
    flag: russiaFlag,
    isDefault: false,
  },
  {
    id: 3,
    code: "am",
    name: "Armenian",
    flag: armeniaFlag,
    isDefault: false,
  },
  {
    id: 4,
    code: "fr",
    name: "France",
    flag: franceFlag,
    isDefault: false,
  },
];

export const PRODUCT_SETTINGS_TABS = [
  { id: "category-code", label: "Category Code" },
  { id: "brand-code", label: "Brand Code" },
  { id: "unit-types-code", label: "Unit Types Code" },
  { id: "box-size-code", label: "Box Size Code" },
];
