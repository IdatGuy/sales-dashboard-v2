import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Check, AlertCircle, Archive, ArchiveRestore, X } from "lucide-react";
import {
  GoalDefinition,
  listGoalDefinitions,
  createGoalDefinition,
  updateGoalDefinition,
  reorderGoalDefinitions,
  deleteGoalDefinition,
} from "../../services/api/goalDefinitions";
import { useDashboard } from "../../context/DashboardContext";

const UNIT_BADGE: Record<string, string> = {
  currency: "$",
  count: "#",
  percentage: "%",
};

const UNIT_BADGE_CLASS: Record<string, string> = {
  currency: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  percentage: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  count: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
};

const GoalDefinitionsPanel: React.FC = () => {
  const { metricDefinitions, refreshGoalDefinitions } = useDashboard();
  const [definitions, setDefinitions] = useState<GoalDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDefinitions();
  }, []);

  async function loadDefinitions() {
    setIsLoading(true);
    const defs = await listGoalDefinitions();
    setDefinitions(defs);
    setIsLoading(false);
  }

  // Derive locked unit type from first selected metric
  const lockedUnitType: 'currency' | 'count' | 'percentage' | null =
    selectedMetricKeys.length > 0
      ? (metricDefinitions.find((m) => m.key === selectedMetricKeys[0])?.unitType ?? null)
      : null;

  function toggleMetric(key: string) {
    const metric = metricDefinitions.find((m) => m.key === key);
    if (!metric) return;

    if (selectedMetricKeys.includes(key)) {
      setSelectedMetricKeys((prev) => prev.filter((k) => k !== key));
    } else {
      // Can only select if unit type matches locked type (or no lock yet)
      if (!lockedUnitType || metric.unitType === lockedUnitType) {
        setSelectedMetricKeys((prev) => [...prev, key]);
      }
    }
  }

  async function handleNameBlur(def: GoalDefinition) {
    const pending = editingNames[def.id];
    if (pending === undefined || pending === def.name) {
      setEditingNames((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
      return;
    }
    const trimmed = pending.trim();
    if (!trimmed) {
      setEditingNames((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
      return;
    }
    setSaveStatus("saving");
    const result = await updateGoalDefinition(def.id, { name: trimmed });
    if (result.success) {
      setDefinitions((prev) =>
        prev.map((d) => (d.id === def.id ? { ...d, name: trimmed } : d))
      );
      refreshGoalDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
    setEditingNames((prev) => { const n = { ...prev }; delete n[def.id]; return n; });
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newDefs = [...definitions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDefs.length) return;
    [newDefs[index], newDefs[targetIndex]] = [newDefs[targetIndex], newDefs[index]];
    setDefinitions(newDefs);
    setSaveStatus("saving");
    const result = await reorderGoalDefinitions(newDefs.map((d) => d.id));
    if (result.success) {
      refreshGoalDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleAddNew() {
    if (!newName.trim() || selectedMetricKeys.length === 0 || !lockedUnitType) return;
    setSaveStatus("saving");
    const result = await createGoalDefinition(newName.trim(), selectedMetricKeys, lockedUnitType);
    if (result.success && result.definition) {
      setDefinitions((prev) => [...prev, result.definition!]);
      refreshGoalDefinitions();
      setNewName("");
      setSelectedMetricKeys([]);
      setIsAddingNew(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleToggleDeprecated(def: GoalDefinition) {
    setSaveStatus("saving");
    const result = await updateGoalDefinition(def.id, { isDeprecated: !def.isDeprecated });
    if (result.success) {
      setDefinitions((prev) =>
        prev.map((d) => (d.id === def.id ? { ...d, isDeprecated: !d.isDeprecated } : d))
      );
      refreshGoalDefinitions();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleDelete(id: string) {
    setSaveStatus("saving");
    const result = await deleteGoalDefinition(id);
    if (result.success) {
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      refreshGoalDefinitions();
      setConfirmDelete(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } else {
      setSaveStatus("error");
    }
  }

  function cancelAdd() {
    setIsAddingNew(false);
    setNewName("");
    setSelectedMetricKeys([]);
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading goal definitions...</p>
      </div>
    );
  }

  const availableMetrics = metricDefinitions.filter((m) => !m.isDeprecated);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Goal Definitions
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
        Define goal types that track one or more sales metrics of the same unit type. Managers set monthly target values per store. Deprecated goals are hidden from target entry but preserved in history.
      </p>

      <div className="space-y-2 mb-4">
        {definitions.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No goal definitions yet. Add one below.</p>
        )}
        {definitions.map((def, i) => (
          <div
            key={def.id}
            className={`flex items-start gap-2 p-2 rounded-md ${
              def.isDeprecated
                ? "bg-gray-100 dark:bg-gray-800 opacity-60"
                : "bg-gray-50 dark:bg-gray-700"
            }`}
          >
            <div className="flex flex-col gap-0.5 shrink-0 mt-1">
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

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={editingNames[def.id] ?? def.name}
                onChange={(e) =>
                  setEditingNames((prev) => ({ ...prev, [def.id]: e.target.value }))
                }
                onBlur={() => handleNameBlur(def)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-400 dark:focus:border-primary-400 rounded bg-transparent dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-600"
              />
              <div className="flex flex-wrap gap-1 mt-1 px-2">
                {def.metricKeys.map((key) => {
                  const metric = metricDefinitions.find((m) => m.key === key);
                  return (
                    <span
                      key={key}
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    >
                      {metric?.label ?? key}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 mt-1">
              {def.isDeprecated && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                  Deprecated
                </span>
              )}

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${UNIT_BADGE_CLASS[def.unitType]}`}
              >
                {UNIT_BADGE[def.unitType]}
              </span>

              <button
                onClick={() => handleToggleDeprecated(def)}
                className={`p-1 ${
                  def.isDeprecated
                    ? "text-amber-500 hover:text-green-500 dark:hover:text-green-400"
                    : "text-gray-400 hover:text-amber-500 dark:hover:text-amber-400"
                }`}
                title={def.isDeprecated ? "Restore goal" : "Deprecate goal"}
              >
                {def.isDeprecated ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </button>

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
                    title="Delete goal definition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddingNew ? (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md space-y-3">
          <input
            type="text"
            placeholder="Goal name (e.g. Combined Mobile Units)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 dark:text-white focus:outline-none focus:border-primary-400"
          />

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              Select one or more metrics to sum{lockedUnitType ? ` (locked to ${lockedUnitType} unit type)` : ""}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableMetrics.map((m) => {
                const isSelected = selectedMetricKeys.includes(m.key);
                const isCompatible = !lockedUnitType || m.unitType === lockedUnitType;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleMetric(m.key)}
                    disabled={!isCompatible && !isSelected}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors ${
                      isSelected
                        ? "bg-primary-600 border-primary-600 text-white"
                        : isCompatible
                        ? "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:border-primary-400"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isSelected && <X size={10} />}
                    {m.label}
                    <span className={`text-xs font-medium ${UNIT_BADGE_CLASS[m.unitType]} px-1 rounded`}>
                      {UNIT_BADGE[m.unitType]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              disabled={!newName.trim() || selectedMetricKeys.length === 0}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Goal
            </button>
            <button
              onClick={cancelAdd}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            {selectedMetricKeys.length > 0 && lockedUnitType && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Unit type: <span className={`font-medium px-1.5 py-0.5 rounded-full ${UNIT_BADGE_CLASS[lockedUnitType]}`}>{UNIT_BADGE[lockedUnitType]} {lockedUnitType}</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <Plus size={14} />
          Add New Goal
        </button>
      )}
    </div>
  );
};

export default GoalDefinitionsPanel;
