"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Currency } from "@/lib/types";

const STORAGE_KEY = "expense-tracker-currency";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "USD" || stored === "GBP") setCurrencyState(stored);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
