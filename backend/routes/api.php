<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Branch\BranchController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\IngredientController;
use App\Http\Controllers\Inventory\HppController;
use App\Http\Controllers\Inventory\WasteLogController;
use App\Http\Controllers\Transaction\TransactionController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Employee\EmployeeController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Discount\DiscountController;
use App\Http\Controllers\Loyalty\LoyaltyController;
use App\Http\Controllers\Supplier\SupplierController;
use App\Http\Controllers\Tax\TaxController;
use App\Http\Controllers\Setting\SettingController;
use App\Http\Controllers\AccessControl\AccessControlController;
use App\Http\Controllers\Category\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/lock', [AuthController::class, 'lock']);
    Route::post('/unlock', [AuthController::class, 'unlock']);
    Route::post('/verify-pin', [AuthController::class, 'verifyAdminPin']);
    Route::post('/update-pin', [AuthController::class, 'updatePin']);

    // Admin & Cashier common route: branches
    Route::get('/branches', [BranchController::class, 'index']);

    // POS cashier specific
    Route::prefix('pos')->group(function () {
        Route::post('/transactions', [TransactionController::class, 'store']);
        Route::post('/transactions/sync', [TransactionController::class, 'sync']);
        Route::get('/transactions/history', [TransactionController::class, 'posHistory']);
        Route::post('/shifts/open', [TransactionController::class, 'openShift']);
        Route::post('/shifts/close', [TransactionController::class, 'closeShift']);
        Route::get('/shifts/current', [TransactionController::class, 'currentShift']);
    });

    // Products & Inventory (existing)
    Route::apiResource('products', ProductController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::post('/products/{product}/stock-adjustment', [InventoryController::class, 'adjustStock']);
    Route::get('/inventory/movements', [InventoryController::class, 'movements']);
    Route::get('/inventory/low-stock', [InventoryController::class, 'lowStockAlerts']);

    // ── Ingredients (Bahan Baku) ──────────────────────────────────
    Route::apiResource('ingredients', IngredientController::class);
    Route::post('/ingredients/{ingredient}/stock-in', [IngredientController::class, 'stockIn']);
    Route::post('/restock-drafts/generate', [IngredientController::class, 'generateRestockDraft']);

    // ── HPP & Recipe (Resep Produk) ───────────────────────────────
    Route::get('/products/{product}/hpp', [HppController::class, 'show']);
    Route::post('/products/{product}/hpp/recalculate', [HppController::class, 'recalculate']);
    Route::post('/hpp/recalculate-all', [HppController::class, 'recalculateAll']);
    Route::put('/products/{product}/recipe', [HppController::class, 'upsertRecipe']);

    // ── Waste Logs (Log Limbah) ───────────────────────────────────
    Route::get('/waste-logs/analytics', [WasteLogController::class, 'analytics']); // sebelum resource agar tidak tertimpa
    Route::apiResource('waste-logs', WasteLogController::class)->only(['index', 'store', 'show']);

    // CRM, Loyalty & Discounts
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/purchase-history', [CustomerController::class, 'purchaseHistory']);
    Route::apiResource('discounts', DiscountController::class);
    Route::get('/loyalty/config', [LoyaltyController::class, 'getConfig']);
    Route::post('/loyalty/config', [LoyaltyController::class, 'updateConfig']);
    Route::get('/loyalty/ledger', [LoyaltyController::class, 'ledger']);
    Route::post('/loyalty/adjust', [LoyaltyController::class, 'adjustPoints']);

    // Suppliers & Purchasing
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('purchase-orders', SupplierController::class); // Simple mock
    
    // Tax Config
    Route::get('/tax-configs', [TaxController::class, 'index']);
    Route::put('/tax-configs/{tax}', [TaxController::class, 'update']);

    // Reports & Dashboard
    Route::get('/dashboard/kpis', [ReportController::class, 'kpis']);
    Route::get('/reports/sales-summary', [ReportController::class, 'salesSummary']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/payment-methods', [ReportController::class, 'paymentMethods']);
    Route::get('/reports/hourly-sales', [ReportController::class, 'hourlySales']);

    // Settings & Access Control
    Route::get('/settings', [SettingController::class, 'getSettings']);
    Route::post('/settings', [SettingController::class, 'updateSettings']);
    Route::get('/access-control/permissions', [AccessControlController::class, 'getPermissions']);
    Route::post('/access-control/permissions', [AccessControlController::class, 'updatePermissions']);

    // Admin Employee management
    Route::apiResource('employees', EmployeeController::class);
});
