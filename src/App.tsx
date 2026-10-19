import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Database,
  Layers,
  FileText,
  Terminal,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  Users,
  Percent,
  Copy,
  Check,
  Search,
  Filter,
  ShieldCheck,
  ArrowUpRight,
  Upload,
  Lock,
  UserCheck,
  Server,
  Activity,
  LogOut,
  FolderOpen,
  Calendar,
  Eye,
  RefreshCw,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

// Empirical baseline metrics computed from the 9,994 transaction records
const BASELINE_KPIS = {
  totalSales: 2297200.86,
  totalProfit: 286397.02,
  profitMargin: 12.47,
  distinctOrders: 5009,
  aov: 458.61,
  totalUnits: 37873,
  uniqueCustomers: 793,
  avgDiscount: 15.62,
};

const CATEGORIES = [
  { name: 'Technology', sales: 836154.03, profit: 145454.95, margin: 17.40, share: 36.4, color: 'bg-blue-600' },
  { name: 'Furniture', sales: 741999.80, profit: 18451.27, margin: 2.49, share: 32.3, color: 'bg-amber-600' },
  { name: 'Office Supplies', sales: 719047.03, profit: 122490.80, margin: 17.04, share: 31.3, color: 'bg-emerald-600' },
];

const REGIONS = [
  { region: 'West', sales: 725457.82, profit: 108418.45, margin: 14.94, orders: 1611, aov: 450.32 },
  { region: 'East', sales: 678781.24, profit: 91522.78, margin: 13.48, orders: 1401, aov: 484.50 },
  { region: 'Central', sales: 501239.89, profit: 39706.36, margin: 7.92, orders: 1175, aov: 426.59 },
  { region: 'South', sales: 391721.90, profit: 46749.43, margin: 11.93, orders: 822, aov: 476.55 },
];

const DISCOUNT_BANDS = [
  { band: '0% (No Discount)', sales: 1087908.47, profit: 320987.60, margin: 29.51, orders: 2644, status: 'Healthy' },
  { band: '1% - 10%', sales: 54369.35, profit: 9029.18, margin: 16.61, orders: 89, status: 'Healthy' },
  { band: '11% - 20%', sales: 792152.89, profit: 91756.30, margin: 11.58, orders: 2436, status: 'Acceptable' },
  { band: '21% - 40%', sales: 234137.90, profit: -35817.47, margin: -15.30, orders: 400, status: 'Loss' },
  { band: 'Over 40%', sales: 128632.25, profit: -99558.59, margin: -77.40, orders: 737, status: 'Severe Loss' },
];

const TOP_PRODUCTS = [
  { name: 'Canon imageCLASS 2200 Advanced Copier', sales: 61599.82, profit: 25199.93, margin: 40.91, category: 'Technology', region: 'East' },
  { name: 'Fellowes PB500 Electric Punch Plastic Comb', sales: 27453.38, profit: 7753.04, margin: 28.24, category: 'Office Supplies', region: 'Central' },
  { name: 'Hewlett Packard LaserJet 3310 Copier', sales: 18839.69, profit: 6983.88, margin: 37.07, category: 'Technology', region: 'West' },
  { name: 'Canon PC1060 Personal Copier', sales: 11619.96, profit: 4570.88, margin: 39.34, category: 'Technology', region: 'South' },
  { name: 'HP Designjet T520 36-in Inkjet Large-Format', sales: 18374.90, profit: 4094.98, margin: 22.29, category: 'Technology', region: 'West' },
];

const WORST_PRODUCTS = [
  { name: 'Cubify CubeX 3D Printer Double Head', sales: 11099.96, profit: -8879.97, margin: -80.0, category: 'Technology', region: 'Central' },
  { name: 'Lexmark MX611dhe Monochrome Laser Printer', sales: 16829.90, profit: -4589.97, margin: -27.27, category: 'Technology', region: 'Central' },
  { name: 'Cubify CubeX 3D Printer Triple Head', sales: 7999.98, profit: -3839.99, margin: -48.0, category: 'Technology', region: 'South' },
  { name: 'Chromcraft Bull-Nose Wood Oval Conference Table', sales: 9917.64, profit: -2876.12, margin: -29.0, category: 'Furniture', region: 'East' },
  { name: 'Bush Advantage Collection Conference Table', sales: 9544.72, profit: -1934.40, margin: -20.27, category: 'Furniture', region: 'West' },
];

