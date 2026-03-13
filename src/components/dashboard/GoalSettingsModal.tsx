import React, { useState } from "react";
import { X } from "lucide-react";
import { Store } from "../../types";
import { goalsService, StoreGoalsMap } from "../../services/api/goals";
import { useDashboard } from "../../context/DashboardContext";

interface GoalSettingsModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentMonth: string; // Format: YYYY-MM
}

const UNIT_SYMBOL: Record<string, string> = {
  currency: "$",
  count: "#",
  percentage: "%",
};

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  store,
  isOpen,
  onClose,
  onSave,
  currentMonth,
}) => {
  const { activeGoalDefinitions } = useDashboard();
  const [targets, setTargets] = useState<StoreGoalsMap>({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  // Generate month/year options (current month + 4 years back)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    for (let year = currentYear; year >= currentYear - 4; year--) {
      for (
        let month = year === currentYear ? now.getMonth() + 1 : 12;
        month >= 1;
        month--
      ) {
        const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
        const label = new Date(year, month - 1).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });
        options.push({ value: monthStr, label });
      }
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Load existing goals when modal opens or month changes
  React.useEffect(() => {
    if (isOpen) {
      setIsLoadingGoals(true);
      goalsService.getStoreGoals(store.id, selectedMonth).then((existing) => {
        setTargets(existing);
        setHasExisting(Object.keys(existing).length > 0);
        setIsLoadingGoals(false);
      });
    }
  }, [isOpen, store.id, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExisting && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    setIsLoading(true);
    const result = await goalsService.saveStoreGoals(store.id, selectedMonth, targets);
    if (result.success) {
      onSave();
      setSaveStatus("success");
      setTimeout(() => onClose(), 1000);
    } else {
      setSaveStatus("error");
    }
    setIsLoading(false);
    setShowOverwriteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
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

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
          {saveStatus === "success" && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Goals saved successfully!
              </p>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to save goals. Please try again.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month/Year
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setShowOverwriteConfirm(false);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoadingGoals}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoadingGoals ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading existing goals...
              </div>
            ) : activeGoalDefinitions.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No goal definitions configured. Ask an admin to add goal types in the Admin panel.
              </div>
            ) : (
              activeGoalDefinitions.map((goal) => (
                <div key={goal.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {goal.name}
                    <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full ${
                      goal.unitType === "currency"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : goal.unitType === "percentage"
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    }`}>
                      {UNIT_SYMBOL[goal.unitType]}
                    </span>
                  </label>
                  <div className="relative">
                    {goal.unitType === "currency" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm pointer-events-none">
                        $
                      </span>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targets[goal.id] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const num = value ? Number(value) : 0;
                        setTargets((prev) => ({ ...prev, [goal.id]: num }));
                      }}
                      onFocus={(e) => e.target.select()}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        goal.unitType === "currency" ? "pl-7" : ""
                      }`}
                      placeholder="0"
                    />
                    {goal.unitType === "percentage" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm pointer-events-none">
                        %
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {showOverwriteConfirm && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Goals already exist for this month. Are you sure you want to overwrite them?
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={doSave}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Yes, Overwrite
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverwriteConfirm(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
              disabled={isLoading || isLoadingGoals || activeGoalDefinitions.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Goals"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettingsModal;
