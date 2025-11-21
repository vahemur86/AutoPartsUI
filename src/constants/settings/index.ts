import englandFlag from "@/assets/images/england.svg";
import russiaFlag from "@/assets/images/russia.svg";
import armeniaFlag from "@/assets/images/armenia.svg";
import franceFlag from "@/assets/images/france.svg";
import type { Language } from "@/types.ts/settings";

export const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    shortCode: "en",
    flag: englandFlag,
    isDefault: true,
  },
  {
    code: "ru",
    name: "Russian",
    shortCode: "russ",
    flag: russiaFlag,
    isDefault: false,
  },
  {
    code: "am",
    name: "Armenian",
    shortCode: "arm",
    flag: armeniaFlag,
    isDefault: false,
  },
  {
    code: "fr",
    name: "France",
    shortCode: "fr",
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
