import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCompany } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_58%,#f6fbff_100%)] text-slate-800">
      <div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
        <Navbar />

        <main className="relative grid h-full gap-3">
          <section className="grid min-h-[34rem] place-items-center rounded-2xl border border-blue-100 bg-white/85 p-6 shadow-[0_10px_24px_rgba(37,99,235,0.08)]">

            <form
              className="w-full max-w-md space-y-4 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
              onSubmit={onSubmit}
            >
              <p className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Legak Mind
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">Create Company Account</h2>
              <p className="text-sm text-slate-600">Register your organization to upload and manage legal documents.</p>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Company Name
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  type="text"
                  placeholder="Acme Legal Pvt Ltd"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Work Email
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  type="email"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Password
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  type="password"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Company Secret Key
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  type="password"
                  placeholder="Enter provided secret key"
                  value={secretKey}
                  onChange={(event) => setSecretKey(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-sm text-slate-600">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </section>
        </main>

        <Footer
          summary="Modern legal workspace for secure document collaboration."
          links={[
            { to: '/login', label: 'Portal' },
            { to: '/register', label: 'Join' },
          ]}
        />
      </div>
    </div>
  );
}

export default Register;
