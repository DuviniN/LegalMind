import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocument } from '../api/client';
import DocumentTable from '../components/DocumentTable';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SIDEBAR_ITEMS = [
	{ id: 'home', label: 'Home' },
	{ id: 'profile', label: 'Profile' },
	{ id: 'upload', label: 'Upload Document' },
	{ id: 'history', label: 'Upload History' },
	{ id: 'chatHistory', label: 'User Chat History' },
];

function AdminDashboard() {
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState('home');
	const [file, setFile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);

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

	useEffect(() => {
		loadDocuments();
	}, []);

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
										onClick={() => setActiveSection(item.id)}
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
