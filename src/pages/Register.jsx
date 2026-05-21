import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [form, setForm] = useState({ name: '', email: emailParam, password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created!');
      const dest = localStorage.getItem('pendingJoin');
      if (dest) {
        localStorage.removeItem('pendingJoin');
        navigate(dest);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-accent3 rounded-full filter blur-[120px] opacity-10 -top-32 -right-32 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute w-80 h-80 bg-accent rounded-full filter blur-[100px] opacity-10 -bottom-20 -left-20 animate-[float_6s_ease-in-out_infinite_2s]" />

      <div className="relative z-10 bg-surface border border-main rounded-2xl p-10 w-full max-w-md shadow-2xl animate-[scaleIn_0.4s_ease]">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xl">⚡</div>
          <span className="font-head text-2xl font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">TaskFlow</span>
        </div>

        <h2 className="font-head text-xl font-bold text-primary text-center mb-1">Create account</h2>
        <p className="text-sm text-secondary text-center mb-7">Join your team on TaskFlow</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@company.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-secondary mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent to-violet-500 text-white font-head font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating...' : 'Create Account →'}
          </button>
        </form>

        <p className="text-center text-xs text-secondary mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent/80 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
