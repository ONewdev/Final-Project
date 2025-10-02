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
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for QR image.'));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage, fileFilter });

const uploadQrImage = (req, res, next) => {
  upload.single('qr_image_file')(req, res, (err) => {
    if (err) {
      console.error('QR image upload error:', err);
      return res.status(400).json({ error: err.message || 'Invalid QR image file.' });
    }
    next();
  });
};

const buildQrImagePath = (filename) => `/uploads/contact/${filename}`;

const deleteFileIfExists = async (relativePath) => {
  if (!relativePath || typeof relativePath !== 'string') return;
  if (!relativePath.startsWith('/uploads/contact/')) return;
  const absolutePath = path.join(__dirname, '..', 'public', relativePath.replace(/^\//, ''));
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error removing QR image:', error);
    }
  }
};

const trimOrEmpty = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value.trim() : String(value);
};

const mapRequestToPayload = (body = {}) => {
  const phoneCandidate = trimOrEmpty(body.phone) || trimOrEmpty(body.tel);
  const emailCandidate = trimOrEmpty(body.email) || trimOrEmpty(body.gmail);
  const openHoursCandidate = trimOrEmpty(body.open_hours) || trimOrEmpty(body.time);
  const mapUrlCandidate = trimOrEmpty(body.map_url) || trimOrEmpty(body.map);
  const statusDbValue = (body.status === 'inactive' || body.status === 0 || body.status === '0') ? 0 : 1;

  return {
    name: trimOrEmpty(body.name),
    address: trimOrEmpty(body.address),
    tel: phoneCandidate,
    gmail: emailCandidate,
    map: mapUrlCandidate,
    time: openHoursCandidate,
    logo: trimOrEmpty(body.logo),
    qr_image: trimOrEmpty(body.qr_image),
    bank_account: trimOrEmpty(body.bank_account),
    bank_name: trimOrEmpty(body.bank_name),
    account_name: trimOrEmpty(body.account_name),
    status: statusDbValue,
  };
};

const hasMinimumRequiredFields = (payload) => Boolean(payload.name && payload.tel && payload.gmail);

const mapContactRecordToResponse = (info = {}) => {
  const statusNormalized = (info.status === 'active' || info.status === 1 || info.status === '1')
    ? 'active'
    : 'inactive';

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

const createContact = async (req, res) => {
  const payload = mapRequestToPayload(req.body);
  const uploadedQrPath = req.file ? buildQrImagePath(req.file.filename) : null;

  if (!hasMinimumRequiredFields(payload)) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').first();

    if (existing) {
      const previousQr = existing.qr_image;
      if (uploadedQrPath) {
        payload.qr_image = uploadedQrPath;
      }
      await db('contact').where({ id: existing.id }).update(payload);
      if (uploadedQrPath && previousQr && previousQr !== uploadedQrPath) {
        await deleteFileIfExists(previousQr);
      }
      return res.status(200).json({ message: 'Contact updated.', id: existing.id });
    }

    if (uploadedQrPath) {
      payload.qr_image = uploadedQrPath;
    }

    const insertData = { ...payload };
    if (req.body && req.body.id !== undefined && req.body.id !== null && req.body.id !== '') {
      insertData.id = req.body.id;
    } else {
      insertData.id = 1;
    }

    const insertedIds = await db('contact').insert(insertData);
    const newId = (req.body && req.body.id) || insertedIds?.[0] || insertData.id;

    return res.status(201).json({ message: 'Contact created.', id: newId });
  } catch (err) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
    console.error('Error creating contact:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

const updateContactById = async (req, res) => {
  const { id } = req.params;
  const payload = mapRequestToPayload(req.body);
  const uploadedQrPath = req.file ? buildQrImagePath(req.file.filename) : null;

  if (!hasMinimumRequiredFields(payload)) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').where({ id }).first();

    if (!existing) {
      if (uploadedQrPath) {
        await deleteFileIfExists(uploadedQrPath);
      }
      return res.status(404).json({ error: CONTACT_NOT_FOUND_ERROR });
    }

    if (uploadedQrPath) {
      payload.qr_image = uploadedQrPath;
    }

    await db('contact').where({ id }).update(payload);

    if (uploadedQrPath && existing.qr_image && existing.qr_image !== uploadedQrPath) {
      await deleteFileIfExists(existing.qr_image);
    }

    return res.status(200).json({ message: 'Contact updated.', id });
  } catch (err) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
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
  const payload = mapRequestToPayload(req.body);
  const uploadedQrPath = req.file ? buildQrImagePath(req.file.filename) : null;

  if (!hasMinimumRequiredFields(payload)) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
    return res.status(400).json({ error: REQUIRED_FIELDS_ERROR });
  }

  try {
    const existing = await db('contact').first();

    if (existing) {
      const previousQr = existing.qr_image;
      if (uploadedQrPath) {
        payload.qr_image = uploadedQrPath;
      }
      await db('contact').where({ id: existing.id }).update(payload);
      if (uploadedQrPath && previousQr && previousQr !== uploadedQrPath) {
        await deleteFileIfExists(previousQr);
      }
      return res.status(200).json({ message: 'Contact updated.', id: existing.id });
    }

    if (uploadedQrPath) {
      payload.qr_image = uploadedQrPath;
    }

    const insertData = { ...payload };
    if (req.body && req.body.id !== undefined && req.body.id !== null && req.body.id !== '') {
      insertData.id = req.body.id;
    } else {
      insertData.id = 1;
    }

    const insertedIds = await db('contact').insert(insertData);
    const newId = (req.body && req.body.id) || insertedIds?.[0] || insertData.id;

    return res.status(201).json({ message: 'Contact created.', id: newId });
  } catch (err) {
    if (uploadedQrPath) {
      await deleteFileIfExists(uploadedQrPath);
    }
    console.error('Error updating contact:', err);
    return res.status(500).json({ error: GENERIC_SERVER_ERROR });
  }
};

module.exports = {
  uploadQrImage,
  createContact,
  updateContactById,
  getContact,
  updateContact,
};
