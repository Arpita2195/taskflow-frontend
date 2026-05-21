import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [form, setForm] = useState({ email: emailParam || 'arpita@demo.com', password: 'demo123' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      const dest = localStorage.getItem('pendingJoin');
      if (dest) {
        localStorage.removeItem('pendingJoin');
        navigate(dest);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute w-96 h-96 bg-accent rounded-full filter blur-[120px] opacity-15 -top-32 -left-32 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute w-80 h-80 bg-accent2 rounded-full filter blur-[100px] opacity-15 -bottom-20 -right-20 animate-[float_6s_ease-in-out_infinite_3s]" />

      <div className="relative z-10 bg-surface border border-main rounded-2xl p-10 w-full max-w-md shadow-2xl animate-[scaleIn_0.4s_ease]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xl">⚡</div>
          <span className="font-head text-2xl font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">TaskFlow</span>
        </div>

        <h2 className="font-head text-xl font-bold text-primary text-center mb-1">Welcome back</h2>
        <p className="text-sm text-secondary text-center mb-7">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent to-violet-500 text-white font-head font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-60 disabled:translate-y-0 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center text-xs text-secondary mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:text-accent/80 font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
