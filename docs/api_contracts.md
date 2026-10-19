# SalesInsight: API Contracts & Shared Data Schema Specifications

## 1. Shared Analytical Result Contract (JSON Schema)

Every analysis execution generates a structured, versioned JSON payload that serves as the single source of truth across Node.js, C#, and React.

```json
{
  "schema_version": "1.0.0",
  "dataset_id": "ds_superstore_2026",
  "analysis_id": "an_9994_full",
  "generated_at": "2026-10-19T07:28:42Z",
  "currency": "USD",
  "headline_kpis": {
    "total_sales": 2297200.86,
    "total_profit": 286397.02,
    "profit_margin_pct": 12.47,
    "total_orders": 5009,
    "average_order_value": 458.61,
    "total_units_sold": 37873,
    "total_customers": 793,
    "average_discount_pct": 15.62
  },
  "category_performance": [
    {
      "category": "Technology",
      "sales": 836154.03,
      "profit": 145454.95,
      "profit_margin_pct": 17.40,
      "sales_share_pct": 36.4,
      "distinct_orders": 1544
    },
    {
      "category": "Furniture",
      "sales": 741999.80,
      "profit": 18451.27,
      "profit_margin_pct": 2.49,
      "sales_share_pct": 32.3,
      "distinct_orders": 1764
    },
    {
      "category": "Office Supplies",
      "sales": 719047.03,
      "profit": 122490.80,
      "profit_margin_pct": 17.04,
      "sales_share_pct": 31.3,
      "distinct_orders": 3742
    }
  ],
  "regional_performance": [
    { "region": "West", "sales": 725457.82, "profit": 108418.45, "profit_margin_pct": 14.94, "distinct_orders": 1611, "aov": 450.32 },
    { "region": "East", "sales": 678781.24, "profit": 91522.78, "profit_margin_pct": 13.48, "distinct_orders": 1401, "aov": 484.50 },
    { "region": "Central", "sales": 501239.89, "profit": 39706.36, "profit_margin_pct": 7.92, "distinct_orders": 1175, "aov": 426.59 },
    { "region": "South", "sales": 391721.90, "profit": 46749.43, "profit_margin_pct": 11.93, "distinct_orders": 822, "aov": 476.55 }
  ],
  "discount_sensitivity": [
    { "discount_band": "0% (No Discount)", "sales": 1087908.47, "profit": 320987.60, "profit_margin_pct": 29.51 },
    { "discount_band": "1% - 10%", "sales": 54369.35, "profit": 9029.18, "profit_margin_pct": 16.61 },
    { "discount_band": "11% - 20%", "sales": 792152.89, "profit": 91756.30, "profit_margin_pct": 11.58 },
    { "discount_band": "21% - 40%", "sales": 234137.90, "profit": -35817.47, "profit_margin_pct": -15.30 },
    { "discount_band": "Over 40%", "sales": 128632.25, "profit": -99558.59, "profit_margin_pct": -77.40 }
  ],
  "quality_warnings": [
    "Audited 1,871 negative profit transactions resulting from promotional discounts > 20%."
  ]
}
```

---

## 2. Node.js REST API Contracts (`/api/v1`)

### Authentication & Sessions
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `{ name, email, password }` | Register new user account with hashed password |
| `POST` | `/api/v1/auth/login` | `{ email, password }` | Authenticate and issue secure session cookie |
| `POST` | `/api/v1/auth/logout` | None | Terminate session and invalidate cookie |
| `GET` | `/api/v1/auth/me` | None | Retrieve authenticated profile and permissions |

### Dataset Management
| Method | Endpoint | Form Data / Params | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/datasets/upload` | Multipart form (`file`) | Validate file extension, size, MIME type, assign UUID |
| `GET` | `/api/v1/datasets` | None | List user-owned and authorized datasets |
| `GET` | `/api/v1/datasets/:id` | None | Fetch metadata (rows, cols, size, status) |
| `POST` | `/api/v1/datasets/:id/inspect` | None | Schedule Python inspection and quality assessment |
| `GET` | `/api/v1/datasets/:id/quality` | None | Retrieve data quality report (missingness, flags) |
| `POST` | `/api/v1/datasets/:id/clean` | None | Trigger non-destructive cleaning pipeline |
| `DELETE` | `/api/v1/datasets/:id` | None | Safe deletion with cascade to generated reports |

### Analysis & Reporting
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/datasets/:id/analyses` | Schedule Python statistical and EDA analysis job |
| `GET` | `/api/v1/analyses/:id/status` | Polling endpoint returning progress %, status, errors |
| `GET` | `/api/v1/analyses/:id/results` | Returns canonical shared analytical JSON payload |
| `POST` | `/api/v1/analyses/:id/reports` | Compile executive markdown and tabular reports |
| `GET` | `/api/v1/reports/:id/download` | Stream sanitized CSV, Markdown, or Excel report |

---

## 3. C# ASP.NET Core Business Services API Contracts (`/api/v1/business`)

| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/business/summary/{datasetId}` | None | Generates executive performance briefing DTO |
| `GET` | `/api/v1/business/performance/{datasetId}` | `?dimension=category` | Category / regional efficiency comparison |
| `POST` | `/api/v1/business/validate-payload` | Shared Result JSON | Structural validation of Python output |
| `GET` | `/api/v1/business/health` | None | Liveness and dependency readiness probe |

---

## 4. Standard Error Envelope

Every API response returning HTTP $\ge 400$ conforms to:
```json
{
  "success": false,
  "error": {
    "code": "DATASET_NOT_FOUND",
    "message": "Dataset with ID 'ds_123' does not exist or unauthorized.",
    "request_id": "req_88a912ef",
    "timestamp": "2026-10-19T07:33:00Z"
  }
}
```
Internal stack traces and raw SQL strings are never exposed in production error responses.
