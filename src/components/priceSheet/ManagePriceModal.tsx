import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { priceSheetService, PriceSheetRowWithNames } from '../../services/api/priceSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRow?: PriceSheetRowWithNames | null;
}

const ManagePriceModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, editRow }) => {
  const isEditMode = !!editRow;

  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Device combobox
  const [deviceInput, setDeviceInput] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [newDeviceBrand, setNewDeviceBrand] = useState('');
  const [newDeviceCategory, setNewDeviceCategory] = useState('');

  // Service combobox
  const [serviceInput, setServiceInput] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);

  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load devices + services when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingLists(true);
    setError(null);
    Promise.all([priceSheetService.getAllDevices(), priceSheetService.getAllServices()])
      .then(([devs, svcs]) => {
        setDevices(devs);
        setServices(svcs);
      })
      .catch(() => setError('Failed to load devices and services.'))
      .finally(() => setIsLoadingLists(false));
  }, [isOpen]);

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && editRow) {
      setDeviceId(editRow.device_id);
      setDeviceInput(editRow.device_name ?? '');
      setNewDeviceBrand('');
      setNewDeviceCategory('');
      setServiceId(editRow.service_id);
      setServiceInput(editRow.service_name ?? '');
      setPrice(editRow.price ?? '');
      setError(null);
    } else if (isOpen && !editRow) {
      setDeviceId('');
      setDeviceInput('');
      setNewDeviceBrand('');
      setNewDeviceCategory('');
      setServiceId('');
      setServiceInput('');
      setPrice('');
      setError(null);
    }
  }, [isOpen, editRow]);

  if (!isOpen) return null;

  // A device is "new" when the user typed a name but didn't select an existing one
  const isNewDevice = deviceId === '' && deviceInput.trim() !== '';
  const isNewService = serviceId === '' && serviceInput.trim() !== '';

  const deviceFiltered = devices.filter(d =>
    d.name.toLowerCase().includes(deviceInput.toLowerCase())
  );
  const serviceFiltered = services.filter(s =>
    s.name.toLowerCase().includes(serviceInput.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!deviceInput.trim()) { setError('Please select or enter a device.'); return; }
    if (isNewDevice && !newDeviceBrand.trim()) { setError('Please enter a brand for the new device.'); return; }
    if (isNewDevice && !newDeviceCategory.trim()) { setError('Please enter a category for the new device.'); return; }
    if (!serviceInput.trim()) { setError('Please select or enter a service.'); return; }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) { setError('Please enter a valid price (0 or greater).'); return; }

    setIsSubmitting(true);
    try {
      let resolvedDeviceId = isNewDevice ? '' : deviceId;
      let resolvedServiceId = isNewService ? '' : serviceId;

      if (isNewDevice) {
        resolvedDeviceId = await priceSheetService.createDevice(deviceInput.trim(), newDeviceBrand.trim(), newDeviceCategory.trim());
      }
      if (isNewService) {
        resolvedServiceId = await priceSheetService.createService(serviceInput.trim());
      }

      if (isEditMode && editRow) {
        await priceSheetService.updatePriceEntry(editRow.id, resolvedDeviceId, resolvedServiceId, priceNum);
      } else {
        await priceSheetService.createPriceEntry(resolvedDeviceId, resolvedServiceId, priceNum);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const dropdownClass = 'absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-auto mt-1';
  const optionClass = 'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white';
  const selectedOptionClass = 'px-3 py-2 text-sm cursor-pointer bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-gray-900 dark:text-white';

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Price Entry' : 'Add Price Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {isLoadingLists ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-4">

              {/* Device combobox */}
              <div>
                <label className={labelClass}>Device</label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Type to search or create new..."
                    value={deviceInput}
                    onChange={(e) => {
                      setDeviceInput(e.target.value);
                      setDeviceId('');
                      setDeviceOpen(true);
                    }}
                    onFocus={() => setDeviceOpen(true)}
                    onBlur={() => setTimeout(() => setDeviceOpen(false), 150)}
                    autoComplete="off"
                  />
                  {deviceOpen && (deviceFiltered.length > 0 || deviceInput.trim()) && (
                    <ul className={dropdownClass}>
                      {deviceFiltered.map(d => (
                        <li
                          key={d.id}
                          onMouseDown={(e) => { e.preventDefault(); setDeviceId(d.id); setDeviceInput(d.name); setDeviceOpen(false); }}
                          className={deviceId === d.id ? selectedOptionClass : optionClass}
                        >
                          {d.name}
                        </li>
                      ))}
                      {deviceInput.trim() && !devices.find(d => d.name.toLowerCase() === deviceInput.trim().toLowerCase()) && (
                        <li
                          onMouseDown={(e) => { e.preventDefault(); setDeviceId(''); setDeviceOpen(false); }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-green-600 dark:text-green-400 italic"
                        >
                          Create "{deviceInput}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Brand + Category — only shown when creating a new device */}
                {isNewDevice && (
                  <div className="mt-2 space-y-2 pl-3 border-l-2 border-green-500">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Brand (e.g. Apple, Samsung)"
                      value={newDeviceBrand}
                      onChange={(e) => setNewDeviceBrand(e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Category (e.g. Phone, Tablet)"
                      value={newDeviceCategory}
                      onChange={(e) => setNewDeviceCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Service combobox */}
              <div>
                <label className={labelClass}>Service</label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Type to search or create new..."
                    value={serviceInput}
                    onChange={(e) => {
                      setServiceInput(e.target.value);
                      setServiceId('');
                      setServiceOpen(true);
                    }}
                    onFocus={() => setServiceOpen(true)}
                    onBlur={() => setTimeout(() => setServiceOpen(false), 150)}
                    autoComplete="off"
                  />
                  {serviceOpen && (serviceFiltered.length > 0 || serviceInput.trim()) && (
                    <ul className={dropdownClass}>
                      {serviceFiltered.map(s => (
                        <li
                          key={s.id}
                          onMouseDown={(e) => { e.preventDefault(); setServiceId(s.id); setServiceInput(s.name); setServiceOpen(false); }}
                          className={serviceId === s.id ? selectedOptionClass : optionClass}
                        >
                          {s.name}
                        </li>
                      ))}
                      {serviceInput.trim() && !services.find(s => s.name.toLowerCase() === serviceInput.trim().toLowerCase()) && (
                        <li
                          onMouseDown={(e) => { e.preventDefault(); setServiceId(''); setServiceOpen(false); }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-green-600 dark:text-green-400 italic"
                        >
                          Create "{serviceInput}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className={labelClass}>Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
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
              disabled={isSubmitting || isLoadingLists}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagePriceModal;
