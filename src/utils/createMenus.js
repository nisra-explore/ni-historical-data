import { loadTables } from "./loadTables.js";
import { sortObject } from "./sortObject.js";
import { default_table } from "../config/config.js";
import { fillSubjectsMenu, fillProductsMenu, fillNamesMenu, fillGeoMenu, fillStatMenu} from "./fillMenus.js";
import { firstKey } from "./firstKey.js"
import { themes_menu, subjects_menu, products_menu, names_menu, geo_menu, stats_menu, SIDEBAR_OPEN_KEY, getSearch } from "./elements.js";
import { refreshRoute } from "./refreshRoute.js";
import { meta_name } from "../config/config.js";

let tables = {};
let _searchIndex = [];

export async function createMenus () {

    try {
    let data = await loadTables(meta_name);  // ← cached load
    tables = data.tables;
    // Build global search index
    let searchIndex = Object.keys(tables).map(key => {
      const t = tables[key] || {};
      const name = (t.name || "").trim();
      return {
        key,
        name,
        nameLower: name.toLowerCase(),
        theme_code: t.theme_code,
        subject_code: t.subject_code,
        product_code: t.product_code,
        theme: t.theme,
        subject: t.subject,
        product: t.product,
        slug: name.replace(/\s+/g, "-")
      };
    });
  } catch (error) {
    console.error("Failed to load tables:", error);
    return; // bail early if we truly have nothing
  }

    let structure = {};

    for (const [matrix, t] of Object.entries(tables)) {
        const theme = t.theme;
        const theme_code   = String(t.theme_code);
        const subject = String(t.subject);
        const subject_code = String(t.subject_code);
        const product = String(t.product);
        const product_code = String(t.product_code);
        const table_name   = t.name;

        // Build nested structure safely
        structure[theme] ??= {code: theme_code, subjects: {}};
        structure[theme].subjects[subject] ??= {code: subject_code, products: {}};
        structure[theme].subjects[subject].products[product] ??= {code: product_code, tables: {}};

        // Ensure an array at the table_name leaf
        const list = (structure[theme].subjects[subject].products[product].tables[table_name] ??= []);

        // Push matrix if not present
        if (!list.includes(matrix)) list.push(matrix);
    }

    structure = sortObject(structure);

    const current_options = themes_menu.options;

    for (let i = 0; i < Object.keys(structure).length; i ++) {
        let option = document.createElement("option");
        option.value = structure[Object.keys(structure)[i]].code;

        let has_option = false;
        for (let j = 0; j < current_options.length; j ++) {
            if (current_options[j].value == option.value) {
                has_option = true;
            } 
        }

        if (!has_option) {
            option.textContent = Object.keys(structure)[i];
            themes_menu.appendChild(option);
        }
    }

    let selected_theme = tables[default_table].theme_code;

    const search = getSearch();

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_theme = tables[search_split[1]].theme_code;
            break;
        }
    }

    themes_menu.value = selected_theme;

    fillSubjectsMenu(structure, tables, search);
    fillProductsMenu(structure, tables, search);
    fillNamesMenu(structure, tables, search);
    fillGeoMenu(structure, tables, search);
    fillStatMenu(tables, search);

    themes_menu.onchange = async function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const theme = structure[themes_menu.options[themes_menu.selectedIndex].text];
        const subjects = theme.subjects;
        const products = subjects[firstKey(subjects)].products;
        const tables   = products[firstKey(products)].tables;

        const selected_geo = tables[firstKey(tables)][0];

        window.history.pushState({}, "", `?table=${selected_geo}`);

        await refreshRoute();
    }

    subjects_menu.onchange = async function() {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const subject = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text];
        const products = subject.products;

        const subject_name = subjects_menu.options[subjects_menu.selectedIndex].text;

        const census_product = subject_name === "Census"
            ? Object.keys(products)
                .filter(product => /^Census \d{4}$/.test(product))
                .sort((a, b) => Number(b.match(/(\d{4})$/)[1]) - Number(a.match(/(\d{4})$/)[1]))[0]
            : undefined;

        const selected_product = subject_name === "Census" ? (census_product || firstKey(products)) : firstKey(products);
        const tables = products[selected_product].tables;

        const selected_geo = tables[firstKey(tables)][0];
        
        window.history.pushState({}, "", `?table=${selected_geo}`);

        await refreshRoute();
    }

    products_menu.onchange = async function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const product = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text];
        const tables = product.tables;

        const selected_geo = tables[firstKey(tables)][0];

        window.history.pushState({}, "",`?table=${selected_geo}`);
        
        await refreshRoute();
    }

    names_menu.onchange = async function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const tables = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables[names_menu.options[names_menu.selectedIndex].text];
        let selected_geo = tables[0];   

        window.history.pushState({}, "", `?table=${selected_geo}`);

        await refreshRoute();
    }

    geo_menu.onchange = async function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
        window.history.pushState({}, "", `?table=${geo_menu.value}`);

        await refreshRoute();
    }

    stats_menu.onchange = async function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
        window.history.pushState({}, "",`?table=${geo_menu.value}&stat=${stats_menu.value}`);

        await refreshRoute();
    }

    _searchIndex = Object.keys(tables).map(key => {
        const t = tables[key] || {};
        const name = (t.name || "").trim();
        return {
        key,
        name,
        nameLower: name.toLowerCase(),
        theme_code: t.theme_code,
        subject_code: t.subject_code,
        product_code: t.product_code,
        theme: t.theme,
        subject: t.subject,
        product: t.product,
        slug: name.replace(/\s+/g, "-")
        };
    });


}

export function getSearchIndex() {
  return _searchIndex;
}