"""Module B: Data Inspection and Quality Assessment.

Performs thorough structural validation, statistical summary generation,
missingness evaluation, duplicate detection, and automated data-quality reporting.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def inspect_dataset(df: pd.DataFrame, source_name: str = "dataset") -> Dict[str, Any]:
    """Generates an extensive data inspection and quality profile of a dataset.

    Args:
        df: Input DataFrame to inspect.
        source_name: Human-readable name or filename of the dataset.

    Returns:
        Dictionary containing structural, statistical, missingness, uniqueness,
        and data quality warning information.
    """
    total_rows = len(df)
    total_cols = len(df.columns)

    # Missing value analysis
    missing_counts = df.isnull().sum()
    missing_percentages = (missing_counts / total_rows * 100).round(2)
    missing_summary = {
        col: {
            "count": int(missing_counts[col]),
            "percentage": float(missing_percentages[col]),
        }
        for col in df.columns
    }

    # Duplicate rows analysis
    duplicate_rows_count = int(df.duplicated().sum())
    duplicate_percentage = round((duplicate_rows_count / total_rows) * 100, 2) if total_rows > 0 else 0.0

    # Column dtypes and uniqueness
    columns_info: Dict[str, Any] = {}
    for col in df.columns:
        n_unique = int(df[col].nunique(dropna=True))
        columns_info[col] = {
            "dtype": str(df[col].dtype),
            "unique_count": n_unique,
            "unique_ratio": round(n_unique / total_rows, 4) if total_rows > 0 else 0.0,
            "sample_values": [str(v) for v in df[col].dropna().head(3).tolist()],
        }

    # Numerical summaries
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    numeric_summaries: Dict[str, Any] = {}
    if num_cols:
        desc = df[num_cols].describe().to_dict()
        for col in num_cols:
            numeric_summaries[col] = {
                "count": int(desc[col].get("count", 0)),
                "mean": round(float(desc[col].get("mean", 0)), 4) if not np.isnan(desc[col].get("mean", 0)) else None,
                "std": round(float(desc[col].get("std", 0)), 4) if not np.isnan(desc[col].get("std", 0)) else None,
                "min": round(float(desc[col].get("min", 0)), 4) if not np.isnan(desc[col].get("min", 0)) else None,
                "q25": round(float(desc[col].get("25%", 0)), 4) if not np.isnan(desc[col].get("25%", 0)) else None,
                "median": round(float(desc[col].get("50%", 0)), 4) if not np.isnan(desc[col].get("50%", 0)) else None,
                "q75": round(float(desc[col].get("75%", 0)), 4) if not np.isnan(desc[col].get("75%", 0)) else None,
                "max": round(float(desc[col].get("max", 0)), 4) if not np.isnan(desc[col].get("max", 0)) else None,
            }

    # Categorical summaries
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    categorical_summaries: Dict[str, Any] = {}
    for col in cat_cols:
        val_counts = df[col].value_counts(dropna=True)
        top_val = str(val_counts.index[0]) if len(val_counts) > 0 else None
        top_freq = int(val_counts.iloc[0]) if len(val_counts) > 0 else 0
        categorical_summaries[col] = {
            "unique_count": int(df[col].nunique()),
            "top_value": top_val,
            "top_frequency": top_freq,
            "top_percentage": round((top_freq / total_rows) * 100, 2) if total_rows > 0 else 0.0,
        }

    # Data Quality Warnings
    warnings: List[str] = []

    if duplicate_rows_count > 0:
        warnings.append(f"Detected {duplicate_rows_count:,} duplicate rows ({duplicate_percentage}%).")

    cols_with_missing = [c for c, m in missing_summary.items() if m["count"] > 0]
    if cols_with_missing:
        warnings.append(f"{len(cols_with_missing)} columns contain missing values: {', '.join(cols_with_missing)}.")

    # Check for negative values in potential sales/quantity columns
    for col in df.columns:
        col_lower = col.lower()
        if "sale" in col_lower and col in num_cols:
            neg_sales = int((df[col] < 0).sum())
            if neg_sales > 0:
                warnings.append(f"Column '{col}' contains {neg_sales:,} negative values (potential returns/credit notes).")
            zero_sales = int((df[col] == 0).sum())
            if zero_sales > 0:
                warnings.append(f"Column '{col}' contains {zero_sales:,} zero values.")

        if "quant" in col_lower and col in num_cols:
            neg_qty = int((df[col] < 0).sum())
            if neg_qty > 0:
                warnings.append(f"Column '{col}' contains {neg_qty:,} negative quantities.")

        if "discount" in col_lower and col in num_cols:
            high_disc = int((df[col] > 1.0).sum())
            if high_disc > 0:
                warnings.append(
                    f"Column '{col}' contains values > 1.0 ({high_disc:,} rows). Check if discount is 0-100 percentage scale."
                )

    report_data = {
        "source_name": source_name,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "columns_info": columns_info,
        "missing_summary": missing_summary,
        "duplicate_rows_count": duplicate_rows_count,
        "duplicate_percentage": duplicate_percentage,
        "numeric_summaries": numeric_summaries,
        "categorical_summaries": categorical_summaries,
        "warnings": warnings,
    }
    return report_data


def generate_markdown_report(inspection_data: Dict[str, Any], output_path: Optional[Path] = None) -> str:
    """Generates an executive-ready Markdown data quality report.

    Args:
        inspection_data: Inspection dictionary from `inspect_dataset`.
        output_path: Optional path to save the generated markdown.

    Returns:
        The markdown formatted text.
    """
    lines: List[str] = [
        f"# SalesInsight Data Quality & Inspection Report",
        f"**Dataset Source:** `{inspection_data['source_name']}`  ",
        f"**Total Records:** `{inspection_data['total_rows']:,}`  ",
        f"**Total Columns:** `{inspection_data['total_columns']}`  ",
        f"**Duplicate Records:** `{inspection_data['duplicate_rows_count']:,}` ({inspection_data['duplicate_percentage']}%)  \n",
        "---",
        "## 1. Data Quality Warnings & Flags",
    ]

    warnings = inspection_data.get("warnings", [])
    if warnings:
        for w in warnings:
            lines.append(f"- ⚠️ **Flag:** {w}")
    else:
        lines.append("- ✅ **Clean:** No structural anomalies or negative sales anomalies detected.")

    lines.extend([
        "\n---",
        "## 2. Column Inventory & Missing Value Analysis",
        "| Column Name | Data Type | Missing Count | Missing % | Unique Count | Sample Values |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |",
    ])

    col_info = inspection_data["columns_info"]
    missing = inspection_data["missing_summary"]
    for col, info in col_info.items():
        m_count = missing[col]["count"]
        m_pct = missing[col]["percentage"]
        samples = ", ".join(info["sample_values"][:2])
        lines.append(
            f"| `{col}` | {info['dtype']} | {m_count:,} | {m_pct}% | {info['unique_count']:,} | {samples} |"
        )

    # Numerical statistics
    if inspection_data["numeric_summaries"]:
        lines.extend([
            "\n---",
            "## 3. Numerical Summary Statistics",
            "| Column | Min | 25% | Median | Mean | 75% | Max | Std Dev |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ])
        for col, s in inspection_data["numeric_summaries"].items():
            lines.append(
                f"| `{col}` | {s['min']} | {s['q25']} | {s['median']} | {s['mean']} | {s['q75']} | {s['max']} | {s['std']} |"
            )

    # Categorical statistics
    if inspection_data["categorical_summaries"]:
        lines.extend([
            "\n---",
            "## 4. Categorical Distributions (Top Values)",
            "| Column | Unique Categories | Top Category | Top Frequency | Share % |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ])
        for col, c in inspection_data["categorical_summaries"].items():
            lines.append(
                f"| `{col}` | {c['unique_count']:,} | {c['top_value']} | {c['top_frequency']:,} | {c['top_percentage']}% |"
            )

    report_text = "\n".join(lines) + "\n"

    if output_path:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report_text, encoding="utf-8")
        logger.info(f"Data quality report saved to: {out}")

    return report_text


def save_inspection_json(inspection_data: Dict[str, Any], output_path: Path) -> None:
    """Saves machine-readable inspection data to JSON format."""
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(inspection_data, f, indent=2)
    logger.info(f"Machine-readable inspection JSON saved to: {out}")
