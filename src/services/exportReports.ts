import jsPDF from 'jspdf';
import { BudgetLimit, Expense, UserProfile } from '../types';
import { formatMoney } from './currency';

export const exportExpensesToCSV = (expenses: Expense[], homeCurrency: string = 'INR') => {
  const headers = [
    'Transaction ID',
    'Date',
    'Description',
    'Category',
    'Original Amount',
    'Original Currency',
    `Converted Amount (${homeCurrency})`,
    'Payment Method',
    'Voice Logged',
    'Voice Transcript',
    'Tags',
    'Sync Status',
  ];

  const escapeCSV = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map((e) => [
    escapeCSV(e.id),
    escapeCSV(e.date),
    escapeCSV(e.description),
    escapeCSV(e.category),
    escapeCSV(e.originalAmount),
    escapeCSV(e.originalCurrency),
    escapeCSV(e.convertedAmount),
    escapeCSV(e.paymentMethod),
    escapeCSV(e.isVoiceInput ? 'Yes' : 'No'),
    escapeCSV(e.voiceTranscript || ''),
    escapeCSV(e.tags.join(', ')),
    escapeCSV(e.syncStatus),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportExpensesToPDF = (
  expenses: Expense[],
  user: UserProfile,
  budgets: BudgetLimit[],
  reportTitle: string = 'Financial Expense Summary'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(0, 0, 24); 
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.text('ExpeVoice', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${reportTitle.toUpperCase()} • GENERATED ON ${new Date().toLocaleDateString()}`, 14, 20);

  y = 38;

  // User & Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Account: ${user.name} (${user.email})`, 18, y + 8);
  doc.text(`Home Currency: ${user.homeCurrency}`, 18, y + 15);
  doc.text(`Total Transactions: ${expenses.length}`, 18, y + 22);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  const voiceLoggedCount = expenses.filter((e) => e.isVoiceInput).length;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Total Spending: ${formatMoney(totalSpent, user.homeCurrency)}`, 110, y + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`AI Voice-Logged: ${voiceLoggedCount} items (${Math.round((voiceLoggedCount / (expenses.length || 1)) * 100)}%)`, 110, y + 18);

  y += 34;

  // Section: Category Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CATEGORY SPENDING SUMMARY', 14, y);
  y += 6;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.convertedAmount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Mini summary pills/table
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  sortedCategories.slice(0, 6).forEach(([cat, amt]) => {
    const pct = Math.round((amt / (totalSpent || 1)) * 100);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(15, 23, 42);
    doc.text(cat, 18, y + 4.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${pct}% of total`, 90, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatMoney(amt, user.homeCurrency), pageWidth - 45, y + 4.5);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });

  y += 6;

  // Transactions Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMIZED TRANSACTIONS', 14, y);
  y += 6;

  // Table header bar
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('DATE', 17, y + 5);
  doc.text('DESCRIPTION', 42, y + 5);
  doc.text('CATEGORY', 105, y + 5);
  doc.text('ORIGINAL', 140, y + 5);
  doc.text(`CONVERTED (${user.homeCurrency})`, 165, y + 5);

  y += 8;

  // Table rows
  doc.setFontSize(8);
  expenses.slice(0, 35).forEach((e, index) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
      // Re-add header bar
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, pageWidth - 28, 7.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('DATE', 17, y + 5);
      doc.text('DESCRIPTION', 42, y + 5);
      doc.text('CATEGORY', 105, y + 5);
      doc.text('ORIGINAL', 140, y + 5);
      doc.text(`CONVERTED (${user.homeCurrency})`, 165, y + 5);
      y += 8;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(e.date, 17, y + 3.5);

    // Truncate description if too long
    const desc = e.description.length > 32 ? e.description.slice(0, 30) + '...' : e.description;
    doc.text(desc, 42, y + 3.5);

    doc.text(e.category, 105, y + 3.5);

    doc.text(`${e.originalAmount} ${e.originalCurrency}`, 140, y + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatMoney(e.convertedAmount, user.homeCurrency), 165, y + 3.5);

    y += 7;
  });

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Exported from Voice Expense Tracker • Real-time Multi-Currency & Voice NLP Financial Engine', 14, 290);

  doc.save(`expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
