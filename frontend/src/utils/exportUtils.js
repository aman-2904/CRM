// Export data to CSV file
export const exportToCSV = (data, filename, columns) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
        columns.map(c => {
            let value = c.accessor ? c.accessor(row) : row[c.key];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
};

// Export to PDF using browser print
export const exportToPDF = (elementId, title) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        alert('No content to export');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h1 { color: #1e40af; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                th { background: #f3f4f6; font-weight: bold; }
                .stat-card { display: inline-block; padding: 15px; margin: 10px; border: 1px solid #e5e7eb; border-radius: 8px; min-width: 120px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
                .stat-label { font-size: 12px; color: #6b7280; }
                @media print {
                    button, .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p style="color: #6b7280;">Generated on ${new Date().toLocaleString()}</p>
            ${printContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

// Format currency
export const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num || 0);
};
