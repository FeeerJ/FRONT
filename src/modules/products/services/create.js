import { instance } from '../../shared/api/axiosInstance';

export const createProduct = async (formData) => {
  try {
    const response = await instance.post('/api/products', {
      sku: formData.sku,
      internalCode: formData.cui,
      name: formData.name,
      description: formData.description,
      currentUnitPrice: formData.price,
      stockQuantity: formData.stock,
    });

    return response.data;

  } catch (error) {
    console.error('Error al crear el producto:', error);
    throw error;
  }
};