'use client';

import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory, logAuditTrail, getStockMovements } from '@/lib/firebase-service';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, Loader2, X, Upload, EyeOff, Eye, BarChart3, History, Layers } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useIngredientStore } from '@/store/ingredient-store';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Pagination, usePagination } from '@/components/shared/pagination';
import type { Product, Category, StockMovement, ProductVariant } from '@/types';

export default function ProductsPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { fetchIngredients, ingredients: allIngredients } = useIngredientStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState<'general' | 'variants' | 'recipe'>('general');
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>('');
  const [formSalePrice, setFormSalePrice] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>(0);
  const [formMinStock, setFormMinStock] = useState<number | ''>(5);
  const [formUnitType, setFormUnitType] = useState('pcs');
  const [formUnitValue, setFormUnitValue] = useState<number | ''>(1);
  const [formImageText, setFormImageText] = useState('');
  const [formHasBatch, setFormHasBatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Category creation states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [savingCategory, setSavingCategory] = useState(false);

  // Recipe (BOM) state
  const [formUseRecipe, setFormUseRecipe] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState<{ ingredient_id: number; quantity_needed: number }[]>([]);
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState<number | ''>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number | ''>(1);

  // A4: Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  // A5: Deactivate confirmation modal
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);

  // B3-15: Stock history modal
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (stockHistoryProduct) {
      setLoadingMovements(true);
      getStockMovements()
        .then(list => {
          setStockMovements(list.filter(m => m.product_id === stockHistoryProduct.id));
        })
        .catch(console.error)
        .finally(() => setLoadingMovements(false));
    }
  }, [stockHistoryProduct]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prodList);
      setCategories(catList);
      await fetchIngredients();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openAddForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('PRD-' + Date.now().toString().slice(-6));
    setFormBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString());
    setFormCategoryId('');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormStock(0);
    setFormMinStock(5);
    setFormUnitType('pcs');
    setFormUnitValue(1);
    setFormImageText('');
    setFormHasBatch(false);
    setFormTab('general');
    setFormVariants([]);
    setFormUseRecipe(false);
    setRecipeIngredients([]);
    setSelectedIngredientToAdd('');
    setQuantityToAdd(1);
    setShowAddCategory(false);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormBarcode(product.barcode);
    setFormCategoryId(product.category_id);
    setFormCostPrice(product.cost_price);
    setFormSalePrice(product.sale_price);
    setFormStock(product.stock);
    setFormMinStock(product.min_stock);
    
    // Parse unit (e.g., "10pcs" -> value 10, type "pcs")
    const unitMatch = (product.unit || 'pcs').match(/^(\d+)?\s*(.*)$/);
    setFormUnitValue(unitMatch && unitMatch[1] ? Number(unitMatch[1]) : 1);
    setFormUnitType(unitMatch && unitMatch[2] ? unitMatch[2].trim() : 'pcs');

    setFormImageText(product.image || '');
    setFormHasBatch(product.has_batch);
    setFormTab('general');
    setFormVariants(product.variants || []);
    setFormUseRecipe(product.use_recipe || false);
    setRecipeIngredients(product.ingredients || []);
    setSelectedIngredientToAdd('');
    setQuantityToAdd(1);
    setShowAddCategory(false);
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512000) {
      addToast('warning', 'Ukuran gambar terlalu besar', 'Gunakan gambar di bawah 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImageText(reader.result as string);
      addToast('info', 'Gambar dikonversi ke format teks');
    };
    reader.readAsDataURL(file);
  };

  const addVariant = () => {
    const newVar: ProductVariant = {
      id: Date.now() + Math.floor(Math.random() * 100),
      product_id: editingProduct?.id || 0,
      name: '',
      sku: `${formSku}-VAR-${formVariants.length + 1}`,
      sale_price: Number(formSalePrice) || 0,
      cost_price: Number(formCostPrice) || 0,
      stock: 0,
      is_active: true
    };
    setFormVariants([...formVariants, newVar]);
  };

  const updateVariantField = (idx: number, field: keyof ProductVariant, value: any) => {
    const updated = [...formVariants];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormVariants(updated);
  };

  const deleteVariant = (idx: number) => {
    setFormVariants(formVariants.filter((_, i) => i !== idx));
  };

  // Recipe helpers
  const addRecipeIngredient = () => {
    if (!selectedIngredientToAdd) return;
    const ingId = Number(selectedIngredientToAdd);
    const qty = Number(quantityToAdd) || 1;

    const exists = recipeIngredients.find(ri => ri.ingredient_id === ingId);
    if (exists) {
      setRecipeIngredients(recipeIngredients.map(ri =>
        ri.ingredient_id === ingId
          ? { ...ri, quantity_needed: Number((ri.quantity_needed + qty).toFixed(3)) }
          : ri
      ));
    } else {
      setRecipeIngredients([...recipeIngredients, { ingredient_id: ingId, quantity_needed: qty }]);
    }
    setSelectedIngredientToAdd('');
    setQuantityToAdd(1);
  };

  const updateRecipeQty = (ingId: number, qty: number) => {
    if (qty <= 0) return;
    setRecipeIngredients(recipeIngredients.map(ri =>
      ri.ingredient_id === ingId ? { ...ri, quantity_needed: qty } : ri
    ));
  };

  const removeRecipeIngredient = (ingId: number) => {
    setRecipeIngredients(recipeIngredients.filter(ri => ri.ingredient_id !== ingId));
  };

  // Recalculate HPP
  const cogsEstimate = recipeIngredients.reduce((sum, item) => {
    const ing = allIngredients.find(i => i.id === item.ingredient_id);
    const cost = ing ? (ing.avg_cost_price || ing.cost_price || 0) : 0;
    return sum + (cost * item.quantity_needed);
  }, 0);

  const profitMarginEstimate = Number(formSalePrice) > 0
    ? ((Number(formSalePrice) - cogsEstimate) / Number(formSalePrice) * 100)
    : 0;

  const handleSaveCategory = async () => {
    if (!newCategoryName) return;
    try {
      setSavingCategory(true);
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const created = await addCategory({
        name: newCategoryName,
        slug,
        icon: newCategoryIcon || '📦',
        is_active: true
      });
      setCategories(prev => [...prev, created]);
      setFormCategoryId(created.id);
      setShowAddCategory(false);
      addToast('success', 'Kategori baru berhasil ditambahkan');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menambahkan kategori');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku || !formBarcode || !formCategoryId || !formSalePrice) {
      addToast('warning', 'Harap isi semua kolom wajib');
      return;
    }

    try {
      setSubmitting(true);
      const cat = categories.find(c => c.id === Number(formCategoryId));

      const finalCostPrice = formUseRecipe ? Math.round(cogsEstimate) : (Number(formCostPrice) || 0);
      const finalUnit = formUnitValue && Number(formUnitValue) > 1
        ? `${formUnitValue}${formUnitType}`
        : formUnitType;

      const payload = {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category_id: Number(formCategoryId),
        category_name: cat ? cat.name : 'Umum',
        cost_price: finalCostPrice,
        sale_price: Number(formSalePrice),
        stock: Number(formStock) || 0,
        min_stock: Number(formMinStock) || 0,
        unit: finalUnit,
        image: formImageText,
        has_batch: formHasBatch,
        variants: formVariants,
        is_active: true,
        use_recipe: formUseRecipe,
        ingredients: formUseRecipe ? recipeIngredients : []
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        await logAuditTrail(user?.name || 'System', 'update', 'products', `Mengubah produk: ${formName}`);
        addToast('success', 'Produk berhasil diperbarui');
      } else {
        await addProduct(payload);
        await logAuditTrail(user?.name || 'System', 'create', 'products', `Menambahkan produk baru: ${formName}`);
        addToast('success', 'Produk berhasil ditambahkan');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  // A5: Soft-delete — deactivate instead of hard delete
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await updateProduct(deactivateTarget.id, { is_active: false });
      await logAuditTrail(user?.name || 'System', 'deactivate', 'products', `Menonaktifkan produk: ${deactivateTarget.name}`);
      addToast('success', 'Produk berhasil dinonaktifkan');
      setDeactivateTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menonaktifkan produk');
    }
  };

  // A5: Reactivate
  const handleReactivate = async (product: Product) => {
    try {
      await updateProduct(product.id, { is_active: true });
      addToast('success', `Produk ${product.name} diaktifkan kembali`);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal mengaktifkan produk');
    }
  };

  // A4: Hard delete (only for products with no transaction history)
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      await logAuditTrail(user?.name || 'System', 'delete', 'products', `Menghapus produk: ${deleteTarget.name}`);
      addToast('success', 'Produk berhasil dihapus permanen');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus produk');
    }
  };

  // Filter logic + A5 inactive filter
  const filtered = products.filter(p => {
    if (!showInactive && !p.is_active) return false;
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    }
    return true;
  });

  // A11: Pagination
  const { currentPage, totalPages, perPage, paginatedItems, totalItems, handlePageChange, handlePerPageChange } = usePagination(filtered, 20);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Produk</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{products.length} produk terdaftar di database</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk, SKU, barcode..." className="input pl-10" />
        </div>
        <select
          value={selectedCategory ?? ''}
          onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          className="input w-auto"
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {/* A5: Toggle show inactive */}
        <button
          onClick={() => setShowInactive(v => !v)}
          className={cn('btn btn-sm gap-1.5', showInactive ? 'btn-primary' : 'btn-outline')}
        >
          {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showInactive ? 'Sembunyikan Nonaktif' : 'Tampilkan Nonaktif'}
        </button>
      </div>

      {/* Categories summary */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={cn('btn btn-sm whitespace-nowrap', selectedCategory === cat.id ? 'btn-primary' : 'btn-outline')}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data produk dari database...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Produk</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>SKU</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kategori</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Harga Beli</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Harga Jual</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Margin</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stok</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(product => {
                  const margin = product.sale_price > 0 ? ((product.sale_price - product.cost_price) / product.sale_price * 100).toFixed(1) : '0';
                  const isLow = product.stock <= product.min_stock;
                  const isOut = product.stock <= 0;

                  return (
                    <tr key={product.id} className={cn('border-b hover:bg-[var(--color-bg-elevated)] transition-colors', !product.is_active && 'opacity-50')} style={{ borderColor: 'var(--color-border-light)' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white" loading="lazy" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-[var(--color-bg-elevated)]">
                              {categories.find(c => c.id === product.category_id)?.icon || '📦'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                              {product.use_recipe && (
                                <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Menggunakan Resep / BOM">
                                  BOM
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{product.barcode}</p>
                            {product.variants && product.variants.length > 0 && (
                              <span className="badge badge-info text-[9px] px-1 py-0 px-1.5 h-auto leading-none">
                                {product.variants.length} Varian
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{product.sku}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{product.category_name}</td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(product.cost_price)}</td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(product.sale_price)}</td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-success)' }}>{margin}%</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn('badge', isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success')}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {product.is_active ? (
                           <span className="badge badge-success">Aktif</span>
                        ) : (
                          <span className="badge badge-danger">Nonaktif</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditForm(product)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          {/* A5: Soft-delete button */}
                          {product.is_active ? (
                            <button onClick={() => setDeactivateTarget(product)} className="btn btn-ghost btn-icon btn-sm" title="Nonaktifkan">
                              <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />
                            </button>
                          ) : (
                            <button onClick={() => handleReactivate(product)} className="btn btn-ghost btn-icon btn-sm" title="Aktifkan Kembali">
                              <Eye className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                            </button>
                          )}
                          <button onClick={() => setStockHistoryProduct(product)} className="btn btn-ghost btn-icon btn-sm" title="Riwayat Stok">
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(product)} className="btn btn-ghost btn-icon btn-sm" title="Hapus Permanen">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* A11: Pagination */}
          <div className="px-4 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </div>
        </div>
      )}

      {/* A4: Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Hapus Produk Permanen?"
          message={`Apakah Anda yakin ingin menghapus "${deleteTarget.name}" secara permanen? Tindakan ini tidak dapat dibatalkan. Gunakan opsi "Nonaktifkan" jika hanya ingin menyembunyikan produk.`}
          confirmLabel="Hapus Permanen"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* A5: Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <ConfirmModal
          title="Nonaktifkan Produk?"
          message={`Produk "${deactivateTarget.name}" akan dinonaktifkan dan tidak akan muncul di POS kasir. Anda dapat mengaktifkannya kembali kapan saja.`}
          confirmLabel="Nonaktifkan"
          variant="warning"
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}

      {/* B3-15: Stock History Modal */}
      {stockHistoryProduct && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content card w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" style={{ background: 'var(--color-bg-surface)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Riwayat Pergerakan Stok</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stockHistoryProduct.name} ({stockHistoryProduct.sku})</p>
              </div>
              <button onClick={() => setStockHistoryProduct(null)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMovements ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Memuat riwayat...</p>
                </div>
              ) : stockMovements.length === 0 ? (
                <div className="py-12 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Belum ada catatan pergerakan stok untuk produk ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {stockMovements.map(m => (
                    <div key={m.id} className="p-3 rounded-xl border flex justify-between items-start text-xs" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          <span className={cn('badge badge-sm', m.type === 'in' || (m.type === 'adjustment' && m.quantity > 0) ? 'badge-success' : 'badge-danger')}>
                            {m.type === 'in' ? 'Masuk' : m.type === 'out' ? 'Keluar' : 'Penyesuaian'}
                          </span>
                          <span>{m.reference}</span>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{m.reason || '—'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          Oleh: {m.user_name} · {new Date(m.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn('font-bold text-sm tabular-nums', m.type === 'in' || (m.type === 'adjustment' && m.quantity > 0) ? 'text-green-500' : 'text-red-500')}>
                          {m.type === 'in' || (m.type === 'adjustment' && m.quantity > 0) ? '+' : '-'}{Math.abs(m.quantity)} {stockHistoryProduct.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--color-border-light)' }}>
              <button onClick={() => setStockHistoryProduct(null)} className="btn btn-outline btn-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b px-4" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setFormTab('general')}
                className={cn(
                  'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-[2px] transition-all',
                  formTab === 'general'
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Informasi Utama
              </button>
              <button
                type="button"
                onClick={() => setFormTab('variants')}
                className={cn(
                  'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-[2px] transition-all',
                  formTab === 'variants'
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Varian Produk ({formVariants.length})
              </button>
              <button
                type="button"
                onClick={() => setFormTab('recipe')}
                className={cn(
                  'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-[2px] transition-all',
                  formTab === 'recipe'
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Resep / BOM
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {formTab === 'general' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1">Nama Produk *</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Contoh: Indomie Goreng" required />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">SKU *</label>
                    <input type="text" value={formSku} onChange={e => setFormSku(e.target.value)} className="input" placeholder="SKU-XXX" required />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Barcode / EAN *</label>
                    <input type="text" value={formBarcode} onChange={e => setFormBarcode(e.target.value)} className="input" placeholder="899xxxx" required />
                  </div>

                   <div>
                    {showAddCategory ? (
                      <div className="card p-3 border rounded-xl space-y-3 bg-[var(--color-bg-elevated)]" style={{ borderColor: 'var(--color-accent)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">Tambah Kategori Baru</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryIcon}
                            onChange={e => setNewCategoryIcon(e.target.value)}
                            placeholder="🍜"
                            className="input text-center w-12"
                            maxLength={2}
                          />
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="Nama kategori..."
                            className="input flex-1"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowAddCategory(false)}
                            className="btn btn-sm btn-outline py-1 px-3 text-[10px]"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveCategory}
                            disabled={savingCategory || !newCategoryName}
                            className="btn btn-sm btn-primary py-1 px-3 text-[10px]"
                          >
                            {savingCategory ? '...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="block text-xs font-semibold mb-1 flex justify-between items-center">
                          <span>Kategori *</span>
                          <button
                            type="button"
                            onClick={() => { setShowAddCategory(true); setNewCategoryName(''); }}
                            className="text-[10px] text-[var(--color-accent)] font-bold hover:underline"
                          >
                            + Kategori Baru
                          </button>
                        </label>
                        <select
                          value={formCategoryId}
                          onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                          className="input"
                          required
                        >
                          <option value="">Pilih Kategori</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Satuan</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formUnitValue}
                        onChange={e => setFormUnitValue(e.target.value ? Number(e.target.value) : '')}
                        className="input text-center w-20"
                        placeholder="1"
                      />
                      <select
                        value={formUnitType}
                        onChange={e => setFormUnitType(e.target.value)}
                        className="input flex-1"
                      >
                        <option value="pcs">pcs</option>
                        <option value="gram">gram (g)</option>
                        <option value="kg">kilogram (kg)</option>
                        <option value="ml">mililiter (ml)</option>
                        <option value="liter">liter (L)</option>
                        <option value="pack">pack</option>
                        <option value="box">box</option>
                        <option value="botol">botol</option>
                        <option value="kotak">kotak</option>
                        <option value="bungkus">bungkus</option>
                        <option value="sachet">sachet</option>
                        <option value="strip">strip</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Harga Beli (Modal) *</label>
                    <input type="number" value={formCostPrice} onChange={e => setFormCostPrice(Number(e.target.value))} className="input" placeholder="Rp" required />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Harga Jual *</label>
                    <input type="number" value={formSalePrice} onChange={e => setFormSalePrice(Number(e.target.value))} className="input" placeholder="Rp" required />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Stok Awal</label>
                    <input type="number" value={formStock} onChange={e => setFormStock(Number(e.target.value))} className="input" disabled={!!editingProduct} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Min Stok Peringatan</label>
                    <input type="number" value={formMinStock} onChange={e => setFormMinStock(Number(e.target.value))} className="input" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1">Gambar Produk (Max 500 KB)</label>
                    <div className="flex gap-4 items-center mt-1">
                      {formImageText && (
                        <img src={formImageText} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
                      )}
                      <label className="btn btn-outline flex-1 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Pilih Gambar (Teks Base64)
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {formImageText && (
                        <button type="button" onClick={() => setFormImageText('')} className="btn btn-danger btn-icon btn-sm">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-2 pt-2">
                    <input type="checkbox" id="hasBatch" checked={formHasBatch} onChange={e => setFormHasBatch(e.target.checked)} className="focus-ring" />
                    <label htmlFor="hasBatch" className="text-xs font-medium cursor-pointer">Produk ini memiliki Batch / Tanggal Kedaluwarsa</label>
                  </div>
                </div>
              ) : formTab === 'variants' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-gray-500">Daftar Variasi Spesifik Produk</p>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn btn-outline btn-sm text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Varian
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formVariants.map((variant, idx) => (
                      <div
                        key={variant.id}
                        className="p-3 border rounded-xl space-y-3 animate-slide-up"
                        style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-light)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>Varian #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => deleteVariant(idx)}
                            className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            title="Hapus Varian"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-semibold mb-0.5">Nama Varian (contoh: Rasa Cokelat, Ukuran XL) *</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={e => updateVariantField(idx, 'name', e.target.value)}
                              className="input input-sm"
                              placeholder="Nama variasi..."
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5">SKU *</label>
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={e => updateVariantField(idx, 'sku', e.target.value)}
                              className="input input-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5">Stok</label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={e => updateVariantField(idx, 'stock', Number(e.target.value))}
                              className="input input-sm"
                              disabled={!!editingProduct}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5">Harga Beli *</label>
                            <input
                              type="number"
                              value={variant.cost_price}
                              onChange={e => updateVariantField(idx, 'cost_price', Number(e.target.value))}
                              className="input input-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5">Harga Jual *</label>
                            <input
                              type="number"
                              value={variant.sale_price}
                              onChange={e => updateVariantField(idx, 'sale_price', Number(e.target.value))}
                              className="input input-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formVariants.length === 0 && (
                      <div className="text-center py-10 px-4 border border-dashed rounded-2xl" style={{ borderColor: 'var(--color-border-light)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tidak Ada Varian</p>
                        <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                          Produk ini hanya memiliki satu varian tunggal. Jika memiliki beberapa opsi (seperti ukuran, warna, rasa), klik tombol di bawah untuk menambahkan varian.
                        </p>
                        <button type="button" onClick={addVariant} className="btn btn-primary btn-sm">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Varian Pertama
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Recipe/BOM tab
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="use_recipe"
                      checked={formUseRecipe}
                      onChange={e => setFormUseRecipe(e.target.checked)}
                      className="focus-ring"
                    />
                    <label htmlFor="use_recipe" className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      Gunakan Resep / Komposisi Bahan Baku (BOM)
                    </label>
                  </div>

                  {formUseRecipe && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Dropdown tambah bahan */}
                      <div className="p-3 border rounded-xl space-y-2 bg-[var(--color-bg-primary)]" style={{ borderColor: 'var(--color-border-light)' }}>
                        <label className="block text-[10px] font-bold text-gray-500">Tambah Bahan Baku ke Resep</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedIngredientToAdd}
                            onChange={e => setSelectedIngredientToAdd(e.target.value ? Number(e.target.value) : '')}
                            className="input input-sm flex-1 text-xs"
                          >
                            <option value="">Pilih Bahan Baku...</option>
                            {allIngredients.filter(i => i.is_active).map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Jumlah"
                            value={quantityToAdd}
                            onChange={e => setQuantityToAdd(e.target.value ? Number(e.target.value) : '')}
                            className="input input-sm w-20 text-xs text-center"
                            min="0.001"
                            step="0.001"
                          />
                          <button
                            type="button"
                            onClick={addRecipeIngredient}
                            disabled={!selectedIngredientToAdd}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>

                      {/* Recipe Table */}
                      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border-light)' }}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ background: 'var(--color-bg-elevated)' }}>
                              <th className="text-left p-2 font-medium">Bahan Baku</th>
                              <th className="text-center p-2 font-medium w-24">Jumlah</th>
                              <th className="text-left p-2 font-medium w-16">Satuan</th>
                              <th className="text-right p-2 font-medium w-24">Harga/Unit</th>
                              <th className="text-right p-2 font-medium w-24">Subtotal</th>
                              <th className="text-center p-2 font-medium w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                            {recipeIngredients.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                  Belum ada bahan baku ditambahkan.
                                </td>
                              </tr>
                            ) : (
                              recipeIngredients.map(item => {
                                const ing = allIngredients.find(i => i.id === item.ingredient_id);
                                if (!ing) return null;
                                const cost = ing.avg_cost_price || ing.cost_price || 0;
                                const subtotal = cost * item.quantity_needed;

                                return (
                                  <tr key={item.ingredient_id} className="hover:bg-[var(--color-bg-elevated)]">
                                    <td className="p-2 font-medium">{ing.name}</td>
                                    <td className="p-1">
                                      <input
                                        type="number"
                                        value={item.quantity_needed}
                                        onChange={e => updateRecipeQty(item.ingredient_id, Number(e.target.value))}
                                        className="input input-sm py-0.5 px-1 text-center w-full"
                                        step="0.001"
                                        min="0.001"
                                      />
                                    </td>
                                    <td className="p-2 text-gray-500">{ing.unit}</td>
                                    <td className="p-2 text-right font-mono text-gray-500">Rp {cost.toLocaleString('id-ID')}</td>
                                    <td className="p-2 text-right font-mono font-medium">Rp {Math.round(subtotal).toLocaleString('id-ID')}</td>
                                    <td className="p-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeRecipeIngredient(item.ingredient_id)}
                                        className="btn btn-ghost btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Estimator */}
                      <div className="p-3 rounded-xl border space-y-2 bg-[var(--color-bg-elevated)]" style={{ borderColor: 'var(--color-border-light)' }}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">Estimasi HPP Bahan Baku:</span>
                          <span className="font-bold font-mono text-emerald-400">Rp {Math.round(cogsEstimate).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">Margin Setelah Bahan Baku:</span>
                          <span className="font-bold text-emerald-400">
                            Rp {Math.max(0, (Number(formSalePrice) || 0) - Math.round(cogsEstimate)).toLocaleString('id-ID')} ({profitMarginEstimate.toFixed(1)}%)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormCostPrice(Math.round(cogsEstimate))}
                          className="w-full mt-2 btn btn-outline btn-sm text-[10px]"
                        >
                          Gunakan Estimasi HPP sebagai Harga Beli Utama
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
