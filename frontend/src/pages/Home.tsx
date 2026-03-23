import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-dark-text mb-6">Bienvenida a NailArt Studio</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          Disfruta de nuestros servicios de manicura y uñas acrílicas de primera calidad. 
          Reserva tu cita hoy y déjanos cuidar de tus uñas.
        </p>
        <Link 
          to="/appointment" 
          className="bg-accent-gold text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors"
        >
          Agendar Cita Ahora
        </Link>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center text-dark-text mb-12">Nuestros Servicios Destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Service cards */}
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Manicura Básica</h3>
            <p className="text-gray-600 mb-4">Corte, limado, empuje de cutículas y esmalte básico</p>
            <p className="text-lg font-bold text-accent-gold">$25.000</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Manicura en Gel</h3>
            <p className="text-gray-600 mb-4">Esmalte semi-permanente en gel con larga duración</p>
            <p className="text-lg font-bold text-accent-gold">$45.000</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Uñas Acrílicas</h3>
            <p className="text-gray-600 mb-4">Uñas postizas en acrílico con diseño opcional</p>
            <p className="text-lg font-bold text-accent-gold">$70.000</p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white rounded-2xl shadow-lg p-8 my-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-dark-text mb-6">¿Por qué elegirnos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Profesionales Calificados</h3>
              <p className="text-gray-600">Nuestro equipo tiene años de experiencia en manicura y uñas acrílicas</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Productos de Calidad</h3>
              <p className="text-gray-600">Usamos solo productos de alta calidad para el cuidado de tus uñas</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ambiente Relajante</h3>
              <p className="text-gray-600">Disfruta de una experiencia relajante en nuestro elegante espacio</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;