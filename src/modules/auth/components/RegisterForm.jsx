import { useForm } from 'react-hook-form';
import { instance } from '../../shared/api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';

export default function RegisterForm() { {/*Define la estructura (JSX) y la lógica general (estado, hooks) que se renderizará en la página de registro. */}
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState(null);

  const onSubmit = async (data) => { /* Se ejecuta cuando el usuario envia el formulario */
    setBackendError(null);
    try {
      /* Se llama al ENDPOINT registro con RegisterModel ({ email, password, username }) */
      await instance.post('/api/authenticate/register', {
        email: data.email,
        password: data.password,
        username: data.username,
      });
      /* Si el registro tiene exito se redirige al login */
      navigate('/login');
    } catch (error) {
      /* Si el registro falla se muestra el mensaje o lista de errores devueltos por el backend */
      console.error('[Register] error:', error);
      const resData = error.response?.data;

      if (resData) {
        if (Array.isArray(resData.errors) && resData.errors.length > 0) {
          const messages = resData.errors.map(err => typeof err === 'string' ? err : err.description || err.message || JSON.stringify(err));
          setBackendError(messages);
        } else if (resData.errors && typeof resData.errors === 'object') {
          const messages = Object.values(resData.errors).flat().map(err => typeof err === 'string' ? err : err.description || err.message || JSON.stringify(err));
          setBackendError(messages.length > 0 ? messages : (resData.message || 'No se pudo registrar. Verifique los datos.'));
        } else if (resData.message) {
          setBackendError(resData.message);
        } else if (typeof resData === 'string') {
          setBackendError(resData);
        } else {
          setBackendError('No se pudo registrar. Verifique los datos.');
        }
      } else {
        setBackendError('No se pudo registrar. Error de conexión con el servidor.');
      }
    }
  };

  return (
    <Card className="p-6 flex flex-col gap-4 w-full max-w-md">

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {backendError && (
          <div className="text-red-500 text-sm">
            {Array.isArray(backendError) ? (
              <ul className="list-disc pl-5 space-y-1">
                {backendError.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            ) : (
              <p>{backendError}</p>
            )}
          </div>
        )}

        <Input
          label="Usuario"
          error={errors.username?.message}
          {...register('username', {
            required: 'El usuario es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
          })}
        />

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