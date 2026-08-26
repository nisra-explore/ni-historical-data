export function renamePage (table) {
    
    const raw_title = document.title;
    const title_split = raw_title.split(" - ");

    return (`${title_split[0]} - ${table}`)
}