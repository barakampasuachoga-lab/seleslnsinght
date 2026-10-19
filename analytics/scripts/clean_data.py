#!/usr/bin/env python3
"""CLI Script: clean_data.py.

Loads raw sales data, applies schema standardization, date parsing, numeric casting,
whitespace stripping, derived dimension creation, and saves processed analytical data.

Usage:
    python scripts/clean_data.py --input data/raw/superstore.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to python path
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from salesinsight.cleaning import CleaningPipeline
from salesinsight.config import DATA_QUALITY_REPORTS_DIR, PROCESSED_DATA_DIR
from salesinsight.ingestion import IngestionError, load_dataset


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean, standardize, and transform sales dataset.")
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/raw/superstore.csv",
        help="Path to raw CSV or Excel dataset",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=str(PROCESSED_DATA_DIR / "sales_cleaned.csv"),
        help="Path for saving cleaned output CSV",
    )
    parser.add_argument(
        "--summary",
        "-s",
        type=str,
        default=str(DATA_QUALITY_REPORTS_DIR / "cleaning_summary.md"),
        help="Path for saving cleaning audit summary markdown",
    )

    args = parser.parse_args()

    print(f"\n🧹 [SalesInsight] Cleaning dataset: {args.input}")
    try:
        df_raw, meta = load_dataset(args.input)
    except IngestionError as e:
        print(f"❌ Ingestion Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"❌ Unexpected Error: {e}", file=sys.stderr)
        return 1

    pipeline = CleaningPipeline()
    df_cleaned, summary = pipeline.clean(df_raw)

    pipeline.save_cleaned_data(
        df_cleaned=df_cleaned,
        summary=summary,
        output_csv_path=Path(args.output),
        summary_md_path=Path(args.summary),
    )

    print(f"✅ Cleaned records: {summary['final_rows']:,} rows written.")
    print(f"💾 Processed dataset saved to: {args.output}")
    print(f"📄 Cleaning audit log saved to: {args.summary}")
    print("\n✅ Data Cleaning Phase completed successfully.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
