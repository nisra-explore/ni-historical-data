// Global fetch of html elements
export const themes_menu = document.getElementById("theme");
export const subjects_menu = document.getElementById("subject");
export const products_menu = document.getElementById("product");
export const names_menu = document.getElementById("name");
export const geo_menu = document.getElementById("geo");
export const stats_menu = document.getElementById("stat");
export const chart_container = document.getElementById("chart-container");
export const map_container = document.getElementById("map-container");
export const map_subtitle = document.getElementById("map-subtitle");
export const metadata_text = document.getElementById("metadata-text");
export const other_menu = document.getElementById("other-vars");
export const page_title = document.getElementsByTagName("title")[0];
export const table_preview = document.getElementById("table-preview");
export const sidebarEl = document.getElementById("sidebar");
export const globalSearchResults = document.getElementById("global-search-results");
export const globalSearchWrap = document.querySelector(".sidebar-search");
export const globalSearchInput = document.getElementById("global-search");
export const map_card = document.getElementById("map-card");
export const chart_card = document.getElementById("chart-card");
export const headline = document.getElementById("headline");
export const chart_title = document.getElementById("chart-title");
export const chart_subtitle = document.getElementById("chart-subtitle");
export const headline_fig = document.getElementById("headline-fig");
export const headline_stat = document.getElementById("headline-stat");
export const dp_link = document.getElementById("dp-link");
export const chart_updated = document.getElementById("chart-updated");
export const nav_product = document.getElementById("nav-product");
export const nav_subject = document.getElementById("nav-subject");
export const nav_theme = document.getElementById("nav-theme");
export const table_title = document.getElementById("table-title");
export const map_updated = document.getElementById("map-updated");
export const map_title = document.getElementById("map-title");
export const title_card = document.getElementById("title-card");
export const additional_tables = document.getElementById("additional-tables");
export const table_tabs = document.getElementById("table-tabs");
export const table_tabs_content = document.getElementById("table-tabs-content");
export const tables_title = document.getElementById("tables-title");
export const table_updated = document.getElementById("table-updated");
export const share_btn = document.getElementById("share-btn");
export const headline_stat_label = document.getElementById("headline-stat-label");
export const stat_info_text = document.getElementById("stat-info-text");
export const download_dropdown = document.getElementById("download-dropdown");
export const capture = document.getElementById("capture");
export const headline_year = document.getElementById("headline-year");
export const skip_link = document.getElementById("skip-link");
export const SIDEBAR_OPEN_KEY = "nisra:data-explorer:sidebarOpen";
/**
 * Re-reads query string on call
 * @returns 
 */
export function getSearch() {
    return window.location.search.replace("?", "").split("&");
}