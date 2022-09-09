// Declare to global scope to avoid creating multiple caches
if(!window.SVG_CACHE) window.SVG_CACHE = {};

export function newSVG(url) {
    // Make sure './src/svg.svg' and 'src/svg.svg' are the same
    // Other notations like '././' are redundant
    if(url.slice(0, 2) != './') url = './' + url;
    
    if(window.SVG_CACHE[url] != undefined) {
        const template = document.createElement('template');
        template.innerHTML = window.SVG_CACHE[url];
        return template.content.firstChild;
    }

    const object = document.createElement('object');
        object.data = url;
        object.type = "image/svg+xml";

    object.onload = () => {
        window.SVG_CACHE[url] = object.contentDocument.children[0].outerHTML;
    }

    return object;
}