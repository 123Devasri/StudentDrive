export function notFoundMiddleware(request, response) {
  response.status(404).json({ success: false, message: 'Route not found' });
}

export function errorMiddleware(error, request, response, next) {
  console.error(error);
  response.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'Something went wrong',
  });
}