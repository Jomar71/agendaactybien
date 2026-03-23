import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Appointment {
  id: number;
  client_name: string;
  service_name: string;
  fecha: string;
  hora: string;
  estado: string;
  pago_estado: string;
}

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
  descripcion: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'products' | 'clients'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({ 
    nombre: '', 
    duracion: 30, 
    precio: 0, 
    descripcion: '' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an API
    const mockAppointments: Appointment[] = [
      { id: 1, client_name: "María López", service_name: "Uñas Acrílicas", fecha: "2023-06-15", hora: "10:00", estado: "confirmada", pago_estado: "confirmado" },
      { id: 2, client_name: "Ana Martínez", service_name: "Manicura en Gel", fecha: "2023-06-15", hora: "11:30", estado: "pendiente", pago_estado: "pendiente" },
      { id: 3, client_name: "Carla Rodríguez", service_name: "Pedicura Spa", fecha: "2023-06-16", hora: "09:00", estado: "confirmada", pago_estado: "confirmado" },
      { id: 4, client_name: "Sofía Gómez", service_name: "Polygel", fecha: "2023-06-16", hora: "14:00", estado: "cancelada", pago_estado: "rechazado" },
    ];
    
    const mockServices: Service[] = [
      { id: 1, nombre: "Manicura Básica", duracion: 45, precio: 25000, descripcion: "Manicura con corte, limado, empuje de cutículas y esmalte básico" },
      { id: 2, nombre: "Manicura en Gel", duracion: 60, precio: 45000, descripcion: "Manicura con esmalte semi-permanente en gel" },
      { id: 3, nombre: "Uñas Acrílicas", duracion: 90, precio: 70000, descripcion: "Uñas postizas en acrílico con diseño opcional" },
    ];
    
    setAppointments(mockAppointments);
    setServices(mockServices);
    setLoading(false);
  }, []);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceToAdd: Service = {
      ...newService,
      id: services.length + 1
    };
    setServices([...services, serviceToAdd]);
    setNewService({ nombre: '', duracion: 30, precio: 0, descripcion: '' });
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? {...appt, estado: newStatus} : appt
    ));
  };

  const handleUpdatePaymentStatus = (id: number, newStatus: string) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? {...appt, pago_estado: newStatus} : appt
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark-text mb-8">Panel de Administración</h1>
      
      <div className="flex flex-wrap border-b mb-8">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'appointments'
              ? 'border-b-2 border-accent-gold text-accent-gold'
              : 'text-gray-600 hover:text-accent-gold'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          Citas
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'services'
              ? 'border-b-2 border-accent-gold text-accent-gold'
              : 'text-gray-600 hover:text-accent-gold'
          }`}
          onClick={() => setActiveTab('services')}
        >
          Servicios
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'products'
              ? 'border-b-2 border-accent-gold text-accent-gold'
              : 'text-gray-600 hover:text-accent-gold'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Productos
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'clients'
              ? 'border-b-2 border-accent-gold text-accent-gold'
              : 'text-gray-600 hover:text-accent-gold'
          }`}
          onClick={() => setActiveTab('clients')}
        >
          Clientes
        </button>
      </div>
      
      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Citas Agendadas</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{appointment.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{appointment.service_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{appointment.fecha} a las {appointment.hora}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                          appointment.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={appointment.pago_estado}
                          onChange={(e) => handleUpdatePaymentStatus(appointment.id, e.target.value)}
                          className="text-xs rounded border-gray-300 focus:border-accent-gold focus:ring-accent-gold"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={appointment.estado}
                          onChange={(e) => handleUpdateStatus(appointment.id, e.target.value)}
                          className="text-xs rounded border-gray-300 focus:border-accent-gold focus:ring-accent-gold mr-2"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Agregar Nuevo Servicio</h2>
            <form onSubmit={handleAddService}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newService.nombre}
                  onChange={(e) => setNewService({...newService, nombre: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Duración (minutos)</label>
                <input
                  type="number"
                  value={newService.duracion}
                  onChange={(e) => setNewService({...newService, duracion: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Precio ($)</label>
                <input
                  type="number"
                  value={newService.precio}
                  onChange={(e) => setNewService({...newService, precio: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={newService.descripcion}
                  onChange={(e) => setNewService({...newService, descripcion: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-accent-gold text-white py-2 rounded-lg font-medium hover:bg-opacity-90"
              >
                Agregar Servicio
              </button>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Lista de Servicios</h2>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{service.nombre}</h3>
                    <span className="font-bold text-accent-gold">${service.precio.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{service.duracion} minutos</p>
                  <p className="text-sm text-gray-700 mt-2">{service.descripcion}</p>
                  <div className="mt-3 flex space-x-2">
                    <button className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
                      Editar
                    </button>
                    <button className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Gestión de Productos</h2>
          <p className="text-gray-600">Aquí podrías agregar funcionalidades para gestionar productos...</p>
        </div>
      )}
      
      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Lista de Clientes</h2>
          <p className="text-gray-600">Aquí podrías agregar funcionalidades para gestionar clientes...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;