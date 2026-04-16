import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';

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
				<Route
					path="/chat"
					element={
						<ProtectedRoute>
							<Chat />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/admin-dashboard"
					element={
						<ProtectedRoute>
							<AdminDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/documents"
					element={
						<ProtectedRoute>
							<AdminDashboard />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
