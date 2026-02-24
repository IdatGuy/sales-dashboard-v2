import React, { useState } from "react";
import { X } from "lucide-react";
import { Store } from "../../types";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import { upsertDailySales } from "../../services/api/sales";

interface EnterSalesModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const EnterSalesModal: React.FC<EnterSalesModalProps> = ({
  store,
  isOpen,
  onClose,
}) => {
  const { salesData, refreshSalesData } = useDashboard();
  const { currentUser } = useAuth();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [formValues, setFormValues] = useState({
    salesAmount: "",
    accessorySales: "",
    homeConnects: "",
    homePlus: "",
    cleanings: "",
    repairs: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingRecord, setExistingRecord] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-fill form when modal opens or date changes
  React.useEffect(() => {
    if (!isOpen) return;

    const existing = salesData.daily.find((s) => s.date === selectedDate) ?? null;
    setExistingRecord(!!existing);

    if (existing) {
      setFormValues({
        salesAmount: existing.salesAmount ? String(existing.salesAmount) : "",
        accessorySales: existing.accessorySales ? String(existing.accessorySales) : "",
        homeConnects: existing.homeConnects ? String(existing.homeConnects) : "",
        homePlus: existing.homePlus ? String(existing.homePlus) : "",
        cleanings: existing.cleanings ? String(existing.cleanings) : "",
        repairs: existing.repairs ? String(existing.repairs) : "",
      });
    } else {
      setFormValues({
        salesAmount: "",
        accessorySales: "",
        homeConnects: "",
        homePlus: "",
        cleanings: "",
        repairs: "",
      });
    }

    setShowOverwriteConfirm(false);
    setSaveStatus(null);
    setErrorMessage(null);
    setValidationError(null);
  }, [isOpen, selectedDate, salesData.daily]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formValues.salesAmount) {
      setValidationError("Sales amount is required.");
      return;
    }

    if (existingRecord && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    setIsLoading(true);

    const result = await upsertDailySales(
      store.id,
      selectedDate,
      {
        salesAmount: Number(formValues.salesAmount),
        accessorySales: formValues.accessorySales ? Number(formValues.accessorySales) : undefined,
        homeConnects: formValues.homeConnects ? Number(formValues.homeConnects) : undefined,
        homePlus: formValues.homePlus ? Number(formValues.homePlus) : undefined,
        cleanings: formValues.cleanings ? Number(formValues.cleanings) : undefined,
        repairs: formValues.repairs ? Number(formValues.repairs) : undefined,
      },
      currentUser!.id
    );

    if (result.success) {
      setSaveStatus("success");
      refreshSalesData();
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setSaveStatus("error");
      setErrorMessage(result.error ?? "Failed to save sales data. Please try again.");
    }

    setIsLoading(false);
    setShowOverwriteConfirm(false);
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const numericInput = (
    field: keyof typeof formValues,
    allowDecimal = false
  ) => ({
    type: "text" as const,
    inputMode: "numeric" as const,
    value: formValues[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
      const value = e.target.value.replace(pattern, "");
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setValidationError(null);
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    className:
      "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    placeholder: "0",
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Enter Sales — {store.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {saveStatus === "success" && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Sales data saved successfully!
              </p>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>
          )}
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {validationError}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Amount ($) <span className="text-red-500">*</span>
              </label>
              <input {...numericInput("salesAmount", true)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Accessory Sales ($)
              </label>
              <input {...numericInput("accessorySales", true)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Home Connects (units)
              </label>
              <input {...numericInput("homeConnects")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Home Plus (units)
              </label>
              <input {...numericInput("homePlus")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cleanings (units)
              </label>
              <input {...numericInput("cleanings")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Repairs (units)
              </label>
              <input {...numericInput("repairs")} />
            </div>
          </div>

          {showOverwriteConfirm && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Sales data already exists for this date. Are you sure you want to overwrite it?
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
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Sales"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterSalesModal;
