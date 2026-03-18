import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Check, AlertCircle } from 'lucide-react';
import { AllowedDomain } from '../../types';
import { allowedDomainsService, normalizeDomain } from '../../services/api/allowedDomains';

const AllowedDomainsPanel: React.FC = () => {
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    setIsLoading(true);
    const data = await allowedDomainsService.getAllowedDomains();
    setDomains(data);
    setIsLoading(false);
  }

  async function handleAddNew() {
    setAddError(null);
    if (!newLabel.trim()) {
      setAddError('Label is required.');
      return;
    }
    if (!newDomain.trim()) {
      setAddError('Domain is required.');
      return;
    }

    let normalized: string;
    try {
      normalized = normalizeDomain(newDomain.trim());
    } catch {
      setAddError('Enter a valid domain or URL (e.g. amazon.com).');
      return;
    }

    setSaveStatus('saving');
    const result = await allowedDomainsService.addAllowedDomain(normalized, newLabel.trim());
    if (result.success && result.domain) {
      setDomains((prev) => [...prev, result.domain!].sort((a, b) => a.label.localeCompare(b.label)));
      setNewLabel('');
      setNewDomain('');
      setIsAddingNew(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } else {
      setAddError(result.error ?? 'Failed to add domain.');
      setSaveStatus('idle');
    }
  }

  async function handleDelete(id: string) {
    setSaveStatus('saving');
    const result = await allowedDomainsService.deleteAllowedDomain(id);
    if (result.success) {
      setDomains((prev) => prev.filter((d) => d.id !== id));
      setConfirmDelete(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } else {
      setSaveStatus('error');
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading allowed domains...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Allowed Part Link Domains
        </h2>
        <span className="text-xs min-w-[60px] text-right">
          {saveStatus === 'saving' && (
            <span className="text-gray-400">Saving...</span>
          )}
          {saveStatus === 'success' && (
            <span className="text-green-500 flex items-center gap-1 justify-end">
              <Check size={12} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-500 flex items-center gap-1 justify-end">
              <AlertCircle size={12} /> Error
            </span>
          )}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Restrict which websites technicians can link to when creating part orders. When the list is non-empty, only links from listed domains are accepted. Leave empty to allow any valid URL.
      </p>

      <div className="space-y-2 mb-4">
        {domains.length === 0 && !isAddingNew ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            No domains in allowlist — all valid URLs are accepted.
          </p>
        ) : (
          domains.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate">
                {d.label}
              </span>
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
                {d.domain}
              </span>

              <div className="shrink-0">
                {confirmDelete === d.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs px-2 py-0.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(d.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Remove domain"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddingNew ? (
        <div className="space-y-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Label (e.g. Amazon)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 dark:text-white focus:outline-none focus:border-primary-400"
            />
            <input
              type="text"
              placeholder="Domain (e.g. amazon.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 dark:text-white focus:outline-none focus:border-primary-400"
            />
            <button
              onClick={handleAddNew}
              disabled={!newLabel.trim() || !newDomain.trim()}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => { setIsAddingNew(false); setNewLabel(''); setNewDomain(''); setAddError(null); }}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
          {addError && (
            <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setIsAddingNew(true); setAddError(null); }}
          className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <Plus size={14} />
          Add Domain
        </button>
      )}
    </div>
  );
};

export default AllowedDomainsPanel;
