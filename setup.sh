#!/bin/bash

# Xenon Setup Script
echo "========================================="
echo "   Xenon Backend & Frontend Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✓ Found package.json"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
echo "✓ Backend dependencies installed"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Database URLs
ONLINE_DB_URL=postgresql://user:password@host:5432/online_db
OFFLINE_DB_URL=postgresql://user:password@host:5432/offline_db

# Paystack API Key
PAYSTACK_SECRET=sk_test_your_secret_key_here

# JWT Secret (generate a random string)
JWT_SECRET=$(openssl rand -base64 32)

# Server Port
PORT=5000
EOF
    echo "✓ Created .env template file"
    echo "⚠️  Please update .env with your actual credentials"
    echo ""
else
    echo "✓ .env file exists"
    echo ""
fi

# Check for database schemas
echo "📄 Database schema files:"
if [ -f "schema_online.sql" ]; then
    echo "  ✓ schema_online.sql"
else
    echo "  ❌ schema_online.sql not found"
fi

if [ -f "schema_offline.sql" ]; then
    echo "  ✓ schema_offline.sql"
else
    echo "  ❌ schema_offline.sql not found"
fi
echo ""

echo "========================================="
echo "   Next Steps"
echo "========================================="
echo ""
echo "1. Update .env file with your credentials:"
echo "   - Database URLs"
echo "   - Paystack secret key"
echo "   - (JWT_SECRET is already generated)"
echo ""
echo "2. Create databases and run migrations:"
echo "   psql -U postgres -f schema_online.sql -d your_online_db"
echo "   psql -U postgres -f schema_offline.sql -d your_offline_db"
echo ""
echo "3. Start the backend server:"
echo "   npm run dev"
echo ""
echo "4. Open frontend/index.html in a browser or use a live server"
echo ""
echo "5. Test the flow:"
echo "   - Register a new account"
echo "   - Login and view dashboard"
echo "   - Make a test payment"
echo "   - Check subscription status"
echo ""
echo "========================================="
echo "   Important Configuration"
echo "========================================="
echo ""
echo "Frontend API URL: frontend/config.js"
echo "  - Automatically uses localhost:5000 in development"
echo "  - Update for production deployment"
echo ""
echo "Paystack Public Key: frontend/dashboard.js"
echo "  - Currently using test key"
echo "  - Update to production key before going live"
echo ""
echo "========================================="
echo "   Documentation"
echo "========================================="
echo ""
echo "Backend API: README.md"
echo "Frontend Guide: frontend/README.md"
echo ""
echo "For questions or issues, check the documentation files above."
echo ""
