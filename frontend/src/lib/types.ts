// ============================================
// KasirPro — Type Definitions
// ============================================

// ---- Enums ----
export type UserRole = 'owner' | 'manager' | 'cashier' | 'inventory_staff';
export type PaymentMethod = 'cash' | 'qris' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionStatus = 'completed' | 'voided' | 'refunded';
export type ShiftStatus = 'open' | 'closed';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';
export type InventoryMovementType = 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';
export type DiscountType = 'percentage' | 'fixed';
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
export type LoyaltyPointType = 'earned' | 'redeemed' | 'expired' | 'adjusted';

// ---- Core Entities ----
export interface Tenant {
  id: string;
  name: string;
  subscriptionPlan: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  trackInventory: boolean;
  variants: ProductVariant[];
  category?: Category;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  costPrice: number;
  sellingPrice: number;
  weight: number | null;
  unit: string;
  isDefault: boolean;
  isActive: boolean;
  // Joined from inventory
  stock?: number;
  lowStockThreshold?: number;
}

export interface Inventory {
  id: string;
  outletId: string;
  variantId: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  reorderQuantity: number;
  lastCountedAt: string | null;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  totalPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisitAt: string | null;
  createdAt: string;
}

export interface Shift {
  id: string;
  outletId: string;
  userId: string;
  openedBy: string;
  closedBy: string | null;
  startingCash: number;
  endingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  totalTransactions: number;
  totalRevenue: number;
  status: ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  // Joined
  user?: User;
}

export interface PromoCode {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

// ---- Transaction ----
export interface Transaction {
  id: string;
  clientUuid: string;
  tenantId: string;
  outletId: string;
  userId: string;
  shiftId: string;
  customerId: string | null;
  promoCodeId: string | null;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  status: TransactionStatus;
  voidedBy: string | null;
  voidReason: string | null;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  metadata: Record<string, unknown> | null;
  syncedAt: string | null;
  createdAt: string;
  // Joined
  items?: TransactionItem[];
  payments?: Payment[];
  customer?: Customer;
  user?: User;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  referenceNumber: string | null;
  status: PaymentStatus;
  gatewayResponse: Record<string, unknown> | null;
  createdAt: string;
}

// ---- Cart (Client-side) ----
export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountAmount: number;
  subtotal: number;
  imageUrl: string | null;
  maxStock: number | null;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// ---- Offline Transaction (IndexedDB) ----
export interface OfflineTransaction {
  clientUuid: string;
  serverId?: string;
  outletId: string;
  userId: string;
  shiftId: string;
  customerId?: string;
  promoCode?: string;
  items: CartItem[];
  payments: OfflinePayment[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  cashierName: string;
  outletName: string;
  outletAddress: string;
  outletPhone: string;
  invoiceNumber: string;
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface OfflinePayment {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string;
}

// ---- API ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  user: User;
  outlet: Outlet;
  tenant: Tenant;
}

// ---- Reports ----
export interface DailySummary {
  date: string;
  totalTransactions: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  averageTransactionValue: number;
  paymentBreakdown: Record<PaymentMethod, number>;
}

export interface BestSellingProduct {
  productId: string;
  productName: string;
  variantName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface PeakHourData {
  hour: number;
  transactionCount: number;
  revenue: number;
}

// ---- Hardware ----
export interface PrinterConfig {
  type: 'usb' | 'bluetooth' | 'network';
  paperWidth: 58 | 80;
  characterSet: 'pc437' | 'pc858';
}

export interface HardwareStatus {
  printer: 'connected' | 'disconnected' | 'error';
  scanner: 'active' | 'inactive';
  drawer: 'connected' | 'disconnected';
}
