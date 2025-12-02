import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useAuth from '../../auth/hook/useAuth';
import { useNavigate } from 'react-router-dom';

// ESTADOS DE ÓRDEN (coinciden con backend)
const orderStatus = {
  ALL: 'all',
  PENDING: 'pending',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// SERVICIO: llama al endpoint real
const getOrders = async (filter, token) => {
  const params = new URLSearchParams({
    status: filter.status !== 'all' ? filter.status : '',
    search: filter.search || '',
    customerId: filter.customerId || '',
    pageNumer: filter.pageNumber,
    pageSize: filter.pageSize,
  }).toString();

  const url = `/api/orders?${params}`;

  console.debug('[Orders] GET', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('401 Unauthorized');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(error.message || 'Error al obtener órdenes');
  }

  const data = await response.json();

  // backend devuelve lista (porque no tienes paginación implementada aún en orders)
  return {
    data: Array.isArray(data) ? data : data.items || [],
    totalCount: Array.isArray(data) ? data.length : data.total || 0,
  };
};

const ListOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user?.token;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(orderStatus.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [customerNames, setCustomerNames] = useState({});
  const [loading, setLoading] = useState(true);

  // =============================================
  // FETCH ORDERS DESDE BACKEND
  // =============================================
  const fetchOrders = useCallback(async () => {
    const token = user?.token;

    if (!token) {
      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      const filter = {
        status: statusFilter,
        search: searchTerm,
        customerId: null,
        pageNumber,
        pageSize,
      };

      const { data, totalCount } = await getOrders(filter, token);

      setOrders(data);
      setTotal(totalCount);

      loadCustomerNames(data, token);

    } catch (error) {
      console.error('Error al obtener órdenes:', error);

      if (error.message.includes('401')) navigate('/login');
    } finally {
      setLoading(false);
    }

  }, [user?.token, statusFilter, searchTerm, pageNumber, pageSize, navigate]);

  // =============================================
  // CARGAR NOMBRES DE CLIENTES
  // =============================================
  const loadCustomerNames = async (ordersList, token) => {
    if (!ordersList || !ordersList.length) return;

    const uniqueIds = [...new Set(ordersList.map(o => o.customerId))];
    const toFetch = uniqueIds.filter(id => id && !customerNames[id]);

    if (!toFetch.length) return;

    const newNames = {};

    await Promise.all(
      toFetch.map(async (id) => {
        try {
          const res = await fetch(`/api/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!res.ok) return;

          const data = await res.json();

          newNames[id] = data.name || data.fullName || data.nombre || '';
        } catch (e) {
          console.error(`Error fetching customer ${id}:`, e);
        }
      }),
    );

    if (Object.keys(newNames).length) {
      setCustomerNames(prev => ({ ...prev, ...newNames }));
    }
  };

  // =============================================
  // useEffect principal
  // =============================================
  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated, statusFilter, searchTerm, pageNumber, pageSize, fetchOrders]);

  // =============================================
  // UI Handlers
  // =============================================

  const handleSearch = () => {
    setPageNumber(1);
    fetchOrders();
  };

  const handleStatusChange = (evt) => {
    setStatusFilter(evt.target.value);
    setPageNumber(1);
  };

  const handlePageSizeChange = (e) => {
    setPageNumber(1);
    setPageSize(Number(e.target.value));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">

      <Card>
        <div className='flex justify-between items-center mb-3'>
          <h1 className='text-3xl'>Órdenes</h1>
        </div>

        {/* BUSCADOR + FILTRO DE ESTADO */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex items-center gap-3 w-full sm:w-2/3'>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text"
              placeholder='Buscar por texto'
              className='text-sm border border-gray-300 p-2 rounded w-full'
            />
            <Button className='h-10 w-10 bg-gray-200 hover:bg-gray-300' onClick={handleSearch}>
                            🔍
            </Button>
          </div>

          <div className='relative w-full sm:w-1/3'>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className='text-sm border border-gray-300 p-2 rounded-lg w-full'
            >
              <option value={orderStatus.ALL}>Todos</option>
              <option value={orderStatus.PENDING}>Pendientes</option>
              <option value={orderStatus.SHIPPED}>Enviadas</option>
              <option value={orderStatus.DELIVERED}>Entregadas</option>
              <option value={orderStatus.CANCELLED}>Canceladas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* LISTA DE ÓRDENES */}
      <div className='mt-4 flex flex-col gap-2'>
        {orders.length > 0 ? orders.map((order) => (
          <Card key={order.id} className="p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                                Orden #{order.id}
              </h2>
              <p className="text-sm text-gray-600">
                                Cliente: {customerNames[order.customerId] || order.customerId}
              </p>
              <p className="text-sm font-bold text-purple-700">
                                Total: ${order.totalAmount}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-200 text-purple-800">
                {order.status}
              </span>

              <Button className="bg-blue-500 hover:bg-blue-600 text-white p-2 text-sm">
                                Ver / Modificar
              </Button>
            </div>
          </Card>
        )) : (
          <p className="text-center p-4">No se encontraron órdenes con el filtro actual.</p>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && ( /* si en la vista no existen como minimo 10 ordenes, es decir, lo que llega 1 pagina no se muestran los elementos de paginacion*/
        <div className='flex justify-center items-center mt-6 space-x-3'>
          <button
            disabled={pageNumber === 1 || loading}
            onClick={() => setPageNumber(pageNumber - 1)}
            className='px-4 py-2 bg-gray-200 rounded'
          >
                        Anterior
          </button>

          <span className='font-semibold'>{pageNumber} / {totalPages}</span>

          <button
            disabled={pageNumber === totalPages || loading}
            onClick={() => setPageNumber(pageNumber + 1)}
            className='px-4 py-2 bg-gray-200 rounded'
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
