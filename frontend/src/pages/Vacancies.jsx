import { useEffect, useState } from 'react';
import { applyToVacancy, getOpenVacancies } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function BriefcaseIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-4.25m16.5 0a2.25 2.25 0 0 0-1.07-1.916l-7.5-4.615a2.25 2.25 0 0 0-2.36 0l-7.5 4.615A2.25 2.25 0 0 0 3.75 14.15m16.5 0v-1.5a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5M9 11.25v-.75a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v.75" />
		</svg>
	);
}

function LocationIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
			<path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
			<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
		</svg>
	);
}

const EMPTY_FORM = { candidate_name: '', candidate_email: '', candidate_phone: '', file: null };

function formatEmploymentType(value) {
	if (!value) return '-';
	return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function Vacancies() {
	const [vacancies, setVacancies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [expandedId, setExpandedId] = useState(null);
	const [forms, setForms] = useState({});
	const [statuses, setStatuses] = useState({});
	const [submitting, setSubmitting] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await getOpenVacancies();
				setVacancies(Array.isArray(data?.vacancies) ? data.vacancies : []);
			} catch (error) {
				setLoadError(error?.response?.data?.detail || 'Failed to load vacancies');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const toggleExpanded = (vacancyId) => {
		setExpandedId((current) => (current === vacancyId ? null : vacancyId));
	};

	const updateForm = (vacancyId, field, value) => {
		setForms((current) => ({
			...current,
			[vacancyId]: { ...EMPTY_FORM, ...current[vacancyId], [field]: value },
		}));
	};

	const handleApply = async (event, vacancyId) => {
		event.preventDefault();
		const form = forms[vacancyId] || EMPTY_FORM;
		if (!form.file) {
			setStatuses((current) => ({ ...current, [vacancyId]: { type: 'error', message: 'Please attach your CV as a PDF file.' } }));
			return;
		}

		setSubmitting(vacancyId);
		setStatuses((current) => ({ ...current, [vacancyId]: null }));
		try {
			await applyToVacancy(vacancyId, form);
			setStatuses((current) => ({ ...current, [vacancyId]: { type: 'success', message: 'Application submitted successfully!' } }));
			setForms((current) => ({ ...current, [vacancyId]: EMPTY_FORM }));
		} catch (error) {
			setStatuses((current) => ({
				...current,
				[vacancyId]: { type: 'error', message: error?.response?.data?.detail || 'Failed to submit application' },
			}));
		} finally {
			setSubmitting(null);
		}
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_58%,#f6fbff_100%)] text-slate-800">
			<Navbar showHome />

			<main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="text-center">
					<p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
						Careers
					</p>
					<h1 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">Open Positions</h1>
					<p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
						Explore current openings and submit your CV directly. Our team reviews every application.
					</p>
				</div>

				{loading ? (
					<p className="mt-10 rounded-2xl border border-blue-100 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
						Loading vacancies...
					</p>
				) : loadError ? (
					<p className="mt-10 rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700 shadow-sm">
						{loadError}
					</p>
				) : vacancies.length === 0 ? (
					<p className="mt-10 rounded-2xl border border-blue-100 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
						No open positions right now. Please check back soon.
					</p>
				) : (
					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{vacancies.map((vacancy) => {
							const isExpanded = expandedId === vacancy.id;
							const form = forms[vacancy.id] || EMPTY_FORM;
							const status = statuses[vacancy.id];

							return (
								<article key={vacancy.id} className="flex flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
										<BriefcaseIcon />
									</span>
									<h2 className="mt-4 font-display text-lg font-bold text-slate-900">{vacancy.title}</h2>

									<div className="mt-2 flex flex-wrap gap-2">
										<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
											{vacancy.department}
										</span>
										<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
											{formatEmploymentType(vacancy.employment_type)}
										</span>
									</div>

									<p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
										<LocationIcon />
										{vacancy.location}
									</p>

									<p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{vacancy.description}</p>

									<button
										type="button"
										onClick={() => toggleExpanded(vacancy.id)}
										className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01]"
									>
										{isExpanded ? 'Close' : 'Apply Now'}
									</button>

									{isExpanded ? (
										<form className="mt-4 grid gap-3 border-t border-blue-100 pt-4" onSubmit={(event) => handleApply(event, vacancy.id)}>
											<label className="block text-sm font-medium text-slate-700">
												Full Name
												<input
													className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
													type="text"
													value={form.candidate_name}
													onChange={(event) => updateForm(vacancy.id, 'candidate_name', event.target.value)}
													required
												/>
											</label>

											<label className="block text-sm font-medium text-slate-700">
												Email
												<input
													className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
													type="email"
													value={form.candidate_email}
													onChange={(event) => updateForm(vacancy.id, 'candidate_email', event.target.value)}
													required
												/>
											</label>

											<label className="block text-sm font-medium text-slate-700">
												Phone (optional)
												<input
													className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
													type="tel"
													value={form.candidate_phone}
													onChange={(event) => updateForm(vacancy.id, 'candidate_phone', event.target.value)}
												/>
											</label>

											<label className="block text-sm font-medium text-slate-700">
												Upload CV (PDF)
												<input
													className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-md file:border file:border-blue-300 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
													type="file"
													accept="application/pdf,.pdf"
													onChange={(event) => updateForm(vacancy.id, 'file', event.target.files?.[0] || null)}
													required
												/>
											</label>

											{status ? (
												<p
													className={`rounded-xl border px-3.5 py-2.5 text-sm ${
														status.type === 'success'
															? 'border-green-100 bg-green-50 text-green-700'
															: 'border-red-100 bg-red-50 text-red-700'
													}`}
												>
													{status.message}
												</p>
											) : null}

											<button
												className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
												type="submit"
												disabled={submitting === vacancy.id}
											>
												{submitting === vacancy.id ? 'Submitting...' : 'Submit Application'}
											</button>
										</form>
									) : null}
								</article>
							);
						})}
					</div>
				)}
			</main>

			<Footer
				summary="Explore open roles at LegalMind and submit your application directly online."
				links={[
					{ to: '/', label: 'Home' },
					{ to: '/login', label: 'Sign In' },
				]}
			/>
		</div>
	);
}

export default Vacancies;
