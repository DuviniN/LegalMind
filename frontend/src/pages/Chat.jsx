import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { askRagQuestion, getDocuments, submitLeaveRequest } from '../api/client';

const starterPrompts = [
	'Summarize the key obligations in this contract.',
	'What legal risks should I review before signing?',
	'Create a checklist for vendor agreement compliance.',
	'Explain this clause in simple business language.',
];

const isLeaveIntent = (text) => {
	const value = (text || '').toLowerCase();
	if (!value) {
		return false;
	}
	return /\bleave\b|short\s*leave|day\s*off|half\s*day|time\s*off|permission/i.test(value);
};

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
	const [question, setQuestion] = useState('');
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState('');
	const [documents, setDocuments] = useState([]);
	const [selectedDocumentId, setSelectedDocumentId] = useState('');
	const [leaveDraft, setLeaveDraft] = useState({});
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			text: 'Welcome to LegalMind AI. Ask company policy questions or tell me your leave request. I will answer from document context and guide leave submission when needed.',
		},
	]);
	const [threads, setThreads] = useState([{ id: 'current', title: 'Current Conversation', updatedAt: 'Just now' }]);
	const token = localStorage.getItem('auth_token');

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
			if (leaveFlowActive || isLeaveIntent(cleanQuestion)) {
				const leaveResponse = await submitLeaveRequest(
					{
						message: cleanQuestion,
						draft: leaveDraft,
					},
					token
				);

				if (leaveResponse?.status === 'needs_more_info') {
					setLeaveDraft(leaveResponse?.draft || leaveDraft);
					setMessages((prev) => [
						...prev,
						{
							role: 'assistant',
							text: leaveResponse?.next_question || 'Please provide the remaining leave details.',
						},
					]);
				} else {
					setLeaveDraft({});
					const summaryLine = leaveResponse?.request?.summary ? `\n\nSummary: ${leaveResponse.request.summary}` : '';
					setMessages((prev) => [
						...prev,
						{
							role: 'assistant',
							text: `${leaveResponse?.message || 'Leave request submitted to manager dashboard.'}${summaryLine}`,
						},
					]);
				}

				return;
			}

			const ragResponse = await askRagQuestion(
				{
					question: cleanQuestion,
					top_k: 4,
					document_id: selectedDocumentId || null,
				},
				token
			);

			const sourceLine = Array.isArray(ragResponse?.sources) && ragResponse.sources.length
				? `\n\nSources: ${ragResponse.sources.join(', ')}`
				: '';
			const confidenceLine = ragResponse?.confidence ? `\nConfidence: ${ragResponse.confidence}` : '';
			const assistantAnswer = `${ragResponse?.answer || 'No answer generated.'}${sourceLine}${confidenceLine}`;

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

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_58%,#f6fbff_100%)] text-slate-800">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-4 px-4 py-4 lg:px-6 lg:py-6">
				<Navbar showHome showSignIn={false} showSignUp={false} />

				<main className="grid h-full gap-4">
					<section className="grid min-h-[40rem] overflow-hidden rounded-3xl border border-blue-100 bg-white/92 shadow-[0_14px_36px_rgba(37,99,235,0.12)] backdrop-blur-sm lg:grid-cols-[17rem_1fr]">
						<aside className="border-b border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 lg:border-b-0 lg:border-r">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Conversations</p>
							<button
								type="button"
								onClick={() => {
									setMessages([
										{
											role: 'assistant',
											text: 'New chat started. Ask anything about legal clauses, compliance, or document review.',
										},
									]);
									setLeaveDraft({});
									setQuestion('');
								}}
								className="mt-3 w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
							>
								New Chat
							</button>

							<div className="mt-4 grid gap-2">
								{threads.map((thread) => (
									<div key={thread.id} className="rounded-xl border border-blue-100 bg-white px-3 py-2.5">
										<p className="truncate text-sm font-semibold text-slate-900">{thread.title}</p>
										<p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">Updated {thread.updatedAt}</p>
									</div>
								))}
							</div>
						</aside>

						<div className="flex min-h-[34rem] flex-col">
							<header className="border-b border-blue-100 px-4 py-4 sm:px-6">
								<p className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
									AI Legal Assistant
								</p>
								<h2 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">LegalMind Conversation</h2>
								<p className="mt-1 text-sm text-slate-600">Natural chat-style responses for legal operations and document understanding.</p>
								{indexedDocumentOptions.length > 0 ? (
									<div className="mt-3 max-w-xl">
										<label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Answer Context</label>
										<select
											className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
											value={selectedDocumentId}
											onChange={(event) => setSelectedDocumentId(event.target.value)}
										>
											<option value="">All indexed documents</option>
											{indexedDocumentOptions.map((doc) => (
												<option key={doc.id} value={doc.id}>{doc.file_name}</option>
											))}
										</select>
									</div>
								) : (
									<p className="mt-3 text-sm text-amber-700">No indexed PDF found. Upload a PDF first, then ask questions.</p>
								)}
								{status ? <p className="mt-2 text-sm text-red-700">{status}</p> : null}
							</header>

							<div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
								<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
									{messages.map((message, index) => (
										<div
											key={`${message.role}-${index}`}
											className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
										>
											{message.role === 'assistant' ? (
												<div className="flex max-w-[96%] items-start gap-3 sm:max-w-[92%]">
													<span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
														AI
													</span>
													<div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
														{message.text}
													</div>
												</div>
											) : (
												<div className="max-w-[92%] rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-line">
													{message.text}
												</div>
											)}
										</div>
									))}

									{loading ? (
										<div className="flex items-start gap-3">
											<span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
												AI
											</span>
											<div className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
												<span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
												<span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 [animation-delay:120ms]" />
												<span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 [animation-delay:240ms]" />
											</div>
										</div>
									) : null}
								</div>
							</div>

							<div className="border-t border-blue-100 bg-white px-4 py-4 sm:px-6">
								<div className="mx-auto w-full max-w-4xl">
									<div className="mb-3 flex flex-wrap gap-2">
										{starterPrompts.map((prompt) => (
											<button
												key={prompt}
												type="button"
												onClick={() => submitQuestion(prompt)}
												className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
											>
												{prompt}
											</button>
										))}
									</div>

									<form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
										<textarea
											className="min-h-[3.25rem] rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
											placeholder="Message LegalMind AI..."
											value={question}
											onChange={(event) => setQuestion(event.target.value)}
										/>
										<button
											className="rounded-2xl border border-blue-600 bg-blue-600 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
											type="submit"
											disabled={loading}
										>
											{loading ? 'Thinking...' : 'Send'}
										</button>
									</form>
								</div>
							</div>
						</div>
					</section>
				</main>

				<Footer
					summary="Simple legal AI chat with clear responses and source references."
					links={[
						{ to: '/documents', label: 'Workspace' },
						{ to: '/chat', label: 'Chat Assistant' },
					]}
				/>
			</div>
		</div>
	);
}

export default Chat;
