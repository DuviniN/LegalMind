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
		return <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">No uploaded PDFs yet.</p>;
	}

	return (
		<div className="mt-3 grid gap-3">
			{documents.map((document) => (
				<article
					key={document.id}
					className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50 sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="flex min-w-0 items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 text-[10px] font-bold tracking-[0.12em] text-white">
							{formatFileType(document.file_name)}
						</span>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-slate-900">{document.file_name}</p>
							<p className="text-xs uppercase tracking-[0.12em] text-blue-700">Document Uploaded</p>
						</div>
					</div>

					<div className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">
						<span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
						<span>{formatDate(document.uploaded_at)}</span>
					</div>
				</article>
			))}
		</div>
	);
}

export default DocumentTable;
