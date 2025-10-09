"use client";
import { FavoritesProvider } from "../contexts/FavoritesContext";

export default function Providers({ children }) {
  return (
    <FavoritesProvider>
      {children}
    </FavoritesProvider>
  );
}
