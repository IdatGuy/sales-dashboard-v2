import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import StoreSelector from '../components/common/StoreSelector';
import OrderList from '../components/orders/OrderList';
import CreateOrderModal from '../components/orders/CreateOrderModal';
import { ordersService, Order, can_transition, UserRole } from '../services/api/orders';
import { ALL_STATUSES, TERMINAL_STATUSES, getTransitionWarning } from '../lib/orderStatusConfig';
import { useDashboard } from '../context/DashboardContext';
import { Plus, Grid2x2, X, Search, AlertTriangle } from 'lucide-react';

const FALLBACK_STATUSES: Order['status'][] = ALL_STATUSES;
const defaultActiveStatuses = (all: Order['status'][]) => all.filter(s => !TERMINAL_STATUSES.has(s));
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStore, availableStores } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySource, setCopySource] = useState<Order | null>(null);
  const [statusFilters, setStatusFilters] = useState<Order['status'][]>(defaultActiveStatuses(FALLBACK_STATUSES));
  const [availableStatuses, setAvailableStatuses] = useState<Order['status'][]>(FALLBACK_STATUSES);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const statusButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [statusMenuStyle, setStatusMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  // Single-order status modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order['status']>('need to order');
  const [partEta, setPartEta] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [returnRequiredReason, setReturnRequiredReason] = useState('');
  const [depotPartLink, setDepotPartLink] = useState('');
  const [depotPartDescription, setDepotPartDescription] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userRole = (currentUser?.role ?? 'employee') as UserRole;
  const isDepotUser = currentUser?.hasDepotAccess ?? false;
  const userAssignedStoreIds = new Set(currentUser?.userStoreAccess?.map((a) => a.storeId) ?? []);
  const createOrderStores = availableStores.filter((s) => userAssignedStoreIds.has(s.id));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [viewAllStores, setViewAllStores] = useState(false);
  const [depotViewStoreId, setDepotViewStoreId] = useState<string | null>(null);
  const [depotStoreIds, setDepotStoreIds] = useState<string[]>([]);
  const depotStores = availableStores.filter(s => depotStoreIds.includes(s.id));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 75 | 100>(25);
  const [totalOrders, setTotalOrders] = useState(0);

  // Debounce search term
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  // Fetch store IDs that have depot orders (depot users only)
  useEffect(() => {
    if (!isDepotUser) return;
    ordersService.getStoresWithDepotOrders().then(setDepotStoreIds);
  }, [isDepotUser]);

  // Clear depot view when selected store changes
  useEffect(() => {
    setDepotViewStoreId(null);
  }, [selectedStore]);

  // Reset to page 1 when anything other than page itself changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStore, viewAllStores, depotViewStoreId, currentUser, statusFilters, pageSize, debouncedSearchTerm]);

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
          result = await ordersService.getOrders(undefined, storeIds, statusFilters, currentPage, pageSize, debouncedSearchTerm, isDepotUser);
        } else if (depotViewStoreId) {
          result = await ordersService.getOrders(undefined, undefined, statusFilters, currentPage, pageSize, debouncedSearchTerm, false, depotViewStoreId);
        } else {
          result = await ordersService.getOrders(selectedStore?.id, undefined, statusFilters, currentPage, pageSize, debouncedSearchTerm);
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
  }, [selectedStore, viewAllStores, depotViewStoreId, currentUser, statusFilters, currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    let aborted = false;
    const fetchStatuses = async () => {
      setStatusesLoading(true);
      try {
        let fetched: Order['status'][];
        if (viewAllStores && currentUser?.userStoreAccess) {
          const storeIds = currentUser.userStoreAccess.map(a => a.storeId);
          fetched = await ordersService.getDistinctStatuses(undefined, storeIds, isDepotUser);
        } else if (depotViewStoreId) {
          fetched = await ordersService.getDistinctStatuses(undefined, undefined, false, depotViewStoreId);
        } else {
          fetched = await ordersService.getDistinctStatuses(selectedStore?.id);
        }
        if (!aborted) {
          const merged = Array.from(new Set([...fetched, ...FALLBACK_STATUSES])) as Order['status'][];
          setAvailableStatuses(merged);
          setStatusFilters(prev => {
            const initDefault = defaultActiveStatuses(FALLBACK_STATUSES);
            const isStillDefault = prev.length === initDefault.length && prev.every(s => initDefault.includes(s));
            return isStillDefault ? defaultActiveStatuses(merged) : prev;
          });
        }
      } catch { /* fallback already in place */ }
      finally { if (!aborted) setStatusesLoading(false); }
    };
    fetchStatuses();
    return () => { aborted = true; };
  }, [selectedStore, viewAllStores, depotViewStoreId, currentUser]);

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setIsModalOpen(false);
    setCopySource(null);
  };

  const handleCopyOrder = (order: Order) => {
    setCopySource(order);
    setIsModalOpen(true);
  };

  const handleEtaChange = async (order: Order, newEta: string) => {
    const updates: Partial<Order> =
      order.status === 'need to order'
        ? { status: 'ordered', part_eta: newEta }
        : { part_eta: newEta };
    try {
      await ordersService.updateOrder(order.id, updates);
      setOrders(prev =>
        prev
          .map(o => o.id === order.id ? { ...o, ...updates } : o)
          .filter(o => statusFilters.includes(o.status))
      );
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to update ETA.');
      setShowErrorNotification(true);
    }
  };

  const handleStatusClick = (order: Order) => {
    setActiveOrder(order);
    setNewStatus(order.status);
    setPartEta('');
    setCancellationReason('');
    setReturnRequiredReason('');
    setReasonError('');
  };

  const closeStatusModal = () => {
    setActiveOrder(null);
    setNewStatus('need to order');
    setPartEta('');
    setCancellationReason('');
    setReturnRequiredReason('');
    setDepotPartLink('');
    setDepotPartDescription('');
    setReasonError('');
  };

  const handleStatusUpdate = async () => {
    if (!activeOrder) return;
    if (newStatus === activeOrder.status) {
      closeStatusModal();
      return;
    }

    if (newStatus === 'return required') {
      if (!returnRequiredReason.trim()) {
        setReasonError('Please provide a reason for return required.');
        return;
      }
      setIsUpdating(true);
      try {
        await ordersService.updateOrder(activeOrder.id, { status: 'return required', return_required_reason: returnRequiredReason.trim() });
        setOrders(prev =>
          prev
            .map(o => o.id === activeOrder.id
              ? { ...o, status: 'return required' as const, return_required_reason: returnRequiredReason.trim() }
              : o
            )
            .filter(o => statusFilters.includes(o.status))
        );
        closeStatusModal();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'Failed to update order.');
        setShowErrorNotification(true);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (newStatus === 'cancelled') {
      if (!cancellationReason.trim()) {
        setReasonError('Please provide a cancellation reason.');
        return;
      }
      setIsUpdating(true);
      try {
        await ordersService.cancelOrder(activeOrder.id, cancellationReason.trim());
        setOrders(prev =>
          prev
            .map(o => o.id === activeOrder.id
              ? { ...o, status: 'cancelled' as const, cancellation_reason: cancellationReason.trim() }
              : o
            )
            .filter(o => statusFilters.includes(o.status))
        );
        closeStatusModal();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'Failed to cancel order.');
        setShowErrorNotification(true);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (newStatus === 'need to order' && activeOrder.is_depot_repair) {
      const needsPartLink = !activeOrder.part_link && !depotPartLink.trim();
      const needsPartDesc = !activeOrder.part_description && !depotPartDescription.trim();
      if (needsPartLink || needsPartDesc) {
        setReasonError('Part link and description are required before advancing to Need to Order.');
        return;
      }
      setIsUpdating(true);
      try {
        await ordersService.updateOrder(activeOrder.id, {
          status: 'need to order',
          part_link: depotPartLink.trim() || activeOrder.part_link,
          part_description: depotPartDescription.trim() || activeOrder.part_description,
        });
        setOrders(prev =>
          prev
            .map(o => o.id === activeOrder.id
              ? { ...o, status: 'need to order' as const, part_link: depotPartLink.trim() || activeOrder.part_link, part_description: depotPartDescription.trim() || activeOrder.part_description }
              : o
            )
            .filter(o => statusFilters.includes(o.status))
        );
        closeStatusModal();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'Failed to update order.');
        setShowErrorNotification(true);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    const etaUpdate = newStatus === 'ordered' && partEta ? { part_eta: partEta } : {};
    setIsUpdating(true);
    try {
      await ordersService.updateOrder(activeOrder.id, { status: newStatus, ...etaUpdate });
      setOrders(prev =>
        prev
          .map(o => o.id === activeOrder.id ? { ...o, status: newStatus, ...etaUpdate } : o)
          .filter(o => statusFilters.includes(o.status))
      );
      closeStatusModal();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to update order.');
      setShowErrorNotification(true);
    } finally {
      setIsUpdating(false);
    }
  };

  // Computed values for filter button
  const hiddenTerminalCount = Array.from(TERMINAL_STATUSES).filter(s => !statusFilters.includes(s as Order['status'])).length;
  const filterLabel =
    statusFilters.length === availableStatuses.length
      ? 'All'
      : statusFilters.length === 0
      ? 'None'
      : `${statusFilters.length} of ${availableStatuses.length}`;

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

  // Valid statuses for the active order's modal
  const activeOrderValidStatuses = activeOrder
    ? ALL_STATUSES.filter(s => s === activeOrder.status || can_transition(activeOrder, s, userRole, isDepotUser).allowed)
    : [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="w-full mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
              Work Orders & Parts Management{' '}
              {viewAllStores
                ? '(All Stores)'
                : depotViewStoreId
                ? `(${availableStores.find(s => s.id === depotViewStoreId)?.name ?? ''} — Depot)`
                : ''}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {!viewAllStores && (
                <StoreSelector
                  depotStores={isDepotUser ? depotStores : []}
                  selectedDepotStoreId={depotViewStoreId}
                  onDepotStoreSelect={(store) => setDepotViewStoreId(store?.id ?? null)}
                />
              )}
              <button
                onClick={() => { setViewAllStores(!viewAllStores); setDepotViewStoreId(null); }}
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
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
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
                    {viewAllStores
                      ? 'All Orders'
                      : depotViewStoreId
                      ? `Depot Orders — ${availableStores.find(s => s.id === depotViewStoreId)?.name ?? ''}`
                      : selectedStore ? `Orders - ${selectedStore.name}` : 'All Orders'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {totalOrders} order{totalOrders !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      className="block w-full sm:w-72 pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600
                                 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                 placeholder-gray-500 dark:placeholder-gray-400 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Search name, phone, or WO #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
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
                        <button onClick={() => setStatusFilters([...availableStatuses])} className="underline">Check All</button>
                        <button onClick={() => setStatusFilters(defaultActiveStatuses(availableStatuses))} className="underline">Reset</button>
                      </div>
                      {statusesLoading ? (
                        <div className="px-2 py-2 text-sm text-gray-400">Loading statuses…</div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {availableStatuses.map((s) => (
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
                              {TERMINAL_STATUSES.has(s) && (
                                <span className="ml-auto text-xs text-gray-400">terminal</span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <OrderList
              orders={orders}
              isLoading={isLoading}
              onStatusClick={handleStatusClick}
              showStoreColumn={viewAllStores}
              availableStores={availableStores}
              onCopy={handleCopyOrder}
              onEtaChange={userRole === 'manager' || userRole === 'admin' ? handleEtaChange : undefined}
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
      {activeOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
              onClick={closeStatusModal}
            ></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Edit Order Status
                  </h3>
                  <button
                    onClick={closeStatusModal}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  WO #{activeOrder.wo_number} – {activeOrder.cx_name}
                </p>
                <div className="space-y-3">
                  {activeOrderValidStatuses.map((status) => (
                    <label
                      key={status}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={newStatus === status}
                        onChange={(e) => {
                          setNewStatus(e.target.value as Order['status']);
                          setPartEta('');
                          setCancellationReason('');
                          setReturnRequiredReason('');
                          setReasonError('');
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {status}
                      </span>
                    </label>
                  ))}

                  {activeOrder && (() => {
                    const warning = getTransitionWarning(activeOrder.status, newStatus);
                    return warning ? (
                      <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-md flex gap-2 items-start">
                        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">{warning}</p>
                      </div>
                    ) : null;
                  })()}

                  {newStatus === 'need to order' && activeOrder?.is_depot_repair && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
                      {!activeOrder.part_link && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Part Link <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={depotPartLink}
                            onChange={(e) => { setDepotPartLink(e.target.value); setReasonError(''); }}
                            placeholder="https://"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                      {!activeOrder.part_description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Part Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={depotPartDescription}
                            onChange={(e) => { setDepotPartDescription(e.target.value); setReasonError(''); }}
                            rows={2}
                            placeholder="Required"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                      {reasonError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{reasonError}</p>
                      )}
                    </div>
                  )}

                  {newStatus === 'return required' && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Return Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={returnRequiredReason}
                        onChange={(e) => { setReturnRequiredReason(e.target.value); setReasonError(''); }}
                        rows={3}
                        placeholder="Required"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {reasonError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{reasonError}</p>
                      )}
                    </div>
                  )}

                  {newStatus === 'ordered' && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Part ETA <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={partEta}
                        onChange={(e) => setPartEta(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {newStatus === 'cancelled' && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cancellation Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => { setCancellationReason(e.target.value); setReasonError(''); }}
                        rows={3}
                        placeholder="Required"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {reasonError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{reasonError}</p>
                      )}
                    </div>
                  )}
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
                  onClick={closeStatusModal}
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

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCopySource(null); }}
        onSuccess={handleOrderCreated}
        availableStores={createOrderStores}
        technicianName={currentUser.name}
        initialData={copySource ?? undefined}
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
