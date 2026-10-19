# SalesInsight: Analytical Methodology & Architecture

This document describes the design principles, mathematical definitions, data engineering workflow, and statistical quality controls governing **SalesInsight**.

---

## 1. Pipeline Architecture & Data Flow

```
+------------------+
| Raw CSV / Excel  | (data/raw/superstore.csv)
+--------+---------+
         |
         v
+------------------+
| Data Ingestion   | (src/salesinsight/ingestion.py)
| Format Validation| Checks existence, encodings (UTF-8/Latin-1), row counts
+--------+---------+
         |
         v
+------------------+
| Data Inspection  | (src/salesinsight/validation.py)
| Quality Profiling| Checks missingness, duplicates, data types, anomalies
+--------+---------+
         |
         v
+------------------+
| Data Cleaning    | (src/salesinsight/cleaning.py)
| Transformations  | Canonical mapping, date parsing, derived dimensions
+--------+---------+
         |
         +---------------------------------------+
         |                                       |
         v                                       v
+------------------------+             +------------------------+
| Processed CSV Dataset  |             | PostgreSQL / SQLite DB |
| (data/processed/)      |             | (sql/schema.sql)       |
+-----------+------------+             +-----------+------------+
            |                                      |
            v                                      v
+------------------------+             +------------------------+
| Python Business EDA    |             | SQL Analytical Queries |
| (src/salesinsight/)    |             | (sql/sales_analysis.sql|
+-----------+------------+             +-----------+------------+
            |                                      |
            +------------------+-------------------+
                               | Cross-System Verification
                               v
               +-------------------------------+
               | Power BI Dashboard & Reports  |
               | (dashboard/ & reports/)       |
               +-------------------------------+
```

---

## 2. Non-Destructive Data Cleaning Principles

### Rule 1: Source Immutability
The raw dataset in `data/raw/` is treated as strictly read-only. Cleaned outputs are written exclusively to `data/processed/sales_cleaned.csv`.

### Rule 2: Preservation of Legitimate Losses
Negative numbers in the `profit` column are **not** treated as data corruption or entry errors. In retail, aggressive clearance discounts, promotional loss-leaders, or high shipping overhead routinely generate negative transaction margins. Removing negative profit rows would falsely inflate operating margins.

### Rule 3: Resilient Multi-Format Date Parsing
Orders originating from different ERP regions may mix formats (e.g. `MM-DD-YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`). The pipeline employs tolerant parsing to convert all timestamps to standard ISO-8601 date structures.

---

## 3. Metric Formulations & Mathematical Invariants

1. **Total Sales:**
   $$\text{Total Sales} = \sum_{i=1}^{N} \text{sales}_i$$

2. **Total Profit:**
   $$\text{Total Profit} = \sum_{i=1}^{N} \text{profit}_i$$

3. **Distinct Order Count:**
   $$\text{Distinct Orders} = |\text{Unique}(\text{order\_id})|$$
   *Crucial distinction:* Row count measures line items; distinct order count measures shopping carts.

4. **Average Order Value (AOV):**
   $$\text{AOV} = \frac{\text{Total Sales}}{\text{Distinct Orders}}$$

5. **Profit Margin (%):**
   $$\text{Profit Margin} = \left(\frac{\text{Total Profit}}{\text{Total Sales}}\right) \times 100$$
   *Zero-Division Protection:* If $\text{Total Sales} = 0$, the metric evaluates to `None`/`BLANK()`.

---

## 4. Outlier Analysis Methodology

Outliers in sales, profit, and unit quantities are evaluated using John Tukey's **Interquartile Range (IQR)** rule:
- First Quartile ($Q_1$): 25th percentile
- Third Quartile ($Q_3$): 75th percentile
- $\text{IQR} = Q_3 - Q_1$
- Lower Bound: $Q_1 - 1.5 \times \text{IQR}$
- Upper Bound: $Q_3 + 1.5 \times \text{IQR}$

Transactions outside these bounds are flagged for business review (e.g., enterprise hardware contracts) rather than arbitrarily deleted.

---

## 5. Cross-System Validation Framework

To guarantee enterprise trustworthiness, calculations must yield identical results across:
1. **Python Pandas Pipeline:** Direct vector aggregation in `metrics.py`.
2. **PostgreSQL / SQL Queries:** ANSI SQL aggregations in `sales_analysis.sql`.
3. **Power BI DAX Engine:** Dynamic filter context evaluation in `dax_measures.md`.

Automated tests in `tests/test_metrics.py` enforce that sales, profit, order counts, and margins agree to within \$0.01 precision.
