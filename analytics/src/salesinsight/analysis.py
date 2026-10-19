"""Module D & E: Exploratory and Advanced Business Analysis.

Generates deep multi-dimensional aggregations, product performance rankings,
regional benchmarks, customer segmentation, discount sensitivity profiles,
time-series growth, and statistical outlier identification.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from salesinsight.metrics import calculate_sales_growth

logger = logging.getLogger(__name__)


def analyze_category_performance(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes sales, profit, orders, and profit margin by Category."""
    if "category" not in df.columns:
        return pd.DataFrame()

    agg_dict = {
        "sales": "sum",
        "order_id": "nunique",
    }
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "quantity" in df.columns:
        agg_dict["quantity"] = "sum"

    cat_df = df.groupby("category").agg(agg_dict).reset_index()
    cat_df.rename(columns={"order_id": "distinct_orders"}, inplace=True)

    total_sales = cat_df["sales"].sum()
    cat_df["sales_share_pct"] = ((cat_df["sales"] / total_sales) * 100).round(2) if total_sales > 0 else 0

    if "profit" in cat_df.columns:
        cat_df["profit_margin_pct"] = np.where(
            cat_df["sales"] > 0,
            ((cat_df["profit"] / cat_df["sales"]) * 100).round(2),
            0.0,
        )
        total_profit = cat_df["profit"].sum()
        cat_df["profit_share_pct"] = (
            ((cat_df["profit"] / total_profit) * 100).round(2) if total_profit != 0 else 0
        )

    cat_df["sales"] = cat_df["sales"].round(2)
    if "profit" in cat_df.columns:
        cat_df["profit"] = cat_df["profit"].round(2)

    return cat_df.sort_values(by="sales", ascending=False)


