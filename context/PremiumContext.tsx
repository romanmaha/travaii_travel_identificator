import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const SCANS_KEY = "user_scans_left";
const PREMIUM_KEY = "user_is_premium";

// Інтерфейс для нашого контексту
interface PremiumContextType {
  isPremium: boolean;
  scansLeft: number;
  togglePremium: () => void;
  decrementScans: () => void;
  isLoading: boolean;
}

// Створюємо контекст з початковим значенням undefined
const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Створюємо провайдер
export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(true);
  const [scansLeft, setScansLeft] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  // Завантажуємо дані при першому запуску
  useEffect(() => {
    const loadState = async () => {
      try {
        const scansStr = await AsyncStorage.getItem(SCANS_KEY);
        const premiumStr = await AsyncStorage.getItem(PREMIUM_KEY);

        if (scansStr !== null) {
          setScansLeft(JSON.parse(scansStr));
        }
        if (premiumStr !== null) {
          setIsPremium(JSON.parse(premiumStr));
        }
      } catch (e) {
        console.error("Failed to load premium state from storage", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Функція для перемикання преміум-статусу
  const togglePremium = async () => {
    const newValue = !isPremium;
    setIsPremium(newValue);
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(newValue));
      // Якщо користувач стає преміум, скидаємо лічильник сканів (опціонально)
      if (newValue) {
        setScansLeft(3); // або якесь інше значення
        await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(3));
      }
    } catch (e) {
      console.error("Failed to save premium state", e);
    }
  };

  // Функція для зменшення кількості сканів
  const decrementScans = async () => {
    if (!isPremium && scansLeft > 0) {
      const newScans = scansLeft - 1;
      setScansLeft(newScans);
      try {
        await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(newScans));
      } catch (e) {
        console.error("Failed to save scans left", e);
      }
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        scansLeft,
        togglePremium,
        decrementScans,
        isLoading,
      }}>
      {children}
    </PremiumContext.Provider>
  );
};

// Створюємо кастомний хук для зручного доступу до контексту
export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};
