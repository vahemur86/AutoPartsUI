import { useEffect, useRef, useState } from "react";

export const useMinimumLoadingDuration = (
  isLoading: boolean,
  minimumDurationMs = 2000,
): boolean => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartedAt = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (isLoading) {
      loadingStartedAt.current = Date.now();
      setShowLoading(true);
    } else if (loadingStartedAt.current !== null) {
      const remainingDuration = Math.max(
        0,
        minimumDurationMs - (Date.now() - loadingStartedAt.current),
      );

      if (remainingDuration === 0) {
        loadingStartedAt.current = null;
        setShowLoading(false);
      } else {
        timeoutId = window.setTimeout(() => {
          loadingStartedAt.current = null;
          setShowLoading(false);
        }, remainingDuration);
      }
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [isLoading, minimumDurationMs]);

  return showLoading;
};