import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Skeleton } from "./Skeleton";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  hidden?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  stickyHeader?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = "No records found",
  emptyIcon,
  pagination,
  onRowClick,
  rowClassName,
  stickyHeader = false,
}: TableProps<T>) {
  const visibleColumns = columns.filter((c) => !c.hidden);

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className={`bg-slate-50 border-b border-slate-200 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`
                    px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap
                    ${alignClass[col.align ?? "left"]}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {visibleColumns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <Skeleton className="h-4 rounded-md" style={{ width: col.width ?? "80%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="py-16 text-center">
                  {emptyIcon && (
                    <div className="flex justify-center mb-3 text-slate-300">{emptyIcon}</div>
                  )}
                  <p className="text-slate-500 text-sm font-medium">{emptyMessage}</p>
                  <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors duration-100
                    ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
                    ${rowClassName?.(row) ?? ""}
                  `}
                >
                  {visibleColumns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-slate-700 ${alignClass[col.align ?? "left"]}`}
                    >
                      {col.render
                        ? col.render(row, rowIdx)
                        : String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">{pagination.totalCount}</span> records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`
                    min-w-[32px] h-8 px-2 text-xs rounded-lg font-medium transition-all
                    ${pagination.page === pageNum
                      ? "bg-primary-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
