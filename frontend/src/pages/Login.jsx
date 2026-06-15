import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCompany } from '../api/client';

function MailIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
			<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
		</svg>
	);
}

function LockIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
			<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
		</svg>
	);
}

const highlights = [
	'Role-based access for managers and employees',
	'Centralized, auditable upload history',
	'AI legal assistant built into every workspace',
];

function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const onSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError('');

		try {
			const data = await loginCompany({ email, password });
			localStorage.setItem('auth_token', data.token);
			localStorage.setItem('company_name', data.company.company_name || '');
			localStorage.setItem('user_role', 'manager');
			navigate('/admin-dashboard');
		} catch (requestError) {
			setError(requestError?.response?.data?.detail || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen bg-white">
			<div className="relative hidden w-1/2 lg:block">
				<img src="/images/auth-login.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
				<div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/55 to-slate-950/90" />
				<div className="absolute inset-0 bg-gradient-to-tr from-blue-950/50 via-transparent to-purple-950/40" />

				<div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-14">
					<Link to="/" className="flex items-center gap-2.5">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
							LM
						</span>
						<span className="font-display text-lg font-bold tracking-wide text-white">LegalMind</span>
					</Link>

					<div className="max-w-md">
						<p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200 backdrop-blur">
							Enterprise Legal Operations
						</p>
						<h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
							Welcome back to your legal workspace
						</h2>
						<p className="mt-3 text-base leading-relaxed text-slate-300">
							Sign in to manage document uploads, monitor governance, and support your team with the LegalMind AI assistant.
						</p>

						<ul className="mt-6 grid gap-3">
							{highlights.map((item) => (
								<li key={item} className="flex items-start gap-3 text-sm text-slate-200">
									<CheckIcon />
									{item}
								</li>
							))}
						</ul>
					</div>

					<p className="text-xs uppercase tracking-[0.14em] text-slate-400">
						&copy; {new Date().getFullYear()} LegalMind. All rights reserved.
					</p>
				</div>
			</div>

			<div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
				<div className="mx-auto w-full max-w-md">
					<Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
							LM
						</span>
						<span className="font-display text-lg font-bold tracking-wide text-slate-900">LegalMind</span>
					</Link>

					<p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
						Sign In
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold text-slate-900">Welcome back</h2>
					<p className="mt-2 text-sm text-slate-500">Enter your work email and password to continue.</p>

					<form className="mt-8 space-y-5" onSubmit={onSubmit}>
						<label className="block text-sm font-medium text-slate-700">
							Work Email
							<div className="relative mt-1.5">
								<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
									<MailIcon />
								</span>
								<input
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									type="email"
									placeholder="owner@company.com"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
								/>
							</div>
						</label>

						<label className="block text-sm font-medium text-slate-700">
							Password
							<div className="relative mt-1.5">
								<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
									<LockIcon />
								</span>
								<input
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									type="password"
									placeholder="Enter password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
								/>
							</div>
						</label>

						{error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p> : null}

						<button
							className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.01] hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
							type="submit"
							disabled={loading}
						>
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
					</form>

					<p className="mt-6 text-center text-sm text-slate-500">
						No account?{' '}
						<Link to="/register" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
							Create account
						</Link>
					</p>
					<p className="mt-2 text-center text-sm text-slate-500">
						Just want to ask a question?{' '}
						<Link to="/chat" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
							Chat with LegalMind
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default Login;
