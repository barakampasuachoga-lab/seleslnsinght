"""Module: Visualizations.

Generates presentation-ready, high-resolution charts using Matplotlib and Seaborn.
Each chart directly answers a specific business question and includes meaningful titles,
units, annotations, and clean visual design.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional
import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import pandas as pd
import seaborn as sns

logger = logging.getLogger(__name__)

# Aesthetic styling
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["font.size"] = 10
plt.rcParams["axes.titlesize"] = 12
plt.rcParams["axes.labelsize"] = 10
plt.rcParams["xtick.labelsize"] = 9
plt.rcParams["ytick.labelsize"] = 9
plt.rcParams["legend.fontsize"] = 9
plt.rcParams["figure.titlesize"] = 14

PALETTE_PRIMARY = "#1e3a8a"  # Deep blue
PALETTE_ACCENT = "#059669"   # Emerald
PALETTE_DANGER = "#dc2626"   # Crimson
PALETTE_MUTED = "#64748b"    # Slate


def plot_monthly_trend(monthly_df: pd.DataFrame, output_path: Path) -> None:
    """Answers: How do sales and profit trends evolve month-over-month?

    Saves: sales_trend_monthly.png
    """
    if monthly_df.empty or "order_year_month" not in monthly_df.columns:
        return

    fig, ax1 = plt.subplots(figsize=(12, 5), dpi=300)

    # Plot monthly sales bars
    x = range(len(monthly_df))
    bars = ax1.bar(
        x,
        monthly_df["sales"],
        color="#3b82f6",
        alpha=0.75,
        label="Monthly Sales ($)",
        width=0.65,
    )
    ax1.set_ylabel("Sales Revenue ($ USD)", color="#1e40af", fontweight="bold")
    ax1.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f"${y*1e-3:.0f}K" if y >= 1000 else f"${y:.0f}"))

    # Plot profit line on secondary axis
    ax2 = ax1.twinx()
    ax2.plot(
        x,
        monthly_df["profit"],
        color="#059669",
        linewidth=2.5,
        marker="o",
        markersize=4,
        label="Net Profit ($)",
    )
    ax2.axhline(0, color="#94a3b8", linestyle="--", linewidth=1, alpha=0.8)
    ax2.set_ylabel("Net Profit ($ USD)", color="#047857", fontweight="bold")
    ax2.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f"${y*1e-3:.1f}K" if abs(y) >= 1000 else f"${y:.0f}"))
    ax2.grid(False)

    # Set x-ticks to display selective monthly labels cleanly
    step = max(1, len(monthly_df) // 12)
    ax1.set_xticks([i for i in x if i % step == 0])
    ax1.set_xticklabels(
        [monthly_df["order_year_month"].iloc[i] for i in x if i % step == 0],
        rotation=45,
        ha="right",
    )
    ax1.set_xlabel("Order Month (Year-Month)", fontweight="bold")

    plt.title(
        "Monthly Sales Revenue and Net Profit Performance",
        fontweight="bold",
        pad=15,
    )

    # Unified legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", frameon=True)

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved figure: {output_path}")


def plot_category_performance(cat_df: pd.DataFrame, output_path: Path) -> None:
    """Answers: Which product categories generate the most revenue and margin?

    Saves: category_performance.png
    """
    if cat_df.empty or "category" not in cat_df.columns:
        return

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

    # 1. Total Sales by Category
    sns.barplot(data=cat_df, x="sales", y="category", ax=ax1, palette="Blues_r")
    ax1.set_title("Sales Revenue by Category ($)", fontweight="bold")
    ax1.set_xlabel("Sales ($ USD)")
    ax1.set_ylabel("Category", fontweight="bold")
    ax1.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"${x*1e-3:.0f}K"))
    for p in ax1.patches:
        width = p.get_width()
        ax1.annotate(f"${width:,.0f}", (width, p.get_y() + p.get_height() / 2),
                     xytext=(5, 0), textcoords="offset points", va="center", fontsize=8)

    # 2. Profit Margin % by Category
    if "profit_margin_pct" in cat_df.columns:
        colors = ["#059669" if m >= 0 else "#dc2626" for m in cat_df["profit_margin_pct"]]
        sns.barplot(data=cat_df, x="profit_margin_pct", y="category", ax=ax2, palette=colors)
        ax2.set_title("Profit Margin (%) by Category", fontweight="bold")
        ax2.set_xlabel("Profit Margin %")
        ax2.set_ylabel("")
        ax2.set_yticklabels([])
        for p in ax2.patches:
            width = p.get_width()
            ax2.annotate(f"{width:.1f}%", (width, p.get_y() + p.get_height() / 2),
                         xytext=(5 if width >= 0 else -30, 0), textcoords="offset points", va="center", fontsize=8)

    plt.suptitle("Category Sales and Profitability Contribution", fontweight="bold", y=1.02)
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved figure: {output_path}")


def plot_regional_performance(reg_df: pd.DataFrame, output_path: Path) -> None:
    """Answers: How do geographic regions compare in revenue and profit margins?

    Saves: regional_breakdown.png
    """
    if reg_df.empty or "region" not in reg_df.columns:
        return

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    sns.barplot(data=reg_df, x="region", y="sales", ax=ax, palette="mako")
    ax.set_title("Total Sales Revenue by Geographic Region", fontweight="bold", pad=12)
    ax.set_xlabel("Region", fontweight="bold")
    ax.set_ylabel("Sales ($ USD)", fontweight="bold")
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f"${y*1e-3:.0f}K"))

    for p in ax.patches:
        height = p.get_height()
        ax.annotate(f"${height:,.0f}", (p.get_x() + p.get_width() / 2, height),
                    xytext=(0, 4), textcoords="offset points", ha="center", fontsize=8)

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved figure: {output_path}")


def plot_discount_impact(disc_df: pd.DataFrame, output_path: Path) -> None:
    """Answers: How does discount depth impact retail profitability?

    Saves: discount_profitability.png
    """
    if disc_df.empty or "discount_band" not in disc_df.columns:
        return

    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
    colors = ["#059669" if m >= 0 else "#dc2626" for m in disc_df["profit_margin_pct"]]
    bars = ax.bar(disc_df["discount_band"], disc_df["profit_margin_pct"], color=colors, width=0.55)

    ax.axhline(0, color="#475569", linestyle="-", linewidth=1.2)
    ax.set_title("Profit Margin (%) Across Discount Depth Tiers", fontweight="bold", pad=12)
    ax.set_xlabel("Discount Level Band", fontweight="bold")
    ax.set_ylabel("Profit Margin (%)", fontweight="bold")
    ax.yaxis.set_major_formatter(ticker.PercentFormatter())

    for bar in bars:
        h = bar.get_height()
        va = "bottom" if h >= 0 else "top"
        offset = 3 if h >= 0 else -10
        ax.annotate(f"{h:.1f}%", (bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, offset), textcoords="offset points", ha="center", fontsize=9, fontweight="bold")

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved figure: {output_path}")


def plot_top_loss_products(products_dict: Dict[str, pd.DataFrame], output_path: Path) -> None:
    """Answers: Which products generate the highest profit and deepest losses?

    Saves: top_products_profit_loss.png
    """
    if "top_profit" not in products_dict or "worst_loss" not in products_dict:
        return

    top_p = products_dict["top_profit"].head(5)
    worst_l = products_dict["worst_loss"].head(5)
    combined = pd.concat([top_p, worst_l]).sort_values(by="profit", ascending=True)

    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    colors = ["#dc2626" if p < 0 else "#059669" for p in combined["profit"]]

    # Shorten names for clean readability
    names = [n[:32] + "..." if len(n) > 35 else n for n in combined["product_name"]]
    y_pos = range(len(combined))

    ax.barh(y_pos, combined["profit"], color=colors, height=0.6)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(names, fontsize=8)
    ax.axvline(0, color="#64748b", linestyle="--", linewidth=1)
    ax.set_title("Product Profit Spectrum: Top 5 Profitable vs Top 5 Loss-Makers", fontweight="bold", pad=12)
    ax.set_xlabel("Net Profit / Loss ($ USD)", fontweight="bold")
    ax.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"${x*1e-3:.1f}K" if abs(x) >= 1000 else f"${x:.0f}"))

    for i, p in enumerate(combined["profit"]):
        align = "left" if p >= 0 else "right"
        offset = 5 if p >= 0 else -5
        ax.annotate(f"${p:,.0f}", (p, i),
                    xytext=(offset, 0), textcoords="offset points", va="center", ha=align, fontsize=8, fontweight="bold")

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved figure: {output_path}")
