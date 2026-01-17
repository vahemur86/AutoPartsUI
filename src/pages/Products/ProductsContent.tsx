import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
  type RefObject,
} from "react";
import { toast } from "react-toastify";

// hooks
import { useIsMobile } from "@/hooks/isMobile";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts, removeProduct } from "@/store/slices/productsSlice";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";

// ui-kit
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Button,
} from "@/ui-kit";

// icons
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

// types
import type { Product } from "@/types/products";

// components
import { ProductCard } from "./MobileProductCard";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./ProductsContent.module.css";

interface ProductsContentProps {
  onEdit: (product: Product, buttonRef: RefObject<HTMLElement>) => void;
}

interface ProductRowProps {
  product: Product;
  brands: Array<{ id: number; code: string }>;
  categories: Array<{ id: number; code: string }>;
  unitTypes: Array<{ id: number; code: string }>;
  boxSizes: Array<{ id: number; code: string }>;
  onEdit: (product: Product, buttonRef: RefObject<HTMLElement>) => void;
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
    items: Array<{ id: number; code: string }>,
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
              onEdit(product, editButtonRef as RefObject<HTMLElement>)
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

const ITEMS_PER_PAGE = 10;

export const ProductsContent = ({ onEdit }: ProductsContentProps) => {
  const { isMobile, mounted } = useIsMobile();
  const dispatch = useAppDispatch();
  const { products, isLoading } = useAppSelector((state) => state.products);
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);
  const fetchInitiatedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);

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
        // Reset to first page if current page becomes empty
        const totalPages = Math.ceil((products.length - 1) / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to delete product"));
      }
    },
    [dispatch, products.length, currentPage],
  );

  const totalPages = useMemo(
    () => Math.ceil(products.length / ITEMS_PER_PAGE),
    [products.length],
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when products change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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
          {paginatedProducts.map((product) => (
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
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            size="medium"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};
