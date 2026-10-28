import { useBranch } from './BranchContext';
import { BrandLogo } from './Brand';

export default function BranchPicker() {
  const { branches, chooseBranch } = useBranch();

  return (
    <div className="login">
      <div className="card" style={{ maxWidth: 440, margin: '10vh auto', padding: 24 }}>
        <BrandLogo />
        <h2 className="login-title">Choose a shop branch</h2>
        <p>Select the branch you want to manage. You can switch branches any time.</p>
        {branches.map((b) => (
          <button
            key={b.id}
            className="primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => chooseBranch(b.id)}
          >
            {b.name}
          </button>
        ))}
        {!branches.length && <p className="note">No branches found.</p>}
      </div>
    </div>
  );
}