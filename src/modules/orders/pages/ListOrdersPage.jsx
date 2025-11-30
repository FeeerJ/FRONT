import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useAuth  from '../../auth/hook/useAuth'; // Ajusta la ruta si es necesario
import { useNavigate } from 'react-router-dom'; // Para navegación/redirección

// --- ESTADOS DE ORDEN (Debe coincidir con el backend) ---
const orderStatus = {
    ALL: 'all',
    PENDING: 'pending', 
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled', 
};

// --- MOCK DE SERVICIO DE ÓRDENES (REEMPLAZAR CON TU SERVICIO REAL) ---
// Esta función llama al endpoint real de órdenes.
// Nota: el backend define OrderFilter con propiedades 'customerId', 'pageNumer' y 'pageSize'.
// Si el backend no soporta filtrado por estado, omitimos enviar `status` y aplicamos filtro en frontend.
const getOrders = async (_filter, pageNumber, pageSize, token) => {
    // Enviamos únicamente paginación al backend (pageNumer y pageSize).
    const params = new URLSearchParams({ 
        pageNumer: pageNumber,
        pageSize: pageSize,
    }).toString();

    try {
        const url = `/api/orders?${params}`;
        console.debug('[Orders] GET', url);
        const response = await fetch(url, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401) {
            throw new Error("401 Unauthorized: Token inválido o expirado.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al obtener órdenes. Status: ${response.status}`);
        }

        const data = await response.json();

        // El backend actualmente devuelve una lista de OrderResponse.
        // Construimos un objeto con 'data' y 'totalCount' para que la UI maneje paginación.
        const items = Array.isArray(data) ? data : (data.orderItems || []);
        const totalCount = (data.totalCount != null) ? data.totalCount : items.length;

        console.debug('[Orders] Fetched', items.length, 'items, totalCount=', totalCount);
        return { data: items, totalCount };

    } catch (error) {
        throw error;
    }
};

const ListOrdersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAuthenticated = !!user?.token; 

    // Estados de control y datos
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(orderStatus.ALL);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [orders, setOrders] = useState([]); 
    const [customerNames, setCustomerNames] = useState({}); // cache id -> name
    const [loading, setLoading] = useState(true);

    // --- Lógica de Fetch de Órdenes (Optimizado con useCallback) ---
    // Usamos useCallback para que esta función solo se recree cuando sus dependencias cambien.
    const fetchOrders = useCallback(async () => {
        const token = user?.token;
        if (!token) {
            setLoading(false);
            return; 
        }

        try {
            setLoading(true);
            
            // Llama a tu función de servicio REAL aquí (no enviamos status al backend)
            const { data, totalCount } = await getOrders(statusFilter, pageNumber, pageSize, token);

            // Si el backend no soporta filtrado por estado, aplicamos filtro en frontend.
            let finalData = data;
            let finalTotal = totalCount;
            if (statusFilter && statusFilter !== orderStatus.ALL) {
                const normalizedFilter = (statusFilter || '').toString().toLowerCase();
                finalData = data.filter(o => (o.status || '').toString().toLowerCase() === normalizedFilter);
                // Nota: esto filtra solo el conjunto recibido (página). Si quieres filtrar sobre
                // todo el conjunto de órdenes deberíamos solicitar más datos del backend o cambiar el backend.
                finalTotal = finalData.length;
            }

            setTotal(finalTotal);
            setOrders(finalData);
            // Intentar cargar nombres de clientes (si existe endpoint)
            loadCustomerNames(finalData, token);
            
        } catch (error) {
            console.error("Error al obtener órdenes:", error);
            // Si el error es 401, redirigimos manualmente por seguridad
            if (error.message.includes('401')) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [user?.token, statusFilter, pageNumber, pageSize, navigate]); // Dependencias de useCallback

    // Cargar nombres de clientes por sus IDs y guardarlos en cache
    const loadCustomerNames = async (ordersList, token) => {
        if (!ordersList || !ordersList.length) return;

        const uniqueIds = [...new Set(ordersList.map(o => o.customerId))];
        const toFetch = uniqueIds.filter(id => id && !customerNames[id]);
        if (!toFetch.length) return;

        const newNames = {};
        await Promise.all(toFetch.map(async (id) => {
            try {
                const res = await fetch(`/api/customers/${id}`, {
                    headers: { 'Authorization': user?.token ? `Bearer ${user.token}` : '' }
                });
                if (!res.ok) return;
                const data = await res.json();
                // Suponemos que la respuesta contiene 'name' o 'fullName'
                newNames[id] = data.name || data.fullName || data.nombre || '';
            } catch (e) {
                // ignore
            }
        }));

        if (Object.keys(newNames).length) {
            setCustomerNames(prev => ({ ...prev, ...newNames }));
        }
    };

    // --- Efecto de carga inicial y reactivo a los filtros ---
    // Ejecuta la carga cuando cambia la autenticación, el filtro, la página o el tamaño.
    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, statusFilter, pageNumber, pageSize, user?.token]);

    // --- Lógica de Acciones y UI ---
    
    const totalPages = Math.ceil(total / pageSize);
    
    const handleUpdateStatus = (orderId, currentStatus) => {
        // Lógica para cambiar el estado de la orden (pendiente de implementación)
        window.alert(`Implementar cambio de estado para orden #${orderId}. Estado actual: ${currentStatus}`);
    };

    const handlePageSizeChange = (evt) => {
        setPageNumber(1);
        setPageSize(Number(evt.target.value));
    };

    const handleSearch = () => {
        setPageNumber(1); 
        fetchOrders();
    };

    const handleStatusChange = (evt) => {
        const newStatus = evt.target.value;
        setStatusFilter(newStatus);
        setPageNumber(1);
    };

    // --- Renderizado  SACAMOS EL IF PQ NO FUNCIONA COMO DIOS MANDA ---

    /*if (loading && orders.length === 0) {
        return <p className="text-center mt-10">Cargando lista de órdenes...</p>;
    }
    
    if (!isAuthenticated) {
        return <p className="text-center mt-10 text-red-600">Acceso denegado. Por favor, inicia sesión.</p>;
    }
*/
    return (
        <div className="p-6">
            <Card>
                <div className='flex justify-between items-center mb-3'>
                    <h1 className='text-3xl'>Ordenes</h1>
                </div>

                {/* Contenedor de Búsqueda y Filtro de Estado */}
                <div className='flex flex-col sm:flex-row gap-4'>
                    
                    {/* Input de Búsqueda y Botón */}
                    <div className='flex items-center gap-3 w-full sm:w-2/3'>
                        <input 
                            value={searchTerm}
                            onChange={(evt) => setSearchTerm(evt.target.value)}
                            type="text" 
                            placeholder='Buscar por ID de Cliente o Número de Orden' 
                            className='text-sm border border-gray-300 p-2 rounded w-full' 
                        />
                        <Button 
                            className='h-10 w-10 bg-gray-200 hover:bg-gray-300'
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {/* SVG de la lupa */}
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </svg>
                        </Button>
                    </div>
                    
                    {/* Select de Estado de Órdenes (Con estilos refinados) */}
                    <div className='relative w-full sm:w-1/3'>
                        <select 
                            value={statusFilter} 
                            onChange={handleStatusChange} 
                            className='
                                text-sm 
                                border border-gray-300 
                                p-2 
                                rounded-lg 
                                shadow-sm 
                                bg-white 
                                hover:border-purple-400 
                                focus:outline-none focus:ring-2 focus:ring-purple-200 
                                w-full 
                                appearance-none 
                                pr-8 
                                cursor-pointer
                            '
                        >
                            <option value={orderStatus.ALL}>Todos</option>
                            <option value={orderStatus.PENDING}>Pendientes</option>
                            <option value={orderStatus.SHIPPED}>Enviadas</option>
                            <option value={orderStatus.DELIVERED}>Entregadas</option>
                            <option value={orderStatus.CANCELLED}>Canceladas</option>
                        </select>
                         {/* Ícono de Flecha custom */}
                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </Card>
            
            {/* Lista de Órdenes */}
            <div className='mt-4 flex flex-col gap-2'>
                {orders.length > 0 ? orders.map((order, idx) => (
                    <Card key={order.Id} className="p-4 flex justify-between items-center">
                        <div>
                            {/* Enumeración secuencial: global según página */}
                            {(() => {
                                const number = ((pageNumber - 1) * pageSize) + (idx + 1);
                                return (
                                    <h2 className="text-lg font-semibold text-gray-800">Orden #{number}</h2>
                                );
                            })()}
                            <p className="text-sm text-gray-600">Cliente ID: {order.customerId}</p>
                            <p className="text-sm font-bold text-purple-700">Total: ${order.totalAmount}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Muestra el estado con un badge de color */}
                            <span 
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    order.status === orderStatus.DELIVERED ? 'bg-green-100 text-green-800' : 
                                    order.status === orderStatus.PENDING ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                                {order.status.toUpperCase()}
                            </span>
                            <Button
                                onClick={() => handleUpdateStatus(order.Id, order.status)}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 text-sm"
                            >
                                Ver / Modificar
                            </Button>
                        </div>
                    </Card>
                )) : <p className="text-center p-4">No se encontraron órdenes con el filtro actual.</p>}
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className='flex justify-center items-center mt-6 space-x-3'>
                <button
                    disabled={pageNumber === 1 || loading}
                    onClick={() => setPageNumber(pageNumber - 1)}
                    className='px-4 py-2 bg-gray-200 rounded disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-300 transition'
                >
                    Anterior
                </button>
                <span className='font-semibold'>{pageNumber} / {totalPages}</span>
                <button
                    disabled={pageNumber === totalPages || loading}
                    onClick={() => setPageNumber(pageNumber + 1)}
                    className='px-4 py-2 bg-gray-200 rounded disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-300 transition'
                >
                    Siguiente
                </button>

                <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className='ml-3 p-2 border border-gray-300 rounded'
                >
                    <option value="10">10 por página</option>
                    <option value="15">15 por página</option>
                    <option value="20">20 por página</option>
                </select>
                </div>
            )}
        </div>
    );
};

export default ListOrdersPage;