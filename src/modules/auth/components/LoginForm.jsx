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
        username: data.username,
        password: data.password,
      });
     /*Guadamos el token */
      const loginData = response.data;

      console.log('[Login] respuesta backend:', loginData);
      console.log('ROL:', loginData.role);

      //  2. Guardamos todo lo necesario en localStorage, descomponiendo el token
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('username', loginData.username);
      localStorage.setItem('customerId', loginData.customerId);      // IMPORTANTE
      localStorage.setItem('identityUserId', loginData.identityUserId);
      localStorage.setItem('roles', JSON.stringify(loginData.roles));
      singin(response.data);
      /* Si el inicio de sesion tiene exito se actualiza el estado de la app */
      if (onSuccess) onSuccess();
      /*Obtenemos el rol del usuario para derivarlo a sus respectivas paginas */
      const userRole = loginData.role;
      //  3. Redirigimos al home o carrito

      if (userRole == 'Admin') {
        navigate('/admin/home');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('[Login] error:', error);
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
