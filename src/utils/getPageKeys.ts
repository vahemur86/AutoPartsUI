// // utils/getPageKey.ts
// import { ROUTE_PAGE_KEYS } from '@/constants/pageKeys';

// export const getCurrentPageKey = (): string | undefined => {
//   const pathname = window.location.pathname;
  
//   // Exact match first
//   if (ROUTE_PAGE_KEYS[pathname]) return ROUTE_PAGE_KEYS[pathname];
  
//   // Partial match for nested routes e.g. "/languages/edit/1" → "Languages"
//   const matchedKey = Object.keys(ROUTE_PAGE_KEYS).find((route) =>
//     pathname.startsWith(route),
//   );
  
//   return matchedKey ? ROUTE_PAGE_KEYS[matchedKey] : undefined;
// };