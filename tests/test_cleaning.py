"""Automated Tests for Module C: Data Cleaning and Standardization."""

import pandas as pd
import pytest

from salesinsight.cleaning import CleaningPipeline


def test_column_name_standardization_and_whitespace():
    """Verify column names are lowercased and stripped of whitespace."""
    raw_df = pd.DataFrame({
        "  Order ID  ": ["ORD-1", "ORD-2"],
        "Customer Name": [" Alice Smith  ", "Bob Jones  "],
        "Sales": ["$1,200.50", "450.00"],
    })

    pipeline = CleaningPipeline()
    cleaned_df, summary = pipeline.clean(raw_df)

    assert "order_id" in cleaned_df.columns
    assert "customer_name" in cleaned_df.columns
    assert "sales" in cleaned_df.columns
    assert cleaned_df["customer_name"].iloc[0] == "Alice Smith"
    assert cleaned_df["customer_name"].iloc[1] == "Bob Jones"
    assert cleaned_df["sales"].iloc[0] == 1200.50


def test_date_conversion_and_derived_dimensions():
    """Verify date parsing and derived time attributes."""
    raw_df = pd.DataFrame({
        "Order ID": ["ORD-1", "ORD-2"],
        "Order Date": ["2023-01-15", "11/20/2023"],
        "Ship Date": ["2023-01-18", "11/25/2023"],
        "Sales": [100.0, 200.0],
    })

    pipeline = CleaningPipeline()
    cleaned_df, _ = pipeline.clean(raw_df)

    assert pd.api.types.is_datetime64_any_dtype(cleaned_df["order_date"])
    assert "order_year" in cleaned_df.columns
    assert cleaned_df["order_year"].iloc[0] == 2023
    assert cleaned_df["shipping_days"].iloc[0] == 3
    assert cleaned_df["shipping_days"].iloc[1] == 5


def test_negative_profit_preservation():
    """Verify that negative profits are preserved as legitimate business losses."""
    raw_df = pd.DataFrame({
        "Order ID": ["ORD-1", "ORD-2", "ORD-3"],
        "Sales": [100.0, 50.0, 75.0],
        "Profit": [-45.50, 15.00, -10.00],
    })

    pipeline = CleaningPipeline()
    cleaned_df, summary = pipeline.clean(raw_df)

    # All 3 records must be preserved
    assert len(cleaned_df) == 3
    assert summary["rows_removed"] == 0
    assert cleaned_df["profit"].iloc[0] == -45.50
    assert (cleaned_df["profit"] < 0).sum() == 2


def test_invalid_date_handling():
    """Verify invalid date strings coerce to NaT without crashing."""
    raw_df = pd.DataFrame({
        "Order ID": ["ORD-1", "ORD-2"],
        "Order Date": ["not-a-valid-date", "2023-05-10"],
        "Sales": [100.0, 200.0],
    })

    pipeline = CleaningPipeline()
    cleaned_df, summary = pipeline.clean(raw_df)

    assert pd.isna(cleaned_df["order_date"].iloc[0])
    assert cleaned_df["order_date"].iloc[1] == pd.Timestamp("2023-05-10")
