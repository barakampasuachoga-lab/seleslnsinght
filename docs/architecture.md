# SalesInsight: System Architecture & Integration Model

## 1. System Overview

SalesInsight is a polyglot, enterprise-grade sales analytics and business intelligence platform built to transform raw retail sales datasets into verified insights, statistical summaries, interactive dashboards, and executive reporting.

```
+--------------------------------------------------------------------------------+
|                             USER TIER (Web Browser)                            |
|             React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons         |
+--------------------------------------------------------------------------------+
                                       ▲
                                       │ HTTP / REST / JSON
                                       ▼
+--------------------------------------------------------------------------------+
|                        API GATEWAY / APPLICATION SERVER                        |
|                     Node.js 22 + Express + TypeScript                          |
|  - Authentication & RBAC (Guest, User, Admin)                                  |
|  - Dataset Upload Management & Metadata Catalog                                |
|  - Analysis Job Coordination & Lifecycle Monitoring                           |
|  - Service Orchestration & Audit Event Logging                                 |
+-------------------+------------------------------------+-----------------------+
                    │                                    │
                    │ HTTP Service-to-Service            │ Process Execution / IPC
                    ▼                                    ▼
+------------------------------------+  +----------------------------------------+
|      BUSINESS & REPORTING API      |  |         PYTHON ANALYTICS ENGINE        |
|      C# ASP.NET Core 8 Web API     |  |         Python 3.11 + Pandas + NumPy   |
|  - Business Rule Validation        |  |  - CSV/Excel Ingestion & Encoding Safe |
|  - Analytical Result Verification  |  |  - Data Quality Profiling & Flags      |
|  - Report Aggregation Workflows    |  |  - Non-Destructive Cleaning Pipeline   |
|  - Executive Briefing Assembly     |  |  - Statistical EDA & 1.5x IQR Outliers |
|  - Enterprise DTO Contracts        |  |  - Publication Figures (Matplotlib)    |
+-------------------+----------------+  +-------------------+--------------------+
                    │                                       │
                    │ SQL / ADO.NET                         │ SQLAlchemy / Psycopg
                    ▼                                       ▼
+--------------------------------------------------------------------------------+
|                            ENTERPRISE PERSISTENCE TIER                         |
|                     PostgreSQL 15+ / SQLite Analytical Engine                  |
|  - sales_records (Flat reporting table)                                        |
|  - Star Schema Dimensional Model (FactSales, DimProduct, DimCustomer, etc.)    |
|  - Materialized / Standard Analytical Views                                    |
|  - Dataset Metadata, Users, Roles, Audit Logs                                  |
+--------------------------------------------------------------------------------+
                                       ▲
                                       │ Direct Query / Power BI Connector
+--------------------------------------------------------------------------------+
|                          BUSINESS INTELLIGENCE TIER                            |
|                 Microsoft Power BI Desktop / Power BI Service                  |
|  - 5-Page Interactive Report (Executive, Product, Regional, Customer, Anomaly)|
|  - Production DAX Measures Library (100% matched to Python/SQL formulas)       |
+--------------------------------------------------------------------------------+
```

---

## 2. Layer Responsibilities & Isolation

### 2.1 React Frontend
- Renders responsive KPI metrics, data inspection reports, interactive charts, and data explorer.
- Enforces client-side route guards (Guest vs Registered User vs Administrator).
- Communicates exclusively with the Node.js API over authenticated HTTP JSON endpoints.
- **Security Rule:** Never connects directly to the database; never contains database credentials or service secrets.

### 2.2 Node.js Application Backend
- Manages authentication, session tokens, user profiles, and role-based permissions.
- Coordinates dataset file uploads, assigning non-guessable storage identifiers to prevent path traversal.
- Dispatches and tracks asynchronous data quality inspection and analysis jobs.
- Acts as the secure coordinator communicating with the C# reporting API and the Python processing engine.

### 2.3 C# ASP.NET Core Business Services API
- Implements domain-driven business rules, DTO schema contracts, and report aggregation workflows.
- Validates analytical payload structures against strongly typed C# models.
- Provides specialized reporting endpoints (`/api/v1/business/summary`, `/api/v1/business/performance`).

### 2.4 Python Analytics Engine
- Serves as the sole authoritative computational engine for data ingestion, cleaning, statistics, and figures.
- Runs non-destructive data transformations, preserving audited commercial losses.
- Exports validated analytical metrics and Matplotlib/Seaborn figures to standardized report directories.

### 2.5 PostgreSQL Database & Star Schema
- Stores relational application metadata, transactional line items (`sales_records`), and star schema dimensional models.
- Guarantees data integrity using foreign keys, indexes, and parameterized SQL queries.

### 2.6 Microsoft Power BI
- Consumes PostgreSQL views (`v_monthly_sales_summary`, `v_category_subcategory_performance`, etc.).
- Evaluates dynamic filter context using documented DAX measures that exactly mirror Python and SQL formulas.
