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

function DocumentTable({ documents }) {
	if (!documents || documents.length === 0) {
		return <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No uploaded PDFs yet.</p>;
	}

	return (
		<div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
			<table className="min-w-full border-collapse text-left text-sm">
				<thead>
					<tr>
						<th className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">File Name</th>
						<th className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">Uploaded Time</th>
					</tr>
				</thead>
				<tbody>
					{documents.map((document) => (
						<tr key={document.id} className="hover:bg-slate-50">
							<td className="border-b border-slate-100 px-3 py-2 text-slate-700">{document.file_name}</td>
							<td className="border-b border-slate-100 px-3 py-2 text-slate-600">{formatDate(document.uploaded_at)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default DocumentTable;
