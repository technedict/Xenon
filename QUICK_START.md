# ⚡ Xenon - Quick Start Guide

## 🎯 What You Have Now

A complete **subscription management platform** with:
- ✅ Modern frontend (5 pages, fully responsive)
- ✅ RESTful backend API (authentication + payments)
- ✅ Account-based subscriptions (no more codes!)
- ✅ Real-time dashboard with countdown timer
- ✅ Paystack payment integration
- ✅ Offline database sync for LAN app

---

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create/update `.env`:
```env
ONLINE_DB_URL=your_postgres_url
OFFLINE_DB_URL=your_offline_postgres_url
PAYSTACK_SECRET=sk_test_your_key
JWT_SECRET=your_random_secret_string
PORT=5000
```

### 3. Setup Databases
```bash
# Create online database
psql -U postgres -c "CREATE DATABASE xenon_online"
psql -U postgres -d xenon_online -f schema_online.sql

# Create offline database  
psql -U postgres -c "CREATE DATABASE xenon_offline"
psql -U postgres -d xenon_offline -f schema_offline.sql
```

### 4. Start Backend
```bash
npm run dev
```

### 5. Open Frontend
Open `frontend/index.html` in your browser or use Live Server.

---

## 🧪 Test the Complete Flow

### Step 1: Register Account
1. Click "Get Started" on landing page
2. Fill form: name, email, password, account type
3. Click "Create Account"
4. → Auto-redirected to dashboard

### Step 2: View Dashboard
- See "No active subscription" message
- User info displayed
- "Buy Subscription" button visible

### Step 3: Make Payment
1. Click "Buy Subscription"
2. Paystack popup opens
3. Use test card: `4084084084084081`
4. Any future expiry, any CVV
5. → Redirected to success page

### Step 4: Verify Success
- Success page shows "Payment Successful"
- Shows subscription details
- Click "Go to Dashboard"

### Step 5: Check Dashboard
- Status badge shows "Active"
- Time remaining countdown displayed
- Expiry date shown
- Can click "Extend Subscription" anytime

### Step 6: Test LAN Access
```bash
# Simulate LAN app checking access
curl -X POST http://localhost:5000/auth/check-access \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Response if active:
{
  "hasAccess": true,
  "user": {...},
  "message": "Access granted"
}
```

---

## 📱 Frontend Pages

| Page | URL | Purpose |
|------|-----|---------|
| Landing | `index.html` | Marketing, pricing |
| Register | `register.html` | Create account |
| Login | `login.html` | User login |
| Dashboard | `dashboard.html` | Subscription mgmt |
| Success | `success.html` | Payment confirmation |

---

## 🔌 API Endpoints

### Public Endpoints
```
POST /auth/register      Create new account
POST /auth/login         Get JWT token
POST /auth/check-access  Check subscription (for LAN)
GET  /health             Health check
```

### Protected Endpoints (require JWT)
```
GET  /user/dashboard     Get user data + subscription
POST /pay/verify         Verify payment + extend subscription
```

### Authentication
```bash
# Include in headers:
Authorization: Bearer <your_jwt_token>
```

---

## 🎨 Customization

### Change Colors
Edit `frontend/style.css`:
```css
:root {
  --primary-blue: #3b82f6;    /* Your brand blue */
  --primary-purple: #9333ea;  /* Your brand purple */
  --success-green: #22c55e;   /* Success color */
}
```

### Change API URL
Edit `frontend/config.js`:
```javascript
const API_URL = 'https://your-backend-url.com';
```

### Change Prices
Edit `frontend/index.html`:
```html
<!-- User plan -->
<p id="price">₦1,000<span class="period">/month</span></p>

<!-- Creator plan -->
<p id="price">₦3,000<span class="period">/month</span></p>
```

And update `frontend/dashboard.js`:
```javascript
const amount = user.accountType === 'CREATOR' ? 3000 : 1000;
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check environment variables
cat .env

# Check database connection
psql $ONLINE_DB_URL -c "SELECT 1"

# Check port availability
lsof -i :5000
```

### Frontend can't connect
1. Check backend is running: `curl http://localhost:5000/health`
2. Check CORS is enabled in `src/app.js`
3. Verify API_URL in `frontend/config.js`
4. Check browser console for errors

### Payment not working
1. Verify Paystack secret key in `.env`
2. Verify Paystack public key in `frontend/dashboard.js`
3. Check Paystack dashboard for transaction
4. Verify JWT token is being sent in request

### Dashboard shows old data
1. Clear browser localStorage: `localStorage.clear()`
2. Hard refresh: Ctrl+Shift+R
3. Check backend logs for errors
4. Verify JWT token is valid

---

## 📦 Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect to Render/Railway
3. Add environment variables
4. Deploy!

### Frontend (Vercel/Netlify)
1. Update API_URL to backend URL
2. Update Paystack key to production
3. Push frontend folder to GitHub
4. Connect to Vercel/Netlify
5. Deploy!

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Backend API documentation |
| `frontend/README.md` | Frontend guide |
| `frontend/DESIGN_GUIDE.md` | UI/UX design system |
| `TRANSFORMATION_SUMMARY.md` | Complete change log |

---

## 🎓 Learn More

### Understanding the Code

**Authentication Flow:**
1. User registers → Password hashed with bcrypt
2. JWT token generated → Stored in localStorage
3. Dashboard requests → Token sent in header
4. Backend verifies → User data returned

**Payment Flow:**
1. User clicks buy → Paystack popup
2. Payment successful → Reference returned
3. Frontend sends reference → Backend verifies with Paystack
4. Subscription extended → User synced to offline DB

**Subscription Logic:**
- Stored as `subscription_expires_at` timestamp
- Dashboard calculates time remaining
- `/auth/check-access` compares with current time
- Each payment adds 30 days from expiry

---

## 🆘 Need Help?

1. **Check Documentation**: Read the guides listed above
2. **Check Browser Console**: Look for JavaScript errors
3. **Check Backend Logs**: Look for API errors
4. **Check Database**: Verify data is being saved
5. **Test Endpoints**: Use curl or Postman

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Backend starts without errors
- [ ] Both databases created and migrated
- [ ] Can register new account
- [ ] Can login successfully
- [ ] Dashboard loads and shows data
- [ ] Can make test payment
- [ ] Payment verification works
- [ ] Subscription time updates
- [ ] LAN access check works
- [ ] Logout clears token
- [ ] All pages responsive on mobile
- [ ] Production API URL configured
- [ ] Production Paystack keys configured
- [ ] CORS enabled for frontend domain

---

## 🎉 You're Ready!

Your Xenon platform is **fully functional** and ready for users!

**Next Steps:**
1. Test thoroughly
2. Deploy to production
3. Update LAN app to use email verification
4. Launch! 🚀

For questions or issues, refer to the documentation files. Happy coding! ⚡
