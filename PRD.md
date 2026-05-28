# Product Requirement Document (PRD)
## Web-Based SaaS Point of Sale (POS) Application

**Project Name:** Kasir Platform  
**Version:** 1.0  
**Last Updated:** May 28, 2026  
**Target Market:** Small and Medium Enterprises (SMEs)  
**Technology Stack:** Next.js 16 (Frontend) | Laravel 11 (Backend) | PostgreSQL (Database)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Vision & Strategy](#product-vision--strategy)
3. [Phase Roadmap](#phase-roadmap)
4. [Multi-Tenant Architecture](#multi-tenant-architecture)
5. [Database Schema & ERD](#database-schema--erd)
6. [UI/UX Specification & Dual-Screen Design](#uiux-specification--dual-screen-design)
7. [Next.js Component Architecture](#nextjs-component-architecture)
8. [Real-Time Synchronization Strategy](#real-time-synchronization-strategy)
9. [Omnichannel Integration Framework](#omnichannel-integration-framework)
10. [Security & RBAC](#security--rbac)
11. [API Specifications](#api-specifications)
12. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

Kasir Platform is an enterprise-grade, multi-tenant SaaS POS system designed to serve SMEs with omnichannel capabilities. The platform consolidates direct walk-in transactions, online delivery orders (GoFood, GrabFood), and multi-outlet operations into a unified dashboard. 

**Key Differentiators:**
- Dual-screen hardware support (Cashier + Customer Display)
- Real-time omnichannel order consolidation
- Bank EDC machine integration for seamless payments
- Multi-outlet inventory management with recipe-based stock deduction
- Comprehensive analytics and CRM capabilities

---

## Product Vision & Strategy

### Market Position
Position Kasir as the **"Open-table meets Moka POS meets Shopify"** for SMEs—combining restaurant management, retail POS, and omnichannel selling in a single platform.

### Monetization Strategy
1. **Tiered SaaS Model:**
   - **Starter:** 1 Outlet, 5 Users, Basic Analytics ($29/month)
   - **Professional:** 5 Outlets, 25 Users, Advanced Analytics + API ($99/month)
   - **Enterprise:** Unlimited Outlets, Custom Users, Dedicated Support ($499+/month)

2. **Hardware Rental Program:**
   - Dual-screen display kit rental (Cashier + CFD): $50/month
   - EDC machine integration fee: $15/transaction

3. **Integration Marketplace:**
   - Delivery platform commissions (GoFood, GrabFood)
   - Payment gateway processing fees
   - Loyalty program integrations

### Core Success Metrics
- Transaction success rate: >99.5%
- Order fulfillment time: <2 seconds
- System uptime: >99.9%
- Customer adoption: >80% within 6 months

---

## Phase Roadmap

### Phase 1: Transaction Management & Omnichannel (Weeks 1-8)
**Objective:** Build core transaction engine with unified order management.

**Features:**
- Instant product search with barcode/SKU support
- Split bill operations with dynamic allocation
- Hold/Resume transaction capability
- Omnichannel order router (Walk-in → Online consolidation)
- Bank EDC API integration (Verifone, Ingenico compatibility)
- Real-time order status sync

**Deliverables:**
- Transaction service module
- Omnichannel order consolidator
- EDC integration layer
- WebSocket server setup

---

### Phase 2: Dual-Screen UI/UX & Customer Experience (Weeks 9-14)
**Objective:** Implement frictionless cashier interface + customer-facing display.

**Features:**
- Modern, touch-optimized cashier dashboard
- Customer Facing Display (CFD) with live order tracking
- Dynamic QRIS code generation
- Post-transaction customer feedback
- Digital e-Receipt generation (Email/SMS)
- Payment status visualization

**Deliverables:**
- Responsive Next.js component library
- CFD WebSocket synchronization
- QR code generation service
- Receipt template engine

---

### Phase 3: Advanced Inventory & Multi-Outlet (Weeks 15-20)
**Objective:** Enable inventory virtualization across branches.

**Features:**
- Recipe-based stock deduction (Ingredients → Finished Goods)
- Inter-branch stock transfer module
- Low-stock threshold alerts
- Supplier Purchase Order (PO) generation
- Inventory audit trails
- Barcode/SKU mapping

**Deliverables:**
- Inventory management system
- Stock transfer approval workflow
- Automated PO generation engine
- Audit log service

---

### Phase 4: Back-Office, Analytics & Security (Weeks 21-26)
**Objective:** Enterprise-grade back-office with comprehensive analytics.

**Features:**
- Role-Based Access Control (RBAC)
- Manager authorization PIN for void operations
- Customer CRM module
- Loyalty point tracking system
- Multi-branch consolidated analytics
- Real-time sales dashboard
- Shift management

**Deliverables:**
- RBAC permission matrix
- CRM module
- Analytics engine
- Shift management system

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    KASIR PLATFORM                       │
├─────────────────────────────────────────────────────────┤
│  Multi-Tenant Database Isolation (Schema-Based)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  TENANT 1        │    │  TENANT 2        │          │
│  │  (Restaurant A)  │    │  (Restaurant B)  │          │
│  ├──────────────────┤    ├──────────────────┤          │
│  │ Schema: tenant_1 │    │ Schema: tenant_2 │          │
│  │                  │    │                  │          │
│  │ - Users (5)      │    │ - Users (25)     │          │
│  │ - Outlets (1)    │    │ - Outlets (5)    │          │
│  │ - Products (100) │    │ - Products (500) │          │
│  │ - Inventory      │    │ - Inventory      │          │
│  │ - Transactions   │    │ - Transactions   │          │
│  │ - Orders (Online)│    │ - Orders (Online)│          │
│  └──────────────────┘    └──────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation Approach

**Database Isolation:**
```sql
-- Schema-based isolation (recommended for SMEs)
CREATE SCHEMA tenant_1;
CREATE SCHEMA tenant_2;

-- Shared public schema for metadata
CREATE SCHEMA public;

-- All tenant tables inherit from public base tables
-- Example: tenant_1.products, tenant_2.products
```

**Laravel Multi-Tenancy Implementation:**
```php
// middleware/EnsureTenantIsSet.php
// Automatically sets tenant context from subdomain or header

// Models use trait to scope queries
use TenantScoped;
// Model::query() automatically filters by tenant_id

// Config: config/tenancy.php
'default' => 'domains', // or 'headers'
```

**Tenant Identification Methods:**
1. **Subdomain:** `restaurant_a.kasir.app`
2. **Path-based:** `kasir.app/restaurant_a`
3. **Header-based:** `X-Tenant-ID: restaurant_a`

---

## Database Schema & ERD

### Conceptual Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE TRANSACTION DOMAIN                      │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────┐         ┌─────────────────┐
│  │   TENANT       │────┐    │    OUTLET       │
│  │────────────────│    │    │─────────────────│
│  │ id (PK)        │    └────│ id (PK)         │
│  │ name           │         │ tenant_id (FK)  │
│  │ subscription   │         │ name            │
│  │ active         │         │ address         │
│  └────────────────┘         └────────┬────────┘
│                                      │
│                   ┌──────────────────┤
│                   │                  │
│         ┌─────────▼────────┐  ┌──────▼──────────┐
│         │   TRANSACTION    │  │      SHIFT      │
│         │──────────────────│  │─────────────────│
│         │ id (PK)          │  │ id (PK)         │
│         │ outlet_id (FK)   │  │ outlet_id (FK)  │
│         │ shift_id (FK)    │  │ cashier_id (FK) │
│         │ total_amount     │  │ start_time      │
│         │ payment_method   │  │ end_time        │
│         │ status           │  │ opening_balance │
│         │ created_at       │  └─────────────────┘
│         └────────┬─────────┘
│                  │
│         ┌────────▼──────────────┐
│         │ TRANSACTION_ITEM      │
│         │───────────────────────│
│         │ id (PK)               │
│         │ transaction_id (FK)   │
│         │ product_id (FK)       │
│         │ quantity              │
│         │ unit_price            │
│         │ discount              │
│         │ notes                 │
│         └───────────────────────┘
│
├─────────────────────────────────────────────────────────────────┤
│                   PRODUCT & INVENTORY DOMAIN                    │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────┐       ┌─────────────────────┐
│  │    PRODUCT       │◄──────│ PRODUCT_VARIANT     │
│  │──────────────────│       │─────────────────────│
│  │ id (PK)          │       │ id (PK)             │
│  │ outlet_id (FK)   │       │ product_id (FK)     │
│  │ name             │       │ name (Size/Color)   │
│  │ sku              │       │ sku                 │
│  │ barcode          │       │ price               │
│  │ category_id (FK) │       │ cost                │
│  │ base_price       │       │ stock_qty           │
│  │ has_variants     │       └─────────────────────┘
│  └──────────────────┘
│         │
│         │
│  ┌──────▼──────────────┐
│  │    INVENTORY        │
│  │────────────────────│
│  │ id (PK)            │
│  │ product_id (FK)    │
│  │ outlet_id (FK)     │
│  │ quantity           │
│  │ reserved_qty       │
│  │ reorder_point      │
│  │ last_stock_check   │
│  └────────────────────┘
│         │
│  ┌──────▼──────────────────────┐
│  │ INVENTORY_MOVEMENT          │
│  │──────────────────────────────│
│  │ id (PK)                      │
│  │ inventory_id (FK)            │
│  │ movement_type                │
│  │   (SALE / RETURN / TRANSFER) │
│  │ quantity                     │
│  │ reason                       │
│  │ created_by (FK: User)        │
│  └──────────────────────────────┘
│
│  ┌──────────────────────┐
│  │ RECIPE               │
│  │──────────────────────│
│  │ id (PK)              │
│  │ product_id (FK)      │
│  │ outlet_id (FK)       │
│  │ created_by           │
│  └──────────────────────┘
│         │
│  ┌──────▼──────────────┐
│  │ RECIPE_INGREDIENT   │
│  │──────────────────────│
│  │ id (PK)              │
│  │ recipe_id (FK)       │
│  │ ingredient_id (FK)   │
│  │ quantity_needed      │
│  │ unit                 │
│  └──────────────────────┘
│
├─────────────────────────────────────────────────────────────────┤
│              OMNICHANNEL & ONLINE ORDERS DOMAIN                 │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────┐       ┌────────────────────┐
│  │ ONLINE_PLATFORM    │       │  ONLINE_ORDER      │
│  │────────────────────│       │────────────────────│
│  │ id (PK)            │◄──────│ id (PK)            │
│  │ outlet_id (FK)     │       │ platform_id (FK)   │
│  │ platform_name      │       │ outlet_id (FK)     │
│  │   (GOFOOD/GRAB)    │       │ external_order_id  │
│  │ api_key            │       │ customer_name      │
│  │ webhook_url        │       │ delivery_address   │
│  │ sync_interval      │       │ total_amount       │
│  └────────────────────┘       │ order_status       │
│                               │ scheduled_time     │
│                               │ sync_to_local_txn  │
│                               └────────────────────┘
│
│  ┌──────────────────────────┐
│  │ ONLINE_ORDER_ITEM        │
│  │──────────────────────────│
│  │ id (PK)                  │
│  │ online_order_id (FK)     │
│  │ product_id (FK)          │
│  │ quantity                 │
│  │ price                    │
│  │ notes                    │
│  └──────────────────────────┘
│
├─────────────────────────────────────────────────────────────────┤
│                    PAYMENT & SETTLEMENT DOMAIN                  │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────┐
│  │    PAYMENT      │
│  │─────────────────│
│  │ id (PK)         │
│  │ transaction_id  │
│  │ method          │
│  │   (CASH/CARD)   │
│  │ amount          │
│  │ edc_ref_id      │
│  │ status          │
│  │ created_at      │
│  └─────────────────┘
│
│  ┌──────────────────────┐
│  │  AUDIT_LOG           │
│  │──────────────────────│
│  │ id (PK)              │
│  │ user_id (FK)         │
│  │ action               │
│  │   (VOID/REFUND/etc)  │
│  │ reason               │
│  │ amount               │
│  │ authorized_by (FK)   │
│  │ timestamp            │
│  └──────────────────────┘
│
├─────────────────────────────────────────────────────────────────┤
│                      USER & CRM DOMAIN                          │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────┐       ┌────────────────────┐
│  │   USER         │       │  ROLE              │
│  │────────────────│       │────────────────────│
│  │ id (PK)        │◄──────│ id (PK)            │
│  │ outlet_id (FK) │       │ outlet_id (FK)     │
│  │ name           │       │ name (OWNER/etc)   │
│  │ email          │       │ permissions (JSON) │
│  │ phone          │       └────────────────────┘
│  │ role_id (FK)   │
│  │ pin_code       │
│  │ active         │
│  └────────────────┘
│
│  ┌────────────────────┐
│  │  CUSTOMER          │
│  │────────────────────│
│  │ id (PK)            │
│  │ outlet_id (FK)     │
│  │ phone/email        │
│  │ name               │
│  │ loyalty_points     │
│  │ total_purchases    │
│  │ member_since       │
│  └────────────────────┘
│         │
│  ┌──────▼────────────────┐
│  │ LOYALTY_POINT         │
│  │────────────────────────│
│  │ id (PK)                │
│  │ customer_id (FK)       │
│  │ transaction_id (FK)    │
│  │ points_earned         │
│  │ points_redeemed       │
│  │ balance               │
│  │ expiry_date           │
│  └────────────────────────┘
│
│  ┌───────────────────┐
│  │ PROMO_CODE        │
│  │───────────────────│
│  │ id (PK)           │
│  │ outlet_id (FK)    │
│  │ code              │
│  │ discount_type     │
│  │ discount_value    │
│  │ max_uses          │
│  │ expiry_date       │
│  │ active            │
│  └───────────────────┘
│
├─────────────────────────────────────────────────────────────────┤
│                   INTER-BRANCH TRANSFER DOMAIN                  │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────┐
│  │ PURCHASE_ORDER       │
│  │──────────────────────│
│  │ id (PK)              │
│  │ outlet_id (FK)       │
│  │ supplier_id (FK)     │
│  │ po_date              │
│  │ expected_delivery    │
│  │ status               │
│  │ total_amount         │
│  └──────────────────────┘
│         │
│  ┌──────▼──────────────┐
│  │ PURCHASE_ORDER_ITEM │
│  │──────────────────────│
│  │ id (PK)              │
│  │ po_id (FK)           │
│  │ product_id (FK)      │
│  │ quantity             │
│  │ unit_price           │
│  │ received_qty         │
│  └──────────────────────┘
│
│  ┌────────────────────────┐
│  │ INTER_BRANCH_TRANSFER  │
│  │────────────────────────│
│  │ id (PK)                │
│  │ from_outlet_id (FK)    │
│  │ to_outlet_id (FK)      │
│  │ status                 │
│  │   (PENDING/APPROVED)   │
│  │ created_by (FK: User)  │
│  │ approved_by (FK: User) │
│  │ transfer_date          │
│  └────────────────────────┘
│         │
│  ┌──────▼──────────────────┐
│  │ TRANSFER_ITEM           │
│  │──────────────────────────│
│  │ id (PK)                  │
│  │ transfer_id (FK)         │
│  │ product_id (FK)          │
│  │ quantity_requested       │
│  │ quantity_received        │
│  └──────────────────────────┘

```

### Critical Table Specifications

#### TRANSACTION
```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id),
    shift_id BIGINT REFERENCES shifts(id),
    order_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(15,2),
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    payment_method ENUM('CASH', 'CARD', 'QRIS', 'MIXED') NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED') DEFAULT 'PENDING',
    held_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    voided_at TIMESTAMP NULL,
    voided_reason TEXT,
    voided_by BIGINT REFERENCES users(id),
    authorization_pin_verified BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### INVENTORY_MOVEMENT
```sql
CREATE TABLE inventory_movements (
    id BIGINT PRIMARY KEY,
    inventory_id BIGINT NOT NULL REFERENCES inventories(id),
    movement_type ENUM('SALE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'WASTE') NOT NULL,
    quantity INT NOT NULL,
    reference_id BIGINT, -- transaction_id, transfer_id, etc.
    reason TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ONLINE_ORDER (for omnichannel consolidation)
```sql
CREATE TABLE online_orders (
    id BIGINT PRIMARY KEY,
    outlet_id BIGINT NOT NULL REFERENCES outlets(id),
    online_platform_id BIGINT NOT NULL REFERENCES online_platforms(id),
    external_order_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    total_amount DECIMAL(15,2),
    order_status ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    scheduled_time TIMESTAMP NULL,
    synced_transaction_id BIGINT REFERENCES transactions(id),
    sync_status ENUM('PENDING', 'SYNCED', 'FAILED') DEFAULT 'PENDING',
    raw_payload JSON, -- Store original platform data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### RECIPE & RECIPE_INGREDIENT
```sql
CREATE TABLE recipes (
    id BIGINT PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    outlet_id BIGINT NOT NULL REFERENCES outlets(id),
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
    id BIGINT PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id),
    ingredient_id BIGINT NOT NULL REFERENCES products(id),
    quantity_needed DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50), -- 'kg', 'liter', 'pcs', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## UI/UX Specification & Dual-Screen Design

### Screen 1: Cashier Dashboard (Primary Screen)

#### Layout Architecture
```
┌─────────────────────────────────────────────────────────┐
│  KASIR PLATFORM - Cashier Dashboard                     │ [Header 60px]
├───────────────┬─────────────────────┬───────────────────┤
│               │                     │                   │
│  Left Sidebar │  Main Content Area  │ Right Panel       │
│  (250px)      │  (700px)            │ (350px)           │
│               │                     │                   │
│ • Search      │ ┌─────────────────┐ │ ┌───────────────┐ │
│ • Categories  │ │ Current Order   │ │ │ Total Amount  │ │
│ • Favorites   │ │                 │ │ │ ┌───────────┐ │ │
│ • Promotions  │ │ Items List      │ │ │ │  Rp XXX   │ │ │
│ • Quick Menu  │ │ (Scrollable)    │ │ │ └───────────┘ │ │
│               │ │                 │ │ │               │ │
│               │ │ [+Item] [-Item] │ │ │ Payment       │ │
│               │ │ [Modify] [Note] │ │ │ Methods:      │ │
│               │ │                 │ │ │ • CASH        │ │
│               │ │                 │ │ │ • CARD (EDC)  │ │
│               │ │                 │ │ │ • QRIS        │ │
│               │ └─────────────────┘ │ │               │ │
│               │                     │ │ [Pay] [Hold]  │ │
│               │                     │ │ [Void]        │ │
│               │                     │ │               │ │
│               │                     │ │ Split Bill    │ │
│               │                     │ │ [Configure]   │ │
│               │                     │ │               │ │
│               │                     │ │ Discount      │ │
│               │                     │ │ [Apply]       │ │
│               │                     │ │               │ │
│               │                     │ │ Customer ID   │ │
│               │                     │ │ [Search]      │ │
│               │                     │ │ Points: 0     │ │
│               │                     │ │               │ │
│               │                     │ │ Order #: 0042 │ │
│               │                     │ │ Shift: Morning│ │
│               │                     │ └───────────────┘ │
│               │                     │                   │
└───────────────┴─────────────────────┴───────────────────┘
```

#### Interaction Flows

**Transaction Creation Flow:**
1. Cashier taps search/category to find product
2. Product appears in main order area
3. Cashier can modify quantity/add notes via modal
4. Real-time subtotal calculation
5. Customer lookup (optional for loyalty)
6. Apply discounts/promos if applicable
7. Select payment method
8. If CARD: EDC machine auto-receives total → display PIN prompt
9. Confirm → Transaction marked COMPLETED → Receipt printer triggers

**Hold Transaction Flow:**
1. Cashier taps [Hold] button
2. System assigns hold ID
3. Transaction status → HELD
4. CFD clears (displays "Thank You")
5. Cashier can resume held transaction from sidebar

**Void Transaction Flow:**
1. Cashier initiates void
2. System detects authorization requirement
3. Prompt for Manager PIN code
4. Upon verification: Void approved → Audit log recorded
5. Receipt shows VOIDED watermark

---

### Screen 2: Customer Facing Display (Secondary Screen)

#### CFD Layout

```
┌────────────────────────────────────────┐
│   KASIR RESTAURANT                     │ [Header 80px]
├────────────────────────────────────────┤
│                                        │
│        YOUR ORDER                      │ [Order Title 40px]
│                                        │
│    Order #: 0042                       │ [Order Number 50px]
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Menu Item 1          x2    Rp 50K  │ │
│ │ Menu Item 2          x1    Rp 75K  │ │
│ │ Menu Item 3 (No Ice) x1    Rp 30K  │ │
│ │                                    │ │
│ │ Subtotal:                  Rp 205K │ │
│ │ Discount:                  -Rp 20K │ │
│ │ Tax (10%):                 Rp 18.5K│ │
│ │                                    │ │
│ │ TOTAL:                     Rp 203.5│ │
│ │ .─────────────────────────────────│ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │ [Order Details 300px]
│  ┌──────────────────────────────────┐ │
│  │                                  │ │
│  │       ████████████████████       │ │
│  │      █  QRIS PAYMENT CODE  █     │ │ [QR Code Section 200px]
│  │      █                      █    │ │
│  │      █  [QR CODE IMAGE]    █     │ │
│  │      █                      █    │ │
│  │       ████████████████████       │ │
│  │                                  │ │
│  │    Tap QR code with your phone   │ │
│  │    to complete payment           │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │    ⭐ Rate Your Experience ⭐   │ │ [Feedback Section 80px]
│  │  😞    😐    🙂    😊    😄    │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│        Thank You! See You Soon        │ [Footer Message 60px]
│                                        │
└────────────────────────────────────────┘
```

#### CFD Real-Time Updates

**WebSocket Events:** (Published every 500ms via Laravel Reverb)
```json
{
  "event": "transaction_updated",
  "data": {
    "transaction_id": 42,
    "items": [
      {
        "product_id": 101,
        "name": "Nasi Goreng",
        "quantity": 2,
        "unit_price": 25000,
        "notes": "Extra spicy"
      }
    ],
    "subtotal": 205000,
    "discount": 20000,
    "tax": 18500,
    "total": 203500,
    "status": "PENDING",
    "payment_method": "QRIS"
  }
}
```

**Payment Status Transitions:**
- `PENDING` → Show QR code
- `CARD_PROCESSING` → Show "Processing..." spinner
- `COMPLETED` → Show thank you + feedback prompt
- `VOIDED` → Show error message

---

### UI/UX Workflow Matrix

| Workflow | Primary Screen | Secondary Screen | Duration | Critical Events |
|----------|---|---|---|---|
| **Add Item** | Search → Select → Qty | Live update order list | <1s | Item count +1 |
| **Modify Item** | Click item → Modal | CFD updates notes | <2s | Notes appear instantly |
| **Split Bill** | Configure allocations | N/A | <3s | Recalculate totals |
| **Hold Transaction** | [Hold] button | CFD clears → "Thank You" | <500ms | Hold ID assigned |
| **Resume Hold** | Select from sidebar | CFD restores | <1s | Previous state restored |
| **Apply Discount** | [Apply] modal | Subtotal recalculates | <1s | Tax recalculates |
| **Payment CARD** | Select CARD → EDC sends total | QR shows "Processing..." | <2s | EDC status sync |
| **Payment QRIS** | Select QRIS → Display QR | QR code displays | <500ms | Payment link generated |
| **Void Transaction** | [Void] → PIN prompt → Confirm | "Transaction Voided" message | <5s | Audit log recorded |
| **Loyalty Lookup** | Customer ID search → Points display | N/A | <1s | Points balance shown |
| **E-Receipt** | Select PRINT/EMAIL/SMS | N/A | <2s | Receipt queued |

---

## Next.js Component Architecture

### Component Hierarchy

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx  [TenantProvider, WebSocketProvider]
│   ├── cashier/
│   │   ├── page.tsx  [CashierDashboard]
│   │   ├── components/
│   │   │   ├── OrderPanel.tsx
│   │   │   ├── ItemSearch.tsx
│   │   │   ├── CategorySidebar.tsx
│   │   │   ├── TotalDisplay.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── SplitBillModal.tsx
│   │   │   ├── VoidConfirmationModal.tsx
│   │   │   └── HoldTransactionList.tsx
│   │   ├── hooks/
│   │   │   ├── useTransaction.ts
│   │   │   ├── usePaymentEDC.ts
│   │   │   └── useCashierWebSocket.ts
│   │   └── page.tsx
│   │
│   ├── customer-display/
│   │   ├── page.tsx  [CustomerFacingDisplay]
│   │   ├── components/
│   │   │   ├── OrderSummary.tsx
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   ├── PaymentStatus.tsx
│   │   │   ├── FeedbackWidget.tsx
│   │   │   └── WaitingScreen.tsx
│   │   ├── hooks/
│   │   │   └── useCFDWebSocket.ts
│   │   └── page.tsx
│   │
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── StockTable.tsx
│   │   │   ├── RecipeBuilder.tsx
│   │   │   ├── RecipeIngredientModal.tsx
│   │   │   ├── StockTransferForm.tsx
│   │   │   ├── LowStockAlert.tsx
│   │   │   └── PurchaseOrderGenerator.tsx
│   │   └── page.tsx
│   │
│   ├── omnichannel/
│   │   ├── components/
│   │   │   ├── OnlineOrdersPanel.tsx
│   │   │   ├── PlatformIntegrationSettings.tsx
│   │   │   ├── OrderRouter.tsx
│   │   │   ├── OrderConsolidationLog.tsx
│   │   │   └── PlatformSyncStatus.tsx
│   │   └── page.tsx
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── TopProductsTable.tsx
│   │   │   ├── PeakHoursGraph.tsx
│   │   │   ├── MultiOutletComparison.tsx
│   │   │   └── DateRangeSelector.tsx
│   │   └── page.tsx
│   │
│   ├── crm/
│   │   ├── components/
│   │   │   ├── CustomerSearch.tsx
│   │   │   ├── CustomerProfile.tsx
│   │   │   ├── LoyaltyPointsDisplay.tsx
│   │   │   ├── PromoCodeManager.tsx
│   │   │   └── MembershipTiers.tsx
│   │   └── page.tsx
│   │
│   └── settings/
│       ├── components/
│       │   ├── RBACMatrix.tsx
│       │   ├── UserManagement.tsx
│       │   ├── RolePermissionEditor.tsx
│       │   ├── PinCodeManager.tsx
│       │   ├── ShiftManagement.tsx
│       │   └── HardwareSettings.tsx
│       └── page.tsx
│
├── api/
│   ├── transactions/
│   │   ├── route.ts  [POST, GET]
│   │   ├── [id]/
│   │   │   ├── route.ts  [PATCH, DELETE]
│   │   │   └── void/
│   │   │       └── route.ts  [POST + PIN verification]
│   │   ├── hold/
│   │   │   └── route.ts  [POST, GET]
│   │   └── receipts/
│   │       └── route.ts  [POST - e-receipt generation]
│   │
│   ├── products/
│   │   ├── route.ts  [GET, POST]
│   │   └── [id]/route.ts  [PATCH, DELETE]
│   │
│   ├── inventory/
│   │   ├── route.ts  [GET]
│   │   ├── recipes/
│   │   │   ├── route.ts  [POST, GET]
│   │   │   └── [id]/route.ts  [PATCH, DELETE]
│   │   └── transfers/
│   │       └── route.ts  [POST]
│   │
│   ├── orders/
│   │   ├── online/
│   │   │   ├── route.ts  [GET - fetch from platforms]
│   │   │   ├── sync/route.ts  [POST - consolidate]
│   │   │   └── [id]/route.ts  [PATCH - update status]
│   │   └── receipts/
│   │       ├── email/route.ts
│   │       └── sms/route.ts
│   │
│   ├── crm/
│   │   ├── customers/
│   │   │   ├── route.ts  [POST, GET]
│   │   │   └── [id]/route.ts  [PATCH]
│   │   ├── loyalty/
│   │   │   └── route.ts  [GET, POST]
│   │   └── promotions/
│   │       └── route.ts  [POST, GET]
│   │
│   ├── edc/
│   │   ├── send-amount/route.ts
│   │   ├── status/route.ts
│   │   └── verify-payment/route.ts
│   │
│   └── analytics/
│       ├── sales/route.ts
│       ├── products/route.ts
│       └── multi-outlet/route.ts
│
├── lib/
│   ├── db.ts  [Prisma singleton]
│   ├── websocket.ts  [Reverb client]
│   ├── edc-connector.ts  [EDC machine SDK]
│   ├── omnichannel-router.ts
│   ├── auth.ts
│   └── utils.ts
│
├── hooks/
│   ├── useTenant.ts
│   ├── useUser.ts
│   ├── useRBAC.ts
│   ├── useWebSocket.ts
│   ├── useTransaction.ts
│   └── useAnalytics.ts
│
├── contexts/
│   ├── TenantContext.tsx
│   ├── UserContext.tsx
│   ├── WebSocketContext.tsx
│   └── TransactionContext.tsx
│
├── providers/
│   ├── TenantProvider.tsx
│   ├── WebSocketProvider.tsx
│   ├── AnalyticsProvider.tsx
│   └── AuthProvider.tsx
│
└── types/
    ├── transaction.ts
    ├── product.ts
    ├── order.ts
    ├── user.ts
    ├── tenant.ts
    └── payment.ts
```

### State Management Architecture

**Global State Pattern:**
```typescript
// contexts/TransactionContext.tsx
interface TransactionContextType {
  currentTransaction: Transaction | null;
  items: TransactionItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'HELD' | 'VOIDED';
  heldTransactions: Transaction[];
  
  addItem: (product: Product, qty: number) => void;
  updateItem: (itemId: string, updates: Partial<TransactionItem>) => void;
  removeItem: (itemId: string) => void;
  applyDiscount: (amount: number) => void;
  selectPaymentMethod: (method: string) => void;
  holdTransaction: () => Promise<void>;
  resumeHeldTransaction: (holdId: string) => Promise<void>;
  completeTransaction: () => Promise<TransactionResponse>;
  voidTransaction: (reason: string, pinCode: string) => Promise<void>;
}

// Usage in component:
const { 
  currentTransaction, 
  items, 
  addItem, 
  completeTransaction 
} = useContext(TransactionContext);
```

---

## Real-Time Synchronization Strategy

### WebSocket Architecture with Laravel Reverb

#### Setup (Laravel Backend)
```php
// config/reverb.php
'apps' => [
    [
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'allowed_origins' => ['localhost:3000', 'kasir.app'],
    ],
],

// Broadcast channel: TenantSpecific
class TenantSpecificChannel {
    public function join(User $user) {
        // Only users in same tenant can access this channel
        return $user->tenant_id === $this->tenant_id;
    }
}

// Broadcasting event
class TransactionUpdated implements ShouldBroadcast {
    public $transaction;
    
    public function broadcastOn() {
        return new PrivateChannel("tenant.{$this->transaction->outlet->tenant_id}");
    }
}
```

#### Setup (Next.js Frontend)

**WebSocket Provider:**
```typescript
// lib/websocket.ts
export class ReverbClient {
  private connection: Reverb;
  
  constructor(apiHost: string, apiKey: string, tenantId: string) {
    this.connection = new Reverb({
      broadcaster: 'reverb',
      key: apiKey,
      wsHost: apiHost,
      wsPort: 8080,
      wssPort: 443,
      forceTLS: process.env.NODE_ENV === 'production',
    });
    
    // Subscribe to tenant channel
    this.connection
      .private(`tenant.${tenantId}`)
      .listen('.transaction_updated', (data) => {
        // Handle event
      });
  }
}

// providers/WebSocketProvider.tsx
export const WebSocketProvider = ({ children, tenantId }: Props) => {
  const reverbClientRef = useRef<ReverbClient | null>(null);
  
  useEffect(() => {
    reverbClientRef.current = new ReverbClient(
      process.env.NEXT_PUBLIC_REVERB_HOST,
      process.env.NEXT_PUBLIC_REVERB_KEY,
      tenantId
    );
    
    return () => {
      reverbClientRef.current?.disconnect();
    };
  }, [tenantId]);
  
  return (
    <WebSocketContext.Provider value={reverbClientRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

#### Event Broadcasting Scenarios

**Scenario 1: Cashier adds item → CFD updates in real-time**
```
┌──────────────────┐              ┌──────────────────┐
│  Cashier Screen  │              │   CFD Screen     │
│  (Port 3000)     │              │   (Port 3001)    │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         │ 1. Click "Add Item"              │
         │                                  │
         ├─→ dispatch(addItem)              │
         │                                  │
         ├─→ POST /api/transactions/items   │
         │                                  │
         └────────────────────────────────────→ Backend
         
Backend (Laravel):
         │ 2. Save to DB                    │
         │                                  │
         │ 3. Broadcast TransactionUpdated  │
         │                                  │
         ←──────────────────────────────────┤
         
         │ 4. Reverb channel broadcast      │
         │                                  │
         ├──────────────────────────┬───────┘
         │                          │
         │ 5. WebSocket message     │
         │                          │ 5. WebSocket message
         │                          │
         ↓ 6. useCFDWebSocket       ↓ 6. useCashierWebSocket
         │ hook updates state       │ hook updates state
         │                          │
         ├─→ setItems()             ├─→ setItems()
         │                          │
         └──→ CFD renders           └──→ Cashier renders
             updated order list         updated order list
```

**Real-Time Event Flow (500ms cadence):**
```
Transaction Update Event:
{
  "event": "transaction_updated",
  "data": {
    "transaction_id": 42,
    "outlet_id": 1,
    "tenant_id": 5,
    "items": [
      {
        "id": "item_1",
        "product_id": 101,
        "name": "Nasi Goreng",
        "quantity": 2,
        "unit_price": 25000,
        "notes": "Extra spicy",
        "updated_at": "2026-05-28T10:30:45Z"
      }
    ],
    "subtotal": 205000,
    "discount": 20000,
    "tax": 18500,
    "total": 203500,
    "payment_method": "QRIS",
    "status": "PENDING",
    "timestamp": "2026-05-28T10:30:45Z"
  }
}
```

#### Payment EDC Status Sync

**EDC Integration Flow:**
```
┌─────────────────────────────────────────────────────┐
│        Cashier selects "CARD" payment method        │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│   Backend: Push total to EDC machine (Verifone)    │
│   - Serial connection or USB                        │
│   - Amount: 203,500 IDR                            │
└────────────┬────────────────────────────────────────┘
             │
             ├→ EDC displays: "Rp 203,500"
             │              "ENTER PIN"
             │
             ↓
┌─────────────────────────────────────────────────────┐
│   Cardholder enters PIN on EDC machine             │
└────────────┬────────────────────────────────────────┘
             │
             ├→ EDC generates transaction reference
             │
             ↓
┌─────────────────────────────────────────────────────┐
│   Backend polls EDC status (every 2 seconds)       │
└────────────┬────────────────────────────────────────┘
             │
             ├→ EDC Response: "SUCCESS", Ref: "ABC123"
             │
             ↓
┌─────────────────────────────────────────────────────┐
│   Backend broadcasts PAYMENT_COMPLETED event       │
└────────────┬────────────────────────────────────────┘
             │
             ├→ Reverb: payment_completed → CFD
             ├→ Reverb: payment_completed → Cashier
             │
             ↓
┌──────────────────────────────┬──────────────────────┐
│   CFD: Show "Thank You"      │ Cashier: Print       │
│        + Rating prompt       │ receipt              │
└──────────────────────────────┴──────────────────────┘
```

---

## Omnichannel Integration Framework

### Order Consolidation Architecture

#### Platform Integration Points

**GoFood Integration:**
```php
// app/Services/OmniChannelRouter.php
class OmniChannelRouter {
    public function syncGoFoodOrders($outletId) {
        $platform = OnlinePlatform::where([
            'outlet_id' => $outletId,
            'platform_name' => 'GOFOOD'
        ])->first();
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . decrypt($platform->api_key)
        ])->get('https://api.gofood.co/v1/orders', [
            'status' => 'accepted'
        ]);
        
        foreach ($response->json()['orders'] as $order) {
            $this->consolidateOrder($order, $platform);
        }
    }
    
    private function consolidateOrder($platformOrder, $platform) {
        // Create OnlineOrder record
        $onlineOrder = OnlineOrder::create([
            'outlet_id' => $platform->outlet_id,
            'online_platform_id' => $platform->id,
            'external_order_id' => $platformOrder['id'],
            'customer_name' => $platformOrder['customer_name'],
            'customer_phone' => $platformOrder['customer_phone'],
            'delivery_address' => $platformOrder['delivery_address'],
            'total_amount' => $platformOrder['total'],
            'order_status' => 'PENDING',
            'raw_payload' => $platformOrder,
        ]);
        
        // Convert platform items to system products
        foreach ($platformOrder['items'] as $item) {
            $product = Product::where([
                'outlet_id' => $platform->outlet_id,
                'external_platform_id' => $item['id']
            ])->first();
            
            OnlineOrderItem::create([
                'online_order_id' => $onlineOrder->id,
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'notes' => $item['notes'] ?? null,
            ]);
        }
        
        // Broadcast to cashier
        event(new OnlineOrderReceived($onlineOrder));
    }
}
```

#### Order Router UI Component (Next.js)

```typescript
// components/OmniChannelOrderRouter.tsx
export const OmniChannelOrderRouter: React.FC = () => {
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const reverbClient = useContext(WebSocketContext);
  
  useEffect(() => {
    // Subscribe to platform events
    reverbClient?.on('online_order_received', (data) => {
      setOnlineOrders(prev => [data, ...prev]);
      
      // Toast notification
      showNotification({
        type: 'info',
        title: `New Order from ${data.platform_name}`,
        message: `Order #${data.external_order_id}`,
        action: () => convertToTransaction(data)
      });
    });
    
    return () => {
      reverbClient?.off('online_order_received');
    };
  }, [reverbClient]);
  
  const convertToTransaction = async (order: OnlineOrder) => {
    // Create transaction from online order
    const transaction = await api.post('/transactions', {
      outlet_id: order.outlet_id,
      items: order.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      total_amount: order.total_amount,
      customer_phone: order.customer_phone,
      source: 'ONLINE_PLATFORM',
      external_order_id: order.external_order_id,
    });
    
    // Link transaction to online order
    await api.patch(`/orders/online/${order.id}`, {
      synced_transaction_id: transaction.id,
      sync_status: 'SYNCED'
    });
  };
  
  return (
    <div className="omnichannel-panel">
      <div className="platform-tabs">
        <Tab label="GoFood" count={onlineOrders.filter(o => o.platform === 'GOFOOD').length} />
        <Tab label="GrabFood" count={onlineOrders.filter(o => o.platform === 'GRABFOOD').length} />
        <Tab label="Direct" count={onlineOrders.filter(o => o.platform === 'DIRECT').length} />
      </div>
      
      <OrderList>
        {onlineOrders.map(order => (
          <OrderCard key={order.id} order={order}>
            <Badge>{order.platform_name}</Badge>
            <CustomerInfo>{order.customer_name}</CustomerInfo>
            <ItemList items={order.items} />
            <Button onClick={() => convertToTransaction(order)}>
              Convert to Transaction
            </Button>
          </OrderCard>
        ))}
      </OrderList>
    </div>
  );
};
```

### Webhook Handler for Platform Updates

```php
// routes/webhooks.php
Route::post('/webhooks/gofood', [WebhookController::class, 'handleGoFoodWebhook']);
Route::post('/webhooks/grab', [WebhookController::class, 'handleGrabWebhook']);

// app/Http/Controllers/WebhookController.php
class WebhookController extends Controller {
    public function handleGoFoodWebhook(Request $request) {
        $payload = $request->validate([
            'event' => 'required|string',
            'data' => 'required|array'
        ]);
        
        match($payload['event']) {
            'order.created' => $this->handleOrderCreated($payload['data']),
            'order.status_changed' => $this->handleOrderStatusChanged($payload['data']),
            'order.ready_for_pickup' => $this->handleOrderReady($payload['data']),
            default => null,
        };
        
        return response()->json(['status' => 'received']);
    }
    
    private function handleOrderCreated($data) {
        // Immediately create OnlineOrder
        $order = OnlineOrder::create([...]);
        
        // Broadcast to all connected cashiers in tenant
        event(new OnlineOrderReceived($order));
        
        // Push notification
        Notification::send($order->outlet->users, 
            new NewOnlineOrderNotification($order)
        );
    }
}
```

---

## Security & RBAC

### Permission Matrix

| Role | Transaction | Inventory | Omnichannel | CRM | Analytics | Settings |
|------|---|---|---|---|---|---|
| **Owner** | Create, Void, View | Full Access | Full Access | Full Access | Full Access | Full Access |
| **Manager** | Create, Void (with PIN), View | Manage, Approve Transfer | View, Manage | View, Edit | View | Limited |
| **Cashier** | Create, Hold/Resume | View Only | View Only | View | Basic | None |
| **Waiter** | Create, View | View Only | View Only | View | None | None |
| **Warehouse** | None | Full Access | None | None | View | None |

### Implementation

```php
// app/Models/Role.php
class Role extends Model {
    protected $attributes = [
        'permissions' => [
            'transaction.create' => true,
            'transaction.void' => false,
            'transaction.hold' => true,
            'inventory.view' => true,
            'inventory.edit' => false,
            'inventory.transfer' => false,
            // ... more permissions
        ]
    ];
    
    public function hasPermission(string $permission): bool {
        return $this->permissions[$permission] ?? false;
    }
}

// Middleware
class EnsurePermission {
    public function handle($request, $next, $permission) {
        if (!auth()->user()->role->hasPermission($permission)) {
            abort(403);
        }
        return $next($request);
    }
}

// Usage
Route::post('/transactions/{id}/void', [TransactionController::class, 'void'])
    ->middleware(['auth', 'permission:transaction.void']);
```

### Manager Authorization PIN for Void Operations

```php
// app/Services/VoidService.php
class VoidService {
    public function voidTransaction(Transaction $transaction, string $pinCode, string $reason): void {
        // Verify PIN
        $manager = User::findOrFail(auth()->id());
        
        if (!password_verify($pinCode, $manager->pin_hash)) {
            throw new InvalidPinException('Incorrect PIN code');
        }
        
        // Verify manager role
        if (!$manager->role->hasPermission('transaction.void')) {
            throw new UnauthorizedException('User cannot void transactions');
        }
        
        // Perform void
        $transaction->update([
            'status' => 'VOIDED',
            'voided_at' => now(),
            'voided_reason' => $reason,
            'voided_by' => auth()->id(),
        ]);
        
        // Create audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TRANSACTION_VOID',
            'transaction_id' => $transaction->id,
            'amount' => $transaction->total_amount,
            'reason' => $reason,
            'timestamp' => now(),
        ]);
        
        // Broadcast to all users
        event(new TransactionVoided($transaction));
    }
}
```

---

## API Specifications

### Transaction Endpoints

#### Create Transaction
```http
POST /api/transactions
Content-Type: application/json
Authorization: Bearer {token}

{
  "outlet_id": 1,
  "shift_id": 5,
  "items": [
    {
      "product_id": 101,
      "quantity": 2,
      "unit_price": 25000,
      "notes": "Extra spicy"
    }
  ],
  "customer_phone": "081234567890",
  "discount_amount": 20000,
  "tax_amount": 18500,
  "payment_method": "QRIS"
}

Response:
{
  "id": 42,
  "outlet_id": 1,
  "order_number": "ORD-20260528-0042",
  "total_amount": 203500,
  "status": "PENDING",
  "items": [...],
  "qr_code_url": "https://kasir.app/qr/TXN-42"
}
```

#### Complete Transaction (Payment)
```http
POST /api/transactions/42/complete
Content-Type: application/json
Authorization: Bearer {token}

{
  "payment_method": "CARD",
  "edc_reference": "EDC-ABC123",
  "amount_paid": 203500
}

Response:
{
  "id": 42,
  "status": "COMPLETED",
  "completed_at": "2026-05-28T10:35:00Z",
  "receipt_id": "RCP-42",
  "message": "Transaction completed successfully"
}
```

#### Void Transaction (Manager Authorization)
```http
POST /api/transactions/42/void
Content-Type: application/json
Authorization: Bearer {token}

{
  "pin_code": "1234",
  "reason": "Customer request",
  "authorization_manager_id": 5
}

Response:
{
  "id": 42,
  "status": "VOIDED",
  "voided_at": "2026-05-28T10:40:00Z",
  "voided_by": 5,
  "audit_log_id": 123
}
```

### Inventory Endpoints

#### Create Recipe
```http
POST /api/inventory/recipes
Content-Type: application/json
Authorization: Bearer {token}

{
  "product_id": 201,
  "outlet_id": 1,
  "name": "Nasi Goreng Recipe",
  "ingredients": [
    {
      "ingredient_id": 301,
      "quantity_needed": 200,
      "unit": "grams"
    },
    {
      "ingredient_id": 302,
      "quantity_needed": 0.5,
      "unit": "liters"
    }
  ]
}

Response:
{
  "id": 50,
  "product_id": 201,
  "name": "Nasi Goreng Recipe",
  "ingredients": [...]
}
```

#### Stock Transfer Request
```http
POST /api/inventory/transfers
Content-Type: application/json
Authorization: Bearer {token}

{
  "from_outlet_id": 1,
  "to_outlet_id": 2,
  "items": [
    {
      "product_id": 101,
      "quantity_requested": 50
    }
  ],
  "reason": "High demand at outlet 2"
}

Response:
{
  "id": 75,
  "status": "PENDING",
  "approval_url": "https://kasir.app/approve-transfer/75",
  "notification_sent_to": 2
}
```

### Omnichannel Endpoints

#### Sync Online Orders
```http
POST /api/omnichannel/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "outlet_id": 1,
  "platforms": ["GOFOOD", "GRABFOOD"]
}

Response:
{
  "synced": 5,
  "failed": 0,
  "orders": [
    {
      "id": 1001,
      "external_order_id": "GOFOOD-12345",
      "status": "PENDING",
      "total": 150000
    }
  ]
}
```

#### Convert Online Order to Transaction
```http
POST /api/omnichannel/convert
Content-Type: application/json
Authorization: Bearer {token}

{
  "online_order_id": 1001
}

Response:
{
  "transaction_id": 42,
  "order_number": "ORD-20260528-0042",
  "synced_at": "2026-05-28T10:30:00Z"
}
```

### CRM Endpoints

#### Create/Update Customer
```http
POST /api/crm/customers
Content-Type: application/json
Authorization: Bearer {token}

{
  "outlet_id": 1,
  "phone": "081234567890",
  "name": "Budi Santoso",
  "email": "budi@example.com"
}

Response:
{
  "id": 501,
  "phone": "081234567890",
  "name": "Budi Santoso",
  "loyalty_points": 0,
  "member_since": "2026-05-28"
}
```

#### Get Customer Loyalty Points
```http
GET /api/crm/customers/501/loyalty
Authorization: Bearer {token}

Response:
{
  "customer_id": 501,
  "total_points": 1500,
  "redeemable_points": 1200,
  "transactions": 15,
  "member_tier": "SILVER",
  "expiring_points": 100
}
```

---

## Implementation Timeline

### Quarter 1 (Weeks 1-12): MVP Foundation
- **Week 1-3:** Database setup, Laravel 11 architecture, multi-tenancy
- **Week 4-6:** Transaction service, item management, basic UI
- **Week 7-9:** Payment processing (EDC integration), hold/void functionality
- **Week 10-12:** Customer-facing display, WebSocket setup
- **Deliverable:** MVP with basic transactions + dual-screen support

### Quarter 2 (Weeks 13-24): Feature Expansion
- **Week 13-15:** Omnichannel integration (GoFood/GrabFood)
- **Week 16-18:** Inventory management, recipes, stock transfers
- **Week 19-21:** CRM module, loyalty points
- **Week 22-24:** Analytics dashboard, multi-outlet reports
- **Deliverable:** Enterprise features enabled

### Quarter 3 (Weeks 25-36): Optimization & Scaling
- **Week 25-27:** Performance optimization, caching layers
- **Week 28-30:** Advanced RBAC, audit logging
- **Week 31-33:** Hardware integration (printers, barcode scanners, EDC)
- **Week 34-36:** Load testing, security audit
- **Deliverable:** Production-ready SaaS platform

### Quarter 4 (Weeks 37-48): Launch & Growth
- **Week 37-40:** Beta testing with 5-10 pilot restaurants
- **Week 41-44:** Feedback integration, bug fixes
- **Week 45-46:** Sales/marketing preparation
- **Week 47-48:** Official launch, onboarding support
- **Deliverable:** Live SaaS platform with paying customers

---

## Success Criteria & KPIs

### Technical KPIs
- **Transaction Success Rate:** >99.5%
- **API Response Time:** <500ms (p95)
- **System Uptime:** >99.9%
- **Data Sync Latency:** <1000ms (cashier ↔ CFD)

### Business KPIs
- **Customer Acquisition:** 50 SMEs in Year 1
- **Revenue:** $50K MRR by end of Year 1
- **Churn Rate:** <5% monthly
- **Feature Adoption:** >80% using omnichannel features

### User Experience KPIs
- **Average Transaction Time:** <2 minutes (from first item to payment)
- **Payment Success Rate:** >98%
- **System Crash Incidents:** <1 per month

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Bank EDC integration delays | High | Start with manual PIN entry; integrate EDC later |
| Omnichannel API changes | Medium | Abstract platform layer; maintain version compatibility |
| Multi-tenant data isolation breach | Critical | Implement audit logging; conduct security audit |
| High transaction volume (>1000/hour) | Medium | Implement caching; use database indexing; horizontal scaling |
| Customer adoption friction | Medium | Provide comprehensive onboarding; white-glove support for first 3 months |

---

## Conclusion

This PRD provides a comprehensive blueprint for Kasir Platform—a world-class SaaS POS system that consolidates transaction management, omnichannel orders, and inventory operations into a seamless experience. By leveraging modern tech stacks (Next.js 16 + Laravel 11), real-time WebSocket synchronization, and thoughtful dual-screen UX, the platform is positioned to capture the SME market and compete with established players like Moka POS.

The phased approach ensures steady progress while maintaining flexibility to incorporate market feedback. The database schema supports future scaling to enterprise deployments with multi-outlet support, recipe-based inventory, and advanced analytics.

---

**Document Version:** 1.0  
**Last Updated:** May 28, 2026  
**Next Review:** Q3 2026 (Mid-project checkpoint)
