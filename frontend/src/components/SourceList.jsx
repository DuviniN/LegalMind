function SourceList({ sources }) {
	if (!sources || sources.length === 0) {
		return <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Sources will appear here after asking a question.</p>;
	}

	return (
		<ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-slate-700">
			{sources.map((source, index) => (
				<li key={`${source}-${index}`}>
					{source}
				</li>
			))}
		</ul>
	);
}

export default SourceList;
