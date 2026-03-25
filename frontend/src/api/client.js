import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
});

export const registerCompany = async (payload) => {
	const response = await api.post('/register', payload);
	return response.data;
};

export const loginCompany = async (payload) => {
	const response = await api.post('/login', payload);
	return response.data;
};

export const uploadDocument = async (file, token) => {
	const formData = new FormData();
	formData.append('file', file);
	const response = await api.post('/upload', formData, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getDocuments = async (token) => {
	const response = await api.get('/documents', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export default api;
