import React, { useState, useMemo } from 'react';
import {
  FileText,
  Presentation,
  Layers,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  ExportJobRecord,
  SavedDashboardRecord,
  DatasetRecord,
  DashboardCard,
  DashboardFilterState,
} from './types';
import { DynamicKpiSummary } from './dashboardEngine';
import {
  generatePdfDashboardReport,
  generateOnePageSummaryPdf,
} from './pdfReportGenerator';
import { generatePptxDashboardPresentation } from './pptxReportGenerator';
import { PowerBiModal } from './PowerBiModal';

interface SavedReportsViewProps {
  currentUserId: string;
  currentUserName: string;
  userCompany?: string;
  userRole: string;
  exportJobs: ExportJobRecord[];
  savedDashboards: SavedDashboardRecord[];
  activeDataset: DatasetRecord;
  activeCards: DashboardCard[];
  activeKpis: DynamicKpiSummary;
  activeFilters: DashboardFilterState;
  onDeleteExportJob: (jobId: string) => void;
  onOpenDownloadCenter: () => void;
}

export const SavedReportsView: React.FC<SavedReportsViewProps> = ({
  currentUserId,
  currentUserName,
  userCompany,
  userRole,
  exportJobs,
  savedDashboards,
  activeDataset,
  activeCards,
  activeKpis,
  activeFilters,
  onDeleteExportJob,
  onOpenDownloadCenter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('all');
  const [isPowerBiModalOpen, setIsPowerBiModalOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Strict tenant boundary isolation: standard users ONLY see their own jobs
  // Admins can see tenant-wide or filter
  const accessibleJobs = useMemo(() => {
    return exportJobs.filter((job) => {
      // Ownership check: must match current user id unless admin
      if (userRole !== 'admin' && job.ownerId !== currentUserId) {
        return false;
      }

      if (selectedFormatFilter !== 'all') {
        if (selectedFormatFilter === 'pdf' && !job.format.startsWith('pdf')) return false;
        if (selectedFormatFilter === 'pptx' && job.format !== 'pptx') return false;
        if (selectedFormatFilter === 'powerbi' && job.format !== 'pbix' && job.format !== 'powerbi') return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = job.reportName.toLowerCase().includes(term);
        const matchDs = job.datasetName.toLowerCase().includes(term);
        return matchName || matchDs;
      }

      return true;
    });
  }, [exportJobs, currentUserId, userRole, selectedFormatFilter, searchTerm]);

  // Handle re-downloading or regenerating an export
  const handleDownloadReport = async (job: ExportJobRecord) => {
    try {
      setRegeneratingId(job.id);
      setStatusMessage(null);

      if (job.format === 'pdf') {
        await generatePdfDashboardReport({
          dataset: activeDataset,
          cards: activeCards,
          kpis: activeKpis,
          filters: activeFilters,
          currentUserName,
          userCompany,
          reportTitle: job.reportName,
        });
        setStatusMessage(`Report "${job.reportName}" downloaded successfully.`);
      } else if (job.format === 'pdf_summary') {
        await generateOnePageSummaryPdf({
          dataset: activeDataset,
          cards: activeCards,
          kpis: activeKpis,
          filters: activeFilters,
          currentUserName,
          userCompany,
        });
        setStatusMessage(`1-Page Summary "${job.reportName}" downloaded successfully.`);
      } else if (job.format === 'pptx') {
        await generatePptxDashboardPresentation({
          dataset: activeDataset,
          cards: activeCards,
          kpis: activeKpis,
          filters: activeFilters,
          currentUserName,
          userCompany,
          reportTitle: job.reportName,
        });
        setStatusMessage(`PowerPoint presentation "${job.reportName}" downloaded successfully.`);
      } else if (job.format === 'pbix' || job.format === 'powerbi') {
        setIsPowerBiModalOpen(true);
      }
    } catch (err: any) {
      console.error('Download/regenerate error:', err);
      setStatusMessage('Error regenerating report. Please check dataset connection.');
    } finally {
      setRegeneratingId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Enterprise Archive
              </span>
              <span className="text-xs text-slate-400">
                User: <strong className="text-white">{currentUserName}</strong> ({userCompany || 'Enterprise'})
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              My Reports &amp; Saved Exports
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Access, re-download, or regenerate your previous PDF reports, PowerPoint presentations, and Power BI assets. Strict ownership verification protects all saved artifacts.
            </p>
          </div>

          <button
            onClick={onOpenDownloadCenter}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-500/25 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Open Download Center</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report name or dataset..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Format Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'pdf', label: 'PDF Reports' },
              { id: 'pptx', label: 'PowerPoint (.pptx)' },
              { id: 'powerbi', label: 'Power BI' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFormatFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedFormatFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Reports Table (Section 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-white text-sm">Archived Reports Repository</h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {accessibleJobs.length} Saved
            </span>
          </div>

          <div className="flex items-center space-x-1 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tenant Protected · RBAC Enforced</span>
          </div>
        </div>

        {accessibleJobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No saved reports found matching your active filter criteria.</p>
            <button
              onClick={onOpenDownloadCenter}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs border border-slate-700 inline-flex items-center space-x-1.5"
            >
              <span>Generate a New Export in Download Center</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Report Name</th>
                  <th className="py-3 px-4">Associated Dataset</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Generation Date</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {accessibleJobs.map((job) => {
                  const isBusy = regeneratingId === job.id;
                  return (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          {job.format === 'pptx' ? (
                            <Presentation className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : job.format === 'pbix' || job.format === 'powerbi' ? (
                            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span>{job.reportName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {job.datasetName}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {job.selectedQuestions?.length || 5} Questions
                      </td>

                      <td className="py-3 px-4 font-mono uppercase text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            job.format === 'pptx'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : job.format === 'pbix' || job.format === 'powerbi'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          .{job.format.replace('_summary', '')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 flex items-center space-x-1.5 pt-3.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.createdAt}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {job.fileSize}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">
                          {job.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleDownloadReport(job)}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                        >
                          {isBusy ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download</span>
                        </button>

                        <button
                          onClick={() => onDeleteExportJob(job.id)}
                          title="Delete report artifact"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SAVED DASHBOARDS CONFIGURATION SECTION */}
      {savedDashboards.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-bold text-white text-base mb-1">Saved Dynamic Dashboards</h3>
          <p className="text-xs text-slate-400 mb-4">
            Previously configured analytical dashboards available for 1-click regeneration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedDashboards.map((dash) => (
              <div
                key={dash.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{dash.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dataset: {dash.datasetName} · {dash.selectedQuestions.length} Questions
                  </p>
                  <span className="text-[10px] text-slate-500">Saved: {dash.createdAt}</span>
                </div>

                <button
                  onClick={() => {
                    handleDownloadReport({
                      id: `reg_${dash.id}`,
                      ownerId: currentUserId,
                      ownerName: currentUserName,
                      reportName: `${dash.name} (Regenerated)`,
                      datasetId: dash.datasetId,
                      datasetName: dash.datasetName,
                      selectedQuestions: dash.selectedQuestions,
                      format: 'pdf',
                      createdAt: new Date().toISOString().substring(0, 10),
                      fileSize: '1.4 MB',
                      status: 'Completed',
                      progress: 100,
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs flex items-center space-x-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POWER BI MODAL */}
      <PowerBiModal
        isOpen={isPowerBiModalOpen}
        onClose={() => setIsPowerBiModalOpen(false)}
        dataset={activeDataset}
        cards={activeCards}
        currentUserName={currentUserName}
        userEmail={userCompany || 'Enterprise'}
        onTriggerPdfExport={() => {
          generatePdfDashboardReport({
            dataset: activeDataset,
            cards: activeCards,
            kpis: activeKpis,
            filters: activeFilters,
            currentUserName,
            userCompany,
          });
        }}
        onTriggerPptxExport={() => {
          generatePptxDashboardPresentation({
            dataset: activeDataset,
            cards: activeCards,
            kpis: activeKpis,
            filters: activeFilters,
            currentUserName,
            userCompany,
          });
        }}
      />
    </div>
  );
};
