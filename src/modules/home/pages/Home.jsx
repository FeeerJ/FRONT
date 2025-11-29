import Card from '../../shared/components/Card';

function Home() {

  return (
    <div
      className='flex flex-col gap-3 sm:grid sm:grid-cols-2'
    >
      <Card>
        <h3>Productos</h3>
        <p>Cantidad: #</p>
      </Card>

      <Card>
        <h3>Ordenes</h3>
        <p>Cantidad: #</p>
      </Card>
    </div>
  );
};

export default Home;