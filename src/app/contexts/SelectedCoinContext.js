"use client";
import React, { createContext, useContext, useState } from "react";

const SelectedCoinContext = createContext();

export function SelectedCoinProvider({ children }) {
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    return (
        <SelectedCoinContext.Provider value={{ selectedSymbol, setSelectedSymbol }}>
            {children}
        </SelectedCoinContext.Provider>
    );
}

export function useSelectedCoin() {
    return useContext(SelectedCoinContext);
}
