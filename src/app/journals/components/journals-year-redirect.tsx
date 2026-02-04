"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const getCurrentYear = (): string => {
  return String(new Date().getFullYear());
};

export const JournalsYearRedirect: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sinceYear = searchParams?.get("sinceYear");
    if (sinceYear && sinceYear.trim() !== "") {
      return;
    }

    const year = getCurrentYear();
    router.replace(`/journals?sinceYear=${encodeURIComponent(year)}`);
  }, [router, searchParams]);

  return null;
};
