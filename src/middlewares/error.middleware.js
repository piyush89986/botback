export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