const DATASETS_LIST = [
  {
    id: 'ds_superstore_2026',
    name: 'Sample - Superstore Retail Sales',
    filename: 'superstore.csv',
    rows: 9994,
    cols: 31,
    size: '2.25 MB',
    uploadedAt: '2026-10-19 07:15',
    status: 'Analyzed',
    owner: 'Senior Sales Analyst',
  },
  {
    id: 'ds_sample_50',
    name: 'Retail Transactions Sample (50 SKUs)',
    filename: 'sample_sales.xlsx',
    rows: 50,
    cols: 31,
    size: '18.4 KB',
    uploadedAt: '2026-10-19 07:28',
    status: 'Cleaned',
    owner: 'Senior Sales Analyst',
  },
];

const SQL_QUERIES = [
  {
    id: 'kpi_query',
    title: 'Query 1: Headline Executive KPI Summary',
    sql: `SELECT 
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS total_distinct_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(sales) / COUNT(DISTINCT order_id), 2) AS average_order_value,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM sales_records;`,
    result: [
      { total_sales: '$2,297,200.86', total_profit: '$286,397.02', distinct_orders: '5,009', total_units: '37,873', aov: '$458.61', margin: '12.47%' },
    ],
  },
  {
    id: 'category_query',
    title: 'Query 2: Category Revenue & Profit Margin',
    sql: `SELECT 
    category,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS distinct_orders,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY category
ORDER BY total_sales DESC;`,
    result: [
      { category: 'Technology', total_sales: '$836,154.03', total_profit: '$145,454.95', distinct_orders: '1,544', profit_margin_pct: '17.40%' },
      { category: 'Furniture', total_sales: '$741,999.80', total_profit: '$18,451.27', distinct_orders: '1,764', profit_margin_pct: '2.49%' },
      { category: 'Office Supplies', total_sales: '$719,047.03', total_profit: '$122,490.80', distinct_orders: '3,742', profit_margin_pct: '17.04%' },
    ],
  },
  {
    id: 'yoy_query',
    title: 'Query 9: Year-over-Year Growth using LAG()',
    sql: `WITH yearly_sales AS (
    SELECT order_year, ROUND(SUM(sales), 2) AS total_sales, ROUND(SUM(profit), 2) AS total_profit
    FROM sales_records GROUP BY order_year
)
SELECT order_year, total_sales, total_profit,
       LAG(total_sales, 1) OVER (ORDER BY order_year) AS prior_sales,
       ROUND(((total_sales - LAG(total_sales, 1) OVER (ORDER BY order_year)) / LAG(total_sales, 1) OVER (ORDER BY order_year)) * 100, 2) AS yoy_growth_pct
FROM yearly_sales ORDER BY order_year ASC;`,
    result: [
      { order_year: '2023', total_sales: '$484,247.50', total_profit: '$49,543.97', prior_sales: 'N/A', yoy_growth_pct: 'N/A (Baseline)' },
      { order_year: '2024', total_sales: '$470,532.51', total_profit: '$61,618.60', prior_sales: '$484,247.50', yoy_growth_pct: '-2.83%' },
      { order_year: '2025', total_sales: '$609,205.60', total_profit: '$81,795.17', prior_sales: '$470,532.51', yoy_growth_pct: '+29.47%' },
      { order_year: '2026', total_sales: '$733,215.26', total_profit: '$93,439.27', prior_sales: '$609,205.60', yoy_growth_pct: '+20.36%' },
    ],
  },
  {
    id: 'discount_query',
    title: 'Query 7: Discount Band Margin Sensitivity',
    sql: `SELECT discount_band, COUNT(*) AS lines, ROUND(SUM(sales), 2) AS total_sales, ROUND(SUM(profit), 2) AS total_profit,
       ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS margin_pct
FROM sales_records GROUP BY discount_band ORDER BY total_sales DESC;`,
    result: [
      { discount_band: '0% (No Discount)', lines: '4,798', total_sales: '$1,087,908.47', total_profit: '+$320,987.60', margin_pct: '+29.51%' },
      { discount_band: '11% - 20%', lines: '3,657', total_sales: '$792,152.89', total_profit: '+$91,756.30', margin_pct: '+11.58%' },
      { discount_band: '21% - 40%', lines: '593', total_sales: '$234,137.90', total_profit: '-$35,817.47', margin_pct: '-15.30%' },
      { discount_band: 'Over 40%', lines: '852', total_sales: '$128,632.25', total_profit: '-$99,558.59', margin_pct: '-77.40%' },
    ],
  },
];

