import { offlineDBClient } from '../db.js';

export async function syncUserToOfflineDB(user) {
  try {
    // Check if user exists in offline DB
    const existingUser = await offlineDBClient.query(
      'SELECT id FROM users WHERE id = $1',
      [user.id]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      await offlineDBClient.query(
        `UPDATE users 
         SET email = $2, account_type = $3, name = $4, subscription_expires_at = $5, updated_at = NOW()
         WHERE id = $1`,
        [user.id, user.email, user.account_type, user.name, user.subscription_expires_at]
      );
      console.log(`Synced user ${user.email} to offline DB (updated)`);
    } else {
      // Insert new user - adapt to offline DB schema
      await offlineDBClient.query(
        `INSERT INTO users (id, email, account_type, name, subscription_expires_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, user.account_type, user.name, user.subscription_expires_at, user.created_at || new Date()]
      );
      console.log(`Synced user ${user.email} to offline DB (created)`);
    }
  } catch (err) {
    console.error(`Failed to sync user to offline DB: ${err.message}`);
    throw err;
  }
}

export async function syncAllUsers() {
  try {
    const result = await onlineDBClient.query(
      'SELECT id, email, account_type, name, subscription_expires_at, created_at FROM users'
    );

    let successCount = 0;
    let failCount = 0;

    for (const user of result.rows) {
      try {
        await syncUserToOfflineDB(user);
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    console.log(`Bulk sync complete: ${successCount} success, ${failCount} failed`);
    return { successCount, failCount, total: result.rows.length };
  } catch (err) {
    console.error('Bulk sync failed:', err.message);
    throw err;
  }
}
