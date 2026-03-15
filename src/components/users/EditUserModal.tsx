import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ManagedUser, Store } from '../../types';

export interface EditUserModalProps {
  user: ManagedUser;
  availableStores: Pick<Store, 'id' | 'name' | 'location'>[];
  callerRole: 'manager' | 'admin';
  onClose: () => void;
  onSave: (userId: string, updates: { name: string; role: string; storeIds: string[]; hasDepotAccess: boolean }) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  availableStores,
  callerRole,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [storeIds, setStoreIds] = useState<string[]>(user.storeIds);
  const [hasDepotAccess, setHasDepotAccess] = useState(user.hasDepotAccess);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStoreToggle = (storeId: string) => {
    setStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeIds.length === 0) {
      setError('At least one store must be selected.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onSave(user.id, { name, role, storeIds, hasDepotAccess });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit {user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            {callerRole === 'manager' ? (
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                Employee — managers can only assign employee role
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'employee' | 'manager')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Access
            </label>
            {availableStores.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No stores available.
              </p>
            ) : (
              <div className="space-y-2">
                {availableStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={storeIds.includes(store.id)}
                      onChange={() => handleStoreToggle(store.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {store.name}
                      {store.location ? ` — ${store.location}` : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDepotAccess}
                onChange={(e) => setHasDepotAccess(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Depot Access</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
              Grants access to orders across all stores.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
