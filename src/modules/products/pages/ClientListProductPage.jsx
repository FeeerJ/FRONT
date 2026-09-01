
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../shared/components/Button";
import ProductCard from "../components/ProductCard";
import ClientMenu from "../../client/components/ClientMenu";
import useAuth from "../../auth/hook/useAuth";

const DEFAULT_PAGE_SIZE = 12;

const ClientProductsPage = () => {
  // --- URL params (los setea el Header con /?search=...&page=1) ---
  const [sp, setSp] = useSearchParams();
  const search = sp.get("search") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const size = Math.max(1, Number(sp.get("size") || DEFAULT_PAGE_SIZE));

  // --- Estados ---
  const [products, setProducts] = useState([]); // página actual
  const [totalItems, setTotalItems] = useState(0); // total filtrado
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / size)), [totalItems, size]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const { singout } = useAuth();

  // --- Agregar al carrito ---
  const handleAddToCart = (product, quantity) => {
    if (quantity < 1) return alert("Debes seleccionar al menos 1 unidad.");
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const i = cart.findIndex((it) => it.id === product.id);
    if (i !== -1) cart[i].quantity += quantity;
    else
      cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.currentUnitPrice,
        quantity,
      });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  //  Fetch + paginación del backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      if (search) {
        qs.set("search", search);
      }
      qs.set("pageNumber", String(page));
      qs.set("pageSize", String(size));

      try {
        const res = await fetch(`/api/products?${qs.toString()}`);

        // Manejar HTTP 204 No Content cuando no hay productos
        if (res.status === 204) {
          setProducts([]);
          setTotalItems(0);
          return;
        }

        if (!res.ok) throw new Error(`Error en la red: ${res.status}`);
        const data = await res.json();

        // Leer data.productsItems (o fallbacks) y data.total
        const items = data?.productsItems ?? data?.ProductsItems ?? data?.items ?? data?.Items ?? (Array.isArray(data) ? data : []);
        const total = data?.total ?? data?.Total ?? data?.totalCount ?? (Array.isArray(data) ? data.length : items.length);

        setProducts(items);
        setTotalItems(total);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, size]);

  // --- Paginación (actualiza URL) ---
  const goToPrevPage = () => {
    if (page === 1) return;
    const q = new URLSearchParams(sp);
    q.set("page", String(page - 1));
    setSp(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextPage = () => {
    if (page === totalPages) return;
    const q = new URLSearchParams(sp);
    q.set("page", String(page + 1));
    setSp(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeSize = (e) => {
    const newSize = Number(e.target.value) || DEFAULT_PAGE_SIZE;
    const q = new URLSearchParams(sp);
    q.set("size", String(newSize));
    q.set("page", "1");
    setSp(q);
  };

  // --- Loading/Error ---
  if (isLoading && products.length === 0) {
    return <div className="text-center mt-10">Cargando catálogo...</div>;
  }
  if (error) {
    return (
      <div className="text-center mt-10 bg-red-100 p-4 rounded text-red-700">
        Error: {error}
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800">Catálogo de Productos</h1>
      </div>



      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
          />
        ))}
      </div>


      {/* --- INFO + PAGINACIÓN + TAMAÑO  --- */}
      <div className="mt-8 p-4 bg-white rounded-xl shadow-md
              flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* izquierda: info */}
        <span className="text-gray-600 text-sm">
          Mostrando {products.length} de {totalItems}
          {search ? <> resultados para “<b>{search}</b>”.</> : " resultados."}
        </span>

        {/* centro: selector de tamaño */}
        <div className="hidden sm:block flex items-center gap-2">
          <span className="text-sm text-gray-600">Tamaño:</span>
          <select
            value={size}
            onChange={changeSize}
            className="p-2 border border-gray-300 rounded"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>

        {/* derecha: paginación */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="secondary"
            onClick={goToPrevPage}
            disabled={page === 1 || isLoading}
            className="px-3 py-1 text-xs rounded-full bg-gray-100 disabled:opacity-50"
          >
            Anterior
          </Button>

          <span className="font-semibold text-gray-800 px-3 py-1 bg-purple-100 rounded-full">
            {page} / {totalPages}
          </span>

          <Button
            variant="secondary"
            onClick={goToNextPage}
            disabled={page === totalPages || isLoading}
            className="px-3 py-1 text-xs rounded-full bg-gray-100 disabled:opacity-50"
          >
            Siguiente
          </Button>
        </div>
      </div>


      {/* MENÚ MÓVIL */}
      <ClientMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={() => {
          try { singout(); } catch { }
          try { localStorage.removeItem("customerId"); } catch { }
          try { window.dispatchEvent(new Event("cartUpdated")); } catch { }
          setMenuOpen(false);
          navigate("/login");
        }}
      />
    </div>
  );
};

export default ClientProductsPage;
