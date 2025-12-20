const jwt = require('jsonwebtoken');

// Middleware to verify JWT and attach user to request
function auth(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const tokenFromCookie = req.cookies && req.cookies.token;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      if (!required) {
        return next();
      }
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (err) {
      if (!required) {
        return next();
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = auth;






