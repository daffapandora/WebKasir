# KasirPro - Quick Start Guide

Get KasirPro running in 5 minutes!

## Prerequisites Check

```bash
# Check required versions
php --version          # Should be 8.3+
node --version         # Should be 18+
npm --version          # Should be 9+
brew services list     # Or use appropriate package manager
```

## One-Command Backend Setup

```bash
cd backend && bash setup.sh && php artisan serve &
```

This automatically:
- ✅ Installs Composer dependencies
- ✅ Generates APP_KEY
- ✅ Creates PostgreSQL database (assumes running)
- ✅ Runs migrations
- ✅ Seeds sample data
- ✅ Starts dev server on http://localhost:8000

## One-Command Frontend Setup

```bash
cd frontend && bash setup.sh && npm run dev &
```

This automatically:
- ✅ Installs npm dependencies
- ✅ Builds Next.js app
- ✅ Starts dev server on http://localhost:3000

## Start WebSocket Server

```bash
cd backend && php artisan reverb:start &
```

## Access the App

```
🖥️  Cashier Terminal: http://localhost:3000/pos
📱 Customer Display: http://localhost:3000/cfd
📚 API Docs:         http://localhost:8000/api/docs
```

## Test Offline Mode

1. **Go to POS:** http://localhost:3000/pos
2. **Add some products** to cart
3. **Disconnect internet** (DevTools > Network tab > Offline)
4. **Complete checkout** - Transaction will be queued locally
5. **Reconnect internet** - Watch it sync automatically! ✨

## Test Payment Methods

**Cash Payment:**
- Enter amount, see change auto-calculated ✓

**QRIS Payment:**
- QR code generated instantly with 5-min timeout ✓

**Split Payment:**
- Combine cash + card + QRIS ✓

## Verify Everything Works

| Component | Command | Expected Result |
|-----------|---------|-----------------|
| Backend API | `curl http://localhost:8000/api/docs` | API documentation loads |
| Frontend | `curl http://localhost:3000/pos` | Cashier page loads |
| WebSocket | Check browser Console | No connection errors |
| Database | `psql kasirpro -c "SELECT COUNT(*) FROM products"` | Returns product count > 0 |
| Redis | `redis-cli ping` | Returns PONG |

## Default Login Credentials

After setup, use these to log in:

```
Email:    admin@kasirpro.local
Password: password123
PIN:      1234
```

Or register a new account: http://localhost:3000/register

## Common Issues

### "Connection refused" on API calls
```bash
# Backend not running?
ps aux | grep "php artisan serve"

# Start it:
cd backend && php artisan serve
```

### "Service Worker not registered"
```bash
# Clear browser cache and reload
# DevTools → Application → Clear Site Data
```

### "Offline mode not working"
```bash
# Check browser supports Service Workers
# Open DevTools → Application → Service Workers

# Should see registered service worker
```

### "WebSocket connection failed"
```bash
# Reverb not running?
cd backend && php artisan reverb:start
```

## Database Reset

To start fresh:

```bash
cd backend
php artisan migrate:refresh --seed
```

This clears and re-populates the database with sample data.

## Next Steps

- ✅ Explore the codebase in `backend/app` and `frontend/src`
- ✅ Read [TECHNICAL_IMPLEMENTATION_GUIDE.md](TECHNICAL_IMPLEMENTATION_GUIDE.md) for architecture details
- ✅ Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- ✅ Test all payment methods in Settings
- ✅ Verify omnichannel orders integration
- ✅ Test multi-outlet switching
- ✅ Try real-time sync with two browser windows

## File Structure Highlights

```
backend/
  app/Models/          ← Core business logic
  app/Services/        ← TransactionService (checkout)
  routes/api.php       ← API endpoints
  database/migrations/ ← Schema & tables

frontend/
  src/app/pos/page.tsx        ← Main cashier terminal
  src/app/cfd/page.tsx        ← Customer display
  src/stores/cartStore.ts     ← Cart state
  public/sw.js                ← Offline magic ✨
```

## Performance Tips

- Check API response times in browser DevTools
- Monitor Service Worker cache hits in Application tab
- Test with network throttling (DevTools > Network > Slow 3G)
- Measure offline transaction queue size in IndexedDB

## Production Checklist

Before deploying to production:

- [ ] Change default credentials
- [ ] Configure payment gateways (Midtrans, QRIS)
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure CDN for images
- [ ] Set up database backups
- [ ] Configure error tracking (Sentry)
- [ ] Set up monitoring & alerting
- [ ] Load test with concurrent users

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production guide.

---

## Need Help?

- 📖 Read the [README.md](README.md) for full documentation
- 🔧 Check [TECHNICAL_IMPLEMENTATION_GUIDE.md](TECHNICAL_IMPLEMENTATION_GUIDE.md) for detailed architecture
- 📋 Review [PRD.md](PRD.md) for requirements
- 🐛 Check browser console for errors
- 🔍 Use VS Code debugger for backend

---

**That's it! You're ready to develop with KasirPro. Happy coding! 🚀**
