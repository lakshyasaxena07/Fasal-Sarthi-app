import apiClient from './client';

export const mandiApi = {
  fetchMandiPrices: async (payload) => {
    const response = await apiClient.post('/get_mandi_prices', payload);
    return response.data;
  },
};

export default mandiApi;
