-- ============================================================================
-- SalesInsight Database Schema
-- Database: salesinsight_db
-- Dialect: PostgreSQL (Compatible with ANSI SQL & SQLite)
-- ============================================================================

-- Drop existing tables if recreating
DROP TABLE IF EXISTS fact_sales;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_customer;
DROP TABLE IF EXISTS dim_geography;
DROP TABLE IF EXISTS dim_date;
DROP TABLE IF EXISTS sales_records;

-- ----------------------------------------------------------------------------
-- Flat Analytics Staging / Reporting Table (sales_records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_records (
    row_id INTEGER PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    ship_date DATE,
    ship_mode VARCHAR(50),
    customer_id VARCHAR(50),
    customer_name VARCHAR(150),
    customer_segment VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    region VARCHAR(50),
    product_id VARCHAR(50),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    product_name VARCHAR(255),
    sales NUMERIC(12, 4) NOT NULL,
    quantity INTEGER NOT NULL,
    discount NUMERIC(5, 4) DEFAULT 0.0,
    profit NUMERIC(12, 4) NOT NULL,
    order_year INTEGER,
    order_month INTEGER,
    order_quarter INTEGER,
    order_year_month VARCHAR(7),
    shipping_days INTEGER,
    profit_margin_pct NUMERIC(8, 2),
    discount_band VARCHAR(50)
);

-- Indexes for rapid analytical slicing
CREATE INDEX IF NOT EXISTS idx_sales_order_date ON sales_records(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales_records(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_records(category);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales_records(region);

-- ----------------------------------------------------------------------------
-- Star Schema Dimensional Architecture
-- ----------------------------------------------------------------------------

-- Dimension: Customer
CREATE TABLE IF NOT EXISTS dim_customer (
    customer_key VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(150),
    customer_segment VARCHAR(50)
);

-- Dimension: Product
CREATE TABLE IF NOT EXISTS dim_product (
    product_key VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100)
);

-- Dimension: Geography
CREATE TABLE IF NOT EXISTS dim_geography (
    geo_key VARCHAR(100) PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    region VARCHAR(50),
    country VARCHAR(100)
);

-- Fact: Sales Transactions (Granularity: Single Order Line Item)
CREATE TABLE IF NOT EXISTS fact_sales (
    sales_key INTEGER PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    ship_date DATE,
    ship_mode VARCHAR(50),
    customer_key VARCHAR(50),
    product_key VARCHAR(50),
    geo_key VARCHAR(100),
    sales NUMERIC(12, 4) NOT NULL,
    quantity INTEGER NOT NULL,
    discount NUMERIC(5, 4) DEFAULT 0.0,
    profit NUMERIC(12, 4) NOT NULL,
    shipping_days INTEGER,
    profit_margin_pct NUMERIC(8, 2)
);
