# KasirPro Deployment & Setup Guide

## System Requirements

### Backend (Laravel 11)
- PHP 8.3 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Composer 2.x
- Node.js 18+ (for Vite asset compilation)

### Frontend (Next.js 16)
- Node.js 18 or higher
- npm 9 or higher or yarn/pnpm
- Modern browser with Service Worker support

### System Dependencies
- Git
- Docker & Docker Compose (optional, for containerization)
- A domain name or localhost for development

---

## Backend Setup

### 1. Initial Configuration

```bash
cd backend

# Copy environment file and configure
cp .env.example .env

# Edit .env with your settings
nano .env
```

Key environment variables to configure:
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - PostgreSQL connection
- `APP_URL` - Your API server URL
- `JWT_SECRET` - Generate with `php artisan jwt:secret`
- Payment gateway keys (Midtrans, QRIS)
- Redis connection settings

### 2. Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install Composer dependencies
- Generate APP_KEY
- Run database migrations
- Seed sample data
- Create storage symlink
- Cache configuration

### 3. Manual Setup (if needed)

```bash
# Install dependencies
composer install

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed

# Create storage symlink
php artisan storage:link
```

### 4. Start Development Server

```bash
# Start Laravel dev server
php artisan serve

# In another terminal, start WebSocket server
php artisan reverb:start
```

The API will be available at `http://localhost:8000`

### 5. API Documentation

View the API endpoints and documentation:
```bash
# Generate API docs (if using laravel-api-docs)
php artisan api:docs

# Or visit Swagger UI
curl http://localhost:8000/api/docs
```

---

## Frontend Setup

### 1. Initial Configuration

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Edit configuration
nano .env.local
```

Key environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL
- `NEXT_PUBLIC_OUTLET_ID` - Default outlet ID
- `NEXT_PUBLIC_TENANT_ID` - Default tenant ID
- Feature flags for offline mode, loyalty, omnichannel

### 2. Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install npm dependencies
- Build Next.js application
- Verify TypeScript types
- Prepare production build

### 3. Manual Setup

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify types
npx tsc --noEmit
```

### 4. Start Development Server

```bash
npm run dev
```

Access the application:
- Main app: http://localhost:3000
- Cashier Terminal: http://localhost:3000/pos
- Customer Display: http://localhost:3000/cfd

### 5. Service Worker Registration

The Service Worker is automatically registered on first load:
- Offline mode enabled
- Master data cached locally
- Transaction queue synced on reconnection
- Background sync for failed requests

---

## Database Setup

### PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download installer from https://www.postgresql.org/download/windows/
- Follow installation wizard

### Create Database & User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kasirpro;

# Create user with password
CREATE USER kasirpro_user WITH PASSWORD 'secure_password_here';

# Grant privileges
ALTER ROLE kasirpro_user SET client_encoding TO 'utf8';
ALTER ROLE kasirpro_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kasirpro_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE kasirpro TO kasirpro_user;

# Exit psql
\q
```

### Redis Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**Windows:**
- Use WSL2 or Windows Subsystem for Linux
- Or use Docker: `docker run -d -p 6379:6379 redis`

---

## Docker Compose Setup (Optional)

For containerized deployment:

```bash
# Create docker-compose.yml in project root
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kasirpro
      POSTGRES_USER: kasirpro_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  laravel:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./backend:/app

  nextjs:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://laravel:8000/api/v1
    depends_on:
      - laravel

volumes:
  postgres_data:
EOF

# Start services
docker-compose up -d
```

---

## Production Deployment

### Backend (Laravel)

#### Using Apache

```bash
# Create virtual host
sudo nano /etc/apache2/sites-available/kasirpro.conf

# Add:
<VirtualHost *:80>
    ServerName kasirpro.com
    DocumentRoot /var/www/kasirpro/backend/public

    <Directory /var/www/kasirpro/backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/kasirpro-error.log
    CustomLog ${APACHE_LOG_DIR}/kasirpro-access.log combined
