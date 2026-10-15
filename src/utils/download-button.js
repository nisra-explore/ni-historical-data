import { download_dropdown, capture } from "./elements.js";
import { map } from "./plotMap.js";

/**
 * Download dropdown + capture-to-image with:
 * - loading overlay
 * - cancel button (does NOT truly abort html2canvas; it prevents download + hides overlay)
 * - excludes `.card-footer` from capture
 * - gracefully skips map snapshot/replace when `map` is not available (null/undefined) or not rendered
 */

let activeCaptureToken = null;

export function downloadButton(matrix) {
  download_dropdown.innerHTML = ` 
    <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${matrix}/CSV/1.0/">data (in CSV format)</a></li>
    <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${matrix}/XLSX/2007/">data (in Excel format)</a></li>
    <li><a class="dropdown-item" href="#" id="download-capture">charts (as image)</a></li>
  `;

  document.getElementById("download-capture").addEventListener("click", async (e) => {
    e.preventDefault();

    // If a capture is already running, ignore repeated clicks
    if (activeCaptureToken && !activeCaptureToken.done) return;

    const cardEl = document.getElementById(capture.id);
    const mapContainerEl = document.getElementById("map-container");
    const rawText =
      document.getElementById("map-title")?.textContent?.trim() ||
      document.getElementById("chart-title")?.textContent?.trim() ||
      "capture";

    const fileName = rawText
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "capture";

    // Cancellation token for this run
    const token = { cancelled: false, done: false };
    activeCaptureToken = token;

    try {
      showCaptureLoading("Generating image…");
      // Let the overlay paint before heavy work starts
      await new Promise(requestAnimationFrame);

      await exportCardWithMap(cardEl, map, mapContainerEl, `${fileName}.png`, token);
    } catch (err) {
      console.error(err);
      // Only show failure if the user didn't cancel
      if (!token.cancelled) alert("Sorry — the image export failed.");
    } finally {
      token.done = true;
      // Only clear if we're still the active capture
      if (activeCaptureToken === token) activeCaptureToken = null;
      hideCaptureLoading();
    }
  });
}

