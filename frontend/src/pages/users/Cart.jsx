import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchCartItems, removeCartItem, updateCartItem, clearCartItems } from '../../services/cartService';

function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const host = import.meta.env.VITE_HOST;
  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const formatCurrency = (num) => (
    num !== undefined && num !== null && !isNaN(Number(num))
      ? `฿${Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      : '-'
  );

  const getItemKey = useCallback((item) => {
    const value = item?.product_id ?? item?.id;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }, []);

  const syncCartState = useCallback((items, { preserveSelection = true } = {}) => {
    const ids = items
      .map(getItemKey)
      .filter((id) => id !== undefined && id !== null && id !== '');
    const validIds = new Set(ids);
    setCart(items);
    setSelectedIds((prev) => {
      if (!preserveSelection) {
        return new Set(validIds);
      }
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
    window.dispatchEvent(new Event('cartUpdated'));
  }, [getItemKey]);

  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        syncCartState([], { preserveSelection: false });
        return;
      }
      try {
        const items = await fetchCartItems();
        syncCartState(items, { preserveSelection: false });
      } catch (err) {
        console.error('Failed to fetch cart items', err);
      }
    };
    loadCart();
  }, [user, syncCartState]);

  const handleRemoveItem = async (productId) => {
    const targetId = Number(productId) || productId;
    if (!targetId) return;
    try {
      const items = await removeCartItem(targetId);
      syncCartState(items);
    } catch (err) {
      alert(err.message || 'ไม่สามารถลบสินค้าออกจากตะกร้าได้');
    }
  };

  const handleUpdateQuantity = async (productId, typeOrValue) => {
    const targetId = Number(productId) || productId;
    if (!targetId) return;
    const existing = cart.find((item) => getItemKey(item) === targetId);
    if (!existing) return;
    let nextQty = Number(existing.quantity) || 1;
    if (typeof typeOrValue === 'number') {
      nextQty = Math.max(1, Number(typeOrValue) || 1);
    } else if (typeOrValue === 'inc') {
      nextQty += 1;
    } else if (typeOrValue === 'dec') {
      nextQty = Math.max(1, nextQty - 1);
    }
    if (nextQty === existing.quantity) return;
    try {
      const items = await updateCartItem(targetId, nextQty);
      syncCartState(items);
    } catch (err) {
      alert(err.message || 'ไม่สามารถปรับจำนวนสินค้าได้');
    }
  };

  // คำนวณยอดรวมของตะกร้า
  const calculateCartTotal = () => {
    return cart
      .filter(item => selectedIds.has(getItemKey(item)))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const countSelectedItems = () => {
    return cart
      .filter(item => selectedIds.has(getItemKey(item)))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const toggleSelectOne = (pid) => {
    const id = Number(pid) || pid;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = cart.length > 0 && cart.every(item => selectedIds.has(getItemKey(item)));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map(getItemKey).filter((id) => id !== undefined && id !== null && id !== '')));
  };

  // Checkout only selected items
  const handleCheckout = () => {
    const selectedItems = cart.filter(i => selectedIds.has(getItemKey(i)));
    if (selectedItems.length === 0) {
      alert("กรุณาเลือกสินค้าก่อนดำเนินการชำระเงิน");
      return;
    }
    const itemsForCheckout = selectedItems.map(i => ({
      ...i,
      id: i.product_id || i.id,
      name: i.name || i.product_name || i.title || "สินค้า #" + (i.product_id || i.id),
    }));
    navigate("/users/checkout", { state: { items: itemsForCheckout } });
  };
  const handleClearCart = async () => {
    try {
      const items = await clearCartItems();
      syncCartState(items, { preserveSelection: false });
    } catch (err) {
      alert(err.message || 'ไม่สามารถล้างตะกร้าได้');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ตะกร้าสินค้า</h1>
          <p className="mt-1 text-sm text-gray-600">ตรวจสอบสินค้า ปรับจำนวน และไปต่อขั้นตอนชำระเงิน</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">🛒</div>
            <p className="text-gray-800 font-medium">ยังไม่มีสินค้าในตะกร้า</p>
            <p className="text-sm text-gray-500 mt-1">เลือกชมสินค้าและกลับมาที่นี่อีกครั้ง</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-semibold hover:bg-green-700"
            >
              ไปเลือกซื้อสินค้า
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm ring-1 ring-gray-100">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">รายการสินค้า</h2>
                <span className="text-sm text-gray-500">{countSelectedItems()} ชิ้น</span>
              </div>

              {/* Mobile list */}
              <div className="p-4 space-y-3 md:hidden">
                {cart.map((item, idx) => (
                  <div key={item.product_id || item.id || idx} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.has(item.product_id || item.id)}
                      onChange={() => toggleSelectOne(item.product_id || item.id)}
                    />
                    {item.image_url && (
                      <img src={`${host}${item.image_url}`} alt={item.product_name || item.name} className="w-16 h-16 object-cover rounded-md ring-1 ring-gray-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.product_name || item.name}</div>
                      <div className="text-sm text-green-700 mt-0.5">{formatCurrency(item.price)}</div>
                      {item.product_id && (
                        <button
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 underline decoration-dotted"
                          onClick={() => navigate(`/home/product/${item.product_id}`)}
                        >
                          ดูรายละเอียด
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        title="ลดจำนวน"
                        onClick={() => handleUpdateQuantity(item.product_id || item.id, 'dec')}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        className="w-12 text-center border border-gray-300 rounded-md"
                        onChange={e => {
                          const val = Math.max(1, Number(e.target.value));
                          handleUpdateQuantity(item.product_id || item.id, val);
                        }}
                      />
                      <button
                        className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        title="เพิ่มจำนวน"
                        onClick={() => handleUpdateQuantity(item.product_id || item.id, 'inc')}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="ml-1 text-red-600 hover:text-red-700 text-xs"
                      title="ลบสินค้า"
                      onClick={() => handleRemoveItem(item.product_id || item.id)}
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-4 py-3 text-left font-medium">สินค้า</th>
                      <th className="px-4 py-3 text-center font-medium">จำนวน</th>
                      <th className="px-4 py-3 text-right font-medium">ราคา/หน่วย</th>
                      <th className="px-4 py-3 text-center font-medium">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item, idx) => (
                      <tr key={item.product_id || item.id || idx}>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedIds.has(item.product_id || item.id)}
                              onChange={() => toggleSelectOne(item.product_id || item.id)}
                            />
                            {item.image_url && (
                              <img src={`${host}${item.image_url}`} alt={item.product_name || item.name} className="w-12 h-12 object-cover rounded ring-1 ring-gray-200" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{item.product_name || item.name}</div>
                              {item.product_id && (
                                <button
                                  className="mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs"
                                  onClick={() => navigate(`/home/product/${item.product_id}`)}
                                >
                                  ดูรายละเอียด
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              title="ลดจำนวน"
                              onClick={() => handleUpdateQuantity(item.product_id || item.id, 'dec')}
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              className="w-14 text-center border border-gray-300 rounded-md"
                              onChange={e => {
                                const val = Math.max(1, Number(e.target.value));
                                handleUpdateQuantity(item.product_id || item.id, val);
                              }}
                            />
                            <button
                              className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              title="เพิ่มจำนวน"
                              onClick={() => handleUpdateQuantity(item.product_id || item.id, 'inc')}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-gray-900">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 align-middle text-center">
                          <button
                            className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                            title="ลบสินค้า"
                            onClick={() => handleRemoveItem(item.product_id || item.id)}
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 lg:sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900">สรุปตะกร้า</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>จำนวนสินค้า</span>
                    <span>{countSelectedItems()} ชิ้น</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ยอดสินค้า</span>
                    <span>{formatCurrency(calculateCartTotal())}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                    <span>ยอดรวมทั้งหมด</span>
                    <span className="text-green-600">{formatCurrency(calculateCartTotal())}</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClearCart}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-3 text-gray-800 font-semibold hover:bg-gray-200"
                  >
                    ล้างตะกร้า
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700"
                  >
                    ไปชำระเงิน
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;



