import jwt from 'jsonwebtoken';

export function authMiddleware(request, response, next) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return response.status(401).json({ success: false, message: 'Authentication required' });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    response.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}