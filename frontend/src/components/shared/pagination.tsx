'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [20, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const getVisiblePages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <span>
          Menampilkan {startItem}–{endItem} dari {totalItems}
        </span>
        {onPerPageChange && (
          <select
            value={perPage}
            onChange={e => onPerPageChange(Number(e.target.value))}
            className="input input-sm w-auto text-xs"
            style={{ padding: '4px 8px' }}
          >
            {perPageOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt} / halaman
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn btn-ghost btn-icon btn-sm"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-ghost btn-icon btn-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getVisiblePages().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                currentPage === page
                  ? 'text-white'
                  : 'hover:bg-[var(--color-bg-elevated)]'
              )}
              style={
                currentPage === page
                  ? { background: 'var(--color-accent)', color: 'white' }
                  : { color: 'var(--color-text-secondary)' }
              }
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-ghost btn-icon btn-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn btn-ghost btn-icon btn-sm"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Hook to slice data for pagination */
export function usePagination<T>(items: T[], initialPerPage = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = items.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage: safePage,
    totalPages,
    perPage,
    paginatedItems,
    totalItems: items.length,
    handlePageChange,
    handlePerPageChange,
  };
}
