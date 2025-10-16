/**
 * Export data to CSV file
 * Utility for exporting orders and other data to CSV format
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map(col => col.label);
  const csvHeader = headers.join(',');

  // Create CSV rows
  const csvRows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Apply custom formatting if provided
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape
      const stringValue = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

/**
 * Format datetime for CSV export
 */
export function formatDateTimeForCSV(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: any[], filename?: string): void {
  const columns: ExportColumn[] = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'order_number', label: 'Order Number' },
    { key: 'tracking_number', label: 'Tracking Number' },
    { key: 'store_name', label: 'Store' },
    { key: 'courier_name', label: 'Courier' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_email', label: 'Customer Email' },
    { key: 'order_status', label: 'Status' },
    { key: 'order_date', label: 'Order Date', format: formatDateForCSV },
    { key: 'delivery_date', label: 'Delivery Date', format: formatDateForCSV },
    { key: 'delivery_address', label: 'Delivery Address' },
    { key: 'postal_code', label: 'Postal Code' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'created_at', label: 'Created At', format: formatDateTimeForCSV },
  ];

  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `orders_${date}.csv`;

  exportToCSV(orders, columns, filename || defaultFilename);
}
