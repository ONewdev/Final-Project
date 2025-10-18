import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ShoppingCart, UserCircle, Bell, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchCartItems } from '../services/cartService';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // เมนูมือถือ
  const [profileOpen, setProfileOpen] = useState(false); // เมนูโปรไฟล์
  const [avatarBroken, setAvatarBroken] = useState(false); // โหลดรูปโปรไฟล์ไม่สำเร็จ
  const [user, setUser] = useState(null);
  const host = import.meta.env.VITE_HOST || '';
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [notificationCount, setNotificationCount] = useState(() => {
    const cached = Number(localStorage.getItem('notif_count') || 0);
    return Number.isFinite(cached) ? cached : 0;
  });
  const [logoSrc, setLogoSrc] = useState('');

  const profileRef = useRef(null);
  const cartRef = useRef(null);

  // ฟอนต์
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

  // sync user
  useEffect(() => {
    const getUser = () => {
      const u = localStorage.getItem('user');
      try {
        setUser(u ? JSON.parse(u) : null);
      } catch {
        setUser(null);
      }
      setAvatarBroken(false);
    };
    getUser();
    window.addEventListener('userChanged', getUser);
    window.addEventListener('popstate', getUser);
    window.addEventListener('hashchange', getUser);
    return () => {
      window.removeEventListener('userChanged', getUser);
      window.removeEventListener('popstate', getUser);
      window.removeEventListener('hashchange', getUser);
    };
  }, [host]);

  // ปิดเมนูต่าง ๆ เมื่อเปลี่ยนเส้นทาง
  useEffect(() => {
    setIsMenuOpen(false);
    setProfileOpen(false);
    setShowCartPopup(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ตะกร้า
  useEffect(() => {
    let ignore = false;
    const updateCart = async () => {
      if (!user?.id) {
        if (!ignore) {
          setCartItems([]);
          setCartCount(0);
        }
        return;
      }
      try {
        const items = await fetchCartItems();
        if (!ignore) {
          setCartItems(items);
          const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          setCartCount(totalItems);
        }
      } catch {
        if (!ignore) {
          setCartItems([]);
          setCartCount(0);
        }
      }
    };
    updateCart();
    const handleUpdate = () => { updateCart(); };
    window.addEventListener('cartUpdated', handleUpdate);
    return () => {
      ignore = true;
      window.removeEventListener('cartUpdated', handleUpdate);
    };
  }, [user?.id]);

  // การแจ้งเตือน (ดึงจำนวน unread เป็นระยะ)
  useEffect(() => {
    if (!user || !user.id) {
      setNotificationCount(0);
      return;
    }
    let aborted = false;
    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${host}/api/notifications/unread_count?customer_id=${user.id}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (!aborted) {
          const n = Number(data?.count || 0);
          setNotificationCount(n);
          try { localStorage.setItem('notif_count', String(n)); } catch {}
        }
      } catch {}
    };
    fetchUnread();
    const onUpdated = () => setTimeout(fetchUnread, 200);
    window.addEventListener('notificationsUpdated', onUpdated);
    window.addEventListener('userChanged', fetchUnread);
    const t = setInterval(fetchUnread, 30000);
    return () => {
      aborted = true;
      window.removeEventListener('notificationsUpdated', onUpdated);
      window.removeEventListener('userChanged', fetchUnread);
      clearInterval(t);
    };
  }, [host, user?.id]);

  // Fetch contact info (logo) and refresh when admin updates it
  useEffect(() => {
    let aborted = false;
    const toAbsolute = (url) => {
      if (!url) return '';
      if (url.startsWith('/')) return `${host}${url}`;
      return url;
    };
    const fetchContactLogo = async () => {
      try {
        const res = await fetch(`${host}/api/contact`);
        if (!res.ok) return;
        const data = await res.json();
        const obj = Array.isArray(data) ? (data[0] || {}) : (data?.data || data || {});
        if (!aborted) setLogoSrc(toAbsolute(obj.logo || ''));
      } catch {
        // ignore
      }
    };
    fetchContactLogo();
    const onContactUpdated = () => setTimeout(fetchContactLogo, 200);
    window.addEventListener('contactUpdated', onContactUpdated);
    return () => {
      aborted = true;
      window.removeEventListener('contactUpdated', onContactUpdated);
    };
  }, [host]);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setShowCartPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // === คลิกกระดิ่ง ===
  const handleBellClick = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    setNotificationCount(0);
    try { localStorage.setItem('notif_count', '0'); } catch {}
    window.dispatchEvent(new Event('notificationsUpdated'));
    navigate('/users/notifications');
    try {
      await fetch(`${host}/api/notifications/mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customer_id: user.id }),
      });
    } catch {}
  };

  // active link helper (ครอบคลุมเส้นทางย่อย)
  const isActive = (to) => {
    if (to === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header
      className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200"
      style={{ fontFamily: "'Prompt','Kanit',sans-serif" }}
    >
      <style>{`
        @keyframes fade-in { from {opacity: 0; transform: translateY(4px)} to {opacity: 1; transform: translateY(0)} }
        .animate-fade-in { animation: fade-in .15s ease-out both; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* แถวบน */}
        <div className="flex justify-between items-center h-16">
          {/* ซ้าย: Logo + Hamburger */}
          <div className="flex items-center gap-3">
            {/* ปุ่ม Hamburger (มือถือ) */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-green-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label={isMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(v => !v)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/home" className="inline-flex items-center">
              <img
                src={logoSrc || '/images/655fc323-6c03-4394-ba95-5280da436298.jpg'}
                alt="Logo"
                className="h-10 w-auto"
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  if (e?.currentTarget && e.currentTarget.src !== window.location.origin + '/images/655fc323-6c03-4394-ba95-5280da436298.jpg') {
                    e.currentTarget.src = '/images/655fc323-6c03-4394-ba95-5280da436298.jpg';
                  }
                }}
              />
            </Link>
          </div>

          {/* กลาง: เมนู Desktop */}
          <nav className="hidden md:flex items-center space-x-2">
            {[
              { to: '/home', label: 'หน้าแรก' },
              { to: '/products', label: 'สินค้า' },
              { to: '/contact', label: 'ติดต่อเรา' },
              ...(user
                ? [
                    { to: '/users/favorite', label: 'รายการโปรด' },
                    { to: '/users/orders', label: 'คำสั่งซื้อของฉัน' },
                  ]
                : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-md font-semibold transition-colors ${
                  isActive(to) ? 'bg-green-600 text-white' : 'text-green-700 hover:bg-green-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ขวา: Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            {user && (
              <div
                className="relative"
                ref={cartRef}
                onMouseEnter={() => setShowCartPopup(true)}
                onMouseLeave={() => setShowCartPopup(false)}
              >
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition relative"
                  title="ตะกร้าสินค้า"
                  onClick={() => navigate('/users/cart')}
                  aria-label="ตะกร้าสินค้า"
                  aria-haspopup="dialog"
                >
                  <ShoppingCart className="w-7 h-7 text-green-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center" aria-live="polite">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>

                {/* Cart popup */}
                {showCartPopup && (
                  <div className="absolute right-0 mt-3 w-72 bg-white shadow-lg rounded-lg border border-gray-200 z-50 animate-fade-in">
                    <div className="p-3">
                      <div className="font-bold text-green-700 mb-2">ตะกร้าสินค้า</div>
                      {cartItems.length === 0 ? (
                        <div className="text-gray-400 text-sm">ยังไม่มีสินค้าในตะกร้า</div>
                      ) : (
                        <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                          {cartItems.map((item, idx) => (
                            <li key={idx} className="py-2 flex items-center justify-between gap-2">
                              {item.image_url ? (
                                <img
                                  src={item.image_url.startsWith('http') ? item.image_url : `${host}${item.image_url}`}
                                  alt={item.name || 'product'}
                                  className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : null}
                              <span className="font-medium text-gray-700 flex-1 truncate">{item.name}</span>
                              <span className="text-xs text-gray-500">x{item.quantity || 1}</span>
                              <span className="text-green-700 font-bold">
                                ฿{Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            {user && (
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition relative"
                title="การแจ้งเตือน"
                aria-label="การแจ้งเตือน"
                onClick={handleBellClick}
              >
                <Bell className="w-7 h-7 text-green-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center" aria-live="polite">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth / Profile */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title="โปรไฟล์ของฉัน"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  {user.profile_picture && !avatarBroken ? (
                    <img
                      src={`${host}${user.profile_picture}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-green-700"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-green-700" />
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-md z-10 animate-fade-in border border-gray-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/users/profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-green-700 hover:bg-gray-50"
                    >
                      โปรไฟล์ของฉัน
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        try { localStorage.setItem('notif_count', '0'); } catch {}
                        setUser(null);
                        setProfileOpen(false);
                        Swal.fire({
                          icon: 'success',
                          title: 'ออกจากระบบสำเร็จ',
                          showConfirmButton: false,
                          timer: 1200,
                          confirmButtonColor: '#16a34a',
                        }).then(() => {
                          window.dispatchEvent(new Event('userChanged'));
                          window.dispatchEvent(new Event('notificationsUpdated'));
                          navigate('/home', { replace: true });
                        });
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition duration-200 font-semibold"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-green-700 border border-green-600 hover:bg-green-50 rounded-full transition duration-200 font-semibold"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>

        {/* เมนูมือถือ (Slide-down) */}
        <div className={`md:hidden overflow-hidden transition-[max-height] duration-200 ${isMenuOpen ? 'max-h-[520px]' : 'max-h-0'}`}>
          <div className="py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {[{ to: '/home', label: 'หน้าแรก' },
                { to: '/products', label: 'สินค้า' },
                { to: '/contact', label: 'ติดต่อเรา' }].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-md font-semibold ${isActive(to) ? 'bg-green-600 text-white' : 'text-green-700 hover:bg-green-50'}`}
                >
                  {label}
                </Link>
              ))}

              {user && (
                <>
                  <Link
                    to="/users/favorite"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 rounded-md font-semibold text-pink-600 hover:bg-pink-50"
                  >
                    รายการโปรด
                  </Link>
                  <Link
                    to="/users/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 rounded-md font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    คำสั่งซื้อของฉัน
                  </Link>
                  <Link
                    to="/users/payments"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 rounded-md font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    การชำระเงิน
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                {user && (
                  <>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 transition relative"
                      title="ตะกร้าสินค้า"
                      onClick={() => { setIsMenuOpen(false); navigate('/users/cart'); }}
                      aria-label="ตะกร้าสินค้า"
                    >
                      <ShoppingCart className="w-7 h-7 text-green-700" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 transition relative"
                      title="การแจ้งเตือน"
                      onClick={() => { setIsMenuOpen(false); handleBellClick(); }}
                      aria-label="การแจ้งเตือน"
                    >
                      <Bell className="w-7 h-7 text-green-700" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {!user && (
                  <>
                    <button
                      onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                      className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition font-semibold"
                    >
                      เข้าสู่ระบบ
                    </button>
                    <button
                      onClick={() => { setIsMenuOpen(false); navigate('/register'); }}
                      className="flex-1 px-4 py-2 text-green-700 border border-green-600 hover:bg-green-50 rounded-full transition font-semibold"
                    >
                      สมัครสมาชิก
                    </button>
                  </>
                )}
              </div>

              {user && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/users/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-green-700 hover:bg-gray-50 rounded-md font-semibold"
                  >
                    โปรไฟล์ของฉัน
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      try { localStorage.setItem('notif_count', '0'); } catch {}
                      setUser(null);
                      Swal.fire({
                        icon: 'success',
                        title: 'ออกจากระบบสำเร็จ',
                        showConfirmButton: false,
                        timer: 1200,
                        confirmButtonColor: '#16a34a',
                      }).then(() => {
                        window.dispatchEvent(new Event('userChanged'));
                        window.dispatchEvent(new Event('notificationsUpdated'));
                        navigate('/home', { replace: true });
                      });
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 rounded-md font-semibold"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
