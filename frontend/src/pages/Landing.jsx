import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const decorativePhotos = [
	{
		src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
		alt: 'Contract papers on office desk',
		className: 'left-2 top-4 z-[1] w-24 sm:w-28 lg:w-32 photo-float',
	},
	{
		src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80',
		alt: 'Legal team meeting and review',
		className: 'left-[14%] top-8 z-[1] w-24 sm:w-28 lg:w-32 photo-float-delay',
	},
	{
		src: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
		alt: 'Compliance files and office laptop',
		className: 'left-2 bottom-4 z-[1] w-24 sm:w-28 lg:w-32 photo-float-reverse',
	},
	{
		src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
		alt: 'Office strategy board and notes',
		className: 'left-[14%] bottom-8 z-[1] w-24 sm:w-28 lg:w-32 photo-float-delay',
	},
	{
		src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
		alt: 'Modern legal workspace center view',
		className: 'left-[7%] top-1/2 z-[2] w-28 -translate-y-1/2 sm:w-36 lg:w-40 photo-float',
	},
	{
		src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80',
		alt: 'Attorney consultation at desk',
		className: 'right-2 top-4 z-[1] w-24 sm:w-28 lg:w-32 photo-float-reverse',
	},
	{
		src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
		alt: 'Law library and records shelves',
		className: 'right-[14%] top-8 z-[1] w-24 sm:w-28 lg:w-32 photo-float',
	},
	{
		src: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=900&q=80',
		alt: 'Business handshake for agreement',
		className: 'right-2 bottom-4 z-[1] w-24 sm:w-28 lg:w-32 photo-float-delay',
	},
	{
		src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
		alt: 'Case file preparation in office',
		className: 'right-[14%] bottom-8 z-[1] w-24 sm:w-28 lg:w-32 photo-float',
	},
	{
		src: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=900&q=80',
		alt: 'Courtroom gavel and legal decision scene',
		className: 'right-[7%] top-1/2 z-[2] w-28 -translate-y-1/2 sm:w-36 lg:w-40 photo-float-reverse',
	},
];

function Landing() {
	return (
		<div className="min-h-screen bg-black text-white">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
				<Navbar />

				<main className="relative grid h-full gap-3">
					<section className="relative grid h-full min-h-[34rem] place-items-center overflow-hidden rounded-2xl border border-white/20 bg-black">
						<div className="pointer-events-none absolute inset-0 opacity-85">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_52%)]" />
							{decorativePhotos.map((photo, index) => (
								<img
									key={`${photo.src}-${index}`}
									src={photo.src}
									alt={photo.alt}
									className={`absolute rounded-2xl border border-white/35 object-cover grayscale brightness-125 contrast-150 shadow-[0_14px_30px_rgba(255,255,255,0.2)] ${photo.className}`}
								/>
							))}
						</div>

						<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-10 text-center">
							<p className="rounded-full border border-white/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200">
								Secure Legal Workspace
							</p>
							<h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
								Upload. Organize. Chat.
							</h2>
							<p className="max-w-2xl text-sm text-zinc-300 sm:text-base">
								Built for managers and authorized employees to handle legal files in one clear and trusted place.
							</p>

							<Link
								to="/chat"
								className="rounded-2xl border-2 border-white bg-white px-10 py-5 text-lg font-extrabold uppercase tracking-[0.14em] text-black shadow-[0_16px_40px_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-zinc-100 sm:px-14 sm:py-6 sm:text-2xl"
							>
								Chat With LegalMind
							</Link>

							<p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
								Fast access. Strong privacy. Team-ready workflows.
							</p>
						</div>
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

export default Landing;
