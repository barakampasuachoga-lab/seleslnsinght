# SalesInsight: Retail Sales Data Analysis & Business Intelligence System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791.svg)](https://www.postgresql.org/)
[![BI](https://img.shields.io/badge/Power%20BI-Ready-F2C811.svg)](https://powerbi.microsoft.com/)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-success.svg)](tests/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end, production-grade business intelligence and analytics system for retail sales performance, data quality validation, SQL modeling, statistical outlier detection, and executive reporting.

---

## 1. Executive Summary & Headline KPIs

Based on the empirical audit of 9,994 retail transaction records, the enterprise achieves **$2.3M in revenue** with a healthy **12.5% overall profit margin**, but suffers severe margin erosion from uncontrolled promotional discounting (>20%) and high-loss furniture SKUs.

| Metric | Empirical Result | Validation Source |
| :--- | :--- | :--- |
| **Total Sales Revenue** | **$2,297,200.86** | Python `metrics.py` & SQL `sales_records` |
| **Total Net Profit** | **$286,397.02** | Python `metrics.py` & SQL `sales_records` |
| **Overall Profit Margin** | **12.47%** | `(Total Profit / Total Sales) * 100` |
| **Total Distinct Orders** | **5,009** | `COUNT(DISTINCT order_id)` |
| **Average Order Value (AOV)** | **$458.61** | `Total Sales / Distinct Orders` |
| **Total Units Sold** | **37,873 units** | `SUM(quantity)` |
| **Unique Active Customers** | **793 accounts** | `COUNT(DISTINCT customer_id)` |
| **Average Discount Applied** | **15.62%** | Mean discount per transaction line |

---

## 2. Business Objectives & Problem Statement

Retail executives lacked a unified analytics pipeline capable of:
1. Detecting and cleaning transactional data quality flaws without discarding legitimate loss data.
2. Answering multi-dimensional commercial performance questions across categories, regions, and customer segments.
3. Diagnosing margin destruction and the exact thresholds where promotional discounting becomes unprofitable.
4. Supplying a dimensional star schema (PostgreSQL) and interactive Power BI dashboard specifications with validated DAX measures.

---

## 3. System Architecture & Workflow

```
Raw CSV / Excel (data/raw/)
       │
       ▼
Data Ingestion (src/salesinsight/ingestion.py)
       │
       ▼
Schema Validation & Quality Profiling (src/salesinsight/validation.py)
       │
       ▼
Data Cleaning & Derived Dimensions (src/salesinsight/cleaning.py)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
Processed Dataset (data/processed/)   PostgreSQL / SQLite (sql/schema.sql)
       │                                 │
       ▼                                 ▼
Exploratory Analysis & Charts          SQL Analytical Queries & Views
(src/salesinsight/visualization.py)   (sql/sales_analysis.sql, views.sql)
       │                                 │
       └─────────────────┬───────────────┘
                         ▼
             Cross-System Verification
        (Python vs SQL: 100% Exact Match)
                         │
                         ▼
            Power BI Dashboard & Reports
       (dashboard/ & reports/analysis/)
```

---

## 4. Key Analytical Findings

### A. The 20% Discount Margin Cliff
- **0% Discount:** Generates an average profit margin of **~30.0%**.
- **1% - 10% Discount:** Yields an average profit margin of **~14.5%**.
- **11% - 20% Discount:** Yields an average profit margin of **~9.2%**.
- **21% - 40% Discount:** Flips into **negative margins (-15.8%)**.
- **Over 40% Discount:** Results in **catastrophic losses (-65.4% margin)**.

### B. Category and Subcategory Economics
- **Technology:** Dominant profit engine ($145,454 profit, **17.4% margin**). Key drivers: Copiers, Phones, Accessories.
- **Office Supplies:** Consistent, high-volume recurring profit ($122,490 profit, **17.0% margin**). Key drivers: Paper, Envelopes, Storage.
- **Furniture:** Severe operational drag ($18,451 profit, **2.5% margin**). The **Tables** subcategory accumulated an aggregate net loss of **-$17,725**.

### C. Geographic Performance
- **West Region:** Top revenue ($725,457) and highest profit ($108,418, **14.9% margin**).
- **East Region:** Strong second ($678,781 sales, $91,522 profit, **13.5% margin**).
- **Central Region:** Lowest margin (**7.9%**) due to aggressive discounting across Texas and Illinois branches.

---

## 5. Strategic Recommendations

1. **Enforce Hard Discount Caps in ERP:** Restrict representative discretionary discounts to **15% maximum**. Any discount between 15% and 20% requires regional director sign-off; discounts >20% require VP of Finance approval.
2. **Restructure Bulky Furniture Fulfillment:** Reprice or bundle bulky SKUs (Tables and Bookcases) with high-margin items to offset specialized freight overhead.
3. **Expand High-AOV Corporate Remote Bundles:** The Home Office segment holds the highest Average Order Value ($241 per cart) with minimal return rates.

---

## 6. Project Structure

```
SalesInsight/
├── data/
│   ├── raw/                 # Original source data (superstore.csv)
│   ├── processed/           # Standardized analytical data (sales_cleaned.csv)
│   └── samples/             # Synthetic and lightweight sample files (.csv, .xlsx)
├── src/salesinsight/
│   ├── __init__.py          # Package initialization
│   ├── config.py            # Paths, schema column mappings, and environment variables
│   ├── ingestion.py         # CSV & Excel loading with format checking
│   ├── validation.py        # Data quality profiling, missingness, and warnings
│   ├── cleaning.py          # Schema mapping, date parsing, derived dimensions
│   ├── metrics.py           # Mathematically guarded business formulas
│   ├── analysis.py          # Multi-dimensional aggregations, RFM, IQR outliers
│   ├── visualization.py     # Matplotlib/Seaborn publication-grade figure generation
│   ├── database.py          # SQLAlchemy PostgreSQL/SQLite manager and execution
│   └── reporting.py         # Executive markdown report compiler
├── scripts/
│   ├── inspect_data.py      # CLI tool for Phase 2 Data Quality Inspection
│   ├── clean_data.py        # CLI tool for Phase 3 Data Cleaning
│   ├── analyze_sales.py     # CLI tool for Phase 4 EDA and Figure Exports
│   ├── load_database.py     # CLI tool for Phase 5 Relational Schema & Verification
│   └── generate_report.py   # CLI tool for Phase 7 Executive Reporting
├── sql/
│   ├── schema.sql           # DDL with star schema (FactSales, DimCustomer, etc.)
│   ├── sales_analysis.sql   # 10 production SQL queries with CTEs and window functions
│   └── views.sql            # Reusable analytical reporting views
├── dashboard/
│   ├── dax_measures.md      # Full DAX measures library for Power BI
│   └── dashboard_design.md  # 5-page Power BI visual layout and design specification
├── reports/
│   ├── data_quality/        # Markdown & JSON inspection and cleaning reports
│   ├── analysis/            # Exported CSVs and executive summary
│   └── figures/             # 5 high-resolution analytical PNG charts
├── tests/
│   ├── test_ingestion.py    # Unit tests for file loading and errors
│   ├── test_cleaning.py     # Tests for normalization, dates, and loss retention
│   ├── test_metrics.py      # Tests for AOV, margins, zero-division, and granularity
│   ├── test_analysis.py     # Tests for category aggregations and IQR outliers
│   └── test_database.py     # Tests for SQLite/Postgres DDL and SQL vs Python parity
├── docs/
│   ├── methodology.md       # Pipeline engineering, math formulas, and design principles
│   ├── data_dictionary.md   # Complete schema and column catalog
│   └── business_insights.md # In-depth findings and operational recommendations
├── .env.example             # Safe template for database credentials
├── .gitignore               # Excludes virtualenvs, credentials, caches, and temp DBs
├── requirements.txt         # Pinned pip dependencies
├── pyproject.toml           # Modern PEP-621 build configuration
└── README.md                # Comprehensive project documentation
```

---

## 7. Installation & Reproducibility Guide

### Step 1: Clone and Set Up Virtual Environment
```bash
git clone https://github.com/your-username/salesinsight.git
cd salesinsight
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
pip install -e .
```

### Step 3: Run the Complete Automated Pipeline
Execute each phase via the command-line interface:

```bash
# Phase 2: Inspect raw dataset
python scripts/inspect_data.py --input data/raw/superstore.csv

# Phase 3: Clean and transform dataset
python scripts/clean_data.py --input data/raw/superstore.csv

# Phase 4: Run exploratory data analysis and export charts
python scripts/analyze_sales.py --input data/processed/sales_cleaned.csv

# Phase 5: Load database schema and verify SQL parity
python scripts/load_database.py

# Phase 7: Generate executive markdown report
python scripts/generate_report.py
```

### Step 4: Run Automated Tests
```bash
pytest tests/ -v
```
*Result: 18 passed tests in ~1.1s.*

---

## 8. Verification and Quality Assurance

- **Zero Data Loss:** All 9,994 transactions in the raw source were safely processed into the cleaned layer.
- **Negative Profit Integrity:** Verified that negative profit records represent valid commercial losses rather than data corruption.
- **SQL vs Python Consistency:** Verified that Total Sales ($2,297,200.86), Total Profit ($286,397.02), and Distinct Orders (5,009) match between Python and SQL to within $0.00.

---

## 9. Limitations & Next Steps

1. **Shipping Overhead Allocation:** True freight cost per kilogram is not broken out from transaction-level margin.
2. **Price Elasticity Modeling:** Future phases will introduce regression models to estimate sales volume trade-offs when reducing discount depths.
3. **Streaming Ingestion:** Transition from batch CSV processing to event-driven Kafka / PostgreSQL ingestion pipelines.
