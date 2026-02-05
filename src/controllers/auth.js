import { onlineDBClient } from '../db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { syncUserToOfflineDB } from '../utils/sync.js';

export async function register(req, res) {
  try {
    const { email, password, account_type, name } = req.body;

    // Validate inputs
    if (!email || !password || !account_type) {
      return res.status(400).json({ error: 'Email, password, and account_type are required' });
    }

    if (!['USER', 'CREATOR'].includes(account_type)) {
      return res.status(400).json({ error: 'Invalid account_type. Must be USER or CREATOR' });
    }

    // Check if user already exists
    const existingUser = await onlineDBClient.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await onlineDBClient.query(
      `INSERT INTO users (email, password_hash, account_type, name, subscription_expires_at, created_at) 
       VALUES ($1, $2, $3, $4, NULL, NOW()) 
       RETURNING id, email, account_type, name, subscription_expires_at, created_at`,
      [email.toLowerCase(), passwordHash, account_type, name || null]
    );

    const user = result.rows[0];

    // Sync to offline DB asynchronously (non-blocking)
    syncUserToOfflineDB(user).catch(err => {
      console.error('Failed to sync user to offline DB:', err.message);
    });

    // Generate JWT token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      accountType: user.account_type 
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        name: user.name,
        subscriptionExpiresAt: user.subscription_expires_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await onlineDBClient.query(
      'SELECT id, email, password_hash, account_type, name, subscription_expires_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      accountType: user.account_type 
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        name: user.name,
        subscriptionExpiresAt: user.subscription_expires_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function checkAccess(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await onlineDBClient.query(
      'SELECT id, email, account_type, subscription_expires_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        hasAccess: false, 
        error: 'User not found' 
      });
    }

    const user = result.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const hasAccess = expiresAt && expiresAt > now;

    res.json({
      hasAccess,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        subscriptionExpiresAt: user.subscription_expires_at
      },
      message: hasAccess 
        ? 'Access granted' 
        : 'Subscription expired or not activated'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
