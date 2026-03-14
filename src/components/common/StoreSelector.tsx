import React, { useState, useRef, useEffect } from "react";
import { Store } from "../../types";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import { ChevronDown, Store as StoreIcon } from "lucide-react";

interface StoreSelectorProps {
  depotStores?: Store[];
  selectedDepotStoreId?: string | null;
  onDepotStoreSelect?: (store: Store | null) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({
  depotStores = [],
  selectedDepotStoreId,
  onDepotStoreSelect,
}) => {
  const {
    availableStores,
    selectedStore,
    setSelectedStore,
  } = useDashboard();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    onDepotStoreSelect?.(null);
    setIsOpen(false);
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

  if ((!selectedStore && !selectedDepotStoreId) || userStores.length === 0) return null;
  if (userStores.length === 1 && depotStores.length === 0) return null;

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
            className={`mr-2 ${selectedDepotStoreId ? 'text-purple-600 dark:text-purple-400' : 'text-primary-600 dark:text-primary-400'}`}
          />
          {selectedDepotStoreId
            ? `${availableStores.find(s => s.id === selectedDepotStoreId)?.name ?? ''} (depot)`
            : selectedStore?.name}
          <ChevronDown
            size={18}
            className={`ml-2 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 divide-y divide-gray-100 dark:divide-gray-600">
            {userStores.map((store) => (
              <button
                key={store.id}
                className={`w-full text-left block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 ${
                  selectedStore?.id === store.id && !selectedDepotStoreId
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
            {depotStores.length > 0 && (
              <>
                <div className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Depot
                </div>
                {depotStores.map((store) => (
                  <button
                    key={`depot-${store.id}`}
                    className={`w-full text-left block px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                      selectedDepotStoreId === store.id
                        ? "text-purple-600 dark:text-purple-400 font-medium"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                    onClick={() => { onDepotStoreSelect?.(store); setIsOpen(false); }}
                  >
                    {store.name} <span className="text-purple-500 dark:text-purple-400">(depot)</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {store.location}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StoreSelector;
