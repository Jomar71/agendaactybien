import React, { useState } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

const AppointmentPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [clientData, setClientData] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'transferencia' | null>(null);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [step, setStep] = useState(1); // 1: date/time, 2: service, 3: client info, 4: payment
  
  const services: Service[] = [
    { id: 1, nombre: "Manicura Básica", duracion: 45, precio: 25000 },
    { id: 2, nombre: "Manicura en Gel", duracion: 60, precio: 45000 },
    { id: 3, nombre: "Uñas Acrílicas", duracion: 90, precio: 70000 },
    { id: 4, nombre: "Mantenimiento Acrílicas", duracion: 60, precio: 45000 },
    { id: 5, nombre: "Polygel", duracion: 90, precio: 80000 },
    { id: 6, nombre: "Pedicura Spa", duracion: 60, precio: 40000 }
  ];

  // Generate available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }).map((_, i) => addDays(new Date(), i));

  // Generate available times (9AM to 7PM in 30-min slots)
  const availableTimes = [];
  for (let hour = 9; hour <= 18; hour++) {
    availableTimes.push(`${hour}:00`);
    if (hour < 18) {
      availableTimes.push(`${hour}:30`);
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit appointment
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    alert('¡Cita agendada exitosamente! Recibirá un correo de confirmación.');
    // Here you would typically send the data to your backend
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofOfPayment(e.target.files[0]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center text-dark-text mb-8">Agendar Cita</h1>
      
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute top-1/2 left-0 h-1 bg-gray-200 w-full -translate-y-1/2"></div>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= num ? 'bg-accent-gold text-white' : 'bg-white border-2 border-gray-300'
            }`}>
              {num}
            </div>
            <span className={`mt-2 text-sm ${
              step >= num ? 'text-accent-gold font-medium' : 'text-gray-500'
            }`}>
              {num === 1 && 'Fecha/Hora'}
              {num === 2 && 'Servicio'}
              {num === 3 && 'Cliente'}
              {num === 4 && 'Pago'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Date and Time Selection */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">Selecciona Fecha y Hora</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-4">Fecha</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availableDates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`py-2 px-1 text-sm rounded-lg border ${
                      selectedDate && isSameDay(date, selectedDate)
                        ? 'bg-accent-gold text-white border-accent-gold'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {format(date, 'EEE dd/MM', { locale: es })}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Hora</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimes.map((time, index) => (
                  <button
                    key={index}
                    disabled={!selectedDate}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-1 text-sm rounded-lg border ${
                      selectedTime === time
                        ? 'bg-accent-gold text-white border-accent-gold'
                        : selectedDate
                          ? 'border-gray-300 hover:bg-gray-100'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Service Selection */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">Selecciona un Servicio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedService === service.id
                    ? 'border-accent-gold bg-accent-gold bg-opacity-10'
                    : 'border-gray-300 hover:border-accent-gold'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{service.nombre}</h3>
                  <span className="font-bold text-accent-gold">${service.precio.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{service.duracion} minutos</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Client Information */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">Información del Cliente</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                value={clientData.nombre}
                onChange={(e) => setClientData({...clientData, nombre: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold"
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                value={clientData.telefono}
                onChange={(e) => setClientData({...clientData, telefono: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold"
                placeholder="Número de contacto"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({...clientData, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold"
                placeholder="tu@email.com"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Payment Information */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => setPaymentMethod('nequi')}
                className={`p-4 border rounded-lg cursor-pointer ${
                  paymentMethod === 'nequi'
                    ? 'border-accent-gold bg-accent-gold bg-opacity-10'
                    : 'border-gray-300 hover:border-accent-gold'
                }`}
              >
                <h3 className="font-medium">Nequi</h3>
                <p className="text-sm text-gray-600 mt-1">3012345678</p>
              </div>
              
              <div
                onClick={() => setPaymentMethod('transferencia')}
                className={`p-4 border rounded-lg cursor-pointer ${
                  paymentMethod === 'transferencia'
                    ? 'border-accent-gold bg-accent-gold bg-opacity-10'
                    : 'border-gray-300 hover:border-accent-gold'
                }`}
              >
                <h3 className="font-medium">Transferencia Bancaria</h3>
                <p className="text-sm text-gray-600 mt-1">Bancolombia Ahorros: 123456789</p>
                <p className="text-sm text-gray-600">A nombre de: NailArt Studio</p>
              </div>
            </div>
            
            {paymentMethod && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Realiza el pago del 30% para confirmar</h3>
                {selectedService && (
                  <p className="text-lg font-bold text-accent-gold mb-4">
                    Abono: ${(services.find(s => s.id === selectedService)?.precio! * 0.3).toLocaleString()}
                  </p>
                )}
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Sube el comprobante de pago</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    <strong>Importante:</strong> Tu cita quedará pendiente de confirmación hasta que se verifique tu pago.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className={`px-6 py-2 rounded-full ${
            step === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Anterior
        </button>
        
        <button
          onClick={handleNext}
          disabled={
            (step === 1 && (!selectedDate || !selectedTime)) ||
            (step === 2 && !selectedService) ||
            (step === 3 && (!clientData.nombre || !clientData.telefono || !clientData.email)) ||
            (step === 4 && !paymentMethod)
          }
          className={`px-6 py-2 rounded-full text-white ${
            (step === 1 && (!selectedDate || !selectedTime)) ||
            (step === 2 && !selectedService) ||
            (step === 3 && (!clientData.nombre || !clientData.telefono || !clientData.email)) ||
            (step === 4 && !paymentMethod)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-accent-gold hover:bg-opacity-90'
          }`}
        >
          {step === 4 ? 'Confirmar Cita' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

export default AppointmentPage;