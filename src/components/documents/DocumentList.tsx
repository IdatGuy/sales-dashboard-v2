import React, { useState } from 'react';
import { FileText, Download, Search, Clock } from 'lucide-react';
import { Document } from '../../types';

interface DocumentListProps {
  documents: Document[];
  title: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDownload = (document: Document) => {
    // In a real app, this would initiate a download
    // For this demo, we'll just open the URL in a new tab
    window.open(document.fileUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        
        <div className="mt-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No documents found
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div 
              key={doc.id}
              className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between"
            >
              <div className="flex items-start">
                <div className="bg-primary-50 p-2 rounded">
                  <FileText size={20} className="text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList;