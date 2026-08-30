// src/pages/orders/ListOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useAuth from '../../auth/hook/useAuth';
import { useNavigate } from 'react-router-dom';

import { listOrders, getOrderById } from '../services/listServices';

// ESTADOS DE ÓRDEN (coinciden con el enum exacto del backend)
const orderStatus = {
  ALL: 'all',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const ListOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem('token');
  const isAuthenticated = Boolean(token);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(orderStatus.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch principal
  const fetchOrders = useCallback(async (customSearch = searchTerm) => {
    const activeToken = token;
    if (!activeToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const trimmedSearch = (customSearch ?? '').trim();

      // Si se ingresó un término de búsqueda (ej. ID de orden)
      if (trimmedSearch !== '') {
        const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(trimmedSearch);

        if (isGuid) {
          const { data, error } = await getOrderById(trimmedSearch);

          if (error) {
            throw error;
          }

          if (data) {
            // Verificar si aplica filtro de estado
            if (statusFilter !== orderStatus.ALL && data.status?.toLowerCase() !== statusFilter.toLowerCase()) {
              setOrders([]);
              setTotal(0);
            } else {
              setOrders([data]);
              setTotal(1);
            }
          } else {
            setOrders([]);
            setTotal(0);
          }
          return;
        } else {
          // Si no es un GUID completo, intentamos buscar por ID o filtramos en memoria
          const { data, error } = await getOrderById(trimmedSearch);
          if (!error && data) {
            if (statusFilter !== orderStatus.ALL && data.status?.toLowerCase() !== statusFilter.toLowerCase()) {
              setOrders([]);
              setTotal(0);
            } else {
              setOrders([data]);
              setTotal(1);
            }
            return;
          }

          // Filtro sobre lista
          const { data: listData, error: listError } = await listOrders({
            status: statusFilter,
            pageNumber: 1,
            pageSize: 100,
          });

          if (listError) throw listError;

          const items = Array.isArray(listData) ? listData : (listData?.items ?? listData?.Items ?? listData?.orders ?? []);
          const filtered = items.filter(o =>
            (o.id && o.id.toLowerCase().includes(trimmedSearch.toLowerCase())) ||
            (o.customerId && o.customerId.toLowerCase().includes(trimmedSearch.toLowerCase())) ||
            (o.shippingAddress && o.shippingAddress.toLowerCase().includes(trimmedSearch.toLowerCase()))
          );

          setOrders(filtered);
          setTotal(filtered.length);
          return;
        }
      }

      // Si no hay búsqueda, listar normalmente paginado
      const filter = {
        status: statusFilter,
        pageNumber,
        pageSize,
      };

      const { data, error } = await listOrders(filter);

      if (error) {
        throw error;
      }

      // Normalizar respuesta (Array List<OrderResponse> o estructura paginada)
      const items = Array.isArray(data) ? data : (data?.items ?? data?.Items ?? data?.orders ?? []);
      const totalItems = data?.total ?? data?.totalItems ?? (Array.isArray(data) ? data.length : items.length);

      setOrders(Array.isArray(items) ? items : []);
      setTotal(totalItems ?? 0);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setFetchError('No tienes permisos de Administrador para ver las órdenes o tu sesión ha expirado.');
      } else {
        setFetchError(error.message || 'Error al obtener las órdenes.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchTerm, pageNumber, pageSize]);

  // Efecto principal
  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated, statusFilter, pageNumber, pageSize, fetchOrders]);

  // Handlers
  const handleSearch = () => {
    setPageNumber(1);
    fetchOrders(searchTerm);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim() === '') {
      setPageNumber(1);
      fetchOrders('');
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPageNumber(1);
  };

  const handlePageSizeChange = (e) => {
    setPageNumber(1);
    setPageSize(Number(e.target.value));
  };

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
              onChange={handleSearchChange}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              type="text"
              placeholder="Buscar por ID de orden..."
              className="text-sm border border-gray-300 p-2 rounded w-full"
            />
            <Button className="h-10 w-10 bg-gray-200 hover:bg-gray-300" onClick={handleSearch} disabled={loading}>
              🔍
            </Button>
          </div>

          <div className="relative w-full sm:w-1/3">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="text-sm border border-gray-300 p-2 rounded-lg w-full"
            >
              <option value={orderStatus.ALL}>Todos los estados</option>
              <option value={orderStatus.PENDING}>Pending (Pendiente)</option>
              <option value={orderStatus.PROCESSING}>Processing (En proceso)</option>
              <option value={orderStatus.SHIPPED}>Shipped (Enviado)</option>
              <option value={orderStatus.DELIVERED}>Delivered (Entregado)</option>
              <option value={orderStatus.CANCELLED}>Cancelled (Cancelado)</option>
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
                  Cliente ID: {order.customerId || 'N/A'} {order.customerName ? `(${order.customerName})` : ''}
                </p>
                {order.shippingAddress && (
                  <p className="text-sm text-gray-600">
                    Dirección de envío: {order.shippingAddress}
                  </p>
                )}
                <p className="text-sm font-bold text-purple-700">
                  Total: ${order.totalAmount ?? order.total ?? 0}
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
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <p className={`text-base ${fetchError ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
              {loading ? 'Cargando...' : (fetchError || 'No se encontraron órdenes con el filtro actual.')}
            </p>
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="hidden sm:block flex justify-center items-center mt-6 space-x-3">
          <button
            disabled={pageNumber === 1 || loading}
            onClick={() => setPageNumber(pageNumber - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="font-semibold">{pageNumber} / {totalPages}</span>

          <button
            disabled={pageNumber === totalPages || loading}
            onClick={() => setPageNumber(pageNumber + 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
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
