-- Offline Database Schema
-- This database syncs with the online database and is used by the LAN application
-- It has a simpler structure focused on access control

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_expires_at);
