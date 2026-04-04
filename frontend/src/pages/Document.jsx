import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocument } from '../api/client';
import DocumentTable from '../components/DocumentTable';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Document() {
	const navigate = useNavigate();
	const [file, setFile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);

	const token = localStorage.getItem('auth_token');
	const companyName = localStorage.getItem('company_name') || 'Company Owner';

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
		} catch (error) {
			setStatus(error?.response?.data?.detail || 'Upload failed');
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('company_name');
		localStorage.removeItem('user_role');
		navigate('/');
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_58%,#f6fbff_100%)] text-slate-800">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-4 px-4 py-4 lg:px-6 lg:py-6">
				<Navbar showSignIn={false} showSignUp={false} showHome onLogout={logout} />

				<main className="relative grid h-full gap-4">
					<section className="grid min-h-[34rem] rounded-2xl border border-blue-100 bg-white/92 p-6 shadow-[0_12px_32px_rgba(37,99,235,0.08)] backdrop-blur-sm sm:p-8">
						<div className="mx-auto grid w-full max-w-6xl gap-4">
							<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
								<div>
									<p className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
										Company Workspace
									</p>
									<h2 className="mt-1 font-display text-3xl font-bold text-slate-900">{companyName}</h2>
									<p className="text-sm text-slate-600">Upload contracts and review your PDF upload timeline.</p>
								</div>
							</div>

							<div className="w-full rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
								<h3 className="font-display text-lg font-semibold text-slate-900">Upload PDF</h3>
								<form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleUpload}>
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
							</div>

							<div className="w-full rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
								<h3 className="font-display text-lg font-semibold text-slate-900">Upload History</h3>
								<DocumentTable documents={documents} />
							</div>
						</div>
					</section>
				</main>

				<Footer
					summary="Official legal workspace for secure PDF records, trusted team collaboration, and consistent document governance."
					links={[
						{ to: '/documents', label: 'Workspace' },
						{ to: '/chat', label: 'Chat Assistant' },
					]}
				/>
			</div>
		</div>
	);
}

export default Document;
