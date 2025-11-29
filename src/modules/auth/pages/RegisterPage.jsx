import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Registro de Usuario</h1>

        <RegisterForm />
      </div>
    </div>
  );
}