import apiClient from './client';

export const cropApi = {
  recommendCrop: async (payload) => {
    const response = await apiClient.post('/recommend_crop', payload);
    return response.data;
  },
};

export default cropApi;
