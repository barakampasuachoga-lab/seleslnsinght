"""Automated Tests for Database Layer and SQL Verification."""

import tempfile
from pathlib import Path
import pandas as pd
import pytest

from salesinsight.database import DatabaseManager
from salesinsight.metrics import calculate_distinct_orders, calculate_total_profit, calculate_total_sales


def test_database_lifecycle_and_sql_aggregation_consistency():
    """Verify DDL execution, table loading, and SQL vs Python aggregation consistency."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)

    sqlite_url = f"sqlite:///{db_path}"
    db = DatabaseManager(connection_url=sqlite_url)

    # 1. Execute Schema
    schema_sql = Path("sql/schema.sql")
    db.execute_script(schema_sql)

    # 2. Synthetic dataset
    test_df = pd.DataFrame({
        "row_id": [1, 2, 3, 4],
        "order_id": ["ORD-1", "ORD-1", "ORD-2", "ORD-3"],
        "order_date": ["2023-01-01", "2023-01-01", "2023-01-02", "2023-01-03"],
        "sales": [100.0, 50.0, 300.0, 200.0],
        "quantity": [1, 2, 3, 1],
        "discount": [0.0, 0.1, 0.0, 0.2],
        "profit": [20.0, 5.0, 60.0, -10.0],
        "category": ["Technology", "Technology", "Furniture", "Office Supplies"],
        "region": ["West", "West", "East", "Central"],
        "discount_band": ["0% (No Discount)", "1% - 10%", "0% (No Discount)", "11% - 20%"],
        "product_name": ["Mouse", "Cable", "Chair", "Folder"],
    })

    # 3. Load into database
    loaded = db.load_dataframe(test_df, table_name="sales_records", if_exists="replace")
    assert loaded == 4

    # 4. Run Analysis queries
    results = db.run_analysis_queries()
    assert "total_metrics" in results
    sql_totals = results["total_metrics"].iloc[0]

    # 5. Cross-System Validation
    py_sales = calculate_total_sales(test_df)
    py_profit = calculate_total_profit(test_df)
    py_orders = calculate_distinct_orders(test_df)

    assert float(sql_totals["total_sales"]) == py_sales
    assert float(sql_totals["total_profit"]) == py_profit
    assert int(sql_totals["distinct_orders"]) == py_orders

    # Cleanup
    if db_path.exists():
        db_path.unlink()
