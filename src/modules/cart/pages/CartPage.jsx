import React, { useState } from 'react';
import Button from '../../shared/components/Button';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../auth/components/LoginForm';
import useAuth from '../../auth/hook/useAuth';
import useCart from '../../cart/hooks/useCart';

import { instance } from '../../shared/api/axiosInstance';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-2xl relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold">
        &times;
      </button>
      {children}
    </div>
  </div>
);

const CartPage = () => {

  const { cart, removeItem, clear, total: subtotal } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const SHIPPING = 8;
  const total = subtotal + SHIPPING;

  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleCheckout = () => {
    if (!cart.length) return alert('Tu carrito está vacío.');

    if (!isAuthenticated) return setIsModalOpen(true);

    sendOrder();
  };

  // --- LÓGICA DE API Y ENVÍO DE ORDEN ---
  const sendOrder = async () => {
    if (!cart.length) {
      alert('Tu carrito está vacío.');
      return;
    }

    // Obtener customerId directamente desde el usuario autenticado
    const customerId = user?.customerId || localStorage.getItem('customerId');

    if (!customerId) {
      alert('Debes iniciar sesión para realizar la compra.');
      setIsModalOpen(true);
      return;
    }

    // Validaciones básicas de direcciones
    if (!shippingAddress || !billingAddress) {
      alert('Por favor completa dirección de envío y de facturación.');
      return;
    }

    // Construir payload acorde al DTO del backend (OrderRequest y OrderItemModel)
    const orderData = {
      customerId: customerId,
      ShippingAddress: shippingAddress,
      BillingAddress: billingAddress,
      Notes: notes || '',
      OrderItems: cart.map((item) => ({
        productId: item.id,
        Quantity: Number(item.quantity) || 1,
      })),
    };

    try {
      // Realizar la llamada mediante axiosInstance (ruta relativa con proxy y auth header)
      await instance.post('/api/orders', orderData);

      alert('¡Compra finalizada con éxito! Orden creada.');

      localStorage.removeItem('cart');
      clear();
      window.dispatchEvent(new Event('cartUpdated'));

      navigate('/');
    } catch (error) {
      console.error('Error al crear la orden:', error);
      const resData = error.response?.data;
      
      // Si el backend devuelve errores de validación (ValidationProblemDetails)
      let validationMessage = '';
      if (resData?.errors && typeof resData.errors === 'object') {
        validationMessage = Object.values(resData.errors).flat().join(' | ');
      }

      const message = validationMessage || resData?.message || resData?.Message || resData?.error || error.message || 'Error al procesar la compra';
      alert(`Error al procesar la compra: ${message}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">

      {/* HEADER COMPARTIDO */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tu Carrito</h1>
        <button
          onClick={() => navigate(-1)}
          className="ml-2 px-5 py-2 min-w-[140px]
                        rounded-full bg-white border border-purple-600 text-purple-600
                         font-semibold hover:bg-purple-600 hover:text-white transition-shadow"
        >
          Volver
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="bg-gray-100 p-8 text-center rounded-xl shadow-inner">
          <p className="text-xl text-gray-600">Tu carrito está vacío.</p>
        </div>
      ) : (
        <>
          {/* ------------------------------ */}
          {/* DESKTOP LAYOUT (md y más) */}
          {/* ------------------------------ */}
          <div className="hidden md:grid grid-cols-3 gap-8">

            {/* LISTA DE PRODUCTOS */}
            <div className="col-span-2 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold block">{item.name}</span>
                      <span className="text-gray-600 text-sm">Cantidad: {item.quantity}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xl text-purple-700 block">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700 text-sm mt-1"
                        onClick={() => removeItem(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN DESKTOP */}
            <div className="col-span-1 p-6 bg-white rounded-xl shadow-md border h-fit">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Resumen</h2>

              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>${SHIPPING.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-3 border-t text-2xl font-extrabold text-purple-600">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label>Dirección de envío</label>
                <input className="w-full p-2 border rounded" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />

                <label>Dirección de facturación</label>
                <input className="w-full p-2 border rounded" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} />

                <label>Notas</label>
                <textarea className="w-full p-2 border rounded" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full"
                onClick={handleCheckout}>
                Finalizar Compra
              </Button>
            </div>

          </div>

          {/* ------------------------------ */}
          {/* MOBILE LAYOUT (solo móviles) */}
          {/* ------------------------------ */}
          <div className="md:hidden space-y-6">

            {/* LISTA MOBILE */}
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-semibold block">{item.name}</span>
                      <span className="text-gray-600 text-sm">Cant: {item.quantity}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-lg text-purple-700 block">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700 text-sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN MOBILE */}
            <div className="p-4 bg-white rounded-xl shadow-md border">
              <h2 className="text-xl font-bold mb-3 border-b pb-2">Resumen</h2>

              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>${SHIPPING.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-2 border-t text-xl font-bold text-purple-600">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Inputs mobile */}
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Dirección de envío"
                  className="w-full p-2 border rounded"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                />

                <input
                  placeholder="Dirección de facturación"
                  className="w-full p-2 border rounded"
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                />

                <textarea
                  placeholder="Notas"
                  className="w-full p-2 border rounded"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full"
                onClick={handleCheckout}>
                Finalizar Compra
              </Button>
            </div>

          </div>
        </>
      )}

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2 className="text-2xl font-bold mb-4 text-center">Inicia Sesión</h2>
          <LoginForm onSuccess={() => { setIsModalOpen(false); sendOrder(); }} />
        </Modal>
      )}

    </div>
  );
};

export default CartPage;