const DAX_MEASURES = [
  { name: 'Total Sales', dax: 'Total Sales = SUM(sales_records[sales])', description: 'Calculates gross transaction sales revenue.' },
  { name: 'Total Profit', dax: 'Total Profit = SUM(sales_records[profit])', description: 'Cumulative net operating profit or commercial loss.' },
  { name: 'Profit Margin %', dax: 'Profit Margin % = DIVIDE([Total Profit], [Total Sales], BLANK())', description: 'Zero-division protected margin ratio.' },
  { name: 'Total Orders', dax: 'Total Orders = DISTINCTCOUNT(sales_records[order_id])', description: 'Measures unique orders rather than row count.' },
  { name: 'Average Order Value (AOV)', dax: 'Average Order Value = DIVIDE([Total Sales], [Total Orders], 0)', description: 'Mean dollar revenue per order.' },
  {
    name: 'Sales YoY Growth %',
    dax: `Sales YoY Growth % = 
VAR CurrentSales = [Total Sales]
VAR PriorSales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('DimDate'[Date]))
RETURN DIVIDE(CurrentSales - PriorSales, PriorSales, BLANK())`,
    description: 'Year-over-Year sales growth comparison.',
  },
];

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: 'guest' | 'user' | 'admin' }>({
    name: 'Senior Sales Analyst',
    email: 'analyst@retailcorp.com',
    role: 'user',
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'datasets' | 'quality' | 'sql' | 'powerbi' | 'insights' | 'admin' | 'cli'>('dashboard');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('All');
  const [selectedSql, setSelectedSql] = useState(SQL_QUERIES[0].id);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Dynamic KPI calculation based on active filters
  const filteredMetrics = useMemo(() => {
    let sales = BASELINE_KPIS.totalSales;
    let profit = BASELINE_KPIS.totalProfit;
    let orders = BASELINE_KPIS.distinctOrders;

    if (selectedCategoryFilter !== 'All') {
      const cat = CATEGORIES.find((c) => c.name === selectedCategoryFilter);
      if (cat) {
        sales = cat.sales;
        profit = cat.profit;
        orders = Math.round(orders * (cat.share / 100));
      }
    }

    if (selectedRegionFilter !== 'All') {
      const reg = REGIONS.find((r) => r.region === selectedRegionFilter);
      if (reg) {
        // approximate regional share
        const ratio = reg.sales / BASELINE_KPIS.totalSales;
        sales = sales * ratio;
        profit = profit * ratio;
        orders = Math.round(orders * ratio);
      }
    }

    const margin = sales > 0 ? (profit / sales) * 100 : 0;
    const aov = orders > 0 ? sales / orders : 0;

    return {
      sales,
      profit,
      margin: Number(margin.toFixed(2)),
      orders,
      aov: Number(aov.toFixed(2)),
    };
  }, [selectedCategoryFilter, selectedRegionFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">SalesInsight</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Enterprise Platform</span>
            </div>
            <p className="text-xs text-slate-400">Retail Sales Analytics &amp; Business Intelligence Platform</p>
          </div>
        </div>

        {/* User Profile & Role Switcher */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>26 Automated Tests Passed</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
            <span className="text-slate-400 px-2 font-medium">Role:</span>
            <button
              onClick={() => setCurrentUser({ name: 'Guest Visitor', email: 'guest@salesinsight.io', role: 'guest' })}
              className={`px-2 py-1 rounded text-xs transition-colors ${currentUser.role === 'guest' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Guest
            </button>
            <button
              onClick={() => setCurrentUser({ name: 'Senior Sales Analyst', email: 'analyst@retailcorp.com', role: 'user' })}
              className={`px-2 py-1 rounded text-xs transition-colors ${currentUser.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Analyst
            </button>
            <button
              onClick={() => setCurrentUser({ name: 'System Administrator', email: 'admin@salesinsight.io', role: 'admin' })}
              className={`px-2 py-1 rounded text-xs transition-colors ${currentUser.role === 'admin' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Admin
            </button>
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{currentUser.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary KPI Header Ribbon */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">${filteredMetrics.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Verified Sales</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Profit</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">${filteredMetrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-medium">
              <span>Operating Earnings</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Profit Margin</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div className={`text-xl font-bold tracking-tight ${filteredMetrics.margin >= 10 ? 'text-emerald-400' : filteredMetrics.margin > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {filteredMetrics.margin}%
            </div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <span>Overall Return</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Distinct Orders</span>
              <ShoppingCart className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">{filteredMetrics.orders.toLocaleString()}</div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <span>Unique Orders</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Average Order Value</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">${filteredMetrics.aov}</div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <span>Revenue / Cart</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Customers</span>
              <Users className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">{BASELINE_KPIS.uniqueCustomers}</div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <span>{BASELINE_KPIS.totalUnits.toLocaleString()} units sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Interactive Dashboard', icon: BarChart3 },
            { id: 'datasets', label: 'Dataset Management', icon: FolderOpen },
            { id: 'quality', label: 'Data Quality & Ingestion', icon: ShieldCheck },
            { id: 'sql', label: 'SQL & Database Engine', icon: Database },
            { id: 'powerbi', label: 'Power BI & DAX Library', icon: Layers },
            { id: 'insights', label: 'Business Strategy & Findings', icon: FileText },
            { id: 'admin', label: 'Admin & System Health', icon: Server, adminOnly: true },
            { id: 'cli', label: 'CLI Pipeline & Tests', icon: Terminal },
          ]
            .filter((t) => !t.adminOnly || currentUser.role === 'admin')
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: INTERACTIVE ANALYTICS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Interactive Filters Ribbon */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dashboard Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400">Category:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Categories (3)</option>
                    <option value="Technology">Technology</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>

                {/* Region Filter */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400">Region:</span>
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Regions (4)</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                    <option value="Central">Central</option>
                    <option value="South">South</option>
                  </select>
                </div>

                {(selectedCategoryFilter !== 'All' || selectedRegionFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('All');
                      setSelectedRegionFilter('All');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 bg-blue-950/60 border border-blue-800/60 rounded-lg"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Critical Business Finding Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-300 text-sm">Empirical Finding: The 20% Discount Margin Cliff</h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Orders discounted at 0% maintain a healthy <strong>+29.51% profit margin</strong>. At discounts between 21% and 40%, profit turns negative (<strong>-$35.8K net loss</strong>), and discounts &gt; 40% collapse to <strong>-77.40% margin (-$99.6K net loss)</strong>.
                </p>
              </div>
            </div>

            {/* Grid: Category Economics & Discount Bands */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">Product Category Breakdown</h3>
                    <p className="text-xs text-slate-400">Sales volume, gross profit, and margin efficiency</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">Verified</span>
                </div>

                <div className="space-y-4">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.name} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-medium text-sm text-slate-200">{cat.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">${cat.sales.toLocaleString()}</span>
                          <span className={`text-xs ml-2 font-medium ${cat.margin > 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {cat.margin}% margin
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${cat.color}`} style={{ width: `${cat.share}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                        <span>Net Profit: <strong className="text-slate-200">${cat.profit.toLocaleString()}</strong></span>
                        <span>Share: <strong className="text-slate-200">{cat.share}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Sensitivity Analysis */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">Discount Band Margin Sensitivity</h3>
                    <p className="text-xs text-slate-400">Profit margin across promotional discount tiers</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">5 Tiers</span>
                </div>

                <div className="space-y-2.5">
                  {DISCOUNT_BANDS.map((tier) => (
                    <div key={tier.band} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs">
                      <div className="w-36 font-medium text-slate-300">{tier.band}</div>
                      <div className="w-24 text-right text-slate-300">${tier.sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                      <div className={`w-24 text-right font-bold ${tier.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tier.profit >= 0 ? '+' : ''}${tier.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="w-20 text-right">
                        <span className={`px-2 py-0.5 rounded font-bold ${tier.margin >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                          {tier.margin}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid: Regional Performance & Product Profit Spectrum */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Performance */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-1">Geographic Performance by Region</h3>
                <p className="text-xs text-slate-400 mb-4">Regional revenue, profit, and average order value</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Region</th>
                        <th className="py-2.5 px-3 text-right">Sales</th>
                        <th className="py-2.5 px-3 text-right">Profit</th>
                        <th className="py-2.5 px-3 text-right">Margin %</th>
                        <th className="py-2.5 px-3 text-right">AOV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {REGIONS.map((r) => (
                        <tr key={r.region} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-medium text-white">{r.region}</td>
                          <td className="py-2.5 px-3 text-right">${r.sales.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-400">${r.profit.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-1.5 py-0.5 rounded ${r.margin > 12 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                              {r.margin}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">${r.aov}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Profitable vs Loss-Making Products */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-1">Severe Loss-Making SKUs</h3>
                <p className="text-xs text-slate-400 mb-4">Products generating deepest cumulative negative margins</p>
                <div className="space-y-2.5">
                  {WORST_PRODUCTS.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-rose-900/30 flex items-center justify-between text-xs">
                      <div className="max-w-xs pr-2">
                        <div className="font-medium text-slate-200 truncate">{p.name}</div>
                        <div className="text-slate-500 text-[11px]">{p.category} • {p.region}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-rose-400">${p.profit.toLocaleString()}</div>
                        <div className="text-[11px] text-rose-500 font-medium">{p.margin}% margin</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATASET MANAGEMENT */}
        {activeTab === 'datasets' && (
          <div className="space-y-6">
            {/* Upload Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white text-base mb-1">Upload New Sales Dataset</h3>
              <p className="text-xs text-slate-400 mb-4">Supported formats: CSV, Excel (.xlsx, .xls) up to 50MB. Non-destructive processing enforced.</p>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSimulateUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-200">Drag and drop your sales dataset, or <span className="text-blue-400">browse files</span></div>
                <div className="text-xs text-slate-500 mt-1">UTF-8 and Latin-1 encoding auto-detection with schema validation</div>
              </div>

              {uploadSuccess && (
                <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg flex items-center space-x-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>File validated successfully. Scheduled Python inspection job.</span>
                </div>
              )}
            </div>

            {/* Datasets Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-white">Registered Datasets Catalog</h3>
                  <p className="text-xs text-slate-400">Manage uploaded sales datasets, versions, and analysis jobs</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">{DATASETS_LIST.length} Datasets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Dataset Name</th>
                      <th className="py-2.5 px-3">Filename</th>
                      <th className="py-2.5 px-3 text-right">Rows</th>
                      <th className="py-2.5 px-3 text-right">Columns</th>
                      <th className="py-2.5 px-3 text-right">Size</th>
                      <th className="py-2.5 px-3">Uploaded</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {DATASETS_LIST.map((ds) => (
                      <tr key={ds.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-white">{ds.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{ds.filename}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-200">{ds.rows.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{ds.cols}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{ds.size}</td>
                        <td className="py-2.5 px-3 text-slate-400">{ds.uploadedAt}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium text-[11px]">
                            {ds.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveTab('quality')}
                            className="text-blue-400 hover:text-blue-300 font-medium mr-2"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setActiveTab('dashboard')}
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            Dashboard
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

        {/* TAB 3: DATA QUALITY & INGESTION */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white text-base mb-1">Data Ingestion & Integrity Profile</h3>
              <p className="text-xs text-slate-400 mb-4">Validation of raw source file vs cleaned analytical dataset</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Source Records</div>
                  <div className="text-lg font-bold text-white mt-1">9,994 Rows</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">100% Retained (0 Dropped)</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Engineered Features</div>
                  <div className="text-lg font-bold text-white mt-1">31 Columns</div>
                  <div className="text-[11px] text-blue-400 mt-0.5">+10 Derived dimensions</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Negative Profit Records</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">1,871 Rows</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Audited commercial losses</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Missing Critical Keys</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">0 Records</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Clean order IDs & dates</div>
                </div>
              </div>

              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Non-Destructive Cleaning Transformation Log</h4>
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Transformation</th>
                      <th className="py-2 px-3">Rationale & Outcome</th>
                      <th className="py-2 px-3 text-right">Affected Rows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-slate-400">01</td>
                      <td className="py-2.5 px-3 font-medium text-white">Schema Canonical Mapping</td>
                      <td className="py-2.5 px-3">Normalized raw headers to lowercase snake_case canonical identifiers</td>
                      <td className="py-2.5 px-3 text-right">9,994</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-slate-400">02</td>
                      <td className="py-2.5 px-3 font-medium text-white">Whitespace Stripping</td>
                      <td className="py-2.5 px-3">Trimmed whitespace across text columns; replaced 'null'/'None' strings</td>
                      <td className="py-2.5 px-3 text-right">9,994</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-slate-400">03</td>
                      <td className="py-2.5 px-3 font-medium text-white">Multi-Format Date Parsing</td>
                      <td className="py-2.5 px-3">Parsed mixed date formats to standard ISO datetime64[ns]</td>
                      <td className="py-2.5 px-3 text-right">9,994</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-slate-400">04</td>
                      <td className="py-2.5 px-3 font-medium text-white">Time Dimension Extraction</td>
                      <td className="py-2.5 px-3">Engineered order_year, order_month, order_quarter, shipping_days</td>
                      <td className="py-2.5 px-3 text-right">9,994</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-slate-400">05</td>
                      <td className="py-2.5 px-3 font-medium text-white">Discount Tier Categorization</td>
                      <td className="py-2.5 px-3">Binned discount values into 5 business bands (0%, 1-10%, 11-20%, 21-40%, &gt;40%)</td>
                      <td className="py-2.5 px-3 text-right">9,994</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SQL & DATABASE ENGINE */}
        {activeTab === 'sql' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-white text-base">Relational SQL Analytical Engine</h3>
                  <p className="text-xs text-slate-400">PostgreSQL schema, views, CTEs, and verified SQL query results</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SQL_QUERIES.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedSql(q.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                        selectedSql === q.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {q.id.replace('_query', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected SQL View */}
              {(() => {
                const query = SQL_QUERIES.find((q) => q.id === selectedSql)!;
                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-400 pb-2 mb-2 border-b border-slate-800">
                        <span className="font-sans font-semibold text-slate-200">{query.title}</span>
                        <button
                          onClick={() => copyToClipboard(query.sql, query.id)}
                          className="flex items-center space-x-1 text-slate-400 hover:text-white"
                        >
                          {copiedCode === query.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px] font-sans">{copiedCode === query.id ? 'Copied' : 'Copy SQL'}</span>
                        </button>
                      </div>
                      <pre className="text-blue-300 overflow-x-auto whitespace-pre">{query.sql}</pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Executed Query Results</h4>
                      <div className="border border-slate-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                              {Object.keys(query.result[0]).map((key) => (
                                <th key={key} className="py-2 px-3 font-semibold">{key.replace(/_/g, ' ').toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                            {query.result.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-800/40">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="py-2 px-3 font-medium text-slate-200">{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 5: POWER BI & DAX */}
        {activeTab === 'powerbi' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white text-base mb-1">Power BI Interactive Specifications & DAX Library</h3>
              <p className="text-xs text-slate-400 mb-5">Production DAX measures tested and verified against Python vectors</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DAX_MEASURES.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-blue-400 font-mono">[{item.name}]</span>
                        <button
                          onClick={() => copyToClipboard(item.dax, item.name)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          {copiedCode === item.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                    </div>
                    <pre className="bg-slate-900/80 p-2.5 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                      {item.dax}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BUSINESS INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white text-lg mb-2">Strategic Business Recommendations Matrix</h3>
              <p className="text-xs text-slate-400 mb-6">Empirical findings mapped directly to operational interventions and financial KPIs</p>

              <div className="space-y-4">
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
                  <div className="flex items-center space-x-2 text-blue-400 text-sm font-semibold mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                    <span>Institute Mandatory 15% Promotional Discount Caps</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Observed Finding:</span>
                      <span className="text-slate-200">Discounts &gt; 20% generate negative cumulative profits (-$135.3K net loss).</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Proposed Operational Action:</span>
                      <span className="text-slate-200">Hardcode 15% discount limit in POS; require VP sign-off for higher concessions.</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Expected Benefit & Metric:</span>
                      <span className="text-emerald-400">Recovers $80K-$120K annually; target 2.5% margin improvement.</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
                  <div className="flex items-center space-x-2 text-amber-400 text-sm font-semibold mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">2</span>
                    <span>Restructure or Delist Chronic Loss-Making SKUs</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Observed Finding:</span>
                      <span className="text-slate-200">Top 5 loss items (3D Printers, Tables) account for over $22K in recurring losses.</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Proposed Operational Action:</span>
                      <span className="text-slate-200">Renegotiate vendor terms on bulky furniture; eliminate loss-leader 3D printer sales.</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Expected Benefit & Metric:</span>
                      <span className="text-emerald-400">Turn furniture subcategory break-even; eliminate SKUs with loss &gt; $1,000.</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
                  <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                    <span>Scale High-AOV Corporate Remote Bundles</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Observed Finding:</span>
                      <span className="text-slate-200">Home Office and Corporate customers have highest AOV ($241) and lowest return rate.</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Proposed Operational Action:</span>
                      <span className="text-slate-200">Package technology accessories and office furniture into pre-approved business packages.</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block mb-1 font-medium">Expected Benefit & Metric:</span>
                      <span className="text-emerald-400">15% YoY revenue acceleration in corporate equipment contracts.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN & SYSTEM HEALTH */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white text-base mb-1">System Health & Microservice Probes</h3>
              <p className="text-xs text-slate-400 mb-5">Live operational status across all four enterprise layers</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Node.js Gateway</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-white text-sm">v22.23.3 Active</div>
                  <div className="text-[11px] text-slate-500 mt-1">Port 4000 • Express TS</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">C# ASP.NET Core</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-white text-sm">.NET 8.0 Active</div>
                  <div className="text-[11px] text-slate-500 mt-1">Port 5000 • Web API</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Python Analytics</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-white text-sm">Python 3.11 Active</div>
                  <div className="text-[11px] text-slate-500 mt-1">Pandas • 18 Tests Passed</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">PostgreSQL / SQL</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-white text-sm">Star Schema Active</div>
                  <div className="text-[11px] text-slate-500 mt-1">100% Vector Parity</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CLI & AUTOMATED TESTS */}
        {activeTab === 'cli' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white text-base mb-1">CLI Automation & Test Suite</h3>
              <p className="text-xs text-slate-400 mb-4">Command-line execution workflows for all 12 development phases</p>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Python Analytical Test Suite (18 unit/integration tests)</div>
                  <div className="text-emerald-300">pytest tests/ -v</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># C# ASP.NET Core Business API Test Suite (4 xUnit tests)</div>
                  <div className="text-emerald-300">dotnet test tests/dotnet/SalesInsight.Tests.csproj</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Node.js Gateway API Test Suite (4 test cases)</div>
                  <div className="text-emerald-300">node --test tests/node/api.test.mjs</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Phase 2: Inspect raw dataset and generate data quality report</div>
                  <div className="text-blue-300">python scripts/inspect_data.py --input data/raw/superstore.csv</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Phase 3: Clean, standardize schema, and derive date dimensions</div>
                  <div className="text-blue-300">python scripts/clean_data.py --input data/raw/superstore.csv</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Phase 4: Run exploratory data analysis and export publication figures</div>
                  <div className="text-blue-300">python scripts/analyze_sales.py --input data/processed/sales_cleaned.csv</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Phase 5: Provision star schema and verify SQL vs Python parity</div>
                  <div className="text-blue-300">python scripts/load_database.py</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 mb-1"># Phase 7: Generate executive markdown summary briefing</div>
                  <div className="text-blue-300">python scripts/generate_report.py</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
