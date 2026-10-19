#!/usr/bin/env python3
"""CLI Script: inspect_data.py.

Loads raw data, performs thorough validation, checks data types, missing values,
duplicates, and statistical distributions, and outputs Markdown and JSON reports.

Usage:
    python scripts/inspect_data.py --input data/raw/superstore.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to python path
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from salesinsight.config import DATA_QUALITY_REPORTS_DIR
from salesinsight.ingestion import IngestionError, load_dataset
from salesinsight.validation import generate_markdown_report, inspect_dataset, save_inspection_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect and profile raw sales dataset for quality issues.")
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/raw/superstore.csv",
        help="Path to input raw CSV or Excel dataset",
    )
    parser.add_argument(
        "--output-report",
        "-r",
        type=str,
        default=str(DATA_QUALITY_REPORTS_DIR / "inspection_report.md"),
        help="Path for generated Markdown quality report",
    )
    parser.add_argument(
        "--output-json",
        "-j",
        type=str,
        default=str(DATA_QUALITY_REPORTS_DIR / "inspection_report.json"),
        help="Path for generated JSON machine-readable report",
    )

    args = parser.parse_args()

    print(f"\n🔍 [SalesInsight] Inspecting dataset: {args.input}")
    try:
        df, meta = load_dataset(args.input)
    except IngestionError as e:
        print(f"❌ Ingestion Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"❌ Unexpected Error: {e}", file=sys.stderr)
        return 1

    print(f"✅ Loaded {meta['row_count']:,} rows across {meta['column_count']} columns.")

    # Inspect dataset
    inspection = inspect_dataset(df, source_name=meta["file_name"])

    # Save reports
    report_md = generate_markdown_report(inspection, output_path=Path(args.output_report))
    save_inspection_json(inspection, output_path=Path(args.output_json))

    print(f"📄 Inspection Markdown saved to: {args.output_report}")
    print(f"💾 Inspection JSON saved to: {args.output_json}")

    warnings = inspection.get("warnings", [])
    if warnings:
        print(f"\n⚠️  Found {len(warnings)} data quality flag(s):")
        for w in warnings:
            print(f"   - {w}")
    else:
        print("\n✨ No critical data anomalies detected.")

    print("\n✅ Data Inspection Phase completed successfully.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
