function ChatPanel({ messages, question, setQuestion, onSubmit, loading }) {
	return (
		<div className="mt-4 grid gap-3">
			<div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1">
				{messages.map((message, index) => (
					<div
						key={`${message.role}-${index}`}
						className={`max-w-[88%] rounded-xl border px-3 py-2 text-sm leading-relaxed ${
							message.role === 'user'
								? 'justify-self-end border-white bg-white text-black'
								: 'border-white/25 bg-white/10 text-zinc-100'
						}`}
					>
						{message.text}
					</div>
				))}
			</div>

			<form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
				<input
					className="rounded-xl border border-white/30 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
					type="text"
					placeholder="Ask about clauses, compliance, or obligations..."
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
				/>
				<button
					className="rounded-xl border-2 border-white bg-white px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
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
