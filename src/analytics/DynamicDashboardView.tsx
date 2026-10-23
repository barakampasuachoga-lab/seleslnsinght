import React, { useState, useMemo } from 'react';
import {
  AnalysisPlanItem,
  DashboardCard,
  DashboardFilterState,
  DatasetRecord,
} from './types';
import {
  computeDashboardCards,
  computeDynamicKPIs,
  filterDatasetRows,
} from './dashboardEngine';
import {
  generatePdfDashboardReport,
  generateOnePageSummaryPdf,
} from './pdfReportGenerator';
import { generatePptxDashboardPresentation } from './pptxReportGenerator';
import { PowerBiModal } from './PowerBiModal';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Users,
  Filter,
  Download,
  Sliders,
  AlertTriangle,
  FileText,
  Layers,
  Database,
  ArrowUpRight,
  Bookmark,
  Check,
  RefreshCw,
  FolderOpen,
  Loader2,
  Presentation,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface DynamicDashboardViewProps {
  dataset: DatasetRecord;
  plan: AnalysisPlanItem[];
  allDatasets: DatasetRecord[];
  onSelectDataset: (dataset: DatasetRecord) => void;
  onModifyQuestions: () => void;
  onSaveDashboard: (name: string, dataset: DatasetRecord, cards: DashboardCard[]) => void;
  currentUserName: string;
  userCompany?: string;
  onOpenDownloadCenter?: () => void;
}

