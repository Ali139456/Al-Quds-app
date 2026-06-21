/**
 * OTP send/verify for phone login and admin rider onboarding.
 * Demo mode: OTP is logged to console and returned in API responses.
 */

const OTP_TTL_MINUTES = 10;

function normalizePhone(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('92') && p.length === 12) p = '0' + p.slice(2);
  if (p.length === 10 && p.startsWith('3')) p = '0' + p;
  return p;
}

function isValidPhone(phone) {
  const p = normalizePhone(phone);
  return /^03\d{9}$/.test(p);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createOtpService(db) {
  const { run, getParams } = db;

  function sendOtp(phone, purpose) {
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      throw new Error('Enter a valid Pakistani mobile number (e.g. 03001234567)');
    }
    const code = generateOtp();
    run('DELETE FROM otp_codes WHERE phone = ? AND purpose = ?', [normalized, purpose]);
    run(
      `INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES (?, ?, ?, datetime('now', '+${OTP_TTL_MINUTES} minutes'))`,
      [normalized, code, purpose]
    );
    console.log(`[OTP] ${purpose} → ${normalized}: ${code}`);
    return { phone: normalized, code, expiresInMinutes: OTP_TTL_MINUTES };
  }

  function verifyOtp(phone, code, purpose) {
    const normalized = normalizePhone(phone);
    const entered = String(code || '').trim();
    if (!entered) return null;
    const row = getParams(
      `SELECT id FROM otp_codes
       WHERE phone = ? AND purpose = ? AND code = ? AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`,
      [normalized, purpose, entered]
    );
    if (!row) return null;
    run('DELETE FROM otp_codes WHERE id = ?', [row.id]);
    return normalized;
  }

  return { normalizePhone, isValidPhone, sendOtp, verifyOtp };
}

module.exports = { createOtpService, normalizePhone, isValidPhone };
