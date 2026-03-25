function ChatPanel({ messages, question, setQuestion, onSubmit, loading }) {
	return (
		<div className="mt-4 grid gap-3">
			<div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
				{messages.map((message, index) => (
					<div
						key={`${message.role}-${index}`}
						className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
							message.role === 'user'
								? 'justify-self-end bg-blue-600 text-white'
								: 'bg-blue-50 text-slate-700'
						}`}
					>
						{message.text}
					</div>
				))}
			</div>

			<form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
				<input
					className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
					type="text"
					placeholder="Ask about clauses, compliance, or obligations..."
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
				/>
				<button
					className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
					type="submit"
					disabled={loading}
				>
					{loading ? 'Thinking...' : 'Send'}
				</button>
			</form>
		</div>
	);
}

export default ChatPanel;
