import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Store } from '../../types';

interface GoalSettingsModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: { salesGoal: number; accessoryGoal: number; homeConnectGoal: number }) => void;
}

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  store,
  isOpen,
  onClose,
  onSave,
}) => {
  const [goals, setGoals] = useState({
    salesGoal: store.salesGoal,
    accessoryGoal: store.accessoryGoal,
    homeConnectGoal: store.homeConnectGoal,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Set Goals for {store.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Sales Goal ($)
              </label>
              <input
                type="number"
                value={goals.salesGoal}
                onChange={(e) => setGoals({ ...goals, salesGoal: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Accessory Goal ($)
              </label>
              <input
                type="number"
                value={goals.accessoryGoal}
                onChange={(e) => setGoals({ ...goals, accessoryGoal: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Home Connect Goal (units)
              </label>
              <input
                type="number"
                value={goals.homeConnectGoal}
                onChange={(e) => setGoals({ ...goals, homeConnectGoal: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Goals
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettingsModal;