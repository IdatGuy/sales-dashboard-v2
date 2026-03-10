import React, { useEffect, useMemo, useRef, useState } from 'react';
import { priceSheetService, PriceSheetRowWithNames, DeviceWithMeta } from '../../services/api/priceSheet';

interface PrePopulate {
  deviceId: string;
  deviceName: string;
  serviceId: string;
  serviceName: string;
}

interface PriceSheetGridProps {
  refreshKey: number;
  onCellClick: (row: PriceSheetRowWithNames) => void;
  onAddClick: (prePopulate: PrePopulate) => void;
}

const PriceSheetGrid: React.FC<PriceSheetGridProps> = ({ refreshKey, onCellClick, onAddClick }) => {
  const [allRows, setAllRows] = useState<PriceSheetRowWithNames[]>([]);
  const [devices, setDevices] = useState<DeviceWithMeta[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    startY.current = e.pageY - scrollRef.current.offsetTop;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollTop.current = scrollRef.current.scrollTop;
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const y = e.pageY - scrollRef.current.offsetTop;
    const walkX = x - startX.current;
    const walkY = y - startY.current;
    if (Math.abs(walkX) > 4 || Math.abs(walkY) > 4) didDrag.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walkX;
    scrollRef.current.scrollTop = scrollTop.current - walkY;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      priceSheetService.getPriceSheetsWithNames(),
      priceSheetService.getAllDevices(),
      priceSheetService.getAllServices(),
    ])
      .then(([rows, devs, svcs]) => {
        setAllRows(rows);
        setDevices(devs);
        setServices(svcs);
      })
      .catch((err) => console.error('Error loading grid data:', err))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  const brands = useMemo(
    () => Array.from(new Set(devices.map((d) => d.brand).filter(Boolean))).sort(),
    [devices]
  );

  const filteredDevices = useMemo(
    () => (selectedBrand ? devices.filter((d) => d.brand === selectedBrand) : devices),
    [devices, selectedBrand]
  );

  const priceMap = useMemo(() => {
    const map = new Map<string, PriceSheetRowWithNames>();
    allRows.forEach((r) => map.set(`${r.device_id}|${r.service_id}`, r));
    return map;
  }, [allRows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm">Loading grid...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={scrollRef}
        className="overflow-auto rounded-lg shadow select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <table className="min-w-max border-collapse bg-white dark:bg-gray-800">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="sticky left-0 top-0 z-20 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-b border-r border-gray-200 dark:border-gray-700">
                Device
              </th>
              {services.map((s) => (
                <th
                  key={s.id}
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap min-w-[90px] border-b border-r border-gray-200 dark:border-gray-700"
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDevices.length === 0 ? (
              <tr>
                <td
                  colSpan={services.length + 1}
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No devices found{selectedBrand ? ` for brand "${selectedBrand}"` : ''}.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/30 px-4 py-1.5 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                    {device.name}
                  </td>
                  {services.map((service) => {
                    const row = priceMap.get(`${device.id}|${service.id}`);
                    return row ? (
                      <td
                        key={service.id}
                        onClick={() => { if (!didDrag.current) onCellClick(row); }}
                        className="px-2 py-1.5 text-center text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors whitespace-nowrap border-r border-gray-200 dark:border-gray-700"
                      >
                        {row.price == null ? 'N/A' : `$${Number(row.price).toFixed(2)}`}
                      </td>
                    ) : (
                      <td
                        key={service.id}
                        className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700"
                      >
                        <button
                          onClick={() => {
                            if (didDrag.current) return;
                            onAddClick({
                              deviceId: device.id,
                              deviceName: device.name,
                              serviceId: service.id,
                              serviceName: service.name,
                            });
                          }}
                          className="text-xs text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2 py-0.5 rounded transition-colors"
                        >
                          + Add
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceSheetGrid;
