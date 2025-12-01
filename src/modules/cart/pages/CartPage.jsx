import React, { useState } from 'react';
import Button from '../../shared/components/Button';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../auth/components/LoginForm';
import useAuth from '../../auth/hook/useAuth';
import useCart from '../../cart/hooks/useCart';

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
        if (!cart.length) return alert("Tu carrito está vacío.");
        if (!isAuthenticated) return setIsModalOpen(true);
        sendOrder();
    };

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
            `${apiBase}/api/customers/username/${encodeURIComponent(usernameToResolve)}`,
            `${apiBase}/api/customers/by-username/${encodeURIComponent(usernameToResolve)}`,
            `${apiBase}/api/customers?username=${encodeURIComponent(usernameToResolve)}`,
        ];
        for (const path of attempts) {
            try {
                const fullUrl = apiBase ? path : path; // Ya se incluyó apiBase en la definición de attempts
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
        // Asegúrate que los nombres de las propiedades coincidan con tu DTO de C#
        orderItems: cart.map((item) => ({ productoId: item.id, quantity: item.quantity })),
    };

    try {
        const ordersUrl = apiBase ? `${apiBase}/api/orders` : '/api/orders';
        const headers = {
            'Content-Type': 'application/json',
            // Usar el token del estado 'user' si existe, si no, es un string vacío (debería existir si isAuthenticated es true)
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
            // Lógica de limpieza:
            // Asegúrate de definir las funciones de limpieza si las usas
            // clear(); // Si existía un hook useCart con función clear
            localStorage.removeItem('cart');
            // La función setCart solo actualiza el estado local, el listener se encargará de esto en un caso real
            // Por simplicidad para el demo:
            clear();

            if (created?.id) {
                // navigate(`/orders/${created.id}`); // Redirección
            }
        } else {
            // Manejo de errores detallado (lo que ya tenías)
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
