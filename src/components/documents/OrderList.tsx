import React, { useState, useEffect } from 'react';
import { Order } from '../../services/api/orders';
import OrderActionMenu from './OrderActionMenu';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  onOrderDeleted?: (orderId: number) => void;
  onOrderUpdated?: (orderId: number, updatedOrder: Partial<Order>) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading = false,
  onOrderDeleted,
  onOrderUpdated,
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'need to order':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ordered':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'arrived':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'installed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
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

  const handleOrderDeleted = (orderId: number) => {
    const updatedOrders = localOrders.filter((o) => o.id !== orderId);
    setLocalOrders(updatedOrders);
    onOrderDeleted?.(orderId);
  };

  const handleStatusUpdate = (orderId: number, newStatus: Order['status']) => {
    const updatedOrders = localOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setLocalOrders(updatedOrders);
    onOrderUpdated?.(orderId, { status: newStatus });
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Check-in Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ETA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Home Connect
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {localOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a
                  href={order.wo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 underline"
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
                >
                  {order.part_description}
                </a>
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
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <OrderActionMenu
                  order={order}
                  onDelete={handleOrderDeleted}
                  onStatusUpdate={handleStatusUpdate}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
