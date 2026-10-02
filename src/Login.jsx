import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './App';
import { BrandLogo } from './Brand';

export default function Login({ requiredRole }) {
  const { user, login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const d = await api('/auth/login', { method: 'POST', body: f });
      if (requiredRole && d.user.role !== requiredRole) {
        setErr(`This account does not have ${requiredRole} access.`);
        setBusy(false);
        return;
      }
      login(d.token, d.user);
    }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="login">
      <form onSubmit={submit}>
        <BrandLogo />
        <h2 className="login-title">{requiredRole ? `${requiredRole[0].toUpperCase()}${requiredRole.slice(1)} login` : 'Sign in'}</h2>
        <p>{requiredRole ? `Sign in to your ${requiredRole} account.` : 'Sign in with the details your admin gave you.'}</p>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password
          <span className="password-input">
            <input type={showPassword ? 'text' : 'password'} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            {requiredRole === 'admin' && <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>}
          </span>
        </label>
        {err && <div className="err">{err}</div>}
        <button className="primary" disabled={busy}>
          {busy ? <span className="login-loading"><img src="/dranks.jpg" alt="" /> Signing in...</span> : requiredRole ? `Sign in as ${requiredRole}` : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
