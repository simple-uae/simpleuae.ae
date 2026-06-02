const jwt = require('jsonwebtoken');
function verifyToken(request) {
  const header = request.headers.get('authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me');
    if (!decoded.isAdmin) return null;
    return decoded;
  } catch { return null; }
}
function requireAdmin(request) {
  const admin = verifyToken(request);
  if (!admin) return Response.json({ success:false, message:'No token provided or invalid token' },{ status:401 });
  return null;
}
module.exports = { verifyToken, requireAdmin };
