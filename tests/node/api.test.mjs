import test from 'node:test';
import assert from 'node:assert';
import { AuthService } from '../../backend/node-api/dist/services/authService.js';
import { DatasetService } from '../../backend/node-api/dist/services/datasetService.js';
import { AdminService } from '../../backend/node-api/dist/services/adminService.js';

test('Node API: AuthService - User registration and validation rules', async () => {
  const uniqueEmail = `user_${Date.now()}@testcorp.com`;
  
  // Missing terms acceptance should fail
  await assert.rejects(
    async () => AuthService.register({
      name: 'Jane Doe',
      email: uniqueEmail,
      password: 'SecurePass123!',
      acceptTerms: false,
    }),
    /accept the Terms of Service/
  );

  // Weak password should fail
  await assert.rejects(
    async () => AuthService.register({
      name: 'Jane Doe',
      email: uniqueEmail,
      password: 'weak',
      acceptTerms: true,
    }),
    /at least 8 characters/
  );

  // Valid registration
  const { user, verificationCode } = await AuthService.register({
    name: 'Jane Doe',
    email: uniqueEmail,
    company: 'Doe Enterprises',
    password: 'SecurePass123!',
    acceptTerms: true,
  });

  assert.strictEqual(user.email, uniqueEmail);
  assert.strictEqual(user.company, 'Doe Enterprises');
  assert.strictEqual(user.role, 'user');
  assert.strictEqual(user.emailVerified, false);
  assert.ok(verificationCode);

  // Duplicate registration should fail
  await assert.rejects(
    async () => AuthService.register({
      name: 'Jane Duplicate',
      email: uniqueEmail,
      password: 'SecurePass123!',
      acceptTerms: true,
    }),
    /already exists/
  );
});

test('Node API: AuthService - Login with valid and invalid credentials', async () => {
  const { user, token } = await AuthService.login('analyst@retailcorp.com', 'Password123!', true);
  assert.strictEqual(user.email, 'analyst@retailcorp.com');
  assert.strictEqual(user.role, 'user');
  assert.ok(token);

  // Invalid password
  await assert.rejects(
    async () => AuthService.login('analyst@retailcorp.com', 'IncorrectPassword!'),
    /Invalid email or password/
  );

  // Nonexistent email
  await assert.rejects(
    async () => AuthService.login('nonexistent@example.com', 'Password123!'),
    /Invalid email or password/
  );
});

test('Node API: AuthService - Password recovery token lifecycle', async () => {
  // Request reset
  const res = await AuthService.forgotPassword('analyst@retailcorp.com');
  assert.strictEqual(res.success, true);
  assert.ok(res.resetTokenPreview);

  // Reset password using token
  const resetSuccess = await AuthService.resetPassword(res.resetTokenPreview, 'NewPassWord999!');
  assert.strictEqual(resetSuccess, true);

  // Token is single-use: second attempt should fail
  await assert.rejects(
    async () => AuthService.resetPassword(res.resetTokenPreview, 'AnotherPass123!'),
    /invalid or has expired/
  );

  // Login with new password should now succeed
  const loginRes = await AuthService.login('analyst@retailcorp.com', 'NewPassWord999!');
  assert.strictEqual(loginRes.user.email, 'analyst@retailcorp.com');

  // Reset back to Password123! for test idempotency
  await AuthService.changePassword(loginRes.user.id, 'NewPassWord999!', 'Password123!');
});

test('Node API: AuthService - Administrator user status control and self-lockout guard', async () => {
  const adminId = 'usr_admin_01';
  const targetId = 'usr_manager_01';

  // Suspend target user
  const suspended = await AuthService.updateUserStatus(targetId, 'suspended', adminId);
  assert.strictEqual(suspended.accountStatus, 'suspended');

  // Suspended user cannot log in
  await assert.rejects(
    async () => AuthService.login('manager@storebrand.com', 'Password123!'),
    /suspended by an administrator/
  );

  // Reactivate user
  const reactivated = await AuthService.updateUserStatus(targetId, 'active', adminId);
  assert.strictEqual(reactivated.accountStatus, 'active');

  // Admin cannot suspend their own active account
  await assert.rejects(
    async () => AuthService.updateUserStatus(adminId, 'suspended', adminId),
    /cannot suspend their own active account/
  );
});

test('Node API: DatasetService - Data isolation by owner', async () => {
  const analystDatasets = await DatasetService.listDatasets('usr_analyst_01', 'user');
  assert.strictEqual(analystDatasets.length, 1);
  assert.strictEqual(analystDatasets[0].id, 'ds_superstore_2026');

  // Other user gets isolated view with 0 datasets
  const otherDatasets = await DatasetService.listDatasets('usr_new_isolated', 'user');
  assert.strictEqual(otherDatasets.length, 0);

  // Access check: unauthorized user cannot fetch other user's dataset
  await assert.rejects(
    async () => DatasetService.getDatasetById('ds_superstore_2026', 'usr_new_isolated', 'user'),
    /Access denied/
  );
});

test('Node API: Administrator Authentication with seeded credentials', async () => {
  const { user, token } = await AuthService.login('admin@gmail.com', 'Admin#001', true);
  assert.strictEqual(user.email, 'admin@gmail.com');
  assert.strictEqual(user.role, 'admin');
  assert.strictEqual(user.accountStatus, 'active');
  assert.ok(token);
});

test('Node API: AdminService - Protected metrics and privilege verification', async () => {
  // Admin role succeeds
  const summary = await AdminService.getSummary('admin');
  assert.ok(summary.totalUsers >= 3);
  assert.ok(summary.totalDatasets >= 1);
  assert.ok(summary.totalStorageFormatted);

  // Non-admin role is rejected
  await assert.rejects(
    async () => AdminService.getSummary('user'),
    /Administrator privileges required/
  );

  // Self-demotion guard
  await assert.rejects(
    async () => AdminService.updateUserRole('usr_admin_001', 'user', 'usr_admin_001', 'admin'),
    /cannot demote their own active administrative account/
  );

  // Health probe returns real system stats
  const health = await AdminService.getSystemHealth('admin');
  assert.strictEqual(health.apiStatus, 'healthy');
  assert.ok(health.memoryUsageMb > 0);
});

