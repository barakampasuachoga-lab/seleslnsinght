#!/usr/bin/env python3
"""CLI Script: analyze_sales.py.

Executes comprehensive exploratory data analysis on the cleaned dataset,
calculates verified metrics, exports tabular summary reports, and plots
analytical visualizations.

Usage:
    python scripts/analyze_sales.py --input data/processed/sales_cleaned.csv
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Add src to python path
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from salesinsight.analysis import (
    analyze_category_performance,
    analyze_customer_rfm,
    analyze_customer_segments,
    analyze_discount_impact,
    analyze_product_performance,
    analyze_regional_performance,
    analyze_subcategory_performance,
    analyze_time_series,
    detect_outliers_iqr,
)
from salesinsight.config import ANALYSIS_REPORTS_DIR, FIGURES_DIR
from salesinsight.ingestion import load_dataset
from salesinsight.metrics import calculate_executive_kpis
from salesinsight.visualization import (
    plot_category_performance,
    plot_discount_impact,
    plot_monthly_trend,
    plot_regional_performance,
    plot_top_loss_products,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze retail sales performance and generate visualizations.")
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/processed/sales_cleaned.csv",
        help="Path to cleaned dataset",
    )
    args = parser.parse_args()

    print(f"\n📊 [SalesInsight] Running Business Analysis on: {args.input}")
    try:
        df, _ = load_dataset(args.input)
    except Exception as e:
        print(f"❌ Failed loading dataset: {e}", file=sys.stderr)
        return 1

    # Ensure date columns are parsed
    for d_col in ["order_date", "ship_date"]:
        if d_col in df.columns:
            import pandas as pd
            df[d_col] = pd.to_datetime(df[d_col], errors="coerce")

    # 1. Headline KPIs
    kpis = calculate_executive_kpis(df)
    print("\n--- EXECUTIVE HEADLINE KPIS ---")
    print(f"💰 Total Sales Revenue:     ${kpis['total_sales']:,.2f}")
    print(f"📈 Total Net Profit:        ${kpis['total_profit']:,.2f}")
    print(f"🎯 Profit Margin:           {kpis['profit_margin_pct']:.2f}%")
    print(f"📦 Total Distinct Orders:   {kpis['total_orders']:,}")
    print(f"💳 Average Order Value:     ${kpis['average_order_value']:,.2f}")
    print(f"🏷️  Total Units Sold:        {kpis['total_units_sold']:,}")
    print(f"👥 Total Customers:         {kpis['total_customers']:,}")
    print(f"📉 Avg Discount Rate:       {kpis['average_discount_pct']:.2f}%")

    # Save KPIs to JSON
    kpi_file = ANALYSIS_REPORTS_DIR / "kpis.json"
    with open(kpi_file, "w", encoding="utf-8") as f:
        json.dump(kpis, f, indent=2)

    # 2. Category & Subcategory Analysis
    cat_df = analyze_category_performance(df)
    subcat_df = analyze_subcategory_performance(df)
    cat_df.to_csv(ANALYSIS_REPORTS_DIR / "category_performance.csv", index=False)
    subcat_df.to_csv(ANALYSIS_REPORTS_DIR / "subcategory_performance.csv", index=False)

    # 3. Regional Breakdown
    reg_df = analyze_regional_performance(df)
    reg_df.to_csv(ANALYSIS_REPORTS_DIR / "regional_performance.csv", index=False)

    # 4. Customer Segments & RFM
    seg_df = analyze_customer_segments(df)
    rfm_df = analyze_customer_rfm(df)
    seg_df.to_csv(ANALYSIS_REPORTS_DIR / "customer_segments.csv", index=False)
    rfm_df.head(100).to_csv(ANALYSIS_REPORTS_DIR / "customer_rfm_top100.csv", index=False)

    # 5. Products (Top Sales, Profit, Loss)
    prod_dict = analyze_product_performance(df, top_n=15)
    for key, p_data in prod_dict.items():
        p_data.to_csv(ANALYSIS_REPORTS_DIR / f"products_{key}.csv", index=False)

    # 6. Time Series & Growth
    ts_dict = analyze_time_series(df)
    if "monthly" in ts_dict:
        ts_dict["monthly"].to_csv(ANALYSIS_REPORTS_DIR / "monthly_sales.csv", index=False)
    if "yearly" in ts_dict:
        ts_dict["yearly"].to_csv(ANALYSIS_REPORTS_DIR / "yearly_sales_growth.csv", index=False)

    # 7. Discount Impact
    disc_df = analyze_discount_impact(df)
    disc_df.to_csv(ANALYSIS_REPORTS_DIR / "discount_impact.csv", index=False)

    # 8. Outliers
    outliers = detect_outliers_iqr(df)
    with open(ANALYSIS_REPORTS_DIR / "outliers_iqr.json", "w", encoding="utf-8") as f:
        json.dump(outliers, f, indent=2)

    # 9. Generate Charts
    print("\n🎨 Generating Analytical Visualizations...")
    if "monthly" in ts_dict:
        plot_monthly_trend(ts_dict["monthly"], FIGURES_DIR / "sales_trend_monthly.png")
    plot_category_performance(cat_df, FIGURES_DIR / "category_performance.png")
    plot_regional_performance(reg_df, FIGURES_DIR / "regional_breakdown.png")
    plot_discount_impact(disc_df, FIGURES_DIR / "discount_profitability.png")
    plot_top_loss_products(prod_dict, FIGURES_DIR / "top_products_profit_loss.png")

    print("✅ All analytical reports and figures exported successfully.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
