import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { User, Heart, ShoppingCart, Wrench, LogOut, Lock } from 'lucide-react';

// เมนูแถบด้านข้าง (โปรไฟล์ผู้ใช้) — ใช้ไอคอน lucide-react
const MENU_ITEMS = [
  { to: '/users/profile', Icon: User, label: 'โปรไฟล์' },
  { to: '/users/favorite', Icon: Heart, label: 'รายการที่ถูกใจ' },
  { to: '/users/orders', Icon: ShoppingCart, label: 'คำสั่งซื้อ' },
  { to: '/users/orderscustom', Icon: Wrench, label: 'รายการสั่งทำ' },
];

export default function SidebarProflie() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState({ name: 'Guest', email: '', profile_picture: '' });
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    // โหลดฟอนต์ Kanit
    if (!document.getElementById('kanit-font')) {
      const link = document.createElement('link');
      link.id = 'kanit-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // ดึง user จาก localStorage และ sync เมื่อมีการเปลี่ยนแปลง
    const getUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    };
    getUser();
    window.addEventListener('userChanged', getUser);
    window.addEventListener('storage', getUser);
    return () => {
      window.removeEventListener('userChanged', getUser);
      window.removeEventListener('storage', getUser);
    };
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการออกจากระบบหรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${host}/api/customers/logout`, {
          method: 'POST',
          credentials: 'include'
        }).finally(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser({ name: 'Guest', email: '', profile_picture: '' });
          Swal.fire({
            icon: 'success',
            title: 'ออกจากระบบแล้ว',
            showConfirmButton: false,
            timer: 1200,
            confirmButtonColor: '#16a34a'
          }).then(() => {
            window.dispatchEvent(new Event('userChanged'));
            navigate('/home');
          });
        });
      }
    });
  };

  const isLoggedIn = user && user.id;

  // helper: ตรวจ active path
  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <div
      className="vh-100 p-3 d-flex flex-column"
      style={{
        width: '250px',
        transition: 'width 0.3s',
        position: 'fixed',
        background: '#ffffff',
        color: '#166534',
        fontFamily: "'Kanit', sans-serif",
        // Lower z-index so app modals (e.g., Tailwind z-50) overlay the sidebar
        zIndex: 40,
        boxShadow: '0 4px 24px 0 rgba(34,197,94,0.12), 0 1.5px 6px 0 rgba(0,0,0,0.08)'
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 style={{ fontWeight: 700, letterSpacing: 1, color: '#222' }}>เมนูผู้ใช้</h5>
      </div>

      <div className="d-flex flex-column align-items-center mb-4">
        <img
          src={user.profile_picture ? `${host}${user.profile_picture}` : '/images/655fc323-6c03-4394-ba95-5280da436298.jpg'}
          alt="Profile"
          className="rounded-circle mb-2"
          style={{
            width: 60,
            height: 60,
            objectFit: 'cover',
            border: '2px solid #22c55e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onError={(e) => {
            e.target.src = '/images/655fc323-6c03-4394-ba95-5280da436298.jpg';
          }}
        />
        <div style={{ fontWeight: 600, textAlign: 'center', color: '#222' }}>
          {isLoggedIn ? user.name : 'ผู้เยี่ยมชม'}
        </div>
        {isLoggedIn && (
          <div style={{ fontSize: 13, color: '#222', opacity: 0.8 }}>
            {user.email}
          </div>
        )}
      </div>

      <ul className="nav flex-column mb-3">
        {isLoggedIn ? (
          MENU_ITEMS.map(({ to, Icon, label }, idx) => (
            <li className="nav-item" key={idx}>
              <Link
                to={to}
                className={`nav-link sidebar-link d-flex align-items-center ${isActive(to) ? 'active' : ''}`}
                style={{
                  fontWeight: 500,
                  color: isActive(to) ? '#14532d' : '#166534',
                  gap: 10,
                }}
              >
                <Icon size={18} strokeWidth={2.2} className="me-2" />
                <span>{label}</span>
              </Link>
            </li>
          ))
        ) : (
          <li className="nav-item">
            <Link
              to="/login"
              className="nav-link sidebar-link d-flex align-items-center"
              style={{ fontWeight: 500, color: '#166534', gap: 10 }}
            >
              <Lock size={18} strokeWidth={2.2} className="me-2" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          </li>
        )}

        {isLoggedIn && (
          <li className="nav-item">
            <button
              onClick={handleLogout}
              className="btn btn-link nav-link sidebar-link d-flex align-items-center text-start"
              style={{ fontWeight: 500, color: '#166534', gap: 10 }}
            >
              <LogOut size={18} strokeWidth={2.2} className="me-2" />
              <span>ออกจากระบบ</span>
            </button>
          </li>
        )}
      </ul>

      <style>{`
        .sidebar-link {
          border-radius: 10px;
          padding: 8px 10px;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover, .sidebar-link:focus, .sidebar-link.active {
          background: rgba(34,197,94,0.12);
          color: #14532d !important;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
