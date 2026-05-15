const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer token from a Next.js Request and returns the decoded payload.
 * Returns null if missing or invalid.
 */
function verifyToken(request) {
  const header = request.headers.get('authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me');
    if (!decoded.isAdmin) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Returns a 401 Response if the request is not authenticated, null otherwise.
 * Usage: const authErr = requireAdmin(request); if (authErr) return authErr;
 */
function requireAdmin(request) {
  const admin = verifyToken(request);
  if (!admin) {
    return Response.json(
      { success: false, message: 'No token provided or invalid token' },
      { status: 401 }
    );
  }
  return null; // authenticated
}

module.exports = { verifyToken, requireAdmin };
