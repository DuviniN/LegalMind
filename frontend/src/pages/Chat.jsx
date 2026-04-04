import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const starterPrompts = [
	'Summarize the key obligations in this contract.',
	'What legal risks should I review before signing?',
	'Create a checklist for vendor agreement compliance.',
	'Explain this clause in simple business language.',
];

function createUiAssistantReply(prompt) {
	return `Great question. Here is a practical legal review path for: "${prompt}".\n\n1) Start with scope and obligations. Confirm who must do what, and by when.\n2) Review risk clauses. Focus on liability limits, termination rights, and payment conditions.\n3) Validate compliance impact. Check whether this creates regulatory, operational, or reporting duties.\n\nIf you want, I can next break this into a manager action checklist.`;
}

function Chat() {
	const [question, setQuestion] = useState('');
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			text: 'Welcome to LegalMind AI. Ask a legal operations question, and I will respond in a conversational style.',
		},
	]);
	const [threads, setThreads] = useState([{ id: 'current', title: 'Current Conversation', updatedAt: 'Just now' }]);

	const submitQuestion = (rawQuestion) => {
		const cleanQuestion = rawQuestion.trim();
		if (!cleanQuestion) {
			return;
		}

		setMessages((prev) => [...prev, { role: 'user', text: cleanQuestion }]);
		setQuestion('');
		setLoading(true);

		setThreads((prev) => {
			const updated = [...prev];
			updated[0] = {
				id: 'current',
				title: cleanQuestion.length > 42 ? `${cleanQuestion.slice(0, 42)}...` : cleanQuestion,
				updatedAt: 'Now',
			};
			return updated;
		});

		setTimeout(() => {
			const assistantAnswer = createUiAssistantReply(cleanQuestion);
			setMessages((prev) => [...prev, { role: 'assistant', text: assistantAnswer }]);
			try {
				const existing = JSON.parse(localStorage.getItem('legalmind_chat_history') || '[]');
				const normalizedHistory = Array.isArray(existing) ? existing : [];
				normalizedHistory.push({ question: cleanQuestion, answer: assistantAnswer, createdAt: new Date().toISOString() });
				localStorage.setItem('legalmind_chat_history', JSON.stringify(normalizedHistory.slice(-50)));
			} catch {
				// Ignore parse failures and keep chat UI responsive.
			}
			setLoading(false);
		}, 650);
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
