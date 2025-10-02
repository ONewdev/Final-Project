const db = require('../db'); // อินสแตนซ์ของ Knex ที่เชื่อมต่อฐานข้อมูล
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { generateResetToken, hashToken, verifyHashedToken } = require('../utils/passwordReset');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// === ตั้งค่า multer สำหรับอัปโหลดรูปโปรไฟล์ ===
const profileUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profiles');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดไฟล์ 5MB
});

// ส่ง middleware multer ไปใช้ใน routes
exports.uploadProfilePicture = profileUpload.single('profile_picture');

// ========================================================
// Customers
// ========================================================

// ดึงรายการลูกค้าทั้งหมด (เลือก created_at เพื่อเรียง, และ select ฟิลด์ที่จำเป็น)
exports.getAllCustomers = async (req, res) => {
  try {
    const { limit, order = 'desc' } = req.query;
    const parsedLimit = Number.parseInt(limit, 10);
    const sortDirection = order === 'asc' ? 'asc' : 'desc';

    const query = db('customers')
      .leftJoin('subdistricts', 'customers.subdistrict_id', 'subdistricts.id')
      .leftJoin('districts', 'customers.district_id', 'districts.id')
      .leftJoin('provinces', 'customers.province_id', 'provinces.id')
      .select(
        'customers.id',
        'customers.email',
        'customers.name',
        'customers.status',
        'customers.profile_picture',
        'customers.phone',
        'customers.address',
        'customers.subdistrict_id',
        'customers.district_id',
        'customers.province_id',
        'customers.created_at',
        'subdistricts.name_th as subdistrict_name',
        'districts.name_th as district_name',
        'provinces.name_th as province_name',
        'subdistricts.postal_code'
      )
      .orderBy('customers.created_at', sortDirection);

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      query.limit(parsedLimit);
    }

    const rows = await query;

    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลลูกค้าได้' });
  }
};

// ลบลูกค้า
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db('customers').where('id', id).del();
    res.status(200).json({ message: 'ลบลูกค้าสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบลูกค้าได้' });
  }
};

// เปลี่ยนสถานะลูกค้า (validate ค่าที่รับมา)
exports.changeCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'ค่าสถานะไม่ถูกต้อง' });
  }

  try {
    await db('customers').where('id', id).update({ status });
    res.status(200).json({ message: `เปลี่ยนสถานะเป็น ${status} สำเร็จ` });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถเปลี่ยนสถานะได้' });
  }
};

// ลบรูปโปรไฟล์ของลูกค้า
exports.deleteProfilePicture = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('customers').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    if (user.profile_picture) {
      const filePath = path.join(__dirname, '..', 'public', user.profile_picture);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (err) { /* ignore */ }
      }
      await db('customers').where({ id }).update({ profile_picture: null });
      return res.status(200).json({ message: 'ลบรูปโปรไฟล์เรียบร้อยแล้ว' });
    }
    return res.status(400).json({ message: 'ไม่มีรูปโปรไฟล์ให้ลบ' });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ message: 'ไม่สามารถลบรูปโปรไฟล์ได้' });
  }
};

// ลบโปรไฟล์ลูกค้า (รวมไฟล์รูปถ้ามี)
exports.deleteCustomerProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('customers').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    if (user.profile_picture) {
      const filePath = path.join(__dirname, '..', 'public', user.profile_picture);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (err) { /* ignore */ }
      }
    }

    await db('customers').where({ id }).del();
    res.status(200).json({ message: 'ลบโปรไฟล์ลูกค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting customer profile:', error);
    res.status(500).json({ message: 'ไม่สามารถลบโปรไฟล์ลูกค้าได้' });
  }
};

// อัปเดตข้อมูลลูกค้า (อัปเดต updated_at เสมอ)
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { email, name, status } = req.body;

  try {
    const updated_at = new Date();
    await db('customers').where('id', id).update({ email, name, status, updated_at });
    res.status(200).json({ message: 'อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้' });
  }
};

