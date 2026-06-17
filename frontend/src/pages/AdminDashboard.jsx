import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createVacancy,
	getDocuments,
	getLeaveRequests,
	getMyVacancies,
	getVacancyApplications,
	rankVacancyApplications,
	updateVacancyStatus,
	uploadDocument,
} from '../api/client';
import DocumentTable from '../components/DocumentTable';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SIDEBAR_ITEMS = [
	{ id: 'home', label: 'Home' },
	{ id: 'profile', label: 'Profile' },
	{ id: 'upload', label: 'Upload Document' },
	{ id: 'history', label: 'Upload History' },
	{ id: 'chatHistory', label: 'User Chat History' },
	{ id: 'leaveRequests', label: 'Leave Requests' },
	{ id: 'postVacancy', label: 'Post Vacancy' },
	{ id: 'vacancies', label: 'My Vacancies' },
	{ id: 'rankings', label: 'Candidate Rankings' },
	{ id: 'chatPage', label: 'Open Chat Page', route: '/chat' },
];

const EMPLOYMENT_TYPES = [
	{ value: 'full_time', label: 'Full Time' },
	{ value: 'part_time', label: 'Part Time' },
	{ value: 'contract', label: 'Contract' },
	{ value: 'internship', label: 'Internship' },
];

const EMPTY_VACANCY_FORM = {
	title: '',
	department: '',
	location: '',
	employment_type: 'full_time',
	description: '',
	requirements: '',
};

