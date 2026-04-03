function SourceList({ sources }) {
	if (!sources || sources.length === 0) {
		return <p className="mt-3 rounded-xl border border-white/20 bg-white/5 p-4 text-sm text-zinc-300">Sources will appear here after asking a question.</p>;
	}

	return (
		<ul className="mt-3 grid gap-2 text-sm text-zinc-200">
			{sources.map((source, index) => (
				<li key={`${source}-${index}`} className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
					{source}
				</li>
			))}
		</ul>
	);
}

export default SourceList;
