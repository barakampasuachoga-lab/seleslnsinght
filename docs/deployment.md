# SalesInsight: Deployment & Local Operations Guide

This guide describes how to configure, run, test, and deploy the complete **SalesInsight** multi-service platform.

---

## 1. Prerequisites & Environment Verification

Verify installed runtimes:
```bash
node -v      # v20+ or v22+ required (Verified: v22.23.3)
npm -v       # v9+ or v10+ required  (Verified: 10.9.9)
python3 --version  # Python 3.10+ required (Verified: 3.11.2)
dotnet --version   # .NET 8.0 SDK required (Verified: 8.0.131)
sqlite3 --version  # SQLite 3+ or PostgreSQL 15+ (Verified: 3.40.1)
```

---

## 2. Directory Structure & Workspace Setup

```bash
git clone https://github.com/your-org/salesinsight.git
cd salesinsight

# Copy example environment configuration
cp .env.example .env
```

Review and adjust `.env` parameters if connecting to a remote PostgreSQL database:
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesinsight_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/salesinsight_db
```

---

## 3. Python Analytics Engine Setup

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies and local package
pip install -r requirements.txt
pip install -e .

# 3. Verify automated tests
pytest tests/ -v
```

---

## 4. Database Initialization & Schema Provisioning

```bash
# Initialize SQLite or PostgreSQL schema with dimensional star model
python scripts/load_database.py
```
This command runs `sql/schema.sql`, populates `sales_records`, creates star schema dimension tables (`dim_customer`, `dim_product`, `dim_geography`), provisions views (`sql/views.sql`), and executes verification checks.

---

## 5. C# ASP.NET Core Business Services API Setup

```bash
cd backend/dotnet-api
dotnet build
dotnet test  # If tests configured
dotnet run --urls="http://localhost:5000"
```

---

## 6. Node.js Application API & React Frontend Setup

```bash
# In project root:
npm install

# Start development server on port 3000
npm run dev
```

---

## 7. Complete End-to-End Analytical Workflow

Run the canonical pipeline sequence on any raw retail CSV or Excel dataset:

```bash
# 1. Quality inspection & anomaly reporting
python scripts/inspect_data.py --input data/raw/superstore.csv

# 2. Non-destructive cleaning & date parsing
python scripts/clean_data.py --input data/raw/superstore.csv

# 3. Exploratory analysis & figure rendering
python scripts/analyze_sales.py --input data/processed/sales_cleaned.csv

# 4. Database synchronization & SQL parity verification
python scripts/load_database.py

# 5. Executive briefing generation
python scripts/generate_report.py
```

---

## 8. Health Checks & Production Monitoring

- **Node.js Gateway:** `GET /health` or `GET /api/v1/admin/system-health`
- **C# Business API:** `GET /api/v1/business/health`
- **Database Connection:** Verified continuously via SQLAlchemy connection pool pre-ping
- **Audit Logs:** Persisted to structured server logs with unique correlation request IDs
