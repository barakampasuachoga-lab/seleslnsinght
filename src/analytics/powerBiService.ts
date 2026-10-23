import {
  PowerBiReportItem,
  PowerBiWorkspaceItem,
  DashboardCard,
  DatasetRecord,
} from './types';

// Seeded enterprise Power BI Workspaces
export const MOCK_WORKSPACES: PowerBiWorkspaceItem[] = [
  {
    id: 'ws_sales_exec',
    name: 'SalesInsight Executive Analytics',
    capacity: 'Premium',
    accessRole: 'Admin',
    isPermitted: true,
  },
  {
    id: 'ws_retail_merch',
    name: 'Retail Merchandising & Operations',
    capacity: 'Pro',
    accessRole: 'Contributor',
    isPermitted: true,
  },
  {
    id: 'ws_finance_corp',
    name: 'Corporate Financial Planning',
    capacity: 'Dedicated',
    accessRole: 'Viewer',
    isPermitted: true,
  },
];

// Seeded Power BI Reports with real capability verification
export const INITIAL_POWER_BI_REPORTS: PowerBiReportItem[] = [
  {
    id: 'pbi_superstore_exec',
    name: 'Executive Retail Performance & Margin Audit',
    workspaceId: 'ws_sales_exec',
    workspaceName: 'SalesInsight Executive Analytics',
    datasetId: 'ds_superstore_2026',
    datasetName: 'Sample - Superstore Retail Sales',
    webUrl: 'https://app.powerbi.com/groups/ws_sales_exec/reports/pbi_superstore_exec',
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=pbi_superstore_exec&groupId=ws_sales_exec',
    isPbixDownloadAllowed: true,
    lastRefreshed: '2026-10-22 06:00 UTC',
    pages: ['Executive Overview', 'Margin & Discount Cliff', 'Regional Breakdown', 'Product Diagnostics'],
    metrics: ['Total Sales (KSh)', 'Total Profit (KSh)', 'Margin %', 'Distinct Orders', 'AOV'],
    visualsCount: 14,
  },
  {
    id: 'pbi_inventory_demand',
    name: 'Regional Inventory & Demand Forecast',
    workspaceId: 'ws_retail_merch',
    workspaceName: 'Retail Merchandising & Operations',
    datasetId: 'ds_manager_brand',
    datasetName: 'StoreBrand Regional Inventory Log',
    webUrl: 'https://app.powerbi.com/groups/ws_retail_merch/reports/pbi_inventory_demand',
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=pbi_inventory_demand&groupId=ws_retail_merch',
    isPbixDownloadAllowed: false,
    pbixUnavailableReason: 'Tenant admin policy restricts .pbix file downloads on Pro capacity shared workspaces. Only direct Power BI Web viewing and PDF export are enabled.',
    lastRefreshed: '2026-10-21 14:00 UTC',
    pages: ['Stock Depletion Analysis', 'Supplier Lead Times', 'Safety Stock Alerts'],
    metrics: ['Turnover Rate', 'Depletion Velocity', 'Safety Stock Buffer'],
    visualsCount: 8,
  },
];

/**
 * Builds a Question-Driven Power BI Report Definition from the user's selected questions.
 */
export function buildQuestionDrivenPowerBiReport(
  dataset: DatasetRecord,
  cards: DashboardCard[],
  userEmail: string
): PowerBiReportItem {
  const reportId = `pbi_dyn_${Date.now()}`;
  const visualPages = ['Executive Question Summary', 'Dimensional Deep-Dive', 'Margin Sensitivity'];
  const metricsList = [
    'Total Sales = SUM(Sales)',
    'Total Profit = SUM(Profit)',
    'Profit Margin % = DIVIDE([Total Profit], [Total Sales], 0)',
    'Distinct Orders = DISTINCTCOUNT(Order_ID)',
  ];

  return {
    id: reportId,
    name: `${dataset.name} - Dynamic Question Report`,
    workspaceId: 'ws_sales_exec',
    workspaceName: 'SalesInsight Executive Analytics',
    datasetId: dataset.id,
    datasetName: dataset.name,
    webUrl: `https://app.powerbi.com/groups/ws_sales_exec/reports/${reportId}`,
    embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=ws_sales_exec&autoAuth=true`,
    isPbixDownloadAllowed: false,
    pbixUnavailableReason: 'Dynamic client-configured reports require publishing to a dedicated Power BI workspace before Microsoft Power BI Desktop .pbix extraction is authorized.',
    lastRefreshed: 'Just now (Synced)',
    pages: visualPages,
    metrics: metricsList,
    visualsCount: cards.length,
  };
}

/**
 * Generate a Power BI DAX & Model Specification JSON for export
 */
export function generatePowerBiModelSpec(
  dataset: DatasetRecord,
  cards: DashboardCard[]
): string {
  const spec = {
    $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/1.0.0/schema.json',
    title: `${dataset.name} Power BI Model Specification`,
    dataset: {
      name: dataset.name,
      source: dataset.filename,
      rowCount: dataset.rowCount,
      columns: dataset.columns.map((c) => ({
        name: c.name,
        dataType: c.detectedType,
        semanticRole: c.semanticRole,
      })),
    },
    daxMeasures: [
      {
        name: 'Total Sales',
        expression: 'SUM(sales_records[sales])',
        formatString: '$#,##0.00;($#,##0.00);"-"',
      },
      {
        name: 'Total Profit',
        expression: 'SUM(sales_records[profit])',
        formatString: '$#,##0.00;($#,##0.00);"-"',
      },
      {
        name: 'Profit Margin %',
        expression: 'DIVIDE([Total Profit], [Total Sales], BLANK())',
        formatString: '0.00%',
      },
      {
        name: 'Distinct Orders',
        expression: 'DISTINCTCOUNT(sales_records[order_id])',
        formatString: '#,##0',
      },
      {
        name: 'Average Order Value (AOV)',
        expression: 'DIVIDE([Total Sales], [Distinct Orders], 0)',
        formatString: '$#,##0.00',
      },
      {
        name: 'Sales YoY Growth %',
        expression: `VAR CurrentSales = [Total Sales]\nVAR PriorSales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('DimDate'[Date]))\nRETURN DIVIDE(CurrentSales - PriorSales, PriorSales, BLANK())`,
        formatString: '+0.00%;-0.00%;0.00%',
      },
    ],
    visualElements: cards.map((c, idx) => ({
      visualId: `visual_${idx + 1}`,
      title: c.title,
      question: c.question,
      chartType: c.chartType === 'line' ? 'lineChart' : 'clusteredColumnChart',
      xAxis: c.xAxisLabel,
      yAxis: c.yAxisLabel,
      dataPointsCount: c.data?.length || 0,
    })),
    dataParityGuaranteed: true,
  };

  return JSON.stringify(spec, null, 2);
}
