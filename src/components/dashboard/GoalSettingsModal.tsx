import React, { useState } from "react";
import { X } from "lucide-react";
import { Store } from "../../types";
import { goalsService } from "../../services/api/goals";

interface GoalSettingsModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  }) => void;
  currentMonth: string; // Format: YYYY-MM
}

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  store,
  isOpen,
  onClose,
  onSave,
  currentMonth,
}) => {
  const [goals, setGoals] = useState({
    salesGoal: 0,
    accessoryGoal: 0,
    homeConnectGoal: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingGoals, setExistingGoals] = useState<any>(null);

  // Generate month/year options (current month + 4 years back)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let year = currentYear; year >= currentYear - 4; year--) {
      for (
        let month = year === currentYear ? currentDate.getMonth() + 1 : 12;
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
      goalsService
        .getStoreGoals(store.id, selectedMonth)
        .then((existingGoals) => {
          if (existingGoals) {
            setGoals(existingGoals);
            setExistingGoals(existingGoals);
          } else {
            setGoals({
              salesGoal: 0,
              accessoryGoal: 0,
              homeConnectGoal: 0,
            });
            setExistingGoals(null);
          }
          setIsLoadingGoals(false);
        });
    }
  }, [isOpen, store.id, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if goals already exist and ask for confirmation
    if (existingGoals && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    setIsLoading(true);

    const success = await goalsService.saveStoreGoals(
      store.id,
      selectedMonth,
      goals
    );

    if (success) {
      onSave(goals);
      alert("Goals saved successfully!");
      onClose();
    } else {
      alert("Failed to save goals. Please try again.");
    }

    setIsLoading(false);
    setShowOverwriteConfirm(false);
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
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
                Month/Year
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
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
              <div className="text-center py-4 text-gray-500">
                Loading existing goals...
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Sales Goal ($)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goals.salesGoal || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setGoals({
                        ...goals,
                        salesGoal: value ? Number(value) : 0,
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Accessory Goal ($)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goals.accessoryGoal || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setGoals({
                        ...goals,
                        accessoryGoal: value ? Number(value) : 0,
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Home Connect Goal (units)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goals.homeConnectGoal || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setGoals({
                        ...goals,
                        homeConnectGoal: value ? Number(value) : 0,
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {showOverwriteConfirm && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Goals already exist for this month. Are you sure you want to
                overwrite them?
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleConfirmOverwrite}
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
              disabled={isLoading || isLoadingGoals}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Saving..."
                : showOverwriteConfirm
                ? "Confirm Save"
                : "Save Goals"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettingsModal;
