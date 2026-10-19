-- ============================================================================
-- Seed 001: Default App Users & Initial Dataset Metadata
-- ============================================================================

INSERT OR REPLACE INTO app_users (user_id, name, email, role)
VALUES 
    ('usr_admin_01', 'System Administrator', 'admin@salesinsight.io', 'admin'),
    ('usr_analyst_01', 'Senior Sales Analyst', 'analyst@retailcorp.com', 'user');

INSERT OR REPLACE INTO dataset_catalog (dataset_id, owner_id, filename, storage_path, row_count, column_count, status)
VALUES 
    ('ds_superstore_2026', 'usr_analyst_01', 'superstore.csv', 'data/raw/superstore.csv', 9994, 21, 'analyzed'),
    ('ds_sample_50', 'usr_analyst_01', 'sample_sales.xlsx', 'data/samples/sample_sales.xlsx', 50, 21, 'cleaned');
