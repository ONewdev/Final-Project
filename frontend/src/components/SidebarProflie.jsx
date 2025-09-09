
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaBars } from 'react-icons/fa';
import Swal from 'sweetalert2';

const menuItems = [
  { to: '/users/profile', icon: '👤', label: 'โปรไฟล์' },
  { to: '/users/favorite', icon: '❤️', label: 'รายการโปรด' },
  { to: '/users/orders', icon: '🛒', label: 'คำสั่งซื้อของฉัน' },
  { to: '/users/orders', icon: '🛒', label: 'สั่งทำสินค้า' },
  
];

export default function SidebarProflie() {
  const navigate = useNavigate();

    // Removed collapsed state and related logic
  const [user, setUser] = useState({ name: 'Guest', email: '', profile_picture: '' });
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    // Load Google Fonts for Thai language support
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
      if (stored) {
        setUser(JSON.parse(stored));
      }
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
        // เรียก logout backend
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

  

  // ตรวจสอบว่า user มีข้อมูลหรือไม่
  const isLoggedIn = user && user.id;

  return (
    <div
      className="vh-100 p-3 d-flex flex-column"
      style={{
        width: '250px',
        transition: 'width 0.3s',
        position: 'fixed',
        background: '#ffffff', // Changed to white
        color: '#166534',
        fontFamily: "'Kanit', sans-serif",
        zIndex: 1000,
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
        // แสดงเมนูสำหรับผู้ใช้ที่ล็อกอินแล้ว
        menuItems.map((item, idx) => (
        <li className="nav-item" key={idx}>
          <Link
          to={item.to}
          className="nav-link sidebar-link text-success"
          style={{ fontWeight: 500 }}
          >
            {item.icon} {item.label}
          </Link>
        </li>
        ))
      ) : (
        // แสดงเมนูสำหรับผู้เยี่ยมชม
        <li className="nav-item">
        <Link
          to="/login"
          className="nav-link sidebar-link text-success"
          style={{ fontWeight: 500 }}
        >
          🔐 เข้าสู่ระบบ
        </Link>
        </li>
      )}
      
      {isLoggedIn && (
        <li className="nav-item">
        <button
          onClick={handleLogout}
          className="btn btn-link nav-link text-success text-start sidebar-link"
          style={{ fontWeight: 500 }}
        >
          🔓 ออกจากระบบ
        </button>
        </li>
      )}
      </ul>
      
      <style>{`
      .sidebar-link:hover, .sidebar-link:focus {
        background: rgba(34,197,94,0.12);
        color: #166534 !important;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .sidebar-link {
        transition: all 0.2s ease;
      }
      `}</style>
    </div>
    );
}