function formatEmploymentType(value) {
	if (!value) return '-';
	return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function AdminDashboard() {
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState('home');
	const [file, setFile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [leaveRequests, setLeaveRequests] = useState([]);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const [vacancies, setVacancies] = useState([]);
	const [vacancyForm, setVacancyForm] = useState(EMPTY_VACANCY_FORM);
	const [posterFile, setPosterFile] = useState(null);
	const [vacancyLoading, setVacancyLoading] = useState(false);
	const [selectedVacancyId, setSelectedVacancyId] = useState(null);
	const [applications, setApplications] = useState([]);
	const [applicationsLoading, setApplicationsLoading] = useState(false);
	const [ranking, setRanking] = useState(false);
	const [allRankings, setAllRankings] = useState([]);
	const [rankingsLoading, setRankingsLoading] = useState(false);

	const token = localStorage.getItem('auth_token');
	const companyName = localStorage.getItem('company_name') || 'Manager Account';

	const chatHistory = useMemo(() => {
		const saved = localStorage.getItem('legalmind_chat_history');
		if (!saved) {
			return [];
		}
		try {
			const parsed = JSON.parse(saved);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, []);

	const leaveRequestStats = useMemo(() => {
		return {
			total: leaveRequests.length,
			submitted: leaveRequests.filter((item) => item.status === 'submitted').length,
		};
	}, [leaveRequests]);

	const formatLeaveType = (value) => {
		if (!value) return '-';
		return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const formatDuration = (request) => {
		if (request.single_date) {
			return request.single_date;
		}
		if (request.start_date && request.end_date) {
			return `${request.start_date} to ${request.end_date}`;
		}
		return request.leave_date || '-';
	};

	const latestUpload = useMemo(() => {
		if (!documents.length) {
			return 'No uploads yet';
		}
		const sorted = [...documents].sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
		const uploadedAt = sorted[0]?.uploaded_at;
		if (!uploadedAt) {
			return 'No uploads yet';
		}
		const date = new Date(uploadedAt);
		if (Number.isNaN(date.getTime())) {
			return 'No uploads yet';
		}
		return date.toLocaleString();
	}, [documents]);

	const loadDocuments = async () => {
		if (!token) {
			navigate('/login');
			return;
		}
		try {
			const data = await getDocuments(token);
			setDocuments(data.documents || []);
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to load documents');
		}
	};

	const loadLeaveRequests = async () => {
		if (!token) {
			return;
		}
		try {
			const data = await getLeaveRequests(token);
			setLeaveRequests(Array.isArray(data?.requests) ? data.requests : []);
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to load leave requests');
		}
	};

	const loadVacancies = async () => {
		if (!token) {
			return;
		}
		try {
			const data = await getMyVacancies(token);
			setVacancies(Array.isArray(data?.vacancies) ? data.vacancies : []);
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to load vacancies');
		}
	};

	useEffect(() => {
		loadDocuments();
		loadLeaveRequests();
		loadVacancies();
	}, []);

	useEffect(() => {
		if (activeSection === 'rankings' && vacancies.length > 0) {
			loadAllRankings();
		}
	}, [activeSection, vacancies]);

	const handleUpload = async (event) => {
		event.preventDefault();
		if (!file) {
			setStatus('Please choose a PDF file');
			return;
		}

		setLoading(true);
		setStatus('');
		try {
			await uploadDocument(file, token);
			setFile(null);
			setStatus('PDF uploaded successfully');
			await loadDocuments();
			setActiveSection('history');
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Upload failed');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateVacancy = async (event) => {
		event.preventDefault();
		setVacancyLoading(true);
		setStatus('');
		try {
			await createVacancy(vacancyForm, posterFile, token);
			setVacancyForm(EMPTY_VACANCY_FORM);
			setPosterFile(null);
			setStatus('Vacancy posted successfully');
			await loadVacancies();
			setActiveSection('vacancies');
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to post vacancy');
		} finally {
			setVacancyLoading(false);
		}
	};

	const handleToggleVacancyStatus = async (vacancy) => {
		const nextStatus = vacancy.status === 'open' ? 'closed' : 'open';
		setStatus('');
		try {
			await updateVacancyStatus(vacancy.id, nextStatus, token);
			await loadVacancies();
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to update vacancy status');
		}
	};

	const handleViewApplications = async (vacancyId) => {
		setSelectedVacancyId(vacancyId);
		setApplications([]);
		setApplicationsLoading(true);
		setStatus('');
		try {
			const data = await getVacancyApplications(vacancyId, token);
			setApplications(Array.isArray(data?.applications) ? data.applications : []);
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Failed to load applications');
		} finally {
			setApplicationsLoading(false);
		}
	};

	const handleRank = async () => {
		if (!selectedVacancyId) return;
		setRanking(true);
		setStatus('');
		try {
			const data = await rankVacancyApplications(selectedVacancyId, token);
			setApplications(Array.isArray(data?.applications) ? data.applications : []);
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Ranking failed');
		} finally {
			setRanking(false);
		}
	};

	const loadAllRankings = async () => {
		if (!token || vacancies.length === 0) return;
		setRankingsLoading(true);
		try {
			const results = await Promise.all(
				vacancies.map(async (vacancy) => {
					const data = await getVacancyApplications(vacancy.id, token);
					const apps = Array.isArray(data?.applications) ? data.applications : [];
					return apps
						.filter((app) => app.match_score !== null && app.match_score !== undefined)
						.map((app) => ({ ...app, vacancy_title: vacancy.title, vacancy_department: vacancy.department }));
				}),
			);
			const combined = results.flat().sort((a, b) => b.match_score - a.match_score);
			setAllRankings(combined);
		} catch {
			// silently ignore per-vacancy fetch failures
		} finally {
			setRankingsLoading(false);
		}
	};

	const renderContent = () => {
		if (activeSection === 'home') {
			return (
				<div className="grid gap-4">
					<section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 p-6 text-white shadow-[0_14px_36px_rgba(37,99,235,0.28)] sm:p-7">
						<p className="inline-flex rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
							Manager Home
						</p>
						<h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Welcome, {companyName}</h2>
						<p className="mt-2 max-w-3xl text-sm text-blue-50 sm:text-base">
							Manage legal uploads, monitor activity, and review user chat interactions from one centralized dashboard.
						</p>
						<div className="mt-5 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={() => setActiveSection('upload')}
								className="rounded-xl border border-white/60 bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-blue-700 transition hover:bg-blue-50"
							>
								Upload Document
							</button>
							<button
								type="button"
								onClick={() => setActiveSection('history')}
								className="rounded-xl border border-white/60 bg-white/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/25"
							>
								View Upload History
							</button>
						</div>
					</section>

					<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total Uploads</p>
							<p className="mt-2 text-3xl font-bold text-slate-900">{documents.length}</p>
						</div>
						<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">User Chats Logged</p>
							<p className="mt-2 text-3xl font-bold text-slate-900">{chatHistory.length}</p>
						</div>
						<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm md:col-span-2">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Latest Upload</p>
							<p className="mt-2 text-lg font-semibold text-slate-900">{latestUpload}</p>
						</div>
					</section>

					<section className="grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
							<h3 className="font-display text-xl font-bold text-slate-900">Recent Document Activity</h3>
							{documents.length === 0 ? (
								<p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">No uploads yet. Start by uploading your first PDF.</p>
							) : (
								<ul className="mt-3 grid gap-2">
									{documents.slice(0, 3).map((doc) => (
										<li key={doc.id} className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
											<p className="truncate text-sm font-semibold text-slate-900">{doc.file_name}</p>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
							<h3 className="font-display text-xl font-bold text-slate-900">Manager Checklist</h3>
							<ul className="mt-3 grid gap-2 text-sm text-slate-700">
								<li className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">Review latest uploads for compliance accuracy.</li>
								<li className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">Track unresolved user questions in chat history.</li>
								<li className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">Maintain consistent legal document naming standards.</li>
							</ul>
						</div>
					</section>
				</div>
			);
		}

		if (activeSection === 'profile') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
						Manager Profile
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold text-slate-900">{companyName}</h2>
					<p className="mt-1 text-sm text-slate-600">Manage legal document workflows from your admin dashboard.</p>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
							<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Role</p>
							<p className="mt-1 text-sm font-semibold text-slate-900">Manager</p>
						</div>
						<div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
							<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Total Uploaded PDFs</p>
							<p className="mt-1 text-sm font-semibold text-slate-900">{documents.length}</p>
						</div>
					</div>
				</section>
			);
		}

		if (activeSection === 'upload') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<h2 className="font-display text-2xl font-bold text-slate-900">Upload Document</h2>
					<p className="mt-1 text-sm text-slate-600">Upload PDF files to your legal workspace securely.</p>
					<form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleUpload}>
						<input
							className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-md file:border file:border-blue-300 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
							type="file"
							accept="application/pdf,.pdf"
							onChange={(event) => setFile(event.target.files?.[0] || null)}
						/>
						<button
							className="rounded-xl border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
							type="submit"
							disabled={loading}
						>
							{loading ? 'Uploading...' : 'Upload PDF'}
						</button>
					</form>
					{status ? <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-700">{status}</p> : null}
				</section>
			);
		}

		if (activeSection === 'history') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<h2 className="font-display text-2xl font-bold text-slate-900">Upload History</h2>
					<p className="mt-1 text-sm text-slate-600">Review all uploaded legal PDF files and timestamps.</p>
					<DocumentTable documents={documents} />
				</section>
			);
		}

		if (activeSection === 'leaveRequests') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<h2 className="font-display text-2xl font-bold text-slate-900">Leave Requests</h2>
					<p className="mt-1 text-sm text-slate-600">Employee leave and short leave requests captured by AI.</p>
					<div className="mt-4 grid gap-4 md:grid-cols-3">
						<div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
							<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Total Requests</p>
							<p className="mt-1 text-3xl font-bold text-slate-900">{leaveRequestStats.total}</p>
						</div>
						<div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
							<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Submitted</p>
							<p className="mt-1 text-3xl font-bold text-slate-900">{leaveRequestStats.submitted}</p>
						</div>
					</div>
					{leaveRequests.length === 0 ? (
						<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">No leave requests yet.</p>
					) : (
						<ul className="mt-4 grid gap-3">
							{leaveRequests.map((request) => (
								<li key={request.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-sm font-semibold text-slate-900">{request.employee_name || 'Employee'} - {formatLeaveType(request.leave_type)}</p>
										<span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">{request.status}</span>
									</div>
									<p className="mt-1 text-sm text-slate-700">{request.summary || request.raw_message}</p>
									<p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">{request.department || 'No department'} | {request.submitted_at || '-'}</p>
									<div className="mt-3 grid gap-1 text-sm text-slate-700">
										<p><span className="font-semibold">Employee ID:</span> {request.employee_id || '-'}</p>
										<p><span className="font-semibold">Leave Type:</span> {formatLeaveType(request.leave_type)}</p>
										<p><span className="font-semibold">Duration:</span> {formatDuration(request)}</p>
										<p><span className="font-semibold">No. of Days:</span> {request.number_of_days ?? '-'}</p>
										<p><span className="font-semibold">Day Session:</span> {request.day_duration ? formatLeaveType(request.day_duration) : (request.leave_time || '-')}</p>
										<p><span className="font-semibold">Emergency:</span> {request.is_emergency ? 'Yes' : 'No'}</p>
										<p><span className="font-semibold">Contact During Leave:</span> {request.contact_during_leave || '-'}</p>
										<p><span className="font-semibold">Reason:</span> {request.reason || '-'}</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			);
		}

		if (activeSection === 'postVacancy') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<h2 className="font-display text-2xl font-bold text-slate-900">Post Vacancy</h2>
					<p className="mt-1 text-sm text-slate-600">Publish a new job opening for candidates to view and apply.</p>
					<form className="mt-4 grid gap-4" onSubmit={handleCreateVacancy}>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block text-sm font-medium text-slate-700">
								Job Title
								<input
									className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									type="text"
									value={vacancyForm.title}
									onChange={(event) => setVacancyForm((current) => ({ ...current, title: event.target.value }))}
									required
								/>
							</label>

							<label className="block text-sm font-medium text-slate-700">
								Department
								<input
									className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									type="text"
									value={vacancyForm.department}
									onChange={(event) => setVacancyForm((current) => ({ ...current, department: event.target.value }))}
									required
								/>
							</label>

							<label className="block text-sm font-medium text-slate-700">
								Location
								<input
									className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									type="text"
									value={vacancyForm.location}
									onChange={(event) => setVacancyForm((current) => ({ ...current, location: event.target.value }))}
									required
								/>
							</label>

							<label className="block text-sm font-medium text-slate-700">
								Employment Type
								<select
									className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
									value={vacancyForm.employment_type}
									onChange={(event) => setVacancyForm((current) => ({ ...current, employment_type: event.target.value }))}
								>
									{EMPLOYMENT_TYPES.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>
						</div>

						<label className="block text-sm font-medium text-slate-700">
							Description
							<textarea
								className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
								rows={4}
								value={vacancyForm.description}
								onChange={(event) => setVacancyForm((current) => ({ ...current, description: event.target.value }))}
								required
							/>
						</label>

						<label className="block text-sm font-medium text-slate-700">
							Requirements
							<textarea
								className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
								rows={4}
								value={vacancyForm.requirements}
								onChange={(event) => setVacancyForm((current) => ({ ...current, requirements: event.target.value }))}
								required
							/>
							<span className="mt-1 block text-xs text-slate-500">
								These requirements are used by the AI ranking tool and are not shown to candidates.
							</span>
						</label>

						<label className="block text-sm font-medium text-slate-700">
							Poster Image (optional)
							<input
								className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-md file:border file:border-blue-300 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
								type="file"
								accept="image/*"
								onChange={(event) => setPosterFile(event.target.files?.[0] || null)}
							/>
						</label>

						{status ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-700">{status}</p> : null}

						<button
							className="rounded-xl border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
							type="submit"
							disabled={vacancyLoading}
						>
							{vacancyLoading ? 'Posting...' : 'Post Vacancy'}
						</button>
					</form>
				</section>
			);
		}

		if (activeSection === 'vacancies') {
			const selectedVacancy = vacancies.find((item) => item.id === selectedVacancyId);
			return (
				<div className="grid gap-4">
					<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
						<h2 className="font-display text-2xl font-bold text-slate-900">My Vacancies</h2>
						<p className="mt-1 text-sm text-slate-600">Manage your job postings and review candidate applications.</p>
						{status ? <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-700">{status}</p> : null}
						{vacancies.length === 0 ? (
							<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
								No vacancies posted yet. Use "Post Vacancy" to create your first job listing.
							</p>
						) : (
							<ul className="mt-4 grid gap-3">
								{vacancies.map((vacancy) => (
									<li key={vacancy.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className="text-sm font-semibold text-slate-900">{vacancy.title}</p>
											<span
												className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
													vacancy.status === 'open'
														? 'border-green-200 bg-green-50 text-green-700'
														: 'border-slate-300 bg-slate-100 text-slate-600'
												}`}
											>
												{vacancy.status}
											</span>
										</div>
										<p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
											{vacancy.department} | {vacancy.location} | {formatEmploymentType(vacancy.employment_type)}
										</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => handleViewApplications(vacancy.id)}
												className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
											>
												View Applications
											</button>
											<button
												type="button"
												onClick={() => handleToggleVacancyStatus(vacancy)}
												className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
											>
												{vacancy.status === 'open' ? 'Close' : 'Reopen'}
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</section>

					{selectedVacancyId ? (
						<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h3 className="font-display text-xl font-bold text-slate-900">
									Applications{selectedVacancy ? ` — ${selectedVacancy.title}` : ''}
								</h3>
								<button
									type="button"
									onClick={handleRank}
									className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
									disabled={ranking || applicationsLoading || applications.length === 0}
								>
									{ranking ? 'Ranking...' : 'Rank Candidates'}
								</button>
							</div>

							{applicationsLoading ? (
								<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">Loading applications...</p>
							) : applications.length === 0 ? (
								<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">No applications yet for this vacancy.</p>
							) : (
								<ul className="mt-4 grid gap-3">
									{applications.map((application) => (
										<li key={application.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<p className="text-sm font-semibold text-slate-900">{application.candidate_name}</p>
												<span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
													{application.match_score === null || application.match_score === undefined
														? 'Not yet ranked'
														: `Score: ${application.match_score}/100`}
												</span>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												{application.candidate_email}
												{application.candidate_phone ? ` | ${application.candidate_phone}` : ''}
											</p>
											<p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{application.cv_file_name}</p>
											{application.match_summary ? (
												<p className="mt-2 text-sm text-slate-700">{application.match_summary}</p>
											) : null}
										</li>
									))}
								</ul>
							)}
						</section>
					) : null}
				</div>
			);
		}

		if (activeSection === 'rankings') {
			return (
				<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 className="font-display text-2xl font-bold text-slate-900">Candidate Rankings</h2>
							<p className="mt-1 text-sm text-slate-600">All ranked applicants across your vacancies, sorted by AI match score.</p>
						</div>
						<button
							type="button"
							onClick={loadAllRankings}
							disabled={rankingsLoading}
							className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
						>
							{rankingsLoading ? 'Loading...' : 'Refresh'}
						</button>
					</div>

					{rankingsLoading ? (
						<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">Loading ranked candidates...</p>
					) : allRankings.length === 0 ? (
						<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
							No ranked candidates yet. Use <strong>Rank Candidates</strong> in My Vacancies to score applicants first.
						</p>
					) : (
						<ul className="mt-4 grid gap-3">
							{allRankings.map((application, index) => (
								<li key={application.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-bold text-blue-700">
												{index + 1}
											</span>
											<p className="text-sm font-semibold text-slate-900">{application.candidate_name}</p>
										</div>
										<span
											className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
												application.match_score >= 75
													? 'border-green-200 bg-green-50 text-green-700'
													: application.match_score >= 50
														? 'border-yellow-200 bg-yellow-50 text-yellow-700'
														: 'border-red-200 bg-red-50 text-red-600'
											}`}
										>
											{application.match_score}/100
										</span>
									</div>
									<p className="mt-1 text-xs text-slate-500">
										{application.candidate_email}
										{application.candidate_phone ? ` | ${application.candidate_phone}` : ''}
									</p>
									<p className="mt-1 text-xs uppercase tracking-[0.12em] text-blue-600">
										{application.vacancy_title}{application.vacancy_department ? ` — ${application.vacancy_department}` : ''}
									</p>
									{application.match_summary ? (
										<p className="mt-2 text-sm text-slate-700">{application.match_summary}</p>
									) : null}
								</li>
							))}
						</ul>
					)}
				</section>
			);
		}

		return (
			<section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
				<h2 className="font-display text-2xl font-bold text-slate-900">User Chat History</h2>
				<p className="mt-1 text-sm text-slate-600">Review previously captured chat prompts and answers.</p>
				{chatHistory.length === 0 ? (
					<p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
						No chat history found yet.
					</p>
				) : (
					<ul className="mt-4 grid gap-2">
						{chatHistory.map((entry, index) => (
							<li key={`${entry?.question || 'chat'}-${index}`} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
								<p className="text-sm font-semibold text-slate-900">Q: {entry?.question || '-'}</p>
								<p className="mt-1 text-sm text-slate-600">A: {entry?.answer || '-'}</p>
							</li>
						))}
					</ul>
				)}
			</section>
		);
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_58%,#f6fbff_100%)] text-slate-800">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-4 px-4 py-4 lg:px-6 lg:py-6">
				<Navbar showHome showSignIn={false} showSignUp={false} />

				<main className="grid h-full gap-4 rounded-2xl border border-blue-100 bg-white/92 p-4 shadow-[0_12px_32px_rgba(37,99,235,0.08)] backdrop-blur-sm lg:grid-cols-[16rem_1fr] lg:p-6">
					<aside className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-3">
						<p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Admin Dashboard</p>
						<div className="grid gap-2">
							{SIDEBAR_ITEMS.map((item) => {
								const isActive = item.id === activeSection;
								return (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											if (item.route) {
												navigate(item.route);
												return;
											}
											setActiveSection(item.id);
											if (item.id === 'rankings') {
												loadAllRankings();
											}
										}}
										className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
											isActive
												? 'border-blue-600 bg-blue-600 text-white shadow-sm'
												: 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
										}`}
									>
										{item.label}
									</button>
								);
							})}
						</div>
					</aside>

					<div className="min-w-0">{renderContent()}</div>
				</main>

				<Footer
					summary="Manager dashboard for legal operations, document uploads, and team activity oversight."
					links={[
						{ to: '/admin-dashboard', label: 'Dashboard' },
						{ to: '/chat', label: 'Chat Assistant' },
					]}
				/>
			</div>
		</div>
	);
}

export default AdminDashboard;
