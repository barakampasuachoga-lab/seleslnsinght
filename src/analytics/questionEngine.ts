import { AnalysisPlanItem, BusinessQuestion, DatasetRecord, QuestionCategory, SemanticRole } from './types';

/**
 * All candidate business questions organized by analytical discipline.
 */
const MASTER_QUESTIONS: Omit<BusinessQuestion, 'isAvailable' | 'missingRequirementText'>[] = [
  // 1. Sales Performance
  {
    id: 'q_sales_total',
    category: 'Sales Performance',
    question: 'What are my total sales and revenue?',
    description: 'Calculates headline gross transaction revenue and overall sales volume.',
    requiredRoles: ['sales'],
    recommendedChart: 'kpi',
  },
  {
    id: 'q_sales_trend',
    category: 'Sales Performance',
    question: 'How are sales changing over time?',
    description: 'Plots chronological sales trend across available date periods.',
    requiredRoles: ['sales', 'date'],
    recommendedChart: 'line',
  },
  {
    id: 'q_sales_peak_month',
    category: 'Sales Performance',
    question: 'Which period had the highest sales volume?',
    description: 'Identifies the peak commercial revenue period and seasonality peaks.',
    requiredRoles: ['sales', 'date'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_sales_aov',
    category: 'Sales Performance',
    question: 'What is the average order value (AOV)?',
    description: 'Computes mean revenue generated per distinct order or transaction cart.',
    requiredRoles: ['sales'],
    recommendedChart: 'kpi',
  },

  // 2. Profitability
  {
    id: 'q_profit_total',
    category: 'Profitability',
    question: 'What is my total net profit and margin %?',
    description: 'Evaluates bottom-line operating earnings and overall profit margin efficiency.',
    requiredRoles: ['profit'],
    recommendedChart: 'kpi',
  },
  {
    id: 'q_profit_by_category',
    category: 'Profitability',
    question: 'How does profit margin vary across product categories?',
    description: 'Compares operating margins and profit contributions across product lines.',
    requiredRoles: ['profit', 'category'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_profit_loss_makers',
    category: 'Profitability',
    question: 'Which products or categories are generating commercial losses?',
    description: 'Surfaces negative-profit items suffering margin destruction.',
    requiredRoles: ['profit'],
    recommendedChart: 'horizontal_bar',
  },
  {
    id: 'q_profit_trend',
    category: 'Profitability',
    question: 'How is net profit trending over time compared to revenue?',
    description: 'Examines whether earnings growth is keeping pace with top-line sales growth.',
    requiredRoles: ['sales', 'profit', 'date'],
    recommendedChart: 'line',
  },

  // 3. Product Performance
  {
    id: 'q_product_category_revenue',
    category: 'Product Performance',
    question: 'Which categories generate the most revenue?',
    description: 'Ranks product categories by gross transactional turnover.',
    requiredRoles: ['sales', 'category'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_product_category_share',
    category: 'Product Performance',
    question: 'What percentage of total sales comes from each category?',
    description: 'Computes commercial market share distribution across business lines.',
    requiredRoles: ['sales', 'category'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_product_top_selling',
    category: 'Product Performance',
    question: 'Which specific products generate the highest revenue?',
    description: 'Ranks top 10 commercial SKUs driving business volume.',
    requiredRoles: ['sales'],
    recommendedChart: 'horizontal_bar',
  },
  {
    id: 'q_product_low_performers',
    category: 'Product Performance',
    question: 'Which products have low sales and require inventory review?',
    description: 'Identifies slow-moving inventory lines with minimal sales contributions.',
    requiredRoles: ['sales'],
    recommendedChart: 'table',
  },

  // 4. Regional Performance
  {
    id: 'q_region_revenue',
    category: 'Regional Performance',
    question: 'Which geographic region generates the most revenue?',
    description: 'Compares top-line sales performance across geographic territories.',
    requiredRoles: ['sales', 'region'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_region_profit_comparison',
    category: 'Regional Performance',
    question: 'How do profit margins compare across different regions?',
    description: 'Evaluates regional profitability to discover underperforming distribution hubs.',
    requiredRoles: ['sales', 'profit', 'region'],
    recommendedChart: 'bar',
  },

  // 5. Customer Analysis
  {
    id: 'q_customer_segment_revenue',
    category: 'Customer Analysis',
    question: 'Which customer segments contribute the most sales?',
    description: 'Analyzes revenue share across Consumer, Corporate, and Home Office groups.',
    requiredRoles: ['sales', 'customer_segment'],
    recommendedChart: 'bar',
  },
  {
    id: 'q_customer_concentration',
    category: 'Customer Analysis',
    question: 'How concentrated are sales among the largest customer accounts?',
    description: 'Evaluates key account revenue dependency and customer volume.',
    requiredRoles: ['sales', 'customer'],
    recommendedChart: 'table',
  },

  // 6. Discount Analysis
  {
    id: 'q_discount_sensitivity',
    category: 'Discount Analysis',
    question: 'How are promotional discounts associated with profitability?',
    description: 'Evaluates margin degradation across promotional discount tiers.',
    requiredRoles: ['sales', 'profit', 'discount'],
    recommendedChart: 'scatter_grouped',
  },
  {
    id: 'q_discount_loss_bands',
    category: 'Discount Analysis',
    question: 'Which discount levels cause the deepest operating losses?',
    description: 'Pinpoints exact discount thresholds (e.g. >20%) that cause negative returns.',
    requiredRoles: ['profit', 'discount'],
    recommendedChart: 'scatter_grouped',
  },

  // 7. Time-based Trends
  {
    id: 'q_time_monthly_trend',
    category: 'Time-based Trends',
    question: 'What are the monthly revenue trends across the dataset?',
    description: 'Aggregates sales performance by month and analyzes growth momentum.',
    requiredRoles: ['sales', 'date'],
    recommendedChart: 'line',
  },
  {
    id: 'q_time_seasonal_patterns',
    category: 'Time-based Trends',
    question: 'Which quarters exhibit recurring seasonal surges or slumps?',
    description: 'Aggregates quarterly volumes to reveal cyclical commercial patterns.',
    requiredRoles: ['sales', 'date'],
    recommendedChart: 'bar',
  },
];

/**
 * Automatically inspects dataset columns and determines question availability with clear guidance.
 */
export function generateSuggestedQuestions(dataset: DatasetRecord): BusinessQuestion[] {
  const presentRoles = new Set(dataset.columns.map((c) => c.semanticRole));

  return MASTER_QUESTIONS.map((q) => {
    const missingRoles = q.requiredRoles.filter((role) => {
      if (role === 'customer_segment' && !presentRoles.has('customer_segment') && !presentRoles.has('category')) {
        return true;
      }
      return !presentRoles.has(role);
    });

    const isAvailable = missingRoles.length === 0;
    const missingRequirementText = !isAvailable
      ? `Requires: ${missingRoles.map((r) => r.replace('_', ' ').toUpperCase()).join(', ')} column`
      : undefined;

    return {
      ...q,
      isAvailable,
      missingRequirementText,
    };
  });
}

/**
 * Natural Language Question Interpreter: translates custom user query into an analysis plan.
 */
export function parseNaturalLanguageQuestion(userQuery: string, dataset: DatasetRecord): AnalysisPlanItem {
  const query = userQuery.toLowerCase().trim();
  const presentRoles = new Set(dataset.columns.map((c) => c.semanticRole));

  // Determine intent & metric
  let metricRole: SemanticRole = 'sales';
  let category: QuestionCategory = 'Sales Performance';

  if (query.includes('profit') || query.includes('margin') || query.includes('loss') || query.includes('earning')) {
    metricRole = 'profit';
    category = 'Profitability';
  } else if (query.includes('discount') || query.includes('promo') || query.includes('markdown')) {
    metricRole = 'discount';
    category = 'Discount Analysis';
  } else if (query.includes('quantity') || query.includes('unit') || query.includes('volume') || query.includes('sold')) {
    metricRole = 'quantity';
    category = 'Product Performance';
  } else if (query.includes('cost') || query.includes('cogs') || query.includes('expense')) {
    metricRole = 'cost';
    category = 'Sales Performance';
  }

  // Determine dimension
  let dimensionRole: SemanticRole | undefined = undefined;
  let chartType: AnalysisPlanItem['chartType'] = 'bar';

  if (query.includes('month') || query.includes('time') || query.includes('trend') || query.includes('year') || query.includes('date') || query.includes('day') || query.includes('over time')) {
    dimensionRole = 'date';
    chartType = 'line';
    category = 'Time-based Trends';
  } else if (query.includes('region') || query.includes('state') || query.includes('location') || query.includes('city') || query.includes('geographic')) {
    dimensionRole = 'region';
    chartType = 'bar';
    category = 'Regional Performance';
  } else if (query.includes('segment') || query.includes('tier') || query.includes('audience')) {
    dimensionRole = 'customer_segment';
    chartType = 'bar';
    category = 'Customer Analysis';
  } else if (query.includes('customer') || query.includes('client') || query.includes('account')) {
    dimensionRole = 'customer';
    chartType = 'table';
    category = 'Customer Analysis';
  } else if (query.includes('product') || query.includes('sku') || query.includes('item')) {
    dimensionRole = 'product_name';
    chartType = 'horizontal_bar';
    category = 'Product Performance';
  } else if (query.includes('category') || query.includes('department') || query.includes('line')) {
    dimensionRole = 'category';
    chartType = 'bar';
    category = 'Product Performance';
  } else if (query.includes('discount') && (query.includes('profit') || query.includes('margin'))) {
    dimensionRole = 'discount';
    chartType = 'scatter_grouped';
    category = 'Discount Analysis';
  }

  // Check feasibility
  const requiredRoles: SemanticRole[] = [metricRole];
  if (dimensionRole) requiredRoles.push(dimensionRole);

  const missingRoles = requiredRoles.filter((r) => !presentRoles.has(r));
  const isFeasible = missingRoles.length === 0;

  let reason: string | undefined = undefined;
  if (!isFeasible) {
    const missingNames = missingRoles.map((r) => r.replace('_', ' ').toUpperCase()).join(' and ');
    const availableCols = dataset.columns.map((c) => c.name).join(', ');
    reason = `Dataset lacks ${missingNames} attributes. Available fields in ${dataset.filename}: [${availableCols}].`;
  }

  const calculationExplanation = isFeasible
    ? dimensionRole
      ? `Group by '${dimensionRole}' and calculate ${metricRole.toUpperCase()} aggregations.`
      : `Compute headline ${metricRole.toUpperCase()} executive metric summary.`
    : `Cannot execute: Missing ${missingRoles.join(', ')} column in dataset schema.`;

  return {
    questionId: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    question: userQuery.trim(),
    category,
    metricRole,
    dimensionRole,
    aggregation: metricRole === 'profit' && query.includes('margin') ? 'ratio' : 'sum',
    chartType,
    isFeasible,
    reason,
    calculationExplanation,
  };
}

/**
 * Builds the combined execution analysis plan.
 */
export function buildAnalysisPlan(
  selectedQuestions: BusinessQuestion[],
  customQuestions: AnalysisPlanItem[],
  dataset: DatasetRecord
): AnalysisPlanItem[] {
  const plan: AnalysisPlanItem[] = [];

  for (const q of selectedQuestions) {
    if (!q.isAvailable) continue;

    let metricRole: SemanticRole = 'sales';
    let dimensionRole: SemanticRole | undefined = undefined;
    let aggregation: AnalysisPlanItem['aggregation'] = 'sum';

    if (q.id.includes('profit')) metricRole = 'profit';
    if (q.id.includes('discount')) metricRole = 'discount';
    if (q.id.includes('margin')) aggregation = 'ratio';

    if (q.id.includes('category')) dimensionRole = 'category';
    if (q.id.includes('region')) dimensionRole = 'region';
    if (q.id.includes('trend') || q.id.includes('month') || q.id.includes('time') || q.id.includes('seasonal')) dimensionRole = 'date';
    if (q.id.includes('segment')) dimensionRole = 'customer_segment';
    if (q.id.includes('product_top') || q.id.includes('loss_maker')) dimensionRole = 'product_name';

    plan.push({
      questionId: q.id,
      question: q.question,
      category: q.category,
      metricRole,
      dimensionRole,
      aggregation,
      chartType: q.recommendedChart,
      isFeasible: true,
      calculationExplanation: dimensionRole
        ? `Aggregate ${metricRole} grouped by ${dimensionRole} using ${aggregation.toUpperCase()}.`
        : `Calculate global ${metricRole} KPI metric.`,
    });
  }

  // Add custom questions
  for (const cq of customQuestions) {
    plan.push(cq);
  }

  return plan;
}
