import { Link, useNavigate } from 'react-router-dom';

function Navbar({
	showSignIn = true,
	showSignUp = true,
	showHome = false,
	onLogout,
	showBannerImage = false,
	bannerImageUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80',
	bannerImageAlt = 'Legal office desk with documents and gavel',
}) {
	const navigate = useNavigate();
	const token = localStorage.getItem('auth_token');
	const isAuthenticated = Boolean(token);
	const companyName = (localStorage.getItem('company_name') || 'Profile').trim();
	const profileInitial = (companyName.charAt(0) || 'P').toUpperCase();
	const homeRoute = isAuthenticated ? '/admin-dashboard' : '/';

	const baseActionClass =
		'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';
	const secondaryActionClass =
		`${baseActionClass} border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`;
	const primaryActionClass =
		`${baseActionClass} border border-blue-600 bg-blue-600 font-bold text-white hover:bg-blue-700`;
	const logoutActionClass =
		`${baseActionClass} border border-slate-300 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700`;

	const handleLogout = () => {
		if (onLogout) {
			onLogout();
			return;
		}
		localStorage.removeItem('auth_token');
		localStorage.removeItem('company_name');
		localStorage.removeItem('user_role');
		navigate('/');
	};

	return (
		<header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/95 backdrop-blur">
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
			<div className="px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link to={homeRoute} className="group inline-flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-sm font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm transition group-hover:border-blue-300">
							LM
						</span>
						<span className="min-w-0">
							<span className="block font-display text-xl font-bold tracking-[0.06em] text-slate-900 sm:text-2xl">LegalMind</span>
							<span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Legal Operations Workspace</span>
						</span>
					</Link>

					<nav className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Primary navigation">
					{isAuthenticated ? (
						<div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-sm font-bold text-blue-700">
								{profileInitial}
							</span>
							<span className="hidden max-w-[9rem] truncate text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 sm:block">
								{companyName}
							</span>
						</div>
					) : null}

					

					{showSignIn && !isAuthenticated ? (
						<Link
							to="/login"
							className={secondaryActionClass}
						>
							Sign In
						</Link>
					) : null}

					{showSignUp && !isAuthenticated ? (
						<Link
							to="/register"
							className={primaryActionClass}
						>
							Sign Up
						</Link>
					) : null}

					{isAuthenticated ? (
						<button
							type="button"
							onClick={handleLogout}
							className={logoutActionClass}
						>
							Logout
						</button>
					) : null}
					</nav>
				</div>

				{showBannerImage ? (
					<div className="mt-3 border-t border-blue-100 pt-3">
						<img
							src={bannerImageUrl}
							alt={bannerImageAlt}
							className="h-32 w-full rounded-xl border border-blue-100 object-cover shadow-[0_8px_22px_rgba(37,99,235,0.14)] sm:h-40 lg:h-44"
						/>
					</div>
				) : null}
			</div>
		</header>
	);
}

export default Navbar;
