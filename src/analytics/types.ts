export type DataType = 'numeric' | 'text' | 'date' | 'categorical' | 'identifier';

export type SemanticRole =
  | 'sales'
  | 'profit'
  | 'quantity'
  | 'cost'
  | 'discount'
  | 'date'
  | 'category'
  | 'sub_category'
  | 'region'
  | 'customer'
  | 'customer_segment'
  | 'product_name'
  | 'order_id'
  | 'other';

export interface DatasetColumn {
  name: string;
  detectedType: DataType;
  semanticRole: SemanticRole;
  nullCount: number;
  distinctCount: number;
  sampleValues: (string | number)[];
}

export interface DatasetQualityReport {
  totalRows: number;
  totalColumns: number;
  duplicateCount: number;
  missingValueStats: { column: string; count: number; pct: number }[];
  negativeProfitCount: number;
  dataRetentionPct: number;
  warnings: string[];
}

export interface DatasetRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  context: 'retail' | 'saas' | 'inventory' | 'finance' | 'general';
  filename: string;
  fileSize: string;
  rowCount: number;
  colCount: number;
  uploadedAt: string;
  columns: DatasetColumn[];
  rows: Record<string, any>[];
  qualityReport: DatasetQualityReport;
}

export type QuestionCategory =
  | 'Sales Performance'
  | 'Profitability'
  | 'Product Performance'
  | 'Regional Performance'
  | 'Customer Analysis'
  | 'Discount Analysis'
  | 'Time-based Trends';

export interface BusinessQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  description: string;
  requiredRoles: SemanticRole[];
  isAvailable: boolean;
  missingRequirementText?: string;
  recommendedChart: 'line' | 'bar' | 'horizontal_bar' | 'scatter_grouped' | 'kpi' | 'table';
}

export interface AnalysisPlanItem {
  questionId: string;
  question: string;
  category: QuestionCategory;
  metricRole?: SemanticRole;
  dimensionRole?: SemanticRole;
  aggregation: 'sum' | 'mean' | 'count_distinct' | 'count' | 'ratio';
  chartType: 'line' | 'bar' | 'horizontal_bar' | 'scatter_grouped' | 'kpi' | 'table';
  isFeasible: boolean;
  reason?: string;
  calculationExplanation: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  extra?: string | number;
}

export interface DashboardCard {
  id: string;
  question: string;
  title: string;
  category: QuestionCategory;
  chartType: 'line' | 'bar' | 'horizontal_bar' | 'scatter_grouped' | 'kpi' | 'table';
  unit: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: ChartDataPoint[];
  interpretation: string;
  warning?: string;
  headlineValue?: string;
  headlineSub?: string;
}

export interface SavedDashboardRecord {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: string;
  selectedQuestions: string[];
  cards: DashboardCard[];
  createdAt: string;
  lastUpdatedAt: string;
}

export interface DashboardFilterState {
  dateRange: 'All' | 'Last 30 Days' | 'Last Quarter' | 'Year 2026' | 'Year 2025';
  selectedCategory: string;
  selectedRegion: string;
  selectedSegment: string;
}

export type ExportFormat = 'pdf' | 'pdf_summary' | 'pptx' | 'pbix' | 'powerbi';
export type ExportStatus = 'Queued' | 'Generating' | 'Completed' | 'Failed';

export interface ExportJobRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  reportName: string;
  datasetId: string;
  datasetName: string;
  selectedQuestions: string[];
  format: ExportFormat;
  createdAt: string;
  fileSize: string;
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  summaryMetrics?: {
    totalSales?: string;
    totalProfit?: string;
    profitMargin?: string;
    orders?: string;
  };
}

export interface PowerBiWorkspaceItem {
  id: string;
  name: string;
  capacity: 'Premium' | 'Pro' | 'Dedicated';
  accessRole: 'Admin' | 'Member' | 'Contributor' | 'Viewer';
  isPermitted: boolean;
}

export interface PowerBiReportItem {
  id: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  datasetId: string;
  datasetName: string;
  webUrl: string;
  embedUrl: string;
  isPbixDownloadAllowed: boolean;
  pbixUnavailableReason?: string;
  lastRefreshed: string;
  pages: string[];
  metrics: string[];
  visualsCount: number;
}

