import React, { useState, useEffect } from 'react';

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
  descripcion: string;
}

interface Product {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would come from an API
    const mockServices: Service[] = [
      {
        id: 1,
        nombre: "Manicura Básica",
        duracion: 45,
        precio: 25000,
        descripcion: "Manicura con corte, limado, empuje de cutículas y esmalte básico"
      },
      {
        id: 2,
        nombre: "Manicura en Gel",
        duracion: 60,
        precio: 45000,
        descripcion: "Manicura con esmalte semi-permanente en gel"
      },
      {
        id: 3,
        nombre: "Uñas Acrílicas",
        duracion: 90,
        precio: 70000,
        descripcion: "Uñas postizas en acrílico con diseño opcional"
      },
      {
        id: 4,
        nombre: "Mantenimiento Acrílicas",
        duracion: 60,
        precio: 45000,
        descripcion: "Relleno y mantenimiento de uñas acrílicas"
      },
      {
        id: 5,
        nombre: "Polygel",
        duracion: 90,
        precio: 80000,
        descripcion: "Uñas semi-permanentes con técnica polygel"
      },
      {
        id: 6,
        nombre: "Pedicura Spa",
        duracion: 60,
        precio: 40000,
        descripcion: "Pedicura completa con hidratación y esmalte"
      }
    ];

    const mockProducts: Product[] = [
      {
        id: 1,
        nombre: "Esmaltes semipermanentes",
        precio: 18000,
        descripcion: "Esmalte semipermanente en diferentes colores"
      },
      {
        id: 2,
        nombre: "Aceite para cutículas",
        precio: 12000,
        descripcion: "Hidratante para cutículas con vitamina E"
      },
      {
        id: 3,
        nombre: "Crema hidratante",
        precio: 15000,
        descripcion: "Crema nutritiva para manos y uñas"
      },
      {
        id: 4,
        nombre: "Kit de cuidado",
        precio: 45000,
        descripcion: "Kit completo con todo lo necesario para el cuidado de manos y uñas"
      }
    ];

    setServices(mockServices);
    setProducts(mockProducts);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <p>Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-dark-text mb-12">Nuestros Servicios y Productos</h1>
      
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-dark-text mb-6 pb-2 border-b-2 border-accent-gold">Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-2">{service.nombre}</h3>
              <p className="text-gray-600 mb-4">{service.descripcion}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold text-accent-gold">${service.precio.toLocaleString()}</span>
                <span className="text-gray-500">{service.duracion} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold text-dark-text mb-6 pb-2 border-b-2 border-accent-gold">Productos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{product.nombre}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.descripcion}</p>
              <p className="text-lg font-bold text-accent-gold">${product.precio.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;