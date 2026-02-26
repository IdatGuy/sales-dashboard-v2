import React, { useEffect, useState, useRef } from 'react';
import { Search, Calculator, Plus, Pencil } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { priceSheetService, PriceSheetRowWithNames } from '../services/api/priceSheet';
import { useAuth } from '../context/AuthContext';
import PriceCalculatorModal from '../components/priceSheet/PriceCalculatorModal';
import ManagePriceModal from '../components/priceSheet/ManagePriceModal';

const PriceSheetPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [rows, setRows] = useState<PriceSheetRowWithNames[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingRow, setEditingRow] = useState<PriceSheetRowWithNames | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canManage = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Debounce: commit the search term 350ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Fetch: runs only after the debounced term changes
  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      const data = await priceSheetService.searchPriceSheets(debouncedTerm);
      if (!cancelled) {
        setRows(data);
        setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedTerm]);

  const handleManageSuccess = () => {
    if (debouncedTerm.trim()) {
      priceSheetService.searchPriceSheets(debouncedTerm).then(setRows);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Price Sheet</h1>
            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={() => { setEditingRow(null); setShowManageModal(true); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                             bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <Plus size={16} />
                  Manage Prices
                </button>
              )}
              <button
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                           bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <Calculator size={16} />
                Price Calculator
              </button>
            </div>
          </div>

          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              autoFocus
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700
                         rounded-md leading-5 bg-white dark:bg-gray-800
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500
                         focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
              placeholder="Search by device or service name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {debouncedTerm.trim() && !isLoading && rows.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {rows.length} result{rows.length !== 1 ? 's' : ''}
              {rows.length === 50 && ' (showing first 50 — refine your search)'}
            </p>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  {canManage && <th className="px-6 py-3 w-10" />}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-sm">Searching...</span>
                      </div>
                    </td>
                  </tr>
                ) : !debouncedTerm.trim() ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Search size={32} />
                        <p className="text-sm">Type a device or service name to search</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No results for "<span className="font-medium">{debouncedTerm}</span>"
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={canManage ? () => { setEditingRow(r); setShowManageModal(true); } : undefined}
                      className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors${canManage ? ' cursor-pointer' : ''}`}
                    >
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{r.device_name ?? r.device_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{r.service_name ?? r.service_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{r.price == null ? 'N/A' : `$${r.price}`}</td>
                      {canManage && (
                        <td className="px-3 py-3 text-right">
                          <Pencil size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCalculator && (
        <PriceCalculatorModal onClose={() => setShowCalculator(false)} />
      )}

      {showManageModal && (
        <ManagePriceModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          onSuccess={handleManageSuccess}
          editRow={editingRow}
        />
      )}
    </div>
  );
};

export default PriceSheetPage;
