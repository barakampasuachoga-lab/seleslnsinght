# SalesInsight: Power BI Interactive Dashboard Architecture & Design

This specification provides the structural visual hierarchy, data model relationships, slicer behaviors, and page layouts for building the **SalesInsight** Business Intelligence Report in Microsoft Power BI Desktop.

---

## 1. Dimensional Data Model & Relationships

```
        +------------------+
        |     DimDate      |
        | [Date], [Year]   |
        +--------+---------+
                 | 1
                 | 
                 | *
+----------------+----------------+         +-------------------+
|          fact_sales             | *     1 |    dim_customer   |
| [order_id], [order_date],       |---------| [customer_id],    |
| [sales], [profit], [quantity],  |         | [customer_name],  |
| [discount], [shipping_days]     |         | [segment]         |
+----------------+----------------+         +-------------------+
        | *              | *
        |                |
        | 1              | 1
+-------+--------+   +---+--------------+
|  dim_product   |   |  dim_geography   |
| [product_id],  |   | [city], [state], |
| [category],    |   | [postal_code],   |
| [subcategory]  |   | [region]         |
+----------------+   +------------------+
```
- **Filter Direction:** Single direction (`1 -> *`), cross-filter dimensions filter the fact table.
- **Granularity:** One row per individual order line item.

---

## 2. Interactive Report Pages Specification

### Page 1: Executive Overview
*Target Audience: C-Suite, VP of Sales, Chief Commercial Officer*
- **Header KPIs (Card Visuals):**
  1. `Total Sales`: Big number with sparkline trend indicator.
  2. `Total Profit`: Green indicator with conditional color (>0 Green, <0 Red).
  3. `Profit Margin %`: Formatted as percentage (`%`).
  4. `Total Distinct Orders`: Counter of distinct transaction carts.
  5. `Average Order Value (AOV)`: Currency indicator.
- **Visuals:**
  - **Line and Clustered Column Chart:** Monthly Sales (Columns) vs Net Profit Margin % (Line) over time.
  - **Donut / Horizontal Bar Chart:** Sales Revenue and Profit Margin by Category (`Technology`, `Furniture`, `Office Supplies`).
  - **Treemap / Clustered Bar:** Regional Revenue Contribution (`West`, `East`, `Central`, `South`).
  - **Top 5 Table:** Best-selling products with sales, quantity, and profit margin bars.
- **Slicers (Top Ribbon):**
  - Date Range Slider (`Order Date`).
  - Region Multi-select dropdown.
  - Category Tile selector.
  - Customer Segment pills.

---

### Page 2: Product & Category Deep-Dive
*Target Audience: Merchandising Directors, Product Category Managers*
- **Visuals:**
  - **Matrix Visual:** Hierarchy drilldown: Category -> Subcategory -> Product Name. Columns: Sales, Margin %, Quantity, Return Rate.
  - **Scatter Plot:** Sales (X-axis) vs Profit (Y-axis) with bubble size representing Quantity Sold and color mapped to Category.
  - **Split Bar Chart:** Top 10 Profitable Products (Emerald Green) vs Bottom 10 Severe Loss-Makers (Crimson Red).
  - **Decomposition Tree:** Total Profit broken down by Category -> Subcategory -> Discount Band.

---

### Page 3: Regional & Geographic Intelligence
*Target Audience: Regional Directors & Supply Chain Managers*
- **Visuals:**
  - **Filled Map / Shape Map:** Sales intensity and profit gradient across US States and Cities.
  - **Bar Chart:** Sales vs Average Order Value (AOV) by Region.
  - **Shipping Efficiency Table:** Average shipping delay days by Shipping Mode (`Same Day`, `First Class`, `Second Class`, `Standard Class`).
  - **Regional Growth Matrix:** Regional Sales comparing Current Year vs Last Year (`Sales YoY Growth %`).

---

### Page 4: Customer Segmentation & Concentration
*Target Audience: Marketing Directors, CRM Leads*
- **Visuals:**
  - **Stacked Bar Chart:** Revenue and Profit share across Customer Segments (`Consumer`, `Corporate`, `Home Office`).
  - **Pareto Chart (80/20 Rule):** Cumulative customer revenue distribution demonstrating customer concentration.
  - **RFM Customer Table:** Top 20 customers by total spend, purchase frequency, and recency of last order.
  - **Repeat Purchase Ratio Card:** Percentage of customers with more than 1 distinct order.

---

### Page 5: Discounting Sensitivity & Anomaly Detection
*Target Audience: Pricing Committees, Financial Analysts*
- **Visuals:**
  - **Clustered Bar Chart:** Profit Margin % across Discount Bands (`0%`, `1-10%`, `11-20%`, `21-40%`, `Over 40%`).
  - **Revenue at Risk Card:** Total sales revenue generated at negative margins.
  - **Correlation Matrix / Heatmap:** Cross-tabulation of Category vs Discount Band showing average margin.
  - **Outlier Table:** Transactions where discount > 30% that caused individual losses exceeding $500.

---

## 3. Power BI Desktop Implementation Steps

1. **Launch Power BI Desktop** and click **Get Data -> Text/CSV** (or **PostgreSQL database**).
2. Point data source to `data/processed/sales_cleaned.csv` or connect to `salesinsight_db`.
3. In the **Model View**, verify relationships between dimensions and `fact_sales` (or use `sales_records` directly).
4. Create a dedicated **_Measures** table to host all DAX calculations from `dashboard/dax_measures.md`.
5. Apply the official color theme:
   - Primary: `#1E3A8A` (Deep Navy)
   - Secondary: `#3B82F6` (Electric Blue)
   - Positive / Profit: `#059669` (Emerald)
   - Alert / Loss: `#DC2626` (Crimson)
   - Background: `#F8FAFC` (Soft Gray)
6. Publish to Power BI Service workspace for cloud-sharing and scheduled daily gateway refresh.
