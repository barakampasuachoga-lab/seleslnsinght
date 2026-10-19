"""Automated Tests for Metric Formulations and Business Rules."""

import pandas as pd
import pytest

from salesinsight.metrics import (
    calculate_average_order_value,
    calculate_distinct_orders,
    calculate_executive_kpis,
    calculate_profit_margin,
    calculate_sales_growth,
    calculate_total_profit,
    calculate_total_quantity,
    calculate_total_sales,
)


def test_sales_and_distinct_orders_granularity():
    """Verify distinct orders measures unique carts, NOT transaction row count."""
    df = pd.DataFrame({
        "order_id": ["ORD-1", "ORD-1", "ORD-2", "ORD-3", "ORD-3"],
        "sales": [100.0, 50.0, 200.0, 80.0, 20.0],
        "quantity": [2, 1, 4, 1, 1],
        "profit": [20.0, 10.0, 50.0, -10.0, 5.0],
    })

    # Row count is 5, but distinct orders is 3
    assert len(df) == 5
    assert calculate_distinct_orders(df) == 3
    assert calculate_total_sales(df) == 450.0
    assert calculate_total_quantity(df) == 9
    assert calculate_total_profit(df) == 75.0

    # AOV = 450 / 3 = 150.0
    assert calculate_average_order_value(df) == 150.0

    # Margin = (75 / 450) * 100 = 16.6667%
    assert round(calculate_profit_margin(df), 2) == 16.67


def test_zero_sales_margin_protection():
    """Verify profit margin handles zero sales gracefully without ZeroDivisionError."""
    df_zero = pd.DataFrame({
        "order_id": ["ORD-1"],
        "sales": [0.0],
        "profit": [0.0],
    })
    assert calculate_profit_margin(df_zero) is None


def test_sales_growth_edge_cases():
    """Verify period sales growth formula handles positive, negative, and zero denominators."""
    # Standard positive growth: 150 from 100 = +50%
    assert calculate_sales_growth(150.0, 100.0) == 50.0

    # Negative contraction: 80 from 100 = -20%
    assert calculate_sales_growth(80.0, 100.0) == -20.0

    # Zero previous period denominator protection
    assert calculate_sales_growth(100.0, 0.0) is None
    assert calculate_sales_growth(100.0, -10.0) is None


def test_executive_kpis_dictionary():
    """Verify calculate_executive_kpis output keys and numerical accuracy."""
    df = pd.DataFrame({
        "order_id": ["ORD-1", "ORD-2"],
        "customer_id": ["CUST-1", "CUST-2"],
        "sales": [200.0, 300.0],
        "profit": [40.0, 60.0],
        "quantity": [2, 3],
        "discount": [0.1, 0.2],
    })

    kpis = calculate_executive_kpis(df)
    assert kpis["total_sales"] == 500.0
    assert kpis["total_profit"] == 100.0
    assert kpis["profit_margin_pct"] == 20.0
    assert kpis["total_orders"] == 2
    assert kpis["average_order_value"] == 250.0
    assert kpis["total_customers"] == 2
    assert kpis["average_discount_pct"] == 15.0
