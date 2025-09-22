// utils/passwordReset.js
const crypto = require('crypto');

function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ชม.
  return { rawToken, hashedToken, expiresAt };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function verifyHashedToken(rawToken, hashedToken) {
  if (!rawToken || !hashedToken) return false;
  const candidate = hashToken(rawToken);
  try {
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(hashedToken, 'hex');
    if (a.length !== b.length) return false;
    return require('crypto').timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

module.exports = { generateResetToken, hashToken, verifyHashedToken };
