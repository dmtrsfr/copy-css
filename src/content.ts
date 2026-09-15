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

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function serializeAttrs(el: Element): string {
  return Array.from(el.attributes)
    .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
    .join("");
}

function prettyPrintElement(el: Element, depth = 0): string {
  const indent = "  ".repeat(depth);
  const tag = el.tagName.toLowerCase();
  const attrs = serializeAttrs(el);
  const openTag = `<${tag}${attrs}>`;

  if (VOID_ELEMENTS.has(tag)) {
    return `${indent}${openTag}`;
  }

  const childLines: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      childLines.push(prettyPrintElement(child as Element, depth + 1));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        childLines.push(`${"  ".repeat(depth + 1)}${escapeText(text)}`);
      }
    }
  }

  if (childLines.length === 0) {
    return `${indent}${openTag}</${tag}>`;
  }

  return `${indent}${openTag}\n${childLines.join("\n")}\n${indent}</${tag}>`;
}

let referenceContainer: HTMLDivElement | null = null;
const referenceStyleCache = new Map<string, CSSStyleDeclaration>();

function getReferenceStyle(tagName: string): CSSStyleDeclaration {
  const cached = referenceStyleCache.get(tagName);
  if (cached) return cached;

  if (!referenceContainer) {
    referenceContainer = document.createElement("div");
    referenceContainer.style.cssText =
      "all: initial; position: absolute; top: -99999px; left: -99999px; visibility: hidden; pointer-events: none;";
    document.documentElement.appendChild(referenceContainer);
  }
  const ref = document.createElement(tagName);
  referenceContainer.appendChild(ref);
  const cs = getComputedStyle(ref);
  referenceStyleCache.set(tagName, cs);
  return cs;
}

function computedStyleDeclarations(el: Element): string {
  const cs = getComputedStyle(el);
  const ref = getReferenceStyle(el.tagName.toLowerCase());
  const lines: string[] = [];
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    if (prop.startsWith("--")) continue;
    const value = cs.getPropertyValue(prop);
    if (value === ref.getPropertyValue(prop)) continue;
    lines.push(`  ${prop}: ${value};`);
  }
  return lines.join("\n");
}

function buildCssForSubtree(root: Element): string {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];
  const seen = new Map<string, number>();
  return elements
    .map((el) => {
      const base = describeElement(el);
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      const selector = count > 1 ? `${base} /* ${count} */` : base;
      return `${selector} {\n${computedStyleDeclarations(el)}\n}`;
    })
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

  let toastHost: HTMLDivElement | null = null;
  let toastEl: HTMLDivElement | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function ensureToast(): HTMLDivElement {
    if (toastHost && toastEl) return toastEl;

    toastHost = document.createElement("div");
    toastHost.style.all = "initial";
    toastHost.style.position = "fixed";
    toastHost.style.zIndex = "2147483647";

    const shadow = toastHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translate(-50%, 8px);
        padding: 8px 16px;
        background: #1e1e1e;
        color: #e6e6e6;
        border: 1px solid #444;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        pointer-events: none;
      }
      .toast.visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    `;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "Copied to clipboard";

    shadow.appendChild(style);
    shadow.appendChild(toast);
    document.documentElement.appendChild(toastHost);
    toastEl = toast;
    return toast;
  }

  function showToast(message: string): void {
    const toast = ensureToast();
    toast.textContent = message;
    if (toastTimer) clearTimeout(toastTimer);
    // force reflow so re-triggering the transition works if already visible
    toast.classList.remove("visible");
    void toast.offsetWidth;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 1500);
  }

  function copySnippet(html: string, css: string): void {
    const snippet = `<style>\n${css}\n</style>\n${html}`;
    navigator.clipboard
      .writeText(snippet)
      .then(() => showToast("Copied to clipboard"))
      .catch((err) => {
        console.error("[grab-styles] failed to copy to clipboard:", err);
        showToast("Copy failed");
      });
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
      copySnippet(prettyPrintElement(hoveredEl), buildCssForSubtree(hoveredEl));
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
