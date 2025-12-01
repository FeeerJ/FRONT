import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../../auth/pages/LoginPage'; // Asumimos que esta es la página/formulario de login
import useAuth from '../../auth/hook/useAuth'; // Hook para el estado de autenticación (isAuthenticated)

// Componente Placeholder para el Modal (debe ser implementado en shared/components/Modal.jsx)
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
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Obtener el estado de autenticación
    const { isAuthenticated, user } = useAuth();

    // Costo fijo de envío (ejemplo)
    const SHIPPING_COST = 8.0;

    // Direcciones y notas para crear la orden
    const [shippingAddress, setShippingAddress] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [notes, setNotes] = useState('');

    // Carga inicial del carrito desde localStorage (key 'cart') y escucha actualizaciones
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                console.error('Error al parsear el carrito de localStorage:', e);
                setCart([]);
            }
        }

        // Escuchar eventos de actualización del carrito (ej. cuando cambia sesión)
        const onCartUpdated = () => {
            const c = localStorage.getItem('cart');
            if (!c) {
                setCart([]);
                return;
            }
            try {
                setCart(JSON.parse(c));
            } catch (e) {
                console.error('Error parsing cart on cartUpdated', e);
                setCart([]);
            }
        };
        window.addEventListener('cartUpdated', onCartUpdated);

        return () => {
            window.removeEventListener('cartUpdated', onCartUpdated);
        };
    }, []);

    // --- CÁLCULOS ---
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal + SHIPPING_COST;

    // --- LÓGICA DE API Y ENVÍO DE ORDEN ---
    const sendOrder = async () => {
        if (!cart.length) {
            alert('Tu carrito está vacío.');
            return;
        }

        // Obtener customerId desde user o localStorage (fallback)
        let customerId = user?.customerId || localStorage.getItem('customerId');
        const username = user?.username || localStorage.getItem('username');
        console.debug('[Cart] sendOrder: initial customerId=', customerId, 'username=', username);

        // Base URL para la API (usar VITE_BACKEND_URL cuando esté configurado)
        const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

        // Si no tenemos customerId pero sí username, intentamos resolverlo contra API (rutas comunes)
        const tryResolveCustomerId = async (usernameToResolve, token) => {
            if (!usernameToResolve) return null;
            const attempts = [
                `/api/customers/username/${encodeURIComponent(usernameToResolve)}`,
                `/api/customers/by-username/${encodeURIComponent(usernameToResolve)}`,
                `/api/customers?username=${encodeURIComponent(usernameToResolve)}`,
            ];
            for (const path of attempts) {
                try {
                    const fullUrl = apiBase ? `${apiBase}${path}` : path;
                    console.debug('[Cart] resolving customerId via', fullUrl);
                    const res = await fetch(fullUrl, {
                        headers: { Authorization: token ? `Bearer ${token}` : '' },
                    });
                    if (!res.ok) continue;
                    const data = await res.json();
                    if (data) {
                        if (data.id) return data.id;
                        if (data.customerId) return data.customerId;
                        if (Array.isArray(data) && data.length && (data[0].id || data[0].customerId)) {
                            return data[0].id || data[0].customerId;
                        }
                    }
                } catch (e) {
                    console.debug('[Cart] resolve attempt failed', e);
                    continue;
                }
            }
            return null;
        };

        if (!customerId) {
            if (username) {
                const token = user?.token || localStorage.getItem('token');
                const resolved = await tryResolveCustomerId(username, token);
                console.debug('[Cart] resolved customerId=', resolved);
                if (resolved) {
                    customerId = resolved;
                    try {
                        localStorage.setItem('customerId', customerId);
                    } catch (e) {}
                }
            }
            if (!customerId) {
                alert('Debes iniciar sesión con un usuario que tenga customerId válido en el sistema o configurar el backend para devolverlo.');
                return;
            }
        }

        // Validaciones básicas de direcciones
        if (!shippingAddress || !billingAddress) {
            alert('Por favor completa dirección de envío y de facturación.');
            return;
        }

        // Construir payload acorde al DTO del backend (OrderModel.OrderRequest)
        const orderData = {
            customerId: customerId,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress,
            notes: notes || '',
            orderItems: cart.map((item) => ({ productoId: item.id, quantity: item.quantity })),
        };

        console.debug('[Cart] FINAL orderData eviada al backend:', orderData);

        try {
            const ordersUrl = apiBase ? `${apiBase}/api/orders` : '/api/orders';
            const headers = {
                'Content-Type': 'application/json',
                Authorization: isAuthenticated && user?.token ? `Bearer ${user.token}` : '',
            };
            console.debug('[Cart] sending order to', ordersUrl, orderData);
            console.debug('[Cart] request headers', headers);

            const response = await fetch(ordersUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData),
            });

            console.debug('[Cart] order response status', response.status, 'url', response.url);

            if (response.status === 201) {
                const created = await response.json().catch(() => null);
                alert('¡Compra finalizada con éxito! Orden creada.');
                localStorage.removeItem('cart');
                setCart([]);
                if (created?.id) {
                    // navigate(`/orders/${created.id}`);
                }
            } else {
                let text = null;
                try {
                    text = await response.text();
                } catch (e) {
                    text = null;
                }
                let parsed = null;
                try {
                    parsed = text ? JSON.parse(text) : null;
                } catch (e) {
                    parsed = null;
                }
                console.error('[Cart] order failed', { status: response.status, url: response.url, bodyText: text, bodyJson: parsed });
                const message = parsed?.Message || parsed?.message || text || 'Error desconocido';

                // Caso común: backend devuelve que el CustomerId no existe
                if (typeof message === 'string' && message.includes('Cliente con ID')) {
                    // Extraer GUID si está presente
                    const m = message.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
                    const missingId = m ? m[0] : null;
                    console.warn('[Cart] backend reports missing customer:', missingId);
                    alert(`No se pudo crear la orden porque el cliente asociado no existe en el servidor.\n${message}\n\nSolución recomendada: crea el registro de cliente correspondiente en el backend (Customer) o ajusta el servicio de login/registro para crear el Customer automáticamente. CustomerId: ${missingId || 'desconocido'}`);
                } else {
                    alert(`Error al procesar la compra: ${message}`);
                }
            }
        } catch (error) {
            console.error('Error en la solicitud de orden (network):', error);
            alert('Error de conexión con el servidor de órdenes. Revisa la consola para más detalles.');
        }
    };
    
    // Función llamada si el login DENTRO del modal es exitoso
    const handleLoginSuccess = () => {
        setIsModalOpen(false); // 1. Cierra el modal
        // 2. Envía la orden automáticamente después del login exitoso
        sendOrder(); 
    };

    // Función que inicia el flujo de Finalizar Compra
    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        if (isAuthenticated) {
            // Usuario ya logeado: enviar la orden directamente
            sendOrder(); 
        } else {
            // Usuario no logeado: abrir modal de login
            setIsModalOpen(true); 
        }
    };

    // Función para simular la eliminación de un artículo del carrito
    const handleRemoveItem = (id) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    // --- RENDERIZADO ---

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Tu Carrito de Compras</h1>
                <Button
                    onClick={() => navigate(-1)}
                    className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                >
                    Volver al catálogo
                </Button>
            </div>

            {cart.length === 0 ? (
                <div className="bg-gray-100 p-8 text-center rounded-xl shadow-inner">
                    <p className="text-xl text-gray-600">Tu carrito está vacío. ¡Añade productos para empezar!</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 gap-8">
                    
                    {/* Columna de Items (2/3) */}
                    <div className="md:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                                <span className="font-semibold text-lg">{item.name}</span>
                                <div className="flex items-center space-x-6">
                                    <span className="text-gray-600">Cant: {item.quantity}</span>
                                    <span className="font-extrabold text-xl text-purple-700">${(item.price * item.quantity).toFixed(2)}</span>
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-red-500 hover:text-red-700 transition"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Columna de Resumen (1/3) */}
                    <div className="md:col-span-1 p-6 bg-white rounded-xl shadow-lg h-fit">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">Resumen de la Orden</h2>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Envío:</span>
                                <span className="font-medium">${SHIPPING_COST.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t text-2xl font-extrabold text-purple-600">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                            {/* Direcciones y notas */}
                            <div className="mt-4 space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Dirección de envío</label>
                                <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Calle, número, ciudad" />

                                <label className="block text-sm font-medium text-gray-700">Dirección de facturación</label>
                                <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Calle, número, ciudad" />

                                <label className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Instrucciones adicionales" rows={3} />
                            </div>

                            <Button 
                                onClick={handleCheckout} 
                                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full font-semibold"
                            >
                                Finalizar Compra
                            </Button>
                    </div>
                </div>
            )}
            
            {/* Modal de Login */}
            {isModalOpen && (
                <Modal onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-2xl font-bold mb-4 text-center">Inicia Sesión</h2>
                    <LoginPage onSuccess={handleLoginSuccess} />
                </Modal>
            )}
        </div>
    );
};

export default CartPage;