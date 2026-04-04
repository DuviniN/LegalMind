function SourceList({ sources }) {
	if (!sources || sources.length === 0) {
		return <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">Sources will appear here after asking a question.</p>;
	}

	return (
		<ul className="mt-3 grid gap-2 text-sm text-slate-700">
			{sources.map((source, index) => (
				<li key={`${source}-${index}`} className="rounded-lg border border-blue-100 bg-white px-3 py-2">
					{source}
				</li>
			))}
		</ul>
	);
}

export default SourceList;
