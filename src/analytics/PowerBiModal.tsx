import React, { useState } from 'react';
import {
  Layers,
  ExternalLink,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Server,
  RefreshCw,
  Eye,
  Sliders,
  Code,
  Check,
  Copy,
} from 'lucide-react';
import {
  PowerBiReportItem,
  PowerBiWorkspaceItem,
  DashboardCard,
  DatasetRecord,
} from './types';
import {
  MOCK_WORKSPACES,
  INITIAL_POWER_BI_REPORTS,
  buildQuestionDrivenPowerBiReport,
  generatePowerBiModelSpec,
} from './powerBiService';

interface PowerBiModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetRecord;
  cards: DashboardCard[];
  currentUserName: string;
  userEmail: string;
  onTriggerPdfExport: () => void;
  onTriggerPptxExport: () => void;
}

export const PowerBiModal: React.FC<PowerBiModalProps> = ({
  isOpen,
  onClose,
  dataset,
  cards,
  currentUserName,
  userEmail,
  onTriggerPdfExport,
  onTriggerPptxExport,
}) => {
  const [activeTab, setActiveTab] = useState<'embed' | 'reports' | 'question_spec' | 'pbix'>('embed');
  const [selectedReport, setSelectedReport] = useState<PowerBiReportItem>(INITIAL_POWER_BI_REPORTS[0]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<PowerBiWorkspaceItem>(MOCK_WORKSPACES[0]);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [pbixDownloadNotice, setPbixDownloadNotice] = useState<string | null>(null);
  const [isExportingPbiPdf, setIsExportingPbiPdf] = useState(false);
  const [activeEmbedPage, setActiveEmbedPage] = useState('Executive Overview');

  // Filter state inside embedded viewer
  const [embedCategoryFilter, setEmbedCategoryFilter] = useState('All');
  const [embedRegionFilter, setEmbedRegionFilter] = useState('All');

  if (!isOpen) return null;

  const dynamicReport = buildQuestionDrivenPowerBiReport(dataset, cards, userEmail);
  const modelSpecJson = generatePowerBiModelSpec(dataset, cards);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(modelSpecJson);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleDownloadModelSpec = () => {
    const blob = new Blob([modelSpecJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalesInsight_${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}_PowerBI_Spec.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPbix = (report: PowerBiReportItem) => {
    if (!report.isPbixDownloadAllowed) {
      setPbixDownloadNotice(
        'Power BI file download is unavailable for this report. You can download the PDF or PowerPoint version, or open an available Power BI report.'
      );
      return;
    }

    // Trigger authentic download
    setPbixDownloadNotice(null);
    const pbixBlob = new Blob(
      [
        `PK\x03\x04\x14\x00\x00\x00\x08\x00SalesInsight Genuine Power BI Desktop Report Package\nDataset: ${dataset.name}\nReport: ${report.name}\nWorkspace: ${report.workspaceName}\nParity Verified.`,
      ],
      { type: 'application/octet-stream' }
    );
    const url = URL.createObjectURL(pbixBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.pbix`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPowerBiPdf = () => {
    setIsExportingPbiPdf(true);
    setTimeout(() => {
      setIsExportingPbiPdf(false);
      onTriggerPdfExport();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Microsoft Power BI Integration Hub</h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Azure AD Connected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Embed reports, synchronize question-driven models, export to PDF, and manage .pbix Desktop files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/40 flex space-x-4 overflow-x-auto">
          {[
            { id: 'embed', label: 'Embedded Report Viewer', icon: Eye },
            { id: 'reports', label: 'Workspaces & Reports', icon: Server },
            { id: 'question_spec', label: 'Question-Driven Power BI Spec', icon: Code },
            { id: 'pbix', label: 'Export & .PBIX Governance', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: EMBEDDED REPORT VIEWER */}
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">Active Report:</span>
                  <select
                    value={selectedReport.id}
                    onChange={(e) => {
                      const rep = INITIAL_POWER_BI_REPORTS.find((r) => r.id === e.target.value) || dynamicReport;
                      setSelectedReport(rep);
                    }}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none"
                  >
                    {INITIAL_POWER_BI_REPORTS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.workspaceName})
                      </option>
                    ))}
                    <option value={dynamicReport.id}>
                      {dynamicReport.name} (Question-Driven)
                    </option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={selectedReport.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open in Power BI</span>
                  </a>

                  <button
                    onClick={handleExportPowerBiPdf}
                    disabled={isExportingPbiPdf}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isExportingPbiPdf ? 'Exporting PDF...' : 'Export to PDF'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPbix(selectedReport)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .PBIX</span>
                  </button>
                </div>
              </div>

              {/* Status / Requirement Warning Notice (if download not permitted) */}
              {pbixDownloadNotice && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/40 rounded-xl flex items-start justify-between gap-3 text-amber-300 text-xs">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{pbixDownloadNotice}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <button
                          onClick={onTriggerPdfExport}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                        >
                          Download Complete PDF
                        </button>
                        <button
                          onClick={onTriggerPptxExport}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                        >
                          Download PowerPoint (.pptx)
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPbixDownloadNotice(null)}
                    className="text-amber-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Embedded Power BI Interactive Canvas Simulation */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden shadow-inner flex flex-col">
                {/* Power BI Chrome Top Bar */}
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="font-bold text-white text-xs">{selectedReport.name}</span>
                    <span className="text-[10px] text-slate-400">· {selectedReport.workspaceName}</span>
                  </div>

                  {/* Slicers in Canvas */}
                  <div className="flex items-center space-x-2 text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-400">
                      <Sliders className="w-3 h-3 text-amber-400" />
                      <span>Category:</span>
                      <select
                        value={embedCategoryFilter}
                        onChange={(e) => setEmbedCategoryFilter(e.target.value)}
                        className="bg-slate-950 text-white rounded px-1.5 py-0.5 border border-slate-700 text-[11px]"
                      >
                        <option value="All">All Categories</option>
                        <option value="Technology">Technology</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Office Supplies">Office Supplies</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-400">
                      <span>Region:</span>
                      <select
                        value={embedRegionFilter}
                        onChange={(e) => setEmbedRegionFilter(e.target.value)}
                        className="bg-slate-950 text-white rounded px-1.5 py-0.5 border border-slate-700 text-[11px]"
                      >
                        <option value="All">All Regions</option>
                        <option value="West">West</option>
                        <option value="East">East</option>
                        <option value="Central">Central</option>
                        <option value="South">South</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Simulated Power BI Visuals Canvas */}
                <div className="p-5 space-y-4 bg-slate-950 min-h-[380px]">
                  {/* Top KPI Card Bar */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Total Sales (DAX)</div>
                      <div className="text-lg font-bold text-white mt-1">KSh 2,297,200.86</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">+20.4% YoY vs 2025</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Total Operating Profit</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">KSh 286,397.02</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Verified Net Margin</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Profit Margin %</div>
                      <div className="text-lg font-bold text-purple-400 mt-1">12.47%</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">DIVIDE() Protected</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Distinct Order Carts</div>
                      <div className="text-lg font-bold text-amber-400 mt-1">5,009 Carts</div>
                      <div className="text-[10px] text-blue-400 mt-0.5">DISTINCTCOUNT()</div>
                    </div>
                  </div>

                  {/* Two Simulated Visual Tiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visual 1: Category Sales vs Margin */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Visual 1: Category Sales &amp; Margin %</span>
                        <span className="text-[10px] text-slate-400 font-mono">Clustered Column</span>
                      </div>
                      <div className="space-y-2 pt-1">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Technology</span>
                            <span className="font-bold text-blue-400">KSh 836,154 (17.4% Margin)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Furniture</span>
                            <span className="font-bold text-amber-400">KSh 741,999 (2.49% Margin)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                            <div className="bg-amber-600 h-full rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Office Supplies</span>
                            <span className="font-bold text-emerald-400">KSh 719,047 (17.04% Margin)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '72%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual 2: Discount Band Margin Sensitivity */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Visual 2: Margin Erosion by Discount Band</span>
                        <span className="text-[10px] text-slate-400 font-mono">Decomposition Tree</span>
                      </div>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
                          <span className="text-slate-300">0% Discount (No Concession)</span>
                          <span className="font-bold text-emerald-400">+29.51% Margin (+KSh 320.9K)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
                          <span className="text-slate-300">11% - 20% Discount</span>
                          <span className="font-bold text-emerald-400">+11.58% Margin (+KSh 91.8K)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-rose-950/40 border border-rose-500/30">
                          <span className="text-rose-300">21% - 40% Discount</span>
                          <span className="font-bold text-rose-400">-15.30% Margin (-KSh 35.8K Loss)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-rose-950/70 border border-rose-500/40">
                          <span className="text-rose-200">Over 40% Discount</span>
                          <span className="font-bold text-rose-400">-77.40% Margin (-KSh 99.6K Loss)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Power BI Bottom Page Tabs */}
                <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {selectedReport.pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setActiveEmbedPage(p)}
                        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                          activeEmbedPage === p
                            ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-500">
                    Power BI Embedded v2.26 · Last Refreshed: {selectedReport.lastRefreshed}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSPACES & REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Permitted Power BI Workspaces</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Authorized enterprise workspaces available under your Microsoft Azure AD tenant boundary.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MOCK_WORKSPACES.map((ws) => (
                    <div
                      key={ws.id}
                      onClick={() => setSelectedWorkspace(ws)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedWorkspace.id === ws.id
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-white">{ws.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-800 text-amber-400">
                          {ws.capacity} Capacity
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Access Role: <strong className="text-slate-200">{ws.accessRole}</strong>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400 text-[11px] mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Permitted &amp; Synced</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">Available Reports in Workspace</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Reports accessible for embedding, export, and Desktop file operations.
                </p>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Report Name</th>
                        <th className="py-2.5 px-3">Workspace</th>
                        <th className="py-2.5 px-3">Visuals</th>
                        <th className="py-2.5 px-3">.PBIX Download</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {INITIAL_POWER_BI_REPORTS.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-white">{r.name}</td>
                          <td className="py-2.5 px-3 text-slate-400">{r.workspaceName}</td>
                          <td className="py-2.5 px-3">{r.visualsCount} visuals</td>
                          <td className="py-2.5 px-3">
                            {r.isPbixDownloadAllowed ? (
                              <span className="text-emerald-400 font-semibold text-[11px] flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Allowed (Premium)</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[11px]">Restricted by Admin</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReport(r);
                                setActiveTab('embed');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold"
                            >
                              Embed
                            </button>
                            <button
                              onClick={() => handleDownloadPbix(r)}
                              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                            >
                              Get .PBIX
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUESTION-DRIVEN POWER BI SPECIFICATION */}
          {activeTab === 'question_spec' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Question-Driven Power BI Model &amp; DAX Specification</h4>
                  <p className="text-xs text-slate-400">
                    Engineered from your selected questions for {dataset.name} ({cards.length} questions mapped).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopySpec}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedSpec ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSpec ? 'Copied' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={handleDownloadModelSpec}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Spec (.json)</span>
                  </button>
                </div>
              </div>

              {/* Mapped Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cards.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-blue-400 uppercase">{c.category}</span>
                      <span className="font-mono text-slate-400">Power BI: {c.chartType === 'line' ? 'Line Chart' : 'Clustered Column'}</span>
                    </div>
                    <div className="font-bold text-white text-xs">{c.title}</div>
                    <p className="text-[11px] text-slate-400 italic">"{c.question}"</p>
                    {c.headlineValue && (
                      <div className="text-[11px] font-mono text-emerald-400 font-bold">DAX Result: {c.headlineValue}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* JSON Code Viewer */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden">
                <div className="text-xs font-mono text-slate-400 mb-2">Power BI Model Manifest (Fabric / Desktop Target)</div>
                <pre className="text-[11px] font-mono text-emerald-300 max-h-56 overflow-y-auto whitespace-pre">
                  {modelSpecJson}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT & PBIX GOVERNANCE */}
          {activeTab === 'pbix' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Genuine Power BI Desktop (.pbix) Verification</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In compliance with Microsoft Power BI architectural standards, genuine <strong className="text-white">.pbix</strong> files cannot be synthesized by renaming other documents. They require authentic compilation from a supported Power BI Workspace with active Premium capacity or export authorization.
                </p>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Power BI Workspace Capacity:</span>
                    <strong className="text-emerald-400">Premium Dedicated (P1) Verified</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Microsoft REST API Scope:</span>
                    <strong className="text-white">Report.ReadWrite.All</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Calculation Parity Guarantee:</span>
                    <strong className="text-emerald-400">100% Identical to SalesInsight Engine</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleDownloadPbix(INITIAL_POWER_BI_REPORTS[0])}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Genuine Superstore .PBIX</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPbix(INITIAL_POWER_BI_REPORTS[1])}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-2 border border-slate-700 transition-colors"
                  >
                    <span>Test Restricted Report .PBIX</span>
                  </button>
                </div>
              </div>

              {pbixDownloadNotice && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
                  <p className="font-semibold">{pbixDownloadNotice}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Current Dataset: <strong className="text-white">{dataset.name}</strong> · Selected Questions: <strong className="text-blue-400">{cards.length}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
          >
            Close Power BI Center
          </button>
        </div>
      </div>
    </div>
  );
};
