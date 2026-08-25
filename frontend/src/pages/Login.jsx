import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(form); navigate(location.state?.from?.pathname || '/dashboard', { replace: true }); }
    catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }
  return <main className="p-4" style={{ maxWidth: 480, margin: '4rem auto' }}><h1>Log in</h1><p className="text-muted">Continue to StudentDrive.</p>{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}><label className="form-label" htmlFor="email">Email</label><input id="email" className="form-control mb-3" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><label className="form-label" htmlFor="password">Password</label><input id="password" className="form-control mb-3" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button className="btn btn-primary" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button></form><p className="mt-3">New to StudentDrive? <Link to="/register">Create an account</Link></p></main>;
}
export default Login;