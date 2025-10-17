// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { sendMessage, fetchMessages, fetchUnreadCount, markAsRead } from '../services/chatService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const ADMIN_ID = 1; // ไอดีแอดมิน

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [adminUnread, setAdminUnread] = useState(0);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const notifPermRef = useRef(false);

  // โหลด user จาก localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    setUser(userStr ? JSON.parse(userStr) : null);

    const onUserChanged = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('userChanged', onUserChanged);
    return () => window.removeEventListener('userChanged', onUserChanged);
  }, []);

  // ขอสิทธิ์ Notification
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        notifPermRef.current = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          notifPermRef.current = perm === 'granted';
        });
      }
    }
  }, []);

  // โหลดจำนวน unread ค้างจากฐานข้อมูล เมื่อรู้ตัว user
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount({ reader_id: user.id, peer_id: ADMIN_ID })
      .then(({ count }) => setAdminUnread(Number(count) || 0))
      .catch(() => {});
  }, [user]);

  // เปิดแชท → โหลดประวัติ + เชื่อมต่อ socket
  useEffect(() => {
    if (!open || !user) return;

    // 1) โหลดประวัติ
    fetchMessages(user.id, ADMIN_ID).then((msgs) => {
      setMessages(
        (Array.isArray(msgs) ? msgs : []).map((m) => ({
          id: m.id,
          self: m.sender_id === user.id,
          text: m.message,
          isAdmin: m.sender_id === ADMIN_ID,
          created_at: m.created_at,
          read: !!m.read,
        }))
      );
      // Avoid overwriting unread badge while chat is open.
      // Clearing happens on open click and via socket when open.
    });

    // 2) เชื่อม socket (ครั้งเดียวขณะเปิด)
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('chat message', async (msg) => {
        // เฉพาะข้อความที่เกี่ยวข้องกับผู้ใช้นี้
        const isThisUserMsg =
          msg.userId === user.id ||
          (msg.userId === ADMIN_ID && msg.receiverId === user.id);

        if (!isThisUserMsg) return;

        setMessages((prev) => [
          ...prev,
          {
            id: crypto?.randomUUID?.() || `${Date.now()}`,
            self: msg.userId === user.id,
            text: msg.text,
            isAdmin: msg.userId === ADMIN_ID,
            created_at: new Date().toISOString(),
            read: msg.userId !== ADMIN_ID, // ถ้าแอดมินส่งมา ถือว่ายังไม่อ่านจนกว่าจะ mark
          },
        ]);

        // ถ้าข้อความเข้ามาจากแอดมินถึงผู้ใช้
        if (msg.userId === ADMIN_ID && msg.receiverId === user.id) {
          if (open) {
            // เปิดอยู่ → ถือว่าอ่านแล้ว เคลียร์ที่เซิร์ฟเวอร์ทันที
            try { await markAsRead({ reader_id: user.id, peer_id: ADMIN_ID }); } catch {}
            setAdminUnread(0);
          } else {
            // ปิดอยู่ → เพิ่มตัวนับ + เด้งแจ้งเตือนถ้าอนุญาต
            setAdminUnread((prev) => prev + 1);
            if (notifPermRef.current && typeof window !== 'undefined' && 'Notification' in window) {
              try {
                new Notification('ข้อความใหม่จากแอดมิน', { body: msg.text || 'คุณมีข้อความใหม่' });
              } catch {}
            }
          }
        }
      });
    }

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch {}
        socketRef.current = null;
      }
    };
  }, [open, user]);

  // scroll ไปท้ายรายการเมื่อมีข้อความใหม่
  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // ส่งข้อความ
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current || !user) return;

    // 1) บันทึกข้อความ
    const msg = await sendMessage({
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      message: input,
    });

    // 2) แจ้ง socket ไปหาแอดมิน
    socketRef.current.emit('chat message', {
      text: msg.message,
      userId: user.id,
      receiverId: ADMIN_ID,
      username: user.username || user.name || 'User',
    });

    // 3) อัปเดต UI ทันที
    setMessages((prev) => [
      ...prev,
      {
        id: msg.id || crypto?.randomUUID?.() || `${Date.now()}`,
        self: true,
        text: msg.message,
        isAdmin: false,
        created_at: msg.created_at || new Date().toISOString(),
        read: true,
      },
    ]);
    setInput('');
  };

  // ไม่ล็อกอิน ไม่แสดงวิดเจ็ต
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-4">
      {open && (
        <div className="bg-white w-80 max-w-full rounded-2xl shadow-2xl p-4 mb-2 flex flex-col border border-green-200 animate-fadeIn">
          {/* header */}
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-green-700">💬 แชทกับเรา</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-red-500 text-xl"
              aria-label="ปิดหน้าต่างแชท"
              title="ปิด"
              type="button"
            >
              ×
            </button>
          </div>

          {/* list messages */}
          <div
            className="flex-1 overflow-y-auto max-h-64 mb-2 pr-1"
            style={{ fontFamily: 'Prompt, Kanit, sans-serif' }}
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                เริ่มต้นสนทนาได้เลย!
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={m.id || idx} className={`mb-2 flex ${m.self ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-center">
                  <div
                    className={`rounded-full px-4 py-2 text-sm shadow-md ${
                      m.self
                        ? 'bg-white text-black'
                        : m.isAdmin
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          {/* input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border border-green-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              autoFocus
              aria-label="พิมพ์ข้อความ"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold"
              aria-label="ส่งข้อความ"
              title="ส่ง"
            >
              ส่ง
            </button>
          </form>
        </div>
      )}

      {/* ปุ่มลอย + badge เลขยังไม่อ่าน */}
      <div className="relative">
        <button
          onClick={async () => {
            const willOpen = !open;
            setOpen(willOpen);
            if (willOpen && user) {
              // กำลังจะ "เปิด" → เคลียร์เลขใน UI และฐานข้อมูลทันที
              setAdminUnread(0);
              try { await markAsRead({ reader_id: user.id, peer_id: ADMIN_ID }); } catch {}
            }
          }}
          style={{ width: '56px', height: '56px', borderRadius: '50%' }}
          className="bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center text-2xl transition duration-300"
          aria-label={open ? 'ปิดแชท' : 'เปิดแชท'}
          title={open ? 'ปิดแชท' : 'เปิดแชท'}
          type="button"
        >
          💬
        </button>

        {/* badge แสดงเลข */}
        {adminUnread > 0 && !open && (
          <span
            className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1
                       bg-red-600 text-white text-[11px] leading-[20px]
                       rounded-full border-2 border-white text-center font-bold"
            title={`${adminUnread} ข้อความใหม่`}
          >
            {adminUnread > 99 ? '99+' : adminUnread}
          </span>
        )}
      </div>
    </div>
  );
};

export { ChatWidget };
export default ChatWidget;
