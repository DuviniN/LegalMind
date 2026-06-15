import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { agentQuery, getDocuments } from '../api/client';

function MenuIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
			<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
			<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
			<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
	);
}

function SendIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
			<path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .59.53l6.347 1.215a.75.75 0 0 1 0 1.474l-6.347 1.215a.75.75 0 0 0-.59.53l-1.414 4.949a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.155.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
		</svg>
	);
}

const toErrorText = (error, fallback = 'Request failed.') => {
	const detail = error?.response?.data?.detail;
	if (Array.isArray(detail)) {
		const lines = detail.map((item) => {
			const path = Array.isArray(item?.loc) ? item.loc.join('.') : 'field';
			const message = item?.msg || 'Invalid input';
			return `${path}: ${message}`;
		});
		return lines.join('; ');
	}

	if (detail && typeof detail === 'object') {
		return JSON.stringify(detail);
	}

	if (typeof detail === 'string' && detail.trim()) {
		return detail;
	}

	const payload = error?.response?.data;
	if (payload && typeof payload === 'object') {
		return JSON.stringify(payload);
	}

	if (typeof payload === 'string' && payload.trim()) {
		return payload;
	}

	return error?.message || fallback;
};

function Chat() {
	const navigate = useNavigate();
	const [question, setQuestion] = useState('');
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState('');
	const [documents, setDocuments] = useState([]);
	const [selectedDocumentId, setSelectedDocumentId] = useState('');
	const [leaveDraft, setLeaveDraft] = useState({});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			text: 'Welcome to LegalMind AI. Ask company policy questions or tell me your leave request. I will answer from document context and guide leave submission when needed.',
		},
	]);
	const [threads, setThreads] = useState([{ id: 'current', title: 'New Conversation', updatedAt: 'Just now' }]);

	const token = localStorage.getItem('auth_token');
	const companyName = (localStorage.getItem('company_name') || '').trim();
	const isAuthenticated = Boolean(token);
	const profileInitial = (companyName.charAt(0) || 'U').toUpperCase();

	useEffect(() => {
		const loadDocuments = async () => {
			try {
				const data = await getDocuments(token);
				const list = Array.isArray(data?.documents) ? data.documents : [];
				setDocuments(list);

				const indexedDocs = list.filter((item) => item.indexing_status === 'indexed');
				if (indexedDocs.length > 0) {
					setSelectedDocumentId(indexedDocs[0].id);
				}
			} catch (error) {
				setStatus(toErrorText(error, 'Failed to load documents for chat context.'));
			}
		};

		loadDocuments();
	}, [token]);

	const indexedDocumentOptions = useMemo(
		() => documents.filter((item) => item.indexing_status === 'indexed'),
		[documents]
	);

	const hasIndexedDocuments = indexedDocumentOptions.length > 0;
	const isFreshConversation = messages.length <= 1;

	const submitQuestion = async (rawQuestion) => {
		const cleanQuestion = rawQuestion.trim();
		if (!cleanQuestion) {
			return;
		}

		setMessages((prev) => [...prev, { role: 'user', text: cleanQuestion }]);
		setQuestion('');
		setLoading(true);
		setStatus('');

		setThreads((prev) => {
			const updated = [...prev];
			updated[0] = {
				id: 'current',
				title: cleanQuestion.length > 42 ? `${cleanQuestion.slice(0, 42)}...` : cleanQuestion,
				updatedAt: 'Now',
			};
			return updated;
		});

		try {
			const leaveFlowActive = Object.keys(leaveDraft).length > 0;
			const agentResponse = await agentQuery(
				{
					message: cleanQuestion,
					top_k: 4,
					document_id: selectedDocumentId || null,
					leave_draft: leaveFlowActive ? leaveDraft : null,
				},
				token
			);

			if (agentResponse?.intent === 'leave_request') {
				const leaveResponse = agentResponse?.leave;
				if (leaveResponse?.status === 'needs_more_info') {
					setLeaveDraft(leaveResponse?.draft || leaveDraft);
				} else {
					setLeaveDraft({});
				}
			} else {
				setLeaveDraft({});
			}

			const assistantAnswer = agentResponse?.assistant_message || 'No response generated.';
			setMessages((prev) => [...prev, { role: 'assistant', text: assistantAnswer }]);

			try {
				const existing = JSON.parse(localStorage.getItem('legalmind_chat_history') || '[]');
				const normalizedHistory = Array.isArray(existing) ? existing : [];
				normalizedHistory.push({ question: cleanQuestion, answer: assistantAnswer, createdAt: new Date().toISOString() });
				localStorage.setItem('legalmind_chat_history', JSON.stringify(normalizedHistory.slice(-50)));
			} catch {
				// Ignore parse failures and keep chat UI responsive.
			}
		} catch (error) {
			const detail = toErrorText(error, 'RAG request failed. Check backend and token.');
			setStatus(detail);
			setMessages((prev) => [...prev, { role: 'assistant', text: `I could not process this question. ${detail}` }]);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		submitQuestion(question);
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submitQuestion(question);
		}
	};

	const handleNewChat = () => {
		setMessages([
			{
				role: 'assistant',
				text: 'New chat started. Ask anything about legal clauses, compliance, or document review.',
			},
		]);
		setThreads([{ id: 'current', title: 'New Conversation', updatedAt: 'Just now' }]);
		setLeaveDraft({});
		setQuestion('');
		setStatus('');
		setSidebarOpen(false);
	};

	const handleLogout = () => {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('company_name');
		localStorage.removeItem('user_role');
		navigate('/');
	};

	return (
		<div className="flex h-screen w-full overflow-hidden bg-white text-slate-800">
			{sidebarOpen ? (
				<div
					className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
					aria-hidden="true"
				/>
			) : null}

			<aside
				className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-shrink-0 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className="flex items-center justify-between gap-2 px-4 py-4">
					<Link to="/" className="flex items-center gap-2.5">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
							LM
						</span>
						<span className="font-display text-lg font-bold tracking-wide text-white">LegalMind</span>
					</Link>
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
						aria-label="Close sidebar"
					>
						<CloseIcon />
					</button>
				</div>

				<div className="px-3">
					<button
						type="button"
						onClick={handleNewChat}
						className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
					>
						<PlusIcon />
						New Chat
					</button>
				</div>

				<div className="mt-5 flex-1 overflow-y-auto px-3">
					<p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conversations</p>
					<div className="mt-2 grid gap-1">
						{threads.map((thread) => (
							<div key={thread.id} className="truncate rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-slate-100">
								{thread.title}
							</div>
						))}
					</div>
				</div>

				<div className="border-t border-white/10 px-3 py-3">
					{isAuthenticated ? (
						<div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2.5">
							<div className="flex min-w-0 items-center gap-2.5">
								<span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white">
									{profileInitial}
								</span>
								<span className="truncate text-sm font-semibold text-white">{companyName || 'Account'}</span>
							</div>
							<button
								type="button"
								onClick={handleLogout}
								className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
							>
								Logout
							</button>
						</div>
					) : (
						<div className="grid gap-2.5">
							<p className="px-1 text-xs leading-relaxed text-slate-400">
								Sign in to upload documents and manage your legal workspace.
							</p>
							<div className="grid grid-cols-2 gap-2">
								<Link
									to="/login"
									className="rounded-lg border border-white/15 px-3 py-2 text-center text-xs font-semibold text-slate-100 transition hover:bg-white/10"
								>
									Sign In
								</Link>
								<Link
									to="/register"
									className="rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
								>
									Get Started
								</Link>
							</div>
						</div>
					)}
				</div>
			</aside>

			<div className="flex h-full min-w-0 flex-1 flex-col">
				<header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setSidebarOpen(true)}
							className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
							aria-label="Open sidebar"
						>
							<MenuIcon />
						</button>
						<div>
							<p className="text-sm font-bold text-slate-900">LegalMind AI Assistant</p>
							<p className="text-xs text-slate-500">Natural chat for legal operations and document understanding</p>
						</div>
					</div>

					{hasIndexedDocuments ? (
						<select
							className="max-w-[14rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							value={selectedDocumentId}
							onChange={(event) => setSelectedDocumentId(event.target.value)}
						>
							<option value="">All indexed documents</option>
							{indexedDocumentOptions.map((doc) => (
								<option key={doc.id} value={doc.id}>{doc.file_name}</option>
							))}
						</select>
					) : null}
				</header>

				<div className="flex-1 overflow-y-auto">
					<div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
						{isFreshConversation ? (
							<div className="mt-6 flex flex-col items-center text-center sm:mt-16">
								<span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
									AI
								</span>
								<h1 className="mt-4 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
									How can I help with your legal questions today?
								</h1>
								<p className="mt-2 max-w-md text-sm text-slate-500">
									Ask about policies, contract clauses, compliance steps, or submit a leave request — no account needed.
								</p>
							</div>
						) : (
							messages.map((message, index) => (
								<div
									key={`${message.role}-${index}`}
									className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
								>
									{message.role === 'assistant' ? (
										<div className="flex max-w-[92%] items-start gap-3">
											<span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
												AI
											</span>
											<div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
												{message.text}
											</div>
										</div>
									) : (
										<div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-line">
											{message.text}
										</div>
									)}
								</div>
							))
						)}

						{loading ? (
							<div className="flex items-start gap-3">
								<span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
									AI
								</span>
								<div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3.5">
									<span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
									<span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
									<span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
								</div>
							</div>
						) : null}
					</div>
				</div>

				<div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
					<div className="mx-auto max-w-3xl">
						{status ? (
							<p className="mb-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{status}</p>
						) : null}
						<form className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100" onSubmit={handleSubmit}>
							<textarea
								className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
								placeholder="Message LegalMind AI..."
								rows={1}
								value={question}
								onChange={(event) => setQuestion(event.target.value)}
								onKeyDown={handleKeyDown}
							/>
							<button
								className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
								type="submit"
								disabled={loading || !question.trim()}
								aria-label="Send message"
							>
								<SendIcon />
							</button>
						</form>
						<p className="mt-2 text-center text-[11px] text-slate-400">
							LegalMind AI can make mistakes. Verify important legal information.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Chat;