def analyze_subcategory_performance(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes subcategory revenue, profitability, and margin."""
    if "subcategory" not in df.columns:
        return pd.DataFrame()

    group_cols = ["category", "subcategory"] if "category" in df.columns else ["subcategory"]
    agg_dict = {"sales": "sum", "order_id": "nunique"}
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "quantity" in df.columns:
        agg_dict["quantity"] = "sum"

    sub_df = df.groupby(group_cols).agg(agg_dict).reset_index()
    sub_df.rename(columns={"order_id": "distinct_orders"}, inplace=True)

    if "profit" in sub_df.columns:
        sub_df["profit_margin_pct"] = np.where(
            sub_df["sales"] > 0,
            ((sub_df["profit"] / sub_df["sales"]) * 100).round(2),
            0.0,
        )
    sub_df["sales"] = sub_df["sales"].round(2)
    if "profit" in sub_df.columns:
        sub_df["profit"] = sub_df["profit"].round(2)

    return sub_df.sort_values(by="sales", ascending=False)


def analyze_product_performance(df: pd.DataFrame, top_n: int = 10) -> Dict[str, pd.DataFrame]:
    """Analyzes product leaders, most profitable items, and loss-making items."""
    prod_col = "product_name" if "product_name" in df.columns else "product_id"
    if prod_col not in df.columns:
        return {}

    agg_dict = {"sales": "sum", "order_id": "nunique"}
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "quantity" in df.columns:
        agg_dict["quantity"] = "sum"

    p_df = df.groupby(prod_col).agg(agg_dict).reset_index()
    p_df.rename(columns={"order_id": "distinct_orders"}, inplace=True)
    p_df["sales"] = p_df["sales"].round(2)
    if "profit" in p_df.columns:
        p_df["profit"] = p_df["profit"].round(2)
        p_df["profit_margin_pct"] = np.where(
            p_df["sales"] > 0,
            ((p_df["profit"] / p_df["sales"]) * 100).round(2),
            0.0,
        )

    top_sales = p_df.sort_values(by="sales", ascending=False).head(top_n)

    result = {"top_sales": top_sales}
    if "profit" in p_df.columns:
        result["top_profit"] = p_df.sort_values(by="profit", ascending=False).head(top_n)
        result["worst_loss"] = p_df.sort_values(by="profit", ascending=True).head(top_n)

    return result


def analyze_regional_performance(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes performance metrics grouped by geographic Region."""
    if "region" not in df.columns:
        return pd.DataFrame()

    agg_dict = {"sales": "sum", "order_id": "nunique"}
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "customer_id" in df.columns:
        agg_dict["customer_id"] = "nunique"

    reg_df = df.groupby("region").agg(agg_dict).reset_index()
    reg_df.rename(
        columns={"order_id": "distinct_orders", "customer_id": "distinct_customers"},
        inplace=True,
    )

    reg_df["aov"] = (reg_df["sales"] / reg_df["distinct_orders"]).round(2)
    if "profit" in reg_df.columns:
        reg_df["profit_margin_pct"] = ((reg_df["profit"] / reg_df["sales"]) * 100).round(2)

    reg_df["sales"] = reg_df["sales"].round(2)
    if "profit" in reg_df.columns:
        reg_df["profit"] = reg_df["profit"].round(2)

    return reg_df.sort_values(by="sales", ascending=False)


def analyze_customer_segments(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes sales and customer metrics by Customer Segment."""
    seg_col = "customer_segment" if "customer_segment" in df.columns else "segment"
    if seg_col not in df.columns:
        return pd.DataFrame()

    agg_dict = {"sales": "sum", "order_id": "nunique"}
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "customer_id" in df.columns:
        agg_dict["customer_id"] = "nunique"

    seg_df = df.groupby(seg_col).agg(agg_dict).reset_index()
    seg_df.rename(
        columns={
            seg_col: "customer_segment",
            "order_id": "distinct_orders",
            "customer_id": "distinct_customers",
        },
        inplace=True,
    )

    seg_df["aov"] = (seg_df["sales"] / seg_df["distinct_orders"]).round(2)
    if "profit" in seg_df.columns:
        seg_df["profit_margin_pct"] = ((seg_df["profit"] / seg_df["sales"]) * 100).round(2)

    seg_df["sales"] = seg_df["sales"].round(2)
    if "profit" in seg_df.columns:
        seg_df["profit"] = seg_df["profit"].round(2)

    return seg_df.sort_values(by="sales", ascending=False)


def analyze_time_series(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """Analyzes temporal patterns: Yearly, Monthly, and YoY Growth."""
    if "order_date" not in df.columns or not pd.api.types.is_datetime64_any_dtype(df["order_date"]):
        return {}

    # Monthly trends
    monthly = (
        df.groupby("order_year_month")
        .agg(
            sales=("sales", "sum"),
            profit=("profit", "sum") if "profit" in df.columns else ("sales", "count"),
            orders=("order_id", "nunique"),
        )
        .reset_index()
    )
    monthly["sales"] = monthly["sales"].round(2)
    if "profit" in df.columns:
        monthly["profit"] = monthly["profit"].round(2)
        monthly["profit_margin_pct"] = ((monthly["profit"] / monthly["sales"]) * 100).round(2)

    # Calculate MoM sales growth
    monthly["prev_sales"] = monthly["sales"].shift(1)
    monthly["mom_growth_pct"] = (
        ((monthly["sales"] - monthly["prev_sales"]) / monthly["prev_sales"]) * 100
    ).round(2)
    monthly.drop(columns=["prev_sales"], inplace=True)

    # Yearly trends & YoY growth
    yearly = (
        df.groupby("order_year")
        .agg(
            sales=("sales", "sum"),
            profit=("profit", "sum") if "profit" in df.columns else ("sales", "count"),
            orders=("order_id", "nunique"),
        )
        .reset_index()
    )
    yearly["sales"] = yearly["sales"].round(2)
    if "profit" in df.columns:
        yearly["profit"] = yearly["profit"].round(2)
        yearly["profit_margin_pct"] = ((yearly["profit"] / yearly["sales"]) * 100).round(2)

    yearly["prev_sales"] = yearly["sales"].shift(1)
    yearly["yoy_growth_pct"] = (
        ((yearly["sales"] - yearly["prev_sales"]) / yearly["prev_sales"]) * 100
    ).round(2)
    yearly.drop(columns=["prev_sales"], inplace=True)

    return {"monthly": monthly, "yearly": yearly}


def analyze_discount_impact(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes how discounting correlates with sales revenue and profit margin."""
    if "discount" not in df.columns:
        return pd.DataFrame()

    band_col = "discount_band" if "discount_band" in df.columns else "discount"
    agg_dict = {
        "sales": "sum",
        "order_id": "nunique",
    }
    if "profit" in df.columns:
        agg_dict["profit"] = "sum"
    if "quantity" in df.columns:
        agg_dict["quantity"] = "sum"

    disc_df = df.groupby(band_col).agg(agg_dict).reset_index()
    disc_df.rename(columns={"order_id": "distinct_orders"}, inplace=True)

    if "profit" in disc_df.columns:
        disc_df["profit_margin_pct"] = np.where(
            disc_df["sales"] > 0,
            ((disc_df["profit"] / disc_df["sales"]) * 100).round(2),
            0.0,
        )

    disc_df["sales"] = disc_df["sales"].round(2)
    if "profit" in disc_df.columns:
        disc_df["profit"] = disc_df["profit"].round(2)

    return disc_df


def analyze_customer_rfm(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates Recency, Frequency, and Monetary (RFM) metrics per Customer."""
    if "customer_id" not in df.columns or "order_date" not in df.columns:
        return pd.DataFrame()

    snapshot_date = df["order_date"].max() + pd.Timedelta(days=1)

    rfm = (
        df.groupby("customer_id")
        .agg(
            recency_days=("order_date", lambda x: (snapshot_date - x.max()).days),
            frequency=("order_id", "nunique"),
            monetary_value=("sales", "sum"),
            total_profit=("profit", "sum") if "profit" in df.columns else ("sales", "count"),
        )
        .reset_index()
    )
    rfm["monetary_value"] = rfm["monetary_value"].round(2)
    if "profit" in df.columns:
        rfm["total_profit"] = rfm["total_profit"].round(2)

    return rfm.sort_values(by="monetary_value", ascending=False)


def detect_outliers_iqr(df: pd.DataFrame, columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """Identifies statistical outliers using the Interquartile Range (IQR) method (1.5 * IQR)."""
    target_cols = columns or ["sales", "profit", "quantity"]
    outliers_summary = {}

    for col in target_cols:
        if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
            s = df[col].dropna()
            q25 = s.quantile(0.25)
            q75 = s.quantile(0.75)
            iqr = q75 - q25
            lower_bound = q25 - (1.5 * iqr)
            upper_bound = q75 + (1.5 * iqr)

            outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            count = int(outlier_mask.sum())
            pct = round((count / len(df)) * 100, 2)

            outliers_summary[col] = {
                "q25": round(float(q25), 2),
                "q75": round(float(q75), 2),
                "iqr": round(float(iqr), 2),
                "lower_bound": round(float(lower_bound), 2),
                "upper_bound": round(float(upper_bound), 2),
                "outlier_count": count,
                "outlier_pct": pct,
                "max_value": round(float(s.max()), 2) if len(s) > 0 else None,
                "min_value": round(float(s.min()), 2) if len(s) > 0 else None,
            }

    return outliers_summary
