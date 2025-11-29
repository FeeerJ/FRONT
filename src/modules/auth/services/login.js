import { instance } from '../../shared/api/axiosInstance';

export const login = async (username, password) => {
  try {
    const response = await instance.post('/api/authenticate/login', {
      username: username,
      password: password
    });

    return { data: response.data, error: null };

  } catch (error) {
    return { data: null, error };
  }
};