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

  let panelHost: HTMLDivElement | null = null;
  let panelTextarea: HTMLTextAreaElement | null = null;

  function ensurePanel(): { textarea: HTMLTextAreaElement } {
    if (panelHost && panelTextarea) {
      return { textarea: panelTextarea };
    }

    panelHost = document.createElement("div");
    panelHost.style.all = "initial";
    panelHost.style.position = "fixed";
    panelHost.style.zIndex = "2147483647";

    const shadow = panelHost.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      .panel {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 380px;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        color: #e6e6e6;
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #444;
        font-weight: 600;
      }
      .close {
        cursor: pointer;
        background: none;
        border: none;
        color: #e6e6e6;
        font-size: 16px;
        line-height: 1;
        padding: 2px 6px;
      }
      .close:hover {
        color: #fff;
      }
      textarea {
        flex: 1;
        min-height: 200px;
        margin: 12px;
        margin-top: 8px;
        padding: 8px;
        background: #111;
        color: #d4d4d4;
        border: 1px solid #333;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12px;
        resize: vertical;
      }
    `;

    const panel = document.createElement("div");
    panel.className = "panel";

    const header = document.createElement("div");
    header.className = "header";
    const label = document.createElement("span");
    label.textContent = "HTML";
    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", hidePanel);
    header.appendChild(label);
    header.appendChild(closeBtn);

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;

    panel.appendChild(header);
    panel.appendChild(textarea);
    shadow.appendChild(style);
    shadow.appendChild(panel);

    document.documentElement.appendChild(panelHost);
    panelTextarea = textarea;
    return { textarea };
  }

  function showPanel(html: string): void {
    const { textarea } = ensurePanel();
    textarea.value = html;
    if (panelHost) {
      panelHost.style.display = "block";
    }
  }

  function hidePanel(): void {
    if (panelHost) {
      panelHost.style.display = "none";
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
      showPanel(hoveredEl.outerHTML);
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
