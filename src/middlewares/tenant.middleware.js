export function tenantScope(req, res, next) {
  const businessId = req.user?.businessId || req.params.businessId || req.headers['x-business-id'];

  if (!businessId) {
    return res.status(400).json({ success: false, message: 'businessId is required' });
  }

  req.businessId = businessId;
  next();
}

export function validateTenantAccess(req, res, next) {
  if (req.user?.businessId && req.businessId && req.user.businessId !== req.businessId) {
    return res.status(403).json({ success: false, message: 'Access denied for this business' });
  }
  next();
}
