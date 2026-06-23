"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type CollectionName = "documents" | "use-cases";

type StoredRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  collection: CollectionName;
  storedName: string;
  url: string;
};

type Hotspot = {
  id: string;
  title: string;
  body: string;
  label: string;
  style: CSSProperties;
};

type ConsortiumLogo =
  | string
  | {
      kind: "image";
      src: string;
      alt: string;
      wrapClassName: string;
      imageClassName: string;
    };

type ConsortiumGroup = {
  title: string;
  description: string;
  compact?: boolean;
  large?: boolean;
  id?: string;
  className?: string;
  gridClassName?: string;
  logos: ConsortiumLogo[];
};

const PRIVACY_CONSENT_STORAGE_KEY = "medchain_privacy_consent_v1";
const PRIVACY_CONSENT_ACCEPTED_VALUE = "accepted";
const PRIVACY_CONSENT_ESSENTIAL_VALUE = "essential";
const GOOGLE_ANALYTICS_ID = "G-GB6FRZQBMZ";

type GtagWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

function loadGoogleAnalytics() {
  if (document.querySelector(`[data-medchain-google-tag="${GOOGLE_ANALYTICS_ID}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  script.dataset.medchainGoogleTag = GOOGLE_ANALYTICS_ID;
  document.head.appendChild(script);

  const gtagWindow = window as GtagWindow;
  gtagWindow.dataLayer = gtagWindow.dataLayer || [];
  gtagWindow.gtag = function gtag(...args: unknown[]) {
    gtagWindow.dataLayer?.push(args);
  };
  gtagWindow.gtag("js", new Date());
  gtagWindow.gtag("config", GOOGLE_ANALYTICS_ID);
}

function disableGoogleAnalytics() {
  document
    .querySelectorAll(`[data-medchain-google-tag="${GOOGLE_ANALYTICS_ID}"], script[src*="${GOOGLE_ANALYTICS_ID}"]`)
    .forEach((script) => script.remove());

  const gtagWindow = window as GtagWindow;
  gtagWindow.gtag?.("consent", "update", {
    ad_storage: "denied",
    analytics_storage: "denied",
  });
}

function consortiumLogo(
  src: string,
  alt: string,
  wrapClassName = "logo-image-wrap",
  imageClassName = "partner-logo",
): ConsortiumLogo {
  return {
    kind: "image",
    src,
    alt,
    wrapClassName,
    imageClassName,
  };
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "raw-materials",
    title: "Raw Materials Sourcing",
    body: "Maps the origin, availability, and strategic control of critical raw materials needed to sustain manufacturing.",
    label: "Raw Materials Sourcing",
    style: { left: "4%", top: "37%", width: "11%", height: "18%" },
  },
  {
    id: "manufacturing",
    title: "Manufacturing & Assembly",
    body: "Shows where products are assembled, which actors can scale production, and how capacity can be redirected during disruption.",
    label: "Manufacturing and Assembly",
    style: { left: "18%", top: "34%", width: "12%", height: "22%" },
  },
  {
    id: "quality-control",
    title: "Quality Control & Regulatory Compliance",
    body: "Captures the validation steps, regulatory checkpoints, and compliance dependencies required before products can move forward.",
    label: "Quality Control and Regulatory Compliance",
    style: { left: "31%", top: "37%", width: "11%", height: "18%" },
  },
  {
    id: "innovation",
    title: "Innovation Nodes & Capabilities",
    body: "Represents the intelligence layer that connects tracking, analytics, and rapid deployment capabilities across the ecosystem.",
    label: "Innovation Nodes and Capabilities",
    style: { left: "46%", top: "8%", width: "10%", height: "22%" },
  },
  {
    id: "distribution",
    title: "Distribution & Logistics",
    body: "Explains how goods, data, and coordination move through the network from validated production to operational delivery.",
    label: "Distribution and Logistics",
    style: { left: "47%", top: "38%", width: "11%", height: "21%" },
  },
  {
    id: "warehousing",
    title: "Warehousing & Inventory Management",
    body: "Describes stock visibility, storage readiness, and how inventory is positioned to respond to changing demand.",
    label: "Warehousing and Inventory Management",
    style: { left: "calc(62% - 30px)", top: "37%", width: "11%", height: "19%" },
  },
  {
    id: "healthcare",
    title: "Healthcare Facilities & Providers",
    body: "Focuses on care delivery readiness, facility dependencies, and the operational conditions required at the point of care.",
    label: "Healthcare Facilities and Providers",
    style: { left: "calc(77% - 30px)", top: "34%", width: "11%", height: "22%" },
  },
  {
    id: "patient-outcomes",
    title: "Patient Outcome & Data Loops",
    body: "Captures the feedback generated from real-world outcomes so the system can learn, adapt, and improve resilience planning.",
    label: "Patient Outcome and Data Loops",
    style: { left: "calc(91% - 30px)", top: "39%", width: "8%", height: "18%" },
  },
  {
    id: "risks",
    title: "Supply Chain Risks & Threats",
    body: "Highlights exposure to shortages, geopolitical disruption, and other external events that can destabilize the supply chain.",
    label: "Supply Chain Risks and Threats",
    style: { left: "18%", top: "68%", width: "11%", height: "21%" },
  },
  {
    id: "cold-chain",
    title: "Cold Chain Integration",
    body: "Covers temperature-sensitive logistics and the safeguards needed to preserve product integrity throughout transport and storage.",
    label: "Cold Chain Integration",
    style: { left: "47%", top: "73%", width: "8%", height: "17%" },
  },
  {
    id: "emergency",
    title: "Emergency Preparedness & Stockpiling",
    body: "Shows how reserves, deployment planning, and readiness mechanisms can be activated quickly during a high-pressure event.",
    label: "Emergency Preparedness and Stockpiling",
    style: { left: "calc(79% - 40px)", top: "calc(6% - 20px)", width: "11%", height: "19%" },
  },
];

const CONSORTIUM_GROUPS: ConsortiumGroup[] = [
  {
    title: "Industry & Distribution",
    description: "Ensures real-world anchoring",
    compact: true,
    className: "consortium-group-industry",
    gridClassName: "logo-grid-industry",
    logos: [
      consortiumLogo(
        "/assets/consortium/astrazeneca.png",
        "AstraZeneca",
        "logo-image-wrap logo-image-wrap-astrazeneca",
        "partner-logo logo-astrazeneca",
      ),
      consortiumLogo(
        "/assets/consortium/onemed.png",
        "OneMed",
        "logo-image-wrap logo-image-wrap-onemed",
        "partner-logo logo-onemed",
      ),
      consortiumLogo(
        "/assets/consortium/tamro.png",
        "Tamro",
        "logo-image-wrap logo-image-wrap-tamro",
        "partner-logo logo-tamro",
      ),
      consortiumLogo(
        "/assets/consortium/softpro.png",
        "SoftPro Medical Solutions",
        "logo-image-wrap logo-image-wrap-softpro",
        "partner-logo logo-softpro",
      ),
    ],
  },
  {
    title: "Technology & Infrastructure",
    description: "Builds the digital backbone",
    className: "consortium-group-technology",
    gridClassName: "logo-grid-technology",
    logos: [
      consortiumLogo("/assets/consortium/igrantio.png", "iGrantio", "logo-image-wrap", "partner-logo logo-igrantio"),
      consortiumLogo("/assets/consortium/safespring.png", "Safespring", "logo-image-wrap", "partner-logo logo-safespring"),
      consortiumLogo("/assets/consortium/skygrid.png", "Skygrid", "logo-image-wrap", "partner-logo logo-skygrid"),
      consortiumLogo(
        "/assets/consortium/intended-future.png",
        "Intended Future",
        "logo-image-wrap",
        "partner-logo logo-intended-future",
      ),
      consortiumLogo(
        "/assets/consortium/viable-solutions.png",
        "Viable Solutions",
        "logo-image-wrap",
        "partner-logo logo-viable-solutions",
      ),
      consortiumLogo("/assets/consortium/chord.png", "Chord", "logo-image-wrap", "partner-logo logo-chord"),
    ],
  },
  {
    title: "Academia & Standardization",
    description: "Guarantees scientific rigor & EU alignment",
    className: "consortium-group-academia",
    gridClassName: "logo-grid-academia",
    logos: [
      consortiumLogo(
        "/assets/consortium/chalmers-industriteknik.png",
        "Chalmers Industriteknik",
        "logo-image-wrap",
        "partner-logo logo-chalmers-industriteknik",
      ),
      consortiumLogo("/assets/consortium/chalmers.png", "Chalmers", "logo-image-wrap", "partner-logo logo-chalmers"),
      consortiumLogo(
        "/assets/consortium/industry-commons.png",
        "Industry Commons",
        "logo-image-wrap",
        "partner-logo logo-industry-commons",
      ),
    ],
  },
  {
    title: "Public Sector & Defence",
    description: "Secures national anchoring and implementation",
    id: "team",
    large: true,
    className: "consortium-group-public",
    gridClassName: "logo-grid-public",
    logos: [
      consortiumLogo(
        "/assets/consortium/forsvarsmakten.png",
        "Försvarsmakten",
        "logo-image-wrap",
        "partner-logo logo-forsvarsmakten",
      ),
      consortiumLogo(
        "/assets/consortium/myndigheten-for-civilt-forsvar.png",
        "Myndigheten för civilt försvar",
        "logo-image-wrap",
        "partner-logo logo-myndigheten-for-civilt-forsvar",
      ),
      consortiumLogo("/assets/consortium/skr.png", "SKR", "logo-image-wrap", "partner-logo logo-skr"),
      consortiumLogo(
        "/assets/consortium/socialstyrelsen.png",
        "Socialstyrelsen",
        "logo-image-wrap",
        "partner-logo logo-socialstyrelsen",
      ),
      consortiumLogo(
        "/assets/consortium/socialdepartementet.png",
        "Socialdepartementet",
        "logo-image-wrap",
        "partner-logo logo-socialdepartementet",
      ),
      consortiumLogo(
        "/assets/consortium/forsvarshogskolan.png",
        "Försvarshögskolan",
        "logo-image-wrap",
        "partner-logo logo-forsvarshogskolan",
      ),
    ],
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextRecord(record: StoredRecord) {
  return (
    record.type.startsWith("text/") ||
    record.name.endsWith(".md") ||
    record.name.endsWith(".csv") ||
    record.name.endsWith(".json")
  );
}

function PreviewIcon() {
  return (
    <span className="doc-card-action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          d="M1.5 12s3.8-6 10.5-6 10.5 6 10.5 6-3.8 6-10.5 6S1.5 12 1.5 12Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

function DownloadIcon() {
  return (
    <span className="doc-card-action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          d="M12 3.5v10.2m0 0 4-4m-4 4-4-4M4 18.5h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DeleteIcon() {
  return (
    <span className="doc-card-action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          d="M5 7.5h14m-11.5 0 .8 11h7.4l.8-11M9.5 7.5V5.2h5V7.5M10 11v4.6m4-4.6v4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function FileCard({
  record,
  isAdmin,
  isRemoving,
  onPreview,
  onRemove,
}: {
  record: StoredRecord;
  isAdmin: boolean;
  isRemoving: boolean;
  onPreview: (record: StoredRecord) => void;
  onRemove: (record: StoredRecord) => Promise<void>;
}) {
  const [snippet, setSnippet] = useState("Loading preview…");

  useEffect(() => {
    if (!isTextRecord(record)) {
      return;
    }

    let cancelled = false;

    fetch(record.url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setSnippet(text.slice(0, 320) || "Text document");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnippet("Preview unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [record]);

  return (
    <article className="doc-card doc-card-file" data-document-id={record.id}>
      <div className="doc-card-surface">
        {record.type.startsWith("image/") ? (
          <img className="doc-card-surface-media" src={record.url} alt={record.name} />
        ) : record.type === "application/pdf" ? (
          <iframe
            className="doc-card-surface-media"
            src={`${record.url}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
            title={record.name}
          />
        ) : isTextRecord(record) ? (
          <div className="doc-card-surface-text">{snippet}</div>
        ) : (
          <div className="doc-card-surface-fallback">
            {(record.type || "file").split("/").pop()?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="doc-card-file-top">
        <p className="doc-card-kicker">{(record.type || "File").replace("/", " / ")}</p>
        <h3>{record.name}</h3>
        <p className="doc-card-meta">{formatSize(record.size)}</p>
      </div>

      <div className="doc-card-actions">
        <button
          type="button"
          title="Preview"
          aria-label="Preview"
          disabled={isRemoving}
          onClick={() => onPreview(record)}
        >
          <PreviewIcon />
        </button>
        <a
          href={record.url}
          download={record.name}
          title="Download"
          aria-label="Download"
          aria-disabled={isRemoving}
          onClick={(event) => {
            if (isRemoving) {
              event.preventDefault();
            }
          }}
        >
          <DownloadIcon />
        </a>
        <button
          type="button"
          className="doc-card-delete"
          title="Remove"
          aria-label="Remove"
          hidden={!isAdmin}
          disabled={isRemoving}
          onClick={() => void onRemove(record)}
        >
          <DeleteIcon />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <article className="doc-card doc-card-file">
      <div className="doc-card-file-top">
        <p className="doc-card-kicker">No items yet</p>
        <h3>{message}</h3>
      </div>
    </article>
  );
}

function PlaceholderCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`doc-card doc-card-placeholder${compact ? " doc-card-placeholder-compact" : ""}`}>
      <div className="doc-card-placeholder-surface" />
    </article>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <article className="doc-card doc-card-file">
      <div className="doc-card-file-top">
        <p className="doc-card-kicker">Backend unavailable</p>
        <h3>Start the Next.js development server</h3>
        <p>{message}</p>
      </div>
    </article>
  );
}

