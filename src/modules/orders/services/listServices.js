import { instance } from '../../shared/api/axiosInstance';

export const listOrders = async (statusOrParams = null, pageNumber = null, pageSize = null, search = null) => {
  try {
    const params = new URLSearchParams();
    let status = null;
    let pNum = pageNumber;
    let pSize = pageSize;
    let searchVal = search;

    if (statusOrParams && typeof statusOrParams === 'object') {
      status = statusOrParams.status;
      pNum = statusOrParams.pageNumber ?? pNum;
      pSize = statusOrParams.pageSize ?? pSize;
      searchVal = statusOrParams.search ?? searchVal;
    } else {
      status = statusOrParams;
    }

    if (status && status !== 'all' && status !== 'null' && String(status).trim() !== '') {
      params.append('status', String(status).trim());
    }

    if (pNum != null) {
      params.append('pageNumber', pNum);
    }

    if (pSize != null) {
      params.append('pageSize', pSize);
    }

    if (searchVal && searchVal !== 'null' && String(searchVal).trim() !== '') {
      params.append('search', String(searchVal).trim());
    }

    const query = params.toString();
    const url = query ? `/api/orders?${query}` : '/api/orders';

    const response = await instance.get(url);

    return { data: response.data, error: null };
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 204)) {
      return { data: [], error: null };
    }
    console.error('Error al listar órdenes:', error);
    return { data: null, error };
  }
};