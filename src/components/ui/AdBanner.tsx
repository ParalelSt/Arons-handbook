import { useEffect, useRef } from "react";

/**
 * AdBanner — renders a Google AdSense ad unit.
 *
 * Only rendered when:
 *  1. VITE_ENABLE_ADS === "true"
 *  2. Running in production mode
 *
 * Self-hosted users can disable by omitting the env variable.
 * Publisher ID and slot ID are read from environment variables — never hardcoded.
 */

const ADS_ENABLED =
  import.meta.env.VITE_ENABLE_ADS === "true" && import.meta.env.PROD;

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as
  | string
  | undefined;
const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID as
  | string
  | undefined;

/** Load the AdSense script once globally */
let scriptLoaded = false;
function loadAdSenseScript(): void {
  if (scriptLoaded || !ADSENSE_CLIENT_ID) return;
  scriptLoaded = true;

  const script = document.createElement("script");
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT_ID)}`;
  script.async = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || !ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return;

    loadAdSenseScript();

    // Push the ad slot after component mounts
    if (!pushed.current) {
      pushed.current = true;
      try {
        const w = window as unknown as Record<string, unknown>;
        ((w.adsbygoogle as unknown[]) || []).push({});
      } catch {
        // AdSense not ready — ignore
      }
    }
  }, []);

  if (!ADS_ENABLED || !ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) {
    return null;
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
