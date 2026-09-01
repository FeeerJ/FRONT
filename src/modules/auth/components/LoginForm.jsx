import { useForm } from 'react-hook-form'; /* Va a permitir gestionar el manejo del formulario, es decir la validacion de cada campo y la funcion handleSubmit */
import { instance } from '../../shared/api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom'; /* Permiten la navegacion correcta despues del login entre diversas paginas */
import { useState } from 'react';
import useAuth from '../hook/useAuth'; /* Facilita la utilizacion del a funcion SINGIN para actualizar el estado de la funcion desp de ingresar */

import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';

export default function LoginForm({ onSuccess })  { /*Se ejecuta cuando el usuario envia el formulario */
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState(null);
  const { singin } = useAuth();
  
  const onSubmit = async (data) => {
    try {
      //  1. Llamamos al endpoint login
      const response = await instance.post('/api/authenticate/login', {
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data;

      console.log('[Login] respuesta backend:', response.data);
      console.log('ROL:', user?.role);

      //  2. Guardamos todo lo necesario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('customerId', user?.id);
      localStorage.setItem('username', user?.email);
      localStorage.setItem('role', user?.role);

      singin({
        token,
        username: user?.email,
        customerId: user?.id,
        role: user?.role,
      });

      /* Si el inicio de sesion tiene exito se actualiza el estado de la app */
      if (onSuccess) onSuccess();

      //  3. Redirigimos según el rol (insensible a mayúsculas/minúsculas)
      if (user?.role?.toLowerCase() === 'admin') {
        navigate('/admin/home');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('[Login] error:', error);
      setBackendError('Email o contraseña incorrectos.');
    }
  };

  return (
    <Card className="p-6 flex flex-col gap-4 w-full max-w-md">

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {backendError && <p className="text-red-600">{backendError}</p>}

        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'El email es obligatorio',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Formato de email inválido',
            },
          })}
        />

        <Input
          type="password"
          label="Contraseña"
          error={errors.password?.message}
          {...register('password', {
            required: 'La contraseña es obligatoria',
          })}
        />

        <Button type="submit" variant="default">
          Iniciar Sesión
        </Button>

      </form>

      <p className="text-sm text-center">
        ¿No tenés cuenta?
        <Link to="/signup" className="text-purple-500 ml-1 hover:underline">
          Registrarme
        </Link>
      </p>

    </Card>
  );
}
