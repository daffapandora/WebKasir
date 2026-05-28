<?php
// ============================================
// KasirPro — API Routes (v1)
// ============================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\ProductController;

Route::prefix('v1')->group(function () {
    
    // ---- Public Routes ----
    Route::post('/auth/login', [AuthController::class, 'login']);

    // ---- Protected Routes ----
    Route::middleware('auth:sanctum')->group(function () {
        
        // Auth
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        // ---- Tenant Scoped Routes ----
        Route::middleware('tenant')->group(function () {

            // Sync Endpoints (Used by the offline-first POS client)
            Route::prefix('sync')->group(function () {
                // Pull master data (Products, Categories, etc) down to client Dexie DB
                Route::get('/master-data', [SyncController::class, 'pullMasterData']);
                
                // Push offline transactions up to the server
                Route::post('/transactions', [SyncController::class, 'pushTransactions']);
            });

            // Cashier Terminal API
            Route::prefix('cashier')->group(function () {
                
                // Products (Product catalog, search, barcode lookup)
                Route::prefix('products')->group(function () {
                    Route::get('/', [ProductController::class, 'index']); // Search/filter
                    Route::get('/low-stock', [ProductController::class, 'lowStock']); // Low stock alerts
                    Route::post('/barcode-search', [ProductController::class, 'searchByBarcode']); // Quick lookup
                    Route::get('/{product}', [ProductController::class, 'show']); // Product details
                });

                // Transactions (Checkout, void, hold, resume)
                Route::prefix('transactions')->group(function () {
                    Route::post('/', [TransactionController::class, 'store']); // Checkout
                    Route::get('/', [TransactionController::class, 'index']); // List recent
                    Route::get('/{transaction}', [TransactionController::class, 'show']); // View receipt
                    Route::post('/{transaction}/void', [TransactionController::class, 'void']); // Void (PIN required)
                    Route::post('/{transaction}/hold', [TransactionController::class, 'hold']); // Hold
                    Route::post('/{transaction}/resume', [TransactionController::class, 'resume']); // Resume
                });
            });

            // Role Protected Examples (For full dashboard management - to be implemented)
            Route::middleware('role:owner,manager')->group(function () {
                // Future: reporting, analytics
                // Route::apiResource('reports', ReportController::class);
            });

            Route::middleware('role:owner')->group(function () {
                // Future: user management, system config
                // Route::apiResource('users', UserController::class);
            });

        });
    });
});