export function MedChainApp() {
  const [activeHotspotId, setActiveHotspotId] = useState(HOTSPOTS[0].id);
  const [documents, setDocuments] = useState<StoredRecord[]>([]);
  const [useCases, setUseCases] = useState<StoredRecord[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [useCasesError, setUseCasesError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState("Visitor mode: preview and download only");
  const [adminFeedback, setAdminFeedback] = useState<{ message: string; tone: string } | null>(
    null,
  );
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [previewRecord, setPreviewRecord] = useState<StoredRecord | null>(null);
  const [previewMinimized, setPreviewMinimized] = useState(false);
  const [previewText, setPreviewText] = useState("Loading preview…");
  const [privacyConsentChecked, setPrivacyConsentChecked] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
  const documentsInputRef = useRef<HTMLInputElement>(null);
  const useCasesInputRef = useRef<HTMLInputElement>(null);

  const activeHotspot = HOTSPOTS.find((hotspot) => hotspot.id === activeHotspotId) ?? HOTSPOTS[0];

  useEffect(() => {
    document.body.classList.toggle(
      "lightbox-open",
      Boolean(previewRecord && !previewMinimized) || (privacyConsentChecked && !privacyAccepted),
    );
    return () => {
      document.body.classList.remove("lightbox-open");
    };
  }, [previewMinimized, previewRecord, privacyAccepted, privacyConsentChecked]);

  useEffect(() => {
    const storedConsent = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    setPrivacyAccepted(
      storedConsent === PRIVACY_CONSENT_ACCEPTED_VALUE ||
        storedConsent === PRIVACY_CONSENT_ESSENTIAL_VALUE,
    );
    setAnalyticsAccepted(storedConsent === PRIVACY_CONSENT_ACCEPTED_VALUE);
    setPrivacyConsentChecked(true);
  }, []);

  useEffect(() => {
    if (analyticsAccepted) {
      loadGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
  }, [analyticsAccepted]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && previewRecord) {
        setPreviewRecord(null);
        setPreviewMinimized(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewRecord]);

  useEffect(() => {
    if (!previewRecord || !isTextRecord(previewRecord)) {
      return;
    }

    let cancelled = false;
    setPreviewText("Loading preview…");

    fetch(previewRecord.url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setPreviewText(text);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewText("Preview unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewRecord]);

  useEffect(() => {
    async function loadCollection(
      collection: CollectionName,
      setRecords: (records: StoredRecord[]) => void,
      setError: (message: string | null) => void,
    ) {
      try {
        const response = await fetch(`/api/${collection}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error();
        }
        const payload = (await response.json()) as StoredRecord[];
        setRecords(payload);
        setError(null);
      } catch {
        setError(
          collection === "documents"
            ? "The shared documents area now requires the local Next.js API server to be running."
            : "The use case area now requires the local Next.js API server to be running.",
        );
      }
    }

    async function refreshAdminSession() {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "same-origin",
        });
        if (!response.ok) {
          throw new Error();
        }
        const payload = (await response.json()) as { authenticated: boolean };
        setIsAdmin(Boolean(payload.authenticated));
        setAdminStatus(
          payload.authenticated
            ? "Admin mode: upload and remove are enabled"
            : "Visitor mode: preview and download only",
        );
      } catch {
        setIsAdmin(false);
        setAdminStatus("Visitor mode: preview and download only");
      }
    }

    void refreshAdminSession();
    void loadCollection("documents", setDocuments, setDocumentsError);
    void loadCollection("use-cases", setUseCases, setUseCasesError);
  }, []);

  async function reloadCollection(collection: CollectionName) {
    const response = await fetch(`/api/${collection}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load collection");
    }

    const payload = (await response.json()) as StoredRecord[];
    if (collection === "documents") {
      setDocuments(payload);
      setDocumentsError(null);
    } else {
      setUseCases(payload);
      setUseCasesError(null);
    }
  }

  async function refreshAdminSession() {
    const response = await fetch("/api/admin/session", { credentials: "same-origin" });
    if (!response.ok) {
      setIsAdmin(false);
      setAdminStatus("Visitor mode: preview and download only");
      return;
    }

    const payload = (await response.json()) as { authenticated: boolean };
    setIsAdmin(Boolean(payload.authenticated));
    setAdminStatus(
      payload.authenticated
        ? "Admin mode: upload and remove are enabled"
        : "Visitor mode: preview and download only",
    );
  }

  function openPreview(record: StoredRecord) {
    setPreviewRecord(record);
    setPreviewMinimized(false);
  }

  function acceptAllPrivacyNotice() {
    window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, PRIVACY_CONSENT_ACCEPTED_VALUE);
    setPrivacyAccepted(true);
    setAnalyticsAccepted(true);
  }

  function acceptEssentialPrivacyNotice() {
    window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, PRIVACY_CONSENT_ESSENTIAL_VALUE);
    setPrivacyAccepted(true);
    setAnalyticsAccepted(false);
  }

  function reopenPrivacyNotice() {
    window.localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
    setPrivacyAccepted(false);
    setAnalyticsAccepted(false);
    setPrivacyConsentChecked(true);
  }

  async function handleUpload(
    collection: CollectionName,
    event: { target: HTMLInputElement },
  ) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`/api/${collection}`, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      if (response.status === 401) {
        setIsAdmin(false);
        setAdminStatus("Visitor mode: preview and download only");
        setAdminFeedback({
          message: "Admin login is required before files can be uploaded.",
          tone: "error",
        });
      } else {
        let errorMessage = "Upload failed. Please try again.";

        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) {
            errorMessage = payload.error;
          }
        } catch {
          // Keep generic fallback.
        }

        setAdminFeedback({ message: errorMessage, tone: "error" });
      }
      event.target.value = "";
      return;
    }

    const createdRecords = (await response.json()) as StoredRecord[];

    if (collection === "documents") {
      setDocuments((current) => [...createdRecords, ...current]);
    } else {
      setUseCases((current) => [...createdRecords, ...current]);
    }

    try {
      await reloadCollection(collection);
    } catch {
      // Keep the optimistic UI state if the immediate refresh lags behind Blob consistency.
    }

    setAdminFeedback({ message: "Upload complete.", tone: "success" });
    event.target.value = "";
  }

  async function handleRemove(record: StoredRecord) {
    if (removingIds.includes(record.id)) {
      return;
    }

    setRemovingIds((current) => [...current, record.id]);
    setAdminFeedback({ message: "Removing item…", tone: "success" });

    let response: Response;

    try {
      response = await fetch(`/api/${record.collection}/${record.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      setRemovingIds((current) => current.filter((id) => id !== record.id));
      setAdminFeedback({
        message: "Remove failed because the server could not be reached.",
        tone: "error",
      });
      return;
    }

    if (!response.ok) {
      if (response.status === 401) {
        setRemovingIds((current) => current.filter((id) => id !== record.id));
        setIsAdmin(false);
        setAdminStatus("Visitor mode: preview and download only");
        setAdminFeedback({
          message: "Admin login expired. Please log in again before removing files.",
          tone: "error",
        });
        return;
      }

      let errorMessage = "Remove failed. Please try again.";

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) {
          errorMessage = payload.error;
        }
      } catch {
        // Keep the generic fallback.
      }

      setRemovingIds((current) => current.filter((id) => id !== record.id));
      setAdminFeedback({
        message: errorMessage,
        tone: "error",
      });
      return;
    }

    if (previewRecord?.id === record.id) {
      setPreviewRecord(null);
      setPreviewMinimized(false);
    }

    if (record.collection === "documents") {
      setDocuments((current) => current.filter((item) => item.id !== record.id));
    } else {
      setUseCases((current) => current.filter((item) => item.id !== record.id));
    }

    setRemovingIds((current) => current.filter((id) => id !== record.id));
    setAdminFeedback({ message: "Item removed.", tone: "success" });

    try {
      await reloadCollection(record.collection);
    } catch {
      setAdminFeedback({
        message: "Item was removed, but the list could not be refreshed automatically.",
        tone: "error",
      });
    }
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = adminPassword.trim();
    if (!password) {
      return;
    }

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setAdminPassword("");
      setAdminStatus("Admin login failed");
      setAdminFeedback({ message: "Admin login failed. Please check the password.", tone: "error" });
      return;
    }

    setAdminPassword("");
    setAdminFeedback({ message: "Admin login successful.", tone: "success" });
    await refreshAdminSession();
  }

  async function handleAdminLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setAdminFeedback({ message: "Logged out.", tone: "success" });
    await refreshAdminSession();
  }

  function renderCollection(
    records: StoredRecord[],
    error: string | null,
    emptyMessage: string,
    className: string,
    placeholderCount = 0,
    compactPlaceholders = false,
  ) {
    if (error) {
      return (
        <div className={className}>
          <ErrorState message={error} />
        </div>
      );
    }

    if (!records.length) {
      return (
        <div className={className}>
          {placeholderCount > 0
            ? Array.from({ length: placeholderCount }).map((_, index) => (
                <PlaceholderCard
                  key={`placeholder-${className}-${index}`}
                  compact={compactPlaceholders}
                />
              ))
            : <EmptyState message={emptyMessage} />}
        </div>
      );
    }

    return (
      <div className={className}>
        {records.map((record) => (
          <FileCard
            key={record.id}
            record={record}
            isAdmin={isAdmin}
            isRemoving={removingIds.includes(record.id)}
            onPreview={openPreview}
            onRemove={handleRemove}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="MedChain home">
          <img src="/assets/medchainlogo_white.png" alt="MedChain" />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#how-it-works">How it Works</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#platform">Team</a>
          <a href="#documents">Documents</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section-dark">
          <div className="container">
            <div className="hero-copy">
              <h1>
                <span>Project MedChain: Building Sweden&apos;s</span>
                <span>Capability for Secure, Circular,</span>
                <span>and Resilient Value Chains.</span>
              </h1>
              <p className="hero-description">
                Backed by Vinnova (Sweden&apos;s Innovation Agency), Project MedChain is a
                cross-sector research initiative establishing the Medical Product Passport (MPP) -
                a sovereign digital infrastructure that guarantees visibility, trust, and
                continuity for critical medical supplies. We transform regulatory obligations into
                a strategic national asset, ensuring that the integrity of product data forms the
                basis for industrial leadership, sustainable healthcare, and unwavering national
                resilience.
              </p>
            </div>
          </div>
        </section>

        <section className="hero-image-section" aria-label="MedChain hero image">
          <img
            className="hero-image"
            src="/assets/hero2-img.jpeg"
            alt="Medical resilience scene connecting home, care, and logistics"
          />
          <div className="gradient-band" />
        </section>

        <section className="overview section-dark" id="how-it-works">
          <div className="container">
            <h2 id="engineering-medical-system-resilience">Engineering Medical System Resilience</h2>
            <p className="section-intro">
              A structural overview of the MedChain Use Case generation methodology.
            </p>

            <div className="system-map-wrap">
              <figure className="system-map">
                <img
                  src="/assets/oversikt.jpeg"
                  alt="Overview diagram of MedChain&apos;s system resilience methodology"
                />

                {HOTSPOTS.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    className={`map-hotspot${activeHotspotId === hotspot.id ? " is-active" : ""}`}
                    type="button"
                    style={hotspot.style}
                    onMouseEnter={() => setActiveHotspotId(hotspot.id)}
                    onFocus={() => setActiveHotspotId(hotspot.id)}
                    onClick={() => setActiveHotspotId(hotspot.id)}
                  >
                    <span className="sr-only">{hotspot.label}</span>
                  </button>
                ))}
              </figure>

              <aside className="map-panel" aria-live="polite">
                <p className="map-panel-label">Hover a highlighted area</p>
                <h3>{activeHotspot.title}</h3>
                <p>{activeHotspot.body}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="research-capability section-light" id="research-capability">
          <div className="container">
            <p className="research-capability-kicker">Research &amp; Capability</p>
            <h2>From Research to National Capability</h2>
            <div className="research-capability-copy">
              <p>
                Project MedChain is an innovation and research initiative funded by Vinnova within
                the Advanced Digitalisation programme. We are currently operating in a critical
                development phase, moving from conceptual architecture to applied validation. Our
                immediate objective is to advance the Medical Product Passport (MPP) framework to
                Technology Readiness Level (TRL) 3-4.
              </p>
              <p>
                This means transitioning from theoretical models to functional prototypes validated
                in controlled lab environments and early field pilots. We are not deploying a
                finished commercial product; we are researching, stress-testing, and laying the
                sovereign digital foundation for what will ultimately become a national standard for
                secure value chains.
              </p>
            </div>
          </div>
        </section>

        <div className="gradient-band" />

        <section className="section-light use-cases" id="use-cases">
          <div className="container">
            <h2>Use Cases</h2>
            <div className="documents-shell use-cases-shell">
              <div className="documents-toolbar">
                <p className="documents-intro">
                  Upload and manage visual use case material. Preview and download remain
                  available to all visitors.
                </p>
                <input
                  ref={useCasesInputRef}
                  id="use-case-input"
                  type="file"
                  accept=".doc,.docx,.jpeg,.jpg,.pdf,.png,.webp,.xls,.xlsx"
                  multiple
                  onChange={(event) => void handleUpload("use-cases", event)}
                />
              </div>
              <article className="section-cta">
                <div>
                  <h3>Engage with Our Validation Pilots</h3>
                  <p>
                    Project MedChain is actively validating the Medical Product Passport framework
                    across operational healthcare environments and Total Defence logistics contexts.
                    Connect with our alliance to explore upcoming use cases, pilot criteria, and
                    stakeholder integration paths.
                  </p>
                </div>
                <a className="section-cta-button" href="#contact">
                  Explore Use Cases &amp; Join the Alliance
                </a>
              </article>
              {renderCollection(
                useCases,
                useCasesError,
                "Upload the first use case asset when admin mode is enabled.",
                "card-grid use-case-grid",
                8,
              )}
            </div>
          </div>
        </section>

        <div className="gradient-band" />

        <section className="strategic-value section-light" id="strategic-value">
          <div className="container">
            <p className="strategic-value-kicker">Strategic Value &amp; Capabilities</p>
            <h2>A National Capability Built for Converging Realities</h2>
            <p className="strategic-value-intro">
              MedChain delivers measurable strategic impact across three critical domains,
              positioning Sweden at the forefront of European digital infrastructure.
            </p>

            <div className="strategic-value-grid">
              <article className="strategic-value-block">
                <p className="strategic-value-label">For Industry</p>
                <h3>Strategic Leadership in Digital Value Chains</h3>
                <p>
                  The EU Digital Product Passport (DPP) is fundamentally restructuring market
                  access. MedChain enables Swedish industry to move beyond mere regulatory
                  compliance, transforming product data integrity into a distinct competitive
                  advantage. We establish the secure infrastructure required to pilot new
                  data-driven business models, ensuring early European leadership in circular and
                  interoperable supply chains.
                </p>
              </article>

              <article className="strategic-value-block">
                <p className="strategic-value-label">For Healthcare</p>
                <h3>Sustainable &amp; Secure Lifecycle Management</h3>
                <p>
                  Healthcare systems operate under severe pressure to increase resource efficiency
                  without compromising care. MedChain delivers real-time, verified visibility into a
                  product&apos;s origin, performance, and sustainability metrics. This systemic
                  transparency allows healthcare providers to optimize procurement, drastically
                  reduce physical waste, and execute true circular flows - securing both
                  environmental sustainability and patient safety.
                </p>
              </article>

              <article className="strategic-value-block">
                <p className="strategic-value-label">For National Resilience</p>
                <h3>Security of Supply &amp; Total Defence</h3>
                <p>
                  In an era of disrupted global logistics, supply chain visibility is a matter of
                  national security. MedChain builds a sovereign capability that guarantees control
                  over critical medical supplies before and during a crisis. By securing
                  civil-military logistics coordination and aligning with NATO interoperability
                  requirements, we provide a foundational data layer for Sweden&apos;s Total Defence.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section-dark consortium" id="platform">
          <div className="container">
            <h2>Consortium Overview</h2>

            {CONSORTIUM_GROUPS.map((group) => (
              <article
                key={group.title}
                className={`consortium-group${group.compact ? " consortium-group-compact" : ""}${group.className ? ` ${group.className}` : ""}`}
                id={group.id}
              >
                <header>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </header>
                <div
                  className={`logo-grid${group.large ? " large" : ""}${group.gridClassName ? ` ${group.gridClassName}` : ""}`}
                >
                  {group.logos.map((logo) =>
                    typeof logo === "string" ? (
                      <span key={logo}>{logo}</span>
                    ) : (
                      <span key={logo.alt} className={logo.wrapClassName}>
                        <img className={logo.imageClassName} src={logo.src} alt={logo.alt} />
                      </span>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="gradient-band" />

        <section className="section-light documents" id="documents">
          <div className="container">
            <h2>Shared documents</h2>
            <div className="documents-shell">
              <div className="documents-toolbar">
                <p className="documents-intro">
                  Upload shared files, preview them in the browser, and download them when needed.
                  Files are stored persistently in this browser.
                </p>
                <input
                  ref={documentsInputRef}
                  id="shared-doc-input"
                  type="file"
                  accept=".doc,.docx,.jpeg,.jpg,.pdf,.png,.webp,.xls,.xlsx"
                  multiple
                  onChange={(event) => void handleUpload("documents", event)}
                />
              </div>
              <article className="section-cta">
                <div>
                  <h3>Review the Strategic Framework</h3>
                  <p>
                    Access the complete executive brief and project documentation to review the
                    underlying technical architecture, governance models, and systemic resilience
                    logic of the Medical Product Passport initiative.
                  </p>
                </div>
                {documents[0] ? (
                  <a
                    className="section-cta-button"
                    href={documents[0].url}
                    download={documents[0].name}
                  >
                    Download Executive Presentation
                  </a>
                ) : (
                  <span className="section-cta-button is-disabled">
                    Download Executive Presentation
                  </span>
                )}
              </article>

              {renderCollection(
                documents,
                documentsError,
                "Upload the first shared document when admin mode is enabled.",
                "doc-grid",
                4,
                true,
              )}
            </div>
          </div>
        </section>

      </main>

      <footer className="site-footer section-dark">
        <div className="container footer-shell">
          <div className="footer-top">
            <a className="brand footer-brand" href="#top" aria-label="MedChain home">
              <img src="/assets/medchainlogo_white.png" alt="MedChain" />
            </a>
          </div>

          <section className="footer-about-block" id="about" aria-labelledby="about-medchain-title">
            <p className="footer-about-kicker">About MedChain</p>
            <h3 id="about-medchain-title">A Converging Opportunity at a Strategic Crossroads</h3>

            <div className="footer-about-grid">
              <div className="footer-about-column">
                <p>
                  The world is changing. Today, healthcare and life science supply chains are
                  exposed to systemic risks - from geopolitical instability and cyber threats to new
                  regulatory pressures like the EU&apos;s Digital Product Passport (DPP). It is no
                  longer just a matter of compliance; product data has become critical national
                  infrastructure.
                </p>
                <p>
                  Project MedChain is Sweden&apos;s proactive response. Supported by Vinnova
                  (Avancerad Digitalisering) and driven by a unique national capability alliance of
                  industry leaders, technology providers, academia, and the defense sector, we are
                  building a secure digital backbone.
                </p>
                <div className="footer-about-subsection">
                  <h4>The Instrument: The Medical Product Passport (MPP)</h4>
                  <p>
                    At the core of MedChain is a transformative concept: every medical product
                    carries a secure digital identity that follows it across its entire lifecycle.
                    This provides verified data on origin, regulatory compliance, sustainability
                    metrics, and location.
                  </p>
                </div>
              </div>

              <div className="footer-about-column">
                <div className="footer-about-subsection">
                  <h4>This establishes a true Dual-Use Capability:</h4>
                  <p>
                    <strong>In Peacetime:</strong> An engine for sustainability and competitiveness.
                    It ensures EU regulatory compliance, enables circular flows (reuse and
                    recycling), and creates new data-driven business models.
                  </p>
                  <p>
                    <strong>During Crisis:</strong> A guarantor of resilience and trust. It provides
                    real-time visibility of critical stocks, verifies product authenticity in
                    disrupted chains, and coordinates rapid redistribution to strengthen Total
                    Defence medical logistics.
                  </p>
                </div>
                <p className="footer-about-closing">
                  We are not just building a platform; we are establishing a new standard for how
                  product data is governed, protected, and utilized to secure a safer, more
                  competitive Sweden.
                </p>
              </div>
            </div>
          </section>

          <div className="footer-contact-admin-grid">
            <div className="footer-contact-block" id="contact">
              <h3>Contact</h3>
              <p>
                Get in contact if you are a part of the project and need to get access for uploading
                documents or User cases.
              </p>
              <form className="contact-form footer-contact-form" onSubmit={(event) => event.preventDefault()}>
                <label className="sr-only" htmlFor="footer-email">
                  Email address
                </label>
                <input id="footer-email" type="email" placeholder="Enter your email" />
                <button type="submit">Get Access</button>
              </form>
            </div>

            <div className="footer-admin-panel">
              <h3>Member Zone</h3>
              <p className="member-zone-note">
                Access is reserved for project members who need to upload or remove project files.
              </p>
              <div className="admin-controls-row footer-admin-controls">
                {!isAdmin ? (
                  <form className="admin-login-form" onSubmit={handleAdminLogin}>
                    <input
                      id="admin-password"
                      type="password"
                      placeholder="Admin password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                    <button type="submit" className="admin-login-button">
                      Admin login
                    </button>
                  </form>
                ) : null}

                <button
                  type="button"
                  className="admin-logout-button"
                  hidden={!isAdmin}
                  onClick={() => void handleAdminLogout()}
                >
                  Log out
                </button>
                <label className="upload-button" htmlFor="use-case-input" hidden={!isAdmin}>
                  Upload use cases
                </label>
                <label className="upload-button" htmlFor="shared-doc-input" hidden={!isAdmin}>
                  Upload files
                </label>
              </div>
              <p className="admin-status footer-admin-status">{adminStatus}</p>
              {adminFeedback ? (
                <p className="admin-feedback" data-tone={adminFeedback.tone}>
                  {adminFeedback.message}
                </p>
              ) : null}
            </div>
          </div>

          <a
            className="privacy-settings-link"
            href="#privacy-and-cookies"
            onClick={(event) => {
              event.preventDefault();
              reopenPrivacyNotice();
            }}
          >
            Privacy and cookies
          </a>
        </div>
      </footer>

      {previewRecord ? (
        <div className="preview-lightbox" hidden={previewMinimized}>
          <div
            className="preview-lightbox-backdrop"
            onClick={() => {
              setPreviewRecord(null);
              setPreviewMinimized(false);
            }}
          />
          <section
            className="preview-lightbox-dialog"
            aria-modal="true"
            role="dialog"
            aria-labelledby="preview-lightbox-title"
          >
            <header className="preview-lightbox-header">
              <div>
                <p className="doc-card-kicker">Preview</p>
                <h3 id="preview-lightbox-title">{previewRecord.name}</h3>
                <p className="preview-lightbox-meta">
                  {previewRecord.type || "Unknown format"} • {formatSize(previewRecord.size)}
                </p>
              </div>
              <div className="preview-lightbox-actions">
                <button
                  type="button"
                  className="preview-lightbox-button"
                  onClick={() => setPreviewMinimized(true)}
                >
                  Minimize
                </button>
                <button
                  type="button"
                  className="preview-lightbox-button"
                  onClick={() => {
                    setPreviewRecord(null);
                    setPreviewMinimized(false);
                  }}
                >
                  Close
                </button>
              </div>
            </header>
            <div className="preview-lightbox-body">
              {previewRecord.type.startsWith("image/") ? (
                <img src={previewRecord.url} alt={previewRecord.name} />
              ) : previewRecord.type === "application/pdf" ? (
                <iframe src={previewRecord.url} title={previewRecord.name} />
              ) : isTextRecord(previewRecord) ? (
                <pre>{previewText}</pre>
              ) : (
                <div className="preview-lightbox-fallback">
                  <p>Preview is not available for this file type in the browser.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {previewRecord && previewMinimized ? (
        <button
          type="button"
          className="preview-restore"
          onClick={() => setPreviewMinimized(false)}
        >
          Reopen preview
        </button>
      ) : null}

      {privacyConsentChecked && !privacyAccepted ? (
        <div className="privacy-consent">
          <div className="privacy-consent-backdrop" />
          <section
            className="privacy-consent-dialog"
            aria-modal="true"
            role="dialog"
            aria-labelledby="privacy-consent-title"
          >
            <p className="doc-card-kicker">GDPR and cookie notice</p>
            <h2 id="privacy-consent-title">Your privacy on MedChain</h2>
            <p>
              MedChain uses only necessary technology to make this website work, including local
              browser storage for this notice and an essential admin session cookie if an authorised
              project member logs in to upload or remove documents. With your consent, the website
              also uses Google Analytics through Google tag to understand aggregate website usage.
              Google may set analytics cookies or similar identifiers for this purpose.
            </p>
            <p>
              Uploaded documents and use cases are made available on this website for public viewing
              and download. Only project members with administration access can upload or delete
              files. If you upload files or choose to contact the project, the information you
              provide may include personal data. That data is processed for project administration,
              document sharing, access management, and collaboration within the Vinnova-funded
              MedChain project.
            </p>
            <p>
              You can accept all cookies or continue with necessary cookies only. You may contact
              the project administrator to request access, correction, deletion, restriction, or
              other rights available under the GDPR.
            </p>
            <div className="privacy-consent-actions">
              <button
                type="button"
                className="privacy-consent-button"
                onClick={acceptAllPrivacyNotice}
              >
                Accept all
              </button>
              <button
                type="button"
                className="privacy-consent-button privacy-consent-secondary"
                onClick={acceptEssentialPrivacyNotice}
              >
                Necessary cookies only
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
