const LOGO_PATH = '/ranktel.png';

export function BrandLogo() {
  return <div className="brand"><img src={LOGO_PATH} alt="Ranktel" /></div>;
}

export function BrandLoader({ label = 'Loading...' }) {
  return <div className="brand-loader" role="status"><img src={LOGO_PATH} alt="" /><span>{label}</span></div>;
}