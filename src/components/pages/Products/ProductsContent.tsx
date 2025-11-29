import { useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useIsMobile } from "@/hooks/isMobile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts, removeProduct } from "@/store/slices/productsSlice";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@/ui-kit";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types.ts/products";
import styles from "./ProductsContent.module.css";
import { ProductCard } from "./MobileProductCard";

interface ProductsContentProps {
  onEdit: (product: Product, buttonRef: React.RefObject<HTMLElement>) => void;
}

interface ProductRowProps {
  product: Product;
  brands: Array<{ id: number; code: string }>;
  categories: Array<{ id: number; code: string }>;
  unitTypes: Array<{ id: number; code: string }>;
  boxSizes: Array<{ id: number; code: string }>;
  onEdit: (product: Product, buttonRef: React.RefObject<HTMLElement>) => void;
  onDelete: (productId: number) => void;
}

const ProductRow = ({
  product,
  brands,
  categories,
  unitTypes,
  boxSizes,
  onEdit,
  onDelete,
}: ProductRowProps) => {
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const getNameById = (
    id: number,
    items: Array<{ id: number; code: string }>
  ): string => {
    const item = items.find((i) => i.id === id);
    return item?.code || `ID: ${id}`;
  };

  return (
    <TableRow>
      <TableCell>{product.code}</TableCell>
      <TableCell>{product.sku}</TableCell>
      <TableCell>{getNameById(product.brandId, brands)}</TableCell>
      <TableCell>{getNameById(product.categoryId, categories)}</TableCell>
      <TableCell>{getNameById(product.unitTypeId, unitTypes)}</TableCell>
      <TableCell>{getNameById(product.boxSizeId, boxSizes)}</TableCell>
      <TableCell>{product.vehicleDependent ? "Yes" : "No"}</TableCell>
      <TableCell>
        <div className={styles.actionsCell}>
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
      </TableCell>
    </TableRow>
  );
};

export const ProductsContent = ({ onEdit }: ProductsContentProps) => {
  const { isMobile, mounted } = useIsMobile();
  const dispatch = useAppDispatch();
  const { products, isLoading } = useAppSelector((state) => state.products);
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);
  const fetchInitiatedRef = useRef(false);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;

    dispatch(fetchProducts());

    if (!fetchedData.brands) {
      dispatch(fetchBrands());
    }
    if (!fetchedData.categories) {
      dispatch(fetchCategories());
    }
    if (!fetchedData.unitTypes) {
      dispatch(fetchUnitTypes());
    }
    if (!fetchedData.boxSizes) {
      dispatch(fetchBoxSizes());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleDelete = useCallback(
    async (productId: number) => {
      try {
        await dispatch(removeProduct(productId)).unwrap();
        toast.success("Product deleted successfully");
        dispatch(fetchProducts());
      } catch (error: any) {
        console.error("Failed to delete product:", error);
        toast.error(error || "Failed to delete product");
      }
    },
    [dispatch]
  );

  if (isLoading && products.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No products found. Click "Add New" to create your first product.</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  // Mobile: Show cards
  if (isMobile) {
    return (
      <div className={styles.productsContentMobile}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            brands={brands}
            categories={categories}
            unitTypes={unitTypes}
            boxSizes={boxSizes}
            onEdit={onEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  // Desktop: Show table
  return (
    <div className={styles.productsContent}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell asHeader>Product Key</TableCell>
            <TableCell asHeader>SKU</TableCell>
            <TableCell asHeader>Brand</TableCell>
            <TableCell asHeader>Category</TableCell>
            <TableCell asHeader>Unit Type</TableCell>
            <TableCell asHeader>Box Size</TableCell>
            <TableCell asHeader>Vehicle Dependent</TableCell>
            <TableCell asHeader>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              brands={brands}
              categories={categories}
              unitTypes={unitTypes}
              boxSizes={boxSizes}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
