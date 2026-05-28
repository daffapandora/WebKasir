<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(
        public int $productId,
        public int $available,
        public int $requested
    ) {
        parent::__construct(
            "Insufficient stock for product ID {$productId}. Available: {$available}, Requested: {$requested}"
        );
    }
}

class InvalidTransactionException extends Exception
{
    public function __construct(string $message) {
        parent::__construct($message);
    }
}

class ManagerPinRequiredException extends Exception
{
    public function __construct(string $action = 'void transaction') {
        parent::__construct("Manager PIN required to {$action}");
    }
}

class UnauthorizedOutletAccessException extends Exception
{
    public function __construct(int $userId, int $outletId) {
        parent::__construct("User {$userId} not authorized to access outlet {$outletId}");
    }
}
