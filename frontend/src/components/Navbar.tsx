import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2">
        <div className="bg-accent-gold w-10 h-10 rounded-full"></div>
        <span className="text-xl font-bold text-dark-text">NailArt Studio</span>
      </Link>
      
      <div className="hidden md:flex space-x-8">
        <Link to="/" className="text-dark-text hover:text-accent-gold transition-colors">Inicio</Link>
        <Link to="/services" className="text-dark-text hover:text-accent-gold transition-colors">Servicios</Link>
        <Link to="/appointment" className="text-dark-text hover:text-accent-gold transition-colors">Agendar Cita</Link>
        <Link to="/admin" className="text-dark-text hover:text-accent-gold transition-colors">Administrador</Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="bg-accent-gold text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors">
          <Link to="/appointment">Agendar</Link>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;