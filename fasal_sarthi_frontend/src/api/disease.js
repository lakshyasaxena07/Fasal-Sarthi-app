import apiClient from './client';

export const diseaseApi = {
  predictDisease: async (formData) => {
    const response = await apiClient.post('/predict_disease', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default diseaseApi;
