"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Brand } from "@/types/navigation";

interface BrandContextValue {
  brands: Brand[];
  activeBrand: Brand | null;
  isLoading: boolean;
  selectBrand: (brand: Brand) => void;
}

interface BrandProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "allanalytics-active-brand-id";

const fallbackBrands: Brand[] = [
  { id: "brand-1", name: "Growth Hacking Inc.", avatar: "GH", activeAdmins: 3 },
  { id: "brand-2", name: "Allanalytics Labs", avatar: "AL", activeAdmins: 2 },
  { id: "brand-3", name: "Digital Nova", avatar: "DN", activeAdmins: 4 }
];

const BrandContext = createContext<BrandContextValue | null>(null);

function BrandProvider({ children }: BrandProviderProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBrands() {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, avatar, active_admins")
        .order("name", { ascending: true });

      if (!mounted) return;

      const mappedBrands: Brand[] =
        !error && data && data.length > 0
          ? data.map((item) => ({
              id: item.id,
              name: item.name,
              avatar: item.avatar ?? item.name.slice(0, 2).toUpperCase(),
              activeAdmins: item.active_admins ?? 0
            }))
          : fallbackBrands;

      setBrands(mappedBrands);

      const storedBrandId = window.sessionStorage.getItem(STORAGE_KEY);
      const initialBrand = mappedBrands.find((item) => item.id === storedBrandId) ?? mappedBrands[0] ?? null;

      setActiveBrand(initialBrand);
      if (initialBrand) {
        window.sessionStorage.setItem(STORAGE_KEY, initialBrand.id);
      }
      setIsLoading(false);
    }

    void loadBrands();

    return () => {
      mounted = false;
    };
  }, []);

  function selectBrand(brand: Brand) {
    setActiveBrand(brand);
    window.sessionStorage.setItem(STORAGE_KEY, brand.id);
  }

  const value = useMemo<BrandContextValue>(
    () => ({
      brands,
      activeBrand,
      isLoading,
      selectBrand
    }),
    [activeBrand, brands, isLoading]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}

export { BrandProvider, useBrand };
