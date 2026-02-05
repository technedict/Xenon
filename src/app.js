import express from "express";
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config();
import { onlineDBClient } from "./db.js";
import { register, login, checkAccess } from "./controllers/auth.js";
import { getDashboard } from "./controllers/user.js";
import { authenticateToken } from "./middleware/auth.js";
import { syncUserToOfflineDB } from "./utils/sync.js";

const app = express();
app.use(cors())
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Server is running!');
})

// Authentication routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/auth/check-access', checkAccess);

// Protected routes
app.get('/user/dashboard', authenticateToken, getDashboard);

// Payment verification - extends user subscription
app.post('/pay/verify', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!reference) {
      return res.status(400).json({ error: "Missing payment reference" });
    }

    // Verify payment with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    });

    if (!paystackRes.ok) {
      return res.status(502).json({ error: "Paystack service unavailable" });
    }

    const result = await paystackRes.json();

    if (result.data.status !== "success") {
      return res.status(400).json({ error: "Payment not verified" });
    }

    // Check if this reference was already processed (idempotency)
    const existingPayment = await onlineDBClient.query(
      'SELECT id FROM payments WHERE paystack_reference = $1',
      [reference]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(409).json({ error: "Payment already processed" });
    }

    // Get user's current subscription status
    const userResult = await onlineDBClient.query(
      'SELECT id, email, account_type, subscription_expires_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const now = new Date();
    const currentExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    
    // Calculate new expiry date (30 days from now or from current expiry if still active)
    let newExpiry;
    if (currentExpiry && currentExpiry > now) {
      // Extend from current expiry
      newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + 30);
    } else {
      // Start new 30-day subscription from now
      newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + 30);
    }

    // Update user's subscription
    const updateResult = await onlineDBClient.query(
      'UPDATE users SET subscription_expires_at = $1 WHERE id = $2 RETURNING id, email, account_type, name, subscription_expires_at',
      [newExpiry, userId]
    );

    const updatedUser = updateResult.rows[0];

    // Record payment
    await onlineDBClient.query(
      `INSERT INTO payments (user_id, paystack_reference, amount, currency, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, reference, result.data.amount, result.data.currency, 'success']
    );

    // Sync to offline DB asynchronously
    syncUserToOfflineDB(updatedUser).catch(err => {
      console.error('Failed to sync user to offline DB:', err.message);
    });

    res.json({ 
      message: "Subscription activated successfully",
      subscription: {
        expiresAt: newExpiry,
        daysAdded: 30
      }
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
})

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on PORT ${process.env.PORT}`)
})
