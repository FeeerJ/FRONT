import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import ProductCard from '../components/ProductCard'; 
import ProductSearchBar from '../components/ProducSearchBar'; 
import CartIcon from '../components/CartIcon'; // Componente de ícono de navegación al carrito
import { useNavigate } from 'react-router-dom';
import useAuth from '../../auth/hook/useAuth';

const ClientProductsPage = () => {
    // Estado para la lista de productos
    const [products, setProducts] = useState([]);
    
    // Estados de Búsqueda (Input y el término que dispara el fetch)
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');
    
    // Estados de Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Productos por página
    const [totalPages, setTotalPages] = useState(1);     
    const [totalItems, setTotalItems] = useState(0);     
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Lógica del Carrito (LocalStorage) y Notificación ---

    const navigate = useNavigate();
    const { user, isAuthenticated, singout } = useAuth();
    const handleAddToCart = (product, quantity) => {
        if (quantity < 1) {
            alert('Debes seleccionar al menos 1 unidad para agregar.');
            return;
        }

        const currentCartJSON = localStorage.getItem('cart');
        let cart = currentCartJSON ? JSON.parse(currentCartJSON) : [];
        const productId = product.id; 

        const existingProductIndex = cart.findIndex(item => item.id === productId);

        if (existingProductIndex > -1) {
            // Producto existe: actualiza la cantidad
            cart[existingProductIndex].quantity += quantity;
        } else {
            // Producto nuevo: agregarlo con la cantidad
            cart.push({
                id: productId,
                sku: product.sku,
                name: product.name,
                price: product.currentUnitPrice,
                quantity: quantity,
            
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        console.log(`Agregado ${quantity} x ${product.name}. Carrito actualizado!`);
        
        // Notificación para actualizar el ícono del carrito
        window.dispatchEvent(new Event('cartUpdated')); 
    };
    
    // --- Lógica de Fetch y API ---

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        
        // Construcción de la Query String con paginación y el término de búsqueda confirmado
        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: currentSearchTerm,
        }).toString();

        try {
            // Llama a '/api/catalog' o '/api/products' (dependiendo de tu backend)
            const response = await fetch(`/api/products?${params}`); 

            if (!response.ok) {
                // Manejo de errores de red o servidor
                const errorText = await response.text(); 
                throw new Error(`Error en la red: ${response.status}.`);
            }
            
            const result = await response.json(); 
            
            // Suponemos que el backend devuelve un array (aunque idealmente debería ser un objeto con metadatos)
           
            const activeProducts = result.filter(p => p.isActive === true);
            setProducts(activeProducts);
            // Lógica de Paginación Front-end (Temporal si el Backend no la implementa)
            setTotalItems(activeProducts.length); 
            setTotalPages(1); // Placeholder, si el backend no devuelve totalPages
            if (currentPage > 1 && activeProducts.length === 0) {
                 setCurrentPage(1); // Vuelve a la página 1 si no hay datos
            }

        } catch (err) {
            console.error("Error al obtener productos:", err);
            setError(err.message || "No se pudo conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect para disparar el fetch al cambiar las dependencias de control
    useEffect(() => {
        fetchProducts();
    }, [currentPage, itemsPerPage, currentSearchTerm]); 

    // --- Lógica de Búsqueda y Paginación UI ---

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value); 
    };

    const handleSearchSubmit = () => {
        // Al buscar, reinicia a la página 1 y dispara el fetch
        setCurrentPage(1); 
        setCurrentSearchTerm(searchTerm);
    };
    
    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages)); 
    };
    
    const goToPrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1)); 
    };


    // --- RENDERIZADO ---

    if (isLoading && products.length === 0) {
        return <div className="text-center mt-10 p-6">Cargando catálogo...</div>;
    }

    if (error) {
        return (
            <div className="text-center mt-10 p-6 bg-red-100 border border-red-400 text-red-700 rounded mx-auto max-w-lg">
                <p className="font-bold">Error de conexión:</p>
                <p>{error}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            
            {/* --- CABECERA (TÍTULO, BUSCADOR Y CARRITO) --- */}
            <div className="flex justify-between items-center mb-6 flex-wrap">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4 md:mb-0">Catálogo de Productos</h1>
                
                {/* Contenedor para el buscador y el carrito (alineados a la derecha) */}
                <div className="flex items-center space-x-4">
                    {/* 1. Componente de Búsqueda */}
                    <ProductSearchBar
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onSearchSubmit={handleSearchSubmit}
                        isLoading={isLoading}
                    />
                    
                    {/* 2. Ícono de Carrito y Navegación */}
                    <CartIcon />
                    {/* 3. Botón de Login / Logout */}
                    <Button
                        onClick={() => {
                            if (isAuthenticated) {
                                // Cerrar sesión: limpiar información local y redirigir a la página de login
                                try {
                                    singout();
                                } catch (e) {
                                    console.debug('Error calling singout', e);
                                }
                                // En singout ya limpiamos localStorage; asegurar customerId removido
                                try { localStorage.removeItem('customerId'); } catch (e) {}
                                // Notificar componentes que dependan del carrito
                                try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {}
                                navigate('/login');
                            } else {
                                navigate('/login');
                            }
                        }}
                        className="ml-2 px-5 py-2 min-w-[140px] rounded-full bg-white border border-purple-600 text-purple-600 font-semibold hover:bg-purple-600 hover:text-white transition-shadow shadow-sm hover:shadow-md"
                    >
                        {isAuthenticated ? 'Cerrar Sesión' : 'Iniciar Sesión'}
                    </Button>
                </div>
            </div>
            
            {/* --- CONTROLES DE PAGINACIÓN Y RESUMEN --- */}
            <div className="mb-8 p-4 bg-white rounded-xl shadow-md flex justify-between items-center flex-wrap">
                <span className="text-gray-600 text-sm mb-2 md:mb-0">
                    Mostrando {products.length} de {totalItems} resultados.
                </span>
                
                <div className="flex items-center space-x-2 text-sm">
                    
                    <Button 
                        variant="secondary"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1 || isLoading}
                        className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Anterior
                    </Button>
                    
                    <span className="font-semibold text-gray-800 px-3 py-1 bg-purple-100 rounded-full">
                        {currentPage} / {totalPages}
                    </span>
                    
                    <Button
                        variant="secondary"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            {/* --- CUADRÍCULA DE PRODUCTOS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading && products.length === 0 ? (
                    // Muestra un placeholder de carga inicial si aún no hay productos
                    <p className="col-span-full text-center text-gray-500">Cargando...</p>
                ) : products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={handleAddToCart} 
                        isLoading={isLoading}
                    />
                ))}
            </div>
            
            {products.length === 0 && !isLoading && (
                <p className="text-center text-lg text-gray-500 mt-10">
                    No se encontraron productos con el filtro actual.
                </p>
            )}
        </div>
    );
};

export default ClientProductsPage;