import axios from 'axios';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ENABLE_NETWORK_FALLBACK = !DEFAULT_BASE_URL.startsWith('/');
const FALLBACK_BASE_URLS = ENABLE_NETWORK_FALLBACK
	? Array.from(new Set([DEFAULT_BASE_URL, '/api']))
	: [DEFAULT_BASE_URL];

const api = axios.create({
	baseURL: DEFAULT_BASE_URL,
});

const authHeaders = (token) => {
	const value = (token || '').trim();
	if (!value || value === 'null' || value === 'undefined') {
		return {};
	}
	return { Authorization: `Bearer ${value}` };
};

const isNetworkError = (error) => !error?.response && (error?.message === 'Network Error' || error?.code === 'ECONNABORTED');

const requestWithFallback = async (config) => {
	try {
		return await api.request(config);
	} catch (error) {
		if (!ENABLE_NETWORK_FALLBACK || !isNetworkError(error)) {
			throw error;
		}

		for (const baseURL of FALLBACK_BASE_URLS) {
			if (baseURL === DEFAULT_BASE_URL) {
				continue;
			}
			try {
				return await axios.request({ ...config, baseURL });
			} catch (retryError) {
				if (!isNetworkError(retryError)) {
					throw retryError;
				}
			}
		}

		throw error;
	}
};

export const registerCompany = async (payload) => {
	const response = await requestWithFallback({ method: 'post', url: '/register', data: payload });
	return response.data;
};

export const loginCompany = async (payload) => {
	const response = await requestWithFallback({ method: 'post', url: '/login', data: payload });
	return response.data;
};

export const uploadDocument = async (file, token) => {
	const formData = new FormData();
	formData.append('file', file);
	const response = await requestWithFallback({
		method: 'post',
		url: '/upload',
		data: formData,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getDocuments = async (token) => {
	const response = await requestWithFallback({
		method: 'get',
		url: '/documents',
		headers: authHeaders(token),
	});
	return response.data;
};

export const agentQuery = async (
	{ message, top_k = 4, document_id = null, leave_draft = null },
	token
) => {
	const payload = { message, top_k, document_id, leave_draft };
	const response = await requestWithFallback({
		method: 'post',
		url: '/agent/query',
		data: payload,
		headers: authHeaders(token),
	});
	return response.data;
};

export const getLeaveRequests = async (token) => {
	const response = await requestWithFallback({
		method: 'get',
		url: '/leave/requests',
		headers: authHeaders(token),
	});
	return response.data;
};

export const getOpenVacancies = async () => {
	const response = await requestWithFallback({ method: 'get', url: '/vacancies/open' });
	return response.data;
};

export const getVacancyDetail = async (vacancyId) => {
	const response = await requestWithFallback({ method: 'get', url: `/vacancies/open/${vacancyId}` });
	return response.data;
};

export const applyToVacancy = async (vacancyId, { candidate_name, candidate_email, candidate_phone, file }) => {
	const formData = new FormData();
	formData.append('candidate_name', candidate_name);
	formData.append('candidate_email', candidate_email);
	formData.append('candidate_phone', candidate_phone || '');
	formData.append('file', file);
	const response = await requestWithFallback({ method: 'post', url: `/vacancies/${vacancyId}/apply`, data: formData });
	return response.data;
};

export const createVacancy = async (fields, posterFile, token) => {
	const formData = new FormData();
	Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
	if (posterFile) {
		formData.append('poster', posterFile);
	}
	const response = await requestWithFallback({
		method: 'post',
		url: '/vacancies',
		data: formData,
		headers: authHeaders(token),
	});
	return response.data;
};

export const getMyVacancies = async (token) => {
	const response = await requestWithFallback({ method: 'get', url: '/vacancies', headers: authHeaders(token) });
	return response.data;
};

export const updateVacancyStatus = async (vacancyId, status, token) => {
	const formData = new FormData();
	formData.append('status', status);
	const response = await requestWithFallback({
		method: 'patch',
		url: `/vacancies/${vacancyId}/status`,
		data: formData,
		headers: authHeaders(token),
	});
	return response.data;
};

export const getVacancyApplications = async (vacancyId, token) => {
	const response = await requestWithFallback({
		method: 'get',
		url: `/vacancies/${vacancyId}/applications`,
		headers: authHeaders(token),
	});
	return response.data;
};

export const rankVacancyApplications = async (vacancyId, token) => {
	const response = await requestWithFallback({
		method: 'post',
		url: `/vacancies/${vacancyId}/rank`,
		headers: authHeaders(token),
	});
	return response.data;
};

export default api;
