import { useState, useCallback } from "react";

export function useBulkSelection<T extends string = string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggleOne = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: T[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected: (id: T) => selectedIds.has(id),
    toggleOne,
    toggleAll,
    clearSelection,
  };
}
