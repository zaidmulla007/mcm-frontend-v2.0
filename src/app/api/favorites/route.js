import api from "../axios";

const API_BASE_URL = "http://37.27.120.45:5901/api/user/favourite";

export const favoritesAPI = {
  toggleFavorite: async (data) => {
    try {
      const response = await api.post(`${API_BASE_URL}/toggleFavourite`, data);
      return response.data;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  },

  getAllFavorites: async (userId) => {
    try {
      const config = {
        params: { userId },
        headers: { 
          'Content-Type': 'application/json'
        }
      };
      const response = await api.get(API_BASE_URL, config);
      return response.data;
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  }
};