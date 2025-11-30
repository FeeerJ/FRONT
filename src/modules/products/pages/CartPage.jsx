import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../../auth/pages/LoginPage'; // Asumimos que esta es la página/formulario de login
import  useAuth  from '../../auth/hook/useAuth'; // Hook para el estado de autenticación (isAuthenticated)

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
    const SHIPPING_COST = 8.00; 

    // Carga inicial del carrito desde localStorage (key 'cart')
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                console.error("Error al parsear el carrito de localStorage:", e);
                setCart([]);
            }
        }
    }, []);

    // --- CÁLCULOS ---
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    // --- LÓGICA DE API Y ENVÍO DE ORDEN ---

    // Función que se encarga de enviar la orden a /api/orders
    const sendOrder = async () => {
        const orderData = {
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                unitPrice: item.price
            })),
            totalAmount: total,
            shippingCost: SHIPPING_COST,
            // Podrías incluir user.id si estuviera disponible y logeado
        };
        
        try {
            const response = await fetch('/api/orders', { //
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Si el usuario está logeado, se debe enviar el token
                    'Authorization': isAuthenticated && user?.token ? `Bearer ${user.token}` : '', 
                },
                body: JSON.stringify(orderData),
            });
            
            if (response.ok) {
                alert("¡Compra finalizada con éxito! Gracias por tu pedido.");
                localStorage.removeItem('cart'); // Limpiar el carrito después de la compra
                setCart([]);
                // Aquí podrías redirigir a una página de confirmación
            } else {
                // Si la respuesta no es OK, manejar el error del servidor
                const errorData = await response.json();
                alert(`Error al procesar la compra: ${errorData.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error("Error en la solicitud de orden:", error);
            alert("Error de conexión con el servidor de órdenes.");
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
                        
                        <Button 
                            onClick={handleCheckout} 
                            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full font-semibold"
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