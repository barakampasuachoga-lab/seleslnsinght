# SalesInsight: Power BI DAX Measures Reference Library

This document provides the complete, production-tested Data Analysis Expressions (DAX) measures used in the Microsoft Power BI dashboard for SalesInsight. All measures are fully aligned with the Python and SQL analytical definitions.

---

## 1. Core Financial Measures

### [Total Sales]
Sum of transaction revenue.
```dax
Total Sales = 
SUM(sales_records[sales])
```
*Format: Currency (`$#,##0.00`)*

### [Total Profit]
Cumulative net profit or commercial loss.
```dax
Total Profit = 
SUM(sales_records[profit])
```
*Format: Currency (`$#,##0.00`)*

### [Profit Margin %]
Ratio of net profit to total revenue, protected against division by zero.
```dax
Profit Margin % = 
DIVIDE(
    [Total Profit],
    [Total Sales],
    BLANK()
)
```
*Format: Percentage (`0.0%`)*

### [Total Cost]
Derived cost of goods sold (COGS).
```dax
Total Cost = 
[Total Sales] - [Total Profit]
```
*Format: Currency (`$#,##0.00`)*

---

## 2. Operational & Transactional Granularity Measures

### [Total Distinct Orders]
Calculates the number of unique customer orders (not row count).
```dax
Total Orders = 
DISTINCTCOUNT(sales_records[order_id])
```
*Format: Whole Number (`#,##0`)*

### [Total Units Sold]
Cumulative quantity of physical items ordered.
```dax
Total Units Sold = 
SUM(sales_records[quantity])
```
*Format: Whole Number (`#,##0`)*

### [Average Order Value (AOV)]
Average revenue per unique customer order.
```dax
Average Order Value = 
DIVIDE(
    [Total Sales],
    [Total Orders],
    0
)
```
*Format: Currency (`$#,##0.00`)*

### [Average Discount Rate]
Mean promotional discount applied across transaction lines.
```dax
Average Discount % = 
AVERAGE(sales_records[discount])
```
*Format: Percentage (`0.0%`)*

---

## 3. Time Intelligence & Growth Measures

### [Sales LY (Last Year)]
Sales revenue in the previous calendar year.
```dax
Sales LY = 
CALCULATE(
    [Total Sales],
    SAMEPERIODLASTYEAR('DimDate'[Date])
)
```
*Format: Currency (`$#,##0.00`)*

### [Sales YoY Growth %]
Year-over-Year percentage change in sales revenue.
```dax
Sales YoY Growth % = 
VAR CurrentSales = [Total Sales]
VAR PriorSales = [Sales LY]
RETURN
DIVIDE(
    CurrentSales - PriorSales,
    PriorSales,
    BLANK()
)
```
*Format: Percentage (`+0.0%;-0.0%;0.0%`)*

### [Profit LY (Last Year)]
Net profit in the prior comparable annual period.
```dax
Profit LY = 
CALCULATE(
    [Total Profit],
    SAMEPERIODLASTYEAR('DimDate'[Date])
)
```
*Format: Currency (`$#,##0.00`)*

### [Profit YoY Growth %]
Year-over-Year profit change percentage.
```dax
Profit YoY Growth % = 
VAR CurrentProfit = [Total Profit]
VAR PriorProfit = [Profit LY]
RETURN
DIVIDE(
    CurrentProfit - PriorProfit,
    ABS(PriorProfit),
    BLANK()
)
```
*Format: Percentage (`+0.0%;-0.0%;0.0%`)*

---

## 4. Advanced Risk & Risk Anomaly Measures

### [Loss-Making Sales Volume]
Total revenue originating from negative-margin transactions.
```dax
Loss Making Sales = 
CALCULATE(
    [Total Sales],
    sales_records[profit] < 0
)
```
*Format: Currency (`$#,##0.00`)*

### [Loss Order Lines Count]
Count of individual item rows where discount exceeded profitable pricing.
```dax
Negative Margin Lines = 
COUNTROWS(
    FILTER(
        sales_records,
        sales_records[profit] < 0
    )
)
```
*Format: Whole Number (`#,##0`)*

### [Customer Count]
Unique active purchasing customers.
```dax
Active Customers = 
DISTINCTCOUNT(sales_records[customer_id])
```
*Format: Whole Number (`#,##0`)*
