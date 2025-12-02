import LoginForm from '../components/LoginForm';

function LoginPage() { /* Cumple la funcion de ser el Layout o conteniedor del FORM para el login */
  return (
    <div className='
      flex
      flex-col
      justify-center
      h-[100dvh]
      bg-neutral-100 
      sm:items-center 
    '>
      <LoginForm /> {/* Componente que contiene el FORM del login, permite renderizarlo */}
    </div>
  );
}

export default LoginPage;
