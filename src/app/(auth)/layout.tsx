export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell"><main id="contenido" className="narrow">{children}</main></div>;
}
