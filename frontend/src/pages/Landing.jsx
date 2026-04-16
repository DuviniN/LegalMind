import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const capabilities = [
	{
		title: 'Controlled Document Intake',
		description: 'Collect and store official legal PDFs in a secure and structured workspace.',
	},
	{
		title: 'Role-Based Access Control',
		description: 'Ensure managers and employees see only the workflows assigned to their role.',
	},
	{
		title: 'Operational Legal Assistant',
		description: 'Use AI chat to clarify clauses, obligations, and process-related legal questions.',
	},
];

const governanceChecks = [
	'Role-based permissions for managers and employees',
	'Centralized upload history for accountability and review',
	'Consistent handling of official legal document records',
	'Single workspace for operations and legal collaboration',
];

const workflowSteps = [
	{
		step: '01',
		title: 'Authenticate',
		detail: 'Sign in to your organization workspace with role-based access.',
	},
	{
		step: '02',
		title: 'Upload and Record',
		detail: 'Submit legal PDFs and keep an auditable history of uploaded files.',
	},
	{
		step: '03',
		title: 'Review and Support',
		detail: 'Use LegalMind chat for rapid policy and document guidance.',
	},
];

const landingBackgroundImage = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1920&q=80';
const landingBannerImage = 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1920&q=80';

function Landing() {
	const token = localStorage.getItem('auth_token');
	const chatRoute = token ? '/chat' : '/login';

	return (
		<div
			className="min-h-screen bg-cover bg-center bg-no-repeat text-slate-800"
			style={{
				backgroundImage: `linear-gradient(180deg, rgba(248,251,255,0.92) 0%, rgba(238,245,255,0.9) 56%, rgba(246,251,255,0.93) 100%), url('${landingBackgroundImage}')`,
			}}
		>
			<div className="grid min-h-screen w-full grid-rows-[auto_auto_1fr_auto] gap-0 px-4 py-4 lg:px-6 lg:py-6">
				<Navbar />

				<section className="border-x border-b border-blue-100 bg-white/92 px-4 pb-0 backdrop-blur-sm sm:px-6 lg:px-8">
					<img
						src={landingBannerImage}
						alt="Legal professionals reviewing official documents in office"
						className="h-36 w-full rounded-b-2xl border border-blue-100 object-cover shadow-[0_8px_22px_rgba(37,99,235,0.14)] sm:h-44 lg:h-52"
					/>
				</section>

				<main className="grid h-full w-full gap-4">
					<section className="min-h-[64vh] rounded-2xl border border-blue-100 bg-white/92 p-7 shadow-[0_12px_32px_rgba(37,99,235,0.08)] backdrop-blur-sm sm:p-10">
						<div className="grid h-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
							<div>
								<p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
									Enterprise Legal Operations Platform
								</p>
								<h2 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-[3.2rem]">
									Official legal document management for
									<span className="text-blue-700"> structured teams</span>
								</h2>
								<p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
									LegalMind provides a single professional workspace for secure PDF uploads, governed access, and fast legal support for daily operations.
								</p>

								<div className="mt-6 flex flex-wrap gap-3">
									<Link
										to="/login"
										className="rounded-xl border border-blue-600 bg-blue-600 px-7 py-3 text-base font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
									>
										Access Workspace
									</Link>
									<Link
										to={chatRoute}
										className="rounded-xl border border-blue-300 bg-white px-7 py-3 text-base font-semibold uppercase tracking-[0.12em] text-blue-700 transition hover:bg-blue-50"
									>
										Open Legal Chat
									</Link>
								</div>

								<div className="mt-6 grid gap-2 text-sm uppercase tracking-[0.12em] text-slate-600 sm:grid-cols-3">
									<p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-center">Secure Upload Control</p>
									<p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-center">Auditable File History</p>
									<p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-center">Role-Aligned Workflows</p>
								</div>
							</div>

							<aside className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6">
								<p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">Operational Snapshot</p>
								<div className="mt-4 grid gap-3">
									<div className="rounded-xl border border-blue-100 bg-white px-4 py-3.5">
										<p className="text-sm uppercase tracking-[0.12em] text-slate-500">Workspace Model</p>
										<p className="mt-1 text-base font-semibold text-slate-900">Manager + Employee Access Layers</p>
									</div>
									<div className="rounded-xl border border-blue-100 bg-white px-4 py-3.5">
										<p className="text-sm uppercase tracking-[0.12em] text-slate-500">Primary Records</p>
										<p className="mt-1 text-base font-semibold text-slate-900">Official PDFs with Upload History</p>
									</div>
									<div className="rounded-xl border border-blue-100 bg-white px-4 py-3.5">
										<p className="text-sm uppercase tracking-[0.12em] text-slate-500">Support Channel</p>
										<p className="mt-1 text-base font-semibold text-slate-900">Integrated LegalMind AI Assistant</p>
									</div>
								</div>
							</aside>
						</div>
					</section>

					<section className="grid gap-4 md:grid-cols-3">
						{capabilities.map((feature) => (
							<article key={feature.title} className="rounded-2xl border border-blue-100 bg-white/92 p-6 shadow-[0_8px_20px_rgba(37,99,235,0.06)] backdrop-blur-sm">
								<h3 className="font-display text-xl font-semibold text-slate-900">{feature.title}</h3>
								<p className="mt-2 text-base leading-relaxed text-slate-600">{feature.description}</p>
							</article>
						))}
					</section>

					<section className="grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-blue-100 bg-white/92 p-7 shadow-[0_10px_24px_rgba(37,99,235,0.08)] backdrop-blur-sm">
							<h3 className="font-display text-3xl font-bold text-slate-900">Governance and Control</h3>
							<p className="mt-3 text-base leading-relaxed text-slate-600">
								Designed for organizations that require consistency, visibility, and accountable legal document handling.
							</p>
							<div className="mt-4 grid gap-2">
								{governanceChecks.map((item) => (
									<p key={item} className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-base text-slate-700">
										{item}
									</p>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-blue-100 bg-white/92 p-7 shadow-[0_10px_24px_rgba(37,99,235,0.08)] backdrop-blur-sm">
							<h3 className="font-display text-3xl font-bold text-slate-900">Standard Workflow</h3>
							<p className="mt-3 text-base leading-relaxed text-slate-600">
								A simple process that keeps legal operations clear for both management and staff.
							</p>
							<div className="mt-4 grid gap-3">
								{workflowSteps.map((item) => (
									<div key={item.step} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
										<p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Step {item.step}</p>
										<p className="mt-1 text-base font-semibold text-slate-900">{item.title}</p>
										<p className="mt-1 text-base text-slate-600">{item.detail}</p>
									</div>
								))}
							</div>
						</div>
					</section>

					<section className="rounded-2xl border border-blue-100 bg-white/92 p-7 text-center shadow-[0_10px_24px_rgba(37,99,235,0.08)] backdrop-blur-sm sm:p-10">
						<p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">Ready to Operate</p>
						<h3 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">Start with a professional legal workspace</h3>
						<p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
							Centralize legal document workflows, maintain clear ownership, and support teams with reliable legal assistance.
						</p>
						<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
							<Link
								to="/register"
								className="rounded-xl border border-blue-600 bg-blue-600 px-7 py-3 text-base font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
							>
								Create Organization Account
							</Link>
							<Link
								to="/login"
								className="rounded-xl border border-blue-300 bg-white px-7 py-3 text-base font-semibold uppercase tracking-[0.12em] text-blue-700 transition hover:bg-blue-50"
							>
								Sign In
							</Link>
						</div>
					</section>
				</main>

				<div className="mt-4">
					<Footer
						summary="LegalMind enables secure legal document operations with clear governance, controlled access, and practical AI support for teams."
						links={[
							{ to: '/login', label: 'Sign In' },
							{ to: '/register', label: 'Register' },
							{ to: chatRoute, label: 'Legal Chat' },
						]}
					/>
				</div>
			</div>
		</div>
	);
}

export default Landing;
