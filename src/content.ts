interface GrabStylesWindow extends Window {
  __grabStylesInitialized?: boolean;
  __grabStylesTogglePicker?: () => void;
}

const win = window as GrabStylesWindow;

function describeElement(el: Element): string {
  let desc = el.tagName.toLowerCase();
  if (el.id) desc += `#${el.id}`;
  if (el.classList.length) {
    desc += Array.from(el.classList)
      .map((c) => `.${c}`)
      .join("");
  }
  return desc;
}

function computedStyleBlock(el: Element): string {
  const cs = getComputedStyle(el);
  const lines: string[] = [];
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    lines.push(`${prop}: ${cs.getPropertyValue(prop)};`);
  }
  return lines.join("\n");
}

function buildCssForSubtree(root: Element): string {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];
  return elements
    .map((el) => `/* ${describeElement(el)} */\n${computedStyleBlock(el)}`)
    .join("\n\n");
}

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
  let htmlTextarea: HTMLTextAreaElement | null = null;
  let cssTextarea: HTMLTextAreaElement | null = null;

  function ensurePanel(): { html: HTMLTextAreaElement; css: HTMLTextAreaElement } {
    if (panelHost && htmlTextarea && cssTextarea) {
      return { html: htmlTextarea, css: cssTextarea };
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
        width: 420px;
        max-height: 85vh;
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
      .field-label {
        margin: 8px 12px 0;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #999;
      }
      .body {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      textarea {
        height: 160px;
        margin: 6px 12px 12px;
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
    label.textContent = "Grab Styles";
    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", hidePanel);
    header.appendChild(label);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "body";

    const htmlLabel = document.createElement("div");
    htmlLabel.className = "field-label";
    htmlLabel.textContent = "HTML";
    const htmlArea = document.createElement("textarea");
    htmlArea.readOnly = true;

    const cssLabel = document.createElement("div");
    cssLabel.className = "field-label";
    cssLabel.textContent = "CSS";
    const cssArea = document.createElement("textarea");
    cssArea.readOnly = true;

    body.appendChild(htmlLabel);
    body.appendChild(htmlArea);
    body.appendChild(cssLabel);
    body.appendChild(cssArea);

    panel.appendChild(header);
    panel.appendChild(body);
    shadow.appendChild(style);
    shadow.appendChild(panel);

    document.documentElement.appendChild(panelHost);
    htmlTextarea = htmlArea;
    cssTextarea = cssArea;
    return { html: htmlArea, css: cssArea };
  }

  function showPanel(html: string, css: string): void {
    const { html: htmlArea, css: cssArea } = ensurePanel();
    htmlArea.value = html;
    cssArea.value = css;
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
      showPanel(hoveredEl.outerHTML, buildCssForSubtree(hoveredEl));
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
