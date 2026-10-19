"""Configuration module for SalesInsight.

Manages filesystem paths, schema column mappings, environment variables,
and database connection configurations.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Base project paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
SAMPLES_DATA_DIR = DATA_DIR / "samples"

REPORTS_DIR = BASE_DIR / "reports"
DATA_QUALITY_REPORTS_DIR = REPORTS_DIR / "data_quality"
ANALYSIS_REPORTS_DIR = REPORTS_DIR / "analysis"
FIGURES_DIR = REPORTS_DIR / "figures"

SQL_DIR = BASE_DIR / "sql"
DOCS_DIR = BASE_DIR / "docs"

# Ensure runtime directories exist
for p in [
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    SAMPLES_DATA_DIR,
    DATA_QUALITY_REPORTS_DIR,
    ANALYSIS_REPORTS_DIR,
    FIGURES_DIR,
    SQL_DIR,
    DOCS_DIR,
]:
    p.mkdir(parents=True, exist_ok=True)

# Load environment variables
load_dotenv(BASE_DIR / ".env")

# Default Canonical Column Names
COLUMN_MAP_SUPERSTORE: Dict[str, str] = {
    "Row ID": "row_id",
    "Order ID": "order_id",
    "Order Date": "order_date",
    "Ship Date": "ship_date",
    "Ship Mode": "ship_mode",
    "Customer ID": "customer_id",
    "Customer Name": "customer_name",
    "Segment": "customer_segment",
    "Country": "country",
    "City": "city",
    "State": "state",
    "Postal Code": "postal_code",
    "Region": "region",
    "Product ID": "product_id",
    "Category": "category",
    "Sub-Category": "subcategory",
    "Product Name": "product_name",
    "Sales": "sales",
    "Quantity": "quantity",
    "Discount": "discount",
    "Profit": "profit",
}

# Required columns for core calculations
CORE_COLUMNS: List[str] = [
    "order_id",
    "order_date",
    "sales",
]

# Recommended columns for multidimensional BI
RECOMMENDED_COLUMNS: List[str] = [
    "order_id",
    "order_date",
    "ship_date",
    "customer_id",
    "customer_segment",
    "product_id",
    "product_name",
    "category",
    "subcategory",
    "sales",
    "quantity",
    "discount",
    "profit",
    "region",
    "state",
    "city",
]

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "salesinsight_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    if DB_PASSWORD
    else f"sqlite:///{BASE_DIR}/salesinsight.db",
)
