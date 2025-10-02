// ใช้แทนฟังก์ชันเดิมได้เลย (ต้องมีตัวแปร transporter อยู่แล้ว)

// === Nodemailer transporter setup ===
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || 'your_email@gmail.com',
    pass: process.env.MAIL_PASS || 'your_email_password',
  },
});

// Optional: log transporter verify result at startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('[Email] Transporter verify failed:', error);
  } else {
    console.log('[Email] Transporter is ready');
  }
});
const SMTP_VERIFY_TIMEOUT_MS = 5000;   // กันแขวนตอน verify
const MAX_RETRIES = 2;                 // จำนวนครั้งที่ลองซ้ำเมื่อเจอ error ชั่วคราว

// แปลง HTML เป็นข้อความล้วนแบบง่าย ๆ (fallback กรณี client อ่าน text เท่านั้น)
function htmlToText(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// รองรับทั้ง string/comma-separated/array
function normalizeAddresses(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  return String(value).split(',').map(v => v.trim()).filter(Boolean);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isTransientError(err) {
  const msg = (err?.message || String(err || '')).toLowerCase();
  const code = err?.code || err?.responseCode;
  // โค้ด/ข้อความที่มักเกิดชั่วคราว → ควรลองใหม่
  return (
    (typeof code === 'number' && code >= 400 && code < 500) ||        // 4xx ชั่วคราวบางเคส
    /timed?out|econnreset|eai_again|tempfail|tls|too many connections|rate/i.test(msg)
  );
}

async function verifyWithTimeout(transporter, timeoutMs) {
  return Promise.race([
    transporter.verify(),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`SMTP verify timeout after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}

async function sendEmail(to, subject, html) {
  const toList = normalizeAddresses(to);
  const from = process.env.MAIL_FROM || process.env.MAIL_USER || '';

  // Log กระชับ ไม่โชว์ HTML เต็ม
  console.log('[Email] → prepare', {
    to: toList,
    subject: String(subject || '').slice(0, 120),
    htmlLen: typeof html === 'string' ? html.length : 0,
    from,
  });

  // ตรวจค่าจำเป็น
  if (!from) {
    console.error('[Email] ✗ Missing MAIL_FROM/MAIL_USER');
    throw new Error('MAIL_FROM/MAIL_USER not set in .env');
  }
  if (toList.length === 0) {
    console.error('[Email] ✗ Missing recipients');
    throw new Error('No recipients specified');
  }
  if (!subject) {
    console.error('[Email] ✗ Missing subject');
    throw new Error('No subject specified');
  }
  if (!html) {
    console.error('[Email] ✗ Missing html content');
    throw new Error('No html content specified');
  }

  // ตรวจสุขภาพ SMTP (กันแขวนด้วย timeout)
  try {
    await verifyWithTimeout(transporter, SMTP_VERIFY_TIMEOUT_MS);
  } catch (e) {
    console.error('[Email] ✗ verify failed:', e?.message || e);
    throw new Error('SMTP verify failed: ' + (e?.message || e));
  }

  const mailOptions = {
    from,
    to: toList,
    subject,
    html,
    text: htmlToText(html),
  };

  // ส่งอีเมล + retry เมื่อเป็น error ชั่วคราว
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[Email] ✓ sent', { id: info?.messageId, response: info?.response });
      return true;
    } catch (err) {
      const code = err?.code || err?.responseCode;
      const msg = err?.message || String(err);
      console.error(`[Email] ✗ send failed (attempt ${attempt + 1}/${MAX_RETRIES + 1})`, { code, msg });

      if (attempt < MAX_RETRIES && isTransientError(err)) {
        const backoffMs = 400 * (attempt + 1); // 400ms, 800ms, 1200ms
        await sleep(backoffMs);
        continue;
      }
      throw new Error('Email send failed: ' + msg);
    }
  }

  // ปกติจะไม่ถึงตรงนี้
  throw new Error('Unknown email send failure');
}

module.exports = sendEmail;
