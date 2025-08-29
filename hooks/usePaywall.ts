// hooks/usePaywall.ts
import { useState } from "react";
// 👇 Потрібен основний пакет для отримання customerInfo
import Purchases, { CustomerInfo } from "react-native-purchases";
import PurchasesUI from "react-native-purchases-ui";

interface PresentPaywallOptions {
  onSuccess?: (customerInfo: CustomerInfo) => void;
  onDismiss?: () => void;
}

export const usePaywall = () => {
  const [isLoading, setIsLoading] = useState(false);
  // ❗️ Видаляємо useRouter звідси, хук більше не відповідає за навігацію

  const presentPaywall = async (options?: PresentPaywallOptions) => {
    setIsLoading(true);
    try {
      const result = await PurchasesUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: "premium",
      });

      if (
        result === PurchasesUI.PAYWALL_RESULT.PURCHASED ||
        result === PurchasesUI.PAYWALL_RESULT.RESTORED
      ) {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log("Покупка або відновлення успішне!");

        // Просто викликаємо переданий колбек onSuccess
        options?.onSuccess?.(customerInfo);
      } else if (result === PurchasesUI.PAYWALL_RESULT.CANCELLED) {
        console.log("Користувач закрив екран покупок.");

        // Просто викликаємо переданий колбек onDismiss
        options?.onDismiss?.();
      }
    } catch (error) {
      console.error("Paywall presentation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { presentPaywall, isLoading };
};
