import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const keyPoints = [
	'Secure file upload for legal documents',
	'Role-based access for managers and employees',
	'Clear document status and history in one place',
	'Simple workflow designed for daily office use',
];

function Landing() {
	const hasToken = Boolean(localStorage.getItem('auth_token'));

	return (
		<div className="relative min-h-screen overflow-hidden bg-brand-ink text-slate-100">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.28),transparent_45%),radial-gradient(circle_at_82%_10%,rgba(23,37,84,0.36),transparent_40%)]" />

			<div className="relative grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-3">
				<Navbar />

				<main className="grid h-full gap-3">
					<section className="relative h-full min-h-[34rem] overflow-hidden rounded-2xl border border-blue-300/25 bg-[#071d43] shadow-[0_16px_34px_rgba(3,13,30,0.45)]">
						<img
							src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80"
							alt="Navy office background"
							className="absolute inset-0 h-full w-full object-cover blur-[10px] saturate-[65%] brightness-[0.45]"
						/>
						<div className="absolute inset-0 bg-[#031331]/60" />
						<div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/70" />

						<div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-start justify-center gap-4 rounded-2xl border border-blue-300/20 bg-[#04142f]/72 px-5 py-10 sm:px-8">
							<p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-white">
								LegalMind
							</p>
							<h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
								<span className="text-white">Secure Legal</span>{' '}
								<span className="text-white">Document Upload</span>{' '}
								<span className="font-extrabold text-red-300" style={{ color: '#fca5a5' }}>and Management Workspace</span>
							</h2>
							<p className="max-w-2xl text-sm text-slate-100 sm:text-base">
								Upload, organize, and manage legal documents in one clean platform built for managers and authorized employees.
							</p>

							<ul className="grid gap-2 sm:grid-cols-2">
								{keyPoints.map((item, index) => (
									<li
										key={item}
										className={`rounded-lg border px-3 py-2 text-sm text-white ${
											index === 0
												? 'border-cyan-300/45 bg-cyan-900/60'
												: index === 1
													? 'border-blue-300/45 bg-blue-900/60'
													: index === 2
														? 'border-indigo-300/45 bg-indigo-900/60'
														: 'border-slate-300/35 bg-slate-900/70'
										}`}
									>
										{item}
									</li>
								))}
							</ul>

							<div className="flex flex-wrap gap-2">
								<Link
									to="/register"
									className="rounded-xl border border-black bg-black px-6 py-3 text-sm font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(2,6,23,0.45)] transition hover:bg-black/90"
									style={{ backgroundColor: '#000000', color: '#ffffff' }}
								>
									Get Started
								</Link>
								<Link
									to={hasToken ? '/documents' : '/login'}
									className="rounded-xl border border-blue-300/45 bg-blue-950/65 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900/70"
								>
									{hasToken ? 'Open Upload Desk' : 'Sign In'}
								</Link>
							</div>

							<div className="grid w-full max-w-2xl gap-2 border-t border-white/20 pt-3 text-xs text-slate-200 sm:grid-cols-3">
								<p className="rounded-md border border-cyan-300/35 bg-cyan-900/55 px-3 py-2 text-center">Encrypted Uploads</p>
								<p className="rounded-md border border-blue-300/35 bg-blue-900/55 px-3 py-2 text-center">Team Access</p>
								<p className="rounded-md border border-indigo-300/35 bg-indigo-900/55 px-3 py-2 text-center">Centralized Records</p>
							</div>
						</div>
					</section>
				</main>

				<footer className="rounded-2xl border border-blue-300/25 bg-blue-950/55 px-4 py-3 backdrop-blur-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-display text-sm font-semibold tracking-wide text-cyan-100">LegalMind</p>
							<p className="mt-1 text-xs text-slate-200">Secure file upload workspace for legal teams.</p>
						</div>

					
					</div>

					<div className="mt-3 border-t border-white/10 pt-2 text-center text-[11px] text-slate-400 sm:text-right">
						© {new Date().getFullYear()} LegalMind. All rights reserved.
					</div>
				</footer>
			</div>
		</div>
	);
}

export default Landing;
