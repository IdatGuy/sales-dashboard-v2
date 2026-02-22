import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { priceSheetService, PriceSheetRowWithNames } from '../services/api/priceSheet';
import { useAuth } from '../context/AuthContext';

const PriceSheetPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<PriceSheetRowWithNames[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const data = await priceSheetService.getPriceSheetsWithNames();
      setRows(data);
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Price Sheet</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Active</th>
                  </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">No price sheet rows found</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{r.device_name ?? r.device_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{r.service_name ?? r.service_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">${r.price}</td>
                      <td className="px-6 py-3 text-sm">{r.is_active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PriceSheetPage;

