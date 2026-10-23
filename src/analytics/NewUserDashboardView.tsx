import React, { useRef } from 'react';
import {
  BarChart3,
  Upload,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Presentation,
  Database,
  Sliders,
} from 'lucide-react';
import { UserAccount } from '../App';

interface NewUserDashboardViewProps {
  currentUser: UserAccount;
  onStartWorkflow: (file?: File) => void;
  onLoadSample: (sampleType: 'superstore' | 'saas') => void;
  onOpenDownloadCenter: () => void;
  onOpenDatasets: () => void;
}

export const NewUserDashboardView: React.FC<NewUserDashboardViewProps> = ({
  currentUser,
  onStartWorkflow,
  onLoadSample,
  onOpenDownloadCenter,
  onOpenDatasets,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onStartWorkflow(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onStartWorkflow(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Welcome to Your Analytics Workspace, {currentUser.name}!
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Fresh Workspace Initialized</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tenant: <strong className="text-slate-200">{currentUser.company || 'Personal Workspace'}</strong> • {currentUser.email} • Account Role: <span className="uppercase text-blue-400 font-mono">{currentUser.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Isolated Tenant Space</span>
            </span>
          </div>
        </div>
      </div>

      {/* Zero Baseline Starter KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Total Sales Revenue</div>
          <div className="text-2xl font-bold text-white">$0.00</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting data ingestion</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Total Orders Processed</div>
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-[11px] text-slate-500 mt-1">0 transaction rows</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Operating Profit Margin</div>
          <div className="text-2xl font-bold text-white">0.0%</div>
          <div className="text-[11px] text-slate-500 mt-1">Baseline uncalculated</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Workspace Datasets</div>
          <div className="text-2xl font-bold text-blue-400">0 Active</div>
          <div className="text-[11px] text-emerald-400 mt-1">Ready for first upload</div>
        </div>
      </div>

      {/* Main Call to Action: File Upload Ingestion Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 sm:p-10 text-center transition-all bg-slate-950/40 relative group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto group-hover:scale-105 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">Upload Your Sales Dataset</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag and drop your sales data file here, or click to browse. Supports <span className="text-slate-200 font-mono">.csv</span> and <span className="text-slate-200 font-mono">.xlsx</span> formats up to 50 MB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select File from Computer</span>
            </button>
            <button
              type="button"
              onClick={() => onStartWorkflow()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Open Ingestion Wizard</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500 pt-2">
            <span>• Non-destructive column validation</span>
            <span>• Automatic revenue &amp; date detection</span>
            <span>• Tenant isolation</span>
          </div>
        </div>
      </div>

      {/* Quick-Start: Pre-Built Demo Datasets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Or Explore Instantly with Curated Sample Datasets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Load an audited demo dataset directly into your personal workspace with 1 click to test dashboards and exports.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Retail Superstore Sales Dataset</h4>
                    <span className="text-[10px] text-slate-500">Retail Omnichannel • 9,994 Orders</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                4-year comprehensive transaction history with sales, profits, discounts, subcategories, shipping modes, and customer segments.
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">9,994 rows • 31 columns • 1.4 MB</span>
              <button
                type="button"
                onClick={() => onLoadSample('superstore')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Load Sample</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 rounded-xl p-5 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">B2B SaaS Subscription Metrics</h4>
                    <span className="text-[10px] text-slate-500">Cloud Software • 2,450 Subscriptions</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Recurring ARR
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Tiered subscription contracts, monthly recurring revenue (MRR), renewals, churn tracking, and customer acquisition costs.
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">2,450 rows • 18 columns • 640 KB</span>
              <button
                type="button"
                onClick={() => onLoadSample('saas')}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                <span>Load Sample</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Analytical Workflow Blueprint */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-1">How SalesInsight Multi-Format Export Works</h3>
        <p className="text-xs text-slate-400 mb-6">From raw spreadsheets to executive presentations and Power BI dashboards in 4 steps.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">
              01
            </div>
            <h4 className="text-xs font-bold text-white">Upload Dataset</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload any CSV or Excel file. The engine validates columns, identifies measures, and inspects data health.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold font-mono">
              02
            </div>
            <h4 className="text-xs font-bold text-white">Select Questions</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Choose from tailored business inquiries (profit leaks, discount caps, AOV) or enter custom analytical questions.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
              03
            </div>
            <h4 className="text-xs font-bold text-white">Interactive Dashboard</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesize dynamic visualizations, filter by region and category, and review business recommendations.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
              04
            </div>
            <h4 className="text-xs font-bold text-white">Download Center</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Export Complete Multi-Page PDF reports, editable 16:9 PowerPoint (.pptx) decks, or connect with Microsoft Power BI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
