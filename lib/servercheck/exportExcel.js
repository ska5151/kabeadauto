import * as XLSX from "xlsx";
import { FOLDER_ROWS, STAT_COLUMNS } from "./constants.js";
import { formatStatValue } from "./stats.js";

export function downloadStatsAsExcel(result) {
  const headerRow = ["폴더", ...STAT_COLUMNS.map((col) => col.label)];

  const dataRows = FOLDER_ROWS.map((folderKey) => {
    const row = result.rows[folderKey];
    return [
      folderKey,
      ...STAT_COLUMNS.map((col) => {
        const value = row[col.key];
        return value === null ? "" : formatStatValue(value);
      }),
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "통계");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `servercheck-stats-${date}.xlsx`);
}
