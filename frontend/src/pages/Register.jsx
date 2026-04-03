import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCompany } from '../api/client';
import Navbar from '../components/Navbar';

function Register() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerCompany({
        company_name: companyName,
        email,
        password,
        secret_key: secretKey,
      });
      navigate('/login');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
        <Navbar />

        <main className="relative grid h-full gap-3">
          <section className="relative grid min-h-[34rem] place-items-center overflow-hidden rounded-2xl border border-white/20 bg-black">
            <img
              src="https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1800&q=80"
              alt="Professional legal institution background"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale brightness-[0.28]"
            />
            <div className="pointer-events-none absolute inset-0 opacity-85">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_52%)]" />
            </div>

            <form
              className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-white/25 bg-black/90 p-6 backdrop-blur"
              onSubmit={onSubmit}
            >
              <p className="inline-flex w-fit rounded-full border border-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
                Legak Mind
              </p>
              <h2 className="font-display text-2xl font-bold text-white">Create Company Account</h2>
              <p className="text-sm text-zinc-300">Register your organization to upload and manage legal documents.</p>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
                Company Name
                <input
                  className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
                  type="text"
                  placeholder="Acme Legal Pvt Ltd"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
                Work Email
                <input
                  className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
                  type="email"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
                Password
                <input
                  className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
                  type="password"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
                Company Secret Key
                <input
                  className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
                  type="password"
                  placeholder="Enter provided secret key"
                  value={secretKey}
                  onChange={(event) => setSecretKey(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-zinc-100">{error}</p> : null}

              <button
                className="w-full rounded-xl border-2 border-white bg-white px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-sm text-zinc-300">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </section>
        </main>

        <footer className="rounded-2xl border border-white/20 bg-black px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.1em] text-white">Legak Mind</p>
              <p className="mt-1 text-xs text-zinc-300">Modern legal workspace for secure document collaboration.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <Link to="/login" className="transition hover:text-white">
                Portal
              </Link>
              <Link to="/register" className="transition hover:text-white">
                Join
              </Link>
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-2 text-center text-[11px] text-zinc-500 sm:text-right">
            © {new Date().getFullYear()} Legak Mind. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Register;
