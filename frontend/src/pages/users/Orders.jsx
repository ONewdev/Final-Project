
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersNavbar from '../../components/OrdersNavbar';

function Orders() {
  const host = import.meta.env.VITE_HOST;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  // เพิ่ม cart state และ getCartKey
  const [cart, setCart] = useState([]);
  const getCartKey = () => (user ? `cart_${user.id}` : 'cart_guest');

  const formatCurrency = (num) => (
    num !== undefined && num !== null && !isNaN(Number(num))
      ? `฿${Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      : '-'
  );

  // โหลดข้อมูลคำสั่งซื้อจาก backend
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${host}/api/orders/customer/${user.id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error('Failed to fetch orders');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, host, navigate]);

  // โหลดข้อมูลตะกร้าจาก localStorage
  useEffect(() => {
    if (user) {
      const cartKey = getCartKey();
      const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
      setCart(savedCart);
      
      // Dispatch event เพื่ออัปเดต cart count ใน Navbar
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [user]);

  // ลบสินค้าออกจาก cart
  const handleRemoveItem = (productId) => {
    const cartKey = getCartKey();
    const currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const newCart = currentCart.filter((item) => (item.product_id || item.id) !== productId);
    localStorage.setItem(cartKey, JSON.stringify(newCart));
    setCart(newCart);
    
    // Dispatch event เพื่ออัปเดต cart count ใน Navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // เพิ่ม/ลดจำนวนสินค้า
  const handleUpdateQuantity = (productId, type) => {
    const cartKey = getCartKey();
    const currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const newCart = currentCart.map((item) => {
      if ((item.product_id || item.id) === productId) {
        let newQty = item.quantity;
        if (type === 'inc') newQty += 1;
        if (type === 'dec') newQty = Math.max(1, newQty - 1);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0);
    
    localStorage.setItem(cartKey, JSON.stringify(newCart));
    setCart(newCart);
    
    // Dispatch event เพื่ออัปเดต cart count ใน Navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // คำนวณยอดรวมของตะกร้า
  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // ไปหน้า Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }
    navigate('/users/checkout');
  };

  // ล้างตะกร้า
  const handleClearCart = () => {
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    setCart([]);
    
    // Dispatch event เพื่ออัปเดต cart count ใน Navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // แสดงสถานะคำสั่งซื้อ
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'รอชำระเงิน/รออนุมัติ',
      'approved': 'ชำระเงินแล้ว/อนุมัติแล้ว',
      'confirmed': 'ยืนยันแล้ว',
      'processing': 'กำลังดำเนินการ',
      'shipped': 'กำลังจัดส่ง',
      'delivered': 'จัดส่งสำเร็จ',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-amber-100 text-amber-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // จัดกลุ่มคำสั่งซื้อตามวันที่
  const groupOrdersByDate = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('th-TH');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(order);
    });
    return grouped;
  };

  // --- เพิ่มฟังก์ชันยืนยันรับสินค้า ---
  const handleConfirmOrder = async (orderId) => {
    try {
      const response = await fetch(`${host}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
        credentials: 'include',
      });
      if (response.ok) {
        // รีเฟรชข้อมูลออเดอร์ใหม่
        const updatedOrders = await fetch(`${host}/api/orders/customer/${user.id}`, { credentials: 'include' });
        if (updatedOrders.ok) {
          setOrders(await updatedOrders.json());
        }
      } else {
        alert('เกิดข้อผิดพลาดในการยืนยันรับสินค้า');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    );
  }
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?',
      text: 'หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ไม่ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${host}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        // รีเฟรชข้อมูลออเดอร์ใหม่
        const updatedOrders = await fetch(`${host}/api/orders/customer/${user.id}`, { credentials: 'include' });
        if (updatedOrders.ok) {
          setOrders(await updatedOrders.json());
        }
        Swal.fire('สำเร็จ', 'ยกเลิกออเดอร์เรียบร้อยแล้ว', 'success');
      } else {
        Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์', 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
      console.error('Error cancelling order:', error);
    }
  };

  // สถานะทั้งหมดที่ใช้ filter
  const statusTabs = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'pending', label: 'ที่ต้องชำระ' },
    { key: 'confirmed', label: 'ที่ต้องจัดส่ง' },
    { key: 'shipped', label: 'ที่ต้องรับ' },
    { key: 'delivered', label: 'สำเร็จแล้ว' },
    { key: 'cancelled', label: 'ยกเลิก' },
  ];

  // filter orders ตาม selectedStatus
  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(o => o.status === selectedStatus);
  const groupedOrders = groupOrdersByDate(filteredOrders);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
       
  {/* Navbar สำหรับนำทางไปแต่ละหน้าสถานะออเดอร์ */}
  <OrdersNavbar />
        {/* ประวัติคำสั่งซื้อ */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">ประวัติคำสั่งซื้อ</h2>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              ยังไม่มีคำสั่งซื้อ
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{date}</h3>
                  <div className="space-y-4">
                    {dateOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold">รหัสออเดอร์: #{String(order.id).padStart(4, '0')}</span>
                            <span className="ml-4 text-sm text-gray-500">{getStatusText(order.status)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-lg">
                              {order.total_price !== undefined && order.total_price !== null && !isNaN(Number(order.total_price))
                                ? `฿${Number(order.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </span>
                          </div>
                        </div>
                        {/* แสดงรายการสินค้าในออเดอร์ */}
                        <div className="flex flex-wrap gap-4 mb-2">
                          {order.items && order.items.length > 0 ? (
                            <>
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={item.id || idx} className="flex items-center gap-2 border rounded p-2 bg-gray-50">
                                  {item.image_url && (
                                    <img src={`${host}${item.image_url}`} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                                  )}
                                  <div>
                                    <div className="font-medium">{item.product_name}</div>
                                    <div className="text-xs text-gray-500">จำนวน: {item.quantity}</div>
                                    <div className="text-xs text-gray-500">ราคา: {item.price !== undefined && item.price !== null && !isNaN(Number(item.price)) ? `฿${Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}</div>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="flex items-center gap-2 border rounded p-2 bg-gray-100 text-gray-600 text-xs font-medium">
                                  +{order.items.length - 3} รายการ
                                </div>
                              )}
                            </>
                          ) : <span className="text-gray-400">ไม่มีสินค้า</span>}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {/* ปุ่มชำระเงิน เฉพาะสถานะ pending เท่านั้น */}
                          {order.status === 'pending' && (
                            <>
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                onClick={() => navigate(`/users/payments?order_id=${order.id}`)}
                              >
                                ชำระเงิน
                              </button>
                              <button
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                onClick={() => navigate(`/users/order/${order.id}`)}
                              >
                                ดูรายละเอียด
                              </button>
                            </>
                          )}
                          {/* ปุ่มยืนยันรับสินค้า เฉพาะสถานะ shipped */}
                          {order.status === 'shipped' && (
                            <>
                              <button
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                onClick={() => handleConfirmOrder(order.id)}
                              >
                                ยืนยันรับสินค้า
                              </button>
                              <button
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                onClick={() => navigate(`/users/order/${order.id}`)}
                              >
                                ดูรายละเอียด
                              </button>
                            </>
                          )}
                          {/* ปุ่มยกเลิกออเดอร์ เฉพาะสถานะที่ยกเลิกได้ */}
                          {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && (
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              ยกเลิกออเดอร์
                            </button>
                          )}
                          {/* ปุ่มดูรายละเอียดและใบเสร็จ เฉพาะสถานะ delivered และ cancelled */}
                          {(order.status === 'delivered' || order.status === 'cancelled') && (
                            <>
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                onClick={() => navigate(`/users/order/${order.id}`)}
                              >
                                ดูรายละเอียด
                              </button>
                              {order.status === 'delivered' && (
                                <a
                                  href={`${host}/api/orders/${order.id}/receipt`}
                                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={`receipt_order_${order.id}.pdf`}
                                >
                                  ดูใบเสร็จ
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;