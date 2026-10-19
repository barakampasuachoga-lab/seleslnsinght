"""Automated Tests for Module D: Business Analysis and Outlier Detection."""

import pandas as pd
import pytest

from salesinsight.analysis import (
    analyze_category_performance,
    analyze_customer_segments,
    analyze_discount_impact,
    analyze_product_performance,
    analyze_regional_performance,
    detect_outliers_iqr,
)


@pytest.fixture
def sample_sales_data():
    """Provides a synthetic multi-dimensional sales DataFrame."""
    return pd.DataFrame({
        "order_id": ["O-1", "O-2", "O-3", "O-4", "O-5"],
        "category": ["Technology", "Furniture", "Technology", "Furniture", "Office Supplies"],
        "subcategory": ["Phones", "Chairs", "Accessories", "Tables", "Paper"],
        "product_name": ["iPhone Case", "Ergo Chair", "Wireless Mouse", "Executive Desk", "Copy Paper"],
        "region": ["West", "East", "West", "Central", "East"],
        "customer_segment": ["Consumer", "Corporate", "Consumer", "Home Office", "Corporate"],
        "sales": [100.0, 500.0, 50.0, 1000.0, 20.0],
        "profit": [20.0, 50.0, 15.0, -200.0, 5.0],
        "quantity": [2, 1, 1, 2, 4],
        "discount": [0.0, 0.1, 0.0, 0.4, 0.0],
        "discount_band": ["0% (No Discount)", "1% - 10%", "0% (No Discount)", "21% - 40%", "0% (No Discount)"],
    })


def test_category_performance(sample_sales_data):
    """Verify category grouping and sales share percentage."""
    res = analyze_category_performance(sample_sales_data)
    assert len(res) == 3
    # Furniture sales = 500 + 1000 = 1500
    furniture_row = res[res["category"] == "Furniture"].iloc[0]
    assert furniture_row["sales"] == 1500.0
    assert furniture_row["profit"] == -150.0  # 50 - 200
    assert furniture_row["profit_margin_pct"] == -10.0


def test_product_loss_detection(sample_sales_data):
    """Verify identification of products generating negative profits."""
    p_dict = analyze_product_performance(sample_sales_data)
    assert "worst_loss" in p_dict
    worst = p_dict["worst_loss"].iloc[0]
    assert worst["product_name"] == "Executive Desk"
    assert worst["profit"] == -200.0


def test_regional_aggregation(sample_sales_data):
    """Verify geographic aggregation totals."""
    reg = analyze_regional_performance(sample_sales_data)
    assert len(reg) == 3
    west_row = reg[reg["region"] == "West"].iloc[0]
    assert west_row["sales"] == 150.0  # 100 + 50
    assert west_row["distinct_orders"] == 2


def test_outlier_iqr_detection():
    """Verify Tukey's IQR detects extreme transaction values."""
    # Series of normal sales plus one extreme outlier
    normal_sales = [50, 55, 60, 62, 58, 65, 70, 52, 59, 61, 56, 64]
    outlier_value = 5000  # Obvious outlier
    df = pd.DataFrame({"sales": normal_sales + [outlier_value]})

    outliers = detect_outliers_iqr(df, columns=["sales"])
    assert "sales" in outliers
    assert outliers["sales"]["outlier_count"] >= 1
    assert outliers["sales"]["max_value"] == 5000.0
