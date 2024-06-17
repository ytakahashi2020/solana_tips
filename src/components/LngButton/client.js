"use client";

import { useTranslation } from "../../i18n/client";
import { imgLabels } from "../../i18n/settings"; // imgLabels をインポート
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const LngButton = ({ lng }) => {
  const { t } = useTranslation(lng);
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const getLink = (label) => {
    let reg = new RegExp(Object.keys(imgLabels).join("|"));
    let np = path.replace(reg, label);
    return np;
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
      >
        <img
          src={imgLabels[lng]}
          alt={lng}
          className="w-5 h-5 mr-2 rounded-full"
        />
        {/* {lng.toUpperCase()} */}
        <svg
          className="w-5 h-5 ml-2 -mr-1 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-20 bg-white rounded-md shadow-lg">
          {Object.keys(imgLabels).map((label) => (
            <Link key={label} href={getLink(label)} passHref>
              <button
                onClick={() => setIsOpen(false)}
                disabled={lng === label}
                className={`flex items-center w-full px-4 py-2 text-left ${
                  lng === label
                    ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                <img
                  src={imgLabels[label]}
                  alt={label}
                  className="w-5 h-5 mr-2 rounded-full"
                />
                {/* <span>{label.toUpperCase()}</span> */}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
