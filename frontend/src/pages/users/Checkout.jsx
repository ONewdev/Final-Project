import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CheckoutAddressForm from '../../components/CheckoutAddressForm';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const host = import.meta.env.VITE_HOST;

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const selected = location.state?.items ?? null;
    if (Array.isArray(selected) && selected.length > 0) {
      setCart(selected);
      return;
    }

    const cartKey = `cart_${user.id}`;
    const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (savedCart.length === 0) {
      navigate('/products');
      return;
    }

    setCart(savedCart);
  }, [user, navigate, location.state]);

  const handleRemoveItem = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);

    if (!location.state?.items) {
      const cartKey = `cart_${user?.id}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }
  };

  const handleUpdateQuantity = (productId, type) => {
    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        const nextQty = type === 'inc' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: nextQty };
      }
      return item;
    });

    setCart(updatedCart);

    if (!location.state?.items) {
      const cartKey = `cart_${user?.id}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }
  };

  const calculateTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price ?? 0);
      const quantity = Math.max(1, Number(item.quantity ?? 1));
      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const formatCurrency = (value) =>
    `฿${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

  const getProductImage = (imagePath) => {
    if (!imagePath) return '/images/no-image.png';
    return imagePath.startsWith('http') ? imagePath : `${host}${imagePath}`;
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    if (!user) {
      Swal.fire({ icon: 'error', title: 'กรุณาเข้าสู่ระบบก่อน' });
      return;
    }

    if (!deliveryInfo || !deliveryInfo.addressId || !deliveryInfo.shippingAddress || !deliveryInfo.phone) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลที่อยู่จัดส่ง',
        text: 'โปรดเลือกที่อยู่ที่มีอยู่หรือเพิ่มที่อยู่ใหม่ก่อนทำการสั่งซื้อ',
        confirmButtonColor: '#22c55e',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันคำสั่งซื้อ',
      text: 'ต้องการสั่งซื้อสินค้าในตะกร้าตอนนี้หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันสั่งซื้อ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#d33',
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const locationParts = [
        deliveryInfo.subdistrictName,
        deliveryInfo.districtName,
        deliveryInfo.provinceName,
        deliveryInfo.postalCode,
      ].filter(Boolean);

      const shippingAddress = [deliveryInfo.shippingAddress, locationParts.join(', ')].filter(Boolean).join('\n');

      const orderPayload = {
        customer_id: user.id,
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        product_list: cart.map((item) => ({ product_name: item.name, product_qty: item.quantity })),
        shipping_address: shippingAddress,
        phone: deliveryInfo.phone,
        note: note.trim() || undefined,
        address_id: deliveryInfo.addressId,
      };

      const response = await fetch(`${host}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'ไม่สามารถส่งคำสั่งซื้อได้ในขณะนี้');
      }

      if (!location.state?.items) {
        const cartKey = `cart_${user.id}`;
        localStorage.removeItem(cartKey);
      }

      await Swal.fire({
        icon: 'success',
        title: 'สั่งซื้อสำเร็จ',
        text: 'ขอบคุณ! เราจะเริ่มดำเนินการคำสั่งซื้อให้ทันที',
        confirmButtonColor: '#22c55e',
      });

      navigate('/users/orders');
    } catch (error) {
      console.error('Error submitting order:', error);
      Swal.fire({
        icon: 'error',
        title: 'สั่งซื้อไม่สำเร็จ',
        text: error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ชำระเงิน</h1>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-semibold">1</span>
              <span className="ml-2">ตรวจสอบตะกร้า</span>
            </div>
            <span className="mx-3 text-gray-300">-</span>
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-semibold">2</span>
              <span className="ml-2 font-medium text-gray-900">ชำระเงิน</span>
            </div>
            <span className="mx-3 text-gray-300">-</span>
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">3</span>
              <span className="ml-2">เสร็จสิ้น</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">สรุปรายการสั่งซื้อ</h2>
                <span className="text-sm text-gray-500">{cart.length} รายการ</span>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <img
                      src={getProductImage(item.image_url)}
                      onError={(event) => { event.currentTarget.src = '/images/no-image.png'; }}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg ring-1 ring-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-green-600 font-semibold mt-1">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 'dec')}
                        className="h-9 w-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                        aria-label="ลดจำนวน"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 'inc')}
                        className="h-9 w-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        aria-label="เพิ่มจำนวน"
                      >
                        +
                      </button>
                    </div>
                    <div className="hidden sm:block w-24 text-right font-semibold text-gray-900">
                      {formatCurrency(Number(item.price ?? 0) * Math.max(1, Number(item.quantity ?? 1)))}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-2 text-red-600 hover:text-red-700 text-sm"
                      type="button"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลจัดส่ง</h2>

              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-5">
                <CheckoutAddressForm user={user} host={host} onChange={setDeliveryInfo} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุการจัดส่ง (ถ้ามี)</label>
                  <textarea
                    name="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 placeholder:text-gray-400"
                    placeholder="ระบุคำแนะนำให้พนักงานจัดส่ง"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 lg:sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900">สรุปการชำระเงิน</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนชิ้นในตะกร้า</span>
                  <span>{cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity ?? 1)), 0)} ชิ้น</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ราคารวมย่อย</span>
                  <span>{formatCurrency(calculateTotal)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                  <span>รวมทั้งหมด</span>
                  <span className="text-green-600">{formatCurrency(calculateTotal)}</span>
                </div>
              </div>
              <button
                type="submit"
                form="checkout-form"
                disabled={loading || cart.length === 0}
                className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-white font-semibold shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'กำลังดำเนินการ...' : 'สั่งซื้อ'}
              </button>
              <p className="mt-3 text-xs text-gray-500">
                เมื่อดำเนินการต่อ ถือว่าคุณยอมรับเงื่อนไขการสั่งซื้อของร้าน
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;

