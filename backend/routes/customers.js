const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateCustomer } = require('../middlewares/customerAuth');

// ------- Authenticated (ลูกค้า) -------
router.get('/me', authenticateCustomer, (req, res) => {
  res.json({ success: true, user: req.customer });
});

router.get('/profile', authenticateCustomer, async (req, res) => {
  try {
    const db = require('../db');
    const user = await db('customers')
      .select(
        'id','email','name','status','profile_picture',
        'created_at','updated_at','phone','address',
        'province_id','district_id','subdistrict_id','postal_code'
      )
      .where({ id: req.customer.user_id })
      .first();

    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// ------- Master data (ต้องมาก่อน /:id) -------
router.get('/provinces', customerController.getProvinces);
router.get('/districts', customerController.getDistricts);
router.get('/subdistricts', customerController.getSubdistricts);

// ------- Public/ทั่วไป -------
router.get('/', customerController.getAllCustomers);

// ------- Auth ลูกค้า (วางไว้ก่อนทุกเส้นทางที่มี :id) -------
// ถ้าจะให้ path อยู่ใต้ /api/customers ก็จะเป็น /api/customers/verify-email เป็นต้น
// แนะนำให้แยกไปที่ /api/auth ในไฟล์ router อื่น แต่ถ้าจะอยู่ที่นี่ก็ได้
router.get('/verify-email', customerController.verifyEmail);
router.post('/forgot-password', customerController.forgotPassword);
router.get('/verify-reset-token', customerController.verifyResetToken);
router.post('/reset-password', customerController.resetPassword);

// ------- เส้นทางที่มีพาธย่อยจาก :id (ต้องมาก่อน /:id เดี่ยว) -------
router.get('/:id/favorites', customerController.getCustomerFavorites);
router.delete('/:id/delete', customerController.deleteCustomerProfile);
router.delete('/:id/profile-picture', customerController.deleteProfilePicture);

// เส้นทางแก้ไขเฉพาะฟิลด์ (เฉพาะสถานะ) ควรอยู่ก่อน patch put ทั่วไป
router.patch('/:id/status', customerController.changeCustomerStatus);

// อัปเดตโปรไฟล์ (อัปโหลดไฟล์) — ใช้ PUT สำหรับโปรไฟล์ผู้ใช้
router.put('/:id', customerController.uploadProfilePicture, customerController.updateCustomerProfile);

// อัปเดตข้อมูลทั่วไปแบบ admin ใช้ PATCH
router.patch('/:id', customerController.updateCustomer);

// ------- Auth ลูกค้า (login/register) -------
router.post('/login', customerController.login);
router.post('/register', customerController.registerCustomer);

// สุดท้ายค่อยวางตัวกินพาธเดี่ยว ๆ
router.get('/:id', customerController.getCustomerById);

// ลบลูกค้าทั่วไป (ต้องอยู่ท้าย ๆ เพื่อไม่ชนพาธอื่น)
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
