import englandFlag from "@/assets/images/england.svg";
import russiaFlag from "@/assets/images/russia.svg";
import armeniaFlag from "@/assets/images/armenia.svg";
import franceFlag from "@/assets/images/france.svg";
import type { Language } from "@/types.ts/settings";

export const languages: Language[] = [
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
