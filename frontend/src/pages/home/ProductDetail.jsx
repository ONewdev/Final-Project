import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { addFavorite, removeFavorite } from '../../services/likeFavoriteService';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const host = import.meta.env.VITE_HOST;

  // โหลดฟอนต์ไทย (เพื่อความคมชัด/คงที่ทั้งหน้า)
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  // ดึงรายละเอียดสินค้า
  useEffect(() => {
    if (!id) return;
    fetch(`${host}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching product:', err);
        setLoading(false);
      });
  }, [id, host]);

  // เช็คสถานะ favorite ของสินค้านี้
  useEffect(() => {
    const fetchFav = async () => {
      if (!user || !product) return;
      try {
        const res = await fetch(
          `${host}/api/interactions/favorite/status?customer_id=${user.id}&product_id=${product.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(!!data.favorited);
        } else {
          setIsFavorited(false);
        }
      } catch {
        setIsFavorited(false);
      }
    };
    fetchFav();
  }, [user, product, host]);

  // utils
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.trim()) return '/images/no-image.png';
    if (host.endsWith('/') && imageUrl.startsWith('/')) return `${host.slice(0, -1)}${imageUrl}`;
    return `${host}${imageUrl}`;
  };

  const formatPrice = (price) => {
    const n = parseFloat(price);
    return Number.isFinite(n)
      ? `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      : '-';
  };

  // actions
  const ensureLogin = (msg = 'กรุณาเข้าสู่ระบบ', next = '/login') => {
    Swal.fire({
      icon: 'warning',
      title: msg,
      confirmButtonText: 'เข้าสู่ระบบ',
      showCancelButton: true,
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#dc2626',
    }).then((r) => r.isConfirmed && navigate(next));
  };

  const handleAddToCart = () => {
    if (!user) return ensureLogin('คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
    if (!product) return;

    const key = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(key)) || [];
    const found = cart.find((i) => i.id === product.id);
    if (found) {
      found.quantity += qty;
    } else {
      cart.push({ ...product, quantity: qty, price: Number(product.price) });
    }
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    Swal.fire({
      icon: 'success',
      title: 'เพิ่มสินค้าลงตะกร้าแล้ว!',
      showConfirmButton: false,
      timer: 1400,
      confirmButtonColor: '#16a34a',
    });
  };

  const handleBuyNow = () => {
    if (!user) return ensureLogin('คุณต้องเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า');
    if (!product) return;

    const key = `cart_${user.id}`;
    const cart = [{ ...product, quantity: qty, price: Number(product.price) }];
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/users/checkout');
  };

  const toggleFavorite = async () => {
    if (!user) return ensureLogin('คุณต้องเข้าสู่ระบบก่อนเพิ่มในรายการโปรด');
    if (!product) return;

    try {
      if (isFavorited) {
        await removeFavorite(user.id, product.id);
        setIsFavorited(false);
        Swal.fire({ icon: 'success', title: 'นำออกจากรายการโปรดแล้ว', timer: 1200, showConfirmButton: false });
      } else {
        await addFavorite(user.id, product.id);
        setIsFavorited(true);
        Swal.fire({ icon: 'success', title: 'เพิ่มในรายการโปรดแล้ว', timer: 1200, showConfirmButton: false });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถอัพเดทรายการโปรดได้', confirmButtonColor: '#16a34a' });
    }
  };

  // UI
  return (
    <div
      className="min-h-screen bg-gray-50 antialiased text-gray-800 selection:bg-green-200/60"
      style={{ fontFamily: "'Prompt','Kanit',sans-serif" }}
    >
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          className="mb-6 inline-flex items-center gap-2 text-green-700 hover:text-green-800 hover:underline font-semibold"
          onClick={() => navigate(-1)}
        >
          <span>←</span> <span>กลับ</span>
        </button>

        {loading ? (
          <p className="text-center text-lg text-gray-600">กำลังโหลด...</p>
        ) : !product ? (
          <p className="text-center text-red-500">ไม่พบข้อมูลสินค้า</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* รูปสินค้า + ป้ายลดราคา + หัวใจ */}
              <div className="w-full md:w-[420px] shrink-0">
                <div className="relative overflow-hidden rounded-xl border">
                  <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-[380px] object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/no-image.png';
                    }}
                    loading="lazy"
                  />
                  {Number(product.originalPrice) > Number(product.price) && (
                    <div className="absolute left-3 top-3 rounded-full bg-red-500/95 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      ลด {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                  )}
                  <button
                    onClick={toggleFavorite}
                    aria-pressed={isFavorited}
                    className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-pink-500 shadow-md transition hover:bg-white"
                    title="รายการโปรด"
                  >
                    {isFavorited ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                  </button>
                </div>
              </div>

              {/* เนื้อหา */}
              <div className="flex-1">
                <div className="mb-2">
                  <span className="inline-block rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {product.category_name || '-'}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-gray-700 leading-relaxed mb-5 whitespace-pre-line">
                    {product.description}
                  </p>
                )}

                <div className="flex items-end gap-3 mb-6">
                  <span className="tabular-nums text-3xl md:text-4xl font-black text-green-700 leading-none">
                    {formatPrice(product.price)}
                  </span>
                  {Number(product.originalPrice) > Number(product.price) && (
                    <span className="tabular-nums text-base md:text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* จำนวนสินค้า */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-600">จำนวน</span>
                  <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="ลดจำนวน"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 text-center py-2 outline-none focus:ring-0"
                    />
                    <button
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="เพิ่มจำนวน"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ปุ่มหลัก */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    className="rounded-xl border-2 border-green-600 bg-gradient-to-r from-green-600 to-green-500 py-3 font-semibold text-white shadow-sm transition-all hover:from-green-700 hover:to-green-600 active:scale-[0.98] tracking-tight"
                    onClick={handleAddToCart}
                  >
                    เพิ่มลงตะกร้า
                  </button>
                  <button
                    className="rounded-xl border-2 border-green-500 bg-white py-3 font-semibold text-green-700 transition hover:bg-green-50 active:scale-[0.98] tracking-tight"
                    onClick={handleBuyNow}
                  >
                    สั่งซื้อเลย
                  </button>
                </div>

                {/* ข้อมูลเสริม */}
                <div className="mt-6 text-sm text-gray-500">
                  หมวดหมู่: <span className="font-medium text-gray-700">{product.category_name || '-'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
