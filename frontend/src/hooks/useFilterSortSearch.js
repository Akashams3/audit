import { useState, useMemo } from "react";

/**
 * Universal hook for text search, multi-criteria filtering, and sorting
 * @param {Array} initialData 
 * @param {Object} options - { searchKeys: ['name', 'code', 'title'], defaultSort: 'name' }
 */
export const useFilterSortSearch = (initialData = [], options = {}) => {
  const { searchKeys = [], defaultSortKey = "", defaultSortOrder = "asc" } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStage, setFilterStage] = useState("ALL");
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(initialData)) return [];

    return initialData
      .filter((item) => {
        // Search matching
        if (searchTerm.trim() !== "" && searchKeys.length > 0) {
          const lowerTerm = searchTerm.toLowerCase();
          const matches = searchKeys.some((key) => {
            const val = item[key];
            return val && String(val).toLowerCase().includes(lowerTerm);
          });
          if (!matches) return false;
        }

        // Category filter
        if (filterCategory !== "ALL" && item.category) {
          if (item.category !== filterCategory) return false;
        }

        // Status filter
        if (filterStatus !== "ALL" && (item.status || item.auditStatus)) {
          const itemStatus = item.status || item.auditStatus;
          if (itemStatus !== filterStatus) return false;
        }

        // Stage filter
        if (filterStage !== "ALL" && item.stage) {
          if (item.stage !== filterStage) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortKey) return 0;

        let valA = a[sortKey] ?? "";
        let valB = b[sortKey] ?? "";

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [initialData, searchTerm, filterCategory, filterStatus, filterStage, sortKey, sortOrder, searchKeys]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterStage,
    setFilterStage,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    toggleSort,
    filteredData: filteredAndSortedData
  };
};
