import Link from "next/link";
import { useTranslation } from "../../i18n";
import { labels } from "../../i18n/settings";

export const LngButton = async ({ lng }) => {
  const { t } = await useTranslation(lng);
  return (
    <div className="flex items-center space-x-2">
      {Object.keys(labels).map((label) => (
        <Link key={label} href={`/${label}`} passHref>
          <button
            disabled={lng === label}
            className={`px-2 py-1 rounded ${
              lng === label
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {labels[label]}
          </button>
        </Link>
      ))}
    </div>
  );
};
