import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocument } from '../api/client';
import DocumentTable from '../components/DocumentTable';
import Navbar from '../components/Navbar';

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
		<div className="min-h-screen bg-black text-white">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
				<Navbar showSignIn={false} showSignUp={false} showHome onLogout={logout} />

				<main className="relative grid h-full gap-3">
					<section className="relative grid min-h-[34rem] overflow-hidden rounded-2xl border border-white/20 bg-black">
						<img
							src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80"
							alt="Legal office background"
							className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale brightness-[0.26]"
						/>
						<div className="pointer-events-none absolute inset-0 opacity-85">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_52%)]" />
						</div>

						<div className="relative z-10 mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:px-6 sm:py-8">
							<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
								<div>
									<p className="inline-flex w-fit rounded-full border border-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
										Company Workspace
									</p>
									<h2 className="mt-1 font-display text-3xl font-bold text-white">{companyName}</h2>
									<p className="text-sm text-zinc-300">Upload contracts and review your PDF upload timeline.</p>
								</div>
							</div>

							<div className="w-full rounded-2xl border border-white/25 bg-black/90 p-6 backdrop-blur">
								<h3 className="font-display text-lg font-semibold text-white">Upload PDF</h3>
								<form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleUpload}>
									<input
										className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none transition file:mr-4 file:rounded-md file:border file:border-white file:bg-black file:px-3 file:py-2 file:text-white hover:file:bg-white hover:file:text-black focus:border-white focus:ring-2 focus:ring-white/25"
										type="file"
										accept="application/pdf,.pdf"
										onChange={(event) => setFile(event.target.files?.[0] || null)}
									/>
									<button
										className="rounded-xl border-2 border-white bg-white px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
										type="submit"
										disabled={loading}
									>
										{loading ? 'Uploading...' : 'Upload PDF'}
									</button>
								</form>
								{status ? <p className="mt-3 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-zinc-100">{status}</p> : null}
							</div>

							<div className="w-full rounded-2xl border border-white/25 bg-black/90 p-6 backdrop-blur">
								<h3 className="font-display text-lg font-semibold text-white">Upload History</h3>
								<DocumentTable documents={documents} />
							</div>
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
							<Link to="/documents" className="transition hover:text-white">
								Workspace
							</Link>
							<Link to="/chat" className="transition hover:text-white">
								Chat
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

export default Document;
