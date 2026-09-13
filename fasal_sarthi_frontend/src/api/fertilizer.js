import apiClient from './client';

export const fertilizerApi = {
  recommendFertilizer: async (payload) => {
    const response = await apiClient.post('/recommend_fertilizer', payload);
    return response.data;
  },
};

export default fertilizerApi;
