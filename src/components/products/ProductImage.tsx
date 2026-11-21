import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import {
  getProductImage,
  productImageChangedEvent,
} from "@/services/productImages";
import styles from "./ProductImage.module.css";

interface ProductImageProps {
  productId: number;
  imageUrl?: string | null;
  alt: string;
  className?: string;
}

export const ProductImage = ({
  productId,
  imageUrl,
  alt,
  className,
}: ProductImageProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleImageChanged = (event: Event) => {
      const productImageEvent = event as CustomEvent<{ productId: number }>;
      if (productImageEvent.detail?.productId === productId) {
        setRefreshKey((current) => current + 1);
      }
    };
    window.addEventListener(productImageChangedEvent, handleImageChanged);
    return () => window.removeEventListener(productImageChangedEvent, handleImageChanged);
  }, [productId]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setSrc(null);

    if (!imageUrl && refreshKey === 0) return () => { active = false; };

    void getProductImage(productId)
      .then((data) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [productId, imageUrl, refreshKey]);

  const showImage = Boolean(imageUrl && src);

  return (
    <span
      className={`${styles.imageFrame} ${className ?? ""}`}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : alt}
    >
      {showImage && src ? (
        <img
          className={styles.image}
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => {
            URL.revokeObjectURL(src);
            setSrc(null);
          }}
        />
      ) : (
        <Package size={18} aria-hidden="true" />
      )}
    </span>
  );
};
