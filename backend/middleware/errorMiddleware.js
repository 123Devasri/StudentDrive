export function notFoundMiddleware(request, response) {
  response.status(404).json({ success: false, message: 'Route not found' });
}

export function errorMiddleware(error, request, response, next) {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return response.status(400).json({ success: false, message: 'File size exceeds the allowed limit.' });
  }
  response.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'Something went wrong',
  });
}