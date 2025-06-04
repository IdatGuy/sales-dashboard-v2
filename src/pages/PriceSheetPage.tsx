import React from 'react';
import { Upload } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import DocumentList from '../components/documents/DocumentList';
import { getDocumentsByCategory } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const PriceSheetPage: React.FC = () => {
  const { currentUser } = useAuth();
  const priceDocuments = getDocumentsByCategory('price');
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Price Sheets
            </h1>
            
            {isManager && (
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Upload size={18} className="mr-2" />
                Upload New Price Sheet
              </button>
            )}
          </div>
          
          <div className="animate-fade-in">
            <DocumentList 
              documents={priceDocuments} 
              title="Current Price Sheets" 
            />
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Price Sheet Information</h2>
            <p className="text-gray-700 mb-3">
              Price sheets are updated quarterly. Please ensure you're using the most recent version when quoting customers.
            </p>
            <p className="text-gray-700 mb-3">
              If you have any questions about pricing, please contact your store manager or the pricing team at pricing@example.com.
            </p>
            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
              <p className="text-primary-700 text-sm">
                <strong>Important:</strong> Special pricing promotions may apply. Always check for active promotions before finalizing a sale.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PriceSheetPage;