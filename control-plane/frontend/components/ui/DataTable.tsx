"use client";

import React, { useState, useMemo, ReactNode } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  headerActions?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Filter records...",
  searchFilter,
  emptyTitle = "No records found",
  emptyDescription = "There are no records matching your current filter.",
  onRowClick,
  headerActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim() && searchFilter) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => searchFilter(item, q));
    }

    if (sortKey) {
      result.sort((a: any, b: any) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA > valB ? 1 : -1;
        return sortDir === "asc" ? comp : -comp;
      });
    }

    return result;
  }, [data, searchQuery, searchFilter, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {(searchFilter || headerActions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {searchFilter ? (
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 rounded bg-panel border border-border-subtle focus:border-primary focus:outline-none text-text-primary text-xs placeholder:text-text-muted font-sans"
              />
            </div>
          ) : (
            <div />
          )}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      <div className="rounded-md border border-border-subtle bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/80 text-text-muted uppercase tracking-wider text-[10px] font-mono font-semibold">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`py-2 px-3 select-none ${
                      col.sortable ? "cursor-pointer hover:text-text-primary" : ""
                    } ${col.className || ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.key && (
                        sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3 text-primary" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-primary" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-mono text-[11px]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-6">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors ${
                      onRowClick
                        ? "cursor-pointer hover:bg-surface/80"
                        : "hover:bg-surface/50"
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`py-2 px-3 text-text-primary ${col.className || ""}`}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
