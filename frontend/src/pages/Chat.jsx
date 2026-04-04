import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';
import SourceList from '../components/SourceList';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Chat() {
	const [question, setQuestion] = useState('');
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState([
		{ role: 'assistant', text: 'Hi, ask me about uploaded legal documents.' },
	]);
	const [sources, setSources] = useState([]);

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!question.trim()) {
			return;
		}

		const userQuestion = question.trim();
		setMessages((prev) => [...prev, { role: 'user', text: userQuestion }]);
		setQuestion('');
		setLoading(true);

		setTimeout(() => {
			const assistantAnswer = 'Chat endpoint can be connected next. This UI is ready for modern public chat flow.';
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					text: assistantAnswer,
				},
			]);
			try {
				const existing = JSON.parse(localStorage.getItem('legalmind_chat_history') || '[]');
				const normalizedHistory = Array.isArray(existing) ? existing : [];
				normalizedHistory.push({ question: userQuestion, answer: assistantAnswer, createdAt: new Date().toISOString() });
				localStorage.setItem('legalmind_chat_history', JSON.stringify(normalizedHistory.slice(-50)));
			} catch {
				// Ignore parse failures and keep chat UI responsive.
			}
			setSources(['Clause 2.3', 'Clause 3.1']);
			setLoading(false);
		}, 500);
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_58%,#f6fbff_100%)] text-slate-800">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
				<Navbar showHome showSignIn={false} showSignUp={false} />

				<main className="relative grid h-full gap-3">
					<section className="grid min-h-[34rem] rounded-2xl border border-blue-100 bg-white/85 p-6 shadow-[0_10px_24px_rgba(37,99,235,0.08)] sm:p-8">
						<div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[2fr_1fr]">
							<div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
								<p className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
									AI Legal Assistant
								</p>
								<h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Chat With LegalMind AI</h2>
								<p className="mt-1 text-sm text-slate-600">Ask legal questions and get fast AI answers from your workspace context.</p>
								<ChatPanel
									messages={messages}
									question={question}
									setQuestion={setQuestion}
									onSubmit={handleSubmit}
									loading={loading}
								/>
							</div>

							<div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
								<h3 className="font-display text-lg font-semibold text-slate-900">Answer Sources</h3>
								<p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">Referenced Clauses and Notes</p>
								<SourceList sources={sources} />
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
