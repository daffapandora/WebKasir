# KasirPro - Modern POS SaaS Platform

A production-ready, omnichannel Point of Sale system built with Laravel 11 and Next.js 16, designed for SMEs and restaurant chains with offline-first capabilities and real-time synchronization.

## Quick Start

### Prerequisites
- **Backend:** PHP 8.3+, PostgreSQL 15+, Redis 7+, Composer 2.x
- **Frontend:** Node.js 18+, npm 9+
- **System:** Docker (optional), Git

### 30-Second Setup

**Backend:**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

**Frontend:**
```bash
cd frontend
chmod +x setup.sh
./setup.sh
```

**Start Development:**
```bash
# Terminal 1: Backend API
cd backend && php artisan serve

# Terminal 2: WebSocket Server
cd backend && php artisan reverb:start

# Terminal 3: Frontend
cd frontend && npm run dev
```

**Access the Application:**
- 🖥️ **Cashier Terminal:** http://localhost:3000/pos
- 📱 **Customer Display:** http://localhost:3000/cfd
- 📚 **API Docs:** http://localhost:8000/api/docs

---

## Project Structure

```
Aplikasi Kasir/
├── backend/                    # Laravel 11 API Server
│   ├── app/
│   │   ├── Models/            # Eloquent models (Product, Transaction, etc.)
│   │   ├── Controllers/       # API controllers (POS, Admin, etc.)
│   │   ├── Services/          # Business logic (TransactionService, etc.)
│   │   ├── Events/            # WebSocket events
│   │   └── Middleware/        # Auth & multi-tenancy middleware
│   ├── database/
│   │   ├── migrations/        # Schema definitions
│   │   └── seeders/           # Sample data
│   ├── routes/
│   │   └── api.php            # RESTful API endpoints
│   ├── .env.example           # Environment template
│   └── setup.sh               # Automated setup script
│
├── frontend/                   # Next.js 16 App Router
│   ├── src/
│   │   ├── app/               # Page components (/pos, /cfd, /login)
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks (WebSocket, offline sync)
│   │   ├── stores/            # Zustand state management
│   │   └── types/             # TypeScript interfaces
│   ├── public/
│   │   └── sw.js              # Service Worker for offline mode
│   ├── .env.local             # Environment configuration
│   ├── middleware.ts          # Next.js middleware for auth & multi-tenancy
│   └── setup.sh               # Automated setup script
│
├── DEPLOYMENT.md              # Complete deployment guide
├── TECHNICAL_IMPLEMENTATION_GUIDE.md # Implementation details
└── PRD.md                     # Product requirements & market analysis
```

---

## Key Features Implemented

### 🛒 Cashier Terminal (`/pos`)
- ✅ Real-time product search with barcode scanning
- ✅ Dynamic cart management with instant calculations
- ✅ 4 payment methods: Cash, Card (EDC), QRIS, Split Payment
- ✅ ACID-compliant transactions with deadlock retry
- ✅ Offline mode with automatic sync on reconnection
- ✅ Receipt printing with auto-print on success
- ✅ Real-time inventory management
- ✅ Manager PIN authorization for voids

### 📺 Customer Display (`/cfd`)
- ✅ Queue management with order numbers
- ✅ Real-time order status updates
- ✅ Estimated preparation time display
- ✅ "Next" button to advance queue
- ✅ Beautiful gradient UI for customer engagement
- ✅ WebSocket integration for dual-screen sync

### 🏢 Multi-Tenant Architecture
- ✅ Database-level tenant isolation (global scope on all models)
- ✅ Automatic tenant context from JWT or X-Tenant-ID header
- ✅ Per-outlet staff assignment and permissions
- ✅ Secure inter-tenant data boundaries

### 📡 Real-Time Synchronization
- ✅ WebSocket broadcasting with Laravel Reverb
- ✅ Private channel subscriptions (outlet.{id}, cfd.{id})
- ✅ Automatic reconnection with exponential backoff
- ✅ Event types: TransactionCreated, InventoryUpdated, TransactionVoided

### 📦 Offline-First Design
- ✅ Service Worker with Workbox strategies
- ✅ IndexedDB for master data (products, categories)
- ✅ Transaction queue with 7-day retention
- ✅ Background sync on reconnection
- ✅ Network-first API strategy (5s timeout)
- ✅ Cache-first for static assets and images

### 💳 Payment Processing
- **Cash:** Amount input with automatic change calculation
- **QRIS:** BRI QRIS format QR code generation with 5-minute timeout
- **Card/EDC:** Integration endpoint for POS terminal systems
- **Split Payment:** Validation of cash + card + QRIS combinations
- **Receipt:** Auto-print on success with order details

