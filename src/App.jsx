import { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import Login from './Login';
import Reports from './Reports';
import { Overview, Products, Staff, Logins, Activity } from './Admin';
import { Dashboard, Shop, Today } from './Staff';
import { BrandLogo } from './Brand';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

function Shell({ role, links }) {
  const { user, logout } = useAuth();
  if (!user) return <Login requiredRole={role} />;
  if (user.role !== role) {
    return (
      <div className="login">
        <div className="card">
          <BrandLogo />
          <h2>Different account needed</h2>
          <p>You’re signed in as {user.role}. Sign out to use a {role} account.</p>
          <button className="primary" onClick={logout}>Sign out and switch account</button>
        </div>
      </div>
    );
  }
  return (
    <div className="shell">
      <aside>
        <BrandLogo />
        <nav>{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}</nav>
        <div className="who"><b>{user.full_name}</b><span>{user.email}</span><button onClick={logout}>Sign out</button></div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const login = (token, u) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.clear(); setUser(null); };
  return (
    <Ctx.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Shell role="admin" links={[['/admin', 'Overview', true], ['/admin/products', 'Products'], ['/admin/staff', 'Staff'], ['/admin/logins', 'Login activity'], ['/admin/activity', 'Activity & payments'], ['/admin/reports', 'Reports']]} />}>
          <Route index element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="staff" element={<Staff />} />
          <Route path="logins" element={<Logins />} />
          <Route path="activity" element={<Activity />} />
          <Route path="reports" element={<Reports admin />} />
        </Route>
        <Route path="/staff" element={<Shell role="staff" links={[['/staff', 'Dashboard', true], ['/staff/shop', 'Shop floor'], ['/staff/today', 'Today’s record'], ['/staff/reports', 'My reports']]} />}>
          <Route index element={<Dashboard />} />
          <Route path="shop" element={<Shop />} />
          <Route path="today" element={<Today />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Ctx.Provider>
  );
}
