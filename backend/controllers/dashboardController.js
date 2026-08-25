import { getDashboardData } from '../models/dashboardModel.js';

export async function getDashboard(request, response, next) {
  try { response.json({ success: true, dashboard: await getDashboardData(request.user.id) }); } catch (error) { next(error); }
}