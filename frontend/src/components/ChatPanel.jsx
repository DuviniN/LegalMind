function ChatPanel({ messages, question, setQuestion, onSubmit, loading }) {
	return (
		<div className="mt-4 grid gap-3">
			<div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1">
				{messages.map((message, index) => (
					<div
						key={`${message.role}-${index}`}
						className={`max-w-[88%] rounded-xl border px-3 py-2 text-sm leading-relaxed ${
							message.role === 'user'
								? 'justify-self-end border-blue-600 bg-blue-600 text-white'
								: 'border-blue-100 bg-blue-50 text-slate-700'
						}`}
					>
						{message.text}
					</div>
				))}
			</div>

			<form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
				<input
					className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
					type="text"
					placeholder="Ask about clauses, compliance, or obligations..."
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
				/>
				<button
					className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
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
