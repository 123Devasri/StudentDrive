export function notImplemented(request, response) {
  response.status(501).json({ success: false, message: 'This endpoint is not implemented yet' });
}