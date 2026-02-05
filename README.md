# Xenon Backend - Account-Based Subscription System

Complete overhaul from code-based to account-based subscription management.

## Architecture Overview

### Frontend Flow
1. User visits website and creates an account (email, password, account type)
2. After login, user sees dashboard with:
   - Subscription status (active/expired/never subscribed)
   - Time remaining (days, hours, minutes)
   - Purchase option for monthly subscription
3. User clicks "Buy Subscription" → Redirected to Paystack payment
4. After payment, subscription is automatically activated for 30 days

### LAN Application Flow
1. User tries to login to LAN app
2. LAN app sends request to `/auth/check-access` with user's email
3. Backend checks if subscription is active
4. If active → Grant access, If expired → Deny access

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
  - Body: `{ email, password, account_type, name? }`
  - Returns: JWT token + user details

- `POST /auth/login` - Login existing user
  - Body: `{ email, password }`
  - Returns: JWT token + user details

- `POST /auth/check-access` - Check if user has active subscription (for LAN app)
  - Body: `{ email }`
  - Returns: `{ hasAccess: boolean, user: {...}, message }`

### User Dashboard (Protected)
- `GET /user/dashboard` - Get user's subscription data
  - Headers: `Authorization: Bearer <token>`
  - Returns: User details + subscription status + time remaining

### Payment
- `POST /pay/verify` - Verify Paystack payment and activate/extend subscription
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ reference }`
  - Returns: Subscription details

## Database Schema

### Online Database (Primary)
- **users**: id, email, password_hash, account_type, name, subscription_expires_at, created_at, updated_at
- **payments**: id, user_id, paystack_reference, amount, currency, status, created_at

### Offline Database (LAN App)
- **users**: id, email, account_type, name, subscription_expires_at, created_at, updated_at
- Note: No password_hash or payments table (read-only for access control)

## Synchronization

User accounts sync from online → offline DB:
- **Automatic sync**: After registration and payment verification
- **Async non-blocking**: Offline DB failures won't affect user operations
- **Manual sync available**: Use sync utility functions if needed

## Environment Variables

Add to your `.env` file:
```
# Database URLs
ONLINE_DB_URL=postgresql://user:pass@host:port/online_db
OFFLINE_DB_URL=postgresql://user:pass@host:port/offline_db

# Paystack
PAYSTACK_SECRET=sk_test_xxxxx

# JWT Authentication
JWT_SECRET=your-secure-random-string-change-this

# Server
PORT=5000
```

## Setup Instructions

1. **Install dependencies** (already done):
   ```bash
   npm install bcrypt jsonwebtoken
   ```

2. **Create databases**:
   ```bash
   psql -U postgres -f schema_online.sql -d your_online_db
   psql -U postgres -f schema_offline.sql -d your_offline_db
   ```

3. **Update .env** with JWT_SECRET and database URLs

4. **Start server**:
   ```bash
   npm run dev
   ```

## Frontend Integration

### Registration
```javascript
const response = await fetch('http://localhost:5000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    account_type: 'USER', // or 'CREATOR'
    name: 'John Doe'
  })
});
const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### Dashboard Data
```javascript
const response = await fetch('http://localhost:5000/user/dashboard', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}` 
  }
});
const { user, subscription } = await response.json();
// subscription.hasActiveSubscription
// subscription.timeRemaining.days
// subscription.timeRemaining.hours
```

### Payment Flow
1. Initiate Paystack payment with user's email
2. After successful payment, get reference from Paystack
3. Send reference to backend:
```javascript
const response = await fetch('http://localhost:5000/pay/verify', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` 
  },
  body: JSON.stringify({ reference: paystackReference })
});
```

## LAN Application Integration

```javascript
// When user tries to login to LAN app
const response = await fetch('http://your-server:5000/auth/check-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail })
});
const { hasAccess, user } = await response.json();
if (hasAccess) {
  // Grant access to LAN application
} else {
  // Show "Subscription expired" message
}
```

## Key Benefits

✅ **No more codes** - Direct account-to-subscription linking  
✅ **Better UX** - Dashboard shows time remaining  
✅ **Automatic tracking** - Payment history in database  
✅ **Idempotent payments** - Prevents duplicate processing  
✅ **Resilient sync** - Offline DB failures don't block operations  
✅ **Proper authentication** - JWT-based security  
✅ **Subscription stacking** - Multiple payments extend subscription time
