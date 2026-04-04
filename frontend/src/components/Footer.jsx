import { Link } from 'react-router-dom';

function Footer({
	summary = 'Modern legal workspace for secure document collaboration.',
	links = [
		{ to: '/documents', label: 'Workspace' },
		{ to: '/chat', label: 'Chat Assistant' },
	],
}) {
	return (
		<footer className="relative border-t border-blue-100 bg-white/92 px-4 py-5 backdrop-blur sm:px-6">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
			<div className="grid gap-5 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-6">
				<div>
					<p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-blue-800">Legak Mind</p>
					<p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-600">{summary}</p>
				</div>

				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
					<div className="mt-2 grid gap-1.5 text-xs text-slate-600">
						{links.map((item) => (
							<Link key={`${item.to}-${item.label}`} to={item.to} className="transition hover:text-blue-700">
								{item.label}
							</Link>
						))}
					</div>
				</div>

				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Platform</p>
					<p className="mt-2 text-xs leading-relaxed text-slate-600">
						Document workflows are secured with controlled access for authorized teams.
					</p>
				</div>
			</div>

			<div className="mt-4 border-t border-blue-100 pt-3 text-center text-[11px] uppercase tracking-[0.12em] text-slate-500 sm:text-right">
				© {new Date().getFullYear()} Legak Mind. All rights reserved.
			</div>
		</footer>
	);
}

export default Footer;
