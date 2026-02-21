import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import StoreSelector from '../components/common/StoreSelector';
import OrderList from '../components/documents/OrderList';
import CreateOrderModal from '../components/documents/CreateOrderModal';
import { ordersService, Order } from '../services/api/orders';
import { useDashboard } from '../context/DashboardContext';
import { Plus, Trash2, Edit3 } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStore, availableStores } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('need to order');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await ordersService.getOrders(selectedStore?.id);
        setOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedStore]);

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setIsModalOpen(false);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) return;

    try {
      for (const orderId of selectedOrderIds) {
        await ordersService.updateOrder(orderId, { status: newStatus });
      }
      setOrders((prev) =>
        prev.map((order) =>
          selectedOrderIds.includes(order.id) ? { ...order, status: newStatus } : order
        )
      );
      setSelectedOrderIds([]);
      setIsStatusModalOpen(false);
      setNewStatus('need to order');
    } catch (error) {
      console.error('Error updating orders:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0 || !window.confirm(`Delete ${selectedOrderIds.length} order(s)?`)) return;

    setIsDeleting(true);
    try {
      for (const orderId of selectedOrderIds) {
        await ordersService.deleteOrder(orderId);
      }
      setOrders((prev) => prev.filter((order) => !selectedOrderIds.includes(order.id)));
      setSelectedOrderIds([]);
    } catch (error) {
      console.error('Error deleting orders:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
              Work Orders & Parts Management
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <StoreSelector />
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus size={20} className="mr-2" />
                Create Order
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedStore ? `Orders - ${selectedStore.name}` : 'All Orders'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {orders.filter((o) => statusFilter === 'all' || o.status === statusFilter).length} order{orders.filter((o) => statusFilter === 'all' || o.status === statusFilter).length !== 1 ? 's' : ''} found
                    {selectedOrderIds.length > 0 && ` • ${selectedOrderIds.length} selected`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="need to order">Need to Order</option>
                    <option value="ordered">Ordered</option>
                    <option value="arrived">Arrived</option>
                    <option value="installed">Installed</option>
                    <option value="completed">Completed</option>
                  </select>
                  {selectedOrderIds.length > 0 && (
                    <>
                      <button
                        onClick={() => setIsStatusModalOpen(true)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm gap-2"
                      >
                        <Edit3 size={16} />
                        Change Status
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="flex items-center justify-center px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 transition-colors font-medium text-sm gap-2"
                      >
                        <Trash2 size={16} />
                        Delete ({selectedOrderIds.length})
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <OrderList
              orders={orders.filter((o) => statusFilter === 'all' || o.status === statusFilter)}
              isLoading={isLoading}
              selectedOrderIds={selectedOrderIds}
              onSelectionChange={setSelectedOrderIds}
            />
          </div>
        </div>
      </main>

      {/* Status Change Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
              onClick={() => setIsStatusModalOpen(false)}
            ></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Change Status for {selectedOrderIds.length} Order{selectedOrderIds.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-3">
                  {(['need to order', 'ordered', 'arrived', 'installed', 'completed'] as const).map((status) => (
                    <label key={status} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={newStatus === status}
                        onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={handleBulkStatusUpdate}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderCreated}
        availableStores={availableStores}
        technicianName={currentUser.name}
      />
    </div>
  );
};

export default OrdersPage;
