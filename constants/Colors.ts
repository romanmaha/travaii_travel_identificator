/**
 * Нижче наведено кольори, які використовуються в додатку. Кольори визначені для світлого та темного режимів.
 * Є багато інших способів стилізувати ваш додаток. Наприклад, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app) тощо.
 */

// Нові кольори для світлої теми
const activeColorLight = "#47C2BD";
const inactiveColorLight = "#8E8E8E";

// Кольори для темної теми (залишені без змін)
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: activeColorLight,
    icon: inactiveColorLight,
    tabIconDefault: inactiveColorLight, // Неактивна іконка таба
    tabIconSelected: activeColorLight, // Активна іконка таба
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};
