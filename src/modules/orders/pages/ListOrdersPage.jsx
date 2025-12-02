// src/pages/orders/ListOrdersPage.jsx
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

/* ================================
   Servicio: GET /api/orders/admin
   Espera del backend:
   { items, totalItems, pageNumber, pageSize, totalPages }
==================================*/
const getOrders = async (filter, token) => {
  // Construir query string sin "undefined"
  const qs = new URLSearchParams();
  if (filter.status && filter.status !== 'all') qs.set('status', filter.status);
  if (filter.search) qs.set('search', filter.search);
  if (filter.customerId) qs.set('customerId', filter.customerId);
  qs.set('pageNumber', String(filter.pageNumber));
  qs.set('pageSize', String(filter.pageSize));

  const url = `/api/orders/admin?${qs.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('401 Unauthorized');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener órdenes');
  }

  const data = await response.json();

  // Normalizamos nombres por si cambian el casing
  const items      = data.items ?? data.Items ?? (Array.isArray(data) ? data : []);
  const totalItems = data.totalItems ?? data.TotalItems ?? (Array.isArray(data) ? items.length : 0);
  const pageNumber = data.pageNumber ?? data.PageNumber ?? filter.pageNumber;
  const pageSize   = data.pageSize ?? data.PageSize ?? filter.pageSize;
  const totalPages = data.totalPages ?? data.TotalPages ?? Math.ceil(totalItems / pageSize);

  return { items, totalItems, pageNumber, pageSize, totalPages };
};

const ListOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user?.token;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(orderStatus.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0); // totalItems
  const [orders, setOrders] = useState([]);
  const [customerNames, setCustomerNames] = useState({});
  const [loading, setLoading] = useState(true);

  // Cargar nombres de clientes por id (lookup)
  const loadCustomerNames = useCallback(async (ordersList, token) => {
    if (!ordersList || !ordersList.length) return;

    const uniqueIds = [...new Set(ordersList.map(o => o.customerId))];
    const toFetch = uniqueIds.filter(id => id && !customerNames[id]);
    if (!toFetch.length) return;

    const newNames = {};
    await Promise.all(
      toFetch.map(async (id) => {
        try {
          const res = await fetch(`/api/customers/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
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
  }, [customerNames]);

  // Fetch principal
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

      const {
        items,
        totalItems,
        pageNumber: pnFromApi,
        pageSize: psFromApi,
      } = await getOrders(filter, token);

      setOrders(items);
      setTotal(totalItems);

      // sincronizar con valores del backend (por si corrige rangos)
      setPageNumber(pnFromApi);
      setPageSize(psFromApi);

      // lookup de nombres
      await loadCustomerNames(items, token);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      if (error.message.includes('401')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [user?.token, statusFilter, searchTerm, pageNumber, pageSize, navigate, loadCustomerNames]);

  // Efecto principal
  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated, statusFilter, searchTerm, pageNumber, pageSize, fetchOrders]);

  // Handlers
  const handleSearch = () => {
    setPageNumber(1);
    fetchOrders();
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPageNumber(1);
  };

  const handlePageSizeChange = (e) => {
    setPageNumber(1);
    setPageSize(Number(e.target.value));
  };

  // Si querés robustez visual, evitá 0 páginas
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl">Órdenes</h1>
        </div>

        {/* BUSCADOR + FILTRO DE ESTADO */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 w-full sm:w-2/3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text"
              placeholder="Buscar por texto"
              className="text-sm border border-gray-300 p-2 rounded w-full"
            />
            <Button className="h-10 w-10 bg-gray-200 hover:bg-gray-300" onClick={handleSearch}>
              🔍
            </Button>
          </div>

          <div className="relative w-full sm:w-1/3">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="text-sm border border-gray-300 p-2 rounded-lg w-full"
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
      <div className="mt-4 flex flex-col gap-2">
        {orders.length > 0 ? (
          orders.map((order) => (
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
          ))
        ) : (
          <p className="text-center p-4">
            {loading ? 'Cargando...' : 'No se encontraron órdenes con el filtro actual.'}
          </p>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="hidden sm:block flex justify-center items-center mt-6 space-x-3">
          <button
            disabled={pageNumber === 1 || loading}
            onClick={() => setPageNumber(pageNumber - 1)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Anterior
          </button>

          <span className="font-semibold">{pageNumber} / {totalPages}</span>

          <button
            disabled={pageNumber === totalPages || loading}
            onClick={() => setPageNumber(pageNumber + 1)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Siguiente
          </button>

          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="ml-3 p-2 border border-gray-300 rounded"
          >
            <option value="10">10 por página</option>
            <option value="15">15 por página</option>
            <option value="20">20 por página</option>
          </select>
        </div>
      )}


      {/* NAVEGACION DE LA PAGINACION VERSION MOBILE */}
        <div className="sm:hidden flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPageNumber(pageNumber - 1)}
            disabled={pageNumber === 1 || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-40 active:scale-95 transition"
          >
            ←
          </button>

          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold shadow-sm">
            {pageNumber} / {totalPages}
          </span>

          <button
            onClick={() => setPageNumber(pageNumber + 1)}
            disabled={pageNumber === totalPages || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-40 active:scale-95 transition"
          >
            →
          </button>
        </div>
    </div>
  );
};

export default ListOrdersPage;
