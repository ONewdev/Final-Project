import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { removeFavorite } from '../../services/likeFavoriteService';
import { FaHeart, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

function Favorite() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // สั่งซื้อสินค้า
  // เพิ่มสินค้าลง cart และไปหน้า orders
  const handleOrder = async (product) => {
    if (!user) return;
    const cartKey = `cart_${user.id}`;
    const currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    // ตรวจสอบว่ามีสินค้าใน cart แล้วหรือยัง
    const exists = currentCart.find(item => (item.product_id || item.id) === product.id);
    if (!exists) {
      currentCart.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        product_name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
      localStorage.setItem(cartKey, JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    setModalOpen(false);
    Swal.fire({
      icon: 'success',
      title: `เพิ่มสินค้าลงตะกร้าแล้ว`,
      showConfirmButton: false,
      timer: 900,
      confirmButtonColor: '#16a34a',
    });
    setTimeout(() => {
      navigate('/users/orders');
    }, 900);
  };
  const host = import.meta.env.VITE_HOST;
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // ดึงรายการโปรดจาก API ใหม่
    fetch(`${host}/api/customers/${user.id}/favorites`, { 
      credentials: 'include' 
    })
      .then(res => res.json())
      .then(data => {
        setFavorites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching favorites:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFavorites();
  }, [host, user]);

  const handleRemoveFavorite = async (productId) => {
    if (!user) return;
    try {
      await removeFavorite(user.id, productId);
      // รีเฟรชรายการหลังจากลบ
      fetchFavorites();
      Swal.fire({
        icon: 'success',
        title: 'ลบออกจากรายการโปรดแล้ว',
        showConfirmButton: false,
        timer: 1200,
        confirmButtonColor: '#16a34a',
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการลบรายการโปรด',
        confirmButtonColor: '#16a34a',
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice)
      ? "-"
      : `฿${numPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center text-gray-500 py-12">
          กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-green-700">สินค้าที่ถูกใจ</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-12">กำลังโหลด...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-gray-400 py-12">ยังไม่มีสินค้าที่ถูกใจ</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col relative"
            >
              <button
                onClick={() => handleRemoveFavorite(item.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition z-10"
                title="ลบออกจากรายการโปรด"
              >
                <FaTrash size={12} />
              </button>
              <img
                src={item.image_url ? `${host}${item.image_url}` : '/images/no-image.png'}
                alt={item.name}
                className="w-full h-40 object-cover rounded-lg mb-4 cursor-pointer"
                onClick={() => navigate(`/products/${item.id}`)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/watermark.png";
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{item.name}</h3>
                <div className="text-sm text-gray-500 mb-2">{item.category_name || '-'}</div>
                <div className="text-green-600 font-bold text-lg mb-2">
                  {formatPrice(item.price)}
                  {item.original_price && item.original_price > item.price && (
                    <span className="ml-2 text-red-500 text-sm line-through">
                      {formatPrice(item.original_price)}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
                <div className="text-xs text-gray-400 border-t pt-2">
                  เพิ่มเมื่อ: {formatDate(item.favorited_at)}
                </div>
              </div>
            </div>
          ))}
      {/* Modal แสดงรายละเอียดสินค้าและปุ่มสั่งซื้อ ถูกแทนที่ด้วยการ navigate ไปหน้า ProductDetail */}
        </div>
      )}
    </div>
  );
}

export default Favorite;