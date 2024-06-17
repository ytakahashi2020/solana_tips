// src/components/translateUtils.ts
export const translateText = async (
  text: string,
  targetLang: string
): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_TRANSLATION_API_KEY;
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      q: text,
      target: targetLang,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return data.data.translations[0].translatedText;
};
