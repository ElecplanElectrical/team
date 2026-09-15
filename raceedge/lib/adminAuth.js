export function requireAdmin(req, res, next) {
  const configuredToken = process.env.RACEEDGE_ADMIN_TOKEN;
  if (!configuredToken) {
    return res.status(503).json({ error: 'Admin access is not configured.' });
  }
  const supplied = req.get('X-RaceEdge-Admin');
  if (!supplied || supplied !== configuredToken) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}
