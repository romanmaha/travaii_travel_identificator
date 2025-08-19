// Форматування повідомлень з підтримкою жирного тексту
import React from "react";
import { Text } from "react-native";

const FormattedMessage = ({ text, style }: { text: string; style: any }) => {
  // Розбиваємо текст на частини, використовуючи **...** як роздільник
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        // Перевіряємо, чи є частина жирним текстом
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={index} style={{ fontWeight: "bold" }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        // Інакше повертаємо звичайний текст
        return part;
      })}
    </Text>
  );
};

export default FormattedMessage;
