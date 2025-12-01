import React, { useState } from 'react';
import Button from '../../shared/components/Button';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../auth/components/LoginForm';
import useAuth from '../../auth/hook/useAuth';
import useCart from '../../cart/hooks/useCart';

// Modal reutilizable
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

    // 💥 Nuevo hook centralizado del carrito
    const { cart, removeItem, clear, total: subtotal } = useCart();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const SHIPPING_COST = 8.0;
    const total = subtotal + SHIPPING_COST;

    const [shippingAddress, setShippingAddress] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [notes, setNotes] = useState('');

    // 🟣 Lógica para enviar orden (no la tocamos)
    const sendOrder = async () => {
        if (!cart.length) {
            alert('Tu carrito está vacío.');
            return;
        }

        let customerId = user?.customerId || localStorage.getItem('customerId');
        const username = user?.username || localStorage.getItem('username');

        const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

        const tryResolveCustomerId = async (usernameToResolve, token) => {
            if (!usernameToResolve) return null;
            const attempts = [
                `/api/customers/username/${encodeURIComponent(usernameToResolve)}`,
                `/api/customers/by-username/${encodeURIComponent(usernameToResolve)}`,
                `/api/customers?username=${encodeURIComponent(usernameToResolve)}`,
            ];
            for (const path of attempts) {
                try {
                    const res = await fetch(apiBase + path, {
                        headers: { Authorization: token ? `Bearer ${token}` : '' },
                    });
                    if (!res.ok) continue;
                    const data = await res.json();
                    if (data) return data.id || data.customerId;
                } catch {}
            }
            return null;
        };

        if (!customerId && username) {
            const token = user?.token || localStorage.getItem('token');
            customerId = await tryResolveCustomerId(username, token);
            if (customerId) localStorage.setItem('customerId', customerId);
        }

        if (!customerId) {
            alert("Debes iniciar sesión con un usuario válido.");
            return;
        }

        if (!shippingAddress || !billingAddress) {
            alert('Completa las direcciones.');
            return;
        }

        const orderData = {
            customerId,
            shippingAddress,
            billingAddress,
            notes,
            orderItems: cart.map(i => ({ productoId: i.id, quantity: i.quantity })),
        };

        try {
            const response = await fetch(`${apiBase}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: user?.token ? `Bearer ${user.token}` : '',
                },
                body: JSON.stringify(orderData),
            });

            if (response.status === 201) {
                alert("Compra finalizada con éxito!");
                clear(); 
            } else {
                const text = await response.text();
                alert(`Error: ${text}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error al enviar la orden");
        }
    };

    const handleLoginSuccess = () => {
        setIsModalOpen(false);
        sendOrder();
    };

    const handleCheckout = () => {
        if (!cart.length) {
            alert("Tu carrito está vacío.");
            return;
        }
        if (isAuthenticated) sendOrder();
        else setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Tu Carrito de Compras</h1>
                <Button onClick={() => navigate(-1)}
                    className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">
                    Volver al catálogo
                </Button>
            </div>

            {cart.length === 0 ? (
                <div className="bg-gray-100 p-8 text-center rounded-xl shadow-inner">
                    <p className="text-xl text-gray-600">Tu carrito está vacío.</p>
                </div>
            ) : (

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Lista de productos */}
                    <div className="md:col-span-2 space-y-4">

                        {cart.map(item => (
                            <div key={item.id}
                                className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md">

                                <span className="font-semibold text-lg">{item.name}</span>

                                <div className="flex items-center space-x-6">
                                    <span className="text-gray-600">Cant: {item.quantity}</span>
                                    <span className="font-extrabold text-xl text-purple-700">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>

                                    <button
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Eliminar
                                    </button>
                                </div>

                            </div>
                        ))}

                    </div>

                    {/* Resumen */}
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

                        {/* Direcciones */}
                        <div className="mt-4 space-y-2">
                            <label>Dirección de envío</label>
                            <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
                                className="w-full p-2 border rounded" />

                            <label>Dirección de facturación</label>
                            <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}
                                className="w-full p-2 border rounded" />

                            <label>Notas</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2 border rounded" />
                        </div>

                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full"
                            onClick={handleCheckout}>
                            Finalizar Compra
                        </Button>
                    </div>

                </div>
            )}

            {isModalOpen && (
                <Modal onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-2xl font-bold mb-4 text-center">Inicia Sesión</h2>
                    <LoginForm onSuccess={handleLoginSuccess} />
                </Modal>
            )}

        </div>
    );
};

export default CartPage;