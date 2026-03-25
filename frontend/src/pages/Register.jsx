import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCompany } from '../api/client';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <form
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-glass backdrop-blur"
        onSubmit={onSubmit}
      >
        <p className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">LegalMind</p>
        <h2 className="text-2xl font-bold text-slate-900">Create Company Account</h2>
        <p className="text-sm text-slate-500">Register your organization to upload and manage legal documents.</p>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Company Name
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            type="password"
            placeholder="Enter provided secret key"
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            required
          />
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-sm text-slate-500">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
