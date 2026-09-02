import { map } from "./plotMap.js";

// ===== ADD DOWNLOAD OPTIONS TO A CARD =====
//
// Add a download dropdown to a dashboard card.
//
// The dropdown allows users to download:
//
//   • the selected data as a CSV file
//   • the selected data as an Excel file
//   • the displayed chart or map as a PNG image
//
// The function converts the supplied query object into the query structure
// expected by the PxStat API. It also reads the matrix metadata to obtain the
// subject and product names required for the API download URLs.
//
// PARAMETERS
//
// capture_id
//   The ID of the dashboard card that contains the chart or map.
//
//   The function uses this ID to:
//
//     • find the card in the page
//     • find its footer
//     • create a unique ID for the download link
//     • capture the card as an image
//
//   Example:
//
//     capture_id: "population-chart-card"
//
// matrix
//   The matrix code identifying the dataset.
//
//   This is passed to readData(), which returns:
//
//     • matrix_data: the rows loaded from the matrix CSV file
//     • matrix_meta: metadata for the matrix from data.json
//
//   The metadata must include subject and product properties because these
//   values are inserted into the PxStat API download URLs.
//
// update_date
//   A formatted date describing when the data was last updated.
//
//   This value is displayed in the card footer.
//
//   Example:
//
//     update_date: "30 June 2025"
//
// query
//   An object describing which values should be included in the downloaded
//   dataset.
//
//   Each property name is a PxStat dimension code. Its value is either one
//   selected item or an array of selected items.
//
//   Example:
//
//     {
//       Year: [2022, 2023],
//       Sex: "All persons"
//     }
//
//   The function converts this object into the longer array structure expected
//   by the PxStat API.
//
//   This conversion is broadly similar to reshaping or mapping values into a
//   list of query specifications in R.
//
// plot_type
//   Controls how the image export is created.
//
//     "chart"  captures a standard chart card using html2canvas
//     "map"    captures the MapLibre map separately before combining it
//              with the rest of the card
//
//   The default is "chart".
//
// RETURNS
//
// Returns a Promise because the function is asynchronous.
//
// The Promise resolves after the download controls and event listeners have
// been added to the page. The function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • removes any existing download dropdown from the card footer
//   • adds a new download dropdown to the footer
//   • reads the matrix CSV rows and metadata
//   • creates CSV and Excel download URLs
//   • attaches an image-download event listener
//   • triggers browser downloads when the user selects an option
export async function chartDownload (capture_id, matrix, subject_code, product_code, query, plot_type = "chart", update_date) {

    // ===== READ THE MATRIX METADATA =====
    // const [, matrix_meta] = await readData(matrix);
    // ===== PREPARE THE CARD FOOTER =====
    const capture = document.getElementById(capture_id);
    const footer = capture.parentElement.querySelector(".card-footer");

    if (footer.getElementsByClassName("dropdown").length > 0) {
        footer.removeChild(footer.querySelector(".dropdown"));
    };

    let footerContent = document.createElement("div");
    footerContent.classList.add("dropdown");

    // ===== BUILD THE PXSTAT QUERY =====
    let query_long = [];
    for (let i = 0; i < Object.keys(query).length; i ++) {
      query_long.push({
        "code": Object.keys(query)[i],
        "selection": {
          "filter": "item",
          "values": Array.isArray(Object.values(query)[i]) ? Object.values(query)[i] : [Object.values(query)[i]]
        }
      })
    }

    const csv_query_string = encodeURIComponent(JSON.stringify({
      "query": query_long,
      "response": {
        "format": "csv",
        "pivot": null,
        "codes": false
      }
    }));


    const xl_query_string = csv_query_string.replace("csv", "xlsx");

    // ===== ADD THE DOWNLOAD MENU =====
    footerContent.innerHTML = `
        <span class="text-secondary"><strong>Data last updated:</strong> ${update_date}</span>
        <div>
            <button class="btn btn-secondary dropdown-toggle btn-primary mt-2" type="button" id="${capture_id}-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                Download
            </button>
            
            <ul class="dropdown-menu" aria-labelledby="${capture_id}-dropdown">
                <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.PxAPIv1/en/${subject_code}/${product_code}/${matrix}?query=${csv_query_string}">${plot_type} data (in CSV format)</a></li>
                <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.PxAPIv1/en/${subject_code}/${product_code}/${matrix}?query=${xl_query_string}">${plot_type} data (in Excel format)</a></li>
                <li><a class="dropdown-item" href="#" id="download-${capture_id}">${plot_type} (as image)</a></li>
            </ul>
            </div>
        
    `;

    footer.appendChild(footerContent);

    // ===== CONFIGURE MAP IMAGE DOWNLOADS =====
    if (plot_type == "map") {
        document.getElementById(`download-${capture_id}`).addEventListener("click", async (e) => {
        e.preventDefault();

        const cardEl = document.getElementById(capture_id);
        const mapContainerEl = document.getElementById("map-container");

        const rawText = document.getElementById("map-title").textContent;

        const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // Remove special characters
                    .replace(/\s+/g, "-")           // Replace spaces with hyphens
                    .replace(/-+/g, "-");           // Collapse repeated hyphens

        await exportCardWithMap(cardEl, map, mapContainerEl, `${fileName}.png`);
        });

    // ===== CONFIGURE STANDARD CHART IMAGE DOWNLOADS =====
    } else {
        document
            .getElementById(`download-${capture_id}`)
                .addEventListener("click", function (e) {
                    e.preventDefault();
                    
                    const header = capture.querySelector(".card-header");

                    const rawText = header.innerText || header.textContent;

                    const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // Remove special characters
                    .replace(/\s+/g, "-")           // Replace spaces with hyphens
                    .replace(/-+/g, "-");           // Collapse repeated hyphens

                    html2canvas(capture, {
                        backgroundColor: "#ffffff",
                        scale: 2,
                        useCORS: true
                    }).then(async (canvas) => {

                        const finalCanvas = await addLogoUnderCanvas(
                            canvas,
                            "assets/img/logo/nisra-only-colour.png",
                            {
                            logoHeight: 70,
                            padding: 24
                            }
                        );

                        const link = document.createElement("a");
                        link.download = `${fileName}.png`;
                        link.href = finalCanvas.toDataURL("image/png");
                        link.click();
                    });

                });
    }

    

}