// ========================================================
// Auth
// ========================================================
const JWT_SECRET = process.env.JWT_SECRET || 'alshop_secret_key';
const JWT_EXPIRES = '7d';

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db('customers').where({ email }).first();
    if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign(
      { user_id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: { id: user.id, name: user.name, email: user.email, status: user.status },
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'ไม่สามารถเข้าสู่ระบบได้' });
  }
};

// สมัครสมาชิก (ทำ validation และส่งอีเมลต้อนรับ)
exports.registerCustomer = async (req, res) => {
  const { email, password, username } = req.body || {};
  const normalisedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const displayName = typeof username === 'string' ? username.trim() : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fieldErrors = {};

  if (!displayName || displayName.length < 3) {
    fieldErrors.username = 'USERNAME_MIN_LENGTH';
  }
  if (!normalisedEmail || !emailRegex.test(normalisedEmail)) {
    fieldErrors.email = 'EMAIL_INVALID';
  }
  if (typeof password !== 'string' || password.length < 6) {
    fieldErrors.password = 'PASSWORD_MIN_LENGTH';
  }

  if (Object.keys(fieldErrors).length) {
    return res.status(400).json({ message: 'VALIDATION_ERROR', errors: fieldErrors });
  }

  try {
    const existingEmail = await db('customers')
      .whereRaw('LOWER(email) = ?', [normalisedEmail])
      .first();
    if (existingEmail) {
      return res.status(400).json({
        message: 'EMAIL_ALREADY_EXISTS',
        errors: { email: 'EMAIL_ALREADY_EXISTS' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const customerData = {
      email: normalisedEmail,
      password: hashedPassword,
      name: displayName,
      created_at: now,
      updated_at: now,
      status: 'active',
      profile_picture: null,
    };

    const insertResult = await db('customers').insert(customerData);
    const id = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    const subject = 'ยินดีต้อนรับสู่ ALShop';
    const safeName = escapeHtml(displayName || 'Customer');
    const safeEmail = escapeHtml(normalisedEmail);
    const baseUrl = (process.env.APP_BASE_URL || 'https://alshop-crru.vercel.app').replace(/\/+$/, '');
    const loginUrl = `${baseUrl}/login`;
    const safeLoginUrl = escapeHtml(loginUrl);
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #222; background: linear-gradient(to bottom right, #f0fdf4, #fff, #ecfdf5);">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #15803d; font-size: 28px; margin: 0;">ยินดีต้อนรับสู่ ALShop</h1>
          <p style="color: #166534; font-size: 18px; margin-top: 10px;">สวัสดีคุณ ${safeName}</p>
        </div>
        
        <div style="background: white; border-radius: 10px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            คุณได้สมัครสมาชิกกับ <b>ALShop</b> สำเร็จแล้ว<br>
            อีเมลที่ใช้สมัคร: <b style="color: #15803d;">${safeEmail}</b>
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${safeLoginUrl}" 
               style="display: inline-block; background: linear-gradient(to right, #16a34a, #15803d); 
                      color: white; text-decoration: none; padding: 12px 32px; 
                      border-radius: 50px; font-weight: bold; font-size: 16px;
                      box-shadow: 0 2px 4px rgba(22,163,74,0.2);">
              เข้าสู่ระบบ
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            หากมีข้อสงสัย ติดต่อเราได้ที่ 
            <a href="mailto:support@alshop.com" style="color: #16a34a; text-decoration: none;">support@alshop.com</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #666; font-size: 14px;">
          <img src="https://alshop-crru.vercel.app/logo.png" alt="ALShop Logo" style="width: 60px; margin-bottom: 16px;"><br>
          Aluminium Shop<br>
          <a href="${safeLoginUrl}" style="color: #16a34a; text-decoration: none;">${safeLoginUrl}</a>
        </div>
      </div>
    `;
    const emailResult = await sendEmail(normalisedEmail, subject, html);

    if (!emailResult) {
      return res.status(201).json({
        message: 'REGISTERED_WITHOUT_EMAIL',
        id,
        emailSent: false,
      });
    }

    res.status(201).json({ message: 'REGISTERED', id, emailSent: true });
  } catch (error) {
    console.error('Error in registerCustomer:', error);
    res.status(500).json({ message: 'SERVER_ERROR' });
  }
};

// ========================================================
// Profile
// ========================================================

// ดึงข้อมูลลูกค้าตาม id (join จังหวัด/อำเภอ/ตำบล)
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db('customers')
      .leftJoin('subdistricts', 'customers.subdistrict_id', 'subdistricts.id')
      .leftJoin('districts', 'customers.district_id', 'districts.id')
      .leftJoin('provinces', 'customers.province_id', 'provinces.id')
      .select(
        'customers.id',
        'customers.email',
        'customers.name',
        'customers.status',
        'customers.profile_picture',
        'customers.phone',
        'customers.address',
        'customers.subdistrict_id',
        'customers.district_id',
        'customers.province_id',
        'subdistricts.name_th as subdistrict_name',
        'districts.name_th as district_name',
        'provinces.name_th as province_name',
        'subdistricts.postal_code'
      )
      .where('customers.id', id)
      .first();

    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีลูกค้า' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching customer:', error.message);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลลูกค้าได้' });
  }
};

// อัปเดตโปรไฟล์ลูกค้า (อัปเดต updated_at เสมอ)
exports.updateCustomerProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, subdistrict_id, district_id, province_id, postal_code } = req.body;
  let profile_picture = req.body.profile_picture;

  const toIntOrNull = v => (v === '' || v === 'null' || v == null ? null : Number(v));

  try {
    if (req.file) {
      profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    const updated_at = new Date();
    const updateData = {
      name,
      email,
      phone,
      address,
      subdistrict_id: toIntOrNull(subdistrict_id),
      district_id: toIntOrNull(district_id),
      province_id: toIntOrNull(province_id),
      updated_at
    };
    if (typeof postal_code !== 'undefined') updateData.postal_code = postal_code;
    if (profile_picture) updateData.profile_picture = profile_picture;

    await db('customers').where({ id }).update(updateData);

    // ส่ง user กลับ (ฟิลด์หลัก)
    const updatedUser = await db('customers')
      .select(
        'id',
        'email',
        'name',
        'status',
        'profile_picture',
        'phone',
        'address',
        'province_id',
        'district_id',
        'subdistrict_id',
        'postal_code'
      )
      .where({ id })
      .first();

    res.status(200).json({
      message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ message: 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
  }
};

// ========================================================
// Favorites
// ========================================================
exports.getCustomerFavorites = async (req, res) => {
  const { id } = req.params;

  try {
    const favorites = await db('favorites')
      .join('products', 'favorites.product_id', 'products.id')
      .leftJoin('category', 'products.category_id', 'category.category_id')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.image_url',
        'products.status',
        'category.category_name',
        'favorites.created_at as favorited_at'
      )
      .where('favorites.customer_id', id)
      .where('products.status', 'active')
      .orderBy('favorites.created_at', 'desc');

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching customer favorites:', error.message);
    res.status(500).json({
      message: 'ไม่สามารถดึงรายการโปรดได้',
      error: error.message
    });
  }
};

// ========================================================
// Location master data
// ========================================================
exports.getProvinces = async (req, res) => {
  try {
    const provinces = await db('provinces').select('id', 'name_th');
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงรายชื่อจังหวัดได้' });
  }
};

exports.getDistricts = async (req, res) => {
  const { province_id } = req.query;
  try {
    if (!province_id) return res.status(400).json({ message: 'กรุณาระบุ province_id' });
    const districts = await db('districts')
      .where('province_id', province_id)
      .select('id', 'name_th');
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงอำเภอได้' });
  }
};

exports.getSubdistricts = async (req, res) => {
  const { district_id } = req.query;
  try {
    if (!district_id) return res.status(400).json({ message: 'กรุณาระบุ district_id' });
    const subdistricts = await db('subdistricts')
      .where('district_id', district_id)
      .select('id', 'name_th', 'postal_code');
    res.json(subdistricts);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงตำบลได้' });
  }
};

// ========================================================
// Email Verification & Password Reset
// ========================================================

// ยืนยันอีเมล (จากลิงก์ในอีเมล)
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'ต้องระบุ token' });

  try {
    const hashed = hashToken(token);
    const user = await db('customers')
      .where({ verification_token: hashed })
      .andWhere('verification_expires', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({ message: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }

    await db('customers').where({ id: user.id }).update({
      is_verified: true,
      verification_token: null,
      verification_expires: null,
    });

    return res.redirect(`${process.env.APP_BASE_URL}/verify/success`);
  } catch (err) {
    console.error('Error verifyEmail:', err);
    res.status(500).json({ message: 'ไม่สามารถยืนยันอีเมลได้' });
  }
};

// ขอรีเซ็ตรหัสผ่าน: ส่งลิงก์รีเซ็ตไปอีเมล
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'กรุณาระบุอีเมล' });

  try {
    const user = await db('customers').where({ email }).first();
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    const { rawToken, hashedToken, expiresAt } = generateResetToken();

    await db('customers')
      .where({ id: user.id })
      .update({ reset_token: hashedToken, reset_token_expires: expiresAt });

    const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    const subject = 'รีเซ็ตรหัสผ่าน ALShop';
    const html = `
      <p>คุณได้ร้องขอการรีเซ็ตรหัสผ่าน</p>
      <p><a href="${resetUrl}" target="_blank">คลิกลิงก์นี้เพื่อรีเซ็ตรหัสผ่านของคุณ</a></p>
      <p>ลิงก์มีอายุ 1 ชั่วโมง</p>
    `;

    await sendEmail(email, subject, html);
    res.json({ message: 'ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่อีเมลแล้ว' });
  } catch (err) {
    console.error('Error forgotPassword:', err);
    res.status(500).json({ message: 'ไม่สามารถดำเนินการได้' });
  }
};

// ตรวจสอบความถูกต้องของ token รีเซ็ต (ใช้ตอนหน้ารีเซ็ต)
exports.verifyResetToken = async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) return res.status(400).json({ message: 'กรุณาระบุ token และ email' });

  try {
    const user = await db('customers').where({ email }).first();
    if (!user || !user.reset_token) {
      return res.status(400).json({ message: 'ไม่พบ token' });
    }

    const valid = verifyHashedToken(token, user.reset_token);
    if (!valid || new Date() > user.reset_token_expires) {
      return res.status(400).json({ message: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }

    res.json({ message: 'token ใช้งานได้' });
  } catch (err) {
    console.error('Error verifyResetToken:', err);
    res.status(500).json({ message: 'ไม่สามารถตรวจสอบ token ได้' });
  }
};

// รีเซ็ตรหัสผ่านจริง
exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    return res.status(400).json({ message: 'กรุณาระบุ token, email และรหัสผ่านใหม่' });
  }

  try {
    const user = await db('customers').where({ email }).first();
    if (!user || !user.reset_token) {
      return res.status(400).json({ message: 'ไม่พบ token' });
    }

    const valid = verifyHashedToken(token, user.reset_token);
    if (!valid || new Date() > user.reset_token_expires) {
      return res.status(400).json({ message: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db('customers')
      .where({ id: user.id })
      .update({
        password: hashed,
        reset_token: null,
        reset_token_expires: null,
        updated_at: db.fn.now(),
      });

    res.json({ message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error resetPassword:', err);
    res.status(500).json({ message: 'ไม่สามารถรีเซ็ตรหัสผ่านได้' });
  }
};
