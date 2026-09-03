import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

export const checkHealth = async () => {
  const response = await apiClient.get('/health/');
  return response.data;
};

export const analyzeImageFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/analyze/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeBase64 = async (imageBase64, filename = 'webcam_capture.jpg') => {
  const response = await apiClient.post('/analyze/base64', {
    image_base64: imageBase64,
    filename: filename,
  });
  return response.data;
};

export const getScanHistory = async (limit = 20, offset = 0, binFilter = null) => {
  const params = { limit, offset };
  if (binFilter) params.bin_filter = binFilter;
  const response = await apiClient.get('/history/', { params });
  return response.data;
};

export const getExportCsvUrl = () => {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/history/export/csv`;
};

export default apiClient;
