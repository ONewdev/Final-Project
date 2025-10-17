// middlewares/customerAuth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'alshop_secret_key';

function authenticateCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.customer = user; // expects shape with user_id
      return next();
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
  }

  // Fallback to session-based auth (legacy)
  if (req.session && req.session.user && req.session.user.id) {
    req.customer = {
      user_id: req.session.user.id,
      email: req.session.user.email,
      name: req.session.user.name,
    };
    return next();
  }

  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

module.exports = { authenticateCustomer };
