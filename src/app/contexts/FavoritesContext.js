"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoritesAPI } from '../api/favorites/route';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  // Initialize from localStorage cache if available
  const [favorites, setFavorites] = useState(() => {
    try {
      const cached = localStorage.getItem('userFavorites');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get userId from localStorage
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserId(userData._id || userData.user?._id);
      }
    } catch (error) {
      console.error('Error parsing userData:', error);
    }
  }, []);

  // Fetch favorites when userId is available
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Check if we have cached data and it's less than 5 minutes old
      const cachedData = localStorage.getItem('userFavorites');
      const cachedTime = localStorage.getItem('userFavoritesCacheTime');
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      if (cachedData && cachedTime && (now - parseInt(cachedTime)) < CACHE_DURATION) {
        console.log('✅ FavoritesContext: Using cached data (no API call)');
        setFavorites(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      console.log('🔄 FavoritesContext: Fetching favorites from API for userId:', userId);
      try {
        const response = await favoritesAPI.getAllFavorites(userId);
        if (response.success && response.results) {
          console.log('✅ FavoritesContext: Loaded', response.results.length, 'favorites from API');
          setFavorites(response.results);
          // Cache the data
          localStorage.setItem('userFavorites', JSON.stringify(response.results));
          localStorage.setItem('userFavoritesCacheTime', now.toString());
        }
      } catch (error) {
        console.error('❌ FavoritesContext: Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  // Check if an item is favorite
  const isFavorite = useCallback((channelId, medium) => {
    const result = favorites.some(
      fav => fav.favouriteId === channelId && fav.medium === medium
    );
    console.log('🔍 isFavorite check:', channelId, medium, '→', result ? '❤️ YES' : '🤍 NO');
    return result;
  }, [favorites]);

  // Add to favorites
  const addFavorite = useCallback(async (channelId, medium, favouriteType = "INFLUENCER") => {
    if (!userId) return { success: false, error: 'User not logged in' };

    try {
      const requestData = {
        op: "ADD",
        medium,
        userId,
        favouriteId: channelId,
        favouriteType
      };

      const response = await favoritesAPI.toggleFavorite(requestData);

      if (response.success) {
        // Update local state
        const newFavorites = [...favorites, {
          userId: [userId],
          medium,
          favouriteId: channelId,
          favouriteType
        }];
        setFavorites(newFavorites);
        // Update cache
        localStorage.setItem('userFavorites', JSON.stringify(newFavorites));
        localStorage.setItem('userFavoritesCacheTime', Date.now().toString());
      }

      return response;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, error };
    }
  }, [userId]);

  // Remove from favorites
  const removeFavorite = useCallback(async (channelId, medium) => {
    if (!userId) return { success: false, error: 'User not logged in' };

    try {
      const requestData = {
        op: "DEL",
        medium,
        userId,
        favouriteId: channelId,
        favouriteType: "INFLUENCER"
      };

      const response = await favoritesAPI.toggleFavorite(requestData);

      if (response.success) {
        // Update local state
        const newFavorites = favorites.filter(
          fav => !(fav.favouriteId === channelId && fav.medium === medium)
        );
        setFavorites(newFavorites);
        // Update cache
        localStorage.setItem('userFavorites', JSON.stringify(newFavorites));
        localStorage.setItem('userFavoritesCacheTime', Date.now().toString());
      }

      return response;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, error };
    }
  }, [userId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (channelId, medium, favouriteType = "INFLUENCER") => {
    const isCurrentlyFavorite = isFavorite(channelId, medium);

    if (isCurrentlyFavorite) {
      return await removeFavorite(channelId, medium);
    } else {
      return await addFavorite(channelId, medium, favouriteType);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Refresh favorites from API
  const refreshFavorites = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await favoritesAPI.getAllFavorites(userId);
      if (response.success && response.results) {
        setFavorites(response.results);
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    }
  }, [userId]);

  const value = {
    favorites,
    loading,
    userId,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
