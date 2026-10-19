-- ============================================================================
-- SalesInsight Analytical Views
-- Optimized for Power BI and Dashboard Reporting Consumption
-- Dialect: PostgreSQL and SQLite Compatible
-- ============================================================================

-- View 1: Monthly Performance View
DROP VIEW IF EXISTS v_monthly_sales_summary;
CREATE VIEW v_monthly_sales_summary AS
SELECT 
    order_year,
    order_month,
    order_year_month,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS total_orders,
    SUM(quantity) AS units_sold,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY order_year, order_month, order_year_month;

-- View 2: Category & Subcategory View
DROP VIEW IF EXISTS v_category_subcategory_performance;
CREATE VIEW v_category_subcategory_performance AS
SELECT 
    category,
    subcategory,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS distinct_orders,
    SUM(quantity) AS total_units,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY category, subcategory;

-- View 3: Regional Performance View
DROP VIEW IF EXISTS v_regional_performance;
CREATE VIEW v_regional_performance AS
SELECT 
    region,
    state,
    city,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales) / NULLIF(COUNT(DISTINCT order_id), 0), 2) AS aov,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY region, state, city;

-- View 4: Customer Segmentation View
DROP VIEW IF EXISTS v_customer_performance;
CREATE VIEW v_customer_performance AS
SELECT 
    customer_id,
    customer_name,
    customer_segment,
    COUNT(DISTINCT order_id) AS order_count,
    ROUND(SUM(sales), 2) AS lifetime_sales,
    ROUND(SUM(profit), 2) AS lifetime_profit,
    ROUND(SUM(sales) / NULLIF(COUNT(DISTINCT order_id), 0), 2) AS avg_order_value
FROM sales_records
GROUP BY customer_id, customer_name, customer_segment;
