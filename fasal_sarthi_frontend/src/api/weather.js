import apiClient from './client';

export const weatherApi = {
  fetchWeather: async (payload) => {
    const response = await apiClient.post('/get_weather', payload);
    return response.data;
  },
};

export default weatherApi;
