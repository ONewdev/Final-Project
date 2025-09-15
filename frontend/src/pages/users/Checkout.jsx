import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const host = import.meta.env.VITE_HOST;
  
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: '',
    phone: '',
    note: ''
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('new');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const selected = (location.state && location.state.items) ? location.state.items : null;
    if (selected && selected.length > 0) {
      setCart(selected);
      return;
    }

    // ดึงข้อมูลตะกร้าจาก localStorage
    const cartKey = `cart_${user.id}`;
    const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    if (savedCart.length === 0) {
      navigate('/products');
      return;
    }

    setCart(savedCart);

    // ดึงข้อมูลที่อยู่และเบอร์โทรของลูกค้า
    const fetchCustomerAddresses = async () => {
      try {
        const response = await fetch(`${host}/api/customers/${user.id}/addresses`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSavedAddresses(data);
          if (data.length > 0) {
            // ใช้ที่อยู่ล่าสุดเป็นค่าเริ่มต้น
            const latestAddress = data[0];
            setFormData(prev => ({
              ...prev,
              shipping_address: latestAddress.address,
              phone: latestAddress.phone
            }));
            setSelectedAddress(latestAddress.id);
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    fetchCustomerAddresses();
  }, [user, navigate, host]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRemoveItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    
    if (!(location.state && location.state.items)) {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }
  };

  const handleUpdateQuantity = (productId, type) => {
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        let newQty = item.quantity;
        if (type === 'inc') newQty += 1;
        if (type === 'dec') newQty = Math.max(1, newQty - 1);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    
    setCart(updatedCart);
    if (!(location.state && location.state.items)) {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!formData.shipping_address || !formData.phone) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลที่จำเป็น',
        confirmButtonColor: '#22c55e'
      });
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer_id: user.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        shipping_address: formData.shipping_address,
        phone: formData.phone
      };

      const response = await fetch(`${host}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (response.ok) {
        // ลบตะกร้าหลังจากสั่งซื้อสำเร็จ
        const cartKey = `cart_${user.id}`;
        localStorage.removeItem(cartKey);
        
        await Swal.fire({
          icon: 'success',
          title: 'สั่งซื้อสำเร็จ!',
          text: 'คำสั่งซื้อของคุณได้รับการยืนยันแล้ว',
          confirmButtonColor: '#22c55e'
        });
        navigate('/users/orders');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: result.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ',
          confirmButtonColor: '#22c55e'
        });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        confirmButtonColor: '#22c55e'
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ยืนยันการสั่งซื้อ</h1>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-semibold">1</span>
              <span className="ml-2">ตะกร้า</span>
            </div>
            <span className="mx-3 text-gray-300">—</span>
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-semibold">2</span>
              <span className="ml-2 font-medium text-gray-900">ยืนยัน</span>
            </div>
            <span className="mx-3 text-gray-300">—</span>
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">3</span>
              <span className="ml-2">ชำระเงิน</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* รายการสินค้า */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">รายการสินค้า</h2>
                <span className="text-sm text-gray-500">{cart.length} รายการ</span>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <img
                      src={`${host}${item.image_url}` || '/images/no-image.png'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg ring-1 ring-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-green-600 font-semibold mt-1">฿{parseFloat(item.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 'dec')}
                        className="h-9 w-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                        aria-label="decrease"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 'inc')}
                        className="h-9 w-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        aria-label="increase"
                      >
                        +
                      </button>
                    </div>
                    <div className="hidden sm:block w-24 text-right font-semibold text-gray-900">
                      ฿{(parseFloat(item.price) * item.quantity).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ฟอร์มข้อมูลการจัดส่ง */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลการจัดส่ง</h2>
              
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ที่อยู่จัดส่ง <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 placeholder:text-gray-400"
                    placeholder="กรอกที่อยู่จัดส่ง"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 placeholder:text-gray-400"
                    placeholder="081-234-5678"
                  />
                  <p className="mt-1 text-xs text-gray-500">โปรดระบุเบอร์ที่ติดต่อได้สะดวกสำหรับการจัดส่ง</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ (ถ้ามี)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 placeholder:text-gray-400"
                    placeholder="รายละเอียดเพิ่มเติมหรือคำแนะนำสำหรับการจัดส่ง"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* สรุปคำสั่งซื้อ */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 lg:sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900">สรุปคำสั่งซื้อ</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนสินค้า</span>
                  <span>{cart.reduce((sum, i) => sum + i.quantity, 0)} ชิ้น</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ยอดสินค้า</span>
                  <span>฿{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                  <span>ยอดรวมทั้งหมด</span>
                  <span className="text-green-600">฿{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
              <button
                type="submit"
                form="checkout-form"
                disabled={loading || cart.length === 0}
                className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-white font-semibold shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'กำลังประมวลผล...' : 'ยืนยันการสั่งซื้อ'}
              </button>
              <p className="mt-3 text-xs text-gray-500">โดยการกด “ยืนยันการสั่งซื้อ” ถือว่าคุณยอมรับเงื่อนไขการสั่งซื้อของร้าน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout; 


