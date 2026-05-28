import React, { useState, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';

interface ItemSearchProps {
  onSelectProduct: (product: any) => void;
  disabled?: boolean;
}

/**
 * ItemSearch Component - Real-time product search and barcode scanning
 * Supports SKU, barcode, and full-text search with instant results
 */
export const ItemSearch: React.FC<ItemSearchProps> = ({ onSelectProduct, disabled = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { isOnline } = useOfflineSyncStore();

  // Debounced search function
  const handleSearch = useCallback(
    async (term: string) => {
      setSearchTerm(term);

      if (term.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      setShowResults(true);

      try {
        const accessToken = localStorage.getItem('access_token');
        const outletId = localStorage.getItem('outlet_id');

        const response = await fetch(
          `/api/v1/cashier/products?search=${encodeURIComponent(term)}&outlet_id=${outletId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const { data } = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Barcode scanning handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!isOnline) {
      console.warn('Cannot search barcode while offline');
      return;
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      const outletId = localStorage.getItem('outlet_id');

      const response = await fetch('/api/v1/cashier/products/barcode-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ barcode, outlet_id: outletId }),
      });

      if (response.ok) {
        const { data } = await response.json();
        onSelectProduct(data);
        setSearchTerm('');
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
    }
  }, [isOnline, onSelectProduct]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Search SKU, name, or scan barcode..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm.length > 0 && setShowResults(true)}
          disabled={disabled || !isOnline}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin">⌛</div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onSelectProduct(product);
                setSearchTerm('');
                setResults([]);
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">Rp {product.base_price.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${product.inventory?.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inventory?.available || 0} pcs
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && searchTerm.length > 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No products found
        </div>
      )}

      {!isOnline && (
        <p className="text-sm text-orange-600 mt-2 flex items-center gap-2">
          <span>📡</span> Offline mode - Limited search functionality
        </p>
      )}
    </div>
  );
};
