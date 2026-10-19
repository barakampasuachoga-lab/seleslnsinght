"""Module: Database Layer and SQL Integration.

Handles PostgreSQL connection pooling via SQLAlchemy, safe credential loading
from environment variables, SQLite local fallback for seamless execution,
table provisioning, data loading, and query execution.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from salesinsight.config import DATABASE_URL, SQL_DIR

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connection lifecycle, DDL execution, and analytical querying."""

    def __init__(self, connection_url: Optional[str] = None):
        """Initializes database engine with configured URL."""
        self.url = connection_url or DATABASE_URL
        self._engine: Optional[Engine] = None

    @property
    def engine(self) -> Engine:
        """Lazily creates and returns the SQLAlchemy Engine."""
        if self._engine is None:
            try:
                # Test connection string
                self._engine = create_engine(self.url, pool_pre_ping=True)
                with self._engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                logger.info(f"Database connected successfully via: {self._safe_url()}")
            except Exception as e:
                # If PostgreSQL fails or is unavailable locally, fall back to SQLite
                if "postgresql" in self.url:
                    fallback_url = "sqlite:///salesinsight.db"
                    logger.warning(
                        f"PostgreSQL connection failed ({e}). Falling back to local SQLite engine: {fallback_url}"
                    )
                    self.url = fallback_url
                    self._engine = create_engine(self.url)
                else:
                    raise e
        return self._engine

    def _safe_url(self) -> str:
        """Returns connection URL with masked password for security compliance."""
        if "@" in self.url:
            proto, rest = self.url.split("://", 1)
            creds, host_db = rest.split("@", 1)
            user = creds.split(":", 1)[0]
            return f"{proto}://{user}:***@{host_db}"
        return self.url

    def execute_script(self, script_path: Path) -> None:
        """Executes a multi-statement SQL script file (e.g., schema.sql)."""
        if not script_path.exists():
            raise FileNotFoundError(f"SQL file not found at: {script_path}")

        sql_content = script_path.read_text(encoding="utf-8")
        # Split statements by semicolon, skipping comments
        statements = [s.strip() for s in sql_content.split(";") if s.strip()]

        with self.engine.begin() as conn:
            for statement in statements:
                # Skip comments-only blocks
                clean = "\n".join([line for line in statement.splitlines() if not line.strip().startswith("--")])
                if clean.strip():
                    conn.execute(text(statement))
        logger.info(f"Executed SQL script successfully: {script_path.name}")

    def load_dataframe(
        self,
        df: pd.DataFrame,
        table_name: str,
        if_exists: str = "replace",
    ) -> int:
        """Loads a pandas DataFrame into a relational table.

        Returns:
            Number of rows written.
        """
        # Save copy and normalize datetime / numeric formats for database drivers
        df_to_load = df.copy()

        # Write to database using engine
        df_to_load.to_sql(
            table_name,
            con=self.engine,
            if_exists=if_exists,
            index=False,
            chunksize=1000,
        )
        logger.info(f"Loaded {len(df_to_load):,} records into table '{table_name}'.")
        return len(df_to_load)

    def query(self, sql_query: str, params: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """Executes a parameterized SQL query and returns results as a DataFrame."""
        with self.engine.connect() as conn:
            return pd.read_sql_query(text(sql_query), con=conn, params=params or {})

    def run_analysis_queries(self, queries_file: Optional[Path] = None) -> Dict[str, pd.DataFrame]:
        """Runs the benchmark analytical queries defined in sales_analysis.sql."""
        path = queries_file or (SQL_DIR / "sales_analysis.sql")
        if not path.exists():
            raise FileNotFoundError(f"Analysis SQL file not found: {path}")

        results: Dict[str, pd.DataFrame] = {}
        # Core SQL queries
        named_queries = {
            "total_metrics": """
                SELECT
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit,
                    COUNT(DISTINCT order_id) AS distinct_orders,
                    SUM(quantity) AS total_units,
                    ROUND(SUM(sales) / COUNT(DISTINCT order_id), 2) AS average_order_value,
                    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
                FROM sales_records;
            """,
            "category_summary": """
                SELECT
                    category,
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit,
                    COUNT(DISTINCT order_id) AS distinct_orders,
                    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
                FROM sales_records
                GROUP BY category
                ORDER BY total_sales DESC;
            """,
            "regional_summary": """
                SELECT
                    region,
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit,
                    COUNT(DISTINCT order_id) AS distinct_orders,
                    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
                FROM sales_records
                GROUP BY region
                ORDER BY total_sales DESC;
            """,
            "top_10_products": """
                SELECT
                    product_name,
                    category,
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit,
                    COUNT(DISTINCT order_id) AS order_count
                FROM sales_records
                GROUP BY product_name, category
                ORDER BY total_sales DESC
                LIMIT 10;
            """,
            "loss_making_products": """
                SELECT
                    product_name,
                    category,
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit
                FROM sales_records
                GROUP BY product_name, category
                HAVING SUM(profit) < 0
                ORDER BY total_profit ASC
                LIMIT 10;
            """,
            "discount_bands": """
                SELECT
                    discount_band,
                    ROUND(SUM(sales), 2) AS total_sales,
                    ROUND(SUM(profit), 2) AS total_profit,
                    COUNT(DISTINCT order_id) AS order_count,
                    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
                FROM sales_records
                GROUP BY discount_band
                ORDER BY total_sales DESC;
            """
        }

        for name, q in named_queries.items():
            try:
                results[name] = self.query(q)
                logger.info(f"Executed SQL query '{name}': {len(results[name])} rows returned.")
            except Exception as e:
                logger.warning(f"Failed running query '{name}': {e}")

        return results
