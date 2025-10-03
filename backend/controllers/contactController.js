// controllers/contactController.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');

const REQUIRED_FIELDS_ERROR = 'Name, phone, and email are required.';
const CONTACT_NOT_FOUND_ERROR = 'Contact not found.';
const GENERIC_SERVER_ERROR = 'Unexpected server error. Please try again.';

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'contact');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed.'));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage, fileFilter });

// => ใช้รับไฟล์ทั้งสอง field ในคำขอเดียว
const uploadContactImages = (req, res, next) => {
  const mw = upload.fields([
    { name: 'qr_image_file', maxCount: 1 },
    { name: 'logo_file', maxCount: 1 },
  ]);
  mw(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Invalid image file.' });
    }
    next();
  });
};

const buildPath = (filename) => `/uploads/contact/${filename}`;

const deleteFileIfExists = async (relativePath) => {
  if (!relativePath || typeof relativePath !== 'string') return;
  if (!relativePath.startsWith('/uploads/contact/')) return;
  const absolutePath = path.join(__dirname, '..', 'public', relativePath.replace(/^\//, ''));
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error removing image:', error);
    }
  }
};

const trimOrUndefined = (value) => {
  if (value === null || value === undefined) return undefined;
  const s = typeof value === 'string' ? value.trim() : String(value);
  return s;
};

const mapRequestToPayload = (body = {}) => {
  const tel = trimOrUndefined(body.phone) ?? trimOrUndefined(body.tel);
  const gmail = trimOrUndefined(body.email) ?? trimOrUndefined(body.gmail);
  const time = trimOrUndefined(body.open_hours) ?? trimOrUndefined(body.time);
  const map = trimOrUndefined(body.map_url) ?? trimOrUndefined(body.map);

  let status;
  if (body.status !== undefined) {
    status = (body.status === 'inactive' || body.status === 0 || body.status === '0') ? 0 : 1;
  }

  return {
    name: trimOrUndefined(body.name),
    address: trimOrUndefined(body.address),
    tel,
    gmail,
    map,
    time,
    logo: trimOrUndefined(body.logo),
    qr_image: trimOrUndefined(body.qr_image),
    bank_account: trimOrUndefined(body.bank_account),
    bank_name: trimOrUndefined(body.bank_name),
    account_name: trimOrUndefined(body.account_name),
    status,
  };
};

