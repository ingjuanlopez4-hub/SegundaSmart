"use client";

import { useEffect } from "react";

export function FlashNotice({ param, children }: { param: string; children: React.ReactNode }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [param]);

  return <div className="alert success" role="status">{children}</div>;
}
