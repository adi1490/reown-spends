import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new NextResponse('Unauthorized session.', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const search = searchParams.get('search') || '';
    const categoriesParam = searchParams.get('categories') || '';
    const paidByParam = searchParams.get('paid_by') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const supabase = getSupabaseAdmin();

    // 1. Fetch expenses data matching identical filters
    let query = supabase
      .from('expenses')
      .select('*, users(name)')
      .order('date', { ascending: false });

    if (search) {
      query = query.or(`vendor.ilike.%${search}%,description.ilike.%${search}%,notes.ilike.%${search}%`);
    }
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        query = query.in('category', categories);
      }
    }
    if (paidByParam) {
      const paidBy = paidByParam.split(',').map(p => p.trim()).filter(Boolean);
      if (paidBy.length > 0) {
        query = query.in('paid_by', paidBy);
      }
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: dbExpenses, error } = await query;
    if (error) {
      console.error('Database query error during export:', error.message);
      return new NextResponse('Database query error.', { status: 500 });
    }

    const expenses = (dbExpenses || []).map((exp: any) => ({
      id: exp.id,
      date: exp.date,
      amount: parseFloat(exp.amount),
      category: exp.category,
      paid_by: exp.paid_by,
      vendor: exp.vendor,
      description: exp.description,
      notes: exp.notes || '',
      receipt: exp.receipt_name || 'None',
      logged_by: exp.users?.name || 'Unknown User'
    }));

    const totalSum = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 2. Format 1: CSV Export
    if (format === 'csv') {
      const csvHeaders = ['Date', 'Amount (INR)', 'Category', 'Paid By', 'Vendor', 'Description', 'Notes', 'Receipt File', 'Logged By'];
      const csvRows = expenses.map(e => [
        e.date,
        e.amount.toFixed(2),
        `"${e.category.replace(/"/g, '""')}"`,
        `"${e.paid_by.replace(/"/g, '""')}"`,
        `"${e.vendor.replace(/"/g, '""')}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.notes.replace(/"/g, '""')}"`,
        `"${e.receipt.replace(/"/g, '""')}"`,
        `"${e.logged_by.replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reown-spends-export.csv"'
        }
      });
    }

    // 3. Format 2: Markdown Table (.md)
    if (format === 'md') {
      const mdDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' });
      
      let mdContent = `# reOWN Spends Export Ledger\n`;
      mdContent += `*Export Date: ${mdDate} IST*\n`;
      mdContent += `*Filter Parameters: Search="${search || 'None'}", Categories="${categoriesParam || 'All'}", Paid By="${paidByParam || 'All'}"*\n\n`;
      
      mdContent += `| Date | Vendor | Category | Paid By | Amount (INR) | Logged By | Description |\n`;
      mdContent += `| :--- | :--- | :--- | :--- | :---: | :--- | :--- |\n`;

      expenses.forEach(e => {
        mdContent += `| ${e.date} | ${e.vendor} | ${e.category} | ${e.paid_by} | **₹${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** | ${e.logged_by} | ${e.description.replace(/\n/g, ' ')} |\n`;
      });

      mdContent += `| **TOTAL** | | | | **₹${totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** | | |\n`;

      return new NextResponse(mdContent, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reown-spends-export.md"'
        }
      });
    }

    // 4. Format 3: Excel Worksheet (.xlsx)
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      
      // Map data to neat row objects
      const dataRows = expenses.map(e => ({
        'Date': e.date,
        'Amount (INR)': e.amount,
        'Category': e.category,
        'Paid By': e.paid_by,
        'Vendor': e.vendor,
        'Description': e.description,
        'Notes': e.notes,
        'Receipt Attachment': e.receipt,
        'Logged By': e.logged_by
      }));

      // Add a summary row at the end
      dataRows.push({
        'Date': 'TOTAL SUM',
        'Amount (INR)': totalSum,
        'Category': '',
        'Paid By': '',
        'Vendor': '',
        'Description': '',
        'Notes': '',
        'Receipt Attachment': '',
        'Logged By': ''
      });

      const ws = XLSX.utils.json_to_sheet(dataRows);

      // Simple column widths auto-fitting
      const colsWidth = [
        { wch: 12 }, // Date
        { wch: 15 }, // Amount
        { wch: 22 }, // Category
        { wch: 25 }, // Paid By
        { wch: 20 }, // Vendor
        { wch: 30 }, // Description
        { wch: 20 }, // Notes
        { wch: 20 }, // Receipt
        { wch: 15 }  // Logged By
      ];
      ws['!cols'] = colsWidth;

      XLSX.utils.book_append_sheet(wb, ws, 'Ledger Registry');

      // Create separate summary statistics sheet
      const summaryData = [
        ['Metric Description', 'Value'],
        ['Total Transacted volume', totalSum],
        ['Total Transactions registered', expenses.length],
        ['Export Date (IST)', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Metrics');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="reown-spends-export.xlsx"'
        }
      });
    }

    // 5. Format 4: PDF Export Loader (Redirects to client-side page that renders it gorgeously using jsPDF)
    if (format === 'pdf') {
      // Return an HTML template containing the loaded data that immediately compiles the PDF client-side!
      // This is an extremely elegant solution that runs inside the browser, allowing accurate font downloads, 
      // full browser printing support, and clean JS executing without missing standard DOM properties!
      
      const payloadString = JSON.stringify(expenses);
      const todayStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>reOWN Spends A4 PDF Export</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js"></script>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #F9F8F5; color: #111; }
            .loader { border: 4px solid #F2F1EE; border-top: 4px solid #feb904; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <h2>Compiling A4 PDF Document...</h2>
          <p>Please wait while we format the ledger entries for print.</p>

          <script>
            window.onload = function() {
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
              });

              const rawData = ${payloadString};
              const totalSum = ${totalSum};
              const dateString = "${todayStr}";

              // 1. Draw sleek header
              doc.setFillColor(254, 185, 4); // #feb904 Accent color
              doc.rect(14, 14, 8, 8, 'F'); // Draw re logo square

              doc.setTextColor(0, 0, 0);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(16);
              doc.text("reOWN Spends", 25, 20);

              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              doc.setTextColor(100, 100, 100);
              doc.text("Private Ledger Registry · REOWN INFOCOM LLP", 25, 24);

              doc.text("Export Date: " + dateString + " (IST)", 196, 20, { align: 'right' });

              // Divider line
              doc.setDrawColor(229, 228, 224);
              doc.line(14, 30, 196, 30);

              // 2. Build AutoTable
              const tableHeaders = [['Date', 'Vendor', 'Category', 'Paid By', 'Amount (INR)']];
              const tableRows = rawData.map(e => [
                e.date,
                e.vendor,
                e.category,
                e.paid_by.split(' ')[0], // trim emoji label
                "Rs. " + e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
              ]);

              // Append total row
              tableRows.push([
                "TOTAL REGISTERED SUM",
                "",
                "",
                "",
                "Rs. " + totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })
              ]);

              doc.autoTable({
                head: tableHeaders,
                body: tableRows,
                startY: 36,
                theme: 'striped',
                headStyles: {
                  fillColor: [242, 241, 238],
                  textColor: [85, 85, 85],
                  fontStyle: 'bold',
                  fontSize: 8
                },
                bodyStyles: {
                  fontSize: 8,
                  textColor: [17, 17, 17]
                },
                columnStyles: {
                  0: { cellWidth: 25 },
                  1: { cellWidth: 35, fontStyle: 'bold' },
                  2: { cellWidth: 45 },
                  3: { cellWidth: 35 },
                  4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: function(data) {
                  // Format the last row as bold total sum row
                  if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [254, 255, 230]; // highlighting sum
                  }
                },
                margin: { left: 14, right: 14 },
                styles: { font: "helvetica" }
              });

              // 3. Add footer pagination
              const pageCount = doc.internal.getNumberOfPages();
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text("Page " + i + " of " + pageCount, 196, 285, { align: 'right' });
                doc.text("reOWN INFOCOM LLP · Confidential Internal Report", 14, 285);
              }

              // Trigger download
              doc.save("reown-spends-ledger-report.pdf");

              // Close browser tab/go back
              setTimeout(() => {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html'
        }
      });
    }

    return new NextResponse('Invalid export format specified.', { status: 400 });
  } catch (err: any) {
    console.error('Unhandled export generation error:', err);
    return new NextResponse('An unexpected error occurred.', { status: 500 });
  }
}
