interface GrabStylesWindow extends Window {
  __grabStylesInitialized?: boolean;
  __grabStylesTogglePicker?: () => void;
}

const win = window as GrabStylesWindow;

function init(): void {
  win.__grabStylesInitialized = true;

  let active = false;
  let hoveredEl: HTMLElement | null = null;

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.zIndex = "2147483647";
  overlay.style.pointerEvents = "none";
  overlay.style.background = "rgba(66, 133, 244, 0.25)";
  overlay.style.border = "1px solid rgba(66, 133, 244, 0.9)";
  overlay.style.boxSizing = "border-box";
  overlay.style.display = "none";
  overlay.style.transition = "none";

  function ensureOverlayMounted(): void {
    if (!overlay.isConnected) {
      document.documentElement.appendChild(overlay);
    }
  }

  function positionOverlay(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = "block";
  }

  function onMouseMove(e: MouseEvent): void {
    const el = e.target as HTMLElement | null;
    if (!el || el === overlay) return;
    hoveredEl = el;
    ensureOverlayMounted();
    positionOverlay(el);
  }

  function onClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (hoveredEl) {
      console.log("[grab-styles] selected element:", hoveredEl);
    }
    deactivate();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      deactivate();
    }
  }

  function activate(): void {
    if (active) return;
    active = true;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.documentElement.style.cursor = "crosshair";
  }

  function deactivate(): void {
    if (!active) return;
    active = false;
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.documentElement.style.cursor = "";
    overlay.style.display = "none";
    hoveredEl = null;
  }

  win.__grabStylesTogglePicker = (): void => {
    if (active) {
      deactivate();
    } else {
      activate();
    }
  };
}

if (!win.__grabStylesInitialized) {
  init();
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "grab-styles:toggle-picker") {
      win.__grabStylesTogglePicker?.();
    }
  });
}
