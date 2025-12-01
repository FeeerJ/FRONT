import { useForm } from 'react-hook-form';
import { instance } from '../../shared/api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState(null);

  const onSubmit = async (data) => {
    try {
      // ⬇️ 1. Llamamos al endpoint login
      const response = await instance.post('/api/authenticate/login', {
        username: data.username,
        password: data.password
      });

      const loginData = response.data;

      console.log("[Login] respuesta backend:", loginData);

      // ⬇️ 2. Guardamos todo lo necesario en localStorage
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("customerId", loginData.customerId);      // ⭐ IMPORTANTE
      localStorage.setItem("identityUserId", loginData.identityUserId);

      // ⬇️ 3. Redirigimos al home o carrito
      navigate('/');

    } catch (error) {
      console.error("[Login] error:", error);
      setBackendError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <Card className="p-6 flex flex-col gap-4 w-full max-w-md">

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {backendError && <p className="text-red-600">{backendError}</p>}

        <Input
          label="Usuario"
          error={errors.username?.message}
          {...register('username', {
            required: 'El usuario es obligatorio',
          })}
        />

        <Input
          type="password"
          label="Contraseña"
          error={errors.password?.message}
          {...register('password', {
            required: 'La contraseña es obligatoria'
          })}
        />

        <Button type="submit" variant="default">
          Iniciar Sesión
        </Button>

      </form>

      <p className="text-sm text-center">
        ¿No tenés cuenta?
        <Link to="/register" className="text-purple-500 ml-1 hover:underline">
          Registrarme
        </Link>
      </p>

    </Card>
  );
}
