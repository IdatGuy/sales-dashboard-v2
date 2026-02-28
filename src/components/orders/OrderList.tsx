import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Order } from '../../services/api/orders';
import { Store } from '../../types';
import { parseDateString } from '../../lib/dateUtils';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  selectedOrderIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  showStoreColumn?: boolean;
  availableStores?: Store[];
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading = false,
  selectedOrderIds,
  onSelectionChange,
  showStoreColumn = false,
  availableStores = [],
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [sortColumn, setSortColumn] = useState<'check_in_date' | 'order_date' | 'part_eta' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sync local state with prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleSelectOrder = (orderId: number) => {
    if (selectedOrderIds.includes(orderId)) {
      onSelectionChange(selectedOrderIds.filter((id) => id !== orderId));
    } else {
      onSelectionChange([...selectedOrderIds, orderId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === localOrders.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(localOrders.map((order) => order.id));
    }
  };

  const handleSortClick = (column: 'check_in_date' | 'order_date' | 'part_eta') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and reset to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedOrders = () => {
    if (!sortColumn) return localOrders;
    
    const sorted = [...localOrders].sort((a, b) => {
      const dateA = a[sortColumn] ? parseDateString(a[sortColumn]!).getTime() : 0;
      const dateB = b[sortColumn] ? parseDateString(b[sortColumn]!).getTime() : 0;
      
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return sorted;
  };

  const getSortIcon = (column: 'check_in_date' | 'order_date' | 'part_eta') => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline ml-1" size={16} />
    ) : (
      <ChevronDown className="inline ml-1" size={16} />
    );
  };

  const getHeaderClass = (column: 'check_in_date' | 'order_date' | 'part_eta') => {
    const baseClass = "px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/60 select-none";
    return sortColumn === column ? baseClass + " bg-gray-100 dark:bg-gray-600/60" : baseClass;
  };

  const displayOrders = getSortedOrders();

  const getStoreName = (storeId: string): string => {
    return availableStores.find((store) => store.id === storeId)?.name || storeId;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'need to order':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ordered':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'received':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'out of stock':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'distro':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'return required':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

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
      // Future or today: full green
      r = 16;
      g = 185;
      b = 129;
    } else if (daysAgo >= 28) {
      // 4 weeks or more: full red
      r = 239;
      g = 68;
      b = 68;
    } else {
      // Interpolate between green and red
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedOrderIds.length === localOrders.length && localOrders.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 cursor-pointer"
              />
            </th>
            {showStoreColumn && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Store
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
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {displayOrders.map((order) => (
            <tr 
              key={order.id} 
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                selectedOrderIds.includes(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 cursor-pointer"
                />
              </td>
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
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
