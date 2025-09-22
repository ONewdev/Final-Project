// pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

function Notifications() {
  const host = import.meta.env.VITE_HOST;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="text-green-500 w-6 h-6" />;
      case "warning": return <AlertTriangle className="text-yellow-500 w-6 h-6" />;
      case "error":   return <XCircle className="text-red-500 w-6 h-6" />;
      default:        return <Info className="text-blue-500 w-6 h-6" />;
    }
  };

  useEffect(() => {
    if (!user.id) return;
    let aborted = false;

    const loadAndMarkRead = async () => {
      try {
        // 1) โหลดรายการทั้งหมด
        const res = await fetch(`${host}/api/notifications?customer_id=${user.id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (aborted) return;

        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);

        // 2) มาร์คว่าอ่านทั้งหมด (เฉพาะที่ยังไม่อ่าน)
        await fetch(`${host}/api/notifications/mark_read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ customer_id: user.id }),
        });

        // 3) แจ้ง Navbar ให้รีเฟรช badge (จะได้ 0)
        window.dispatchEvent(new Event("notificationsUpdated"));
      } catch {
        if (!aborted) setLoading(false);
      }
    };

    loadAndMarkRead();
    return () => { aborted = true; };
  }, [host, user.id]);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">การแจ้งเตือน</h2>

      {loading ? (
        <div className="text-center text-gray-500 py-8 animate-pulse">กำลังโหลด...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">ไม่มีการแจ้งเตือน</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition flex items-start gap-3 bg-white"
            >
              <div className="mt-1">{getIcon(n.type)}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{n.title || "การแจ้งเตือน"}</div>
                <div className="text-gray-600 text-sm">{n.message}</div>
                {n.created_at && (
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString("th-TH")}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notifications;
