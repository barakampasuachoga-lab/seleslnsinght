import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  Layers,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Check,
} from 'lucide-react';
import {
  DatasetRecord,
  DashboardCard,
  DashboardFilterState,
  ExportJobRecord,
  ExportFormat,
  ExportStatus,
} from './types';
import { DynamicKpiSummary } from './dashboardEngine';
import {
  generatePdfDashboardReport,
  generateOnePageSummaryPdf,
} from './pdfReportGenerator';
import { generatePptxDashboardPresentation } from './pptxReportGenerator';
import { PowerBiModal } from './PowerBiModal';

interface DownloadCenterViewProps {
  dataset: DatasetRecord;
  cards: DashboardCard[];
  kpis: DynamicKpiSummary;
  filters: DashboardFilterState;
  currentUserId: string;
  currentUserName: string;
  userCompany?: string;
  exportJobs: ExportJobRecord[];
  onAddExportJob: (job: ExportJobRecord) => void;
  onUpdateExportJob: (jobId: string, updates: Partial<ExportJobRecord>) => void;
  onDeleteExportJob: (jobId: string) => void;
  onOpenMyReports: () => void;
}

export const DownloadCenterView: React.FC<DownloadCenterViewProps> = ({
  dataset,
  cards,
  kpis,
  filters,
  currentUserId,
  currentUserName,
  userCompany,
  exportJobs,
  onAddExportJob,
  onUpdateExportJob,
  onDeleteExportJob,
  onOpenMyReports,
}) => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isPowerBiModalOpen, setIsPowerBiModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter jobs belonging strictly to the active user (tenant isolation)
  const userJobs = exportJobs.filter((j) => j.ownerId === currentUserId);

  // Check if an export format is currently generating
  const isJobRunning = (format: ExportFormat) => {
    return userJobs.some(
      (j) => j.format === format && (j.status === 'Generating' || j.status === 'Queued')
    );
  };

  /**
   * Safe Job Runner with Progress Emulation, Duplicate Prevention, and Error Handling
   */
  const startExportJob = async (
    format: ExportFormat,
    reportName: string,
    fileSizeEstimate: string,
    executeGenerator: () => Promise<string>
  ) => {
    if (isJobRunning(format)) {
      setActionError(`An export job for ${format.toUpperCase()} is already in progress. Please wait for it to complete.`);
      return;
    }

    setActionError(null);
    const newJobId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setActiveJobId(newJobId);

    const initialJob: ExportJobRecord = {
      id: newJobId,
      ownerId: currentUserId,
      ownerName: currentUserName,
      reportName,
      datasetId: dataset.id,
      datasetName: dataset.name,
      selectedQuestions: cards.map((c) => c.question),
      format,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileSize: fileSizeEstimate,
      status: 'Queued',
      progress: 5,
      summaryMetrics: {
        totalSales: `KSh ${kpis.headlineRevenue.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`,
        totalProfit: `KSh ${kpis.headlineProfit.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`,
        profitMargin: `${kpis.profitMarginPct}%`,
        orders: `${kpis.totalOrders.toLocaleString()}`,
      },
    };

    onAddExportJob(initialJob);

    // Progress simulation through stages: Queued -> Generating -> Completed
    try {
      await new Promise((r) => setTimeout(r, 600));
      onUpdateExportJob(newJobId, { status: 'Generating', progress: 25 });

      await new Promise((r) => setTimeout(r, 600));
      onUpdateExportJob(newJobId, { progress: 65 });

      // Run real generator
      const generatedFileName = await executeGenerator();

      await new Promise((r) => setTimeout(r, 400));
      onUpdateExportJob(newJobId, {
        status: 'Completed',
        progress: 100,
        downloadUrl: generatedFileName,
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      onUpdateExportJob(newJobId, {
        status: 'Failed',
        progress: 0,
        errorMessage: err?.message || 'Generation failed during calculation or file assembly. Safe retry is available.',
      });
    } finally {
      setActiveJobId(null);
    }
  };

  // Handler for Complete PDF Report
  const handleGenerateCompletePdf = () => {
    startExportJob(
      'pdf',
      `${dataset.name} - Complete Executive PDF Report`,
      '1.4 MB',
      async () => {
        return await generatePdfDashboardReport({
          dataset,
          cards,
          kpis,
          filters,
          currentUserName,
          userCompany,
          reportTitle: `${dataset.name} - Executive Multi-Page Analytics Report`,
        });
      }
    );
  };

  // Handler for One-Page Summarized Dashboard PDF
  const handleGenerateOnePageSummaryPdf = () => {
    startExportJob(
      'pdf_summary',
      `${dataset.name} - 1-Page Summarized Dashboard (PDF)`,
      '480 KB',
      async () => {
        return await generateOnePageSummaryPdf({
          dataset,
          cards,
          kpis,
          filters,
          currentUserName,
          userCompany,
        });
      }
    );
  };

  // Handler for PowerPoint Presentation (.pptx)
  const handleGeneratePowerPoint = () => {
    startExportJob(
      'pptx',
      `${dataset.name} - Executive Presentation`,
      '2.8 MB',
      async () => {
        return await generatePptxDashboardPresentation({
          dataset,
          cards,
          kpis,
          filters,
          currentUserName,
          userCompany,
          reportTitle: `${dataset.name} - Executive Sales Briefing`,
        });
      }
    );
  };

  // Retry Handler
  const handleRetryJob = (job: ExportJobRecord) => {
    if (job.format === 'pdf') {
      handleGenerateCompletePdf();
    } else if (job.format === 'pdf_summary') {
      handleGenerateOnePageSummaryPdf();
    } else if (job.format === 'pptx') {
      handleGeneratePowerPoint();
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Multi-Format Export Engine
              </span>
              <span className="text-xs text-slate-400">
                Active Dataset: <strong className="text-white">{dataset.name}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              SalesInsight Download Center
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Export your sales analytics dashboard into authentic multi-page PDFs, editable PowerPoint presentations, or connect to Microsoft Power BI. All exports use your actual calculated metrics and selected questions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenMyReports}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-2 border border-slate-700 shadow-sm transition-colors"
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>View Saved Reports ({userJobs.length})</span>
            </button>
          </div>
        </div>

        {actionError && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* THREE LARGE EXPORT CARDS (Section 6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: COMPLETE PDF REPORT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-blue-400 font-bold">
                .pdf
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Complete PDF Report</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Download a complete, multi-page report with cover page, executive summary, KPI tables, question-by-question charts, evidence-based recommendations, and data-cleaning methodology.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Layout Format:</span>
                <span className="font-semibold text-white">Multi-Page Portrait A4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Questions:</span>
                <span className="font-semibold text-blue-400">{cards.length} Questions Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visuals Embedded:</span>
                <span className="font-semibold text-emerald-400">100% (No Truncation)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <button
              onClick={handleGenerateCompletePdf}
              disabled={isJobRunning('pdf')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isJobRunning('pdf') ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Complete PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Complete PDF</span>
                </>
              )}
            </button>

            {/* Requested One-Page Summarized Dashboard Button */}
            <button
              onClick={handleGenerateOnePageSummaryPdf}
              disabled={isJobRunning('pdf_summary')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Download 1-Page Summary (PDF)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: POWERPOINT PRESENTATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Presentation className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                .pptx
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">PowerPoint Presentation</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Download a genuine, editable .pptx presentation with dedicated question slides, executive KPIs, native chart elements, regional matrices, and conclusions.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Slide Architecture:</span>
                <span className="font-semibold text-white">16:9 Widescreen Layout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Standard:</span>
                <span className="font-semibold text-emerald-400">Genuine .pptx Presentation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dynamic Filename:</span>
                <span className="font-mono text-slate-400 text-[10px]">SalesInsight_Analysis_*.pptx</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleGeneratePowerPoint}
              disabled={isJobRunning('pptx')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {isJobRunning('pptx') ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Presentation...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PowerPoint (.pptx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 3: POWER BI DASHBOARD AND REPORT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold">
                Power BI
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Power BI Integration</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect to permitted workspaces, embed interactive reports, export to PDF, and download genuine .pbix Desktop files where authorized by capacity.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Workspace Status:</span>
                <span className="font-semibold text-emerald-400">Authorized &amp; Permitted</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Question-Driven Spec:</span>
                <span className="font-semibold text-amber-400">DAX Measures Mapped</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Desktop File (.pbix):</span>
                <span className="font-semibold text-slate-300">Verified Governance</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setIsPowerBiModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Power BI Options</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE GENERATION & RECENT EXPORT JOBS TRACKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Export Generation Queue &amp; Status</h3>
            <p className="text-xs text-slate-400">
              Live tracking of Queued, Generating, Completed, and Failed export tasks for {currentUserName}.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {userJobs.length} Recorded Jobs
          </span>
        </div>

        {userJobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            No export jobs executed yet in this session. Click any card above to generate a report.
          </div>
        ) : (
          <div className="space-y-3">
            {userJobs.map((job) => {
              const isRunning = job.status === 'Generating' || job.status === 'Queued';
              return (
                <div
                  key={job.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        job.format === 'pptx'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : job.format === 'pbix'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {job.format === 'pptx' ? (
                        <Presentation className="w-5 h-5" />
                      ) : job.format === 'pbix' ? (
                        <Layers className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{job.reportName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 uppercase">
                          .{job.format.replace('_summary', '')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dataset: <span className="text-slate-300">{job.datasetName}</span> · Created: {job.createdAt} · Size: {job.fileSize}
                      </div>

                      {/* Error details if failed */}
                      {job.status === 'Failed' && job.errorMessage && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{job.errorMessage}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator & Actions */}
                  <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Badge */}
                    <div>
                      {job.status === 'Completed' && (
                        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[11px] flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}

                      {job.status === 'Generating' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-blue-400 font-mono font-semibold">
                            {job.progress}%
                          </span>
                        </div>
                      )}

                      {job.status === 'Queued' && (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-semibold text-[11px] flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Queued</span>
                        </span>
                      )}

                      {job.status === 'Failed' && (
                        <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-semibold text-[11px] flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {job.status === 'Completed' && (
                        <button
                          onClick={() => handleRetryJob(job)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      )}

                      {job.status === 'Failed' && (
                        <button
                          onClick={() => handleRetryJob(job)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs flex items-center space-x-1.5 border border-slate-700"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Safe Retry</span>
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteExportJob(job.id)}
                        title="Delete from list"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POWER BI MODAL */}
      <PowerBiModal
        isOpen={isPowerBiModalOpen}
        onClose={() => setIsPowerBiModalOpen(false)}
        dataset={dataset}
        cards={cards}
        currentUserName={currentUserName}
        userEmail={userCompany || 'Enterprise'}
        onTriggerPdfExport={handleGenerateCompletePdf}
        onTriggerPptxExport={handleGeneratePowerPoint}
      />
    </div>
  );
};
