import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

// --- ไอคอนสวย ๆ จาก FontAwesome (react-icons/fa) ---
import {
  FaTachometerAlt,
  FaUsers,
  FaUserShield,
  FaUserFriends,
  FaComments,
  FaInbox,
  FaBoxOpen,
  FaTags,
  FaCubes,
  FaShoppingCart,
  FaClipboardList,
  FaCreditCard,
  FaChartBar,
  FaPhoneAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaTruck,
} from "react-icons/fa";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const host = import.meta.env.VITE_HOST || "";
  const [openDropdown, setOpenDropdown] = useState({
    users: false,
    products: false,
    orders: false,
    reports: false,
    payments: false,
  });
  const [chatUnread, setChatUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [ordersUnread, setOrdersUnread] = useState(0);
  const [customOrdersUnread, setCustomOrdersUnread] = useState(0);
  const [paymentCheckUnread, setPaymentCheckUnread] = useState(0);
  const [paymentOrderCheckUnread, setPaymentOrderCheckUnread] = useState(0);
  const [paymentCustomCheckUnread, setPaymentCustomCheckUnread] = useState(0);

  useEffect(() => {
    if (!document.getElementById("kanit-font")) {
      const link = document.createElement("link");
      link.id = "kanit-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  // --- Chat unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );
    socket.on("chat message", (msg) => {
      if (msg && msg.userId !== 1 && location.pathname !== "/admin/chat") {
        setChatUnread((prev) => prev + 1);
      }
    });
    const onAdminUnreadChanged = (e) => {
      const total = Number(e.detail || 0);
      setChatUnread(total);
    };
    window.addEventListener("adminUnreadChanged", onAdminUnreadChanged);
    return () => {
      try {
        socket.disconnect();
      } catch {}
      window.removeEventListener("adminUnreadChanged", onAdminUnreadChanged);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/admin/chat") setChatUnread(0);
  }, [location.pathname]);

  // --- Inbox unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );
    socket.on("inbox message", () => setInboxUnread((prev) => prev + 1));
    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, []);
  useEffect(() => {
    if (location.pathname === "/admin/inbox") setInboxUnread(0);
  }, [location.pathname]);

  // --- Orders unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );

    const handleNewOrder = () => setOrdersUnread((prev) => prev + 1);

    socket.on("order:new", handleNewOrder);
    socket.on("orders:unread:set", (count) =>
      setOrdersUnread(Number(count) || 0)
    );

    return () => {
      try {
        socket.off && socket.off("order:new", handleNewOrder);
        socket.disconnect();
      } catch {}
    };
  }, []);

  // Clear orders unread when viewing the orders page
  useEffect(() => {
    if (location.pathname === "/admin/orders") setOrdersUnread(0);
  }, [location.pathname]);

  // --- Custom Orders unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );
    socket.on("customOrder:new", () => {
      if (location.pathname !== "/admin/custom-orders")
        setCustomOrdersUnread((prev) => prev + 1);
    });
    socket.on("customOrders:unread:set", (count) =>
      setCustomOrdersUnread(Number(count) || 0)
    );
    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname === "/admin/custom-orders") setCustomOrdersUnread(0);
  }, [location.pathname]);

  // --- Payment Order Check unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );
    socket.on("paymentOrderCheck:unread:set", (count) =>
      setPaymentOrderCheckUnread(Number(count) || 0)
    );
    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, []);
  useEffect(() => {
    if (location.pathname === "/admin/payment-order-check") setPaymentOrderCheckUnread(0);
  }, [location.pathname]);

  // --- Payment Custom Check unread ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"
    );
    socket.on("paymentCustomCheck:unread:set", (count) =>
      setPaymentCustomCheckUnread(Number(count) || 0)
    );
    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, []);
  useEffect(() => {
    if (location.pathname === "/admin/payment-custom-check") setPaymentCustomCheckUnread(0);
  }, [location.pathname]);

  // --- Initialize badges (fetch once on mount) ---
  useEffect(() => {
    // standard order payments pending
    (async () => {
      try {
        const res = await fetch(`${host}/api/payments?status=pending`);
        if (res.ok) {
          const rows = await res.json();
          setPaymentOrderCheckUnread(Array.isArray(rows) ? rows.length : 0);
        }
      } catch {}
    })();

    // custom order payments pending
    (async () => {
      try {
        const resOrders = await fetch(`${host}/api/custom-orders/orders`);
        if (!resOrders.ok) return;
        const orders = await resOrders.json();
        const waiting = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "waiting_payment");
        let total = 0;
        await Promise.all(
          waiting.map(async (o) => {
            try {
              const r = await fetch(`${host}/api/custom-orders/orders/${o.id}/payments`);
              if (!r.ok) return;
              const rows = await r.json();
              total += Array.isArray(rows) ? rows.filter((p) => p.status === "pending").length : 0;
            } catch {}
          })
        );
        setPaymentCustomCheckUnread(total);
      } catch {}
    })();
  }, [host]);

  const handleLogout = () => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการออกจากระบบหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("admin_token");
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบแล้ว",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => navigate("/admin/login"));
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  const DropdownToggle = ({ label, name, icon: Icon, badgeCount }) => (
    <button
      className={`btn btn-toggle align-items-center w-100 text-start ${
        openDropdown[name] ? "active" : ""
      }`}
      onClick={() =>
        setOpenDropdown((prev) => ({ ...prev, [name]: !prev[name] }))
      }
    >
      <Icon className="me-2" />
      {label}
      <Badge count={badgeCount || 0} />
      <span
        style={{
          float: "right",
          transition: "transform 0.25s",
          transform: openDropdown[name] ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <FaChevronDown size={12} />
      </span>
    </button>
  );

  const Badge = ({ count }) =>
    count > 0 ? <span className="badge bg-danger ms-2">{count}</span> : null;

  return (
    <div
      className="vh-100 p-3 d-flex flex-column"
      style={{
        width: "260px",
        position: "fixed",
        background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
        color: "#fff",
        fontFamily: "'Kanit', sans-serif",
        overflowY: "auto",
        height: "100vh",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 style={{ fontWeight: 700, letterSpacing: 0.2 }}>
          หน้าจัดการข้อมูล
        </h5>
      </div>

      <ul className="nav flex-column">
        {/* Dashboard */}
        <li className="nav-item">
          <Link
            to="/admin/dashboard"
            className={`nav-link d-flex align-items-center text-white ${
              isActive("/admin/dashboard") ? "active" : ""
            }`}
          >
            <FaTachometerAlt className="me-2" />
            สถิติ
          </Link>
        </li>

        {/* ผู้ใช้งาน */}
        <li className="nav-item">
          <DropdownToggle
            label="ผู้ใช้งาน"
            name="users"
            icon={FaUsers}
            badgeCount={chatUnread + inboxUnread}
          />
          {openDropdown.users && (
            <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
              <li>
                <Link
                  to="/admin/admins"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/admins") ? "active" : ""
                  }`}
                >
                  <FaUserShield className="me-2" /> แอดมิน
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/customers"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/customers") ? "active" : ""
                  }`}
                >
                  <FaUserFriends className="me-2" /> สมาชิก
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/chat"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/chat") ? "active" : ""
                  }`}
                >
                  <FaComments className="me-2" /> ข้อความลูกค้า{" "}
                  <Badge count={chatUnread} />
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/inbox"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/inbox") ? "active" : ""
                  }`}
                >
                  <FaInbox className="me-2" /> กล่องข้อความ{" "}
                  <Badge count={inboxUnread} />
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* สินค้า & หมวดหมู่ */}
        <li className="nav-item">
          <DropdownToggle
            label="สินค้า & หมวดหมู่"
            name="products"
            icon={FaBoxOpen}
          />
          {openDropdown.products && (
            <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
              <li>
                <Link
                  to="/admin/products"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/products") ? "active" : ""
                  }`}
                >
                  <FaBoxOpen className="me-2" /> สินค้า/บริการ
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/categories"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/categories") ? "active" : ""
                  }`}
                >
                  <FaTags className="me-2" /> หมวดหมู่สินค้า
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/materials"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/materials") ? "active" : ""
                  }`}
                >
                  <FaCubes className="me-2" /> รายการรายจ่าย
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/shipping-rates"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/shipping-rates") ? "active" : ""
                  }`}
                >
                  <FaTruck className="me-2" /> ค่าส่ง
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* คำสั่งซื้อ */}
        <li className="nav-item">
          <DropdownToggle
            label="คำสั่งซื้อ"
            name="orders"
            icon={FaShoppingCart}
            badgeCount={
              ordersUnread +
              customOrdersUnread +
              (paymentOrderCheckUnread + paymentCustomCheckUnread)
            }
          />
          {openDropdown.orders && (
            <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
              <li>
                <Link
                  to="/admin/orders"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/orders") ? "active" : ""
                  }`}
                >
                  <FaShoppingCart className="me-2" /> จัดการคำสั่งซื้อ{" "}
                  <Badge count={ordersUnread} />
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/custom-orders"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/custom-orders") ? "active" : ""
                  }`}
                >
                  <FaClipboardList className="me-2" /> คำสั่งทำสินค้า{" "}
                  <Badge count={customOrdersUnread} />
                </Link>
              </li>
                <li>
                  <DropdownToggle
                    label="ตรวจสอบสลิปชำระเงิน"
                    name="payments"
                    icon={FaCreditCard}
                    badgeCount={paymentOrderCheckUnread + paymentCustomCheckUnread}
                  />
                  {openDropdown.payments && (
                    <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                      <li>
                        <Link
                          to="/admin/payment-order-check"
                          className={`nav-link text-white ps-4 d-flex align-items-center ${
                            isActive("/admin/payment-order-check") ? "active" : ""
                          }`}
                        >
                          <FaCreditCard className="me-2" /> ตรวจสอบสลิปสั่งซื้อ
                          <Badge count={paymentOrderCheckUnread} />
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/payment-custom-check"
                          className={`nav-link text-white ps-4 d-flex align-items-center ${
                            isActive("/admin/payment-custom-check") ? "active" : ""
                          }`}
                        >
                          <FaCreditCard className="me-2" /> ตรวจสอบสลิปสั่งทำ
                          <Badge count={paymentCustomCheckUnread} />
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
            </ul>
          )}
        </li>

        {/* รายงาน (Dropdown) */}
        <li className="nav-item">
          <DropdownToggle label="รายรับ-รายจ่าย" name="reports" icon={FaChartBar} />
          {openDropdown.reports && (
            <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
               <li>
                <Link
                  to="/admin/income-expense/form"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/income-expense/form") ? "active" : ""
                  }`}
                >
                  <FaChartBar className="me-2" /> บันทึกรายรับ-รายจ่าย
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/income-expense/report"
                  className={`nav-link text-white ps-4 d-flex align-items-center ${
                    isActive("/admin/income-expense/report") ? "active" : ""
                  }`}
                >
                  <FaChartBar className="me-2" /> รายงาน รายรับ-รายจ่าย
                </Link>
              </li>
             
            </ul>
          )}
        </li>

       

        {/* ข้อมูลร้านค้า */}
        <li className="nav-item">
          <Link
            to="/admin/contact"
            className={`nav-link text-white d-flex align-items-center ${
              isActive("/admin/contact") ? "active" : ""
            }`}
          >
            <FaPhoneAlt className="me-2" /> จัดการข้อมูลร้านค้า
          </Link>
        </li>

        {/* Logout */}
        <li className="nav-item mt-3">
          <button
            onClick={handleLogout}
            className="btn btn-link nav-link text-white text-start d-flex align-items-center"
          >
            <FaSignOutAlt className="me-2" /> ออกจากระบบ
          </button>
        </li>
      </ul>

      <style>{`
        .btn-toggle {
          background: transparent;
          border: none;
          color: white;
          font-weight: 500;
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
        }
        .btn-toggle:hover,
        .btn-toggle.active {
          background: rgba(255,255,255,0.18);
          font-weight: 600;
        }
        .nav-link {
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
        }
        .nav-link.active {
          background: rgba(255,255,255,0.25);
          font-weight: 600;
          color: white !important;
        }
        .btn-toggle-nav .nav-link {
          color: white;
        }
        .btn-toggle-nav .nav-link.active {
          background: rgba(255,255,255,0.6);
          color: black !important;
          font-weight: 600;
        }
        .badge {
          font-weight: 600;
        }
      `}</style>
    </div>
  
  );
}