const pruneUndefined = (obj = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const hasMinimumRequiredFields = (payload) =>
  Boolean(payload.name && payload.tel && payload.gmail);

const mapContactRecordToResponse = (info = {}) => {
  const statusNormalized =
    (info.status === 'active' || info.status === 1 || info.status === '1') ? 'active' : 'inactive';

  return {
    id: info.id,
    name: info.name || '',
    address: info.address || '',
    phone: info.tel || '',
    email: info.gmail || '',
    open_hours: info.time || '',
    map_url: info.map || '',
    logo: info.logo || '',
    qr_image: info.qr_image || '',
    bank_account: info.bank_account || '',
    bank_name: info.bank_name || '',
    account_name: info.account_name || '',
    status: statusNormalized,
  };
};

// ---------- Handlers ----------
const createContact = async (req, res) => {
  // ดึงไฟล์ที่อัปโหลด (ถ้ามี)
  const qrUploaded = req.files?.qr_image_file?.[0];
  const logoUploaded = req.files?.logo_file?.[0];

  const payload = mapRequestToPayload(req.body);

  // ถ้ามีไฟล์ใหม่ ให้เซ็ต path ลง payload
  if (qrUploaded) payload.qr_image = buildPath(qrUploaded.filename);
  if (logoUploaded) payload.logo = buildPath(logoUploaded.filename);

  // สร้างใหม่ต้องมี field ขั้นต่ำ
  if (!hasMinimumRequiredFields(payload)) {
    // rollback ไฟล์ที่เพิ่งอัปโหลด
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').first();

    if (existing) {
      // อัปเดตเรคคอร์ดเดียวที่มีอยู่
      const prevQr = existing.qr_image;
      const prevLogo = existing.logo;

      const updatePayload = pruneUndefined(payload);
      await db('contact').where({ id: existing.id }).update(updatePayload);

      // ลบไฟล์เก่าที่ถูกแทนด้วยไฟล์ใหม่
      if (qrUploaded && prevQr && prevQr !== updatePayload.qr_image) {
        await deleteFileIfExists(prevQr);
      }
      if (logoUploaded && prevLogo && prevLogo !== updatePayload.logo) {
        await deleteFileIfExists(prevLogo);
      }

      return res.status(200).json({ message: 'Contact updated.', id: existing.id });
    }

    // ยังไม่มี -> insert ใหม่ (กำหนด id=1 เป็นค่าเริ่มต้น)
    const insertData = pruneUndefined({
      ...payload,
      id: (req.body && req.body.id) ? req.body.id : 1,
    });

    const insertedIds = await db('contact').insert(insertData);
    const newId = (req.body && req.body.id) || insertedIds?.[0] || insertData.id;

    return res.status(201).json({ message: 'Contact created.', id: newId });
  } catch (err) {
    // rollback ไฟล์ใหม่
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    console.error('Error creating contact:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

const updateContactById = async (req, res) => {
  const { id } = req.params;

  const qrUploaded = req.files?.qr_image_file?.[0];
  const logoUploaded = req.files?.logo_file?.[0];

  const payload = mapRequestToPayload(req.body);
  if (qrUploaded) payload.qr_image = buildPath(qrUploaded.filename);
  if (logoUploaded) payload.logo = buildPath(logoUploaded.filename);

  // อัปเดต: โดยปกติ frontend ส่งครบอยู่แล้ว หากอยากผ่อนเงื่อนไขให้อนุญาต partial update ก็ไม่ต้องเช็ก required
  if (!hasMinimumRequiredFields({ ...payload, // เผื่อ frontend ส่งมาครบ
    name: payload.name ?? 'x', tel: payload.tel ?? 'x', gmail: payload.gmail ?? 'x' })) {
    // ถ้าจะให้ partial จริง ๆ ให้ลบบรรทัด if ทั้งบล็อกนี้ออก
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').where({ id }).first();
    if (!existing) {
      if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
      if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
      return res.status(404).json({ error: CONTACT_NOT_FOUND_ERROR });
    }

    const updatePayload = pruneUndefined(payload);
    await db('contact').where({ id }).update(updatePayload);

    if (qrUploaded && existing.qr_image && existing.qr_image !== updatePayload.qr_image) {
      await deleteFileIfExists(existing.qr_image);
    }
    if (logoUploaded && existing.logo && existing.logo !== updatePayload.logo) {
      await deleteFileIfExists(existing.logo);
    }

    return res.status(200).json({ message: 'Contact updated.', id });
  } catch (err) {
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    console.error('Error updating contact by id:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

const getContact = async (req, res) => {
  try {
    const info = await db('contact').first();
    if (!info) {
      return res.status(200).json({
        name: '',
        address: '',
        phone: '',
        email: '',
        open_hours: '',
        map_url: '',
        logo: '',
        qr_image: '',
        bank_account: '',
        bank_name: '',
        account_name: '',
        status: 'active',
      });
    }
    return res.status(200).json(mapContactRecordToResponse(info));
  } catch (err) {
    console.error('Error fetching contact:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

const updateContact = async (req, res) => {
  // เวอร์ชันไม่ระบุ id ใน path: ทำงานกับเรคคอร์ดแรก (singleton)
  const qrUploaded = req.files?.qr_image_file?.[0];
  const logoUploaded = req.files?.logo_file?.[0];

  const payload = mapRequestToPayload(req.body);
  if (qrUploaded) payload.qr_image = buildPath(qrUploaded.filename);
  if (logoUploaded) payload.logo = buildPath(logoUploaded.filename);

  if (!hasMinimumRequiredFields({ ...payload, name: payload.name ?? 'x', tel: payload.tel ?? 'x', gmail: payload.gmail ?? 'x' })) {
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').first();

    if (existing) {
      const prevQr = existing.qr_image;
      const prevLogo = existing.logo;

      const updatePayload = pruneUndefined(payload);
      await db('contact').where({ id: existing.id }).update(updatePayload);

      if (qrUploaded && prevQr && prevQr !== updatePayload.qr_image) {
        await deleteFileIfExists(prevQr);
      }
      if (logoUploaded && prevLogo && prevLogo !== updatePayload.logo) {
        await deleteFileIfExists(prevLogo);
      }

      return res.status(200).json({ message: 'Contact updated.', id: existing.id });
    }

    // ไม่มี -> สร้างใหม่
    const insertData = pruneUndefined({
      ...payload,
      id: (req.body && req.body.id) ? req.body.id : 1,
    });

    const insertedIds = await db('contact').insert(insertData);
    const newId = (req.body && req.body.id) || insertedIds?.[0] || insertData.id;

    return res.status(201).json({ message: 'Contact created.', id: newId });
  } catch (err) {
    if (qrUploaded) await deleteFileIfExists(buildPath(qrUploaded.filename));
    if (logoUploaded) await deleteFileIfExists(buildPath(logoUploaded.filename));
    console.error('Error updating contact:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

module.exports = {
  // middleware สำหรับ route: ใช้แทน uploadQrImage เดิม
  uploadContactImages,
  createContact,
  updateContactById,
  getContact,
  updateContact,
};
