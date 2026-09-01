import { useEffect, useState } from 'react';
import Card from '../../shared/components/Card';
import { instance } from '../../shared/api/axiosInstance';

function Home() {

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);

        const [productsRes, ordersRes] = await Promise.allSettled([
          instance.get('/api/products'),
          instance.get('/api/orders'),
        ]);

        let totalProducts = 0;
        let totalOrders = 0;

        if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
          const data = productsRes.value.data;
          totalProducts =
            data?.total ??
            data?.totalCount ??
            data?.Total ??
            data?.productsItems?.length ??
            (Array.isArray(data) ? data.length : 0);
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const data = ordersRes.value.data;
          totalOrders =
            data?.total ??
            data?.totalItems ??
            data?.Total ??
            data?.items?.length ??
            data?.orders?.length ??
            (Array.isArray(data) ? data.length : 0);
        }

        setStats({
          totalProducts,
          totalOrders,
        });
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Cargando datos...</p>;
  }

  return (
    <div className='flex flex-col gap-3 sm:grid sm:grid-cols-2'>

      <Card>
        <h3>Productos</h3>
        <p>Cantidad: <strong>{stats.totalProducts}</strong></p>
      </Card>

      <Card>
        <h3>Órdenes</h3>
        <p>Cantidad: <strong>{stats.totalOrders}</strong></p>
      </Card>

    </div>
  );
}

export default Home;
