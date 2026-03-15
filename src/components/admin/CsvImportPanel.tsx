import React, { useState, useEffect, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { getMetricDefinitions, MetricDefinition } from "../../services/api/metricDefinitions";
import { bulkUpsertSalesFromCsv } from "../../services/api/sales";
import { useAuth } from "../../context/AuthContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ParsedRow {
  store_id: string;
  date: string;
  metrics: Record<string, number>;
}

interface ValidationResult {
  rows: ParsedRow[];
  errors: string[];
}

function parseCsv(text: string, knownMetricKeys: Set<string>): ValidationResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must have a header row and at least one data row."] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  // Validate required columns
  const errors: string[] = [];
  if (!headers.includes("store_id")) errors.push("Missing required column: store_id");
  if (!headers.includes("date")) errors.push("Missing required column: date");
  if (errors.length > 0) return { rows: [], errors };

  // Check for unknown metric columns
  const metricHeaders = headers.filter((h) => h !== "store_id" && h !== "date");
  const unknownKeys = metricHeaders.filter((h) => !knownMetricKeys.has(h));
  if (unknownKeys.length > 0) {
    return {
      rows: [],
      errors: [
        `Unknown metric column(s): ${unknownKeys.join(", ")}. ` +
          "Create these metrics in the Metric Definitions panel first, then re-import.",
      ],
    };
  }

  const rows: ParsedRow[] = [];
  const rowErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cells = rawLine.split(",").map((c) => c.trim());
    const get = (col: string) => cells[headers.indexOf(col)] ?? "";

    const store_id = get("store_id");
    const date = get("date");

    if (!UUID_RE.test(store_id)) {
      rowErrors.push(`Row ${i}: invalid store_id "${store_id}"`);
      continue;
    }
    if (!DATE_RE.test(date)) {
      rowErrors.push(`Row ${i}: invalid date "${date}" (expected YYYY-MM-DD)`);
      continue;
    }

    const metrics: Record<string, number> = {};
    let rowHasError = false;
    for (const key of metricHeaders) {
      const raw = get(key);
      if (raw === "" || raw === undefined) continue; // absent = skip
      const num = Number(raw);
      if (isNaN(num)) {
        rowErrors.push(`Row ${i}: invalid value "${raw}" for column "${key}"`);
        rowHasError = true;
      } else {
        metrics[key] = num;
      }
    }
    if (!rowHasError) {
      rows.push({ store_id, date, metrics });
    }
  }

  return { rows, errors: rowErrors };
}

const CsvImportPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinition[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "done">("idle");
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  useEffect(() => {
    getMetricDefinitions().then(setMetricDefinitions);
  }, []);

  const knownMetricKeys = new Set(metricDefinitions.map((m) => m.key));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedRows(null);
    setParseErrors([]);
    setImportResult(null);
    setImportStatus("idle");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCsv(text, knownMetricKeys);
      setParsedRows(result.rows);
      setParseErrors(result.errors);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsedRows || parsedRows.length === 0 || !currentUser) return;
    setImportStatus("importing");
    const result = await bulkUpsertSalesFromCsv(parsedRows, currentUser.id);
    setImportResult(result);
    setImportStatus("done");
    setParsedRows(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleReset() {
    setParsedRows(null);
    setParseErrors([]);
    setFileName(null);
    setImportResult(null);
    setImportStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canImport = parsedRows && parsedRows.length > 0 && parseErrors.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        CSV Sales Import
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Import daily sales records from a CSV file. Required columns:{" "}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">store_id</code>,{" "}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">date</code> (YYYY-MM-DD).
        Additional columns must match metric keys (e.g.{" "}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">gross_revenue</code>,{" "}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">accessory_sales</code>).
        Empty cells are skipped.
      </p>

      {/* File input */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md cursor-pointer hover:bg-primary-700">
          <Upload size={16} />
          Choose CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {fileName && (
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <FileText size={14} />
            {fileName}
          </span>
        )}
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {parseErrors.length} issue{parseErrors.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.slice(0, 10).map((err, i) => (
              <li key={i} className="text-xs text-red-700 dark:text-red-400">
                {err}
              </li>
            ))}
            {parseErrors.length > 10 && (
              <li className="text-xs text-red-500">…and {parseErrors.length - 10} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Preview */}
      {parsedRows && parsedRows.length > 0 && parseErrors.length === 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <strong>{parsedRows.length}</strong> row{parsedRows.length !== 1 ? "s" : ""} ready to import. Preview (first 5):
          </p>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">store_id</th>
                  <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">date</th>
                  <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">metrics</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-2 py-1 font-mono text-gray-700 dark:text-gray-300">
                      {row.store_id.substring(0, 8)}…
                    </td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{row.date}</td>
                    <td className="px-2 py-1 text-gray-500 dark:text-gray-400">
                      {Object.entries(row.metrics)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import result */}
      {importStatus === "done" && importResult && (
        <div
          className={`mb-4 p-3 rounded-md border ${
            importResult.errors.length === 0
              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
              : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Import complete — {importResult.inserted} row{importResult.inserted !== 1 ? "s" : ""} saved.
            </p>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {importResult.errors.map((err, i) => (
                <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                  {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {canImport && (
          <button
            onClick={handleImport}
            disabled={importStatus === "importing"}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importStatus === "importing" ? "Importing…" : `Import ${parsedRows!.length} rows`}
          </button>
        )}
        {(fileName || importResult) && (
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default CsvImportPanel;