async function exportCardWithMap(cardEl, mapInstance, mapContainerEl, filename, token) {
  // Allow cancel before starting any heavy work
  if (token?.cancelled) return;

  // Detect whether we should attempt a map snapshot/replace
  const hasMap =
    !!mapInstance &&
    typeof mapInstance.once === "function" &&
    typeof mapInstance.getCanvas === "function";

  const mapContainerVisible = (() => {
    if (!mapContainerEl) return false;
    // If container or its parents are display:none, offsetParent will be null (except for fixed pos; not the case here)
    if (mapContainerEl.offsetParent === null) return false;
    // Also treat 0x0 as "not rendered"
    if (mapContainerEl.clientWidth === 0 || mapContainerEl.clientHeight === 0) return false;
    return true;
  })();

  let dataUrl = null;

  if (hasMap && mapContainerVisible) {
  // Trigger a real layout change first (what manual resize was doing)
  await jiggleLayout(mapContainerEl);

  // Then force MapLibre to recalc + repaint
  mapInstance.resize();
  mapInstance.triggerRepaint?.();

  // Never block forever waiting for idle
  await waitMapIdleOrTimeout(mapInstance, 1500);
  if (token?.cancelled) return;

  // One more frame to ensure pixels are ready
  mapInstance.triggerRepaint?.();
  await new Promise(requestAnimationFrame);

  // Snapshot the WebGL canvas
  const mapCanvas = mapInstance.getCanvas();
  try {
    dataUrl = mapCanvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Map canvas export failed (continuing without map snapshot):", err);
    dataUrl = null;
  }
  if (token?.cancelled) return;
}


  if (mapInstance && typeof mapInstance.resize === "function") {
    // Programmatic equivalent of a window resize
    mapInstance.resize();
    mapInstance.triggerRepaint?.();

    // Never block forever waiting for MapLibre to "settle"
    await waitMapIdleOrTimeout(mapInstance, 1500);

    // Ensure at least one frame of fresh pixels
    mapInstance.triggerRepaint?.();
    await new Promise(requestAnimationFrame);
  }

    // 1) Force a real ResizeObserver-triggering layout change
  // Prefer the map container (this mirrors what manual window resize “fixes”)
  await jiggleLayout(mapContainerEl);

  // 2) Tell MapLibre to re-measure and repaint
  if (mapInstance && typeof mapInstance.resize === "function") {
    mapInstance.resize();
    mapInstance.triggerRepaint?.();
    await new Promise(requestAnimationFrame);
  }


  // Capture WITHOUT touching the live DOM
  let canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,

    // Force html2canvas "virtual viewport" to match your real one,
    // so Bootstrap keeps the same breakpoint (xl, etc.)
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,

    // Exclude footers
    ignoreElements: (el) => el.classList?.contains("card-footer"),

    onclone: (clonedDoc) => {
  if (token?.cancelled) return;

  // Lock the cloned capture width for responsive consistency
  const clonedCard = clonedDoc.getElementById(cardEl.id);
  if (clonedCard) clonedCard.style.width = `${cardEl.getBoundingClientRect().width}px`;

  // If no map snapshot, don’t replace anything
  if (!dataUrl) return;

  // --- Replace ONLY #map, not #map-container ---
  const originalMapDiv = document.getElementById("map");
  const clonedMapDiv = clonedDoc.getElementById("map");
  if (originalMapDiv && clonedMapDiv) {
    const w = originalMapDiv.clientWidth;
    const h = originalMapDiv.clientHeight;

    clonedMapDiv.style.width = `${w}px`;
    clonedMapDiv.style.height = `${h}px`;
    clonedMapDiv.innerHTML = "";

    const img = clonedDoc.createElement("img");
    img.src = dataUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.display = "block";
    clonedMapDiv.appendChild(img);
  }

  // --- Ensure legend is visible in cloned DOM ---
  const originalLegend = document.getElementById("map-legend");
  const clonedLegend = clonedDoc.getElementById("map-legend");
  if (originalLegend && clonedLegend) {
    // Force it to render as a block with a real width (avoid Bootstrap col quirks in clone)
    const lw = originalLegend.getBoundingClientRect().width;
    clonedLegend.style.display = "block";
    clonedLegend.style.width = `${Math.max(1, Math.floor(lw))}px`;
    clonedLegend.style.maxWidth = "100%";
    clonedLegend.style.marginLeft = "auto";
    clonedLegend.style.marginRight = "auto";
  }
}

  });

  // If cancelled while html2canvas was running, do not download
  if (token?.cancelled) return;

  canvas = await addLogoUnderCanvas(canvas, "assets/img/logo/nisra-only-colour.png", {
    padding: 24,
    logoHeight: 60
  });

  // Download
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function showCaptureLoading(message = "Generating image…") {
  let overlay = document.getElementById("capture-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "capture-loading-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(255,255,255,0.75)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backdropFilter = "blur(2px)";

    overlay.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:16px 20px; background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.12); min-width: 280px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:32px; height:32px; border:3px solid rgba(0,0,0,.15); border-top-color: rgba(0,0,0,.55); border-radius:50%; animation: captureSpin .9s linear infinite;"></div>
          <div id="capture-loading-text" style="font: 500 14px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial;">${message}</div>
        </div>
        <button id="capture-cancel-btn" type="button"
          style="padding:6px 12px; border-radius:8px; border:1px solid rgba(0,0,0,.2); background:#fff; cursor:pointer; font: 600 13px system-ui;">
          Cancel
        </button>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `@keyframes captureSpin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  } else {
    const text = overlay.querySelector("#capture-loading-text");
    if (text) text.textContent = message;
    overlay.style.display = "flex";
  }

  // Ensure cancel button always targets the currently active capture
  const cancelBtn = document.getElementById("capture-cancel-btn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (activeCaptureToken) activeCaptureToken.cancelled = true;
      hideCaptureLoading(); // hide immediately for responsiveness
    };
  }
}

function hideCaptureLoading() {
  const overlay = document.getElementById("capture-loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function waitMapIdleOrTimeout(mapInstance, ms = 1500) {
  return Promise.race([
    new Promise((resolve) => mapInstance.once("idle", resolve)),
    new Promise((resolve) => setTimeout(resolve, ms))
  ]);
}

async function jiggleLayout(el) {
  if (!el) return;

  const prevWidth = el.style.width;
  const prevHeight = el.style.height;

  // Use computed size so we can reliably restore
  const w = el.getBoundingClientRect().width;
  const h = el.getBoundingClientRect().height;

  // Only jiggle if we have a size
  if (!w || !h) return;

  el.style.width = `${Math.max(0, Math.floor(w) - 1)}px`;
  el.style.height = `${Math.max(0, Math.floor(h) - 1)}px`;
  await new Promise(requestAnimationFrame);

  el.style.width = `${Math.floor(w)}px`;
  el.style.height = `${Math.floor(h)}px`;
  await new Promise(requestAnimationFrame);

  // Restore inline styles exactly as before
  el.style.width = prevWidth;
  el.style.height = prevHeight;
}

async function addLogoUnderCanvas(originalCanvas, logoSrc, options = {}) {
  const {
    padding = 24,
    logoHeight = 60
  } = options;

  const logo = new Image();
  logo.src = logoSrc;
  logo.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    logo.onload = resolve;
    logo.onerror = reject;
  });

  // Scale logo proportionally
  const scale = logoHeight / logo.height;
  const logoWidth = logo.width * scale;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = originalCanvas.width;
  newCanvas.height =
    originalCanvas.height + padding * 2 + logoHeight;

  const ctx = newCanvas.getContext("2d");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

  // Draw original capture
  ctx.drawImage(originalCanvas, 0, 0);

  // Bottom-right position
  const x =
    newCanvas.width - logoWidth - padding;
  const y =
    originalCanvas.height + padding;

  ctx.drawImage(
    logo,
    x,
    y,
    logoWidth,
    logoHeight
  );

  return newCanvas;
}