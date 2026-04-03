import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Document from './pages/Document';
import Chat from './pages/Chat';
import Landing from './pages/Landing';

function ProtectedRoute({ children }) {
	const token = localStorage.getItem('auth_token');
	if (!token) {
		return <Navigate to="/login" replace />;
	}
	return children;
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/register" element={<Register />} />
				<Route path="/login" element={<Login />} />
				<Route path="/chat" element={<Chat />} />
				<Route
					path="/documents"
					element={
						<ProtectedRoute>
							<Document />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
