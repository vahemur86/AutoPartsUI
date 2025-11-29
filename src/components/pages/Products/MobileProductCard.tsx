import { useRef, useState } from "react";
import styles from "./ProductsContent.module.css";
import { Button, IconButton } from "@/ui-kit";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types.ts/products";

interface ProductCardProps {
  product: Product;
  brands: Array<{ id: number; code: string }>;
  categories: Array<{ id: number; code: string }>;
  unitTypes: Array<{ id: number; code: string }>;
  boxSizes: Array<{ id: number; code: string }>;
  onEdit: (product: Product, buttonRef: React.RefObject<HTMLElement>) => void;
  onDelete: (productId: number) => void;
}

export const ProductCard = ({
  product,
  brands,
  categories,
  unitTypes,
  boxSizes,
  onEdit,
  onDelete,
}: ProductCardProps) => {
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getNameById = (
    id: number,
    items: Array<{ id: number; code: string }>
  ): string => {
    const item = items.find((i) => i.id === id);
    return item?.code || `ID: ${id}`;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.productCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardHeaderTitle}>Actions</span>
        <div className={styles.cardActions}>
          <IconButton
            ref={editButtonRef}
            variant="secondary"
            size="small"
            icon={<Pencil size={14} color="#ffffff" />}
            ariaLabel="Edit"
            onClick={() =>
              onEdit(product, editButtonRef as React.RefObject<HTMLElement>)
            }
          />
          <IconButton
            variant="secondary"
            size="small"
            icon={<Trash2 size={14} color="#ffffff" />}
            ariaLabel="Delete"
            onClick={() => onDelete(product.id)}
          />
        </div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardField}>
          <span className={styles.cardFieldLabel}>SKU</span>
          <span className={styles.cardFieldValue}>{product.sku}</span>
        </div>
        <div className={styles.cardField}>
          <span className={styles.cardFieldLabel}>Code</span>
          <span className={styles.cardFieldValue}>{product.code}</span>
        </div>
        <div className={styles.cardField}>
          <span className={styles.cardFieldLabel}>BRAND</span>
          <span className={styles.cardFieldValue}>
            {getNameById(product.brandId, brands)}
          </span>
        </div>
        <div className={styles.cardField}>
          <span className={styles.cardFieldLabel}>UNIT TYPE</span>
          <span className={styles.cardFieldValue}>
            {getNameById(product.unitTypeId, unitTypes)}
          </span>
        </div>
        {isExpanded && (
          <>
            <div className={styles.cardField}>
              <span className={styles.cardFieldLabel}>CATEGORY</span>
              <span className={styles.cardFieldValue}>
                {getNameById(product.categoryId, categories)}
              </span>
            </div>
            <div className={styles.cardField}>
              <span className={styles.cardFieldLabel}>BOX SIZE</span>
              <span className={styles.cardFieldValue}>
                {getNameById(product.boxSizeId, boxSizes)}
              </span>
            </div>
            <div className={styles.cardField}>
              <span className={styles.cardFieldLabel}>VEHICLE DEPENDENT</span>
              <span className={styles.cardFieldValue}>
                {product.vehicleDependent ? "Yes" : "No"}
              </span>
            </div>
          </>
        )}
      </div>
      <div className={styles.cardFooter}>
        <Button
          variant="secondary"
          size="medium"
          onClick={toggleExpand}
          className={styles.viewMoreButton}
        >
          {isExpanded ? "View less" : "View more"}
        </Button>
      </div>
    </div>
  );
};
