import { NextResponse } from "next/server";
import acceptLanguage from "accept-language";
import { fallbackLng, languages } from "./i18n/settings";

acceptLanguage.languages(languages);

export const config = {
  //   matcher: "/:lng*",
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|images).*)",
  ],
};

const cookieName = "i18next";

export function middleware(req) {
  let lng;
  //cookieに保存されている言語を取得
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName).value);
  // ブラウザの設定言語
  if (!lng) lng = acceptLanguage.get(req.headers.get("Accept-Language"));
  //settings.js で設定した言語
  if (!lng) lng = fallbackLng;

  // http://localhost:3000 または、予想外の言語でアクセスされた場合にリダイレクト
  if (
    !languages.some((loc) => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith("/_next")
  ) {
    return NextResponse.redirect(
      new URL(`/${lng}${req.nextUrl.pathname}`, req.url)
    );
  }

  // cookie に言語をセット
  if (req.headers.has("referer")) {
    const refererUrl = new URL(req.headers.get("referer"));
    const lngInReferer = languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`)
    );
    const response = NextResponse.next();
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer);
    return response;
  }

  return NextResponse.next();
}
