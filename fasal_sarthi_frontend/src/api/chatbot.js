import apiClient from './client';

export const chatbotApi = {
  sendMessage: async ({ message, history = [], language = 'en' }) => {
    const response = await apiClient.post('/sarthi_ai_chat', {
      message,
      history,
      language,
    });
    return response.data;
  },
};

export default chatbotApi;
