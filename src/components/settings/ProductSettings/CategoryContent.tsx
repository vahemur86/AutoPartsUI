import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Pencil, Trash2, RefreshCw } from "lucide-react";

import {
  createCategoryNode,
  deleteCategory,
  getCategoriesTree,
  updateCategoryNode,
} from "@/services/settings/productSettings";
import { fetchCategories } from "@/store/slices/productSettingsSlice";
import { useAppDispatch } from "@/store/hooks";
import { getCashRegisterId } from "@/utils";
import type {
  CategoriesTreeResponse,
  CategoryNode,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/settings";
import { Button, Select, Switch, TextField } from "@/ui-kit";

import styles from "./ProductSettings.module.css";

type FlatCategoryNode = CategoryNode & { depth: number };

const flattenTree = (
  nodes: CategoryNode[],
  depth = 0,
  acc: FlatCategoryNode[] = [],
): FlatCategoryNode[] => {
  const sorted = [...nodes].sort((a, b) => a.displayOrder - b.displayOrder);

  sorted.forEach((node) => {
    acc.push({ ...node, depth });
    if (node.subCategories?.length) {
      flattenTree(node.subCategories, depth + 1, acc);
    }
  });

  return acc;
};

const collectDescendantIds = (node: CategoryNode): Set<number> => {
  const ids = new Set<number>();

  const walk = (current: CategoryNode) => {
    current.subCategories?.forEach((child) => {
      ids.add(child.id);
      walk(child);
    });
  };

  walk(node);
  return ids;
};

export const CategoryContent = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const cashRegisterId = getCashRegisterId(0);

  const [treeData, setTreeData] = useState<CategoriesTreeResponse>({
    rootCategories: [],
  });
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  const [createCode, setCreateCode] = useState("");
  const [createParentId, setCreateParentId] = useState("");
  const [createDisplayOrder, setCreateDisplayOrder] = useState("1");

  const [editingNode, setEditingNode] = useState<FlatCategoryNode | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("1");
  const [editIsActive, setEditIsActive] = useState(true);

  const flatNodes = useMemo(
    () => flattenTree(treeData.rootCategories),
    [treeData.rootCategories],
  );

  const nodesById = useMemo(() => {
    const map = new Map<number, FlatCategoryNode>();
    flatNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [flatNodes]);

  const loadTree = useCallback(async () => {
    setIsLoadingTree(true);
    try {
      const data = await getCategoriesTree(cashRegisterId);
      setTreeData(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("productSettings.categoryTree.error.load");
      toast.error(message);
    } finally {
      setIsLoadingTree(false);
    }
  }, [cashRegisterId, t]);

  useEffect(() => {
    void loadTree();
  }, [loadTree, i18n.language]);

  const refreshAllCategoryData = useCallback(async () => {
    await Promise.all([loadTree(), dispatch(fetchCategories()).unwrap()]);
  }, [dispatch, loadTree]);

  const handleCreateCategory = useCallback(async () => {
    const code = createCode.trim();
    const displayOrder = Number(createDisplayOrder);

    if (!code) {
      toast.error(t("productSettings.categoryTree.error.codeRequired"));
      return;
    }

    if (!Number.isFinite(displayOrder) || displayOrder < 1) {
      toast.error(t("productSettings.categoryTree.error.displayOrder"));
      return;
    }

    const payload: CreateCategoryPayload = {
      code,
      parentCategoryId: createParentId ? Number(createParentId) : null,
      displayOrder,
    };

    try {
      await createCategoryNode(payload);
      await refreshAllCategoryData();
      setCreateCode("");
      toast.success(t("productSettings.categoryTree.success.created"));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("productSettings.categoryTree.error.create");
      toast.error(message);
    }
  }, [
    createCode,
    createDisplayOrder,
    createParentId,
    refreshAllCategoryData,
    t,
  ]);

  const startEdit = useCallback((node: FlatCategoryNode) => {
    setEditingNode(node);
    setEditCode(node.code);
    setEditParentId(node.parentCategoryId ? String(node.parentCategoryId) : "");
    setEditDisplayOrder(String(node.displayOrder));
    setEditIsActive(node.isActive);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingNode(null);
    setEditCode("");
    setEditParentId("");
    setEditDisplayOrder("1");
    setEditIsActive(true);
  }, []);

  const disallowedParentIds = useMemo(() => {
    if (!editingNode) return new Set<number>();
    const source = nodesById.get(editingNode.id);
    if (!source) return new Set<number>();

    const blocked = collectDescendantIds(source);
    blocked.add(source.id);
    return blocked;
  }, [editingNode, nodesById]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNode) return;

    const code = editCode.trim();
    const displayOrder = Number(editDisplayOrder);

    if (!code) {
      toast.error(t("productSettings.categoryTree.error.codeRequired"));
      return;
    }

    if (!Number.isFinite(displayOrder) || displayOrder < 1) {
      toast.error(t("productSettings.categoryTree.error.displayOrder"));
      return;
    }

    const parsedParent = editParentId ? Number(editParentId) : null;
    if (parsedParent !== null && disallowedParentIds.has(parsedParent)) {
      toast.error(t("productSettings.categoryTree.error.invalidParent"));
      return;
    }

    const payload: UpdateCategoryPayload = {
      id: editingNode.id,
      code,
      parentCategoryId: parsedParent,
      isActive: editIsActive,
      displayOrder,
    };

    try {
      await updateCategoryNode(payload);
      await refreshAllCategoryData();
      toast.success(t("productSettings.categoryTree.success.updated"));
      cancelEdit();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("productSettings.categoryTree.error.update");
      toast.error(message);
    }
  }, [
    cancelEdit,
    disallowedParentIds,
    editCode,
    editDisplayOrder,
    editingNode,
    editIsActive,
    editParentId,
    refreshAllCategoryData,
    t,
  ]);

  const handleDelete = useCallback(
    async (node: FlatCategoryNode) => {
      const accepted = window.confirm(
        t("productSettings.categoryTree.confirmDelete", {
          name: node.name || node.code,
        }),
      );

      if (!accepted) return;

      try {
        await deleteCategory(node.id);
        await refreshAllCategoryData();
        toast.success(t("productSettings.categoryTree.success.deleted"));

        if (editingNode?.id === node.id) {
          cancelEdit();
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : t("productSettings.categoryTree.error.delete");
        toast.error(message);
      }
    },
    [cancelEdit, editingNode?.id, refreshAllCategoryData, t],
  );

  return (
    <div className={styles.categoryLayout}>
      <div className={styles.categoryFormCard}>
        <div className={styles.categoryCardHeader}>
          <h3>{t("productSettings.categoryTree.createTitle")}</h3>
          <p>{t("productSettings.categoryTree.createDescription")}</p>
        </div>

        <div className={styles.categoryFormGrid}>
          <TextField
            label={t("productSettings.categoryTree.codeLabel")}
            value={createCode}
            onChange={(e) => setCreateCode(e.target.value)}
            placeholder={t("productSettings.keyHere")}
            disabled={isLoadingTree}
          />

          <Select
            label={t("productSettings.categoryTree.parentLabel")}
            value={createParentId}
            onChange={(e) => setCreateParentId(e.target.value)}
            placeholder={t("productSettings.categoryTree.root")}
            disabled={isLoadingTree}
            searchable
          >
            <option value="">{t("productSettings.categoryTree.root")}</option>
            {flatNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {"- ".repeat(node.depth)}{node.name || node.code}
              </option>
            ))}
          </Select>

          <TextField
            label={t("productSettings.categoryTree.displayOrderLabel")}
            value={createDisplayOrder}
            onChange={(e) => setCreateDisplayOrder(e.target.value)}
            placeholder="1"
            disabled={isLoadingTree}
          />
        </div>

        <div className={styles.categoryCardActions}>
          <Button
            variant="primary"
            size="medium"
            onClick={handleCreateCategory}
            disabled={isLoadingTree || !createCode.trim()}
          >
            {t("productSettings.categoryTree.createButton")}
          </Button>
        </div>

        {editingNode && (
          <div className={styles.editPanel}>
            <div className={styles.editPanelHeader}>
              <h4>{t("productSettings.categoryTree.editTitle")}</h4>
              <span>{editingNode.name || editingNode.code}</span>
            </div>

            <div className={styles.categoryFormGrid}>
              <TextField
                label={t("productSettings.categoryTree.codeLabel")}
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder={t("productSettings.keyHere")}
                disabled={isLoadingTree}
              />

              <Select
                label={t("productSettings.categoryTree.parentLabel")}
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
                placeholder={t("productSettings.categoryTree.root")}
                disabled={isLoadingTree}
                searchable
              >
                <option value="">{t("productSettings.categoryTree.root")}</option>
                {flatNodes
                  .filter((node) => !disallowedParentIds.has(node.id))
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {"- ".repeat(node.depth)}{node.name || node.code}
                    </option>
                  ))}
              </Select>

              <TextField
                label={t("productSettings.categoryTree.displayOrderLabel")}
                value={editDisplayOrder}
                onChange={(e) => setEditDisplayOrder(e.target.value)}
                placeholder="1"
                disabled={isLoadingTree}
              />

              <div className={styles.switchField}>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  label={t("productSettings.categoryTree.activeLabel")}
                />
              </div>
            </div>

            <div className={styles.categoryCardActions}>
              <Button
                variant="secondary"
                size="medium"
                onClick={cancelEdit}
                disabled={isLoadingTree}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSaveEdit}
                disabled={isLoadingTree || !editCode.trim()}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.treeCard}>
        <div className={styles.categoryCardHeader}>
          <h3>{t("productSettings.categoryTree.treeTitle")}</h3>
          <button
            className={styles.refreshButton}
            onClick={() => void refreshAllCategoryData()}
            disabled={isLoadingTree}
            aria-label={t("common.refresh")}
          >
            <RefreshCw size={14} className={isLoadingTree ? styles.spin : ""} />
          </button>
        </div>

        <div className={styles.treeBody}>
          {isLoadingTree && flatNodes.length === 0 ? (
            <div className={styles.emptyTreeState}>
              {t("productSettings.loading")}
            </div>
          ) : flatNodes.length === 0 ? (
            <div className={styles.emptyTreeState}>
              {t("productSettings.categoryTree.noItems")}
            </div>
          ) : (
            flatNodes.map((node, index) => (
              <div
                key={node.id}
                className={`${styles.treeNodeRow} ${node.level === 0 ? styles.rootNodeRow : ""}`}
                style={{
                  paddingLeft: `${12 + node.depth * 20}px`,
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <div className={styles.treeNodeMain}>
                  <span className={styles.nodeTitleRow}>
                    <span
                      className={`${styles.nodeTitle} ${node.level === 0 ? styles.rootNodeTitle : ""}`}
                    >
                      {node.name || node.code}
                    </span>
                    {node.level === 0 && (
                      <span className={styles.rootBadge}>
                        {t("productSettings.categoryTree.rootBadge")}
                      </span>
                    )}
                  </span>
                  <span className={styles.nodeMeta}>{node.code}</span>
                </div>

                <div className={styles.nodeBadges}>
                  <span className={styles.levelBadge}>L{node.level}</span>
                  <span className={styles.orderBadge}>#{node.displayOrder}</span>
                  {!node.isActive && (
                    <span className={styles.inactiveBadge}>
                      {t("common.inactive")}
                    </span>
                  )}
                </div>

                <div className={styles.nodeActions}>
                  <button
                    className={styles.rowActionButton}
                    onClick={() => startEdit(node)}
                    aria-label={t("common.edit")}
                    disabled={isLoadingTree}
                  >
                    <Pencil size={14} />
                    <span>{t("common.edit")}</span>
                  </button>
                  <button
                    className={styles.rowActionButton}
                    onClick={() => void handleDelete(node)}
                    aria-label={t("common.delete")}
                    disabled={isLoadingTree}
                  >
                    <Trash2 size={14} />
                    <span>{t("common.delete")}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
