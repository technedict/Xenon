import { onlineDBClient } from '../db.js';

export async function getDashboard(req, res) {
  try {
    const userId = req.user.userId;

    const result = await onlineDBClient.query(
      `SELECT id, email, account_type, name, subscription_expires_at, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    
    let timeRemaining = null;
    let daysRemaining = null;
    let hasActiveSubscription = false;

    if (expiresAt) {
      const diffMs = expiresAt - now;
      hasActiveSubscription = diffMs > 0;
      
      if (hasActiveSubscription) {
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = {
          days: Math.floor(hours / 24),
          hours: hours % 24,
          minutes,
          totalDays: daysRemaining
        };
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        name: user.name,
        subscriptionExpiresAt: user.subscription_expires_at,
        createdAt: user.created_at
      },
      subscription: {
        hasActiveSubscription,
        expiresAt: user.subscription_expires_at,
        timeRemaining,
        daysRemaining,
        status: hasActiveSubscription ? 'active' : (expiresAt ? 'expired' : 'never_subscribed')
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
