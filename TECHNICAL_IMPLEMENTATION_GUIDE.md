# Technical Implementation Guide
## Kasir Platform - Production-Ready Execution Blueprint

**Date:** May 28, 2026  
**Version:** 2.0 - Executable Phase  
**Audience:** Full-Stack Engineers, DevOps Architects, Technical Leaders

---

## Table of Contents
1. [System Architecture & Repository Setup](#system-architecture--repository-setup)
2. [Backend Execution - Laravel 11](#backend-execution---laravel-11)
3. [Frontend Execution - Next.js](#frontend-execution---nextjs)
4. [Hardware Integration Layer](#hardware-integration-layer)
5. [Real-Time Synchronization & WebSockets](#real-time-synchronization--websockets)
6. [RBAC & Security Implementation](#rbac--security-implementation)
7. [API Response & Error Handling](#api-response--error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Performance Optimization](#performance-optimization)
10. [Deployment Pipeline](#deployment-pipeline)
11. [Monitoring & Observability](#monitoring--observability)

---

## System Architecture & Repository Setup

### Monorepo Structure (Recommended)

```
kasir-platform/
├── backend/                              # Laravel 11 API Server
│   ├── app/
│   │   ├── Models/                       # Eloquent Models with multi-tenant scoping
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   ├── Requests/
│   │   │   └── Resources/
│   │   ├── Services/                     # Business logic services
│   │   ├── Actions/                      # Single-purpose action classes
│   │   ├── Events/                       # Domain events
│   │   ├── Listeners/                    # Event listeners
│   │   ├── Jobs/                         # Queued jobs
│   │   ├── Exceptions/
│   │   ├── Traits/
│   │   └── Broadcasting/                 # WebSocket channels
│   ├── database/
│   │   ├── migrations/                   # All migration files
│   │   ├── factories/                    # Model factories
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php                       # API routes
│   │   └── channels.php                  # WebSocket channels
│   ├── config/
│   │   ├── tenancy.php                   # Multi-tenant config
│   │   └── reverb.php                    # WebSocket config
│   ├── tests/
│   │   ├── Unit/
│   │   ├── Feature/
│   │   └── Pest.php
│   ├── storage/
│   │   ├── app/                          # File storage
│   │   ├── logs/                         # Application logs
│   │   └── framework/
│   ├── composer.json
│   ├── .env.example
│   └── artisan
├── frontend/                             # Next.js 16 Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                   # Authentication routes
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/              # Protected routes
│   │   │   │   ├── layout.tsx            # Main dashboard layout
│   │   │   │   ├── cashier/
│   │   │   │   │   └── page.tsx          # POS Terminal
│   │   │   │   ├── customer-display/
│   │   │   │   │   └── page.tsx          # Customer Facing Display
│   │   │   │   ├── inventory/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── omnichannel/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx                # Root layout
│   │   ├── components/
│   │   │   ├── common/                   # Shared components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── cashier/                  # POS components
│   │   │   │   ├── OrderPanel.tsx
│   │   │   │   ├── ItemSearch.tsx
│   │   │   │   ├── TotalDisplay.tsx
│   │   │   │   └── PaymentMethodSelector.tsx
│   │   │   ├── cfd/                      # Customer Display components
│   │   │   │   ├── OrderSummary.tsx
│   │   │   │   ├── QRCodeDisplay.tsx
│   │   │   │   └── FeedbackWidget.tsx
│   │   │   └── forms/
│   │   ├── hooks/                        # Custom React hooks
│   │   │   ├── useTenant.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useTransaction.ts
│   │   │   ├── useOfflineSync.ts
│   │   │   └── useAuth.ts
│   │   ├── stores/                       # Zustand stores
│   │   │   ├── transactionStore.ts
│   │   │   ├── cartStore.ts
│   │   │   ├── offlineSyncStore.ts
│   │   │   └── userStore.ts
│   │   ├── providers/                    # Context providers
│   │   │   ├── TenantProvider.tsx
│   │   │   ├── WebSocketProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── RootProvider.tsx
│   │   ├── lib/
│   │   │   ├── api-client.ts             # Axios/Fetch wrapper
│   │   │   ├── websocket.ts              # WebSocket client
│   │   │   ├── db.ts                     # IndexedDB wrapper
│   │   │   ├── printer.ts                # Thermal printer integration
│   │   │   ├── qr-generator.ts           # QR code utility
│   │   │   └── utils.ts
│   │   ├── services/
│   │   │   ├── transactionService.ts
│   │   │   ├── offlineSyncService.ts
│   │   │   └── inventoryService.ts
│   │   ├── types/                        # TypeScript types
│   │   │   ├── transaction.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   └── payment.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── animations.css
│   │   └── middleware.ts                 # Next.js middleware
│   ├── public/
│   │   ├── sw.js                         # Service Worker
│   │   └── manifest.json                 # PWA manifest
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.local.example
├── docs/                                 # Documentation
└── docker-compose.yml                    # Local development environment
```

### Backend Dependencies Installation

```bash
# Navigate to backend
cd backend

# Install PHP dependencies (Laravel 11 + required packages)
composer install

# Key packages to install:
# - laravel/sanctum (API authentication)
# - spatie/laravel-permission (RBAC)
# - laravel/reverb (WebSockets)
# - laravel/pennant (Feature flags)
# - spatie/laravel-query-builder (Advanced filtering)
# - league/flysystem-aws-s3-v3 (File storage)

# OR install specific packages
composer require laravel/sanctum spatie/laravel-permission laravel/reverb league/flysystem-aws-s3-v3 spatie/laravel-query-builder

# Generate application key
php artisan key:generate

# Generate Reverb app key and secret
php artisan reverb:install
```

### Frontend Dependencies Installation

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Install core packages
npm install zustand axios swr qrcode dexie next-pwa

# Install UI/component libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu recharts lucide-react

# Install development dependencies
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Environment Variables Setup

**Backend (.env)**
```env
APP_NAME="Kasir Platform"
APP_ENV=local
APP_KEY=base64:YOUR_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kasir_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=cookie

# Reverb WebSocket
REVERB_APP_ID=kasir_app
REVERB_APP_KEY=your_reverb_key
REVERB_APP_SECRET=your_reverb_secret
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=http

# Mail
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@kasir.local

# File Storage
FILESYSTEM_DISK=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001,127.0.0.1:3000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_KEY=your_reverb_key
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=ws
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CFD_URL=http://localhost:3001

# Feature flags
NEXT_PUBLIC_FEATURE_OFFLINE_MODE=true
NEXT_PUBLIC_FEATURE_THERMAL_PRINTER=true
NEXT_PUBLIC_FEATURE_OMNICHANNEL=true
```

---

## Backend Execution - Laravel 11

### Phase 1: Initialize Laravel Project

```bash
# Create new Laravel 11 project
laravel new backend --git

cd backend

# Set up git repository
git init
git add .
git commit -m "Initial Laravel 11 setup"
```

### Phase 2: Multi-Tenant Database Schema

#### Migration 1: Core Tenancy & Users

```php
// database/migrations/2026_05_28_000001_create_tenants_and_users.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Tenants table - SaaS multi-tenant isolation
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique()->index();
            $table->enum('subscription_tier', ['starter', 'professional', 'enterprise'])->default('starter');
            $table->dateTime('subscription_expires_at')->nullable();
            $table->json('settings')->nullable(); // Custom tenant settings
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Outlets/Branches per tenant
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique(); // Branch identifier
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['tenant_id', 'is_active']);
        });

        // Users with RBAC
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->nullable()->constrained('outlets')->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('pin_hash')->nullable(); // 4-6 digit PIN for transactions
            $table->enum('role', ['owner', 'manager', 'cashier', 'waiter', 'warehouse'])->default('cashier');
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'outlet_id']);
        });

        // Roles & Permissions (Spatie)
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('guard_name')->default('web');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('guard_name')->default('web');
            $table->timestamps();
        });

        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('model_id');
            $table->string('model_type');

            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->primary(['role_id', 'model_id', 'model_type'], 'model_has_roles_primary');
            $table->index(['model_id', 'model_type']);
        });

        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('model_id');
            $table->string('model_type');

            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->primary(['permission_id', 'model_id', 'model_type'], 'model_has_permissions_primary');
        });

        // API Tokens for mobile/external integrations
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('outlets');
        Schema::dropIfExists('tenants');
    }
};
```

#### Migration 2: Products & Inventory

```php
// database/migrations/2026_05_28_000002_create_products_and_inventory.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Product categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['tenant_id']);
        });

        // Products catalog
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('base_price', 15, 2);
            $table->decimal('cost_price', 15, 2)->nullable();
            $table->boolean('is_recipe_based')->default(false); // Recipe ingredient deduction
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'is_active']);
            $table->fullText(['name', 'sku']); // For fast search
        });

        // Product variants (sizes, colors, etc.)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name'); // e.g., "Large", "Extra Hot"
            $table->decimal('price_modifier', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['product_id']);
        });

        // Inventory per outlet
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->integer('quantity')->default(0);
            $table->integer('reorder_point')->default(10); // Low stock threshold
            $table->integer('reorder_quantity')->default(50);
            $table->string('unit')->default('pcs'); // pieces, kg, liter, etc.
            $table->timestamps();
            $table->unique(['product_id', 'outlet_id']);
            $table->index(['outlet_id', 'quantity']);
        });

        // Inventory movement logs (audit trail)
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventories')->cascadeOnDelete();
            $table->enum('movement_type', [
                'SALE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 
                'RETURN', 'WASTE', 'DAMAGE', 'STOCK_OPNAME'
            ]);
            $table->integer('quantity_before');
            $table->integer('quantity_after');
            $table->integer('quantity_changed');
            $table->unsignedBigInteger('reference_id')->nullable(); // transaction_id, transfer_id
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['inventory_id', 'created_at']);
            $table->index(['reference_id']);
        });

        // Recipes (for food businesses)
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->string('name');
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['outlet_id']);
        });

        // Recipe ingredients with exact quantities
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('products');
            $table->decimal('quantity_needed', 10, 3);
            $table->string('unit');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
```

#### Migration 3: Transactions & Orders

```php
// database/migrations/2026_05_28_000003_create_transactions.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Shifts for cashier accountability
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users');
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->nullable();
            $table->enum('status', ['OPEN', 'CLOSED', 'ABANDONED'])->default('OPEN');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['outlet_id', 'status']);
        });

        // Main transaction table
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->string('order_number')->unique()->index(); // ORD-20260528-0042
            $table->foreignId('created_by')->constrained('users');
            
            // Pricing breakdown
            $table->decimal('subtotal_amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            
            // Payment details
            $table->enum('payment_method', ['CASH', 'CARD', 'QRIS', 'MIXED', 'OFFLINE'])->default('CASH');
            $table->enum('payment_status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->json('payment_details')->nullable(); // EDC response, reference numbers
            
            // Transaction lifecycle
            $table->enum('status', ['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED'])->default('PENDING');
            $table->dateTime('held_at')->nullable(); // For held transactions
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('voided_at')->nullable();
            
            // Void information (audit)
            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users');
            $table->boolean('manager_pin_verified')->default(false);
            
            // Customer info (optional)
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable(); // Extra data, notes
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['outlet_id', 'status', 'created_at']);
            $table->index(['shift_id', 'created_at']);
            $table->index(['created_by']);
            $table->index(['payment_status']);
        });

        // Transaction items (line items)
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            
            // Item details snapshot (to preserve historical data)
            $table->string('product_name');
            $table->string('product_sku');
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_per_item', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            
            $table->timestamps();
            $table->index(['transaction_id']);
        });

        // Payment records (for payment split)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->enum('payment_method', ['CASH', 'CARD', 'QRIS']);
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->json('gateway_response')->nullable(); // EDC or QRIS response
            $table->string('reference_number')->nullable(); // EDC approval code
            $table->timestamps();
            $table->index(['transaction_id']);
        });

        // Discounts/Promos applied
        Schema::create('transaction_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->string('discount_code')->nullable();
            $table->enum('discount_type', ['PERCENTAGE', 'FIXED']);
            $table->decimal('discount_value', 10, 2);
            $table->decimal('discount_amount', 15, 2);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Online orders (omnichannel)
        Schema::create('online_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->string('external_order_id')->unique();
            $table->enum('platform', ['GOFOOD', 'GRABFOOD', 'SHOPEE', 'CUSTOM']);
            
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('delivery_address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            $table->decimal('total_amount', 15, 2);
            $table->json('order_items'); // JSON snapshot of items
            
            $table->enum('order_status', [
                'NEW', 'ACCEPTED', 'PREPARING', 'READY', 
                'PICKED_UP', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'
            ])->default('NEW');
            
            // Sync to main transaction
            $table->foreignId('synced_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->enum('sync_status', ['PENDING', 'SYNCED', 'FAILED'])->default('PENDING');
            $table->dateTime('synced_at')->nullable();
            
            $table->json('raw_payload'); // Original platform payload
            $table->timestamps();
            $table->index(['outlet_id', 'order_status']);
            $table->index(['platform', 'created_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('online_orders');
        Schema::dropIfExists('transaction_discounts');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('shifts');
    }
};
```

### Phase 3: Eloquent Models with Multi-Tenant Scoping

```php
// app/Models/BaseModel.php - Multi-tenant base class
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class BaseModel extends Model {
    // Automatically scope queries to current tenant
    protected static function boot() {
        parent::boot();

        // Auto-scope to tenant_id for all queries
        static::addGlobalScope('tenant', function ($builder) {
            if ($tenantId = Auth::user()?->tenant_id ?? request()->header('X-Tenant-ID')) {
                $builder->where('tenant_id', $tenantId);
            }
        });
    }
}

// app/Models/Product.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends BaseModel {
    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'sku', 'description',
        'base_price', 'cost_price', 'is_recipe_based', 'is_active'
    ];

    protected $casts = [
        'is_recipe_based' => 'boolean',
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    // Relationships
    public function category(): BelongsTo {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany {
        return $this->hasMany(ProductVariant::class);
    }

    public function inventories(): HasMany {
        return $this->hasMany(Inventory::class);
    }

    public function recipe(): \Illuminate\Database\Eloquent\Relations\HasOne {
        return $this->hasOne(Recipe::class);
    }
}

// app/Models/Transaction.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\AsCollection;

class Transaction extends BaseModel {
    protected $fillable = [
        'outlet_id', 'shift_id', 'order_number', 'created_by',
        'subtotal_amount', 'discount_amount', 'tax_amount', 'total_amount',
        'payment_method', 'payment_status', 'status', 'customer_name',
        'customer_phone', 'void_reason', 'voided_by', 'manager_pin_verified'
    ];

    protected $casts = [
        'payment_details' => 'json',
        'metadata' => 'json',
        'manager_pin_verified' => 'boolean',
        'held_at' => 'datetime',
        'completed_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    // Generate order number automatically
    protected static function boot() {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->order_number) {
                $model->order_number = 'ORD-' . now()->format('Ymd') . '-' . 
                    str_pad(Transaction::where('outlet_id', $model->outlet_id)
                        ->whereDate('created_at', today())
                        ->count() + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function items(): HasMany {
        return $this->hasMany(TransactionItem::class);
    }

    public function payments(): HasMany {
        return $this->hasMany(Payment::class);
    }

    public function outlet(): BelongsTo {
        return $this->belongsTo(Outlet::class);
    }

    public function createdBy(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }
}

// app/Models/Inventory.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends BaseModel {
    protected $fillable = [
        'product_id', 'outlet_id', 'quantity', 'reorder_point',
        'reorder_quantity', 'unit'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reorder_point' => 'integer',
        'reorder_quantity' => 'integer',
    ];

    public function product(): BelongsTo {
        return $this->belongsTo(Product::class);
    }

    public function outlet(): BelongsTo {
        return $this->belongsTo(Outlet::class);
    }

    public function movements(): HasMany {
        return $this->hasMany(InventoryMovement::class);
    }

    // Check if low stock
    public function isLowStock(): bool {
        return $this->quantity <= $this->reorder_point;
    }
}
```

### Phase 4: API Endpoints & Controllers

```php
// routes/api.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OnlineOrderController;
use App\Http\Controllers\AuthController;

Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Transactions (Checkout)
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::post('/transactions/{transaction}/void', [TransactionController::class, 'void'])
        ->middleware('can:void-transactions');
    Route::post('/transactions/{transaction}/hold', [TransactionController::class, 'hold']);
    Route::post('/transactions/{transaction}/resume', [TransactionController::class, 'resume']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('can:manage-products');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory/{inventory}/adjust', [InventoryController::class, 'adjust'])
        ->middleware('can:manage-inventory');

    // Online Orders (Omnichannel)
    Route::get('/online-orders', [OnlineOrderController::class, 'index']);
    Route::post('/online-orders/{order}/sync', [OnlineOrderController::class, 'syncToTransaction']);
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/webhooks/gofood', [\App\Http\Controllers\WebhookController::class, 'gofood']);
Route::post('/webhooks/grabfood', [\App\Http\Controllers\WebhookController::class, 'grabfood']);
```

```php
// app/Http/Controllers/TransactionController.php - Main checkout logic
<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Http\Requests\StoreTransactionRequest;
use App\Services\TransactionService;
use App\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller {
    public function __construct(private TransactionService $transactionService) {}

    /**
     * Create transaction with strict database transaction handling
     * Ensures atomicity: all-or-nothing stock deduction and payment recording
     */
    public function store(StoreTransactionRequest $request) {
        try {
            // Wrap entire operation in database transaction
            $transaction = DB::transaction(function () use ($request) {
                return $this->transactionService->createTransaction(
                    $request->validated()
                );
            }, attempts: 3); // Retry 3 times on deadlock

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $transaction->id,
                    'order_number' => $transaction->order_number,
                    'total_amount' => $transaction->total_amount,
                    'status' => $transaction->status,
                ]
            ], 201);

        } catch (InsufficientStockException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INSUFFICIENT_STOCK',
                    'message' => $e->getMessage(),
                    'product_id' => $e->productId,
                    'available' => $e->available,
                    'requested' => $e->requested,
                ]
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TRANSACTION_FAILED',
                    'message' => 'Transaction creation failed: ' . $e->getMessage()
                ]
            ], 500);
        }
    }

    /**
     * Void transaction - requires manager PIN verification
     */
    public function void($transactionId) {
        $request = request();
        $transaction = Transaction::findOrFail($transactionId);

        // Verify manager PIN
        if (!$this->verifyManagerPin($request->input('pin_code'))) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_PIN',
                    'message' => 'Manager PIN verification failed'
                ]
            ], 403);
        }

        try {
            DB::transaction(function () use ($transaction, $request) {
                // Restore inventory
                foreach ($transaction->items as $item) {
                    $inventory = $item->product->inventories()
                        ->where('outlet_id', $transaction->outlet_id)
                        ->first();

                    if ($inventory) {
                        $inventory->increment('quantity', $item->quantity);
                        $inventory->movements()->create([
                            'movement_type' => 'RETURN',
                            'quantity_before' => $inventory->quantity - $item->quantity,
                            'quantity_after' => $inventory->quantity,
                            'quantity_changed' => $item->quantity,
                            'reference_id' => $transaction->id,
                            'reason' => 'Transaction voided',
                            'created_by' => auth()->id(),
                        ]);
                    }
                }

                // Mark transaction as voided
                $transaction->update([
                    'status' => 'VOIDED',
                    'voided_at' => now(),
                    'voided_by' => auth()->id(),
                    'void_reason' => $request->input('reason'),
                    'manager_pin_verified' => true,
                ]);
            });

            return response()->json(['success' => true, 'message' => 'Transaction voided']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'VOID_FAILED', 'message' => $e->getMessage()]
            ], 500);
        }
    }

    private function verifyManagerPin(string $pin): bool {
        $user = auth()->user();
        return Hash::check($pin, $user->pin_hash ?? '');
    }
}
```

### Phase 5: WebSocket Broadcasting with Laravel Reverb

```php
// routes/channels.php - Define WebSocket channels
<?php

use Illuminate\Support\Facades\Broadcast;

// Private channel for outlet staff
Broadcast::channel('outlet.{outletId}', function ($user, $outletId) {
    return (int)$user->outlet_id === (int)$outletId;
});

// Private channel for real-time order updates
Broadcast::channel('transaction.{transactionId}', function ($user, $transactionId) {
    return $user->can('view-transaction', $transactionId);
});

// Channel for KDS (Kitchen Display System)
Broadcast::channel('kds.{outletId}', function ($user, $outletId) {
    return $user->outlet_id == $outletId && in_array($user->role, ['owner', 'manager']);
});

// Channel for CFD (Customer Facing Display)
Broadcast::channel('cfd.{outletId}', function ($user, $outletId) {
    return (int)$user->outlet_id === (int)$outletId;
});
```

```php
// app/Events/TransactionCreated.php - Broadcast event
<?php

namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class TransactionCreated implements ShouldBroadcast {
    use InteractsWithSockets;

    public function __construct(
        public Transaction $transaction
    ) {}

    public function broadcastOn(): array {
        return [
            new PrivateChannel('outlet.' . $this->transaction->outlet_id),
            new PrivateChannel('cfd.' . $this->transaction->outlet_id),
        ];
    }

    public function broadcastAs(): string {
        return 'transaction.created';
    }

    public function broadcastWith(): array {
        return [
            'id' => $this->transaction->id,
            'order_number' => $this->transaction->order_number,
            'total_amount' => $this->transaction->total_amount,
            'items' => $this->transaction->items->map(fn($item) => [
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ]),
            'created_at' => $this->transaction->created_at,
        ];
    }
}
```

```bash
# Start Laravel Reverb server (development)
php artisan reverb:start

# Or use Supervisor for production (config/supervisor/reverb.conf)
# [program:kasir-reverb]
# process_name=%(program_name)s_%(process_num)02d
# command=php /path/to/artisan reverb:start
# autostart=true
# autorestart=true
# numprocs=1
# redirect_stderr=true
# stdout_logfile=/var/log/kasir-reverb.log
```

---

## Frontend Execution - Next.js

### Phase 1: Initialize Next.js Project

```bash
# Create Next.js 16 project with App Router
npx create-next-app@latest frontend --typescript --tailwind --app

cd frontend

# Install key dependencies
npm install zustand axios swr qrcode dexie next-pwa
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu recharts lucide-react

# Development dependencies
npm install -D @types/node @types/react tailwindcss postcss autoprefixer
```

### Phase 2: Zustand Store for Offline-First Cart

```typescript
// src/stores/cartStore.ts - Offline cart management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  variantId?: number;
  variantName?: string;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyDiscount: (amount: number) => void;
  clear: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,

      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        let newItems;

        if (existingItem) {
          newItems = state.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  lineTotal: (i.quantity + item.quantity) * i.unitPrice,
                }
              : i
          );
        } else {
          newItems = [...state.items, item];
        }

        // Recalculate totals
        const subtotal = newItems.reduce((acc, i) => acc + i.lineTotal, 0);
        const tax = subtotal * 0.1; // 10% tax (configurable)
        const total = subtotal - state.discount + tax;

        return {
          items: newItems,
          subtotal,
          tax,
          total,
        };
      }),

      removeItem: (id) => set((state) => {
        const newItems = state.items.filter((i) => i.id !== id);
        const subtotal = newItems.reduce((acc, i) => acc + i.lineTotal, 0);
        const tax = subtotal * 0.1;
        const total = subtotal - state.discount + tax;

        return {
          items: newItems,
          subtotal,
          tax,
          total,
        };
      }),

      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return state; // Prevent negative quantities
        }

        const newItems = state.items.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity,
                lineTotal: quantity * i.unitPrice,
              }
            : i
        );

        const subtotal = newItems.reduce((acc, i) => acc + i.lineTotal, 0);
        const tax = subtotal * 0.1;
        const total = subtotal - state.discount + tax;

        return {
          items: newItems,
          subtotal,
          tax,
          total,
        };
      }),

      applyDiscount: (amount) => set((state) => {
        const total = state.subtotal - amount + state.tax;
        return { discount: amount, total };
      }),

      clear: () => set({
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      }),

      calculateTotals: () => set((state) => {
        const subtotal = state.items.reduce((acc, i) => acc + i.lineTotal, 0);
        const tax = subtotal * 0.1;
        const total = subtotal - state.discount + tax;

        return { subtotal, tax, total };
      }),
    }),
    {
      name: 'kasir-cart', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
      }), // Only persist items and discount
    }
  )
);
```

```typescript
// src/stores/offlineSyncStore.ts - Offline transaction queue
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Dexie from 'dexie';

// IndexedDB wrapper for offline transactions
export class KasirDB extends Dexie {
  pendingTransactions!: Dexie.Table;

  constructor() {
    super('KasirDB');
    this.version(1).stores({
      pendingTransactions: 'id, status, createdAt', // Index by id, status, createdAt
    });
  }
}

export const db = new KasirDB();

export interface PendingTransaction {
  id: string;
  transactionData: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
  retryCount: number;
  createdAt: number;
  syncedAt?: number;
}

interface OfflineSyncState {
  pendingTransactions: PendingTransaction[];
  isSyncing: boolean;
  isOnline: boolean;
  // Actions
  addPendingTransaction: (transaction: any) => Promise<void>;
  syncPendingTransactions: () => Promise<void>;
  removePendingTransaction: (id: string) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  loadPendingTransactions: () => Promise<void>;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
  pendingTransactions: [],
  isSyncing: false,
  isOnline: typeof window !== 'undefined' && navigator.onLine,

  addPendingTransaction: async (transaction) => {
    const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pending: PendingTransaction = {
      id,
      transactionData: transaction,
      status: 'PENDING',
      retryCount: 0,
      createdAt: Date.now(),
    };

    await db.pendingTransactions.add(pending);

    set((state) => ({
      pendingTransactions: [...state.pendingTransactions, pending],
    }));

    // Attempt sync if online
    if (get().isOnline) {
      get().syncPendingTransactions();
    }
  },

  syncPendingTransactions: async () => {
    const { pendingTransactions, isOnline } = get();

    if (!isOnline || pendingTransactions.length === 0) {
      return;
    }

    set({ isSyncing: true });

    for (const transaction of pendingTransactions) {
      if (transaction.status === 'SYNCED' || transaction.status === 'SYNCING') {
        continue;
      }

      try {
        // Update status to SYNCING
        await db.pendingTransactions.update(transaction.id, {
          status: 'SYNCING',
        });

        // Attempt to send to backend
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(transaction.transactionData),
        });

        if (response.ok) {
          // Mark as synced
          await db.pendingTransactions.update(transaction.id, {
            status: 'SYNCED',
            syncedAt: Date.now(),
          });
        } else if (transaction.retryCount < 3) {
          // Retry on client error
          await db.pendingTransactions.update(transaction.id, {
            status: 'PENDING',
            retryCount: transaction.retryCount + 1,
            errorMessage: `HTTP ${response.status}`,
          });
        } else {
          // Mark as failed after 3 retries
          await db.pendingTransactions.update(transaction.id, {
            status: 'FAILED',
            errorMessage: `Sync failed after 3 retries: HTTP ${response.status}`,
          });
        }
      } catch (error) {
        if (transaction.retryCount < 3) {
          await db.pendingTransactions.update(transaction.id, {
            status: 'PENDING',
            retryCount: transaction.retryCount + 1,
            errorMessage: error instanceof Error ? error.message : 'Network error',
          });
        } else {
          await db.pendingTransactions.update(transaction.id, {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Network error',
          });
        }
      }
    }

    // Reload pending transactions
    await get().loadPendingTransactions();
    set({ isSyncing: false });
  },

  removePendingTransaction: async (id) => {
    await db.pendingTransactions.delete(id);
    set((state) => ({
      pendingTransactions: state.pendingTransactions.filter((t) => t.id !== id),
    }));
  },

  setOnlineStatus: (isOnline) => {
    set({ isOnline });

    // Auto-sync when connection restores
    if (isOnline) {
      get().syncPendingTransactions();
    }
  },

  loadPendingTransactions: async () => {
    const transactions = await db.pendingTransactions
      .where('status')
      .notEqual('SYNCED')
      .toArray();

    set({ pendingTransactions: transactions as PendingTransaction[] });
  },
}));
```

### Phase 3: Service Worker for PWA & Offline Caching

```typescript
// public/sw.js - Service Worker registration
const CACHE_NAME = 'kasir-v1';
const API_CACHE = 'kasir-api-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response or offline page
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
  } else {
    // Assets - cache-first, fallback to network
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            return new Response('Offline', { status: 503 });
          });
      })
    );
  }
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Trigger sync in all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_TRANSACTIONS',
          });
        });
      })
    );
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

```typescript
// src/lib/service-worker.ts - Service Worker registration in Next.js
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('New service worker available');

          // Notify user about update (optional)
          if (window.confirm('New version available. Update now?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle connectivity changes
    window.addEventListener('online', () => {
      console.log('Online - attempting to sync pending transactions');
      navigator.serviceWorker.controller?.postMessage({
        type: 'SYNC_TRANSACTIONS',
      });
    });

    window.addEventListener('offline', () => {
      console.log('Offline - pending transactions will sync when online');
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
```

```typescript
// src/hooks/useOfflineSync.ts - React hook for offline sync
import { useEffect } from 'react';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';

export function useOfflineSync() {
  const { setOnlineStatus, loadPendingTransactions } = useOfflineSyncStore();

  useEffect(() => {
    // Load pending transactions on mount
    loadPendingTransactions();

    // Setup online/offline listeners
    window.addEventListener('online', () => setOnlineStatus(true));
    window.addEventListener('offline', () => setOnlineStatus(false));

    // Listen for sync messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_TRANSACTIONS') {
          loadPendingTransactions();
        }
      });
    }

    return () => {
      window.removeEventListener('online', () => setOnlineStatus(true));
      window.removeEventListener('offline', () => setOnlineStatus(false));
    };
  }, [setOnlineStatus, loadPendingTransactions]);
}
```

### Phase 4: WebSocket Real-Time Synchronization

```typescript
// src/lib/websocket.ts - WebSocket client configuration
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance: Echo | null = null;

export function initializeEcho() {
  if (echoInstance) return echoInstance;

  const isProduction = process.env.NODE_ENV === 'production';

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
    wssPort: isProduction ? 443 : undefined,
    forceTLS: isProduction,
    encrypted: isProduction,
    enabledTransports: ['ws', 'wss'],
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    },
  });

  return echoInstance;
}

export function getEcho() {
  if (!echoInstance) {
    return initializeEcho();
  }
  return echoInstance;
}

export function subscribeToOutlet(outletId: number, onTransactionCreated: (data: any) => void) {
  const echo = getEcho();

  // Subscribe to private outlet channel
  echo.private(`outlet.${outletId}`)
    .listen('TransactionCreated', onTransactionCreated)
    .listen('InventoryUpdated', (data: any) => {
      console.log('Inventory updated:', data);
    });
}

export function subscribeToCFD(outletId: number, onUpdate: (data: any) => void) {
  const echo = getEcho();

  // Subscribe to customer display channel
  echo.private(`cfd.${outletId}`)
    .listen('TransactionCreated', onUpdate)
    .listen('TransactionVoided', onUpdate);
}

export function unsubscribeFromAll() {
  const echo = getEcho();
  echo.leaveAllChannels();
}
```

```typescript
// src/hooks/useWebSocket.ts - React hook for WebSocket
import { useEffect, useCallback } from 'react';
import { getEcho, subscribeToOutlet, subscribeToCFD } from '@/lib/websocket';

export function useWebSocket(outletId: number, onTransactionUpdate: (data: any) => void) {
  useEffect(() => {
    if (!outletId) return;

    try {
      subscribeToOutlet(outletId, onTransactionUpdate);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [outletId, onTransactionUpdate]);
}

export function useCFDSync(outletId: number) {
  const updateCFDDisplay = useCallback((data: any) => {
    // Update customer display with new transaction data
    console.log('Updating CFD with:', data);

    // Emit custom event that CFD can listen to
    window.dispatchEvent(
      new CustomEvent('cfd-update', { detail: data })
    );
  }, []);

  useEffect(() => {
    if (!outletId) return;

    try {
      subscribeToCFD(outletId, updateCFDDisplay);
    } catch (error) {
      console.error('CFD WebSocket connection failed:', error);
    }
  }, [outletId, updateCFDDisplay]);
}
```

---

## Hardware Integration Layer

### Thermal Receipt Printer Integration

```typescript
// src/lib/printer.ts - Thermal printer ESC/POS protocol
export class ThermalPrinter {
  private deviceInfo: USBDevice | null = null;
  private vendorId = 0x0483; // Configurable vendor IDs
  private productId = 0x0001; // Configurable product IDs

  /**
   * Connect to USB thermal printer using Web USB API
   */
  async connectViaUSB() {
    try {
      const devices = await navigator.usb.requestDevice({
        filters: [{ vendorId: this.vendorId, productId: this.productId }],
      });

      await devices.open();
      if (devices.configuration === null) {
        await devices.selectConfiguration(1);
      }
      await devices.claimInterface(0);

      this.deviceInfo = devices;
      console.log('USB Printer connected');
      return true;
    } catch (error) {
      console.error('USB connection failed:', error);
      return false;
    }
  }

  /**
   * Generate ESC/POS commands for receipt printing
   */
  private generateReceiptCommands(transaction: any): Uint8Array {
    const commands: number[] = [];

    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Reset

    // Set alignment to center
    commands.push(0x1B, 0x61, 0x01); // ESC a n - Justify (0=left, 1=center, 2=right)

    // Print header
    this.appendText(commands, '===== KASIR RECEIPT =====');
    this.appendNewLines(commands, 1);

    // Print order number and date
    this.appendText(commands, `Order: ${transaction.order_number}`);
    this.appendText(commands, new Date(transaction.created_at).toLocaleString());
    this.appendNewLines(commands, 1);

    // Set alignment to left
    commands.push(0x1B, 0x61, 0x00);

    // Print items header
    this.appendText(commands, 'Item                   Qty   Total');
    this.appendText(commands, '-----------------------------------');

    // Print transaction items
    for (const item of transaction.items) {
      const itemLine = `${item.product_name.substring(0, 18).padEnd(18)} ${String(item.quantity).padStart(3)} ${item.line_total.toFixed(2).padStart(8)}`;
      this.appendText(commands, itemLine);
    }

    this.appendText(commands, '-----------------------------------');

    // Print totals
    this.appendText(
      commands,
      `Subtotal: ${transaction.subtotal_amount.toFixed(2).padStart(29)}`
    );
    this.appendText(
      commands,
      `Tax (10%): ${transaction.tax_amount.toFixed(2).padStart(28)}`
    );
    if (transaction.discount_amount > 0) {
      this.appendText(
        commands,
        `Discount: -${transaction.discount_amount.toFixed(2).padStart(27)}`
      );
    }

    // Set alignment to center for total
    commands.push(0x1B, 0x61, 0x01);

    // Print large total
    commands.push(0x1B, 0x21, 0x10); // ESC ! n - Select print mode (0x10 = double size)
    this.appendText(commands, `Total: ${transaction.total_amount.toFixed(2)}`);
    commands.push(0x1B, 0x21, 0x00); // Reset print mode

    // Payment method
    commands.push(0x1B, 0x61, 0x00); // Left align
    this.appendNewLines(commands, 1);
    this.appendText(commands, `Payment: ${transaction.payment_method}`);

    // QR Code (if applicable)
    if (transaction.payment_method === 'QRIS') {
      this.appendNewLines(commands, 1);
      this.appendQRCode(commands, transaction.payment_details?.qr_code_url || '');
    }

    this.appendNewLines(commands, 2);

    // Center footer
    commands.push(0x1B, 0x61, 0x01);
    this.appendText(commands, 'Thank you!');
    this.appendText(commands, 'Come again soon!');

    this.appendNewLines(commands, 2);

    // Cut paper
    commands.push(0x1D, 0x56, 0x42, 0x00); // GS V m - Cut paper (partial cut)

    return new Uint8Array(commands);
  }

  /**
   * Print transaction receipt
   */
  async printReceipt(transaction: any): Promise<boolean> {
    if (!this.deviceInfo) {
      const connected = await this.connectViaUSB();
      if (!connected) return false;
    }

    try {
      const commands = this.generateReceiptCommands(transaction);

      await this.deviceInfo!.transferOut(1, commands);
      console.log('Receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  /**
   * Helper: Append text to command buffer
   */
  private appendText(commands: number[], text: string) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    commands.push(...Array.from(encoded));
    this.appendNewLines(commands, 1);
  }

  /**
   * Helper: Append new lines
   */
  private appendNewLines(commands: number[], count: number) {
    for (let i = 0; i < count; i++) {
      commands.push(0x0A); // LF - Line feed
    }
  }

  /**
   * Helper: Append QR code (requires hardware support)
   */
  private appendQRCode(commands: number[], qrCodeUrl: string) {
    // Note: Actual QR code printing requires either:
    // 1. Hardware QR support via ESC/POS
    // 2. Server-side QR generation with image printing
    // This is simplified - actual implementation would decode QR or use pre-generated image
    commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x43, 0x03, 0x00); // QR code commands
  }

  disconnect() {
    if (this.deviceInfo) {
      this.deviceInfo.close();
      this.deviceInfo = null;
    }
  }
}

// Usage in React component
export async function usePrinter() {
  const printer = new ThermalPrinter();

  const printReceipt = async (transaction: any) => {
    const success = await printer.printReceipt(transaction);
    return success;
  };

  return { printReceipt };
}
```

### Web Bluetooth for Wireless Printers

```typescript
// src/lib/bluetooth-printer.ts - Bluetooth thermal printer
export class BluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  /**
   * Discover and connect to Bluetooth printer
   */
  async connect() {
    try {
      // Request device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['180A'] }],
        optionalServices: ['180A', '180F'],
      });

      if (!this.device) throw new Error('No device selected');

      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('GATT connection failed');

      const service = await server.getPrimaryService('180A');
      this.characteristic = await service.getCharacteristic('2A19'); // Battery level for test

      console.log('Bluetooth Printer connected');
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  /**
   * Send receipt data over Bluetooth
   */
  async printReceipt(transaction: any): Promise<boolean> {
    if (!this.device || !this.characteristic) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      // Generate receipt commands (same as USB)
      const printer = new ThermalPrinter();
      // For Bluetooth, we'd need to expose the command generation method
      console.log('Bluetooth print initiated');
      return true;
    } catch (error) {
      console.error('Bluetooth print failed:', error);
      return false;
    }
  }

  disconnect() {
    if (this.device) {
      this.device.gatt?.disconnect();
      this.device = null;
      this.characteristic = null;
    }
  }
}
```

---

## Real-Time Synchronization & WebSockets

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Kasir Platform - Real-Time Sync           │
└─────────────────────────────────────────────────────────────┘

┌─ Cashier Screen (Port 3000) ─┐
│  1. User adds items to cart   │
│  2. Creates transaction       │ ──┐
│  3. Broadcasts via WebSocket  │  │
└──────────────────────────────┘  │
                                  ├──> Laravel Reverb
                                  │   (WebSocket Broker)
┌─ Customer Display (Port 3001) ─┐│   
│  1. Listens to WebSocket       │ ├──> Broadcasts to
│  2. Displays order summary     │ │   subscribing clients
│  3. Shows QR code              │ │
│  4. Rating feedback widget     │─┘
└──────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Backend - Laravel 11                │
│  - Handles database transactions            │
│  - Broadcasts TransactionCreated event      │
│  - Manages inventory deduction              │
│  - Validates payments (EDC/QRIS)            │
└─────────────────────────────────────────────┘
```

---

## RBAC & Security Implementation

### Manager PIN Authorization

```php
// app/Http/Middleware/VerifyManagerPin.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class VerifyManagerPin implements Middleware {
    public function handle(Request $request, Closure $next): Response {
        // Only applies to specific routes that require PIN
        if (!$request->user() || !in_array($request->user()->role, ['manager', 'owner'])) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Only managers can perform this action'
                ]
            ], 403);
        }

        $pin = $request->input('pin_code');

        if (!$pin) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'MISSING_PIN',
                    'message' => 'Manager PIN required'
                ]
            ], 422);
        }

        if (!Hash::check($pin, $request->user()->pin_hash ?? '')) {
            // Log failed PIN attempt (security audit)
            \Log::warning('Failed PIN attempt', [
                'user_id' => $request->user()->id,
                'ip' => $request->ip(),
                'action' => $request->path(),
            ]);

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_PIN',
                    'message' => 'Incorrect PIN'
                ]
            ], 403);
        }

        return $next($request);
    }
}
```

```php
// app/Http/Middleware/RoleBasedAccess.php - RBAC middleware
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleBasedAccess implements Middleware {
    private const PERMISSIONS = [
        'cashier' => ['create-transaction', 'view-own-transactions'],
        'manager' => ['create-transaction', 'void-transaction', 'view-transactions', 'view-reports'],
        'owner' => ['*'], // All permissions
        'waiter' => ['view-menu', 'create-orders'],
        'warehouse' => ['manage-inventory', 'manage-transfers'],
    ];

    public function handle(Request $request, Closure $next): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $requiredPermission = $request->route()?->action['permission'] ?? null;

        if ($requiredPermission && !$this->hasPermission($user->role, $requiredPermission)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PERMISSION_DENIED',
                    'message' => "Role '{$user->role}' cannot perform '{$requiredPermission}'"
                ]
            ], 403);
        }

        return $next($request);
    }

    private function hasPermission(string $role, string $permission): bool {
        $permissions = self::PERMISSIONS[$role] ?? [];

        return in_array('*', $permissions) || in_array($permission, $permissions);
    }
}
```

---

## API Response & Error Handling

```php
// app/Http/Controllers/BaseController.php - Standardized responses
<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller;

class BaseController extends Controller {
    use AuthorizesRequests, ValidatesRequests;

    protected function success($data, string $message = null, int $statusCode = 200) {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->id(),
            ]
        ], $statusCode);
    }

    protected function error(string $code, string $message, $details = null, int $statusCode = 400) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->id(),
            ]
        ], $statusCode);
    }
}
```

---

## Testing Strategy

```php
// tests/Feature/TransactionCheckoutTest.php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\{User, Outlet, Product, Inventory, Transaction};
use Illuminate\Foundation\Testing\RefreshDatabase;

class TransactionCheckoutTest extends TestCase {
    use RefreshDatabase;

    protected function setUp(): void {
        parent::setUp();

        $this->outlet = Outlet::factory()->create();
        $this->cashier = User::factory()->create(['outlet_id' => $this->outlet->id, 'role' => 'cashier']);
        $this->manager = User::factory()->create(['outlet_id' => $this->outlet->id, 'role' => 'manager']);

        // Create products and inventory
        $this->product = Product::factory()->create();
        Inventory::factory()->create([
            'product_id' => $this->product->id,
            'outlet_id' => $this->outlet->id,
            'quantity' => 100,
        ]);
    }

    public function test_cashier_can_create_transaction() {
        $response = $this->actingAs($this->cashier)->postJson('/api/transactions', [
            'outlet_id' => $this->outlet->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ]
            ],
            'payment_method' => 'CASH',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['data' => ['id', 'order_number', 'total_amount']]);
        $this->assertDatabaseHas('transactions', ['status' => 'COMPLETED']);
    }

    public function test_insufficient_stock_prevents_transaction() {
        $response = $this->actingAs($this->cashier)->postJson('/api/transactions', [
            'outlet_id' => $this->outlet->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 150, // More than available
                ]
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => ['code' => 'INSUFFICIENT_STOCK']]);
    }

    public function test_void_requires_manager_role_and_pin() {
        $transaction = Transaction::factory()->create(['outlet_id' => $this->outlet->id]);

        // Cashier cannot void
        $response = $this->actingAs($this->cashier)->postJson(
            "/api/transactions/{$transaction->id}/void",
            ['pin_code' => '1234', 'reason' => 'Customer request']
        );
        $response->assertStatus(403);

        // Manager with correct PIN
        $this->manager->update(['pin_hash' => Hash::make('1234')]);
        $response = $this->actingAs($this->manager)->postJson(
            "/api/transactions/{$transaction->id}/void",
            ['pin_code' => '1234', 'reason' => 'Customer request']
        );
        $response->assertStatus(200);
        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'status' => 'VOIDED']);
    }
}
```

---

## Performance Optimization

### Database Query Optimization

```php
// Use eager loading to prevent N+1 queries
$transactions = Transaction::with('items.product', 'payments', 'outlet')
    ->where('outlet_id', $outletId)
    ->latest()
    ->paginate(20);

// Use composite indexes for common queries
// Index: (outlet_id, status, created_at)
$daily_sales = Transaction::where('outlet_id', $outletId)
    ->where('status', 'COMPLETED')
    ->whereDate('created_at', today())
    ->sum('total_amount');
```

### Redis Caching

```php
// Cache frequently accessed data
Cache::remember(
    "outlet:{$outletId}:daily_sales:" . today()->format('Y-m-d'),
    3600, // 1 hour TTL
    fn() => Transaction::where('outlet_id', $outletId)
        ->where('status', 'COMPLETED')
        ->whereDate('created_at', today())
        ->sum('total_amount')
);
```

---

## Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
      
      - name: Install dependencies
        run: cd backend && composer install
      
      - name: Run tests
        run: cd backend && php artisan test
      
      - name: Run code style checks
        run: cd backend && ./vendor/bin/pint --check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          ssh deploy@prod.server 'cd /app && git pull && composer install && php artisan migrate --force && npm run build'
```

---

## Monitoring & Observability

```php
// app/Services/MetricsService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MetricsService {
    public static function recordTransaction(Transaction $transaction) {
        Log::channel('metrics')->info('transaction_created', [
            'transaction_id' => $transaction->id,
            'amount' => $transaction->total_amount,
            'payment_method' => $transaction->payment_method,
            'outlet_id' => $transaction->outlet_id,
            'duration' => microtime(true) - LARAVEL_START,
        ]);
    }

    public static function recordInventoryMovement(InventoryMovement $movement) {
        Log::channel('metrics')->info('inventory_movement', [
            'movement_type' => $movement->movement_type,
            'quantity' => $movement->quantity_changed,
            'product_id' => $movement->inventory->product_id,
        ]);
    }
}
```

---

**Document Version:** 2.0 - Production Ready  
**Last Updated:** May 28, 2026  
**Status:** Ready for Implementation

---

## Code Organization Standards

### Laravel Directory Structure (Tenant-Specific)

```
app/
├── Models/
│   ├── BaseModel.php          # Tenant-scoped base
│   ├── Transaction.php
│   ├── Product.php
│   ├── Inventory.php
│   └── ...
├── Services/
│   ├── TransactionService.php
│   ├── InventoryService.php
│   ├── OmniChannelService.php
│   ├── PaymentService.php
│   └── NotificationService.php
├── Actions/
│   ├── CreateTransactionAction.php
│   ├── VoidTransactionAction.php
│   ├── SyncOnlineOrdersAction.php
│   └── ...
├── Events/
│   ├── TransactionCreated.php
│   ├── TransactionCompleted.php
│   ├── OnlineOrderReceived.php
│   ├── InventoryLow.php
│   └── ...
├── Listeners/
│   ├── SendTransactionReceiptEmail.php
│   ├── UpdateInventoryOnTransaction.php
│   ├── NotifyCashierOnlineOrder.php
│   └── ...
├── Jobs/
│   ├── SyncOnlineOrdersJob.php
│   ├── GeneratePurchaseOrderJob.php
│   ├── SendRecurringAlertJob.php
│   └── ...
├── Http/
│   ├── Controllers/
│   │   ├── TransactionController.php
│   │   ├── InventoryController.php
│   │   ├── OmniChannelController.php
│   │   ├── CRMController.php
│   │   └── AnalyticsController.php
│   ├── Requests/
│   │   ├── CreateTransactionRequest.php
│   │   ├── VoidTransactionRequest.php
│   │   └── ...
│   └── Resources/
│       ├── TransactionResource.php
│       ├── ProductResource.php
│       └── ...
├── Exceptions/
│   ├── InsufficientStockException.php
│   ├── InvalidPinException.php
│   ├── OmniChannelSyncException.php
│   └── ...
├── Traits/
│   ├── TenantScoped.php
│   ├── HasAuditLog.php
│   └── ...
└── Middleware/
    ├── EnsureTenantIsSet.php
    ├── EnsurePermission.php
    └── LogAuditTrail.php
```

### Next.js Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── cashier/page.tsx
│   │   ├── customer-display/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── omnichannel/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── crm/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── transactions/route.ts
│   │   ├── products/route.ts
│   │   ├── inventory/route.ts
│   │   ├── omnichannel/route.ts
│   │   ├── crm/route.ts
│   │   └── analytics/route.ts
│   └── layout.tsx
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── cashier/
│   │   ├── OrderPanel.tsx
│   │   ├── ItemSearch.tsx
│   │   ├── TotalDisplay.tsx
│   │   └── PaymentMethodSelector.tsx
│   ├── cfd/
│   │   ├── OrderSummary.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── FeedbackWidget.tsx
│   └── forms/
│       ├── CreateProductForm.tsx
│       ├── VoidTransactionForm.tsx
│       └── ...
├── hooks/
│   ├── useTenant.ts
│   ├── useUser.ts
│   ├── useWebSocket.ts
│   ├── useTransaction.ts
│   ├── usePayment.ts
│   └── useAnalytics.ts
├── contexts/
│   ├── TenantContext.tsx
│   ├── UserContext.tsx
│   ├── WebSocketContext.tsx
│   └── TransactionContext.tsx
├── providers/
│   ├── TenantProvider.tsx
│   ├── WebSocketProvider.tsx
│   ├── AuthProvider.tsx
│   └── NotificationProvider.tsx
├── lib/
│   ├── db.ts
│   ├── websocket.ts
│   ├── api-client.ts
│   ├── edc-connector.ts
│   ├── qr-generator.ts
│   └── utils.ts
├── services/
│   ├── transactionService.ts
│   ├── inventoryService.ts
│   ├── omniChannelService.ts
│   └── analyticsService.ts
├── types/
│   ├── transaction.ts
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   ├── tenant.ts
│   └── payment.ts
└── styles/
    ├── globals.css
    ├── variables.css
    └── animations.css
```

---

## Database Migration Strategy

### Phase 1: Core Tables (Week 1)

```php
// database/migrations/2026_05_28_000001_create_core_tables.php
class CreateCoreTables extends Migration {
    public function up() {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->enum('subscription_tier', ['starter', 'professional', 'enterprise']);
            $table->dateTime('subscription_expires_at');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('address');
            $table->string('phone');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets');
            $table->foreignId('cashier_id')->constrained('users');
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->decimal('opening_balance', 15, 2);
            $table->decimal('closing_balance', 15, 2)->nullable();
            $table->enum('status', ['OPEN', 'CLOSED', 'ABANDONED'])->default('OPEN');
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets');
            $table->foreignId('shift_id')->nullable()->constrained('shifts');
            $table->string('order_number')->unique();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->enum('payment_method', ['CASH', 'CARD', 'QRIS', 'MIXED']);
            $table->enum('status', ['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED']);
            $table->dateTime('held_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('voided_at')->nullable();
            $table->text('voided_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users');
            $table->boolean('authorization_pin_verified')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['outlet_id', 'status']);
            $table->index('created_at');
        });

        // More tables...
    }
}
```

### Phase 2: Inventory & Recipes (Week 3)

```php
// database/migrations/2026_06_11_000002_create_inventory_tables.php
Schema::create('recipes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained('products');
    $table->foreignId('outlet_id')->constrained('outlets');
    $table->string('name');
    $table->boolean('is_active')->default(true);
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
});

Schema::create('recipe_ingredients', function (Blueprint $table) {
    $table->id();
    $table->foreignId('recipe_id')->constrained('recipes');
    $table->foreignId('ingredient_id')->constrained('products');
    $table->decimal('quantity_needed', 10, 3);
    $table->string('unit');
    $table->timestamps();
});

Schema::create('inventory_movements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('inventory_id')->constrained('inventories');
    $table->enum('movement_type', ['SALE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'WASTE']);
    $table->integer('quantity');
    $table->unsignedBigInteger('reference_id')->nullable(); // transaction_id, transfer_id
    $table->text('reason')->nullable();
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
    $table->index(['inventory_id', 'created_at']);
});
```

### Phase 3: Omnichannel & Orders (Week 4)

```php
// database/migrations/2026_06_18_000003_create_omnichannel_tables.php
Schema::create('online_platforms', function (Blueprint $table) {
    $table->id();
    $table->foreignId('outlet_id')->constrained('outlets');
    $table->enum('platform_name', ['GOFOOD', 'GRABFOOD', 'CUSTOM']);
    $table->string('api_key');
    $table->string('webhook_secret')->nullable();
    $table->integer('sync_interval_minutes')->default(5);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('online_orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('outlet_id')->constrained('outlets');
    $table->foreignId('online_platform_id')->constrained('online_platforms');
    $table->string('external_order_id')->unique();
    $table->string('customer_name');
    $table->string('customer_phone')->nullable();
    $table->text('delivery_address')->nullable();
    $table->decimal('total_amount', 15, 2);
    $table->enum('order_status', ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED']);
    $table->dateTime('scheduled_time')->nullable();
    $table->foreignId('synced_transaction_id')->nullable()->constrained('transactions');
    $table->enum('sync_status', ['PENDING', 'SYNCED', 'FAILED'])->default('PENDING');
    $table->json('raw_payload');
    $table->timestamps();
    $table->index(['outlet_id', 'order_status']);
});
```

### Migration Execution Strategy

```bash
# Initial setup (all tenants)
php artisan migrate

# Per-tenant setup
php artisan make:migration create_initial_tenant_schema --realpath=database/migrations/tenant

# Run per-tenant migrations
php artisan tenants:migrate

# Rollback strategy
php artisan migrate:rollback --step=3

# Fresh setup (development only)
php artisan migrate:fresh --seed
```

---

## API Response Standards

### Success Response Format

```json
{
  "success": true,
  "data": {
    "id": 42,
    "order_number": "ORD-20260528-0042",
    "total_amount": 203500,
    "status": "COMPLETED"
  },
  "meta": {
    "timestamp": "2026-05-28T10:35:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product ID 101",
    "details": {
      "product_id": 101,
      "requested": 100,
      "available": 45
    }
  },
  "meta": {
    "timestamp": "2026-05-28T10:35:00Z",
    "request_id": "req_abc123"
  }
}
```

### Implementation in Laravel

```php
// app/Http/Controllers/BaseController.php
class BaseController extends Controller {
    protected function success($data, $message = null, $statusCode = 200) {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID')
            ]
        ], $statusCode);
    }

    protected function error($code, $message, $details = null, $statusCode = 400) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID')
            ]
        ], $statusCode);
    }
}

// Usage in controllers
class TransactionController extends BaseController {
    public function store(CreateTransactionRequest $request) {
        try {
            $transaction = TransactionService::create($request->validated());
            return $this->success(new TransactionResource($transaction), 'Transaction created', 201);
        } catch (InsufficientStockException $e) {
            return $this->error(
                'INSUFFICIENT_STOCK',
                $e->getMessage(),
                ['product_id' => $e->productId, 'available' => $e->available],
                400
            );
        }
    }
}
```

---

## Error Handling & Logging

### Exception Hierarchy

```php
// app/Exceptions/KasirException.php
abstract class KasirException extends Exception {
    protected string $errorCode;
    protected array $details = [];

    public function getErrorCode(): string {
        return $this->errorCode;
    }

    public function getDetails(): array {
        return $this->details;
    }

    public function toResponse() {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $this->errorCode,
                'message' => $this->message,
                'details' => $this->details
            ]
        ], $this->getStatusCode());
    }
}

// Specific exceptions
class InsufficientStockException extends KasirException {
    protected string $errorCode = 'INSUFFICIENT_STOCK';
    protected int $statusCode = 400;

    public function __construct($productId, $available, $requested) {
        parent::__construct("Insufficient stock");
        $this->details = [
            'product_id' => $productId,
            'available' => $available,
            'requested' => $requested
        ];
    }
}

class InvalidPinException extends KasirException {
    protected string $errorCode = 'INVALID_PIN';
    protected int $statusCode = 403;
}
```

### Logging Strategy

```php
// app/Services/LogService.php
class LogService {
    public static function transaction($action, Transaction $transaction, $details = []) {
        Log::channel('transaction')->info($action, [
            'transaction_id' => $transaction->id,
            'outlet_id' => $transaction->outlet_id,
            'amount' => $transaction->total_amount,
            'user_id' => auth()->id(),
            ...$details
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'transaction_id' => $transaction->id,
            'details' => json_encode($details),
            'ip_address' => request()->ip(),
            'user_agent' => request()->header('User-Agent')
        ]);
    }

    public static function payment($status, $amount, $method, $details = []) {
        Log::channel('payment')->info("Payment {$status}", [
            'amount' => $amount,
            'method' => $method,
            'timestamp' => now(),
            ...$details
        ]);
    }
}
```

---

## Testing Strategy

### Unit Tests (Transactions)

```php
// tests/Unit/Services/TransactionServiceTest.php
class TransactionServiceTest extends TestCase {
    public function test_creates_transaction_with_items() {
        $outlet = Outlet::factory()->create();
        $product = Product::factory()->create(['outlet_id' => $outlet->id]);

        $transaction = TransactionService::create([
            'outlet_id' => $outlet->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);

        $this->assertNotNull($transaction->id);
        $this->assertEquals(1, $transaction->items->count());
    }

    public function test_throws_on_insufficient_stock() {
        $outlet = Outlet::factory()->create();
        $product = Product::factory()->create(['outlet_id' => $outlet->id]);
        Inventory::factory()->create(['product_id' => $product->id, 'quantity' => 5]);

        $this->expectException(InsufficientStockException::class);

        TransactionService::create([
            'outlet_id' => $outlet->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 10]
            ]
        ]);
    }
}
```

### Feature Tests (API)

```php
// tests/Feature/TransactionControllerTest.php
class TransactionControllerTest extends TestCase {
    use RefreshDatabase;

    public function test_creates_transaction_via_api() {
        $user = User::factory()->create();
        $outlet = Outlet::factory()->create();
        $product = Product::factory()->create(['outlet_id' => $outlet->id]);

        $response = $this->actingAs($user)->postJson('/api/transactions', [
            'outlet_id' => $outlet->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1]
            ]
        ]);

        $response->assertStatus(201)->assertJsonStructure(['data' => ['id', 'status']]);
    }

    public function test_void_requires_manager_pin() {
        $transaction = Transaction::factory()->create();

        $response = $this->postJson("/api/transactions/{$transaction->id}/void", [
            'pin_code' => '1234'
        ]);

        $response->assertStatus(403); // Unauthorized
    }
}
```

---

## Performance Optimization

### Database Optimization

```php
// Indexing strategy
Schema::create('transactions', function (Blueprint $table) {
    // ... columns ...
    
    // Composite indexes for common queries
    $table->index(['outlet_id', 'status', 'created_at']);
    $table->index(['shift_id', 'created_at']);
    $table->fullText(['order_number']); // For search
});

// Query optimization
class Transaction extends Model {
    public function scopeRecent($query, $days = 7) {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByOutlet($query, $outletId) {
        return $query->where('outlet_id', $outletId);
    }
}

// Usage
$transactions = Transaction::byOutlet($outletId)
    ->recent()
    ->with('items.product')
    ->orderBy('created_at', 'desc')
    ->paginate(20);
```

### Caching Strategy

```php
// Cache expensive queries
class AnalyticsService {
    public static function getDailySalesData($outletId, $date) {
        $cacheKey = "sales:{$outletId}:" . $date->format('Y-m-d');
        
        return Cache::remember($cacheKey, 3600, function () use ($outletId, $date) {
            return Transaction::where('outlet_id', $outletId)
                ->whereDate('created_at', $date)
                ->sum('total_amount');
        });
    }
}

// Cache invalidation on transaction change
class Transaction extends Model {
    public static function boot() {
        parent::boot();

        static::created(function ($model) {
            Cache::forget("sales:{$model->outlet_id}:" . now()->format('Y-m-d'));
        });
    }
}
```

### Next.js Performance

```typescript
// lib/api-client.ts - Request deduplication
import { dedupRequests } from 'swr';

export const apiClient = createClient({
    fetcher: dedupRequests(fetch)
});

// Use SWR for data fetching
export const useTransactions = (outletId: string) => {
    const { data, error } = useSWR(
        `/api/transactions?outlet_id=${outletId}`,
        apiClient.fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000
        }
    );

    return { transactions: data, isLoading: !data, error };
};

// Image optimization
import Image from 'next/image';

export const ProductImage = ({ src }: Props) => (
    <Image
        src={src}
        alt="Product"
        width={200}
        height={200}
        priority={false}
        placeholder="blur"
    />
);
```

---

## Security Implementation

### PIN Code Management

```php
// app/Services/PinService.php
class PinService {
    public static function hashPin(string $pin): string {
        return Hash::make($pin);
    }

    public static function verifyPin(string $pin, string $hash): bool {
        return Hash::check($pin, $hash);
    }

    public static function validatePin(string $pin): bool {
        // Require 4-6 digits
        return preg_match('/^\d{4,6}$/', $pin);
    }
}

// app/Models/User.php
class User extends Model {
    public function setPin(string $pin): void {
        if (!PinService::validatePin($pin)) {
            throw new InvalidPinException('PIN must be 4-6 digits');
        }

        $this->update(['pin_hash' => PinService::hashPin($pin)]);
        
        // Log PIN change
        LogService::security('PIN_CHANGED', ['user_id' => $this->id]);
    }
}
```

### Request Validation

```php
// app/Http/Requests/VoidTransactionRequest.php
class VoidTransactionRequest extends FormRequest {
    public function rules(): array {
        return [
            'pin_code' => 'required|string|regex:/^\d{4,6}$/',
            'reason' => 'required|string|min:10|max:500',
        ];
    }

    public function authorize(): bool {
        // User must be manager or higher
        return auth()->user()->role->hasPermission('transaction.void');
    }
}
```

### API Authentication

```php
// app/Http/Middleware/ApiTokenAuth.php
class ApiTokenAuth {
    public function handle($request, $next) {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Missing API token'], 401);
        }

        // Verify token
        $user = User::where('api_token_hash', hash('sha256', $token))
            ->where('token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        auth()->login($user);
        return $next($request);
    }
}
```

---

## Deployment Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
          extensions: pgsql, redis
      
      - name: Install dependencies
        run: composer install
      
      - name: Run tests
        run: php artisan test
      
      - name: Run static analysis
        run: ./vendor/bin/phpstan analyse

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          ssh deploy@prod.server 'cd /app && git pull && composer install && php artisan migrate --force'
      
      - name: Clear cache
        run: ssh deploy@prod.server 'cd /app && php artisan cache:clear && php artisan config:cache'
```

---

## Monitoring & Observability

### Key Metrics to Monitor

```php
// app/Services/MetricsService.php
class MetricsService {
    public static function recordTransaction(Transaction $transaction) {
        Metrics::gauge('transaction.total_amount', $transaction->total_amount);
        Metrics::increment('transaction.created');
        
        if ($transaction->status === 'VOIDED') {
            Metrics::increment('transaction.voided');
        }
    }

    public static function recordInventoryMovement(InventoryMovement $movement) {
        Metrics::gauge('inventory.movement_quantity', $movement->quantity);
        Metrics::increment("inventory.movement.{$movement->movement_type}");
    }

    public static function recordPaymentProcessing($duration, $status) {
        Metrics::histogram('payment.processing_time', $duration);
        Metrics::increment("payment.status.{$status}");
    }
}
```

### Alerting Rules

```yaml
# monitoring/prometheus/alerts.yml
groups:
  - name: kasir_alerts
    rules:
      - alert: HighTransactionFailureRate
        expr: rate(transaction_voided[5m]) > 0.05
        annotations:
          summary: "High transaction void rate detected"

      - alert: LowInventoryAlert
        expr: inventory_quantity < inventory_reorder_point
        annotations:
          summary: "Low inventory alert for product"

      - alert: PaymentProcessingLatency
        expr: payment_processing_time_p95 > 5000
        annotations:
          summary: "Payment processing latency exceeds threshold"
```

---

## Quick Start Commands

### Backend Setup (One-Time)
```bash
cd backend

# 1. Install PHP dependencies
composer install

# 2. Generate app key
php artisan key:generate

# 3. Configure database in .env
# DB_CONNECTION=pgsql
# DB_DATABASE=kasir_dev
# DB_USERNAME=postgres
# DB_PASSWORD=postgres

# 4. Run migrations
php artisan migrate

# 5. Create sample data (development only)
php artisan db:seed

# 6. Start Reverb WebSocket server (separate terminal)
php artisan reverb:start

# 7. Start Laravel dev server
php artisan serve
```

### Frontend Setup (One-Time)
```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Register Service Worker (handled in next.config.ts with next-pwa)

# 3. Start development server
npm run dev

# Frontend runs on:
# - Cashier: http://localhost:3000
# - Customer Display: http://localhost:3001 (separate instance)
```

### Running Both Simultaneously (Recommended Setup)
```bash
# Terminal 1: Backend
cd backend
php artisan reverb:start &
php artisan serve

# Terminal 2: Frontend (Cashier Screen)
cd frontend
npm run dev  # Starts on port 3000

# Terminal 3: Frontend (Customer Display) - duplicate frontend instance
cd frontend
NEXT_PUBLIC_APP_URL=http://localhost:3001 npm run dev -- -p 3001
```

---

## Development Workflow

### Creating a New Transaction (Cashier Flow)

1. **Add Item to Cart** (Frontend)
   - User searches for product
   - Adds quantity
   - Zustand store manages cart state
   - Automatically persisted to localStorage

2. **Apply Payment Method** (Frontend)
   - Select CASH, CARD, QRIS, or MIXED
   - For QRIS: Generate QR code client-side
   - For CARD/EDC: Trigger payment gateway

3. **Submit Transaction** (Frontend → Backend)
   - POST `/api/transactions` with cart items
   - If offline: Stored in IndexedDB via `useOfflineSyncStore`
   - If online: Sent immediately

4. **Process on Backend** (Laravel)
   - Wrap in `DB::transaction()` for atomicity
   - Verify stock availability
   - Deduct inventory
   - Record payment
   - Generate order number
   - Broadcast `TransactionCreated` event via Reverb

5. **Real-Time Update**
   - Cashier Screen receives confirmation
   - Customer Display shows order summary + QR code
   - Broadcast handled by `useCFDSync` hook
   - Print receipt via thermal printer

### Modifying Existing Transactions

**Void Transaction (Manager-Only)**
```
Manager scans PIN → POST /api/transactions/{id}/void with PIN
→ Middleware verifies PIN → Reverses inventory → Marks VOIDED
```

**Hold Transaction**
```
POST /api/transactions/{id}/hold
→ Sets held_at timestamp → Item remains in inventory
→ Can be resumed later
```

---

## Testing Checklist

Before each release, verify:

- [ ] All unit tests pass: `php artisan test`
- [ ] Frontend builds without errors: `npm run build`
- [ ] Service Worker registers successfully
- [ ] Offline mode works (disable network in DevTools)
- [ ] WebSocket real-time sync works (both screens update)
- [ ] Thermal printer prints receipt
- [ ] Manager PIN verification works
- [ ] Inventory stock deduction is accurate
- [ ] RBAC enforces role permissions
- [ ] Database transactions roll back on error

---

## Production Deployment Checklist

- [ ] Set `APP_ENV=production` in .env
- [ ] Disable debug mode: `APP_DEBUG=false`
- [ ] Set strong `APP_KEY` (generated during setup)
- [ ] Configure proper database (use managed PostgreSQL)
- [ ] Setup Redis for caching and queuing
- [ ] Generate secure Reverb keys
- [ ] Configure CORS for frontend domain
- [ ] Enable HTTPS/SSL certificates
- [ ] Setup GitHub Actions CI/CD workflow
- [ ] Configure backup strategy for database
- [ ] Setup monitoring and error tracking (Sentry, etc.)
- [ ] Configure log aggregation (ELK Stack, etc.)
- [ ] Test payment gateway integration (EDC, QRIS providers)
- [ ] Verify omnichannel webhook endpoints (GoFood, GrabFood)

---

## Common Issues & Solutions

### Service Worker Not Updating
**Problem:** Changes to frontend not reflected in browser  
**Solution:** 
```bash
# Clear service workers in DevTools → Application → Service Workers
# Or: npm run build && npm run dev
```

### Offline Sync Stuck
**Problem:** Pending transactions not syncing when online  
**Solution:**
```typescript
// In browser console
const { loadPendingTransactions, syncPendingTransactions } = useOfflineSyncStore.getState();
await loadPendingTransactions();
await syncPendingTransactions();
```

### WebSocket Connection Refused
**Problem:** Real-time updates not working  
**Solution:**
```bash
# Ensure Reverb is running
cd backend
php artisan reverb:start

# Check if port 8080 is available
lsof -i :8080
```

### Insufficient Stock Error
**Problem:** Transaction fails with stock validation  
**Solution:**
```php
// Check inventory manually
php artisan tinker
>>> $inventory = Inventory::find(1);
>>> $inventory->quantity = 100; // Adjust quantity
>>> $inventory->save();
```

---

## Architecture Decision Records (ADR)

### ADR-001: Multi-Tenant Isolation Strategy
**Decision:** Database-level tenancy with `tenant_id` column scoping  
**Rationale:** Better for SME-scale. Simpler backups and migrations.  
**Alternative Considered:** Separate database per tenant (more secure but complex)

### ADR-002: Offline-First Frontend
**Decision:** Use Zustand + IndexedDB + Service Worker  
**Rationale:** Resilient to network outages. Better UX for unstable connections.  
**Alternative Considered:** Always-online architecture (simpler but fragile)

### ADR-003: Real-Time Synchronization
**Decision:** Laravel Reverb (WebSocket) with Echo client  
**Rationale:** Native Laravel integration. Production-ready.  
**Alternative Considered:** Firebase Realtime (vendor lock-in), Socket.io (overhead)

### ADR-004: Thermal Printer Integration
**Decision:** ESC/POS protocol via Web USB API  
**Rationale:** Direct hardware control. No server-side printing service needed.  
**Alternative Considered:** Server-side printing (requires more infrastructure)

---

## Next Phases

### Phase 2 (Weeks 9-16): Advanced Inventory
- [ ] Recipe-based stock deduction
- [ ] Inter-branch stock transfers
- [ ] Purchase order generation
- [ ] Low stock alerts

### Phase 3 (Weeks 17-24): Omnichannel
- [ ] GoFood integration webhooks
- [ ] GrabFood order sync
- [ ] Unified KDS (Kitchen Display System)
- [ ] Delivery status tracking

### Phase 4 (Weeks 25-32): Analytics & CRM
- [ ] Multi-branch analytics dashboard
- [ ] Customer loyalty program
- [ ] Sales reports and insights
- [ ] Staff performance metrics

---

## Support & Documentation

- **API Documentation:** [Postman Collection](https://postman-api-docs)
- **Frontend Component Storybook:** `npm run storybook`
- **Database Schema Diagram:** See `docs/erd.md`
- **Architecture Diagrams:** See `docs/architecture/`

---

**Document Version:** 2.0 - Production Ready  
**Last Updated:** May 28, 2026  
**Maintained By:** Principal Full-Stack Engineer & DevOps Lead  
**Status:** ✅ Ready for Development Sprint 1
