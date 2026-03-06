import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Info, Copy } from 'lucide-react';
import { Order } from '../../services/api/orders';
import { getStatusColor, TERMINAL_STATUSES } from '../../lib/orderStatusConfig';
import { Store } from '../../types';
import { parseDateString } from '../../lib/dateUtils';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  onStatusClick: (order: Order) => void;
  showStoreColumn?: boolean;
  availableStores?: Store[];
  onCopy?: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading = false,
  onStatusClick,
  showStoreColumn = false,
  availableStores = [],
  onCopy,
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [sortColumn, setSortColumn] = useState<'check_in_date' | 'order_date' | 'part_eta' | 'store_id' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sync local state with prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleSortClick = (column: 'check_in_date' | 'order_date' | 'part_eta' | 'store_id') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getStoreName = (storeId: string): string => {
    return availableStores.find((store) => store.id === storeId)?.name || storeId;
  };

  const getSortedOrders = () => {
    if (!sortColumn) return localOrders;

    if (sortColumn === 'store_id') {
      return [...localOrders].sort((a, b) => {
        const nameA = getStoreName(a.store_id).toLowerCase();
        const nameB = getStoreName(b.store_id).toLowerCase();
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    return [...localOrders].sort((a, b) => {
      const dateA = a[sortColumn] ? parseDateString(a[sortColumn]!).getTime() : 0;
      const dateB = b[sortColumn] ? parseDateString(b[sortColumn]!).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const getSortIcon = (column: 'check_in_date' | 'order_date' | 'part_eta' | 'store_id') => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline ml-1" size={16} />
    ) : (
      <ChevronDown className="inline ml-1" size={16} />
    );
  };

  const getHeaderClass = (column: 'check_in_date' | 'order_date' | 'part_eta' | 'store_id') => {
    const baseClass = "px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/60 select-none";
    return sortColumn === column ? baseClass + " bg-gray-100 dark:bg-gray-600/60" : baseClass;
  };

  const displayOrders = getSortedOrders();

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return parseDateString(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDateColor = (dateString: string | null): React.CSSProperties | undefined => {
    if (!dateString) return undefined;

    const date = parseDateString(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Green (16, 185, 129) to Red (239, 68, 68) over 28 days
    let r, g, b;

    if (daysAgo <= 0) {
      r = 16;
      g = 185;
      b = 129;
    } else if (daysAgo >= 28) {
      r = 239;
      g = 68;
      b = 68;
    } else {
      const ratio = daysAgo / 28;
      r = Math.round(16 + (239 - 16) * ratio);
      g = Math.round(185 + (68 - 185) * ratio);
      b = Math.round(129 + (68 - 129) * ratio);
    }

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
      color: `rgb(${r}, ${g}, ${b})`,
      fontWeight: '500',
      padding: '0.5rem',
      borderRadius: '0.375rem',
    };
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/60">
          <tr>
            {showStoreColumn && (
              <th className={getHeaderClass('store_id')} onClick={() => handleSortClick('store_id')}>
                Store {getSortIcon('store_id')}
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              WO #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Part
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Technician
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className={getHeaderClass('check_in_date')} onClick={() => handleSortClick('check_in_date')}>
              Check-in Date {getSortIcon('check_in_date')}
            </th>
            <th className={getHeaderClass('order_date')} onClick={() => handleSortClick('order_date')}>
              Order Date {getSortIcon('order_date')}
            </th>
            <th className={getHeaderClass('part_eta')} onClick={() => handleSortClick('part_eta')}>
              ETA {getSortIcon('part_eta')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Home Connect
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Notes
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {displayOrders.map((order) => {
            const isTerminal = TERMINAL_STATUSES.has(order.status);
            return (
              <tr
                key={order.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {showStoreColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    {getStoreName(order.store_id)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a
                    href={order.wo_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.wo_number}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{order.cx_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{order.cx_phone}</div>
                </td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">
                  <a
                    href={order.part_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.part_description}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {order.technician}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={() => !isTerminal && onStatusClick(order)}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)} ${
                        !isTerminal ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''
                      }`}
                      title={isTerminal ? undefined : 'Click to change status'}
                    >
                      {order.status}
                    </span>
                    {order.status === 'cancelled' && order.cancellation_reason && (
                      <span title={order.cancellation_reason} className="cursor-help inline-flex">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span style={getDateColor(order.check_in_date)}>
                    {formatDate(order.check_in_date)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span style={getDateColor(order.order_date)}>
                    {formatDate(order.order_date)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span style={getDateColor(order.part_eta)}>
                    {formatDate(order.part_eta)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.home_connect ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm max-w-xs truncate text-gray-700 dark:text-gray-300">
                  {order.notes ? (
                    <span className="block truncate max-w-[18rem]" title={order.notes}>{order.notes}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {onCopy && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCopy(order); }}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                      title="Copy order"
                    >
                      <Copy size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
