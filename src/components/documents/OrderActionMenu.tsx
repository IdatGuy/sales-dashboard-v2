import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { Order, ordersService } from '../../services/api/orders';

interface OrderActionMenuProps {
  order: Order;
  onDelete: (orderId: number) => void;
  onStatusUpdate: (orderId: number, newStatus: Order['status']) => void;
}

const OrderActionMenu: React.FC<OrderActionMenuProps> = ({
  order,
  onDelete,
  onStatusUpdate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusOptions: Order['status'][] = ['need to order', 'ordered', 'received', 'out of stock', 'distro', 'wrong part', 'repaired'];
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await ordersService.deleteOrder(order.id);
      if (success) {
        onDelete(order.id);
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) {
      setIsStatusModalOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await ordersService.updateOrder(order.id, {
        status: selectedStatus,
      });
      if (updated) {
        onStatusUpdate(order.id, selectedStatus);
        setIsStatusModalOpen(false);
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditStatusClick = () => {
    setSelectedStatus(order.status);
    setIsStatusModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Actions"
        >
          <MoreVertical size={18} />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600 flex flex-col">
            <button
              onClick={handleEditStatusClick}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors first:rounded-t-md text-sm"
            >
              Edit Status
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="block w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors last:rounded-b-md text-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </button>
          </div>
        )}
      </div>

      {/* Status Edit Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
              onClick={() => setIsStatusModalOpen(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Edit Order Status
                  </h3>
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:p-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    WO #{order.wo_number} - {order.cx_name}
                  </p>

                  {statusOptions.map((status) => (
                    <label
                      key={status}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={selectedStatus === status}
                        onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400 transition-colors font-medium text-sm"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderActionMenu;
