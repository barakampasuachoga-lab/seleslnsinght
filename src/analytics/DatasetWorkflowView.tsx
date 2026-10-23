import React, { useState } from 'react';
import {
  DatasetColumn,
  DatasetRecord,
  DataType,
  SemanticRole,
  BusinessQuestion,
  AnalysisPlanItem,
  QuestionCategory,
} from './types';
import { parseCSVDataset } from './dataParser';
import {
  generateSuggestedQuestions,
  parseNaturalLanguageQuestion,
  buildAnalysisPlan,
} from './questionEngine';
import {
  createSampleSuperstoreDataset,
  createSampleSaasDataset,
  createSampleInventoryDataset,
} from './sampleDatasets';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  Database,
  Search,
  Filter,
  Check,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';

interface DatasetWorkflowViewProps {
  currentUserId: string;
  currentUserName: string;
  onDashboardGenerated: (dataset: DatasetRecord, plan: AnalysisPlanItem[]) => void;
  onCancel?: () => void;
  initialDataset?: DatasetRecord | null;
}

export const DatasetWorkflowView: React.FC<DatasetWorkflowViewProps> = ({
  currentUserId,
  currentUserName,
  onDashboardGenerated,
  onCancel,
  initialDataset,
}) => {
  // Workflow Step: 'upload' -> 'inspect' -> 'questions' -> 'plan'
  const [step, setStep] = useState<'upload' | 'inspect' | 'questions' | 'plan'>(
    initialDataset ? 'inspect' : 'upload'
  );

  // Upload Form State
  const [datasetName, setDatasetName] = useState(initialDataset?.name || '');
  const [datasetDescription, setDatasetDescription] = useState(initialDataset?.description || '');
  const [datasetContext, setDatasetContext] = useState<DatasetRecord['context']>(
    initialDataset?.context || 'retail'
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active Parsed Dataset State
  const [dataset, setDataset] = useState<DatasetRecord | null>(initialDataset || null);

  // Column Mappings Edits State (User Corrections)
  const [editableColumns, setEditableColumns] = useState<DatasetColumn[]>(
    initialDataset?.columns || []
  );

  // Question Selection State
  const [suggestedQuestions, setSuggestedQuestions] = useState<BusinessQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('All');

  // Custom Business Question State
  const [customQueryInput, setCustomQueryInput] = useState('');
  const [customQuestions, setCustomQuestions] = useState<AnalysisPlanItem[]>([]);
  const [customQueryError, setCustomQueryError] = useState<string | null>(null);

  // Generated Plan State
  const [analysisPlan, setAnalysisPlan] = useState<AnalysisPlanItem[]>([]);

  // --------------------------------------------------------------------------
  // Step 1: Upload or Choose Sample Dataset
  // --------------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Unsupported format. Please upload a CSV or Excel (.xlsx) file.');
      return;
    }

    setUploadedFile(file);
    if (!datasetName) {
      setDatasetName(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleProcessUploadedFile = () => {
    if (!uploadedFile) {
      setUploadError('Please select a CSV or Excel file to upload.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textContent = (event.target?.result as string) || '';
        const parsed = parseCSVDataset(
          textContent,
          uploadedFile.name,
          datasetName,
          datasetDescription,
          datasetContext,
          currentUserId,
          currentUserName,
          uploadedFile.size
        );

        setDataset(parsed);
        setEditableColumns(parsed.columns);
        const questions = generateSuggestedQuestions(parsed);
        setSuggestedQuestions(questions);

        // Pre-select first 3 available questions by default
        const availableIds = questions.filter((q) => q.isAvailable).map((q) => q.id).slice(0, 4);
        setSelectedQuestionIds(new Set(availableIds));

        setIsProcessing(false);
        setStep('inspect');
      } catch (err: any) {
        setIsProcessing(false);
        setUploadError(err.message || 'Failed to parse file. Ensure it is a valid delimited CSV or Excel file.');
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setUploadError('Failed to read the file. Please try again.');
    };

    reader.readAsText(uploadedFile);
  };

  const handleSelectSample = (sampleType: 'superstore' | 'saas' | 'inventory') => {
    let sample: DatasetRecord;
    if (sampleType === 'superstore') {
      sample = createSampleSuperstoreDataset(currentUserId, currentUserName);
    } else if (sampleType === 'saas') {
      sample = createSampleSaasDataset(currentUserId, currentUserName);
    } else {
      sample = createSampleInventoryDataset(currentUserId, currentUserName);
    }

    setDataset(sample);
    setDatasetName(sample.name);
    setDatasetDescription(sample.description);
    setDatasetContext(sample.context);
    setEditableColumns(sample.columns);

    const questions = generateSuggestedQuestions(sample);
    setSuggestedQuestions(questions);

    const availableIds = questions.filter((q) => q.isAvailable).map((q) => q.id).slice(0, 4);
    setSelectedQuestionIds(new Set(availableIds));
    setStep('inspect');
  };

  // --------------------------------------------------------------------------
  // Step 2: Column Inspection & Corrections
  // --------------------------------------------------------------------------
  const handleUpdateColumnRole = (colName: string, newRole: SemanticRole) => {
    const updated = editableColumns.map((c) =>
      c.name === colName ? { ...c, semanticRole: newRole } : c
    );
    setEditableColumns(updated);
  };

  const handleUpdateColumnType = (colName: string, newType: DataType) => {
    const updated = editableColumns.map((c) =>
      c.name === colName ? { ...c, detectedType: newType } : c
    );
    setEditableColumns(updated);
  };

  const handleConfirmInspection = () => {
    if (!dataset) return;
    const updatedDataset: DatasetRecord = {
      ...dataset,
      columns: editableColumns,
    };
    setDataset(updatedDataset);

    // Re-evaluate questions based on user's corrected columns
    const questions = generateSuggestedQuestions(updatedDataset);
    setSuggestedQuestions(questions);

    // Keep valid questions selected
    const newSelected = new Set<string>();
    selectedQuestionIds.forEach((id) => {
      const q = questions.find((item) => item.id === id);
      if (q && q.isAvailable) newSelected.add(id);
    });
    if (newSelected.size === 0) {
      questions.filter((q) => q.isAvailable).slice(0, 4).forEach((q) => newSelected.add(q.id));
    }
    setSelectedQuestionIds(newSelected);

    setStep('questions');
  };

  // --------------------------------------------------------------------------
  // Step 3: Question Selection & Custom Questions
  // --------------------------------------------------------------------------
  const toggleQuestionSelection = (questionId: string) => {
    const q = suggestedQuestions.find((item) => item.id === questionId);
    if (!q || !q.isAvailable) return;

    const next = new Set(selectedQuestionIds);
    if (next.has(questionId)) {
      next.delete(questionId);
    } else {
      next.add(questionId);
    }
    setSelectedQuestionIds(next);
  };

  const handleAddCustomQuestion = () => {
    if (!customQueryInput.trim() || !dataset) return;
    setCustomQueryError(null);

    const planItem = parseNaturalLanguageQuestion(customQueryInput.trim(), dataset);
    setCustomQuestions([...customQuestions, planItem]);
    setCustomQueryInput('');
  };

  const handleRemoveCustomQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter((q) => q.questionId !== id));
  };

  const handleSelectAllAvailable = () => {
    const available = suggestedQuestions.filter((q) => q.isAvailable).map((q) => q.id);
    setSelectedQuestionIds(new Set(available));
  };

  const handleProceedToPlan = () => {
    if (!dataset) return;
    const selected = suggestedQuestions.filter((q) => selectedQuestionIds.has(q.id));
    const plan = buildAnalysisPlan(selected, customQuestions, dataset);
    setAnalysisPlan(plan);
    setStep('plan');
  };

  // --------------------------------------------------------------------------
  // Step 4: Confirm Analysis Plan & Generate Dashboard
  // --------------------------------------------------------------------------
  const handleExecuteDashboard = () => {
    if (!dataset) return;
    onDashboardGenerated(dataset, analysisPlan);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Workflow Navigation Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            Batch Ingestion &amp; Statistical Pipeline
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            {step === 'upload' && 'Step 1: Upload Dataset & Analytical Context'}
            {step === 'inspect' && 'Step 2: Inspect Schema & Correct Column Mappings'}
            {step === 'questions' && 'Step 3: What Would You Like to Discover From Your Data?'}
            {step === 'plan' && 'Step 4: Review Proposed Analysis Plan & Visualizations'}
          </h2>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 text-xs font-medium">
        <div
          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
            step === 'upload'
              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
            1
          </div>
          <span>Upload File</span>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
            step === 'inspect'
              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
            2
          </div>
          <span>Inspect Schema</span>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
            step === 'questions'
              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
            3
          </div>
          <span>Select Questions</span>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
            step === 'plan'
              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
            4
          </div>
          <span>Generate Plan</span>
        </div>
      </div>

      {/* =====================================================================
          STEP 1: UPLOAD DATASET
         ===================================================================== */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-sm">Upload Your Own Data</h3>
              <p className="text-xs text-slate-400">
                Upload CSV or Excel files. SalesInsight will non-destructively parse rows, identify data types, and adapt visualizations to your exact columns.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/60 relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-200">
                  {uploadedFile ? uploadedFile.name : 'Choose CSV or Excel file'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {uploadedFile
                    ? `${(uploadedFile.size / 1024).toFixed(1)} KB • Click to choose another`
                    : 'Drag & drop or browse from local disk'}
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dataset Name
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. Q4 Regional Electronics Sales"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Context
                  </label>
                  <select
                    value={datasetContext}
                    onChange={(e) => setDatasetContext(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="retail">Retail Sales & Merchandise</option>
                    <option value="saas">SaaS Recurring Revenue & Subscriptions</option>
                    <option value="inventory">Wholesale Inventory & Supply Chain</option>
                    <option value="finance">Finance & Commercial Transactions</option>
                    <option value="general">General Tabular Dataset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Optional Description
                  </label>
                  <input
                    type="text"
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    placeholder="e.g. Cleaned export from regional point-of-sale ERP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleProcessUploadedFile}
                disabled={!uploadedFile || isProcessing}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
              >
                <span>{isProcessing ? 'Parsing File...' : 'Inspect & Parse Dataset'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Samples */}
            <div className="space-y-4 border-l border-slate-800 pl-0 md:pl-6">
              <h3 className="font-semibold text-white text-sm">Or Choose a Verified Benchmark Dataset</h3>
              <p className="text-xs text-slate-400">
                Test the dynamic engine instantly. Each benchmark represents a distinct schema to verify that dashboards adapt dynamically rather than displaying hardcoded charts.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSelectSample('superstore')}
                  className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-blue-500 hover:bg-slate-900 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-blue-400 group-hover:text-blue-300">
                      Retail Superstore Dataset
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                      Full Sales &amp; Profit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Includes Sales, Profit, Discount, Category, Region, and Order Date. Unlocks margin destruction &amp; discount sensitivity analysis.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample('saas')}
                  className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500 hover:bg-slate-900 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-emerald-400 group-hover:text-emerald-300">
                      Cloud SaaS Subscription Ledger
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                      No Profit Columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Contains ARR, Monthly Revenue, Seats Sold, and Tiers. Demonstrates how profit questions are gracefully labeled and disabled.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample('inventory')}
                  className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-purple-500 hover:bg-slate-900 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-purple-400 group-hover:text-purple-300">
                      Wholesale Inventory &amp; Logistics
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                      Inventory Logistics
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Warehouse SKUs, Unit Costs, Stock on Hand, Lead Times. Adapts dashboard to logistics metrics without forcing retail KPIs.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 2: INSPECT SCHEMA & USER CORRECTIONS
         ===================================================================== */}
      {step === 'inspect' && dataset && (
        <div className="space-y-6">
          {/* Summary Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Filename</span>
              <div className="text-xs font-mono font-bold text-white truncate mt-1">
                {dataset.filename}
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Rows</span>
              <div className="text-sm font-bold text-blue-400 mt-1">
                {dataset.rowCount.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Columns</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">{dataset.colCount} Detected</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">File Size</span>
              <div className="text-xs font-medium text-slate-300 mt-1">{dataset.fileSize}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Duplicates</span>
              <div className="text-xs font-bold text-slate-300 mt-1">
                {dataset.qualityReport.duplicateCount} records
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Data Integrity</span>
              <div className="text-xs font-bold text-emerald-400 mt-1">100% Retained</div>
            </div>
          </div>

          {/* Quality Warnings */}
          {dataset.qualityReport.warnings.length > 0 && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Automated Data-Quality &amp; Ingestion Report:</span>
              </div>
              {dataset.qualityReport.warnings.map((w, i) => (
                <div key={i} className="text-[11px] text-slate-400 pl-5">
                  • {w}
                </div>
              ))}
            </div>
          )}

          {/* Column Mappings Table with Editable Dropdowns */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Detected Column Types &amp; Semantic Meanings
                </h3>
                <p className="text-xs text-slate-400">
                  You can correct any detected data type or business role below before generating your analytics plan.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                User Correction Enabled
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Detected Type</th>
                    <th className="py-2.5 px-3">Assigned Business Role</th>
                    <th className="py-2.5 px-3">Missing / Nulls</th>
                    <th className="py-2.5 px-3">Distinct Values</th>
                    <th className="py-2.5 px-3">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                  {editableColumns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-white font-mono">{col.name}</td>
                      <td className="py-2 px-3">
                        <select
                          value={col.detectedType}
                          onChange={(e) =>
                            handleUpdateColumnType(col.name, e.target.value as DataType)
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="numeric">numeric</option>
                          <option value="text">text</option>
                          <option value="date">date</option>
                          <option value="categorical">categorical</option>
                          <option value="identifier">identifier</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={col.semanticRole}
                          onChange={(e) =>
                            handleUpdateColumnRole(col.name, e.target.value as SemanticRole)
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-blue-300 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        >
                          <option value="sales">Sales / Revenue</option>
                          <option value="profit">Profit / Earnings</option>
                          <option value="discount">Discount Rate</option>
                          <option value="quantity">Quantity / Units</option>
                          <option value="cost">Unit Cost / Expense</option>
                          <option value="date">Order / Event Date</option>
                          <option value="category">Product Category</option>
                          <option value="sub_category">Sub-Category</option>
                          <option value="region">Geographic Region</option>
                          <option value="customer">Customer Name / ID</option>
                          <option value="customer_segment">Customer Segment</option>
                          <option value="product_name">Product / Item Name</option>
                          <option value="order_id">Order / Transaction ID</option>
                          <option value="other">Other Attribute</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {col.nullCount > 0 ? (
                          <span className="text-amber-400 font-medium">{col.nullCount}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{col.distinctCount}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                        {col.sampleValues.slice(0, 3).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmInspection}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <span>Confirm Mappings &amp; Select Questions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 3: SELECT BUSINESS QUESTIONS
         ===================================================================== */}
      {step === 'questions' && dataset && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-white text-base">
                What would you like to discover from your data?
              </h3>
              <p className="text-xs text-slate-400">
                Select from verified business questions supported by{' '}
                <strong className="text-slate-200">{dataset.filename}</strong>, or enter your own custom question.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAllAvailable}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold"
              >
                Select All Available
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(new Set())}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Filter Categories Ribbon */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              'All',
              'Sales Performance',
              'Profitability',
              'Product Performance',
              'Regional Performance',
              'Customer Analysis',
              'Discount Analysis',
              'Time-based Trends',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setQuestionCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  questionCategoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Question Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {suggestedQuestions
              .filter(
                (q) =>
                  questionCategoryFilter === 'All' || q.category === questionCategoryFilter
              )
              .map((q) => {
                const isSelected = selectedQuestionIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                      !q.isAvailable
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {q.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        Chart: {q.recommendedChart}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-slate-200 mt-2 mb-1">
                      {q.question}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{q.description}</p>

                    {!q.isAvailable && q.missingRequirementText && (
                      <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>{q.missingRequirementText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Custom Business Questions Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-white text-sm font-semibold">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Query by Custom Business Question</span>
            </div>
            <p className="text-xs text-slate-400">
              Type any question about your data. The deterministic parsing engine inspects your column schema, validates metric feasibility, and maps the statistical aggregation.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customQueryInput}
                onChange={(e) => setCustomQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomQuestion()}
                placeholder="e.g. Which region generates the most revenue? or Show monthly sales trends"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomQuestion}
                disabled={!customQueryInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Parse &amp; Add</span>
              </button>
            </div>

            {/* List of Custom Questions Added */}
            {customQuestions.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-300">Custom Questions Added:</span>
                {customQuestions.map((cq) => (
                  <div
                    key={cq.questionId}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{cq.question}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cq.calculationExplanation}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomQuestion(cq.questionId)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] px-2 py-1 rounded bg-rose-950/40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep('inspect')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Schema</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPlan}
              disabled={selectedQuestionIds.size === 0 && customQuestions.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <span>Review Analysis Plan ({selectedQuestionIds.size + customQuestions.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 4: REVIEW PROPOSED ANALYSIS PLAN
         ===================================================================== */}
      {step === 'plan' && dataset && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-white text-base">Proposed Analytical Execution Plan</h3>
            <p className="text-xs text-slate-400">
              The analytics engine has compiled the execution sequence for{' '}
              <strong className="text-slate-200">{dataset.name}</strong>. Confirm to synthesize the personalized dashboard.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3">Target Metric</th>
                  <th className="py-2.5 px-3">Aggregation &amp; Formula</th>
                  <th className="py-2.5 px-3">Target Chart</th>
                  <th className="py-2.5 px-3">Feasibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                {analysisPlan.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{item.question}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-300 uppercase">
                      {item.metricRole || 'COUNT'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.calculationExplanation}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-purple-300 uppercase">
                      {item.chartType}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.isFeasible ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Feasible</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Notice</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep('questions')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Questions</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteDashboard}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/25"
            >
              <Play className="w-4 h-4" />
              <span>Generate Personalized Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
