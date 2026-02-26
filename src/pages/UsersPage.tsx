import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, UserPlus } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { usersService, UsersListResult } from '../services/api/users';
import { ManagedUser, Store } from '../types';

// ── EditUserModal ─────────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: ManagedUser;
  availableStores: Pick<Store, 'id' | 'name' | 'location'>[];
  callerRole: 'manager' | 'admin';
  onClose: () => void;
  onSave: (userId: string, updates: { name: string; role: string; storeIds: string[] }) => Promise<void>;
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
      await onSave(user.id, { name, role, storeIds });
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

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${confirmClassName}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── RoleBadge ─────────────────────────────────────────────────────────────────

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const classes =
    role === 'manager'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${classes}`}
    >
      {role}
    </span>
  );
};

// ── UsersPage ─────────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [listData, setListData] = useState<UsersListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: ManagedUser;
    action: 'deactivate' | 'reactivate';
  } | null>(null);

  const callerRole = currentUser?.role as 'manager' | 'admin';

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setPageError('');
    try {
      const data = await usersService.listUsers();
      setListData(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSave = async (
    userId: string,
    updates: { name: string; role: string; storeIds: string[] }
  ) => {
    await usersService.updateUser(userId, updates);
    setListData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                name: updates.name,
                role: updates.role as ManagedUser['role'],
                storeIds: updates.storeIds,
              }
            : u
        ),
      };
    });
  };

  const handleDeactivate = async (user: ManagedUser) => {
    await usersService.deactivateUser(user.id);
    setListData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) =>
              u.id === user.id ? { ...u, isActive: false } : u
            ),
          }
        : prev
    );
    setConfirmAction(null);
  };

  const handleReactivate = async (user: ManagedUser) => {
    await usersService.reactivateUser(user.id);
    setListData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) =>
              u.id === user.id ? { ...u, isActive: true } : u
            ),
          }
        : prev
    );
    setConfirmAction(null);
  };

  const storeNameMap = Object.fromEntries(
    (listData?.availableStores ?? []).map((s) => [s.id, s.name])
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Users
            </h1>
            <Link
              to="/invite"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
            >
              <UserPlus size={16} />
              Invite New User
            </Link>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
              Loading users...
            </div>
          ) : pageError ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{pageError}</p>
              <button
                onClick={loadUsers}
                className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {listData!.users.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No users to manage. Use "Invite New User" to add someone.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['Name', 'Role', 'Stores', 'Status', 'Actions'].map(
                          (col) => (
                            <th
                              key={col}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {listData!.users.map((user) => (
                        <tr
                          key={user.id}
                          className={`${
                            !user.isActive ? 'opacity-60' : ''
                          } hover:bg-gray-50 dark:hover:bg-gray-750`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {user.storeIds.length === 0 ? (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                  None
                                </span>
                              ) : (
                                user.storeIds
                                  .map((id) => storeNameMap[id] ?? id)
                                  .join(', ')
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                              >
                                Edit
                              </button>
                              {user.isActive ? (
                                <button
                                  onClick={() =>
                                    setConfirmAction({ user, action: 'deactivate' })
                                  }
                                  className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmAction({ user, action: 'reactivate' })
                                  }
                                  className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {editingUser && listData && (
        <EditUserModal
          user={editingUser}
          availableStores={listData.availableStores}
          callerRole={callerRole}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.action === 'deactivate'
              ? 'Deactivate User'
              : 'Reactivate User'
          }
          message={
            confirmAction.action === 'deactivate'
              ? `Are you sure you want to deactivate ${confirmAction.user.name}? They will no longer be able to log in.`
              : `Are you sure you want to reactivate ${confirmAction.user.name}? They will regain access to log in.`
          }
          confirmLabel={
            confirmAction.action === 'deactivate' ? 'Deactivate' : 'Reactivate'
          }
          confirmClassName={
            confirmAction.action === 'deactivate'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }
          onConfirm={
            confirmAction.action === 'deactivate'
              ? () => handleDeactivate(confirmAction.user)
              : () => handleReactivate(confirmAction.user)
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default UsersPage;
