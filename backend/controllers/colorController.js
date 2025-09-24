const db = require('../db');

// ดึงรายการสีทั้งหมดจาก product_colors
const getAllColors = async (req, res) => {
  try {
    const colors = await db('product_colors').select('color_name').groupBy('color_name');
    res.json(colors.map(c => c.color_name));
  } catch (err) {
    console.error('Error fetching colors:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllColors };