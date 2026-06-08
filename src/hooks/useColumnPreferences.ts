import { useState, useCallback, useEffect } from "react";
import type { ColumnDef } from "@/lib/columnConfig";

const STORAGE_KEY_PREFIX = "column_prefs_";

export function useColumnPreferences(entityType: string, allColumns: ColumnDef[]) {
  const storageKey = `${STORAGE_KEY_PREFIX}${entityType}`;

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return allColumns.filter((c) => c.defaultVisible).map((c) => c.key);
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleKeys));
  }, [storageKey, visibleKeys]);

  const toggleColumn = useCallback((key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setVisibleKeys(allColumns.filter((c) => c.defaultVisible).map((c) => c.key));
  }, [allColumns]);

  const visibleColumns = allColumns.filter((c) => visibleKeys.includes(c.key));

  return { visibleKeys, visibleColumns, toggleColumn, resetToDefaults };
}
