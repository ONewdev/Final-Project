 
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { sendMessage, fetchMessages } from '../services/chatService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';


const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [adminUnread, setAdminUnread] = useState(0);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const notifPermRef = useRef(false);

  useEffect(() => {
    // ตรวจสอบ user login (เช็ค localStorage)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
    // อัปเดตเมื่อ login/logout
    const onUserChanged = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('userChanged', onUserChanged);
    return () => window.removeEventListener('userChanged', onUserChanged);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    // ดึงข้อความเก่าจากฐานข้อมูล
    fetchMessages(user.id, 1).then((msgs) => {
      // แปลงข้อความให้รู้ว่าใครเป็นผู้ส่ง
      setMessages(msgs.map(m => ({
        self: m.sender_id === user.id,
        text: m.message,
        isAdmin: m.sender_id === 1
      })));
      // นับข้อความที่ยังไม่ได้อ่านจาก admin
      const unread = msgs.filter(m => m.sender_id === 1 && !m.read).length;
      setAdminUnread(unread);
    });
    // เชื่อมต่อ socket
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.on('chat message', (msg) => {
        // ถ้าเป็นข้อความที่เกี่ยวกับ user นี้เท่านั้น
        if (msg.userId === user.id || msg.userId === 1) {
          setMessages((prev) => [...prev, {
            self: msg.userId === user.id,
            text: msg.text,
            isAdmin: msg.userId === 1
          }]);
          // ถ้าเป็นข้อความจาก admin และยังไม่เปิดแชท
          if (msg.userId === 1 && !open) {
            setAdminUnread((prev) => prev + 1);
            if (notifPermRef.current && typeof window !== 'undefined' && 'Notification' in window) {
              try {
                new Notification('ข้อความใหม่จากแอดมิน', { body: msg.text || 'มีข้อความใหม่' });
              } catch (e) {}
            }
          }
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [open, user]);

  // Ask for browser notification permission
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

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() && socketRef.current && user) {
      // ส่งข้อความไปที่ฐานข้อมูลก่อน
      const msg = await sendMessage({ sender_id: user.id, receiver_id: 1, message: input });
      // emit ผ่าน socket.io เพื่อแจ้ง admin
      socketRef.current.emit('chat message', {
        text: msg.message,
        userId: user.id,
        username: user.username || user.name || 'User',
      });
      setMessages((prev) => [...prev, { self: true, text: msg.message, isAdmin: false }]);
      setInput('');
    }
  };

  // แสดงเฉพาะเมื่อ user login
  if (!user) return null;

   // รีเซ็ตเลขแจ้งเตือนเมื่อเปิดแชท



  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-4">
      {open && (
        <div className="bg-white w-80 max-w-full rounded-2xl shadow-2xl p-4 mb-2 flex flex-col border border-green-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-green-700">💬 แชทกับเรา</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-xl">×</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-64 mb-2 pr-1" style={{fontFamily: 'Prompt, Kanit, sans-serif'}}>
            {messages.length === 0 && <div className="text-gray-400 text-center py-8">เริ่มต้นสนทนาได้เลย!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-center`}>
                  {/* bubble เป็นวงกลม */}
                  <div className={`rounded-full px-4 py-2 text-sm shadow-md ${msg.self ? 'bg-white text-black' : msg.isAdmin ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{msg.text || msg}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border border-green-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              autoFocus
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold">ส่ง</button>
          </form>
        </div>
      )}
      {/* ปุ่มเปิดแชทจะไม่แสดงถ้าไม่ได้ login */}
      {user && (
        <div className="relative">
          <button
            onClick={() => { setOpen((v) => !v); setAdminUnread(0); }}
            style={{ width: "56px", height: "56px", borderRadius: "50%" }}
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center text-2xl transition duration-300"
            aria-label="ติดต่อแชท"
          >
            💬
          </button>
          {adminUnread > 0 && !open && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white" aria-hidden="true"></span>
          )}

        </div>
      )}
    </div>
  );
};

export default ChatWidget;
