import React from 'react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import MetricDefinitionsPanel from '../components/admin/MetricDefinitionsPanel';
import GoalDefinitionsPanel from '../components/admin/GoalDefinitionsPanel';
import CsvImportPanel from '../components/admin/CsvImportPanel';
import AllowedDomainsPanel from '../components/admin/AllowedDomainsPanel';

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Admin Utilities</h1>

          <div className="mt-6">
            <MetricDefinitionsPanel />
          </div>

          <div className="mt-6">
            <GoalDefinitionsPanel />
          </div>

          <div className="mt-6">
            <AllowedDomainsPanel />
          </div>

          <div className="mt-6">
            <CsvImportPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
