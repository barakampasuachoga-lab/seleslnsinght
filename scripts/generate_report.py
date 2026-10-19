#!/usr/bin/env python3
"""CLI Script: generate_report.py.

Synthesizes clean analytical outputs, multi-dimensional performance profiles,
and business recommendations into an executive markdown briefing report.

Usage:
    python scripts/generate_report.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to python path
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from salesinsight.analysis import (
    analyze_category_performance,
    analyze_discount_impact,
    analyze_product_performance,
    analyze_regional_performance,
)
from salesinsight.config import ANALYSIS_REPORTS_DIR, PROCESSED_DATA_DIR
from salesinsight.ingestion import load_dataset
from salesinsight.metrics import calculate_executive_kpis
from salesinsight.reporting import generate_executive_markdown_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate comprehensive executive sales analysis report.")
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default=str(PROCESSED_DATA_DIR / "sales_cleaned.csv"),
        help="Path to cleaned dataset",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=str(ANALYSIS_REPORTS_DIR / "executive_summary.md"),
        help="Path for generated Executive Markdown Report",
    )
    args = parser.parse_args()

    print(f"\n📑 [SalesInsight] Generating Executive Business Report from: {args.input}")
    try:
        df, _ = load_dataset(args.input)
    except Exception as e:
        print(f"❌ Failed loading dataset: {e}", file=sys.stderr)
        return 1

    kpis = calculate_executive_kpis(df)
    cat_df = analyze_category_performance(df)
    reg_df = analyze_regional_performance(df)
    products_dict = analyze_product_performance(df, top_n=10)
    disc_df = analyze_discount_impact(df)

    out_path = Path(args.output)
    report_text = generate_executive_markdown_report(
        kpis=kpis,
        cat_df=cat_df,
        reg_df=reg_df,
        products_dict=products_dict,
        disc_df=disc_df,
        output_path=out_path,
    )

    print(f"✅ Executive Report successfully generated and saved to: {out_path}")
    print("\nReport Highlights Preview:")
    for line in report_text.splitlines()[:25]:
        print(f"   {line}")
    print("\n✅ Executive Reporting Phase completed successfully.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
