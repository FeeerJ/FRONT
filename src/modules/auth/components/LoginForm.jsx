import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import useAuth from '../hook/useAuth';
import { frontendErrorMessage } from '../helpers/backendError';

function LoginForm() {
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { username: '', password: '' } });

  const navigate = useNavigate();

  const { user, singin } = useAuth();

  const onValid = async (formData) => {
    try {
      const response = await singin(formData.username, formData.password);

      if (response.error) {
        setErrorMessage(response.error.frontendErrorMessage);

        return;
      }
      
      const userRole = response.user?.role;
      if(userRole == 'Admin'){
         navigate('/admin/home');
      }else{
        navigate('/');
      }
    
   
    } catch (error) {
      if (error?.response?.data?.code) {
        setErrorMessage(frontendErrorMessage[error?.response?.data?.code]);
      } else {
        setErrorMessage('Llame a soporte');
      }
    }
  };

  return (
    <form className='
        flex
        flex-col
        gap-20
        bg-white
        p-8
        sm:w-md
        sm:gap-4
        sm:rounded-lg
        sm:shadow-lg
      '
    onSubmit={handleSubmit(onValid)}
    >
      <Input
        label='Usuario'
        { ...register('username', {
          required: 'Usuario es obligatorio',
        }) }
        error={errors.username?.message}
      />
      <Input
        label='Contraseña'
        { ...register('password', {
          required: 'Contraseña es obligatorio',
        }) }
        type='password'
        error={errors.password?.message}
      />

      <Button type='submit'>Iniciar Sesión</Button>
      <Button variant='secondary'type='button'onClick={() => navigate('/signup')}>
       Registrar Usuario
      </Button>
      {errorMessage && <p className='text-red-500'>{errorMessage}</p>}
    </form>
  );
};

export default LoginForm;
