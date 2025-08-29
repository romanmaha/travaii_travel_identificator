import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

// Ключ для твого Entitlement в RevenueCat
const ENTITLEMENT_ID = "premium"; // ⚠️ ЗАМІНИ на свій ID з дашборду RevenueCat

const SCANS_KEY = "user_scans_left";

interface PremiumContextType {
  isPremium: boolean;
  scansLeft: number;
  decrementScans: () => void;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false); // Початково - не преміум
  const [scansLeft, setScansLeft] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    const loadScansFromStorage = async () => {
      try {
        const scansStr = await AsyncStorage.getItem(SCANS_KEY);
        if (scansStr !== null) {
          setScansLeft(JSON.parse(scansStr));
        }
      } catch (e) {
        console.error("Failed to load scans from storage", e);
      }
    };

    loadScansFromStorage();

    const customerInfoUpdateHandler = (info: CustomerInfo) => {
      setCustomerInfo(info);

      // Перевіряємо, чи є у користувача активний Entitlement
      const userIsPremium =
        typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";

      setIsPremium(userIsPremium);
      setIsLoading(false);
    };

    // Додаємо слухача для оновлення інформації про користувача
    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateHandler);

    // Отримуємо початкову інформацію
    const getInitialCustomerInfo = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        customerInfoUpdateHandler(info);
      } catch (e) {
        console.error("Failed to get initial customer info", e);
        setIsLoading(false);
      }
    };
    getInitialCustomerInfo();

    // Не забудь відписатись від слухача при розмонтуванні компонента
    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateHandler);
    };
  }, []);

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
        decrementScans,
        isLoading,
        customerInfo,
      }}>
      {children}
    </PremiumContext.Provider>
  );
};

// Хук залишається без змін
export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};
