"""Module A: Data Ingestion.

Provides robust, safe data loading capabilities for CSV and Excel files,
validating file existence, formats, and returning rich ingestion metadata.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Tuple, Union
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


class IngestionError(Exception):
    """Raised when ingestion fails due to invalid file path, format, or parsing errors."""
    pass


def load_dataset(file_path: Union[str, Path]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Loads a dataset from CSV or Excel format into a Pandas DataFrame.

    Args:
        file_path: Path to the target CSV or Excel file.

    Returns:
        A tuple of (pd.DataFrame, metadata_dict) where metadata_dict contains:
            - file_path: Canonical resolved path
            - file_name: Name of file
            - file_format: Extension
            - file_size_bytes: Size in bytes
            - row_count: Number of rows loaded
            - column_count: Number of columns loaded
            - column_names: List of column names

    Raises:
        IngestionError: If file does not exist, format is unsupported, or file is empty.
    """
    path = Path(file_path).resolve()

    # 1. Validate file existence
    if not path.exists():
        raise IngestionError(f"File not found at specified path: '{file_path}'")

    if not path.is_file():
        raise IngestionError(f"Provided path is a directory, not a file: '{file_path}'")

    # 2. Check file format
    ext = path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise IngestionError(
            f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    # 3. Read dataset based on format
    try:
        if ext == ".csv":
            # Attempt UTF-8 with fallback to latin-1 for resilient legacy encoding handling
            try:
                df = pd.read_csv(path, encoding="utf-8")
            except UnicodeDecodeError:
                logger.warning("UTF-8 decoding failed; falling back to latin-1 encoding.")
                df = pd.read_csv(path, encoding="latin-1")
        elif ext in {".xlsx", ".xls"}:
            df = pd.read_excel(path, engine="openpyxl" if ext == ".xlsx" else None)
        else:
            raise IngestionError(f"Unsupported extension: {ext}")
    except Exception as e:
        raise IngestionError(f"Failed to read dataset from '{path.name}': {str(e)}") from e

    # 4. Check whether dataset is empty
    if df.empty:
        raise IngestionError(f"The file '{path.name}' was successfully loaded but contains 0 records.")

    metadata = {
        "file_path": str(path),
        "file_name": path.name,
        "file_format": ext,
        "file_size_bytes": path.stat().st_size,
        "row_count": len(df),
        "column_count": len(df.columns),
        "column_names": list(df.columns),
    }

    logger.info(
        f"Ingestion successful: '{path.name}' ({metadata['row_count']:,} rows, "
        f"{metadata['column_count']} cols, {metadata['file_size_bytes'] / 1024:.1f} KB)"
    )
    return df, metadata
