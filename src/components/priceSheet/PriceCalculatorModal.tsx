import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';

type DeviceType = 'phone' | 'tablet' | 'computer' | 'gameConsole' | 'other';

const DEVICE_RULES: Record<DeviceType, { label: string; lowAdd: number; highAdd: number }> = {
  phone:       { label: 'Phone',        lowAdd: 70,   highAdd: 122.5 },
  tablet:      { label: 'Tablet',       lowAdd: 70,   highAdd: 105   },
  computer:    { label: 'Computer',     lowAdd: 87.5, highAdd: 122.5 },
  gameConsole: { label: 'Game Console', lowAdd: 94.5, highAdd: 129.5 },
  other:       { label: 'Other',        lowAdd: 70,   highAdd: 280   },
};

interface Props {
  onClose: () => void;
}

const PriceCalculatorModal: React.FC<Props> = ({ onClose }) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('phone');
  const [partPrice, setPartPrice] = useState('');

  const rule = DEVICE_RULES[deviceType];
  const part = parseFloat(partPrice);
  const hasResult = !isNaN(part) && part >= 0 && partPrice.trim() !== '';
  const lowEnd  = hasResult ? part * 1.7 + rule.lowAdd  : null;
  const highEnd = hasResult ? part * 2   + rule.highAdd : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Price Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {(Object.keys(DEVICE_RULES) as DeviceType[]).map((key) => (
                <option key={key} value={key}>{DEVICE_RULES[key].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Part Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={partPrice}
              onChange={(e) => setPartPrice(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className={`rounded-lg border transition-all duration-150 ${
            hasResult
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
              : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600'
          } p-4 space-y-3`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Quoted Price Range
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Low End</span>
              <span className={`text-lg font-semibold ${hasResult ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                {hasResult ? `$${lowEnd!.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">High End</span>
              <span className={`text-lg font-semibold ${hasResult ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                {hasResult ? `$${highEnd!.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculatorModal;
