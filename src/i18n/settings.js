export const fallbackLng = "en";
export const languages = ["uk", fallbackLng, "ja"];
export const defaultNS = "main";
export const imgLabels = {
  uk: "/images/flag_uk.svg", // ウクライナ語のラベル画像
  en: "/images/flag_en.svg", // 英語のラベル画像
  ja: "/images/flag_ja.svg", // 日本語のラベル画像
};

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
