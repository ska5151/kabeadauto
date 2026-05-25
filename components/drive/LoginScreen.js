"use client";

import { ExternalLink } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_OAUTH_SCOPES } from "@/lib/googleScopes";
import { getInAppBrowserName, isInAppBrowser } from "@/lib/inAppBrowser";
import DriveLogo from "./DriveLogo";
import LoadingFooter from "./LoadingFooter";

function InAppBrowserGuide({ appName }) {
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert("주소가 복사되었습니다. Chrome 또는 Safari에 붙여넣어 열어 주세요.");
    } catch {
      prompt("아래 주소를 복사해 Chrome 또는 Safari에서 열어 주세요.", currentUrl);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/75 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-slate-100">
        {appName}에서는 Google 로그인이 차단됩니다
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Google 보안 정책상 카카오톡·LINE 등 <strong>앱 내 브라우저</strong>에서는
        로그인할 수 없습니다. Chrome, Safari, Samsung Internet 같은{" "}
        <strong>일반 브라우저</strong>에서 열어 주세요.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
        <li>
          우측 상단 <strong>⋮</strong> 또는 <strong>⋯</strong> 메뉴 선택
        </li>
        <li>
          <strong>다른 브라우저로 열기</strong> /{" "}
          <strong>Safari/Chrome에서 열기</strong> 선택
        </li>
      </ol>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-400 active:bg-sky-600"
        >
          <ExternalLink className="h-4 w-4" />
          주소 복사 후 브라우저에서 열기
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        오류 코드: disallowed_useragent (Google OAuth 제한)
      </p>
    </div>
  );
}

export default function LoginScreen() {
  const attempted = useRef(false);
  const [inAppBrowser, setInAppBrowser] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const appName = getInAppBrowserName();
    if (isInAppBrowser()) {
      setInAppBrowser(appName);
      return;
    }

    if (attempted.current) return;
    attempted.current = true;
    setIsSigningIn(true);

    signIn(
      "google",
      { callbackUrl: "/?tab=drive" },
      {
        scope: GOOGLE_OAUTH_SCOPES,
        prompt: "consent",
        access_type: "offline",
        include_granted_scopes: "false",
      },
    );
  }, []);

  const handleSignIn = () => {
    setIsSigningIn(true);
    signIn(
      "google",
      { callbackUrl: "/?tab=drive" },
      {
        scope: GOOGLE_OAUTH_SCOPES,
        prompt: "consent",
        access_type: "offline",
        include_granted_scopes: "false",
      },
    );
  };

  if (inAppBrowser) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-transparent p-6">
        <div className="mb-8 flex items-center gap-3">
          <DriveLogo />
          <h1 className="text-2xl font-semibold text-slate-100">Google Drive</h1>
        </div>
        <InAppBrowserGuide appName={inAppBrowser} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-transparent p-6">
      <div className="mb-8 flex items-center gap-3">
        <DriveLogo />
        <h1 className="text-2xl font-semibold text-slate-100">Google Drive</h1>
      </div>

      {isSigningIn ? (
        <>
          <LoadingFooter />
          <p className="mt-4 text-center text-sm leading-6 text-slate-400">
            Google Drive 접근 권한으로 연결 중...
            <br />
            <span className="text-xs">(Drive 파일 관리 권한 승인 필요)</span>
          </p>
        </>
      ) : (
        <div className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-400">
            Google 계정으로 Drive에 연결합니다.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-400 active:bg-sky-600"
          >
            Google로 로그인
          </button>
        </div>
      )}
    </div>
  );
}
