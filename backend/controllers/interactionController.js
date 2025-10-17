const db = require('../db'); // knex instance

// ----- RATING -----
exports.submitOrUpdateRating = async (req, res) => {
  const { customer_id, product_id, rating } = req.body;

  // 1. ตรวจสอบข้อมูลเบื้องต้น
  if (!customer_id || !product_id || !rating) {
    return res.status(400).json({ message: 'Missing required data (customer_id, product_id, rating)' });
  }
  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
  }

  try {
    // 3. เช็คว่า user เคยให้คะแนนสินค้านี้แล้วหรือยัง
    const existingRating = await db('product_ratings')
      .where({ customer_id, product_id })
      .first(); // .first() เพื่อเอาแค่ record เดียว

    if (existingRating) {
      // ถ้าเคยแล้ว -> ให้อัปเดตคะแนนใหม่
      await db('product_ratings')
        .where({ id: existingRating.id })
        .update({ rating: numericRating });
      res.json({ success: true, message: 'Rating updated successfully.' });
    } else {
      // ถ้ายังไม่เคย -> ให้เพิ่มข้อมูลใหม่
      await db('product_ratings').insert({
        customer_id,
        product_id,
        rating: numericRating,
      });
      res.json({ success: true, message: 'Rating submitted successfully.' });
    }
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ message: 'Error processing rating', error: err });
  }
};


/**
 * ตรวจสอบสถานะคะแนนที่ user เคยให้
 * นี่คือฟังก์ชันที่ Frontend จะเรียกใช้เพื่อแสดงดาวที่ถูกต้องตอนโหลดหน้าเว็บ
 */
exports.checkRatingStatus = async (req, res) => {
  const { customer_id, product_id } = req.query;
  if (!customer_id || !product_id) {
    return res.status(400).json({ message: 'Missing query parameters' });
  }

  try {
    const ratingRecord = await db('product_ratings')
      .where({ customer_id, product_id })
      .first();

    // ถ้าเจอ record ให้ส่งค่า rating กลับไป
    // ถ้าไม่เจอ ให้ส่ง 0 กลับไป (เพื่อให้ Frontend แสดงผลเป็นดาวว่าง)
    res.json({ rating: ratingRecord ? ratingRecord.rating : 0 });
    
  } catch (err) {
    console.error("Error checking rating status:", err);
    res.status(500).json({ message: 'Error checking rating status', error: err });
  }
};

// Get rating summary (average and count) for a product
exports.getRatingSummary = async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) {
    return res.status(400).json({ message: 'Missing product_id' });
  }

  try {
    const row = await db('product_ratings')
      .where({ product_id })
      .avg({ avg_rating: 'rating' })
      .count({ rating_count: 'id' })
      .first();

    const avg = row && row.avg_rating != null ? Number(row.avg_rating) : 0;
    const count = row && row.rating_count != null ? Number(row.rating_count) : 0;

    return res.json({ avg_rating: avg, rating_count: count });
  } catch (err) {
    console.error('Error fetching rating summary:', err);
    return res.status(500).json({ message: 'Error fetching rating summary', error: err });
  }
};



// ----- FAVORITE -----
exports.favoriteProduct = async (req, res) => {
  const { customer_id, product_id } = req.body;
  if (!customer_id || !product_id) return res.status(400).json({ message: 'Missing data' });

  try {
    await db('favorites').insert({ customer_id, product_id });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Already favorited' });
    } else {
      res.status(500).json({ message: 'Error inserting favorite', error: err });
    }
  }
};

exports.unfavoriteProduct = async (req, res) => {
  const { customer_id, product_id } = req.body;
  await db('favorites').where({ customer_id, product_id }).del();
  res.json({ success: true });
};



exports.checkFavoriteStatus = async (req, res) => {
  const { customer_id, product_id } = req.query;
  const fav = await db('favorites').where({ customer_id, product_id }).first();
  res.json({ favorited: !!fav });
};
