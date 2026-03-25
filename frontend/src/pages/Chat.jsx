import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';
import SourceList from '../components/SourceList';

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
		<div className="relative flex min-h-screen justify-center overflow-hidden px-6 py-8">
			<div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[2fr_1fr]">
				<div className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-glass backdrop-blur">
					<p className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Public Chat</p>
					<h2 className="mt-2 text-3xl font-bold text-slate-900">Ask Legal Questions</h2>
					<p className="mt-1 text-sm text-slate-500">Modern chat experience ready for RAG + multi-agent answers.</p>
					<ChatPanel
						messages={messages}
						question={question}
						setQuestion={setQuestion}
						onSubmit={handleSubmit}
						loading={loading}
					/>
				</div>

				<div className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-glass backdrop-blur">
					<h3 className="text-lg font-semibold text-slate-900">Sources</h3>
					<SourceList sources={sources} />
				</div>
			</div>
		</div>
	);
}

export default Chat;
