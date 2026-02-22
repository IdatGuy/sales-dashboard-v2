import React, { useState, useEffect } from 'react';
import { Order } from '../../services/api/orders';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  selectedOrderIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading = false,
  selectedOrderIds,
  onSelectionChange,
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedOrderIds.length === localOrders.length && localOrders.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 cursor-pointer"
              />
            </th>
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
              Notes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Technician
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Check-in Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ETA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Home Connect
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {localOrders.map((order) => (
            <tr 
              key={order.id} 
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
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
              <td className="px-6 py-4 text-sm max-w-xs truncate text-gray-700 dark:text-gray-300">
                {order.notes ? (
                  <span className="block truncate max-w-[18rem]">{order.notes}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {order.technician}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatDate(order.check_in_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatDate(order.part_eta)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {order.home_connect ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
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
