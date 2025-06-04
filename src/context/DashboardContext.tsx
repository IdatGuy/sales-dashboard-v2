import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Store, TimeFrame } from '../types';
import { mockStores } from '../data/mockData';

interface DashboardContextType {
  selectedStore: Store | null;
  timeFrame: TimeFrame;
  setSelectedStore: (store: Store) => void;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  availableStores: Store[];
  updateStoreGoals: (storeId: string, goals: { 
    salesGoal: number; 
    accessoryGoal: number; 
    homeConnectGoal: number; 
  }) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [selectedStore, setSelectedStore] = useState<Store | null>(stores[0] || null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({ 
    period: 'month', 
    label: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
  });

  const updateStoreGoals = (storeId: string, goals: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  }) => {
    const updatedStores = stores.map(store => 
      store.id === storeId ? { ...store, ...goals } : store
    );
    setStores(updatedStores);
    
    // Update selected store if it's the one being modified
    if (selectedStore?.id === storeId) {
      setSelectedStore({ ...selectedStore, ...goals });
    }
  };

  const value = {
    selectedStore,
    timeFrame,
    setSelectedStore,
    setTimeFrame,
    availableStores: stores,
    updateStoreGoals,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};