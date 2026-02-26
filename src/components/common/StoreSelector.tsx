import React, { useState, useRef, useEffect } from "react";
import { Store } from "../../types";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import { ChevronDown, Store as StoreIcon, Plus } from "lucide-react";
import GoalSettingsModal from "../dashboard/GoalSettingsModal";

interface StoreSelectorProps {
  showGoalSettings?: boolean;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ showGoalSettings = true }) => {
  const {
    availableStores,
    selectedStore,
    setSelectedStore,
    updateStoreGoals,
    currentDate,
  } = useDashboard();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isManager =
    currentUser?.role === "manager" || currentUser?.role === "admin";

  // Filter stores based on user's userStoreAccess
  const userStores = currentUser?.userStoreAccess
    ? availableStores.filter((store) =>
        currentUser.userStoreAccess.some(
          (access) => access.storeId === store.id
        )
      )
    : [];

  const handleSelect = (store: Store) => {
    setSelectedStore(store);
    setIsOpen(false);
  };

  const handleGoalSave = (goals: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  }) => {
    if (selectedStore) {
      updateStoreGoals(selectedStore.id, goals);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!selectedStore || userStores.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <StoreIcon
            size={18}
            className="mr-2 text-primary-600 dark:text-primary-400"
          />
          {selectedStore.name}
          <ChevronDown
            size={18}
            className={`ml-2 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isManager && showGoalSettings && (
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            title="Set Store Goals"
          >
            <Plus size={16} className="mr-1" />
            Enter Goal
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 divide-y divide-gray-100 dark:divide-gray-600">
            {userStores.map((store) => (
              <button
                key={store.id}
                className={`w-full text-left block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 ${
                  selectedStore.id === store.id
                    ? "text-primary-600 dark:text-primary-400 font-medium"
                    : "text-gray-700 dark:text-gray-200"
                }`}
                onClick={() => handleSelect(store)}
              >
                {store.name}
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {store.location}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isGoalModalOpen && selectedStore && showGoalSettings && (
        <GoalSettingsModal
          store={selectedStore}
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={handleGoalSave}
          currentMonth={`${currentDate.getFullYear()}-${(
            currentDate.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}`}
        />
      )}
    </div>
  );
};

export default StoreSelector;
