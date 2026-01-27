import { useLocation } from "react-router-dom";

export const useActiveRoute = () => {
  const location = useLocation();

  const isActive = (path: string, options?: { exact?: boolean }) => {
    const { pathname } = location;

    const isNestedModule = path === "/settings" || path === "/reports";

    if (options?.exact || !isNestedModule) {
      return pathname === path;
    }

    return pathname.startsWith(path);
  };

  return { isActive, pathname: location.pathname };
};
