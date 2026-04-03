import { Link } from 'react-router-dom';

function Navbar() {
	return (
		<header className="rounded-2xl border border-white/20 bg-black px-4 py-3 sm:px-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="font-display text-2xl font-bold tracking-[0.08em] text-white sm:text-3xl">Legak Mind</h1>

				<div className="flex items-center gap-2 sm:gap-3">
					<Link
						to="/login"
						className="rounded-xl border border-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
					>
						Sign In
					</Link>
					<Link
						to="/register"
						className="rounded-xl border border-white bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black transition hover:bg-zinc-200"
					>
						Sign Up
					</Link>
				</div>
			</div>
		</header>
	);
}

export default Navbar;
