import { palette, GEOG_PROPS } from "../config/config.js";
import { loadShapes } from "./loadShapes.js";
import { titleCase } from "./titleCase.js";
import { getColour } from "./getColour.js";
import { quantile} from "./quantile.js";
import { themes_menu, map_container, stats_menu,
         page_title, getSearch, geo_menu,
         map_card, nav_product, nav_subject, nav_theme,
         table_title, map_title, headline_stat_label,
         table_updated, stat_info_text, headline_year,
         headline_stat, chart_card, headline_fig } from "./elements.js";     
import { downloadButton } from "./download-button.js";
import { buildCharts } from "./buildCharts.js";
import { buildTables } from "./buildTables.js";
import { addOtherMenus, id_vars, other_selections, other_headline,
         other_vars, subtitle_text } from "./addOtherMenus.js";
import { dataPortalPreview } from "./dataPortalPreview.js";
import { chartDownload } from "./chart-download.js";
import { renamePage } from "./renamePage.js";

export let map;

export async function plotMap (tables, geog_type) {   

    const search = getSearch();

    const matrix = geo_menu.value.replace(/_[0-9]+/, "");
    const statistic = stats_menu.value;

    const time_var = tables[matrix].time;
    
    let year = tables[matrix].time_series[tables[matrix].time_series.length - 1];

    if (!Array.isArray(tables[matrix].time_series)) {
        year = tables[matrix].time_series;
    }

    addOtherMenus(tables, matrix, geog_type, time_var, search);

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
            id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
            '"]}}' + other_selections + 
            '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
            matrix + '"},"version":"2.0"}}');

    const response = await fetch(api_url);
    const {result} = await response.json();

    const stat_label = Object.values(result.dimension.STATISTIC.category.label)[0];
    const unit = result.dimension.STATISTIC.category.unit[statistic].label;

    let plot_ni = false;

    if (geog_type == "none") {
        plot_ni = true;
    } else {
        if (result.dimension[geog_type].category.index.includes("N92000002") || themes_menu.value == "67") {
            plot_ni = true;
        }
    }    

    const niHeadline = headline_year.closest("p");

    if (plot_ni) {
        headline_fig.classList.remove("d-none");
        headline_stat.classList.remove("d-none");
        niHeadline.classList.remove("d-none");
    } else {
        headline_stat.classList.add("d-none");
        headline_fig.classList.add("d-none");
        niHeadline.classList.add("d-none");
    }


        headline_stat_label.innerHTML = `
            ${stat_label}
            <img class="i-button" src="assets/img/icon/info-circle.svg" alt="Information button"
                data-bs-toggle="collapse" data-bs-target="#stat-info" aria-expanded="false"
                aria-controls="stat-info">
        `;

        stat_info_text.innerHTML = `
            <div>Access data at: <a href="https://data.nisra.gov.uk/table/${matrix}" target="_blank">${result.label}</a></div>
            <div>Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong></div>
            <div><a href="mailto:${result.extension.contact.email}">Email for more information</a></div>
        `;

        const chartData = await buildCharts(tables, matrix, statistic, geog_type, result, plot_ni, time_var, subtitle_text, other_headline, other_selections, id_vars, stat_label, unit);
        await buildTables(tables, matrix, statistic, geog_type, year, time_var, other_vars, other_selections, id_vars, unit);
        const data_series = chartData?.data_series ?? [];
        const time_series = chartData?.time_series ?? [];

    if (!plot_ni) {
        
        map_card.classList.remove("col-xl-6")
        chart_card.classList.add("d-none");

        if (geog_type == "COB_BASIC") {
            const spacer = document.createElement("div");
            spacer.classList.add("col-xl-2");
            map_card.classList.remove("col-xl-6");
            map_card.classList.add("col-xl-8");
            map_card.parentElement.insertBefore(spacer, map_card);
        } 
    } else {
        map_card.classList.add("col-xl-6")
    }

    let data;

    if (!["none", "NI"].includes(geog_type)) {

        let u_position;

        if (result.dimension[geog_type].category.index.includes("0")) {
            u_position = result.dimension[geog_type].category.index.indexOf("0")
            result.value.splice(u_position, 1);
            result.dimension[geog_type].category.index.splice(u_position, 1);
            delete result.dimension[geog_type].category.label["0"];
        }

        if (result.dimension[geog_type].category.index.includes("Unknown")) {
            u_position = result.dimension[geog_type].category.index.indexOf("Unknown")
            result.value.splice(u_position, 1);
            result.dimension[geog_type].category.index.splice(u_position, 1);
            delete result.dimension[geog_type].category.label["Unknown"];
        }

        const cleaned = result.value.map(v =>
            typeof v === "number" && !Number.isNaN(v) ? v : null
            );

        data = cleaned;

        // Useful for legend (keep as-is even for COB quintiles)
        let range_min = Math.floor(Math.min(...data.filter(v => v != null)));
        let range_max = Math.ceil(Math.max(...data.filter(v => v != null)));

        let colours = [];

        if (geog_type === "COB_BASIC") {
            // Build evenly-sized quintile thresholds (20/40/60/80%)
            const vals = data.filter(v => v != null).sort((a, b) => a - b);
            const qs = [0.2, 0.4, 0.6, 0.8].map(p => quantile(vals, p));

            // Map each value to a bin 0..4, then normalize to 0..1 in steps of 0.25
            const toBin = (v) => {
                if (v == null) return -1;              // “no data”
                if (v <= qs[0]) return 0;
                if (v <= qs[1]) return 1;
                if (v <= qs[2]) return 2;
                if (v <= qs[3]) return 3;
                return 4;
            };

            for (let i = 0; i < data.length; i++) {
                const bin = toBin(data[i]);
                colours.push(bin < 0 ? -1 : bin / 4);  // -1 marks NA; 0, .25, .5, .75, 1 for bins
            }
        } else {
            // Original continuous scaling
            const range = range_max - range_min || 1; // avoid divide-by-zero
            for (let i = 0; i < data.length; i++) {
                const v = data[i];
                colours.push(v == null ? -1 : (v - range_min) / range);
            }
        }

        let min_value;
        let max_value;

        if (!document.getElementById("map-legend")) {

            let legend_div = document.createElement("div");
            legend_div.id = "map-legend";
            legend_div.classList.add("map-legend");
            legend_div.classList.add("align-self-center");
            legend_div.classList.add("col-6");

            let legend_row_1 = document.createElement("div");
            legend_row_1.classList.add("row");

            min_value = document.createElement("div");
            min_value.id = "legend-min";
            min_value.classList.add("legend-min");
            legend_row_1.appendChild(min_value);

            let unit_value = document.createElement("div");
            unit_value.classList.add("legend-unit");
            if (unit.toLowerCase() != "number") {
                unit_value.innerHTML = `(${unit})`;
            }
            legend_row_1.appendChild(unit_value);

            max_value = document.createElement("div");
            max_value.id = "legend-max";
            max_value.classList.add("legend-max");
            legend_row_1.appendChild(max_value);

            legend_div.appendChild(legend_row_1);

            let legend_row_2 = document.createElement("div");
            legend_row_2.classList.add("row");

            for (let i = 0; i < palette.length; i++) {
                let colour_block = document.createElement("div");
                colour_block.style.backgroundColor = palette[i];
                colour_block.style.opacity = "0.8";
                colour_block.classList.add("colour-block");
            
                if (i == palette.length - 1) {
                    colour_block.style.borderRight = "1px #555555 solid;"
                }

                legend_row_2.appendChild(colour_block);
            }

            legend_div.appendChild(legend_row_2);

            map_container.appendChild(legend_div);


        } else {

            min_value = document.getElementById("legend-min");
            max_value = document.getElementById("legend-max");

        }

        

        // Create a div for map to sit in

        let map_div;

        if (!document.getElementById("map")) {

            map_div = document.createElement("div");
            map_div.id ="map";
            map_container.appendChild(map_div);

        } else {
            map_div = document.getElementById("map");
        }

        
        
        map_div.classList.add("map");

        let map_title_text = `${stat_label} by ${result.dimension[geog_type].label} (${year})`;
        map_title.textContent = map_title_text;

        
        

        let initialZoom = window.innerWidth < 768 ? 6 : 7; 
        let bounds = [[-12.0, 52.0], [-2.0, 56.5]];

        if (geog_type == "COB_BASIC") {
            initialZoom = 1;
            bounds = null;
        }

        // Create a map
       map = new maplibregl.Map({
            container: 'map',
            style: 'public/map/style-omt.json',
            center: [-6.85, 54.67],
            zoom: initialZoom,
            minZoom: initialZoom - 7,
            maxZoom: initialZoom + 7,
            maxBounds: bounds,
            attributionControl: false,
            dragRotate: false,
            preserveDrawingBuffer: true,
            cooperativeGestures: true,
            disableRotation: false
        });         
        
        map.dragPan.disable();
        
        // After creating `map`
        map.addControl(
        new maplibregl.NavigationControl({
            showZoom: true,     // +/− buttons
            showCompass: false, // hide rotate/compass
            visualizePitch: false
        }),
        'top-right'           // positions: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
        );
            
        const geojsonData = await loadShapes(geog_type);


        map.on('load', async () => {

            // addExportControl(map, map_title_text);

            
            // --- 1) Prepare a styled copy of your GeoJSON with props used by the map ---
            // Assumes these are already in scope: geojsonData, geog_type, result, year, unit,
            // data (array of values), colours (0..1 or bins), getColour(), GEOG_PROPS, titleCase()

            const features = geojsonData.features.map((f, idx) => {
                // Match your Leaflet logic to find this feature’s index in the data array
                const codeProp = GEOG_PROPS[geog_type].code_var;
                const code = String(f.properties[codeProp]).replace(/\s+/g, "");
                const geogIndex = result.dimension[geog_type].category.index.indexOf(code);

                const rawValue = geogIndex >= 0 ? data[geogIndex] : null;
                const label =
                titleCase(result.dimension[geog_type].category.label[code] || code);

                // Convert your normalized/binned "colours[geogIndex]" to an actual hex
                const fillHex =
                rawValue == null
                    ? "#eeeeee"                   // fallback for “no data”
                    : getColour(colours[geogIndex]);

                return {
                ...f,
                id: idx, // stable id for feature-state hover
                properties: {
                    ...f.properties,
                    nisra_code: code,
                    nisra_value: rawValue,
                    nisra_label: label,
                    nisra_unit: unit,
                    nisra_year: year,
                    nisra_fill: fillHex,
                    nisra_hasValue: rawValue !== null && rawValue !== undefined
                }
                };
            });

            const styledGeojson = { ...geojsonData, features };

            // If re-running, clear any previous source/layers
            if (map.getLayer('shapes-outline')) map.removeLayer('shapes-outline');
            if (map.getLayer('shapes-fill')) map.removeLayer('shapes-fill');
            if (map.getSource('shapes')) map.removeSource('shapes');

            // --- 2) Source ---
            map.addSource('shapes', {
                type: 'geojson',
                data: styledGeojson,
                generateId: true
            });

            // --- 3) Fill layer (TOP of stack; ~20% transparency => 0.8 opacity) ---
            map.addLayer({
                id: 'shapes-fill',
                type: 'fill',
                source: 'shapes',
                paint: {
                'fill-color': [
                    'case',
                    ['boolean', ['get', 'nisra_hasValue'], false],
                    ['get', 'nisra_fill'],
                    '#eeeeee'
                ],
                // hover slightly stronger than default
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.8,   // on hover
                    0.7    // default = 20% transparency
                ]
                }
            }); // no beforeId ⇒ above all basemap labels/roads

            // --- 4) Outline layer (also on top) ---
            map.addLayer({
                id: 'shapes-outline',
                type: 'line',
                source: 'shapes',
                paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#222222',   // darker when hovered
                    '#555555'
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    2,
                    1
                ],
                'line-opacity': 0.9
                }
            });

            // --- 5) Hover interactivity: cursor, highlight, tooltip ---
            let hoveredId = null;
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: [0, -6],
                className: 'nisra-popup' // optional: style in CSS if you like
            });

            map.on('mousemove', 'shapes-fill', (e) => {
                map.getCanvas().style.cursor = 'pointer';

                const f = e.features && e.features[0];
                if (!f) return;

                // feature-state hover toggling
                if (hoveredId !== null) {
                map.setFeatureState({ source: 'shapes', id: hoveredId }, { hover: false });
                }
                hoveredId = f.id;
                map.setFeatureState({ source: 'shapes', id: hoveredId }, { hover: true });

                // tooltip content from properties we attached above
                const p = f.properties;
                const valueStr = (p.nisra_value == null)
                ? 'Not available'
                : Number(p.nisra_value).toLocaleString('en-GB');

                const unitPart = (p.nisra_unit && p.nisra_unit.toLowerCase() !== 'number')
                ? ` (${p.nisra_unit})`
                : '';

                const html = `
                <div>
                    <strong>${p.nisra_label}</strong> (${p.nisra_year}): 
                    <strong>${valueStr}</strong>${unitPart}
                </div>`.trim();

                popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            });

            map.on('mouseleave', 'shapes-fill', () => {
                map.getCanvas().style.cursor = '';
                if (hoveredId !== null) {
                map.setFeatureState({ source: 'shapes', id: hoveredId }, { hover: false });
                hoveredId = null;
                }
                popup.remove();
            });
            });          
            
            min_value.innerHTML = range_min.toLocaleString("en-GB");       
            max_value.innerHTML = range_max.toLocaleString("en-GB"); 

        } else {
            data = data_series;
        }

        table_title.textContent = tables[matrix].name;

        page_title.textContent = renamePage(tables[matrix].name);
        
        // page_title.textContent = `NISRA Data Explorer - ${tables[matrix].name}`;

        nav_theme.textContent = tables[geo_menu.value].theme;        
        nav_subject.textContent = tables[geo_menu.value].subject;    
        nav_product.textContent = tables[geo_menu.value].product;
        
        const updated_text = `${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}`;
        
        table_updated.innerHTML = `<strong>Data last updated:</strong> ${updated_text}`;

        dataPortalPreview(tables, matrix, data, result, stat_label, geog_type, year, unit, time_series);       

        // Handle download button at top of page
        downloadButton(matrix);

        // Download button for map
        let map_query = {
            "STATISTIC": statistic,
            [time_var]: year
        };

        let chart_query = {
            "STATISTIC": statistic,
            [geog_type]: "N92000002",
            [time_var]: time_series
        };

        const other_selections_parsed = JSON.parse(`{${other_selections.replace(/^,/, '')}}`);

        other_vars.forEach(v => {
            map_query[v] = other_selections_parsed[v].category.index;
            chart_query[v] = other_selections_parsed[v].category.index;
        });

        chartDownload(
            "map-capture",
            matrix,
            tables[geo_menu.value].subject_code,
            tables[geo_menu.value].product_code,
            map_query,
            "map",
            updated_text
        );

        // Download button for chart
        chartDownload(
            "chart-capture",
            matrix,
            tables[geo_menu.value].subject_code,
            tables[geo_menu.value].product_code,
            chart_query,
            "chart",
            updated_text
        );

}