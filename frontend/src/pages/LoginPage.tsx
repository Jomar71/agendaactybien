import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would be an API call to authenticate the user
    // For now, we'll simulate a successful login with demo credentials
    if (email === 'admin@nailartstudio.com' && password === 'admin123') {
      // Store a fake token in localStorage
      localStorage.setItem('token', 'fake-jwt-token-for-demo');
      navigate('/admin');
    } else {
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-pink p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-accent-gold w-16 h-16 rounded-full mb-4"></div>
          <h1 className="text-2xl font-bold text-dark-text">Iniciar Sesión</h1>
          <p className="text-gray-600">Accede al panel de administración</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold"
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-accent-gold text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Ingresar
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Para fines de demostración, usa:</p>
          <p>Correo: admin@nailartstudio.com</p>
          <p>Contraseña: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;