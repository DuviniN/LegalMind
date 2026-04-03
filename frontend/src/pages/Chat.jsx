import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';
import SourceList from '../components/SourceList';
import Navbar from '../components/Navbar';

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
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					text: 'Chat endpoint can be connected next. This UI is ready for modern public chat flow.',
				},
			]);
			setSources(['Clause 2.3', 'Clause 3.1']);
			setLoading(false);
		}, 500);
	};

	return (
		<div className="min-h-screen bg-black text-white">
			<div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] gap-3 px-3 py-3 lg:px-4 lg:py-4">
				<Navbar showHome showSignIn={false} showSignUp={false} />

				<main className="relative grid h-full gap-3">
					<section className="relative grid min-h-[34rem] overflow-hidden rounded-2xl border border-white/20 bg-black">
						<img
							src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1800&q=80"
							alt="Legal workspace background"
							className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale brightness-[0.24]"
						/>
						<div className="pointer-events-none absolute inset-0 opacity-85">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_52%)]" />
						</div>

						<div className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[2fr_1fr]">
							<div className="rounded-2xl border border-white/25 bg-black/90 p-6 backdrop-blur">
								<p className="inline-flex w-fit rounded-full border border-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
									AI Legal Assistant
								</p>
								<h2 className="mt-2 font-display text-3xl font-bold text-white">Chat With LegalMind AI</h2>
								<p className="mt-1 text-sm text-zinc-300">Ask legal questions and get AI-generated answers from your workspace context.</p>
								<ChatPanel
									messages={messages}
									question={question}
									setQuestion={setQuestion}
									onSubmit={handleSubmit}
									loading={loading}
								/>
							</div>

							<div className="rounded-2xl border border-white/25 bg-black/90 p-6 backdrop-blur">
								<h3 className="font-display text-lg font-semibold text-white">Answer Sources</h3>
								<p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-400">Referenced Clauses and Notes</p>
								<SourceList sources={sources} />
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

export default Chat;
