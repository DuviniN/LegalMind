import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

function DocumentIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
		</svg>
	);
}

function ShieldIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
		</svg>
	);
}

function ChatIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
		</svg>
	);
}

function ChevronDownIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
		</svg>
	);
}

const navLinks = [
	{ href: '#features', label: 'Features' },
	{ href: '#workflow', label: 'How It Works' },
	{ href: '#governance', label: 'Governance' },
];

const capabilities = [
	{
		title: 'Controlled Document Intake',
		description: 'Collect and store official legal PDFs in a secure, structured workspace with a full upload history.',
		icon: <DocumentIcon />,
	},
	{
		title: 'Role-Based Access Control',
		description: 'Ensure managers and employees see only the workflows and documents assigned to their role.',
		icon: <ShieldIcon />,
	},
	{
		title: 'Operational Legal Assistant',
		description: 'Use AI chat to clarify clauses, obligations, and process-related legal questions in seconds.',
		icon: <ChatIcon />,
	},
];

const workflowSteps = [
	{
		step: '01',
		title: 'Authenticate',
		detail: 'Sign in to your organization workspace with secure, role-based access.',
	},
	{
		step: '02',
		title: 'Upload and Record',
		detail: 'Submit legal PDFs and keep an auditable history of every uploaded file.',
	},
	{
		step: '03',
		title: 'Review and Support',
		detail: 'Use the LegalMind chat assistant for rapid policy and document guidance.',
	},
];

const governanceChecks = [
	'Role-based permissions for managers and employees',
	'Centralized upload history for accountability and review',
	'Consistent handling of official legal document records',
	'Single workspace for operations and legal collaboration',
];

function Landing() {
	return (
		<div className="overflow-x-hidden">
			<header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
					<Link to="/" className="flex items-center gap-2.5">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white shadow-sm">
							LM
						</span>
						<span className="font-display text-lg font-bold tracking-wide text-white">LegalMind</span>
					</Link>

					<nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
						{navLinks.map((link) => (
							<a key={link.href} href={link.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
								{link.label}
							</a>
						))}
					</nav>

					<div className="flex items-center gap-2 sm:gap-3">
						<Link
							to="/login"
							className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:text-white sm:px-4"
						>
							Sign In
						</Link>
						<Link
							to="/register"
							className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 sm:px-4"
						>
							Get Started
						</Link>
					</div>
				</div>
			</header>

			<main>
				<section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 pt-20">
					<video
						className="absolute inset-0 h-full w-full object-cover"
						autoPlay
						muted
						loop
						playsInline
						preload="metadata"
						poster="/videos/hero-poster.jpg"
						aria-hidden="true"
					>
						<source src="/videos/hero-background.mp4" type="video/mp4" />
					</video>

					<div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950" />
					<div className="absolute inset-0 bg-gradient-to-tr from-blue-950/50 via-transparent to-purple-950/40" />

					<div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
						<p className="motion-safe:opacity-0 motion-safe:animate-[fade-in-up_0.7s_ease-out_0.05s_forwards] inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200 backdrop-blur">
							AI-Powered Legal Operations Platform
						</p>

						<h1 className="motion-safe:opacity-0 motion-safe:animate-[fade-in-up_0.7s_ease-out_0.2s_forwards] mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
							Run legal operations with{' '}
							<span className="bg-gradient-to-r from-blue-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
								AI-powered confidence
							</span>
						</h1>

						<p className="motion-safe:opacity-0 motion-safe:animate-[fade-in-up_0.7s_ease-out_0.35s_forwards] mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
							LegalMind brings secure document intake, role-based governance, and an intelligent legal assistant together in one workspace built for modern teams.
						</p>

						<div className="motion-safe:opacity-0 motion-safe:animate-[fade-in-up_0.7s_ease-out_0.5s_forwards] mt-10 flex flex-wrap items-center justify-center gap-4">
							<Link
								to="/register"
								className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.03] hover:shadow-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
							>
								Get Started
							</Link>
							<Link
								to="/chat"
								className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg shadow-black/10 transition hover:scale-[1.03] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
							>
								<ChatIcon />
								Chat with LegalMind
							</Link>
							<a
								href="#features"
								className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
							>
								Learn More
							</a>
						</div>
					</div>

					<a
						href="#features"
						aria-label="Scroll to features"
						className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-slate-400 transition hover:text-white motion-safe:animate-bounce"
					>
						<ChevronDownIcon />
					</a>
				</section>

				<section id="features" className="relative bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
					<div className="mx-auto max-w-6xl">
						<div className="mx-auto max-w-2xl text-center">
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Why LegalMind</p>
							<h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">Built for modern legal operations</h2>
							<p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
								Every document, permission, and conversation lives in one secure, auditable workspace.
							</p>
						</div>

						<div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{capabilities.map((feature) => (
								<article
									key={feature.title}
									className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
								>
									<span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
										{feature.icon}
									</span>
									<h3 className="mt-5 font-display text-xl font-semibold text-slate-900">{feature.title}</h3>
									<p className="mt-2 text-base leading-relaxed text-slate-600">{feature.description}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section id="workflow" className="bg-slate-900 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
					<div className="mx-auto max-w-6xl">
						<div className="mx-auto max-w-2xl text-center">
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">How It Works</p>
							<h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">From sign-in to support, in three steps</h2>
						</div>

						<div className="mt-14 grid gap-6 lg:grid-cols-3">
							{workflowSteps.map((item) => (
								<div key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
									<p className="font-display text-4xl font-bold text-blue-400">{item.step}</p>
									<h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
									<p className="mt-2 text-base leading-relaxed text-slate-300">{item.detail}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="governance" className="bg-gradient-to-b from-white to-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
					<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Governance &amp; Control</p>
							<h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">Designed for accountable legal teams</h2>
							<p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
								Every action is traceable and every permission is intentional, keeping managers and employees aligned with consistent, auditable workflows.
							</p>
						</div>

						<div className="grid gap-3">
							{governanceChecks.map((item) => (
								<div key={item} className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
									<CheckIcon />
									<p className="text-base text-slate-700">{item}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
					<div className="mx-auto max-w-3xl">
						<h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to modernize your legal workspace?</h2>
						<p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-50 sm:text-lg">
							Create your organization account and give your team a secure, structured home for legal operations.
						</p>
						<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
							<Link
								to="/register"
								className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
							>
								Create Account
							</Link>
							<Link
								to="/login"
								className="inline-flex items-center justify-center rounded-xl border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
							>
								Sign In
							</Link>
						</div>
					</div>
				</section>
			</main>

			<Footer
				summary="LegalMind enables secure legal document operations with clear governance, controlled access, and practical AI support for teams."
				links={[
					{ to: '/login', label: 'Sign In' },
					{ to: '/register', label: 'Register' },
					{ to: '/chat', label: 'Legal Chat' },
				]}
			/>
		</div>
	);
}

export default Landing;
