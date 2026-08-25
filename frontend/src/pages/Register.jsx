import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  async function submit(event) { event.preventDefault(); setError(''); setSubmitting(true); try { await register(form); navigate('/dashboard', { replace: true }); } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); } }
  return <main className="p-4" style={{ maxWidth: 480, margin: '4rem auto' }}><h1>Create account</h1><p className="text-muted">Set up your StudentDrive account.</p>{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}><label className="form-label" htmlFor="name">Name</label><input id="name" className="form-control mb-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><label className="form-label" htmlFor="email">Email</label><input id="email" className="form-control mb-3" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><label className="form-label" htmlFor="password">Password</label><input id="password" className="form-control mb-3" type="password" minLength="8" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button></form><p className="mt-3">Already registered? <Link to="/login">Log in</Link></p></main>;
}
export default Register;