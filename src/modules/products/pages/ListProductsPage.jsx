import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';

// ====================================================================
// TEMPORAL: Hooks y Servicios MOCK (Reemplaza por tus imports reales)
// ====================================================================

// **Mock de useAuth:** Asume que tu hook REAL devuelve { user: { token: 'JWT_TOKEN_VALOR' } }
const useAuth = () => {
  const [user, setUser] = useState({ token: localStorage.getItem('token') || null });
  // En una aplicación real, esta lógica sería más compleja, cargando desde storage
  useEffect(() => {
    // Simulación: si hay un token en localStorage, se considera logeado.
    const token = localStorage.getItem('token');
    if (token) {
        // Asegúrate de que el token sea accesible, típicamente se carga en el inicio de la app
        setUser({ token, role: 'Admin' }); 
    }
  }, []);
  return { user };
};

// **Mock de getProducts:** Simula el fetch a /api/products
const getProducts = async (searchTerm, _status, pageNumber, pageSize, token) => {
  // Enviamos búsqueda y paginación al backend; si el backend no soporta `status`
  // lo aplicaremos en frontend.
  const params = new URLSearchParams({ 
    search: searchTerm, 
    page: pageNumber,
    limit: pageSize,
  }).toString();
    
  try {
    const url = `/api/products?${params}`;
    console.debug('[Products] GET', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

        if (response.status === 401) {
             // Lanza error 401 para que el componente padre lo maneje (redirección)
            throw new Error("401 Unauthorized: Token inválido o expirado."); 
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al obtener productos. Status: ${response.status}`);
        }
        
        const data = await response.json();
        // Asumimos que el backend devuelve un array directo, o { data: [...], totalCount: N }
        const items = data.productItems || data;
        const totalCount = data.totalCount || items.length;
        console.debug('[Products] Fetched', items.length, 'items, totalCount=', totalCount);
        return { data: items, totalCount };

    } catch (error) {
        throw error;
    }
};

// **Mock de disableProduct:** Simula la petición PATCH
const disableProduct = async (id, token) => {
    const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH', // Usamos PATCH para deshabilitar... DisableProduct(Guid id)]
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok && response.status !== 204) { 
        throw new Error(`Error al deshabilitar. Status: ${response.status}`);
    }
    return { success: true };
};


// ====================================================================
// COMPONENTE PRINCIPAL ListProductsPage
// ====================================================================

const productStatus = {
  ALL: 'all',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
};

function ListProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener el objeto user
  const isAuthenticated = !!user?.token; 

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(productStatus.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); 

  // --- Lógica de FETCH y Carga ---

  const fetchProducts = async () => {
    const token = user?.token;
    if (!token) {
        setLoading(false);
        // Si el token no está, salimos. ProtectedRoute debe manejar la redirección.
        return; 
    }
    
    try {
      setLoading(true);
      const { data, totalCount } = await getProducts(searchTerm, status, pageNumber, pageSize, token);

      // Si el backend no soporta filtrado por estado, aplicamos filtro en frontend.
      let finalData = data;
      let finalTotal = totalCount;
      if (status && status !== productStatus.ALL) {
        // Mapeamos el filtro a la propiedad booleana isActive
        const wantEnabled = status === productStatus.ENABLED;
        finalData = data.filter(p => !!p.isActive === wantEnabled);
        finalTotal = finalData.length; // Nota: solo del lote recibido
      }

      setTotal(finalTotal);
      setProducts(finalData);
      
    } catch (error) {
        // Capturamos el error 401 aquí para loguearlo, pero el Guard (ProtectedRoute)
        // debería haber actuado antes de que el usuario vea este error.
        console.error("Error fetching products. Código:", error.message);
        
        // Si el error es 401, forzamos la salida para que ProtectedRoute lo maneje
        if (error.message.includes('401')) {
             navigate('/login');
        }
        
    } finally {
      setLoading(false);
    }
  };

  // SOLUCIÓN AL PROBLEMA DE REDIRECCIÓN AL LOGIN
  // El fetch solo se ejecuta cuando el estado de autenticación (isAuthenticated) es true
  // Esto evita enviar peticiones 401 con tokens expirados/nulos al inicio de la carga.
  useEffect(() => {
    if (isAuthenticated) { 
        fetchProducts();
    } else {
        setLoading(false); // Detenemos el loader si no hay token
    }
  }, [isAuthenticated, status, pageSize, pageNumber]); 

  // --- Lógica de Acciones (Deshabilitar) ---

  const handleDisableProduct = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres deshabilitar este producto?")) return;

    const token = user?.token; 
    if (!token) {
        alert("Sesión expirada. Redirigiendo a login...");
        navigate('/login');
        return;
    }

    try {
      setLoading(true);
      await disableProduct(id, token); 
      // Refrescar la lista para reflejar el cambio de estado
      await fetchProducts(); 
    } catch (err) {
      alert("Error al deshabilitar el producto.");
    } finally {
        setLoading(false);
    }
  };


  // --- Lógica de UI ---
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = () => {
    setPageNumber(1); 
    fetchProducts();
  };
  
  const handlePageSizeChange = (evt) => {
    setPageNumber(1);
    setPageSize(Number(evt.target.value));
  };
  
  const handleStatusChange = (evt) => {
    setPageNumber(1);
    setStatus(evt.target.value);
  };


  // --- Renderizado ---

  // Renderiza el indicador de carga si no hay productos aún o si se está cargando
  if (loading && products.length === 0) {
      return <p className="text-center mt-10">Cargando lista de administración...</p>;
  }
  
  // Renderizado principal si está autenticado
  if (isAuthenticated) {
    return (
        <div className="p-6">
          <Card>
    <div className='flex justify-between items-center mb-3'>
    <h1 className='text-3xl'>Productos</h1>
  </div>

  <div className='flex flex-col sm:flex-row gap-4'>
    {/* Input de Búsqueda y Botón (estilo copiado de Orders) */}
    <div className='flex items-center gap-3 w-full sm:w-2/3'>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
        placeholder="Buscar por nombre..."
        className='text-sm border border-gray-300 p-2 rounded w-full'
        aria-label="Buscar productos"
      />
      <Button
        className='h-10 w-10 bg-gray-200 hover:bg-gray-300'
        onClick={handleSearch}
        disabled={loading}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </svg>
      </Button>
    </div>

    {/* Select de Estado (estilo copiado de Orders) */}
    <div className='relative w-full sm:w-1/3'>
      <select
        value={status}
        onChange={handleStatusChange}
        className='text-sm border border-gray-300 p-2 rounded-lg shadow-sm bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 w-full appearance-none pr-8 cursor-pointer'
      >
        <option value={productStatus.ALL}>Todos</option>
        <option value={productStatus.ENABLED}>Habilitados</option>
        <option value={productStatus.DISABLED}>Inhabilitados</option>
      </select>
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
</Card>

          {/* Tabla de Resultados */}
          <div className='mt-4 flex flex-col gap-2'>
            {products.length > 0 ? products.map(product => (
              <Card key={product.sku} className={`p-4 ${!product.isActive ? 'bg-red-50 opacity-90 border-l-4 border-red-500' : 'bg-white'}`}>
                <div className='flex justify-between items-center flex-wrap'>
                    <div>
                        <h1 className='text-lg font-semibold text-gray-800'>{product.sku} - {product.name}</h1>
                        <p className='text-sm text-gray-600'>Precio: ${product.currentUnitPrice} | Stock: {product.stockQuantity}</p>
                        <p className={`text-sm font-semibold ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            Estado: {product.isActive ? 'Activado' : 'Desactivado'}
                        </p>
                    </div>

                    <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0'>
                      {/* Botón único 'Ver' para ver detalles del producto */}
                      <Button
                        onClick={() => navigate(`/admin/products/view/${product.id}`)}
                        className='bg-indigo-600 hover:bg-indigo-700 text-white p-2 text-sm'
                      >
                        Ver
                      </Button>
                    </div>
                </div>
              </Card>
            )) : <span className="text-center p-4">No se encontraron productos.</span>}
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className='flex justify-between items-center mt-6 space-x-3'>
              <div className='flex items-center space-x-3'>
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

              {/* Admin-only button placed next to pagination for better layout */}
              <div>
                {user?.role === 'Admin' && (
                  <Button
                    onClick={() => navigate('/admin/products/create')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Crear Producto
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      );
  }
  
  // Si no está autenticado y la carga inicial terminó (luego de que useAuth intentó cargar el token)
  return <p className="text-center mt-10 text-red-600">Acceso denegado. Redirigiendo a Login...</p>;
}

export default ListProductsPage;