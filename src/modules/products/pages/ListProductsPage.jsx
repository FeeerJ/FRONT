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
const getProducts = async (searchTerm, status, pageNumber, pageSize, token) => {
    // URL completa con filtros
    const params = new URLSearchParams({ 
        search: searchTerm, 
        status: status,
        page: pageNumber,
        limit: pageSize,
    }).toString();
    
    try {
        const response = await fetch(`/api/products?${params}`, {
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
        return { 
            data: data.productItems || data, // Usa 'productItems' si es paginado
            totalCount: data.totalCount || data.length 
        };

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

      setTotal(totalCount);
      setProducts(data);
      
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
    {/* ... Botones ... */}
  </div>

  <div className='flex flex-col sm:flex-row gap-4'>
    {/* ... Input de Búsqueda ... */}
    <div className='flex items-center gap-3 w-full sm:w-2/3'>
      {/* ... input y botón ... */}
    </div>
    {/* ... Select de Estado ... */}
    <select value={status} onChange={handleStatusChange} className='text-[1.1rem] 
        border border-gray-300 
        p-2 
        rounded-lg            /* Esquinas más suaves */
        shadow-sm             /* Sombra sutil */
        bg-white              /* Fondo blanco */
        hover:border-purple-400 /* Efecto visual al pasar el ratón */
        focus:outline-none    /* Quitar el outline azul por defecto */
        focus:ring-2 
        focus:ring-purple-200 /* Anillo de enfoque elegante */
        w-full 
        sm:w-1/3
        appearance-none       /* Quitar la flecha nativa (Opcional, si usas ícono custom) */
        pr-8                  /* Padding a la derecha para la flecha custom */
        cursor-pointer
    '>
      <option value={productStatus.ALL}>Todos</option>
      <option value={productStatus.ENABLED}>Habilitados</option>
      <option value={productStatus.DISABLED}>Inhabilitados</option>
    </select>
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
                        {/* Botón de Edición */}
                        <Button 
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className='bg-blue-500 hover:bg-blue-600 text-white p-2 text-sm'
                        >
                            Editar
                        </Button>

                        {/* Botón de Deshabilitar (solo si está activo) */}
                        {product.isActive && (
                            <Button 
                                onClick={() => handleDisableProduct(product.id)}
                                className='bg-red-500 hover:bg-red-600 text-white p-2 text-sm'
                            >
                                Deshabilitar
                            </Button>
                        )}
                    </div>
                </div>
              </Card>
            )) : <span className="text-center p-4">No se encontraron productos.</span>}
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
  }
  
  // Si no está autenticado y la carga inicial terminó (luego de que useAuth intentó cargar el token)
  return <p className="text-center mt-10 text-red-600">Acceso denegado. Redirigiendo a Login...</p>;
}

export default ListProductsPage;