import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Toast } from "@douyinfe/semi-ui";
import { db } from "../data/db";
import { exportSavedData } from "../utils/exportSavedData";

const LEGACY_HOSTS = ["drawdb.vercel.app"];
const NEW_ORIGIN = "https://www.drawdb.app";
const DISMISS_KEY = "drawdb.migrationBannerDismissed";

export function isLegacyHost() {
  return (
    typeof window !== "undefined" &&
    LEGACY_HOSTS.includes(window.location.hostname)
  );
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    return;
  }
}

function useCanonicalToNewOrigin(pathname) {
  useEffect(() => {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${NEW_ORIGIN}${pathname}`);
  }, [pathname]);
}

export default function MigrationBanner() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [exporting, setExporting] = useState(false);

  useCanonicalToNewOrigin(pathname);

  if (dismissed) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const count = await db.diagrams.count();
      if (count === 0) {
        Toast.info("No diagrams are saved in this browser.");
        return;
      }
      await exportSavedData();
      Toast.success(
        `Exported ${count} diagram${count === 1 ? "" : "s"}. At the new address open the editor and use File → Import diagram for each JSON file.`,
      );
    } catch {
      Toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Site migration notice"
      className="z-50 border-b border-[#6f1e16] bg-[#8e2a20] text-white text-sm"
    >
      <div className="flex items-center gap-4 px-4 py-2.5 md:flex-col md:items-start md:gap-3">
        <div className="flex flex-1 items-center gap-3 leading-snug">
          <i
            className="bi bi-exclamation-triangle-fill flex text-base text-white"
            aria-hidden="true"
          />
          <p className="m-0">
            <strong>drawDB has moved to www.drawdb.app.</strong> This address
            will be discontinued in a week. Export your diagrams so you don&apos;t
            lose them.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 md:w-full md:justify-end">
          <button
            type="button"
            onClick={exportAll}
            disabled={exporting}
            className="rounded-md border border-white/60 px-3 py-1.5 font-medium text-white hover:bg-white/10 disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export all diagrams"}
          </button>
          <a
            href={`${NEW_ORIGIN}${pathname}`}
            className="rounded-md bg-white px-3 py-1.5 font-semibold text-[#8e2a20] hover:bg-[#fbe9e6]"
          >
            Go to drawdb.app
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss for this session"
            className="ms-1 flex h-7 w-7 items-center justify-center rounded-md text-white/90 hover:bg-white/15"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
