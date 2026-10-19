# SalesInsight Data Cleaning Audit Summary
**Initial Row Count:** `9,994`  
**Final Row Count:** `9,994`  
**Net Rows Dropped:** `0` (Non-destructive policy applied)  
**Total Features Available:** `31`  

---
## Cleaning Transformations Executed
| Step | Action Taken | Rationale & Impact | Rows Affected |
| :--- | :--- | :--- | :--- |
| 1 | **Column Name Standardization** | Normalized 21 columns to snake_case canonical identifiers. | 9,994 |
| 2 | **Whitespace Stripping** | Trimmed leading/trailing whitespace across 15 text columns. | 9,994 |
| 3 | **Date Conversion (order_date)** | Converted to datetime64[ns]. Invalid unparsable dates: 0. | 0 |
| 4 | **Date Conversion (ship_date)** | Converted to datetime64[ns]. Invalid unparsable dates: 0. | 0 |
| 5 | **Derived Date Dimensions** | Created order_year, order_month, order_quarter, order_year_month, and order_day_of_week. | 9,994 |
| 6 | **Shipping Duration Calculation** | Calculated shipping_days = (ship_date - order_date). | 9,994 |

---
## Schema Features in Processed Dataset
`row_id`, `order_id`, `order_date`, `ship_date`, `ship_mode`, `customer_id`, `customer_name`, `customer_segment`, `country`, `city`, `state`, `postal_code`, `region`, `product_id`, `category`, `subcategory`, `product_name`, `sales`, `quantity`, `discount`, `profit`, `order_year`, `order_month`, `order_quarter`, `order_month_name`, `order_year_month`, `order_day_of_week`, `shipping_days`, `estimated_unit_price`, `profit_margin_pct`, `discount_band`
