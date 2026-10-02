const LOGO_PATH = '/dranks.jpg';

export function BrandLogo() {
  return <div className="brand"><img src={LOGO_PATH} alt="Dranks" /></div>;
}

export function BrandLoader({ label = 'Loading...' }) {
  return <div className="brand-loader" role="status"><img src={LOGO_PATH} alt="" /><span>{label}</span></div>;
}