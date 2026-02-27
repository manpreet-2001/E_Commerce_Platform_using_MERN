/**
 * Escape a value for CSV (wrap in quotes if contains comma, newline, or quote).
 */
function escapeCsvValue(value) {
  if (value == null) return '';
  const str = String(value).trim();
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build CSV string from an array of row arrays (each row is an array of cell values).
 */
export function buildCsv(rows) {
  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\r\n');
}

/**
 * Trigger browser download of a string as a CSV file.
 */
export function downloadCsv(csvString, filename = 'export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
