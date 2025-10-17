import React, { useEffect, useState, useRef, useMemo } from 'react';
import { fetchContacts, fetchMessages, sendMessage } from '../../services/chatService';
import { io } from 'socket.io-client';

function ChatAdmin() {
  const adminId = 1; // สมมติ admin id = 1
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const notifPermRef = useRef(false);

  // 🔎 state ช่องค้นหา
  const [query, setQuery] = useState('');

  // helper — ทำให้ค้นหาไม่ติดเคส/ช่องว่าง
  const norm = (v) => (v || '').toString().toLowerCase().trim();

  // ดึงรายชื่อผู้ติดต่อ
  useEffect(() => {
    fetchContacts().then(setContacts);
  }, []);

  // เชื่อมต่อ socket.io
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');
    socketRef.current.on('chat message', (msg) => {
      // ถ้ามี selectedContact และข้อความมาจาก user คนนั้น
      if (selectedContact && msg.userId === selectedContact.id) {
        // ดึงข้อความใหม่จาก API
        fetchMessages(adminId, selectedContact.id).then(setMessages);
      }
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedContact]);

  // Secondary listener for unread counts + desktop notifications
  useEffect(() => {
    const socketAlt = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');
    socketAlt.on('chat message', (msg) => {
      if (!selectedContact || msg.userId !== selectedContact.id) {
        setUnreadCounts((prev) => {
          const next = { ...prev, [msg.userId]: (prev[msg.userId] || 0) + 1 };
          const total = Object.values(next).reduce((a, b) => a + b, 0);
          try { window.dispatchEvent(new CustomEvent('adminUnreadChanged', { detail: total })); } catch {}
          return next;
        });
        if (notifPermRef.current && typeof window !== 'undefined' && 'Notification' in window) {
          try { new Notification(`ข้อความใหม่จาก ${msg.username || 'ลูกค้า'}`, { body: msg.text || 'มีข้อความใหม่' }); } catch {}
        }
      }
    });
    return () => { try { socketAlt.disconnect(); } catch {} };
  }, [selectedContact]);

  // Ask for browser notification permission once
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

  // ดึงข้อความเมื่อเลือกผู้ติดต่อ (ครั้งแรก)
  useEffect(() => {
    if (selectedContact) {
      setLoading(true);
      fetchMessages(adminId, selectedContact.id)
        .then((msgs) => {
          setMessages(msgs);
          setLoading(false);
        });
    }
  }, [selectedContact]);

  // scroll ลงล่างสุดเมื่อข้อความเปลี่ยน
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    await sendMessage({ sender_id: adminId, receiver_id: selectedContact.id, message: newMessage });
    setNewMessage('');
    // ดึงข้อความใหม่ทันที
    fetchMessages(adminId, selectedContact.id).then(setMessages);
  };

  // 🔎 กรองรายชื่อจาก query
  const filteredContacts = useMemo(() => {
    const q = norm(query);
    if (!q) return contacts.slice();
    return contacts.filter((c) => {
      const name = norm(c.name);
      const email = norm(c.email);
      const phone = norm(c.phone);
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [contacts, query]);

  // ⬆️ จัดเรียง: คนที่มี unread > 0 มาก่อน, แล้วค่อยตามด้วยชื่อ
  const sortedContacts = useMemo(() => {
    return filteredContacts
      .slice()
      .sort((a, b) => {
        const ua = unreadCounts[a.id] || 0;
        const ub = unreadCounts[b.id] || 0;
        if (ub !== ua) return ub - ua; // มาก → น้อย
        const na = (a.name || a.email || '').toLowerCase();
        const nb = (b.name || b.email || '').toLowerCase();
        return na.localeCompare(nb, 'th');
      });
  }, [filteredContacts, unreadCounts]);

  return (
    <div className="flex h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden font-kanit">
      {/* รายชื่อผู้ติดต่อ */}
      <div className="w-1/4 border-r bg-gradient-to-b from-gray-50 to-white p-4 overflow-y-auto">
        <h2 className="font-bold text-xl mb-4 text-gray-800">รายชื่อผู้ติดต่อ</h2>

        {/* 🔎 ช่องค้นหา */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full border rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring"
              placeholder="ค้นหาชื่อ / อีเมล / เบอร์โทร..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {/* ไอคอนแว่นขยาย */}
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            {/* ปุ่มล้างข้อความ */}
            {query && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setQuery('')}
                aria-label="ล้างคำค้นหา"
                title="ล้างคำค้นหา"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {sortedContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {contacts.length === 0 ? 'ไม่มีผู้ติดต่อ' : 'ไม่พบรายชื่อที่ตรงกับคำค้นหา'}
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedContacts.map((c) => (
              <li
                key={c.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-102 
                  ${selectedContact?.id === c.id 
                    ? 'bg-green-100 shadow-md border border-green-200' 
                    : 'hover:bg-gray-100'}`}
                onClick={() => {
                  setSelectedContact(c);
                  try {
                    // clear unread for this contact
                    setUnreadCounts((prev) => {
                      const next = { ...prev, [c.id]: 0 };
                      const total = Object.values(next).reduce((a, b) => a + b, 0);
                      try { window.dispatchEvent(new CustomEvent('adminUnreadChanged', { detail: total })); } catch {}
                      return next;
                    });
                  } catch {}
                }}
              >
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {c.profile_picture ? (
                      <div className="relative">
                        <img 
                          src={`http://localhost:3001${c.profile_picture}`} 
                          alt="profile" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-blue-600 font-semibold shadow-sm">
                          {(c.name || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{c.name || c.email}</div>
                      {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                    </div>
                  </div>
                  {unreadCounts[c.id] > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                      {unreadCounts[c.id]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* กล่องแชท */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 bg-green-100">
          {selectedContact ? (
            <div className="flex items-center gap-3">
              {selectedContact.profile_picture ? (
                <img src={`http://localhost:3001${selectedContact.profile_picture}`} alt="profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-semibold shadow-sm">
                  {(selectedContact.name || selectedContact.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-lg text-gray-800">{selectedContact.name || selectedContact.email}</h2>
                <p className="text-sm text-gray-500">ออนไลน์</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <h2 className="font-bold text-xl text-gray-400">กรุณาเลือกผู้ติดต่อ</h2>
              <p className="text-sm text-gray-400 mt-1">เลือกผู้ติดต่อจากรายการด้านซ้ายเพื่อเริ่มการสนทนา</p>
            </div>
          )}
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'} mb-4`}>
                  {msg.sender_id !== adminId && (
                    <div className="flex-shrink-0 mr-3">
                      {selectedContact?.profile_picture ? (
                        <img src={`http://localhost:3001${selectedContact.profile_picture}`} alt="profile" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-semibold shadow-sm text-sm">
                          {selectedContact?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-md ${msg.sender_id === adminId ? 'ml-12' : 'mr-12'}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender_id === adminId 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-white border border-gray-100 text-gray-800'
                    }`}>
                      {msg.message}
                      <div className={`text-xs mt-1 ${msg.sender_id === adminId ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {/* ส่งข้อความ */}
        <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="พิมพ์ข้อความ..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!selectedContact}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            disabled={!selectedContact || !newMessage.trim()}
          >ส่ง</button>
        </form>
      </div>
    </div>
  );
}

export default ChatAdmin;
