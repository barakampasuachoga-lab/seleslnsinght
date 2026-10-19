# SalesInsight Data Quality & Inspection Report
**Dataset Source:** `superstore.csv`  
**Total Records:** `9,994`  
**Total Columns:** `21`  
**Duplicate Records:** `0` (0.0%)  

---
## 1. Data Quality Warnings & Flags
- ✅ **Clean:** No structural anomalies or negative sales anomalies detected.

---
## 2. Column Inventory & Missing Value Analysis
| Column Name | Data Type | Missing Count | Missing % | Unique Count | Sample Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Row ID` | int64 | 0 | 0.0% | 9,994 | 1, 2 |
| `Order ID` | str | 0 | 0.0% | 5,009 | CA-2016-152156, CA-2016-152156 |
| `Order Date` | str | 0 | 0.0% | 1,237 | 11-08-2016, 11-08-2016 |
| `Ship Date` | str | 0 | 0.0% | 1,334 | 11-11-2016, 11-11-2016 |
| `Ship Mode` | str | 0 | 0.0% | 4 | Second Class, Second Class |
| `Customer ID` | str | 0 | 0.0% | 793 | CG-12520, CG-12520 |
| `Customer Name` | str | 0 | 0.0% | 793 | Claire Gute, Claire Gute |
| `Segment` | str | 0 | 0.0% | 3 | Consumer, Consumer |
| `Country` | str | 0 | 0.0% | 1 | United States, United States |
| `City` | str | 0 | 0.0% | 531 | Henderson, Henderson |
| `State` | str | 0 | 0.0% | 49 | Kentucky, Kentucky |
| `Postal Code` | int64 | 0 | 0.0% | 631 | 42420, 42420 |
| `Region` | str | 0 | 0.0% | 4 | South, South |
| `Product ID` | str | 0 | 0.0% | 1,862 | FUR-BO-10001798, FUR-CH-10000454 |
| `Category` | str | 0 | 0.0% | 3 | Furniture, Furniture |
| `Sub-Category` | str | 0 | 0.0% | 17 | Bookcases, Chairs |
| `Product Name` | str | 0 | 0.0% | 1,850 | Bush Somerset Collection Bookcase, Hon Deluxe Fabric Upholstered Stacking Chairs, Rounded Back |
| `Sales` | float64 | 0 | 0.0% | 5,825 | 261.96, 731.94 |
| `Quantity` | int64 | 0 | 0.0% | 14 | 2, 3 |
| `Discount` | float64 | 0 | 0.0% | 12 | 0.0, 0.0 |
| `Profit` | float64 | 0 | 0.0% | 7,287 | 41.9136, 219.582 |

---
## 3. Numerical Summary Statistics
| Column | Min | 25% | Median | Mean | 75% | Max | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Row ID` | 1.0 | 2499.25 | 4997.5 | 4997.5 | 7495.75 | 9994.0 | 2885.1636 |
| `Postal Code` | 1040.0 | 23223.0 | 56430.5 | 55190.3794 | 90008.0 | 99301.0 | 32063.6934 |
| `Sales` | 0.444 | 17.28 | 54.49 | 229.858 | 209.94 | 22638.48 | 623.2451 |
| `Quantity` | 1.0 | 2.0 | 3.0 | 3.7896 | 5.0 | 14.0 | 2.2251 |
| `Discount` | 0.0 | 0.0 | 0.2 | 0.1562 | 0.2 | 0.8 | 0.2065 |
| `Profit` | -6599.978 | 1.7288 | 8.6665 | 28.6569 | 29.364 | 8399.976 | 234.2601 |

---
## 4. Categorical Distributions (Top Values)
| Column | Unique Categories | Top Category | Top Frequency | Share % |
| :--- | :--- | :--- | :--- | :--- |
| `Order ID` | 5,009 | CA-2017-100111 | 14 | 0.14% |
| `Order Date` | 1,237 | 09-05-2016 | 38 | 0.38% |
| `Ship Date` | 1,334 | 12/16/2015 | 35 | 0.35% |
| `Ship Mode` | 4 | Standard Class | 5,968 | 59.72% |
| `Customer ID` | 793 | WB-21850 | 37 | 0.37% |
| `Customer Name` | 793 | William Brown | 37 | 0.37% |
| `Segment` | 3 | Consumer | 5,191 | 51.94% |
| `Country` | 1 | United States | 9,994 | 100.0% |
| `City` | 531 | New York City | 915 | 9.16% |
| `State` | 49 | California | 2,001 | 20.02% |
| `Region` | 4 | West | 3,203 | 32.05% |
| `Product ID` | 1,862 | OFF-PA-10001970 | 19 | 0.19% |
| `Category` | 3 | Office Supplies | 6,026 | 60.3% |
| `Sub-Category` | 17 | Binders | 1,523 | 15.24% |
| `Product Name` | 1,850 | Staple envelope | 48 | 0.48% |
