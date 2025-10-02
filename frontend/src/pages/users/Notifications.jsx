import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const resolveNotificationInfo = (notification) => {
  const info = { path: null, orderType: null };

  if (!notification) return info;

  const title = String(notification.title || "");
  const message = String(notification.message || "");
  const combined = `${title} ${message}`;
  const lowerCombined = combined.toLowerCase();

  const match = combined.match(/#(\d+)/);
  const rawId = match ? match[1] : null;
  const numericId = rawId ? Number.parseInt(rawId, 10) : Number.NaN;
  const parsedId = Number.isNaN(numericId) ? null : String(numericId);

  const isCustomOrder = combined.includes("ออเดอร์ #");
  const isStandardOrder = combined.includes("คำสั่งซื้อ #");

  if (isCustomOrder) {
    info.orderType = "custom";

    if (lowerCombined.includes("กรุณาชำระเงิน") || lowerCombined.includes("รอชำระเงิน")) {
      info.path = parsedId ? `/users/custom-order-payment/${parsedId}` : "/users/orderscustom";
      return info;
    }
    if (lowerCombined.includes("ไม่สามารถยืนยันการชำระเงิน") || lowerCombined.includes("หลักฐานไม่ผ่าน")) {
      info.path = parsedId ? `/users/custom-order-payment/${parsedId}` : "/users/orderscustom";
      return info;
    }
    if (lowerCombined.includes("ชำระเงินสำเร็จ") || lowerCombined.includes("แจ้งชำระเงินแล้ว")) {
      info.path = "/users/orderscustom";
      return info;
    }
    if (lowerCombined.includes("กำลังผลิต") || lowerCombined.includes("กำลังจัดส่ง") || lowerCombined.includes("เสร็จสิ้น")) {
      info.path = "/users/orderscustom";
      return info;
    }

    info.path = "/users/orderscustom";
    return info;
  }

  if (isStandardOrder) {
    info.orderType = "standard";

    if (parsedId) {
      info.path = `/users/order/${parsedId}`;
      return info;
    }
    if (lowerCombined.includes("จัดส่งสำเร็จ")) {
      info.path = "/users/delivered";
      return info;
    }
    if (lowerCombined.includes("ถูกจัดส่ง") || lowerCombined.includes("จัดส่งแล้ว")) {
      info.path = "/users/shipped";
      return info;
    }
    if (lowerCombined.includes("กำลังเตรียมสินค้า") || lowerCombined.includes("กำลังจัดเตรียม")) {
      info.path = "/users/processing";
      return info;
    }
    if (lowerCombined.includes("ยกเลิก")) {
      info.path = "/users/cancelled";
      return info;
    }
    if (lowerCombined.includes("ได้รับการอนุมัติ") || lowerCombined.includes("อนุมัติแล้ว")) {
      info.path = "/users/orders";
      return info;
    }

    info.path = "/users/orders";
    return info;
  }

  return info;
};

const ORDER_TYPE_LABELS = {
  custom: "สั่งทำ",
  standard: "สั่งซื้อ",
};

const ORDER_TYPE_STYLES = {
  custom: "bg-orange-100 text-orange-700",
  standard: "bg-blue-100 text-blue-700",
};

function Notifications() {
  const host = import.meta.env.VITE_HOST;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-green-500 w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="text-yellow-500 w-6 h-6" />;
      case "error":
        return <XCircle className="text-red-500 w-6 h-6" />;
      default:
        return <Info className="text-blue-500 w-6 h-6" />;
    }
  };

  useEffect(() => {
    if (!user.id) return;
    let aborted = false;

    const loadAndMarkRead = async () => {
      try {
        const res = await fetch(`${host}/api/notifications?customer_id=${user.id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (aborted) return;

        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);

        await fetch(`${host}/api/notifications/mark_read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ customer_id: user.id }),
        });

        window.dispatchEvent(new Event("notificationsUpdated"));
      } catch {
        if (!aborted) setLoading(false);
      }
    };

    loadAndMarkRead();
    return () => {
      aborted = true;
    };
  }, [host, user.id]);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">การแจ้งเตือน</h2>

      {loading ? (
        <div className="text-center text-gray-500 py-8 animate-pulse">กำลังโหลด...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">ยังไม่มีการแจ้งเตือน</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => {
            const { path: targetPath, orderType } = resolveNotificationInfo(n);
            const isClickable = Boolean(targetPath);
            const orderTypeLabel = ORDER_TYPE_LABELS[orderType] || null;

            return (
              <li key={n.id}>
                <button
                  type="button"
                  aria-disabled={!isClickable}
                  onClick={() => {
                    if (!isClickable) return;
                    navigate(targetPath);
                  }}
                  className={`w-full rounded-lg border border-gray-200 p-4 shadow-sm transition flex items-start gap-3 bg-white text-left ${
                    isClickable
                      ? "hover:shadow-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-200 cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{n.title || "การแจ้งเตือน"}</div>
                    <div className="text-gray-600 text-sm">{n.message || ""}</div>
                    {orderTypeLabel && (
                      <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_TYPE_STYLES[orderType] || "bg-gray-100 text-gray-600"}`}>
                        {orderTypeLabel}
                      </span>
                    )}
                    {n.created_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString("th-TH")}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Notifications;





