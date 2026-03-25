import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocument } from '../api/client';
import DocumentTable from '../components/DocumentTable';

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
		navigate('/login');
	};

	return (
		<div className="relative flex min-h-screen justify-center overflow-hidden px-6 py-8">
			<div className="grid w-full max-w-6xl gap-4">
				<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
					<div>
						<p className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Company Workspace</p>
						<h2 className="mt-1 text-3xl font-bold text-slate-900">{companyName}</h2>
						<p className="text-sm text-slate-500">Upload contracts and review your PDF upload timeline.</p>
					</div>
					<button
						type="button"
						onClick={logout}
						className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
					>
						Logout
					</button>
				</div>

				<div className="w-full rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-glass backdrop-blur">
					<h3 className="text-lg font-semibold text-slate-900">Upload PDF</h3>
					<form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleUpload}>
						<input
							className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
							type="file"
							accept="application/pdf,.pdf"
							onChange={(event) => setFile(event.target.files?.[0] || null)}
						/>
						<button
							className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
							type="submit"
							disabled={loading}
						>
							{loading ? 'Uploading...' : 'Upload PDF'}
						</button>
					</form>
					{status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
				</div>

				<div className="w-full rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-glass backdrop-blur">
					<h3 className="text-lg font-semibold text-slate-900">Upload History</h3>
					<DocumentTable documents={documents} />
				</div>
			</div>
		</div>
	);
}

export default Document;
