function formatDate(dateValue) {
	if (!dateValue) {
		return '-';
	}

	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}
	return date.toLocaleString();
}

function formatFileType(fileName) {
	if (!fileName || typeof fileName !== 'string') {
		return 'PDF';
	}

	const extension = fileName.split('.').pop()?.toUpperCase();
	return extension || 'PDF';
}

function DocumentTable({ documents }) {
	if (!documents || documents.length === 0) {
		return <p className="mt-3 rounded-xl border border-white/20 bg-white/5 p-4 text-sm text-zinc-300">No uploaded PDFs yet.</p>;
	}

	return (
		<div className="mt-3 grid gap-3">
			{documents.map((document) => (
				<article
					key={document.id}
					className="flex flex-col gap-3 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 transition hover:border-white/35 hover:bg-white/[0.08] sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="flex min-w-0 items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-[10px] font-bold tracking-[0.12em] text-zinc-100">
							{formatFileType(document.file_name)}
						</span>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-zinc-100">{document.file_name}</p>
							<p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Document Uploaded</p>
						</div>
					</div>

					<div className="flex items-center gap-2 text-xs text-zinc-300 sm:text-sm">
						<span className="inline-block h-2 w-2 rounded-full bg-white/75" />
						<span>{formatDate(document.uploaded_at)}</span>
					</div>
				</article>
			))}
		</div>
	);
}

export default DocumentTable;
