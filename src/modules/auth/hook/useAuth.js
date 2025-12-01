import { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    // Es mejor lanzar el error para detener la ejecución y facilitar el debug
    throw new Error('useAuth no debe ser usado por fuera de AuthProvider');
  }

  return {
    // Exponer el objeto user completo (que contendrá { token, role, ...})
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    singin: context.singin,
    singout: context.singout,
  };

};

export default useAuth;