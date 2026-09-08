import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Allows logging in with email or username
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Column - Deep Blue Brand Banner */}
      <div className="hidden lg:flex w-1/2 bg-[#0A3D91] text-white flex-col justify-between p-16 relative">
        <div className="z-10">
          <div className="flex items-center space-x-2 text-white/90">
            <span className="font-bold text-sm tracking-wider uppercase">Audit Portal</span>
          </div>
        </div>

        <div className="my-auto z-10 max-w-sm mx-auto text-center space-y-6">
          {/* Replicate Clipboard Logo Graphic */}
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <img src={logoImg} alt="Logo" className="object-contain drop-shadow-md rounded-full bg-white/10 p-2 border border-white/20" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase">
              AUDIT APP
            </h2>
            <p className="text-xs text-white/60 mt-1 uppercase tracking-widest font-semibold">
              Streamline &bull; Upload &bull; Audit
            </p>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed max-w-xs mx-auto font-medium">
            Simplify academic audits with secure file uploads and smart management.
          </p>
        </div>

        <div className="z-10 text-[10px] text-white/40 text-center font-bold tracking-wide uppercase">
          &copy; 2026 Audit App. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-200/40 space-y-6">
          <div className="text-center">
            {/* Avatar Circle Icon */}
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-400">
              <User size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Login</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold">Login to access your dashboard</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start space-x-2 text-rose-700 text-xs font-semibold">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email ID</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold">
              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0A3D91] focus:ring-[#0A3D91]"
                />
                <span className="text-slate-400 font-bold">Remember me</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A3D91] hover:bg-[#082E6E] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0A3D91]/10 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">
            Secure and authorized access only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
