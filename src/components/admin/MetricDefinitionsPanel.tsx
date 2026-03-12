import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Check, AlertCircle } from "lucide-react";
import {
  MetricDefinition,
  getMetricDefinitions,
  createMetricDefinition,
  updateMetricDefinition,
  reorderMetricDefinitions,
  deleteMetricDefinition,
} from "../../services/api/metricDefinitions";
import { useDashboard } from "../../context/DashboardContext";

const MetricDefinitionsPanel: React.FC = () => {
  const { refreshMetricDefinitions } = useDashboard();
  const [definitions, setDefinitions] = useState<MetricDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUnitType, setNewUnitType] = useState<"currency" | "count">("count");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [editingLabels, setEditingLabels] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDefinitions();
  }, []);

  async function loadDefinitions() {
    setIsLoading(true);
    const defs = await getMetricDefinitions();
    setDefinitions(defs);
    setIsLoading(false);
  }

  async function handleToggleVisible(def: MetricDefinition) {
    setSaveStatus("saving");
    const result = await updateMetricDefinition(def.id, { isVisible: !def.isVisible });
    if (result.success) {
      setDefinitions((prev) =>
        prev.map((d) => (d.id === def.id ? { ...d, isVisible: !d.isVisible } : d))
      );
      refreshMetricDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleLabelBlur(def: MetricDefinition) {
    const pending = editingLabels[def.id];
    if (pending === undefined || pending === def.label) {
      setEditingLabels((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
      return;
    }
    const trimmed = pending.trim();
    if (!trimmed) {
      setEditingLabels((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
      return;
    }
    setSaveStatus("saving");
    const result = await updateMetricDefinition(def.id, { label: trimmed });
    if (result.success) {
      setDefinitions((prev) =>
        prev.map((d) => (d.id === def.id ? { ...d, label: trimmed } : d))
      );
      refreshMetricDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
    setEditingLabels((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newDefs = [...definitions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDefs.length) return;
    [newDefs[index], newDefs[targetIndex]] = [newDefs[targetIndex], newDefs[index]];
    setDefinitions(newDefs);
    setSaveStatus("saving");
    const result = await reorderMetricDefinitions(newDefs.map((d) => d.id));
    if (result.success) {
      refreshMetricDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleAddNew() {
    if (!newLabel.trim()) return;
    setSaveStatus("saving");
    const result = await createMetricDefinition(newLabel.trim(), newUnitType);
    if (result.success && result.definition) {
      setDefinitions((prev) => [...prev, result.definition!]);
      refreshMetricDefinitions();
      setNewLabel("");
      setNewUnitType("count");
      setIsAddingNew(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleDelete(id: string) {
    setSaveStatus("saving");
    const result = await deleteMetricDefinition(id);
    if (result.success) {
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      refreshMetricDefinitions();
      setConfirmDelete(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sales Metric Definitions
        </h2>
        <span className="text-xs min-w-[60px] text-right">
          {saveStatus === "saving" && (
            <span className="text-gray-400">Saving...</span>
          )}
          {saveStatus === "success" && (
            <span className="text-green-500 flex items-center gap-1 justify-end">
              <Check size={12} /> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500 flex items-center gap-1 justify-end">
              <AlertCircle size={12} /> Error
            </span>
          )}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Configure which metrics appear on the dashboard. Toggle visibility, rename labels, reorder, or add new metrics.
      </p>

      <div className="space-y-2 mb-4">
        {definitions.map((def, i) => (
          <div
            key={def.id}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
          >
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => handleMove(i, "up")}
                disabled={i === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => handleMove(i, "down")}
                disabled={i === definitions.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <input
              type="text"
              value={editingLabels[def.id] ?? def.label}
              onChange={(e) =>
                setEditingLabels((prev) => ({ ...prev, [def.id]: e.target.value }))
              }
              onBlur={() => handleLabelBlur(def)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="flex-1 min-w-0 px-2 py-1 text-sm border border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-400 dark:focus:border-primary-400 rounded bg-transparent dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-600"
            />

            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                def.unitType === "currency"
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              }`}
            >
              {def.unitType === "currency" ? "$" : "#"}
            </span>

            <label className="shrink-0 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={def.isVisible}
                onChange={() => handleToggleVisible(def)}
                className="form-checkbox h-3.5 w-3.5"
              />
              Visible
            </label>

            {!def.isBuiltin && (
              <div className="shrink-0">
                {confirmDelete === def.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(def.id)}
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
                    onClick={() => setConfirmDelete(def.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Delete metric"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAddingNew ? (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <input
            type="text"
            placeholder="Metric name"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
            autoFocus
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 dark:text-white focus:outline-none focus:border-primary-400"
          />
          <select
            value={newUnitType}
            onChange={(e) => setNewUnitType(e.target.value as "currency" | "count")}
            className="text-sm border border-gray-300 dark:border-gray-500 rounded px-2 py-1 bg-white dark:bg-gray-600 dark:text-white"
          >
            <option value="count">Count (#)</option>
            <option value="currency">Currency ($)</option>
          </select>
          <button
            onClick={handleAddNew}
            disabled={!newLabel.trim()}
            className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => { setIsAddingNew(false); setNewLabel(""); }}
            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <Plus size={14} />
          Add New Metric
        </button>
      )}
    </div>
  );
};

export default MetricDefinitionsPanel;
