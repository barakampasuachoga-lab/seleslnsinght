import { buildColumnsMetadata, generateQualityReport } from './dataParser';
import { DatasetRecord } from './types';

// ============================================================================
// 1. Superstore Sales & Profit (Full Sales & Profit Schema)
// ============================================================================
const SUPERSTORE_RAW_ROWS: Record<string, any>[] = [
  { 'Order ID': 'CA-2026-152156', 'Order Date': '2026-11-08', Category: 'Furniture', 'Sub-Category': 'Bookcases', 'Product Name': 'Bush Somerset Collection Bookcase', Sales: '261.96', Profit: '41.91', Discount: '0.00', Quantity: '2', Region: 'South', State: 'Kentucky', Segment: 'Consumer', 'Customer Name': 'Claire Gute' },
  { 'Order ID': 'CA-2026-152156', 'Order Date': '2026-11-08', Category: 'Furniture', 'Sub-Category': 'Chairs', 'Product Name': 'Hon Deluxe Fabric Upholstered Chair', Sales: '731.94', Profit: '219.58', Discount: '0.00', Quantity: '3', Region: 'South', State: 'Kentucky', Segment: 'Consumer', 'Customer Name': 'Claire Gute' },
  { 'Order ID': 'CA-2026-138688', 'Order Date': '2026-06-12', Category: 'Office Supplies', 'Sub-Category': 'Labels', 'Product Name': 'Self-Adhesive Address Labels', Sales: '14.62', Profit: '6.87', Discount: '0.00', Quantity: '2', Region: 'West', State: 'California', Segment: 'Corporate', 'Customer Name': 'Darrin Van Huff' },
  { 'Order ID': 'US-2026-108966', 'Order Date': '2026-10-11', Category: 'Furniture', 'Sub-Category': 'Tables', 'Product Name': 'Bretford CR4500 Series Conference Table', Sales: '957.58', Profit: '-383.03', Discount: '0.45', Quantity: '5', Region: 'South', State: 'Florida', Segment: 'Consumer', 'Customer Name': 'Sean O\'Donnell' },
  { 'Order ID': 'US-2026-108966', 'Order Date': '2026-10-11', Category: 'Office Supplies', 'Sub-Category': 'Storage', 'Product Name': 'Eldon Fold \'N Roll Cart System', Sales: '22.37', Profit: '2.52', Discount: '0.20', Quantity: '2', Region: 'South', State: 'Florida', Segment: 'Consumer', 'Customer Name': 'Sean O\'Donnell' },
  { 'Order ID': 'CA-2026-115812', 'Order Date': '2026-06-09', Category: 'Furniture', 'Sub-Category': 'Furnishings', 'Product Name': 'Eldon Expressions Wood Desk Accessories', Sales: '48.86', Profit: '14.17', Discount: '0.00', Quantity: '7', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Brosina Hoffman' },
  { 'Order ID': 'CA-2026-115812', 'Order Date': '2026-06-09', Category: 'Office Supplies', 'Sub-Category': 'Art', 'Product Name': 'Newell 322 Ballpoint Pens', Sales: '7.28', Profit: '1.97', Discount: '0.00', Quantity: '4', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Brosina Hoffman' },
  { 'Order ID': 'CA-2026-115812', 'Order Date': '2026-06-09', Category: 'Technology', 'Sub-Category': 'Phones', 'Product Name': 'Mitel 5320 IP Phone', Sales: '907.15', Profit: '90.72', Discount: '0.20', Quantity: '6', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Brosina Hoffman' },
  { 'Order ID': 'CA-2026-115812', 'Order Date': '2026-06-09', Category: 'Office Supplies', 'Sub-Category': 'Binders', 'Product Name': 'DXL Angle-D Binders with Locking Rings', Sales: '18.50', Profit: '5.78', Discount: '0.20', Quantity: '3', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Brosina Hoffman' },
  { 'Order ID': 'CA-2026-115812', 'Order Date': '2026-06-09', Category: 'Technology', 'Sub-Category': 'Accessories', 'Product Name': 'Logitech Wireless Marathon Mouse', Sales: '114.90', Profit: '34.47', Discount: '0.00', Quantity: '5', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Brosina Hoffman' },
  { 'Order ID': 'CA-2026-105893', 'Order Date': '2026-11-11', Category: 'Technology', 'Sub-Category': 'Copiers', 'Product Name': 'Canon imageCLASS 2200 Advanced Copier', Sales: '8399.98', Profit: '3919.99', Discount: '0.00', Quantity: '4', Region: 'Central', State: 'Indiana', Segment: 'Home Office', 'Customer Name': 'Tamara Chand' },
  { 'Order ID': 'CA-2026-167199', 'Order Date': '2026-01-25', Category: 'Technology', 'Sub-Category': 'Machines', 'Product Name': 'Cubify CubeX 3D Printer Double Head', Sales: '11099.96', Profit: '-8879.97', Discount: '0.70', Quantity: '5', Region: 'Central', State: 'Texas', Segment: 'Corporate', 'Customer Name': 'Sanjit Chand' },
  { 'Order ID': 'CA-2026-143336', 'Order Date': '2026-08-27', Category: 'Furniture', 'Sub-Category': 'Furnishings', 'Product Name': 'Tenex Traditional Chairmats', Sales: '39.96', Profit: '8.79', Discount: '0.20', Quantity: '2', Region: 'West', State: 'Washington', Segment: 'Consumer', 'Customer Name': 'Zuschuss Donatelli' },
  { 'Order ID': 'CA-2026-137330', 'Order Date': '2026-12-09', Category: 'Office Supplies', 'Sub-Category': 'Appliances', 'Product Name': 'Holmes HEPA Air Purifier', Sales: '245.88', Profit: '61.47', Discount: '0.00', Quantity: '3', Region: 'East', State: 'New York', Segment: 'Corporate', 'Customer Name': 'Ken Black' },
  { 'Order ID': 'CA-2026-137330', 'Order Date': '2026-12-09', Category: 'Furniture', 'Sub-Category': 'Tables', 'Product Name': 'Chromcraft Bull-Nose Wood Oval Table', Sales: '1408.74', Profit: '-760.72', Discount: '0.40', Quantity: '3', Region: 'East', State: 'New York', Segment: 'Corporate', 'Customer Name': 'Ken Black' },
  { 'Order ID': 'US-2026-156909', 'Order Date': '2026-07-16', Category: 'Technology', 'Sub-Category': 'Accessories', 'Product Name': 'Plantronics Savi W720 Multi-Device Headset', Sales: '1079.97', Profit: '291.59', Discount: '0.10', Quantity: '3', Region: 'West', State: 'California', Segment: 'Home Office', 'Customer Name': 'Sandra Flanagan' },
  { 'Order ID': 'CA-2026-145317', 'Order Date': '2026-03-18', Category: 'Office Supplies', 'Sub-Category': 'Paper', 'Product Name': 'Xerox 1980 Recycled Multipurpose Copy Paper', Sales: '129.93', Profit: '61.07', Discount: '0.00', Quantity: '3', Region: 'East', State: 'Pennsylvania', Segment: 'Consumer', 'Customer Name': 'Pete Kriz' },
  { 'Order ID': 'CA-2026-145317', 'Order Date': '2026-03-18', Category: 'Technology', 'Sub-Category': 'Phones', 'Product Name': 'Apple iPhone 7 Plus 128GB Unlocked', Sales: '1439.98', Profit: '215.99', Discount: '0.10', Quantity: '2', Region: 'East', State: 'Pennsylvania', Segment: 'Consumer', 'Customer Name': 'Pete Kriz' },
  { 'Order ID': 'CA-2026-145317', 'Order Date': '2026-03-18', Category: 'Furniture', 'Sub-Category': 'Chairs', 'Product Name': 'Global High-Back Executive Leather Chair', Sales: '815.96', Profit: '-101.99', Discount: '0.30', Quantity: '2', Region: 'East', State: 'Pennsylvania', Segment: 'Consumer', 'Customer Name': 'Pete Kriz' },
  { 'Order ID': 'CA-2026-121755', 'Order Date': '2026-01-16', Category: 'Office Supplies', 'Sub-Category': 'Binders', 'Product Name': 'Wilson Jones Hanging Heavy-Duty Binders', Sales: '42.92', Profit: '13.95', Discount: '0.20', Quantity: '4', Region: 'West', State: 'California', Segment: 'Consumer', 'Customer Name': 'Ellis Ballard' },
];

// ============================================================================
// 2. Cloud SaaS Subscription & ARR (No Profit / Discount Columns)
// ============================================================================
const SAAS_RAW_ROWS: Record<string, any>[] = [
  { 'Subscription ID': 'SUB-1001', 'Signup Date': '2026-01-15', 'Plan Tier': 'Enterprise', 'Monthly Revenue': '4800.00', ARR: '57600.00', 'Seats Sold': '120', 'Billing Interval': 'Annual', Region: 'North America', Status: 'Active', 'Customer Name': 'Datadog Tech' },
  { 'Subscription ID': 'SUB-1002', 'Signup Date': '2026-02-01', 'Plan Tier': 'Pro Team', 'Monthly Revenue': '950.00', ARR: '11400.00', 'Seats Sold': '25', 'Billing Interval': 'Monthly', Region: 'Europe', Status: 'Active', 'Customer Name': 'Fintech Horizon' },
  { 'Subscription ID': 'SUB-1003', 'Signup Date': '2026-02-18', 'Plan Tier': 'Starter', 'Monthly Revenue': '199.00', ARR: '2388.00', 'Seats Sold': '5', 'Billing Interval': 'Monthly', Region: 'Asia Pacific', Status: 'Active', 'Customer Name': 'Nexus Studio' },
  { 'Subscription ID': 'SUB-1004', 'Signup Date': '2026-03-10', 'Plan Tier': 'Enterprise', 'Monthly Revenue': '7200.00', ARR: '86400.00', 'Seats Sold': '250', 'Billing Interval': 'Annual', Region: 'North America', Status: 'Active', 'Customer Name': 'Apex BioPharm' },
  { 'Subscription ID': 'SUB-1005', 'Signup Date': '2026-04-05', 'Plan Tier': 'Pro Team', 'Monthly Revenue': '1200.00', ARR: '14400.00', 'Seats Sold': '30', 'Billing Interval': 'Annual', Region: 'Europe', Status: 'Active', 'Customer Name': 'Solaria Energy' },
  { 'Subscription ID': 'SUB-1006', 'Signup Date': '2026-05-12', 'Plan Tier': 'Enterprise', 'Monthly Revenue': '3900.00', ARR: '46800.00', 'Seats Sold': '90', 'Billing Interval': 'Annual', Region: 'Latin America', Status: 'Active', 'Customer Name': 'Mercado Logix' },
  { 'Subscription ID': 'SUB-1007', 'Signup Date': '2026-06-20', 'Plan Tier': 'Starter', 'Monthly Revenue': '199.00', ARR: '2388.00', 'Seats Sold': '5', 'Billing Interval': 'Monthly', Region: 'North America', Status: 'Churned', 'Customer Name': 'Quanta Labs' },
  { 'Subscription ID': 'SUB-1008', 'Signup Date': '2026-07-04', 'Plan Tier': 'Pro Team', 'Monthly Revenue': '1500.00', ARR: '18000.00', 'Seats Sold': '40', 'Billing Interval': 'Annual', Region: 'Asia Pacific', Status: 'Active', 'Customer Name': 'Omni Retail Japan' },
  { 'Subscription ID': 'SUB-1009', 'Signup Date': '2026-08-11', 'Plan Tier': 'Enterprise', 'Monthly Revenue': '9600.00', ARR: '115200.00', 'Seats Sold': '400', 'Billing Interval': 'Annual', Region: 'Europe', Status: 'Active', 'Customer Name': 'Volvo Digital' },
  { 'Subscription ID': 'SUB-1010', 'Signup Date': '2026-09-01', 'Plan Tier': 'Starter', 'Monthly Revenue': '299.00', ARR: '3588.00', 'Seats Sold': '8', 'Billing Interval': 'Monthly', Region: 'North America', Status: 'Active', 'Customer Name': 'Cortex Design' },
];

// ============================================================================
// 3. Wholesale Logistics & Inventory (No Customer / No Profit Columns)
// ============================================================================
const INVENTORY_RAW_ROWS: Record<string, any>[] = [
  { 'SKU Code': 'SKU-88210', 'Product Category': 'Consumer Electronics', 'Units In Stock': '1450', 'Unit Cost': '84.50', 'Reorder Level': '300', 'Warehouse Location': 'Central Hub Dallas', 'Lead Time Days': '8', 'Safety Stock': '200' },
  { 'SKU Code': 'SKU-88211', 'Product Category': 'Consumer Electronics', 'Units In Stock': '420', 'Unit Cost': '210.00', 'Reorder Level': '150', 'Warehouse Location': 'West Coast Reno', 'Lead Time Days': '12', 'Safety Stock': '80' },
  { 'SKU Code': 'SKU-44102', 'Product Category': 'Office Furniture', 'Units In Stock': '85', 'Unit Cost': '340.00', 'Reorder Level': '50', 'Warehouse Location': 'East Coast Newark', 'Lead Time Days': '21', 'Safety Stock': '30' },
  { 'SKU Code': 'SKU-44103', 'Product Category': 'Office Furniture', 'Units In Stock': '310', 'Unit Cost': '125.00', 'Reorder Level': '100', 'Warehouse Location': 'Central Hub Dallas', 'Lead Time Days': '14', 'Safety Stock': '50' },
  { 'SKU Code': 'SKU-19301', 'Product Category': 'Industrial Hardware', 'Units In Stock': '5400', 'Unit Cost': '4.20', 'Reorder Level': '1200', 'Warehouse Location': 'Midwest Chicago', 'Lead Time Days': '5', 'Safety Stock': '600' },
  { 'SKU Code': 'SKU-19302', 'Product Category': 'Industrial Hardware', 'Units In Stock': '2100', 'Unit Cost': '18.90', 'Reorder Level': '500', 'Warehouse Location': 'Midwest Chicago', 'Lead Time Days': '7', 'Safety Stock': '250' },
  { 'SKU Code': 'SKU-77091', 'Product Category': 'Packaging & Shipping', 'Units In Stock': '12800', 'Unit Cost': '1.15', 'Reorder Level': '3000', 'Warehouse Location': 'Central Hub Dallas', 'Lead Time Days': '4', 'Safety Stock': '1500' },
  { 'SKU Code': 'SKU-77092', 'Product Category': 'Packaging & Shipping', 'Units In Stock': '940', 'Unit Cost': '12.40', 'Reorder Level': '400', 'Warehouse Location': 'West Coast Reno', 'Lead Time Days': '6', 'Safety Stock': '150' },
];

export function createSampleSuperstoreDataset(ownerId: string, ownerName: string): DatasetRecord {
  const headers = Object.keys(SUPERSTORE_RAW_ROWS[0]);
  const columns = buildColumnsMetadata(headers, SUPERSTORE_RAW_ROWS);
  const qualityReport = generateQualityReport(SUPERSTORE_RAW_ROWS, columns);

  return {
    id: 'ds_superstore_retail',
    ownerId,
    ownerName,
    name: 'Sample - Superstore Retail Sales',
    description: 'Retail commercial transactions with sales, profit, discounts, categories, and geographic locations.',
    context: 'retail',
    filename: 'superstore_sales.csv',
    fileSize: '2.45 MB',
    rowCount: SUPERSTORE_RAW_ROWS.length,
    colCount: headers.length,
    uploadedAt: '2026-10-21 04:00',
    columns,
    rows: SUPERSTORE_RAW_ROWS,
    qualityReport,
  };
}

export function createSampleSaasDataset(ownerId: string, ownerName: string): DatasetRecord {
  const headers = Object.keys(SAAS_RAW_ROWS[0]);
  const columns = buildColumnsMetadata(headers, SAAS_RAW_ROWS);
  const qualityReport = generateQualityReport(SAAS_RAW_ROWS, columns);

  return {
    id: 'ds_saas_metrics',
    ownerId,
    ownerName,
    name: 'Cloud SaaS Recurring Revenue Ledger',
    description: 'Subscription revenue, ARR, plan tiers, and seats sold. (Note: Contains no profit or discount columns to demonstrate schema adaptation)',
    context: 'saas',
    filename: 'saas_subscriptions.csv',
    fileSize: '340 KB',
    rowCount: SAAS_RAW_ROWS.length,
    colCount: headers.length,
    uploadedAt: '2026-10-21 04:15',
    columns,
    rows: SAAS_RAW_ROWS,
    qualityReport,
  };
}

export function createSampleInventoryDataset(ownerId: string, ownerName: string): DatasetRecord {
  const headers = Object.keys(INVENTORY_RAW_ROWS[0]);
  const columns = buildColumnsMetadata(headers, INVENTORY_RAW_ROWS);
  const qualityReport = generateQualityReport(INVENTORY_RAW_ROWS, columns);

  return {
    id: 'ds_inventory_logistics',
    ownerId,
    ownerName,
    name: 'Wholesale Inventory & Supply Chain Log',
    description: 'Warehouse SKUs, units in stock, unit costs, and safety stock levels. (Demonstrates inventory-oriented questions)',
    context: 'inventory',
    filename: 'warehouse_inventory.csv',
    fileSize: '180 KB',
    rowCount: INVENTORY_RAW_ROWS.length,
    colCount: headers.length,
    uploadedAt: '2026-10-21 04:30',
    columns,
    rows: INVENTORY_RAW_ROWS,
    qualityReport,
  };
}
