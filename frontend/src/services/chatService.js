// src/services/chatService.js
const host = import.meta.env.VITE_HOST;

// ดึงรายชื่อ user ทั้งหมด (ลูกค้าทั้งหมด)
export const fetchContacts = async () => {
  const res = await fetch(`${host}/api/customers`);
  return res.json();
};

// ดึงข้อความระหว่าง 2 คน
export const fetchMessages = async (senderId, receiverId) => {
  const res = await fetch(`${host}/api/messages?senderId=${senderId}&receiverId=${receiverId}`);
  return res.json();
};

// ส่งข้อความ
export const sendMessage = async ({ sender_id, receiver_id, message }) => {
  const res = await fetch(`${host}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, message }),
  });
  return res.json();
};

export const fetchUnreadCount = async ({ reader_id, peer_id }) => {
  const res = await fetch(`${host}/api/messages/unread-count?reader_id=${reader_id}&peer_id=${peer_id}`);
  if (!res.ok) return { count: 0 };
  return res.json(); // expected: { count: number }
};

// ทำเครื่องหมายว่าอ่านแล้ว (ข้อความที่ sender = peer, receiver = reader)
export const markAsRead = async ({ reader_id, peer_id }) => {
  const res = await fetch(`${host}/api/messages/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reader_id, peer_id }),
  });
  return res.ok;
};