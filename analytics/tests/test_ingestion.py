"""Automated Tests for Module A: Ingestion."""

import tempfile
from pathlib import Path
import pandas as pd
import pytest

from salesinsight.ingestion import IngestionError, load_dataset


def test_load_valid_csv():
    """Verify loading a valid synthetic CSV dataset."""
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False) as f:
        f.write("order_id,sales,quantity\nORD-001,100.50,2\nORD-002,50.00,1\n")
        temp_path = Path(f.name)

    try:
        df, meta = load_dataset(temp_path)
        assert len(df) == 2
        assert meta["row_count"] == 2
        assert meta["column_count"] == 3
        assert "sales" in df.columns
    finally:
        temp_path.unlink()


def test_load_valid_excel():
    """Verify loading a valid synthetic Excel (.xlsx) file."""
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
        temp_path = Path(f.name)

    df_test = pd.DataFrame({
        "order_id": ["ORD-101", "ORD-102"],
        "sales": [250.0, 310.5],
        "quantity": [3, 4],
    })
    df_test.to_excel(temp_path, index=False)

    try:
        df, meta = load_dataset(temp_path)
        assert len(df) == 2
        assert meta["file_format"] == ".xlsx"
        assert meta["row_count"] == 2
    finally:
        temp_path.unlink()


def test_nonexistent_file_raises_error():
    """Verify appropriate error on missing file."""
    with pytest.raises(IngestionError, match="File not found"):
        load_dataset("data/raw/non_existent_file_12345.csv")


def test_unsupported_file_format():
    """Verify error on unsupported format."""
    with tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False) as f:
        f.write("hello world")
        temp_path = Path(f.name)

    try:
        with pytest.raises(IngestionError, match="Unsupported file format"):
            load_dataset(temp_path)
    finally:
        temp_path.unlink()


def test_empty_dataset_raises_error():
    """Verify error on empty dataset with only headers."""
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False) as f:
        f.write("order_id,sales\n")
        temp_path = Path(f.name)

    try:
        with pytest.raises(IngestionError, match="contains 0 records"):
            load_dataset(temp_path)
    finally:
        temp_path.unlink()
