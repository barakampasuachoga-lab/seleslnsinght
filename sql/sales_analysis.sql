-- ============================================================================
-- SalesInsight Analytical SQL Queries
-- Database: salesinsight_db / PostgreSQL
-- ============================================================================

-- Query 1: Headline Executive KPI Summary
-- Calculates aggregate revenue, profit, distinct order count, units, AOV, and margin %
SELECT 
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS total_distinct_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(sales) / NULLIF(COUNT(DISTINCT order_id), 0), 2) AS average_order_value,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records;

-- Query 2: Product Category Performance
-- Revenue, profit, order volume, and profit margin grouped by Category
SELECT 
    category,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS distinct_orders,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct,
    ROUND((SUM(sales) * 100.0) / (SELECT SUM(sales) FROM sales_records), 2) AS revenue_share_pct
FROM sales_records
GROUP BY category
ORDER BY total_sales DESC;

-- Query 3: Regional Sales & Profitability Distribution
SELECT 
    region,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS distinct_orders,
    COUNT(DISTINCT customer_id) AS unique_customers,
    ROUND(SUM(sales) / NULLIF(COUNT(DISTINCT order_id), 0), 2) AS average_order_value,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY region
ORDER BY total_sales DESC;

-- Query 4: Customer Segment Contribution
SELECT 
    customer_segment,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    COUNT(DISTINCT order_id) AS distinct_orders,
    COUNT(DISTINCT customer_id) AS distinct_customers,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY customer_segment
ORDER BY total_sales DESC;

-- Query 5: Top 10 Products by Total Sales Revenue
SELECT 
    product_name,
    category,
    subcategory,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    SUM(quantity) AS units_sold,
    COUNT(DISTINCT order_id) AS order_occurrences
FROM sales_records
GROUP BY product_name, category, subcategory
ORDER BY total_sales DESC
LIMIT 10;

-- Query 6: Chronic Loss-Making Products (Negative Aggregate Profit)
SELECT 
    product_name,
    category,
    subcategory,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_loss,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY product_name, category, subcategory
HAVING SUM(profit) < 0
ORDER BY total_loss ASC
LIMIT 10;

-- Query 7: Discount Band Margin Sensitivity Analysis
SELECT 
    discount_band,
    COUNT(*) AS transaction_lines,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY discount_band
ORDER BY total_sales DESC;

-- Query 8: Monthly Revenue and Profit Progression
SELECT 
    order_year_month,
    ROUND(SUM(sales), 2) AS monthly_sales,
    ROUND(SUM(profit), 2) AS monthly_profit,
    COUNT(DISTINCT order_id) AS monthly_orders,
    ROUND((SUM(profit) / NULLIF(SUM(sales), 0)) * 100, 2) AS profit_margin_pct
FROM sales_records
GROUP BY order_year_month
ORDER BY order_year_month ASC;

-- Query 9: Year-over-Year (YoY) Sales & Growth Analysis using Window Functions
WITH yearly_sales AS (
    SELECT 
        order_year,
        ROUND(SUM(sales), 2) AS total_sales,
        ROUND(SUM(profit), 2) AS total_profit,
        COUNT(DISTINCT order_id) AS total_orders
    FROM sales_records
    WHERE order_year IS NOT NULL
    GROUP BY order_year
)
SELECT 
    order_year,
    total_sales,
    total_profit,
    total_orders,
    LAG(total_sales, 1) OVER (ORDER BY order_year) AS prior_year_sales,
    ROUND(
        ((total_sales - LAG(total_sales, 1) OVER (ORDER BY order_year)) / 
         NULLIF(LAG(total_sales, 1) OVER (ORDER BY order_year), 0)) * 100, 
        2
    ) AS yoy_sales_growth_pct
FROM yearly_sales
ORDER BY order_year ASC;

-- Query 10: Customer Purchasing Frequency and Value Concentration
SELECT 
    customer_id,
    customer_name,
    customer_segment,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_spend,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND(SUM(sales) / NULLIF(COUNT(DISTINCT order_id), 0), 2) AS average_order_value
FROM sales_records
GROUP BY customer_id, customer_name, customer_segment
ORDER BY total_spend DESC
LIMIT 15;
