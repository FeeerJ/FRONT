import { instance } from '../../shared/api/axiosInstance';

export const getProducts = async (search = null, status = null, pageNumber = 1, pageSize = 20) => {
  try {
    const params = new URLSearchParams();

    if (search && typeof search === 'string' && search.trim() !== '' && search !== 'null') {
      params.append('search', search.trim());
    }

    if (status && typeof status === 'string' && status !== 'all' && status.trim() !== '' && status !== 'null') {
      params.append('status', status.trim());
    }

    if (pageNumber != null) {
      params.append('pageNumber', pageNumber);
    }

    if (pageSize != null) {
      params.append('pageSize', pageSize);
    }

    const response = await instance.get(`/api/products?${params.toString()}`);

    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};