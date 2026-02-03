import { useLocation } from "react-router-dom";

export const useActiveRoute = () => {
  const { pathname } = useLocation();

  const isActive = (path: string, options?: { exact?: boolean }) => {
    if (options?.exact) {
      return pathname === path;
    }

    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return { isActive, pathname };
};
