import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import StoreSelector from '../components/common/StoreSelector';
import OrderList from '../components/documents/OrderList';
import CreateOrderModal from '../components/documents/CreateOrderModal';
import { ordersService, Order } from '../services/api/orders';
import { useDashboard } from '../context/DashboardContext';
import { Plus } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStore, availableStores } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOrderDeleted = (orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const handleOrderUpdated = (orderId: number, updatedOrder: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, ...updatedOrder } : order
      )
    );
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedStore ? `Orders - ${selectedStore.name}` : 'All Orders'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {orders.length} order{orders.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <OrderList
              orders={orders}
              isLoading={isLoading}
              onOrderDeleted={handleOrderDeleted}
              onOrderUpdated={handleOrderUpdated}
            />
          </div>
        </div>
      </main>

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
