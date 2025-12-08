"use client";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { SelectedCoinProvider } from "../contexts/SelectedCoinContext";

export default function Providers({ children }) {
  return (
    <FavoritesProvider>
      <SelectedCoinProvider>
        {children}
      </SelectedCoinProvider>
    </FavoritesProvider>
  );
}
