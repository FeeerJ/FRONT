import { useEffect, useState } from 'react';
import Card from '../../shared/components/Card';

function Home() {

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/dashboard/summary');

        if (!response.ok) throw new Error('Error al cargar el resumen');

        const data = await response.json();

        setStats({
          totalProducts: data.totalProducts,
          totalOrders: data.totalOrders,
        });
      } catch (err) {
        console.error('Dashboard error:', err);
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
