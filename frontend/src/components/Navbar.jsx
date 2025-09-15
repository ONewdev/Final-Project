import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ShoppingCart, UserCircle, Bell } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // เมนูมือถือ
  const [profileOpen, setProfileOpen] = useState(false); // เมนูโปรไฟล์ (แยก)
  const [avatarBroken, setAvatarBroken] = useState(false); // รูปโปรไฟล์โหลดไม่สำเร็จ
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

  // โหลดฟอนต์
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

  // ตะกร้า
  useEffect(() => {
    const updateCart = () => {
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      let items = [];
      try {
        items = JSON.parse(localStorage.getItem(cartKey) || '[]') || [];
      } catch {
        items = [];
      }
      setCartItems(items);
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    window.addEventListener('storage', updateCart);
    return () => {
      window.removeEventListener('cartUpdated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, [user]);

  // การแจ้งเตือน
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
          try {
            localStorage.setItem('notif_count', String(n));
          } catch {}
        }
      } catch {}
    };
    fetchUnread();
    const onUpdated = () => fetchUnread();
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

  return (
    <header
      className="bg-white/80 backdrop-blur-md shadow-xl sticky top-0 z-50 border border-gray-200"
      style={{ fontFamily: "'Prompt', 'Kanit', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home">
              <img
                src="/images/655fc323-6c03-4394-ba95-5280da436298.jpg"
                alt="Logo"
                className="h-12 w-auto"
                style={{ maxHeight: '48px', objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
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
                className={`font-semibold transition-colors duration-200 px-2 py-1 rounded ${
                  location.pathname === to ? 'bg-green-600 text-white' : ''
                }`}
                style={{
                  color: location.pathname === to ? undefined : '#16a34a',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-6">
            {/* Cart */}
            {user && (
              <div
                className="relative"
                onMouseEnter={() => setShowCartPopup(true)}
                onMouseLeave={() => setShowCartPopup(false)}
              >
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition relative"
                  title="ตะกร้าสินค้า"
                  onClick={() => navigate('/users/cart')}
                  aria-label="ตะกร้าสินค้า"
                >
                  <ShoppingCart className="w-7 h-7 text-green-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

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
                                  src={
                                    item.image_url.startsWith('http')
                                      ? item.image_url
                                      : `${host}${item.image_url}`
                                  }
                                  alt={item.name || 'product'}
                                  className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <span className="font-medium text-gray-700 flex-1 truncate">{item.name}</span>
                              <span className="text-xs text-gray-500">x{item.quantity || 1}</span>
                              <span className="text-green-700 font-bold">
                                ฿{Number(item.price).toLocaleString('th-TH', {
                                  minimumFractionDigits: 2,
                                })}
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
                onClick={() => navigate('/users/notifications')}
              >
                <Bell className="w-7 h-7 text-green-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile / Auth */}
            {user ? (
              <div className="relative flex flex-col items-center space-y-1 ml-2 md:ml-3">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title="โปรไฟล์ของฉัน"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  {user.profile_picture && !avatarBroken ? (
                    <img
                      src={`${host}${user.profile_picture}`}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border-2 border-green-700"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <UserCircle className="w-7 h-7 text-green-700" />
                  )}
                </button>

                {user?.name && (
                  <span className="text-xs mt-1 text-green-800 font-medium truncate max-w-[80px] text-center">
                    {user.name}
                  </span>
                )}

                {profileOpen && (
                  <div className="absolute left-2 top-14 mt-2 w-40 bg-white shadow-lg rounded-md z-10 animate-fade-in border border-gray-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/users/profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100"
                    >
                      โปรไฟล์ของฉัน
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
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
                          navigate('/home', { replace: true });
                        });
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition duration-200 font-semibold"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2 text-green-700 border border-green-600 hover:bg-green-50 rounded-full transition duration-200 font-semibold"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}

            {/* Mobile Navigation (ยังใช้ isMenuOpen) */}
            {isMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-4 bg-white rounded-b-2xl shadow-md">
                <div className="flex flex-col space-y-3">
                  {user && (
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 transition self-start relative"
                      title="ตะกร้าสินค้า"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/users/cart');
                      }}
                      aria-label="ตะกร้าสินค้า"
                    >
                      <ShoppingCart className="w-7 h-7 text-green-700" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}

                  {user && (
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 transition self-start relative"
                      title="การแจ้งเตือน"
                      aria-label="การแจ้งเตือน"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/users/notifications');
                      }}
                    >
                      <Bell className="w-7 h-7 text-green-700" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </button>
                  )}

                  {user && (
                    <>
                      <Link
                        to="/users/favorite"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-semibold transition-colors duration-200 w-full text-left px-5 py-2"
                        style={{ color: '#ec4899', textDecoration: 'none', borderRadius: '0.375rem' }}
                      >
                        รายการโปรด
                      </Link>
                      <Link
                        to="/users/orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-semibold transition-colors duration-200 w-full text-left px-5 py-2"
                        style={{ color: '#2563eb', textDecoration: 'none', borderRadius: '0.375rem' }}
                      >
                        คำสั่งซื้อของฉัน
                      </Link>
                      <Link
                        to="/users/payments"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-semibold transition-colors duration-200 w-full text-left px-5 py-2"
                        style={{ color: '#6366f1', textDecoration: 'none', borderRadius: '0.375rem' }}
                      >
                        การชำระเงิน
                      </Link>
                    </>
                  )}

                  {[
                    { to: '/home', label: 'หน้าแรก' },
                    { to: '/products', label: 'สินค้า' },
                    { to: '/contact', label: 'ติดต่อเรา' },
                  ].map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsMenuOpen(false)}
                      className="font-semibold transition-colors duration-200"
                      style={{ color: '#16a34a', textDecoration: 'none' }}
                    >
                      {label}
                    </Link>
                  ))}

                  <div className="pt-4 border-t border-gray-200">
                    {user ? (
                      <>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/users/profile');
                          }}
                          className="w-full text-left px-5 py-2 text-green-700 hover:bg-gray-100 rounded-md font-semibold"
                        >
                          โปรไฟล์ของฉัน
                        </button>
                        <button
                          onClick={() => {
                            localStorage.removeItem('user');
                            localStorage.removeItem('token');
                            setUser(null);
                            setIsMenuOpen(false);
                            Swal.fire({
                              icon: 'success',
                              title: 'ออกจากระบบสำเร็จ',
                              showConfirmButton: false,
                              timer: 1200,
                              confirmButtonColor: '#16a34a',
                            }).then(() => {
                              window.dispatchEvent(new Event('userChanged'));
                              navigate('/home', { replace: true });
                            });
                          }}
                          className="w-full text-left px-5 py-2 text-red-600 hover:bg-gray-100 rounded-md font-semibold"
                        >
                          ออกจากระบบ
                        </button>
                      </>
                    ) : (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/login');
                          }}
                          className="w-full px-5 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition duration-200 font-semibold mb-2"
                        >
                          เข้าสู่ระบบ
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/register');
                          }}
                          className="w-full px-5 py-2 text-green-700 border border-green-600 hover:bg-green-50 rounded-full transition duration-200 font-semibold"
                        >
                          สมัครสมาชิก
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

