import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import StoreSelector from '../components/common/StoreSelector';
import OrderList from '../components/documents/OrderList';
import CreateOrderModal from '../components/documents/CreateOrderModal';
import CancelOrderModal from '../components/documents/CancelOrderModal';
import { ordersService, Order, can_transition, UserRole } from '../services/api/orders';
import { useDashboard } from '../context/DashboardContext';
import { Plus, Trash2, Edit3, Grid2x2, Ban } from 'lucide-react';

const statusOptions = [
  'need to order',
  'ordered',
  'received',
  'out of stock',
  'completed',
  'cancelled',
] as const;
type Status = typeof statusOptions[number];

const TERMINAL_STATUSES: Status[] = ['completed', 'cancelled'];
const DEFAULT_STATUSES: Status[] = ['need to order', 'ordered', 'received', 'out of stock'];
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStore, availableStores } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Status[]>(DEFAULT_STATUSES);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const statusButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [statusMenuStyle, setStatusMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('need to order');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const userRole = (currentUser?.role ?? 'employee') as UserRole;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [viewAllStores, setViewAllStores] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 75 | 100>(25);
  const [totalOrders, setTotalOrders] = useState(0);

  // Reset to page 1 when anything other than page itself changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStore, viewAllStores, currentUser, statusFilters, pageSize]);

  useEffect(() => {
    if (statusFilters.length === 0) {
      setOrders([]);
      setTotalOrders(0);
      return;
    }

    let aborted = false;
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        let result: { orders: Order[]; total: number };
        if (viewAllStores && currentUser?.userStoreAccess) {
          const storeIds = currentUser.userStoreAccess.map((access) => access.storeId);
          result = await ordersService.getOrders(undefined, storeIds, statusFilters, currentPage, pageSize);
        } else {
          result = await ordersService.getOrders(selectedStore?.id, undefined, statusFilters, currentPage, pageSize);
        }
        if (!aborted) {
          setOrders(result.orders);
          setTotalOrders(result.total);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        if (!aborted) {
          setOrders([]);
          setTotalOrders(0);
        }
      } finally {
        if (!aborted) setIsLoading(false);
      }
    };

    fetchOrders();
    return () => { aborted = true; };
  }, [selectedStore, viewAllStores, currentUser, statusFilters, currentPage, pageSize]);

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setIsModalOpen(false);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) return;

    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    const valid: Order[] = [];
    const invalidReasons: string[] = [];

    for (const order of selectedOrders) {
      const check = can_transition(order, newStatus, userRole);
      if (check.allowed) {
        valid.push(order);
      } else {
        invalidReasons.push(check.reason ?? 'Invalid transition.');
      }
    }

    let successCount = 0;
    const errors: string[] = [...invalidReasons];

    for (const order of valid) {
      try {
        await ordersService.updateOrder(order.id, { status: newStatus });
        successCount++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Update failed.');
      }
    }

    setOrders((prev) =>
      prev
        .map((o) => (valid.find((v) => v.id === o.id) ? { ...o, status: newStatus } : o))
        .filter((o) => statusFilters.includes(o.status as Status))
    );
    setSelectedOrderIds([]);
    setIsStatusModalOpen(false);
    setNewStatus('need to order');

    if (errors.length > 0) {
      setErrorMessage(
        `${successCount} order(s) updated, ${errors.length} skipped.\n` +
          [...new Set(errors)].join('\n')
      );
      setShowErrorNotification(true);
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
      const message = error instanceof Error ? error.message : 'Failed to delete orders';
      setErrorMessage(message);
      setShowErrorNotification(true);
      console.error('Error deleting orders:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkCancel = async (reason: string) => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    const valid: Order[] = [];
    const invalidReasons: string[] = [];

    for (const order of selectedOrders) {
      const check = can_transition(order, 'cancelled', userRole);
      if (check.allowed) {
        valid.push(order);
      } else {
        invalidReasons.push(check.reason ?? 'Invalid transition.');
      }
    }

    let successCount = 0;
    const errors: string[] = [...invalidReasons];

    for (const order of valid) {
      try {
        await ordersService.cancelOrder(order.id, reason);
        successCount++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Cancel failed.');
      }
    }

    setOrders((prev) =>
      prev
        .map((o) =>
          valid.find((v) => v.id === o.id)
            ? { ...o, status: 'cancelled' as const, cancellation_reason: reason }
            : o
        )
        .filter((o) => statusFilters.includes(o.status as Status))
    );
    setSelectedOrderIds([]);
    setIsCancelModalOpen(false);

    if (errors.length > 0) {
      setErrorMessage(
        `${successCount} order(s) cancelled, ${errors.length} skipped.\n` +
          [...new Set(errors)].join('\n')
      );
      setShowErrorNotification(true);
    }
  };

  // Computed values for filter button
  const hiddenTerminalCount = TERMINAL_STATUSES.filter((s) => !statusFilters.includes(s)).length;
  const filterLabel =
    statusFilters.length === statusOptions.length
      ? 'All'
      : statusFilters.length === 0
      ? 'None'
      : `${statusFilters.length} of ${statusOptions.length}`;

  const totalPages = Math.ceil(totalOrders / pageSize);

  // Position the status menu when opened and close on outside click
  useEffect(() => {
    const updateMenuPosition = () => {
      const btn = statusButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuWidth = 256; // matches w-64
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
      const top = rect.bottom + 8;
      setStatusMenuStyle({ top, left, width: menuWidth });
    };

    const handleOutside = (e: MouseEvent) => {
      const menu = statusMenuRef.current;
      const btn = statusButtonRef.current;
      if (!menu || !btn) return;
      if (!(menu.contains(e.target as Node) || btn.contains(e.target as Node))) {
        setIsStatusFilterOpen(false);
      }
    };

    if (isStatusFilterOpen) {
      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);
      document.addEventListener('mousedown', handleOutside);
      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition, true);
        document.removeEventListener('mousedown', handleOutside);
      };
    }
  }, [isStatusFilterOpen, statusButtonRef, statusMenuRef]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="w-full mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
              Work Orders & Parts Management {viewAllStores && '(All Stores)'}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {!viewAllStores && <StoreSelector />}
              <button
                onClick={() => setViewAllStores(!viewAllStores)}
                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors font-medium ${
                  viewAllStores
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={viewAllStores ? 'View single store' : 'View all stores'}
              >
                <Grid2x2 size={20} className="mr-2" />
                {viewAllStores ? 'All Stores' : 'Single Store'}
              </button>
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
                      {viewAllStores ? 'All Orders' : selectedStore ? `Orders - ${selectedStore.name}` : 'All Orders'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {totalOrders} order{totalOrders !== 1 ? 's' : ''} found
                      {selectedOrderIds.length > 0 && ` • ${selectedOrderIds.length} selected`}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center relative">
                    <button
                      ref={statusButtonRef}
                      onClick={() => setIsStatusFilterOpen((s) => !s)}
                      className="relative px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none flex items-center gap-2"
                      title={hiddenTerminalCount > 0 ? 'Completed and cancelled orders are hidden' : 'Filter by status'}
                    >
                      Status
                      <span className="text-sm text-gray-500">{filterLabel}</span>
                      {hiddenTerminalCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                      )}
                    </button>

                    {isStatusFilterOpen && (
                      <div
                        ref={statusMenuRef}
                        style={
                          statusMenuStyle
                            ? { position: 'fixed', top: statusMenuStyle.top, left: statusMenuStyle.left, width: statusMenuStyle.width }
                            : { position: 'fixed' }
                        }
                        className="bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 p-2 max-h-64 overflow-auto"
                      >
                        <div className="flex justify-between items-center px-2 py-1 text-sm text-primary-600">
                          <button onClick={() => setStatusFilters(statusOptions.slice() as Status[])} className="underline">Check All</button>
                          <button onClick={() => setStatusFilters(DEFAULT_STATUSES)} className="underline">Reset</button>
                        </div>
                        <div className="mt-2 space-y-1">
                          {statusOptions.map((s) => (
                            <label key={s} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                              <input
                                type="checkbox"
                                checked={statusFilters.includes(s)}
                                onChange={() =>
                                  setStatusFilters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
                                }
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-200">{s}</span>
                              {TERMINAL_STATUSES.includes(s) && (
                                <span className="ml-auto text-xs text-gray-400">terminal</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOrderIds.length > 0 && (
                      <>
                        <button
                          onClick={() => setIsStatusModalOpen(true)}
                          className="flex items-center justify-center px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm gap-2"
                        >
                          <Edit3 size={16} />
                          Change Status
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center justify-center px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 transition-colors font-medium text-sm gap-2"
                          >
                            <Trash2 size={16} />
                            Delete ({selectedOrderIds.length})
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="flex items-center justify-center px-3 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors font-medium text-sm gap-2"
                          >
                            <Ban size={16} />
                            Cancel ({selectedOrderIds.length})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <OrderList
                orders={orders}
                isLoading={isLoading}
                selectedOrderIds={selectedOrderIds}
                onSelectionChange={setSelectedOrderIds}
                showStoreColumn={viewAllStores}
                availableStores={availableStores}
              />

              {/* Footer: rows per page + pagination */}
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value) as 25 | 50 | 75 | 100)}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {totalOrders > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalOrders)} of {totalOrders}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ‹ Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </div>
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
                {(() => {
                  const ACTIVE_STATUSES = ['need to order', 'ordered', 'received', 'out of stock', 'completed'] as const;
                  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
                  const validStatuses = ACTIVE_STATUSES.filter((s) =>
                    selectedOrders.some((o) => can_transition(o, s, userRole).allowed)
                  );
                  return (
                    <div className="space-y-3">
                      {validStatuses.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No valid transitions available for the selected orders.
                        </p>
                      ) : (
                        validStatuses.map((status) => (
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
                        ))
                      )}
                    </div>
                  );
                })()}
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

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        orderCount={selectedOrderIds.length}
        onConfirm={handleBulkCancel}
        onClose={() => setIsCancelModalOpen(false)}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderCreated}
        availableStores={availableStores}
        technicianName={currentUser.name}
      />

      {/* Error Notification Popup */}
      {showErrorNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
              onClick={() => setShowErrorNotification(false)}
            ></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                      <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a4 4 0 110-8 4 4 0 010 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-2">
                      Update Failed
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowErrorNotification(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
