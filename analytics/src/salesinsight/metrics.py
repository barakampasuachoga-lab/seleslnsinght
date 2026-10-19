"""Module: Core Metric Calculations.

Implements rigorous, mathematically verified business metric formulas
with zero-division guards and distinct order granularity validation.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def calculate_total_sales(df: pd.DataFrame, sales_col: str = "sales") -> float:
    """Calculates Total Sales Revenue."""
    if sales_col not in df.columns:
        raise ValueError(f"Sales column '{sales_col}' not found in dataset.")
    return float(df[sales_col].dropna().sum())


def calculate_total_profit(df: pd.DataFrame, profit_col: str = "profit") -> Optional[float]:
    """Calculates Total Profit or Loss across transactions."""
    if profit_col not in df.columns:
        return None
    return float(df[profit_col].dropna().sum())


def calculate_distinct_orders(df: pd.DataFrame, order_id_col: str = "order_id") -> int:
    """Calculates Total Orders based on distinct Order IDs."""
    if order_id_col not in df.columns:
        raise ValueError(f"Order ID column '{order_id_col}' not found in dataset.")
    return int(df[order_id_col].dropna().nunique())


def calculate_total_quantity(df: pd.DataFrame, qty_col: str = "quantity") -> Optional[int]:
    """Calculates Total Units Sold."""
    if qty_col not in df.columns:
        return None
    return int(df[qty_col].dropna().sum())


def calculate_average_order_value(
    df: pd.DataFrame,
    sales_col: str = "sales",
    order_id_col: str = "order_id",
) -> Optional[float]:
    """Calculates Average Order Value (AOV = Total Sales / Distinct Orders)."""
    orders = calculate_distinct_orders(df, order_id_col)
    if orders == 0:
        return 0.0
    sales = calculate_total_sales(df, sales_col)
    return float(sales / orders)


def calculate_profit_margin(
    df: pd.DataFrame,
    sales_col: str = "sales",
    profit_col: str = "profit",
) -> Optional[float]:
    """Calculates overall Profit Margin % = (Total Profit / Total Sales) * 100.

    Returns None if sales == 0 or profit column is absent.
    """
    if profit_col not in df.columns:
        return None
    sales = calculate_total_sales(df, sales_col)
    if sales == 0:
        return None
    profit = calculate_total_profit(df, profit_col)
    if profit is None:
        return None
    return float((profit / sales) * 100)


def calculate_sales_growth(
    current_period_sales: float,
    previous_period_sales: float,
) -> Optional[float]:
    """Calculates Period-over-Period Sales Growth %.

    Formula: ((Current - Previous) / Previous) * 100
    Returns None if previous period sales is zero or undefined.
    """
    if previous_period_sales <= 0:
        return None
    return float(((current_period_sales - previous_period_sales) / previous_period_sales) * 100)


def calculate_executive_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculates all headline business KPIs in one consolidated, verified dictionary."""
    total_sales = calculate_total_sales(df)
    total_profit = calculate_total_profit(df)
    total_orders = calculate_distinct_orders(df)
    total_units = calculate_total_quantity(df)
    aov = calculate_average_order_value(df)
    profit_margin = calculate_profit_margin(df)
    total_customers = int(df["customer_id"].nunique()) if "customer_id" in df.columns else None

    # Calculate average discount
    avg_discount = float(df["discount"].mean() * 100) if "discount" in df.columns else None

    return {
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2) if total_profit is not None else None,
        "total_orders": total_orders,
        "total_units_sold": total_units,
        "average_order_value": round(aov, 2) if aov is not None else None,
        "profit_margin_pct": round(profit_margin, 2) if profit_margin is not None else None,
        "total_customers": total_customers,
        "average_discount_pct": round(avg_discount, 2) if avg_discount is not None else None,
    }
