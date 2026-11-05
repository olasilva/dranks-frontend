import { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import Login from './Login';
import Reports from './Reports';
import { Overview, Products, Staff, Logins, Activity } from './Admin';
import { Dashboard, Shop, Today } from './Staff';
import Orders from './Orders';
import { BrandLogo } from './Brand';
import { BranchProvider, useBranch } from './BranchContext';
import BranchPicker from './BranchPicker';
import { BranchAdmin } from './branches';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

function Shell({ role, links }) {
  const { user, logout } = useAuth();
  const { branchId, activeBranch, clearBranch } = useBranch();

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

  // If admin hasn't selected a branch yet, show the Picker
  if (user.role === 'admin' && !branchId) {
    return <BranchPicker />;
  }

  return (
    <div className="shell">
      <aside>
        <BrandLogo />
        
        {/* Show the active branch name in the sidebar */}
        {activeBranch && (
          <div style={{ padding: '0 16px', marginBottom: 16 }}>
            <span className="pill approved" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              {activeBranch.name}
            </span>
          </div>
        )}

        <nav>{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}</nav>
        
        <div className="who">
          <b>{user.full_name}</b>
          <span>{user.email}</span>
          {/* Allow admin to switch branches */}
          {user.role === 'admin' && (
            <button onClick={clearBranch} style={{ marginBottom: '8px' }}>Switch Branch</button>
          )}
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  
  const login = (token, u) => { 
    localStorage.setItem('token', token); 
    localStorage.setItem('user', JSON.stringify(u)); 
    setUser(u); 
  };
  
  const logout = () => { 
    localStorage.clear(); 
    setUser(null); 
  };

  return (
    <Ctx.Provider value={{ user, login, logout }}>
      <BranchProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <Shell 
              role="admin" 
              links={[
                ['/admin', 'Overview', true], 
                ['/admin/products', 'Products'], 
                ['/admin/staff', 'Staff'], 
                ['/admin/branches', 'Branches'], // <-- NEW LINK
                ['/admin/logins', 'Login activity'], 
                ['/admin/activity', 'Activity & payments'], 
                ['/admin/orders', 'Customer orders'],
                ['/admin/reports', 'Reports']
              ]} 
            />
          }>
            <Route index element={<Overview />} />
            <Route path="products" element={<Products />} />
            <Route path="staff" element={<Staff />} />
            <Route path="branches" element={<BranchAdmin />} /> {/* <-- NEW ROUTE */}
            <Route path="logins" element={<Logins />} />
            <Route path="activity" element={<Activity />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reports" element={<Reports admin />} />
          </Route>

          <Route path="/staff" element={
            <Shell 
              role="staff" 
              links={[
                ['/staff', 'Dashboard', true], 
                ['/staff/orders', 'Incoming orders'],
                ['/staff/shop', 'Shop floor'], 
                ['/staff/today', 'Today’s record'], 
                ['/staff/reports', 'My reports']
              ]} 
            />
          }>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="shop" element={<Shop />} />
            <Route path="today" element={<Today />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BranchProvider>
    </Ctx.Provider>
  );
}