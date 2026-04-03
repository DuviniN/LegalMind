import { Link } from 'react-router-dom';

function Navbar() {
	return (
		<header className="nav-shell glass-card rounded-2xl px-4 py-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200" aria-hidden="true">
						<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M7 3.75H14.5L18.25 7.5V20.25H7V3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
							<path d="M14.5 3.75V7.5H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
							<path d="M9.75 11.25H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M9.75 14.25H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</span>
					<div className="min-w-0">
						<h1 className="truncate font-display text-2xl font-extrabold tracking-wide text-cyan-200 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)] sm:text-3xl">
							LegalMind
						</h1>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/login"
						className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-white/10"
					>
						Sign In
					</Link>
					<Link
						to="/register"
						className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
					>
						Sign Up
					</Link>
				</div>
			</div>
		</header>
	);
}

export default Navbar;
