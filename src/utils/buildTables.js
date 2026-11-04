import { additional_tables, table_tabs, table_tabs_content, tables_title,
         stats_menu, chart_title } from "./elements.js";

import { ni_result } from "./buildCharts.js";

export async function buildTables(tables, matrix, statistic, geog_type, year, time_var, other_vars, other_selections, id_vars, unit) {

    // Build a table for each additional variable and place behind a tab
    if (other_vars.length > 0) {

        additional_tables.classList.remove("d-none");

         // Add new tables
         tables_title.textContent = `${tables[matrix].statistics[stats_menu.value]} in Northern Ireland (${year}) by:`;

        for (let i = 0; i < other_vars.length; i ++) {   

            let li = document.createElement("li");
            li.classList.add("nav-item");
            li.role = "presentation";
            li.innerHTML = `<button class="nav-link ${i == 0 ? "active" : ""}" id="data-tab-${i}" data-bs-toggle="tab" data-bs-target="#table-tab-${i}" type="button" role="tab" aria-controls="data-preview-${i}" aria-selected="${i == 0 ? "true" : "false"}">${tables[matrix].categories[other_vars[i]].label}</button>`;

            table_tabs.appendChild(li);

            let div = document.createElement("div");
            div.classList.add("tab-pane");
            div.classList.add("fade");
            if (i == 0) div.classList.add("show");
            if (i == 0) div.classList.add("active");
            div.role = "tabpanel";
            div.id = `table-tab-${i}`;

            for (let j = 0; j < other_vars.length; j ++) {
                if (j != i) {
                    div.innerHTML += `<p class="text-secondary"><strong>${tables[matrix].categories[other_vars[j]].label}:</strong> ${tables[matrix].categories[other_vars[j]].category.label[document.getElementById(other_vars[j]).value]}</p>`;
                    div.innerHTML += `<p class="text-secondary"><em>Use the menus on the left to see the <strong>${tables[matrix].categories[other_vars[i]].label}</strong> breakdown for other <strong>${tables[matrix].categories[other_vars[j]].label}</strong> categories.</em></p>`;
                }
            }

            let table_selections = other_selections.split(",");
            table_selections = table_selections.filter(x => x.indexOf(other_vars[i]) == -1)
            table_selections = table_selections.join(",");
            if (geog_type != "none") table_selections += `,"${geog_type}":{"category":{"index":["N92000002"]}}`;

            let table_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
                encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
                    id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
                    statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
                    '"]}}' + table_selections +
                    '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
                    matrix + '"},"version":"2.0"}}');

            const response = await fetch(table_url);
            const { result } = await response.json();
            
            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = tables[matrix].categories[other_vars[i]].label;
            tr.appendChild(var_header);

            let stat_header = document.createElement("th");
            stat_header.textContent = result.dimension.STATISTIC.category.label[statistic];
            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            let values = result.value;
            
            const hasData = values.some(v => v != null);
            
            if (!hasData) {
                additional_tables.classList.add("d-none");
                return;
            }

            const rows = result.dimension[other_vars[i]].category.index.map((code, idx) => ({
                code,
                label: result.dimension[other_vars[i]].category.label[code],
                value: values[idx]
            }));

            // Move ALL / NI totals to the bottom
            rows.sort((a, b) => {

                const aIsTotal =
                    ["ALL", "NI", "N92000002"].includes(a.code.toUpperCase());

                const bIsTotal =
                    ["ALL", "NI", "N92000002"].includes(b.code.toUpperCase());

                if (aIsTotal && !bIsTotal) return 1;
                if (!aIsTotal && bIsTotal) return -1;

                return 0;
            });

            for (const row of rows) {

                let tr = document.createElement("tr");

                let td_0 = document.createElement("td");
                td_0.textContent = row.label;
                tr.appendChild(td_0);

                let td_1 = document.createElement("td");

                if (row.value == null) {
                    td_1.textContent = "..";
                } else {
                    let decimals =
                        result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;

                    td_1.textContent = row.value.toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }

                td_1.style = "text-align: right;";

                if (
                    ["ALL", "NI", "N92000002"].includes(
                        row.code.toUpperCase()
                    )
                ) {
                    td_0.style = "font-weight: bold;";
                    td_1.style = "text-align: right; font-weight: bold;";
                }

                tr.appendChild(td_1);
                table.appendChild(tr);
            }

            table_div.appendChild(table);
            div.appendChild(table_div);
            table_tabs_content.appendChild(div);
        }

        // Else build a table of one row per statistic at Northern Ireland level
    }  else if (ni_result) {

        let statistic_categories = tables[matrix].categories.STATISTIC.category.index;
        

        if (Array.isArray(statistic_categories)) {

            additional_tables.classList.remove("d-none");

            tables_title.textContent = `${tables[matrix].name} - Northern Ireland Summary (${year})`;

            let div = document.createElement("div");
            div.classList.add("tab-pane");
            div.classList.add("fade");
            div.classList.add("show");
            div.classList.add("active");
            div.role = "tabpanel";
            div.id = `table-tab-statistic`;

            let table_selections = "";
            if (geog_type != "none") table_selections += `,"${geog_type}":{"category":{"index":["N92000002"]}}`;

            

            let table_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
                encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":["' +
                    time_var + '", "' + geog_type + '"],"dimension":{"' + time_var + '":{"category":{"index":["' + year +
                    '"]}}' + table_selections + 
                    '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
                    matrix + '"},"version":"2.0"}}');


            const response = await fetch(table_url);
            const { result } = await response.json();
                
            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = "Statistic";
            tr.appendChild(var_header);


            let stat_header = document.createElement("th");
            stat_header.textContent = `Northern Ireland`;
            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            let values = result.value;

            if (!values || values.length === 0) {
                additional_tables.classList.add("d-none");
            }

            for (let j = 0; j < values.length; j ++) {
                let tr = document.createElement("tr");

                let td_0 = document.createElement("td");
                td_0.textContent = Object.values(result.dimension.STATISTIC.category.label)[j];
                tr.appendChild(td_0);

                let td_1 = document.createElement("td");
                if (values[j] == null) {
                    td_1.textContent = "..";
                } else {
                    let decimals = result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;
                    td_1.textContent = values[j].toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }
                td_1.style = "text-align: right;"
                if (["all", "ni", "n92000002"].includes(Object.keys(result.dimension.STATISTIC.category.label)[j].toLowerCase())) {
                    td_0.style = "font-weight: bold;"
                    td_1.style = "text-align: right; font-weight: bold;"
                }
                tr.appendChild(td_1);

                table.appendChild(tr);
            }

            table_div.appendChild(table);
            div.appendChild(table_div);
            table_tabs_content.appendChild(div);
        } else {
            // Else build a table that shows chart figs
            additional_tables.classList.remove("d-none");

            const xAxisTitle = ni_result.result.dimension[time_var].label || "";
            const yAxisTitle = unit || "";

            tables_title.textContent = chart_title.textContent;

            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = xAxisTitle;
            tr.appendChild(var_header);

            let stat_header = document.createElement("th");
            stat_header.textContent = `Northern Ireland (${yAxisTitle})`;
            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            const values = ni_result.result.value;
            const time_series = ni_result.result.dimension[time_var].category.index;

            for (let i = 0; i < values.length; i++) {
                let tr = document.createElement("tr");

                let td_0 = document.createElement("td");
                td_0.textContent = time_series[i];
                tr.appendChild(td_0);

                let td_1 = document.createElement("td");
                if (values[i] == null) {
                    td_1.textContent = "..";
                } else {
                    let decimals = ni_result.result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;
                    td_1.textContent = values[i].toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }
                td_1.style = "text-align: right;"
                tr.appendChild(td_1);

                table.appendChild(tr);
            }

            table_div.appendChild(table);
            table_tabs_content.appendChild(table_div);
        }

    } else {
        additional_tables.classList.add("d-none")
    }
}