### 📊 Inventory Management
- ✅ Product variants support (sizes, colors, etc.)
- ✅ Recipe-based ingredient deduction for food businesses
- ✅ Reserved quantity tracking to prevent overselling
- ✅ Audit trail with InventoryMovement table
- ✅ Low-stock alerts
- ✅ Stock transfer between outlets

### 🎁 Loyalty & Promotions
- ✅ Point-based loyalty system
- ✅ Tiered membership (REGULAR, SILVER, GOLD, PLATINUM)
- ✅ Promo codes with usage limits
- ✅ Discount percentage/fixed amount support
- ✅ Customer profile tracking

### 🌐 Omnichannel Integration
- ✅ GoFood API integration structure
- ✅ GrabFood platform support
- ✅ Online order routing to outlets
- ✅ Unified customer management across channels

---

## Technology Stack

### Backend
- **Framework:** Laravel 11 with PHP 8.3
- **Database:** PostgreSQL 15 with multi-tenant global scoping
- **Cache/Queue:** Redis 7
- **WebSocket:** Laravel Reverb (real-time broadcasting)
- **Authentication:** Sanctum (API tokens)
- **Authorization:** Spatie Permission (RBAC)

### Frontend
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand with persist middleware
- **Offline:** Dexie.js (IndexedDB wrapper) + Workbox (Service Worker)
- **Real-Time:** Echo client + native WebSocket hooks
- **QR Code:** qrcode library (BRI QRIS format)

### Infrastructure
- **Containerization:** Docker & Docker Compose (optional)
- **Web Servers:** Apache/Nginx + PHP-FPM
- **Process Manager:** PM2 (Node.js), Supervisor (PHP)
- **SSL:** Let's Encrypt with Certbot

---

## Database Schema

### Core Tables
- **tenants** - Multi-tenant isolation
- **outlets** - Physical store locations
- **users** - Staff accounts with roles
- **products** - Catalog items with variants
- **inventory** - Stock levels per outlet
- **transactions** - POS orders with full lifecycle

### Payment & Shift
- **shifts** - Cashier sessions with opening/closing
- **payments** - Transaction payments (cash/card/QRIS)
- **transaction_items** - Line items in order

### Features
- **customers** - CRM with loyalty points
- **loyalty_points** - Point transactions
- **promo_codes** - Discount codes
- **online_orders** - Omnichannel orders
- **purchase_orders** - Supplier orders
- **inter_branch_transfers** - Outlet-to-outlet transfers
- **audit_logs** - Activity tracking

### Relationships
All domain models extend `BaseModel` which automatically:
- Filters queries by tenant_id
- Sets tenant_id on create
- Prevents cross-tenant data leaks

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/login              - User login
POST   /api/v1/auth/logout             - User logout
POST   /api/v1/auth/refresh            - Refresh token
GET    /api/v1/auth/me                 - Current user info
```

### Products
```
GET    /api/v1/cashier/products        - Search products
GET    /api/v1/cashier/products/:id    - Get product details
POST   /api/v1/cashier/products/barcode-search - Barcode lookup
GET    /api/v1/cashier/products/low-stock - Low stock alerts
```

### Transactions
```
POST   /api/v1/cashier/transactions                  - Create transaction
GET    /api/v1/cashier/transactions                  - List transactions
GET    /api/v1/cashier/transactions/:id              - Get receipt
POST   /api/v1/cashier/transactions/:id/void         - Manager void
POST   /api/v1/cashier/transactions/:id/hold         - Hold order
POST   /api/v1/cashier/transactions/:id/resume       - Resume held order
```

### Sync & Offline
```
GET    /api/v1/sync/master-data        - Master data snapshot
POST   /api/v1/sync/transactions       - Batch upload offline txns
```

### Real-Time Events
```
WebSocket /app                         - Subscribe to channels
  → outlet.{outlet_id}                 - Outlet-specific events
  → cfd.{outlet_id}                    - Customer display events
