'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: Set<number>;
  isLoading: boolean;
  isFavorite: (carId: number) => boolean;
  addFavorite: (carId: number) => Promise<void>;
  removeFavorite: (carId: number) => Promise<void>;
  toggleFavorite: (carId: number) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getFavorites();
      if (response.success && response.data) {
        const ids = new Set(response.data.map(car => car.id));
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((carId: number) => {
    return favoriteIds.has(carId);
  }, [favoriteIds]);

  const addFavorite = useCallback(async (carId: number) => {
    try {
      await apiService.addToFavorites(carId);
      setFavoriteIds(prev => new Set([...prev, carId]));
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }, []);

  const removeFavorite = useCallback(async (carId: number) => {
    try {
      await apiService.removeFromFavorites(carId);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(carId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (carId: number) => {
    if (isFavorite(carId)) {
      await removeFavorite(carId);
    } else {
      await addFavorite(carId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isLoading,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
