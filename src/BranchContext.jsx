import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { useAuth } from './App';

const BranchCtx = createContext(null);

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchIdState] = useState(() => {
    const saved = localStorage.getItem('activeBranchId');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      api('/branches').then(setBranches).catch(() => setBranches([]));
    } else {
      setBranchIdState(user.branch_id ?? null);
      setBranches(
        user.branch_id
          ? [{ id: user.branch_id, name: user.branch_name || `Branch #${user.branch_id}` }]
          : []
      );
      if (user.branch_id) {
        localStorage.setItem('activeBranchId', String(user.branch_id));
      }
    }
  }, [user]);

  const chooseBranch = useCallback((id) => {
    setBranchIdState(id);
    localStorage.setItem('activeBranchId', String(id));
  }, []);

  const clearBranch = useCallback(() => {
    setBranchIdState(null);
    localStorage.removeItem('activeBranchId');
  }, []);

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId]
  );

  return (
    <BranchCtx.Provider
      value={{ branches, branchId, activeBranch, chooseBranch, clearBranch }}
    >
      {children}
    </BranchCtx.Provider>
  );
}

export const useBranch = () => useContext(BranchCtx);