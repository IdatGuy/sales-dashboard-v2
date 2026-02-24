import React, { useState } from "react";
import { Upload, FileText, BookOpen } from "lucide-react";
import Navbar from "../components/common/Navbar";
import DocumentList from "../components/documents/DocumentList";
import { getDocumentsByCategory } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const DocumentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("training");
  const isManager =
    currentUser?.role === "manager" || currentUser?.role === "admin";

  const trainingDocs = getDocumentsByCategory("training");
  const policyDocs = getDocumentsByCategory("policy");

  const tabs = [
    { id: "training", label: "Training", icon: <BookOpen size={18} /> },
    { id: "policy", label: "Policies", icon: <FileText size={18} /> },
  ];

  const getDocumentsByTab = () => {
    switch (activeTab) {
      case "training":
        return trainingDocs;
      case "policy":
        return policyDocs;
      default:
        return trainingDocs;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "training":
        return "Training Documents";
      case "policy":
        return "Policy Documents";
      default:
        return "Documents";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
              Documents
            </h1>

            {isManager && (
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 dark:text-gray-900">
                <Upload size={18} className="mr-2" />
                Upload New Document
              </button>
            )}
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav
              className="-mb-px flex space-x-6 overflow-x-auto"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                    }
                  `}
                >
                  <div className="flex items-center">
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="animate-fade-in">
            <DocumentList
              documents={getDocumentsByTab()}
              title={getTabTitle()}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
