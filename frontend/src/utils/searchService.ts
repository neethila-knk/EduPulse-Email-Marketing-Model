// src/utils/searchService.ts
import { authApi } from './authUtils';

export const performSearch = async (query: string) => {
  try {
    if (!query.trim()) return {};
    
    const response = await authApi.get(`/api/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    return {};
  }
};