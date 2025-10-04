// ✅ MainLayout.jsx
import SidebarAdmin from './SidebarAdmin';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div>
      {/* SidebarAdmin มี position: fixed และ width: 260px */}
      <SidebarAdmin />
      
      {/* เนื้อหาหลักต้องมี margin-left เพื่อไม่ให้ทับกับ sidebar */}
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
 