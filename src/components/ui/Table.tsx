import { ChevronDown, ChevronUp, MoreHorizontal, Download, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

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
  className = ''
}: TableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedActions, setExpandedActions] = useState<number | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(data.map((_, index) => index));
      setSelectedRows(allIndices);
      onRowSelect?.(data);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  const handleRowSelect = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
    const selectedData = data.filter((_, idx) => newSelected.has(idx));
    onRowSelect?.(selectedData);
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column.key);
    setSortDirection(newDirection);
    onSort?.(column.key, newDirection);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'striped':
        return 'table-striped';
      case 'bordered':
        return 'table-bordered';
      case 'compact':
        return 'table-compact';
      default:
        return '';
    }
  };

  const containerClasses = `overflow-x-auto ${maxHeight ? 'overflow-y-auto' : ''} ${className}`;
  const tableClasses = `min-w-full ${getVariantClasses()}`;

  return (
    <div className={containerClasses} style={{ maxHeight }}>
      <table className={tableClasses}>
        <thead className={`bg-[#F9FAFB] border-b border-gray-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-[indigo-600] border-gray-300 rounded focus:ring-[indigo-600]"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                  column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                } ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="inline-flex flex-col">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 text-[indigo-600]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[indigo-600]" />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-[indigo-600] rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${hover ? 'hover:bg-gray-50' : ''} ${
                  variant === 'striped' && rowIndex % 2 === 1 ? 'bg-gray-50' : ''
                } ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''} transition-colors`}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                      className="w-4 h-4 text-[indigo-600] border-gray-300 rounded focus:ring-[indigo-600]"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm text-gray-900 ${
                      column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                    } ${variant === 'compact' ? 'py-2' : ''}`}
                  >
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setExpandedActions(expandedActions === rowIndex ? null : rowIndex)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                      {expandedActions === rowIndex && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setExpandedActions(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                            {actions.map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={() => {
                                  action.onClick(row);
                                  setExpandedActions(null);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                                  actionIndex === 0 ? 'rounded-t-md' : ''
                                } ${actionIndex === actions.length - 1 ? 'rounded-b-md' : ''} ${
                                  action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' :
                                  action.variant === 'primary' ? 'text-[indigo-600]' : 'text-gray-700'
                                }`}
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
                )}
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
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'completed' | 'success' | 'warning' | 'error' | 'info'
}) {
  const variantClasses = {
    default: 'bg-gray-700 text-white',
    completed: 'bg-gray-900 text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
