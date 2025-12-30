import React, { useState } from 'react';
import callApi from '../api';

const logoUrl = 'https://raw.githubusercontent.com/detroitpatil-creator/simply-finsure-assets/refs/heads/main/simply-finsure-logo.png';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@sf.com');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await callApi<{ success: boolean; message?: string; role?: string }>(
        '/login.php',
        'POST',
        { email, password }
      );

      if (!data.success) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      localStorage.setItem('userRole', data.role || 'user');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-[480px] animate-fade-in">
        <div className="mb-10 text-center">
          <img
            src={logoUrl}
            alt="Simply Finsure Logo"
            className="mx-auto mb-6 w-64 object-contain"
          />
        </div>

        <div className="bg-white p-10 rounded-[32px] shadow-card border border-slate-100">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-fade-in">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <p className="text-red-800 text-sm font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-slate-700 text-sm font-bold mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-slate-700 text-sm font-bold mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-4 flex items-center text-xl grayscale opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? '🫣' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="ml-3 text-sm text-slate-600 font-semibold group-hover:text-slate-900">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Protected by industry standard encryption. &copy; 2025 Simply Finsure.
        </p>
      </div>
    </div>
  );
};

export default Login;