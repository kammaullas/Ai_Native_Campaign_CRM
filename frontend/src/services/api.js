import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerService = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
};

export const segmentService = {
  getSegments: () => api.get('/segments'),
  createSegment: (data) => api.post('/segments', data),
};

export const campaignService = {
  getCampaigns: () => api.get('/campaigns'),
  getCampaign: (id) => api.get(`/campaigns/${id}`),
  launchCampaign: (data) => api.post('/campaigns', data),
  getCampaignStats: (id) => api.get(`/campaigns/${id}/stats`),
};

export const aiService = {
  parseSegment: (prompt) => api.post('/ai/parse-segment', { prompt }),
  draftMessage: (segmentDescription, channel, brandTone) => 
    api.post('/ai/draft-message', { segmentDescription, channel, brandTone }),
};

export default api;