// ===== EXPORT A CARD CONTAINING A MAP =====
//
// Capture a dashboard card containing a MapLibre map and download it as a PNG.
//
// MapLibre maps use a WebGL canvas, which html2canvas may not capture reliably.
// This helper therefore:
//
//   • forces the map to resize/repaint
//   • snapshots the live WebGL canvas at the correct size
//   • creates a cloned version of the dashboard card
//   • replaces the cloned map with the captured image
//   • captures the cloned card with html2canvas
//   • adds the NISRA logo beneath the result
//   • downloads the final PNG
async function exportCardWithMap(cardEl, mapInstance, mapContainerEl, filename, token) {
  if (token?.cancelled) return;

  const hasMap =
    !!mapInstance &&
    typeof mapInstance.once === "function" &&
    typeof mapInstance.getCanvas === "function";

  const mapContainerVisible = (() => {
    if (!mapContainerEl) return false;
    if (mapContainerEl.offsetParent === null) return false;
    if (mapContainerEl.clientWidth === 0 || mapContainerEl.clientHeight === 0) return false;
    return true;
  })();

  let dataUrl = null;

  if (hasMap && mapContainerVisible) {
    await jiggleLayout(mapContainerEl);

    mapInstance.resize();
    mapInstance.triggerRepaint?.();

    await waitMapIdleOrTimeout(mapInstance, 1500);
    if (token?.cancelled) return;

    mapInstance.triggerRepaint?.();
    await new Promise(requestAnimationFrame);

    try {
      dataUrl = mapInstance.getCanvas().toDataURL("image/png");
    } catch (err) {
      console.warn("Map canvas export failed (continuing without map snapshot):", err);
      dataUrl = null;
    }

    if (token?.cancelled) return;
  }

  if (mapInstance && typeof mapInstance.resize === "function") {
    mapInstance.resize();
    mapInstance.triggerRepaint?.();
    await waitMapIdleOrTimeout(mapInstance, 1500);
    mapInstance.triggerRepaint?.();
    await new Promise(requestAnimationFrame);
  }

  await jiggleLayout(mapContainerEl);

  if (mapInstance && typeof mapInstance.resize === "function") {
    mapInstance.resize();
    mapInstance.triggerRepaint?.();
    await new Promise(requestAnimationFrame);
  }

  const canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    ignoreElements: (el) => el.classList?.contains("card-footer"),
    onclone: (clonedDoc) => {
      if (token?.cancelled) return;

      const clonedCard = clonedDoc.getElementById(cardEl.id);
      if (clonedCard) {
        clonedCard.style.width = `${cardEl.getBoundingClientRect().width}px`;
      }

      if (!dataUrl) return;

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

      const originalLegend = document.getElementById("map-legend");
      const clonedLegend = clonedDoc.getElementById("map-legend");
      if (originalLegend && clonedLegend) {
        const legendWidth = originalLegend.getBoundingClientRect().width;
        clonedLegend.style.display = "block";
        clonedLegend.style.width = `${Math.max(1, Math.floor(legendWidth))}px`;
        clonedLegend.style.maxWidth = "100%";
        clonedLegend.style.marginLeft = "auto";
        clonedLegend.style.marginRight = "auto";
      }
    }
  });

  if (token?.cancelled) return;

  const finalCanvas = await addLogoUnderCanvas(canvas, "assets/img/logo/nisra-only-colour.png", {
    logoHeight: 70,
    padding: 24
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
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

  const scale = logoHeight / logo.height;
  const logoWidth = logo.width * scale;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = originalCanvas.width;
  newCanvas.height =
    originalCanvas.height + padding * 2 + logoHeight;

  const ctx = newCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

  ctx.drawImage(originalCanvas, 0, 0);

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

  const w = el.getBoundingClientRect().width;
  const h = el.getBoundingClientRect().height;

  if (!w || !h) return;

  el.style.width = `${Math.max(0, Math.floor(w) - 1)}px`;
  el.style.height = `${Math.max(0, Math.floor(h) - 1)}px`;
  await new Promise(requestAnimationFrame);

  el.style.width = `${Math.floor(w)}px`;
  el.style.height = `${Math.floor(h)}px`;
  await new Promise(requestAnimationFrame);

  el.style.width = prevWidth;
  el.style.height = prevHeight;
}