export const DynamicDashboardView: React.FC<DynamicDashboardViewProps> = ({
  dataset,
  plan,
  allDatasets,
  onSelectDataset,
  onModifyQuestions,
  onSaveDashboard,
  currentUserName,
  userCompany,
  onOpenDownloadCenter,
}) => {
  // Active Filter State
  const [filters, setFilters] = useState<DashboardFilterState>({
    dateRange: 'All',
    selectedCategory: 'All',
    selectedRegion: 'All',
    selectedSegment: 'All',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState(`${dataset.name} Intelligence`);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingSummaryPdf, setIsGeneratingSummaryPdf] = useState(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const [isPowerBiModalOpen, setIsPowerBiModalOpen] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setExportSuccessMessage(null);
      const filename = await generatePdfDashboardReport({
        dataset,
        cards,
        kpis,
        filters,
        currentUserName,
        userCompany,
        reportTitle: `${dataset.name} - Complete Multi-Page Analytics Report`,
      });
      setExportSuccessMessage(`Complete PDF report "${filename}" downloaded successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateSummaryPdf = async () => {
    try {
      setIsGeneratingSummaryPdf(true);
      setExportSuccessMessage(null);
      const filename = await generateOnePageSummaryPdf({
        dataset,
        cards,
        kpis,
        filters,
        currentUserName,
        userCompany,
      });
      setExportSuccessMessage(`1-Page Summary Dashboard "${filename}" downloaded successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to generate 1-page summary PDF:', err);
    } finally {
      setIsGeneratingSummaryPdf(false);
    }
  };

  const handleGeneratePptx = async () => {
    try {
      setIsGeneratingPptx(true);
      setExportSuccessMessage(null);
      const filename = await generatePptxDashboardPresentation({
        dataset,
        cards,
        kpis,
        filters,
        currentUserName,
        userCompany,
        reportTitle: `${dataset.name} - Executive Presentation`,
      });
      setExportSuccessMessage(`PowerPoint presentation "${filename}" downloaded successfully!`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to generate PowerPoint:', err);
    } finally {
      setIsGeneratingPptx(false);
    }
  };


  // Extract distinct filter values dynamically from the dataset rows
  const distinctCategories = useMemo(() => {
    const col = dataset.columns.find(
      (c) => c.semanticRole === 'category' || c.name.toLowerCase().includes('category')
    )?.name;
    if (!col) return [];
    const set = new Set<string>();
    dataset.rows.forEach((r) => {
      const v = String(r[col] || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [dataset]);

  const distinctRegions = useMemo(() => {
    const col = dataset.columns.find(
      (c) => c.semanticRole === 'region' || c.name.toLowerCase().includes('region')
    )?.name;
    if (!col) return [];
    const set = new Set<string>();
    dataset.rows.forEach((r) => {
      const v = String(r[col] || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [dataset]);

  const distinctSegments = useMemo(() => {
    const col = dataset.columns.find(
      (c) => c.semanticRole === 'customer_segment' || c.name.toLowerCase().includes('segment')
    )?.name;
    if (!col) return [];
    const set = new Set<string>();
    dataset.rows.forEach((r) => {
      const v = String(r[col] || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [dataset]);

  const hasDateCol = useMemo(() => {
    return dataset.columns.some((c) => c.semanticRole === 'date');
  }, [dataset]);

  // Compute dynamic KPIs and dynamic cards
  const kpis = useMemo(() => {
    return computeDynamicKPIs(dataset, filters);
  }, [dataset, filters]);

  const cards = useMemo(() => {
    return computeDashboardCards(dataset, plan, filters);
  }, [dataset, plan, filters]);

  const handleTriggerSave = () => {
    onSaveDashboard(dashboardTitle, dataset, cards);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadDashboardExport = (format: 'markdown' | 'csv' | 'json') => {
    let content = '';
    let mime = 'text/plain';
    let ext = 'txt';

    const timestamp = new Date().toISOString();

    if (format === 'markdown') {
      content = `# SalesInsight Personalized Analytics Report
Dataset: ${dataset.name} (${dataset.filename})
Generated: ${timestamp}
Workspace: ${userCompany || 'Personal Workspace'}
Generated By: ${currentUserName}

================================================================================
1. EXECUTIVE METRICS & KPI AUDIT
================================================================================
${kpis.hasRevenue ? `- Total Revenue:           KSh ${kpis.headlineRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
${kpis.hasProfit ? `- Total Operating Profit:  KSh ${kpis.headlineProfit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
${kpis.hasProfit ? `- Profit Margin:           ${kpis.profitMarginPct}%` : ''}
- Active Rows Filtered:    ${kpis.activeRowCount.toLocaleString()} records
- Distinct Orders:         ${kpis.totalOrders.toLocaleString()} unique carts
${kpis.hasRevenue ? `- Average Order Value:     KSh ${kpis.averageOrderValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
${kpis.hasQuantity ? `- Total Units:             ${kpis.totalUnits.toLocaleString()} units` : ''}

================================================================================
2. QUESTION-DRIVEN BUSINESS FINDINGS
================================================================================
${cards
  .map(
    (c, idx) => `
Finding ${idx + 1}: ${c.title}
Category: ${c.category}
Question: "${c.question}"
Takeaway: ${c.interpretation}
${c.headlineValue ? `Headline Result: ${c.headlineValue}` : ''}
`
  )
  .join('\n')}
`;
      mime = 'text/markdown';
      ext = 'md';
    } else if (format === 'csv') {
      const rows = filterDatasetRows(dataset, filters);
      const headers = dataset.columns.map((c) => c.name);
      const csvLines = [headers.join(',')];

      rows.slice(0, 1000).forEach((row) => {
        const line = headers.map((h) => {
          const val = String(row[h] || '').replace(/"/g, '""');
          return `"${val}"`;
        });
        csvLines.push(line.join(','));
      });
      content = csvLines.join('\n');
      mime = 'text/csv';
      ext = 'csv';
    } else {
      content = JSON.stringify(
        {
          metadata: {
            title: dashboardTitle,
            dataset: dataset.name,
            filename: dataset.filename,
            context: dataset.context,
            generatedAt: timestamp,
            user: currentUserName,
            workspace: userCompany,
          },
          kpis,
          activeFilters: filters,
          cards,
        },
        null,
        2
      );
      mime = 'application/json';
      ext = 'json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesinsight_${dataset.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Dynamic Question-Driven Dashboard
              </span>
              <span className="text-xs text-slate-400 capitalize">
                Context: <strong className="text-slate-300">{dataset.context}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-3 mt-1.5">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {dataset.name}
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                {dataset.filename}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Synthesized from {dataset.rowCount.toLocaleString()} rows • {cards.length} tailored visualizations answering your selected business questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {allDatasets.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Switch:</span>
                <select
                  value={dataset.id}
                  onChange={(e) => {
                    const found = allDatasets.find((d) => d.id === e.target.value);
                    if (found) onSelectDataset(found);
                  }}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none"
                >
                  {allDatasets.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onModifyQuestions}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Refine Questions</span>
            </button>

            <button
              onClick={handleTriggerSave}
              className="px-3 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-500/20 transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Dashboard Saved!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* PROMINENT BUTTON: Download Complete PDF Report */}
            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-500/30 transition-all border border-blue-400/30 shrink-0 disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Download Complete PDF Report</span>
                </>
              )}
            </button>

            {/* Requested 1-Page Summarized Dashboard PDF */}
            <button
              onClick={handleGenerateSummaryPdf}
              disabled={isGeneratingSummaryPdf}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors disabled:opacity-60"
              title="One-page dashboard containing all graphs and charts summaries"
            >
              {isGeneratingSummaryPdf ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>1-Page Summary (PDF)</span>
            </button>

            {/* PowerPoint Presentation (.pptx) */}
            <button
              onClick={handleGeneratePptx}
              disabled={isGeneratingPptx}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
            >
              {isGeneratingPptx ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Generating .pptx...</span>
                </>
              ) : (
                <>
                  <Presentation className="w-3.5 h-3.5 text-white" />
                  <span>Download PowerPoint (.pptx)</span>
                </>
              )}
            </button>

            {/* Power BI Options */}
            <button
              onClick={() => setIsPowerBiModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Open Power BI Options</span>
            </button>

            {/* Download Center Link */}
            {onOpenDownloadCenter && (
              <button
                onClick={onOpenDownloadCenter}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Download Center</span>
              </button>
            )}

            {/* Raw Data Export Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1 border border-slate-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => handleDownloadDashboardExport('markdown')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Executive Briefing (.md)</span>
                </button>
                <button
                  onClick={() => handleDownloadDashboardExport('csv')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Raw Filtered Lines (.csv)</span>
                </button>
                <button
                  onClick={() => handleDownloadDashboardExport('json')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>Metrics Payload (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {exportSuccessMessage && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Dynamic KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.hasRevenue ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Revenue (KSh)</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              KSh {kpis.headlineRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Calculated</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 opacity-60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Revenue Column</span>
              <DollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Not in schema</div>
            <div className="text-[10px] text-slate-500 mt-1">N/A in current dataset</div>
          </div>
        )}

        {kpis.hasProfit ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Operating Profit (KSh)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              KSh {kpis.headlineProfit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              <span>Operating Earnings</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 opacity-60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Profit Column</span>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Not in schema</div>
            <div className="text-[10px] text-slate-500 mt-1">Gracefully adapted</div>
          </div>
        )}

        {kpis.hasProfit && kpis.hasRevenue ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Profit Margin</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div
              className={`text-xl font-bold tracking-tight ${
                kpis.profitMarginPct >= 10
                  ? 'text-emerald-400'
                  : kpis.profitMarginPct > 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {kpis.profitMarginPct}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>Operating Return</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Records</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {kpis.activeRowCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Filtered Rows</div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Distinct Orders</span>
            <ShoppingCart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {kpis.totalOrders.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Unique Transactions</div>
        </div>

        {kpis.hasRevenue ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Average Order Value</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              KSh {kpis.averageOrderValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Revenue / Cart</div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Columns</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {dataset.colCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">Schema Attributes</div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Accounts / Volume</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {kpis.hasCustomer
              ? `${kpis.totalCustomers} Accounts`
              : kpis.hasQuantity
              ? `${kpis.totalUnits.toLocaleString()} Units`
              : `${dataset.rowCount} Rows`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Volume Metric</div>
        </div>
      </div>

      {/* Dynamic Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Dynamic Filters:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasDateCol && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400">Date Range:</span>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Time Periods</option>
                <option value="Year 2026">Year 2026</option>
                <option value="Year 2025">Year 2025</option>
              </select>
            </div>
          )}

          {distinctCategories.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400">Category:</span>
              <select
                value={filters.selectedCategory}
                onChange={(e) => setFilters({ ...filters, selectedCategory: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Categories ({distinctCategories.length})</option>
                {distinctCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {distinctRegions.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400">Region:</span>
              <select
                value={filters.selectedRegion}
                onChange={(e) => setFilters({ ...filters, selectedRegion: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Regions ({distinctRegions.length})</option>
                {distinctRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {distinctSegments.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400">Segment:</span>
              <select
                value={filters.selectedSegment}
                onChange={(e) => setFilters({ ...filters, selectedSegment: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Segments ({distinctSegments.length})</option>
                {distinctSegments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(filters.dateRange !== 'All' ||
            filters.selectedCategory !== 'All' ||
            filters.selectedRegion !== 'All' ||
            filters.selectedSegment !== 'All') && (
            <button
              onClick={() =>
                setFilters({
                  dateRange: 'All',
                  selectedCategory: 'All',
                  selectedRegion: 'All',
                  selectedSegment: 'All',
                })
              }
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 bg-blue-950/60 border border-blue-800/60 rounded-lg"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Visualizations Grid Driven By Selected Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((card) => {
          const maxVal = Math.max(...card.data.map((d) => Math.abs(d.value)), 1);

          return (
            <div
              key={card.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-blue-400 border border-slate-800">
                      {card.category}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1.5 leading-snug">
                      {card.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800/80">
                    {card.chartType.toUpperCase()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 italic mb-4">
                  Question: "{card.question}"
                </div>

                {/* Warning Banner if present */}
                {card.warning && (
                  <div className="mb-4 p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{card.warning}</span>
                  </div>
                )}

                {/* Chart Rendering Area */}
                <div className="min-h-[180px] flex flex-col justify-center my-2">
                  {/* KPI Spotlight Card */}
                  {card.chartType === 'kpi' && (
                    <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-2">
                      <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
                        {card.headlineValue || (card.data[0] ? `$${card.data[0].value.toLocaleString()}` : 'Computed')}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{card.headlineSub || card.xAxisLabel}</div>
                    </div>
                  )}

                  {/* Horizontal Bar Chart (e.g. Products / Loss SKUs) */}
                  {card.chartType === 'horizontal_bar' && (
                    <div className="space-y-2.5">
                      {card.data.map((d, i) => {
                        const pct = Math.min(100, Math.max(5, (Math.abs(d.value) / maxVal) * 100));
                        const isLoss = d.value < 0;

                        return (
                          <div key={i} className="text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="truncate max-w-[220px] font-medium" title={d.label}>
                                {i + 1}. {d.label}
                              </span>
                              <span className={`font-bold font-mono ${isLoss ? 'text-rose-400' : 'text-slate-100'}`}>
                                {isLoss ? '-' : ''}KSh {Math.abs(d.value).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isLoss ? 'bg-rose-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vertical Bar Chart (Categories, Regions, Segments) */}
                  {card.chartType === 'bar' && (
                    <div className="space-y-3">
                      <div className="flex items-end justify-between gap-3 h-36 pt-4 pb-2 px-2 border-b border-slate-800">
                        {card.data.map((d, i) => {
                          const heightPct = Math.min(100, Math.max(12, (Math.abs(d.value) / maxVal) * 100));
                          const isLoss = d.value < 0;

                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                              {/* Hover tooltip value */}
                              <span className="text-[10px] font-mono text-slate-300 mb-1 opacity-90">
                                {card.unit === 'KSh' || card.unit === '$' ? 'KSh ' : ''}
                                {Math.abs(d.value) >= 1000
                                  ? `${(d.value / 1000).toFixed(1)}k`
                                  : d.value.toLocaleString('en-KE')}
                                {card.unit === '%' ? '%' : ''}
                              </span>
                              <div
                                className={`w-full max-w-[42px] rounded-t transition-all ${
                                  isLoss
                                    ? 'bg-rose-500 group-hover:bg-rose-400'
                                    : 'bg-blue-600 group-hover:bg-blue-500'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-between gap-2 px-2 text-[11px] text-slate-400 font-medium">
                        {card.data.map((d, i) => (
                          <div key={i} className="flex-1 text-center truncate" title={d.label}>
                            {d.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Line Chart / Time Series */}
                  {card.chartType === 'line' && (
                    <div className="space-y-3">
                      <div className="relative h-36 w-full pt-4 pb-2 px-2 flex items-end border-b border-slate-800">
                        {/* Render SVG Line */}
                        <svg className="w-full h-full overflow-visible">
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={card.data
                              .map((d, i) => {
                                const x = (i / Math.max(1, card.data.length - 1)) * 100;
                                const y = 100 - (d.value / maxVal) * 80 - 10;
                                return `${x}%,${y}%`;
                              })
                              .join(' ')}
                          />
                          {card.data.map((d, i) => {
                            const x = `${(i / Math.max(1, card.data.length - 1)) * 100}%`;
                            const y = `${100 - (d.value / maxVal) * 80 - 10}%`;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                className="fill-blue-400 stroke-slate-900 stroke-2"
                              />
                            );
                          })}
                        </svg>
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-between px-2 text-[10px] text-slate-400 font-mono">
                        {card.data.map((d, i) => (
                          <div key={i} className="truncate">
                            {d.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scatter / Grouped Discount Sensitivity Chart */}
                  {card.chartType === 'scatter_grouped' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        {card.data.map((d, i) => {
                          const isNegative = d.value < 0;
                          return (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                                isNegative
                                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="text-[10px] font-semibold text-slate-400 truncate">
                                {d.label}
                              </span>
                              <div
                                className={`text-sm font-bold font-mono my-1 ${
                                  isNegative ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {d.value >= 0 ? '+' : '-'}KSh {Math.abs(d.value).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                              </div>
                              <span className="text-[10px] text-slate-400">{d.extra}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Analytical Takeaway Box */}
              <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-300">
                <span className="font-semibold text-blue-400 block mb-0.5">Operational Finding &amp; Decision Summary:</span>
                <span className="leading-relaxed text-slate-300 text-[11px]">{card.interpretation}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Power BI Integration Modal */}
      <PowerBiModal
        isOpen={isPowerBiModalOpen}
        onClose={() => setIsPowerBiModalOpen(false)}
        dataset={dataset}
        cards={cards}
        currentUserName={currentUserName}
        userEmail={userCompany || 'Enterprise Workspace'}
        onTriggerPdfExport={handleGeneratePdf}
        onTriggerPptxExport={handleGeneratePptx}
      />
    </div>
  );
};

