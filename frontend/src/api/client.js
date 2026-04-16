import axios from 'axios';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ENABLE_NETWORK_FALLBACK = !DEFAULT_BASE_URL.startsWith('/');
const FALLBACK_BASE_URLS = ENABLE_NETWORK_FALLBACK
	? Array.from(new Set([DEFAULT_BASE_URL, 'http://127.0.0.1:8000']))
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

export const askRagQuestion = async ({ question, top_k = 4, document_id = null }, token) => {
	const payload = { question, top_k };
	if (document_id) {
		payload.document_id = document_id;
	}

	const response = await requestWithFallback({
		method: 'post',
		url: '/rag/query',
		data: payload,
		headers: authHeaders(token),
	});
	return response.data;
};

export default api;
