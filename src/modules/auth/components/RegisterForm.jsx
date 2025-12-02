import { useForm } from 'react-hook-form';
import { instance } from '../../shared/api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';

export default function RegisterForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState(null);

  const onSubmit = async (data) => {
    try {
      await instance.post('/api/authenticate/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        phoneNumber: data.phoneNumber,
      });

      navigate('/login');
    } catch (error) {
      console.error('[Register] error:', error);
      setBackendError('No se pudo registrar. Verifique los datos.');
    }
  };

  return (
    <Card className="p-6 flex flex-col gap-4 w-full max-w-md">

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {backendError && <p className="text-red-500">{backendError}</p>}

        <Input
          label="Usuario"
          error={errors.username?.message}
          {...register('username', {
            required: 'El usuario es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
          })}
        />

        <Input
          label= "Nombre Completo"
          error = {errors.name?.message}{...register('name', {
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
          })}
        />

        <Input
          label="Teléfono"
          error={errors.phoneNumber?.message}
          {...register('phoneNumber', { required: 'El teléfono es obligatorio', minLength: { value: 7, message: 'Mínimo 7 caracteres' } })}
        />

        <Input
          label="Email"
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
            minLength: { value: 6, message: 'Mínimo 6 caracteres' },
          })}
        />

        <Input
          type="password"
          label="Confirmar contraseña"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Debe confirmar la contraseña',
            validate: (value) =>
              value === watch('password') || 'Las contraseñas no coinciden',
          })}
        />

        <Button type="submit" variant="default">
          Registrarme
        </Button>

      </form>

      <p className="text-sm text-center">
        ¿Ya tenés una cuenta?
        <Link to="/login" className="text-purple-500 ml-1 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </Card>
  );
}