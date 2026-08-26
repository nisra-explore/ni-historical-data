import { mapSelections } from "./mapSelections.js";
import { default_table, GEOG_PROPS } from "../config/config.js";
import { themes_menu, subjects_menu, products_menu, names_menu, geo_menu, stats_menu } from "./elements.js";
import { sortObject } from "./sortObject.js";

export function fillSubjectsMenu (structure, tables, search) {

    subjects_menu.replaceChildren();

    let subjects = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects;

    let current_options = subjects_menu.options;

    for (let i = 0; i < Object.keys(subjects).length; i ++) {
        let option = document.createElement("option");
        option.value = subjects[Object.keys(subjects)[i]].code;
            option.textContent = Object.keys(subjects)[i];
            subjects_menu.appendChild(option);
        }
        
    let selected_subject = subjects[Object.keys(subjects)[0]].code;

    if (window.location.search == "") {
        selected_subject = tables[default_table].subject_code;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table")) {
            let search_split = search[i].split("=");
            selected_subject = tables[search_split[1]].subject_code;
            break;
        }
    }

    subjects_menu.value = selected_subject;    

}

export function fillProductsMenu (structure, tables, search) {

    products_menu.replaceChildren();

    let products = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products;

    for (let i = 0; i < Object.keys(products).length; i ++) {
        let option = document.createElement("option");
        option.value = products[Object.keys(products)[i]].code;
        option.textContent = Object.keys(products)[i];
        products_menu.appendChild(option);
    }

    let selected_product;

    if (window.location.search == "") {
        selected_product = tables[default_table].product_code;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_product = tables[search_split[1]].product_code;
            break;
        }
    }

    products_menu.value = selected_product;  

}

export function fillNamesMenu (structure, tables, search) {

    names_menu.replaceChildren();

    let names = Object.keys(structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables);

    for (let i = 0; i < names.length; i ++) {
        let option = document.createElement("option");
        option.value = names[i].replaceAll(" ", "-");
        option.textContent = names[i];
        names_menu.appendChild(option);
    }

    let selected_name = names[0].replaceAll(" ", "-");

    if (window.location.search == "") {
        selected_name = tables[default_table].name.replaceAll(" ", "-");
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_name = tables[search_split[1]].name.replaceAll(" ", "-");
            break;
        }
    }

    names_menu.value = selected_name;  

}

export function fillGeoMenu (structure, tables, search) {

    geo_menu.replaceChildren();

    let names = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables;

    let geos;
    let geo_types = {};

    for (let i = 0; i < Object.keys(names).length; i ++) {
        if (Object.keys(names)[i].replaceAll(" ", "-") == names_menu.value) {
            geos = Object.values(names)[i];
        }
    }

    let num_options = 0;

    for (let i = 0; i < geos.length; i ++) {

        let categories = Object.keys(tables[geos[i]].categories);
        categories = categories.filter(x => !["STATISTIC", tables[geos[i]].time].includes(x));
        if (geos[i] == "C21003NI") {
            categories = categories.filter(x => x != "NI");
        }

        for (let j = 0; j < categories.length; j++) {
            if (!Object.keys(geo_types).includes(categories[j])) {
                geo_types[categories[j]] = [geos[i]];
                break
            } else {
                geo_types[categories[j]].push(geos[i]);
                break
            }
        }

    }

    geo_types = sortObject(geo_types);

    for (let i = 0; i < Object.keys(geo_types).length; i ++) {

        let geo_type = Object.keys(geo_types)[i];
        
        if (geo_types[geo_type].length == 1) {
            let option = document.createElement("option");
            option.value = geo_types[geo_type];
            
            option.text = GEOG_PROPS[geo_type]?.label ?? tables[geo_types[geo_type][0]].categories[geo_type]?.label ?? geo_type;
            num_options += 1;
            geo_menu.appendChild(option);
        } else {
            for (let j = 0; j < geo_types[geo_type].length; j ++) {
                let option = document.createElement("option");
                option.value = geo_types[geo_type][j];
                let categories = tables[geo_types[geo_type][j]].categories;
                let category_names = Object.keys(categories);
                category_names = category_names.filter(x => !["STATISTIC", geo_type, tables[geo_types[geo_type][j]].time].includes(x));

                if (category_names.length == 0) {
                    category_names.push(tables[geo_types[geo_type][j]].time)
                }
                
                let category_string = "";
                for (let k = 0; k < category_names.length; k ++) {
                    if (k == 0) {
                        category_string += categories[category_names[k]].label;
                    } else if (k == category_names.length - 1) {
                        category_string += ` and ${categories[category_names[k]].label}`;
                    } else {
                        category_string += `, ${categories[category_names[k]].label}`;
                    }
                }

                const geoLabel = GEOG_PROPS[geo_type]?.label ?? tables[geo_types[geo_type][j]].categories[geo_type]?.label ?? geo_type;
                option.text = `${geoLabel} by ${category_string}`;
                num_options += 1;
                geo_menu.appendChild(option);
            }
        }        


    }

    if (num_options > 1) {
        geo_menu.parentElement.classList.add("d-block");
        geo_menu.parentElement.classList.remove("d-none");
    } else {
        geo_menu.parentElement.classList.add("d-none");
        geo_menu.parentElement.classList.remove("d-block");
    }


    let selected_geo;

    if (window.location.search == "") {
        selected_geo = default_table;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_geo = search_split[1];
        }
    }

    geo_menu.value = selected_geo; 

}

export function fillStatMenu (tables, search) {

    stats_menu.replaceChildren();

    const statistics = tables[geo_menu.value].statistics;

    const num_stats = Object.keys(statistics).length;

    if (num_stats > 1) {
        stats_menu.parentElement.classList.add("d-block");
        stats_menu.parentElement.classList.remove("d-none");
    } else {
        stats_menu.parentElement.classList.add("d-none");
        stats_menu.parentElement.classList.remove("d-block");
    }

    for (let i = 0; i < num_stats; i ++) {
        let option = document.createElement("option");
        option.value = Object.keys(statistics)[i];
        option.textContent = Object.values(statistics)[i];
        stats_menu.appendChild(option);
    }

    let selected_stat = Object.keys(statistics)[0];

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("stat=")) {
            let search_split = search[i].split("=");
            selected_stat = search_split[1];
            break
        }
    }

    stats_menu.value = selected_stat;  
    
    mapSelections(Object.keys(tables[geo_menu.value].categories), tables);

}