</VirtualHost>

# Enable site and mod_rewrite
sudo a2ensite kasirpro.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Using Nginx + PHP-FPM

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/kasirpro

# Add:
server {
    listen 80;
    server_name kasirpro.com;
    root /var/www/kasirpro/backend/public;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# Enable and restart
sudo ln -s /etc/nginx/sites-available/kasirpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Frontend (Next.js)

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or use PM2 for process management
sudo npm install -g pm2
pm2 start "npm start" --name "kasirpro-frontend"
pm2 save
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-apache

# For Apache
sudo certbot --apache -d kasirpro.com

# For Nginx
sudo certbot --nginx -d kasirpro.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## First Run Checklist

- [ ] Backend .env configured with database credentials
- [ ] Frontend .env.local configured with API URL
- [ ] Database migrations ran successfully
- [ ] Sample data seeded
- [ ] Redis running
- [ ] Backend API accessible at configured URL
- [ ] Frontend Service Worker registered
- [ ] WebSocket connection working
- [ ] Offline mode tested
- [ ] Payment gateway keys configured
- [ ] Email service configured

---

## Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
grep DB_ .env

# Test connection
psql -h localhost -U kasirpro_user -d kasirpro
```

**WebSocket connection failed:**
```bash
# Start Reverb server
php artisan reverb:start

# Check port 8080 is available
lsof -i :8080
```

**Storage permission denied:**
```bash
chmod -R 775 storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### Frontend Issues

**Service Worker not registering:**
```bash
# Clear browser cache
# Open DevTools > Application > Service Workers
# Manually register in console:
navigator.serviceWorker.register('/sw.js')
```

**API connection timeout:**
```bash
# Check backend is running
curl http://localhost:8000/api/v1/health

# Verify NEXT_PUBLIC_API_URL in .env.local
grep NEXT_PUBLIC_API_URL .env.local
```

**Offline mode not working:**
- Check browser supports Service Workers
- Verify public/sw.js exists and loads
- Check IndexedDB quota in DevTools

---

## Security Considerations

1. **Change all default credentials** in .env files
2. **Enable HTTPS** in production
3. **Set strong JWT_SECRET** in Laravel
4. **Configure CORS** for production domain
5. **Enable rate limiting** on API endpoints
6. **Regular backups** of PostgreSQL database
7. **Keep dependencies updated**: `composer update`, `npm update`
8. **Implement API rate limiting** with Laravel middleware
9. **Enable debug mode only in development** (APP_DEBUG=false in production)

---

## Performance Optimization

### Backend
```bash
# Cache config for production
php artisan config:cache

# Cache routes
php artisan route:cache

# Optimize Composer autoloader
composer install --optimize-autoloader --no-dev
```

### Frontend
```bash
# Build with optimizations
npm run build

# Use static export for CDN
npm run export

# Enable image optimization
# Already configured in next.config.ts
```

### Database
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_transactions_outlet_date ON transactions(outlet_id, created_at);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_inventory_product_outlet ON inventory(product_id, outlet_id);
```

---

## Monitoring & Logging

### Backend Logs
```bash
# Tail Laravel logs
tail -f storage/logs/laravel.log

# Or use Supervisor for auto-restart
```

### Frontend Logs
```bash
# PM2 logs
pm2 logs kasirpro-frontend

# Or use PM2 monit
pm2 monit
```

### System Monitoring
```bash
# Install New Relic or DataDog agents for APM
# Configure Sentry for error tracking
# SENTRY_LARAVEL_DSN in backend .env
# NEXT_PUBLIC_SENTRY_DSN in frontend .env.local
```

---

## Support & Documentation

- Laravel Documentation: https://laravel.com/docs/11.x
- Next.js Documentation: https://nextjs.org/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/15/
- Redis Documentation: https://redis.io/documentation
- PWA Documentation: https://web.dev/progressive-web-apps/

---

**Last Updated:** 2026-05-28
**KasirPro Version:** 1.0.0
**License:** Proprietary
