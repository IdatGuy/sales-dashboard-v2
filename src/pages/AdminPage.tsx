import React from 'react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Admin Utilities</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Welcome, {currentUser.name}. This area is restricted to administrators.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md">Refresh Caches</button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-md">Run Data Cleanup</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">View System Logs</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md">Trigger Test Alert</button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">More admin tools will be added here.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
