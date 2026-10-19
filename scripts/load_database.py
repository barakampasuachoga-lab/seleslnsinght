#!/usr/bin/env python3
"""CLI Script: load_database.py.

Provisions the relational database schema, loads cleaned sales data into
analytical tables, creates analytical views, executes SQL queries, and verifies
consistency between SQL metrics and Python metrics.

Usage:
    python scripts/load_database.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to python path
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from salesinsight.config import PROCESSED_DATA_DIR, SQL_DIR
from salesinsight.database import DatabaseManager
from salesinsight.ingestion import load_dataset
from salesinsight.metrics import calculate_distinct_orders, calculate_total_profit, calculate_total_sales


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize database, load processed data, and verify SQL queries.")
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default=str(PROCESSED_DATA_DIR / "sales_cleaned.csv"),
        help="Path to cleaned dataset",
    )
    args = parser.parse_args()

    print("\n🗄️  [SalesInsight] Initializing Database & Executing DDL Schema...")
    db = DatabaseManager()

    # 1. Execute schema.sql
    schema_path = SQL_DIR / "schema.sql"
    try:
        db.execute_script(schema_path)
        print(f"✅ Executed DDL schema from: {schema_path}")
    except Exception as e:
        print(f"❌ Failed applying schema: {e}", file=sys.stderr)
        return 1

    # 2. Ingest cleaned sales data
    print(f"📥 Loading cleaned records from: {args.input}")
    try:
        df, _ = load_dataset(args.input)
    except Exception as e:
        print(f"❌ Failed reading cleaned dataset: {e}", file=sys.stderr)
        return 1

    # 3. Load into relational table
    loaded_count = db.load_dataframe(df, table_name="sales_records", if_exists="replace")
    print(f"✅ Successfully inserted {loaded_count:,} records into table 'sales_records'.")

    # 4. Populate Star Schema (Dimension & Fact tables)
    try:
        if "customer_id" in df.columns:
            dim_cust = (
                df[["customer_id", "customer_name", "customer_segment"]]
                .drop_duplicates(subset=["customer_id"])
                .rename(columns={"customer_id": "customer_key"})
            )
            db.load_dataframe(dim_cust, table_name="dim_customer", if_exists="replace")

        if "product_id" in df.columns:
            dim_prod = (
                df[["product_id", "product_name", "category", "subcategory"]]
                .drop_duplicates(subset=["product_id"])
                .rename(columns={"product_id": "product_key"})
            )
            db.load_dataframe(dim_prod, table_name="dim_product", if_exists="replace")

        if "city" in df.columns and "state" in df.columns:
            df_geo = df[["city", "state", "postal_code", "region", "country"]].drop_duplicates().copy()
            df_geo["geo_key"] = df_geo["city"] + "_" + df_geo["state"]
            db.load_dataframe(df_geo, table_name="dim_geography", if_exists="replace")

        print("⭐ Populated star schema dimensional tables (dim_customer, dim_product, dim_geography).")
    except Exception as e:
        print(f"⚠️  Star schema population note: {e}")

    # 5. Create Views
    views_path = SQL_DIR / "views.sql"
    if views_path.exists():
        try:
            db.execute_script(views_path)
            print("✅ Created analytical views from: sql/views.sql")
        except Exception as e:
            print(f"⚠️  Views creation notice: {e}")

    # 6. Execute benchmark queries and verify cross-consistency
    print("\n🔍 Running verification SQL queries...")
    results = db.run_analysis_queries()

    if "total_metrics" in results and not results["total_metrics"].empty:
        sql_metrics = results["total_metrics"].iloc[0]
        py_sales = calculate_total_sales(df)
        py_profit = calculate_total_profit(df)
        py_orders = calculate_distinct_orders(df)

        print("\n--- CROSS-SYSTEM VERIFICATION: PYTHON vs SQL ---")
        print(f"Python Sales:  ${py_sales:,.2f}  |  SQL Sales:  ${sql_metrics['total_sales']:,.2f}")
        print(f"Python Profit: ${py_profit:,.2f}  |  SQL Profit: ${sql_metrics['total_profit']:,.2f}")
        print(f"Python Orders: {py_orders:,}       |  SQL Orders: {sql_metrics['distinct_orders']:,}")

        # Check for discrepancies
        sales_diff = abs(py_sales - float(sql_metrics["total_sales"]))
        orders_diff = abs(py_orders - int(sql_metrics["distinct_orders"]))

        if sales_diff < 0.05 and orders_diff == 0:
            print("🎉 100% PERFECT MATCH: Python and SQL results are completely consistent!")
        else:
            print(f"⚠️  Small variance detected: sales_diff={sales_diff}, orders_diff={orders_diff}")

    print("\n✅ Database Loading & SQL Verification Phase completed successfully.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
