import { instance } from '../../shared/api/axiosInstance';

export const login = async (username, password) => { /* Funcion encargada de acceder al ENDPOINT de autenticacion, enviandole el usuario y la contraseña */
  try {
    const response = await instance.post('/api/authenticate/login', {
      username: username,
      password: password,
    });

    // Loguear la respuesta completa para ayudar a diagnosticar customerId/token
    try {
       console.debug('[Auth] login response:', response.data);  /* Si tiene exito obtiene el response.data que es el token */
      }catch (e) {
      console.error('Error logging response data:', e);  /* Si NO tiene exito obtiene el error */
    }

    return { data: response.data, error: null };  /* La funcion retorna los datos obtenidos en forma de token, o el error en caso necesario. Si no hay error devuelve null */

  } catch (error) { /* Si la autenticacion no tiene exito, el token es null y se envia el ERORR sea el codigo que sea */
    return { data: null, error };
  }
};