```

---

## Offline Functionality

### Master Data Caching
- Products, categories cached in IndexedDB on login
- Auto-updated every 24 hours or on manual sync
- Available for product search when offline

### Transaction Queue
- Pending transactions stored locally when offline
- Automatic sync when connection restored
- Exponential backoff retry (1s → 32s, max 5 attempts)
- 7-day retention for sync history

### Service Worker Strategies
- **Network-first (5s timeout):** `/api/*` endpoints
- **Network-first (10s timeout):** `/sync/master-data`
- **Cache-first:** Images, fonts, static assets
- **Stale-while-revalidate:** Scripts & stylesheets

---

## Security Features

### Multi-Tenant Isolation
- Database-level tenant context from Auth::user()->tenant_id
- X-Tenant-ID header fallback for CLI/tests
- BaseModel global scope prevents data leaks
- All queries automatically scoped

### Authentication & Authorization
- JWT with Sanctum for API authentication
- Role-based access control (RBAC) with Spatie Permission
- Manager PIN verification for sensitive operations
- Bcrypt password hashing with configurable rounds

### Payment Security
- No sensitive payment data stored in DB
- EDC integration via dedicated API endpoint
- QRIS generation without token exposure
- PCI-DSS compliance recommended

### API Security
- CORS configuration per environment
- Rate limiting middleware
- Request validation on all endpoints
- Encrypted cookies for sensitive data
- HTTPS enforced in production

---

## Performance Optimizations

### Backend
- Eager loading of relationships (EagerLoad scope)
- Database indexes on frequently queried columns
- Cached configuration and routes in production
- Redis queue for async tasks
- Full-text search on product catalog

### Frontend
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Service Worker caching strategies
- IndexedDB for local data persistence
- Debounced search with 2-char minimum

### Database
- Indexes on tenant_id, outlet_id, created_at
- Partitioning for large tables (transactions by date)
- Query optimization with EXPLAIN ANALYZE
- Connection pooling with PgBouncer

---

## Development Workflow

### Backend Development
```bash
# Watch for code changes
composer watch

# Run tests
php artisan test

# Generate API documentation
php artisan api:docs

# Monitor WebSocket connections
php artisan tinker
>> Illuminate\Broadcasting\BroadcastManager::connections()
```

### Frontend Development
```bash
# Watch TypeScript types
npx tsc --watch

# Test components
npm run test

# Build for production
npm run build

# Analyze bundle size
npm run analyze
```

### Database Changes
```bash
# Create migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback
php artisan migrate:rollback

# Fresh database
php artisan migrate:refresh --seed
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured (.env files)
- [ ] Database migrations tested
- [ ] API endpoints verified
- [ ] Service Worker tested in offline
- [ ] WebSocket connection working
- [ ] Payment gateway keys configured
- [ ] SSL certificate ready (Let's Encrypt)
- [ ] Database backups automated

### Production Configuration
- [ ] APP_DEBUG=false
- [ ] APP_ENV=production
- [ ] CACHE_DRIVER=redis
- [ ] SESSION_DRIVER=cookie
- [ ] HTTPS enforced
- [ ] CORS configured for domain
- [ ] Rate limiting enabled
- [ ] Error logging (Sentry) configured

### Post-Deployment
- [ ] Health check endpoints accessible
- [ ] Database backups verified
- [ ] Monitoring alerts set up
- [ ] Log rotation configured
- [ ] SSL certificate auto-renewal enabled
- [ ] API rate limits tested
- [ ] Offline mode tested
- [ ] WebSocket stability verified

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

---

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
```bash
# Check Reverb is running
ps aux | grep reverb

# Restart WebSocket server
php artisan reverb:start

# Verify firewall allows port 8080
sudo ufw allow 8080
```

**Service Worker Not Caching**
```bash
# Clear browser cache manually
# DevTools → Application → Clear site data

# Check SW registration
navigator.serviceWorker.getRegistrations()

# Force update
navigator.serviceWorker.getRegistration('/sw.js').then(reg => reg.update())
```

**Offline Transactions Not Syncing**
```bash
# Check browser IndexedDB
# DevTools → Application → IndexedDB → kasirpro → transactions

# Verify API connectivity
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/v1/sync/transactions

# Check Service Worker logs
console.log(await (await caches.open('kasirpro-api')).keys())
```

See [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section for more issues.

---

## Documentation

- 📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete setup & deployment guide
- 📋 **[PRD.md](PRD.md)** - Product requirements & market analysis
- 🔧 **[TECHNICAL_IMPLEMENTATION_GUIDE.md](TECHNICAL_IMPLEMENTATION_GUIDE.md)** - Implementation details

---

## Project Statistics

- **Backend Code:** 2000+ lines (migrations, models, controllers, services)
- **Frontend Code:** 1500+ lines (components, hooks, stores)
- **Configuration:** 400+ lines (.env templates, middleware, setup scripts)
- **Documentation:** 3500+ lines (PRD, technical guide, deployment guide)
- **Total Implementation:** 7000+ lines production-ready code

---

## Version & License

**Version:** 1.0.0  
**Release Date:** 2026-05-28  
**License:** Proprietary

---

## Support & Contact

For issues, feature requests, or support:
- 📧 Email: support@kasirpro.local
- 🐛 Bug Reports: GitHub Issues
- 📞 Phone: +62-XXX-XXXX-XXXX

---

## Next Steps

1. **Clone & Setup:** Follow the Quick Start section
2. **Configure Environment:** Edit `.env` files with your values
3. **Run Setup Scripts:** Execute `setup.sh` in both directories
4. **Start Development:** Run both backends and frontend
5. **Test Offline Mode:** Disconnect internet and test transactions
6. **Deploy:** Follow DEPLOYMENT.md for production setup

---

**Happy Selling with KasirPro! 🎉**
