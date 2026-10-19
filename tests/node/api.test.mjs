import test from 'node:test';
import assert from 'node:assert';
import { AuthService } from '../../backend/node-api/dist/services/authService.js';
import { DatasetService } from '../../backend/node-api/dist/services/datasetService.js';

test('Node API: AuthService - User registration and duplicate prevention', async () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const user = await AuthService.register('Test Analyst', uniqueEmail, 'Password123!');
  assert.strictEqual(user.email, uniqueEmail);
  assert.strictEqual(user.name, 'Test Analyst');
  assert.strictEqual(user.role, 'user');

  // Duplicate registration should throw
  await assert.rejects(
    async () => AuthService.register('Test Duplicate', uniqueEmail, 'Password123!'),
    /already exists/
  );
});

test('Node API: AuthService - Login validation', async () => {
  const user = await AuthService.login('analyst@retailcorp.com', 'Password123!');
  assert.strictEqual(user.email, 'analyst@retailcorp.com');
  assert.strictEqual(user.role, 'user');

  // Invalid password
  await assert.rejects(
    async () => AuthService.login('analyst@retailcorp.com', 'WrongPassword!'),
    /Invalid email or password/
  );
});

test('Node API: DatasetService - List and ownership checks', async () => {
  // Analyst can see their dataset
  const analystDatasets = await DatasetService.listDatasets('usr_analyst_01', 'user');
  assert.strictEqual(analystDatasets.length, 1);
  assert.strictEqual(analystDatasets[0].id, 'ds_superstore_2026');

  // Other user cannot see analyst dataset
  const otherDatasets = await DatasetService.listDatasets('usr_other_99', 'user');
  assert.strictEqual(otherDatasets.length, 0);

  // Admin can see all datasets
  const adminDatasets = await DatasetService.listDatasets('usr_admin_01', 'admin');
  assert.strictEqual(adminDatasets.length >= 1, true);
});

test('Node API: DatasetService - Data quality report retrieval', async () => {
  const report = await DatasetService.getQualityReport('ds_superstore_2026');
  assert.strictEqual(report.total_rows, 9994);
  assert.strictEqual(report.total_columns, 21);
});
