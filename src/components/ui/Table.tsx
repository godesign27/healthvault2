import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  variant?: 'default' | 'striped' | 'bordered' | 'compact';
  hover?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    variant?: 'default' | 'primary' | 'danger';
  }[];
  stickyHeader?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

const actionVariantClass = {
  default: 'text-content-secondary hover:bg-action-secondary',
  primary: 'text-action-primary hover:bg-action-primary-subtle',
  danger:  'text-content-feedback-error hover:bg-surface-feedback-error',
} as const;

export function Table<T extends Record<string, any>>({
  columns,
  data,
  variant = 'default',
  hover = true,
  selectable = false,
  onRowSelect,
  onSort,
  actions,
  stickyHeader = false,
  maxHeight,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}: TableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedActions, setExpandedActions] = useState<number | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(data.map((_, i) => i)));
      onRowSelect?.(data);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  const handleRowSelect = (index: number, checked: boolean) => {
    const next = new Set(selectedRows);
    checked ? next.add(index) : next.delete(index);
    setSelectedRows(next);
    onRowSelect?.(data.filter((_, i) => next.has(i)));
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;
    const dir = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column.key);
    setSortDirection(dir);
    onSort?.(column.key, dir);
  };

  const colSpan = columns.length + (selectable ? 1 : 0) + (actions?.length ? 1 : 0);

  return (
    <div
      className={cn('overflow-x-auto', maxHeight && 'overflow-y-auto', className)}
      style={{ maxHeight }}
    >
      <table className="min-w-full">
        <thead
          className={cn(
            'bg-surface-sunken border-b border-stroke-subtle',
            stickyHeader && 'sticky top-0 z-10',
          )}
        >
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-stroke-default accent-action-primary"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col)}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider',
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                  col.sortable && 'cursor-pointer select-none hover:bg-action-secondary transition-colors',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.label}</span>
                  {col.sortable && (
                    sortColumn === col.key ? (
                      sortDirection === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5 text-action-primary" />
                        : <ChevronDown className="w-3.5 h-3.5 text-action-primary" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-content-tertiary" />
                    )
                  )}
                </div>
              </th>
            ))}
            {actions?.length ? (
              <th className="px-4 py-3 text-center text-xs font-semibold text-content-secondary uppercase tracking-wider w-24">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody className="bg-surface-raised divide-y divide-stroke-subtle">
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-content-secondary">
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-content-tertiary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'transition-colors',
                  hover && 'hover:bg-action-secondary',
                  variant === 'striped' && rowIndex % 2 === 1 && 'bg-surface-sunken',
                  selectedRows.has(rowIndex) && 'bg-action-primary-subtle',
                  variant === 'compact' && 'text-sm',
                )}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                      className="w-4 h-4 rounded border-stroke-default accent-action-primary"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 text-sm text-content-primary',
                      variant === 'compact' ? 'py-2' : 'py-3',
                      variant === 'bordered' && 'border-x border-stroke-subtle',
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                  </td>
                ))}
                {actions?.length ? (
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setExpandedActions(expandedActions === rowIndex ? null : rowIndex)}
                        className="p-1 hover:bg-action-secondary rounded transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-content-secondary" />
                      </button>
                      {expandedActions === rowIndex && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setExpandedActions(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-surface-overlay border border-stroke-default rounded shadow-lg z-20 py-1">
                            {actions.map((action, ai) => (
                              <button
                                key={ai}
                                onClick={() => { action.onClick(row); setExpandedActions(null); }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors',
                                  actionVariantClass[action.variant ?? 'default'],
                                )}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'completed' | 'success' | 'warning' | 'error' | 'info';
}) {
  const variantClasses = {
    default:   'bg-hv-neutral-700 text-hv-neutral-0',
    completed: 'bg-hv-neutral-900 text-hv-neutral-0',
    success:   'bg-surface-feedback-success text-content-feedback-success',
    warning:   'bg-surface-feedback-warning text-content-feedback-warning',
    error:     'bg-surface-feedback-error text-content-feedback-error',
    info:      'bg-surface-feedback-info text-content-feedback-info',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantClasses[variant])}>
      {children}
    </span>
  );
}
