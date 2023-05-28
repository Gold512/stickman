// Declare to global scope to avoid creating multiple caches
if(!window.SVG_CACHE) window.SVG_CACHE = {};

/**
 * 
 * @param {string} url - filepath to SVG
 * @returns {HTMLElement} - object linking to svg or the svg itself if already loaded
 */
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

/**
 * 
 * @param {string} url - filepath to SVG
 * @returns 
 */
export async function getSVG(url) {
    if(url.slice(0, 2) != './') url = './' + url;
    if(window.SVG_CACHE[url] != undefined) return window.SVG_CACHE[url];
    return await fetch(url)
        .then(function(response) {
            return response.text();
        }).then(function(data) {
            window.SVG_CACHE[url] = data;
            return data; // this will be a string
        });
}

export function syncGetSVG(url) {
    let svg = document.createElement('svg');
    
    if(window.SVG_CACHE[url] != undefined) {
        setSVG(window.SVG_CACHE[url]);
        return svg;
    }

    fetch(url)
        .then(function(response) {
            return response.text();
        }).then(function(data) {
            window.SVG_CACHE[url] = data;

            setSVG(data);
        });

    return svg;

    function setSVG(data) {
        let template = document.createElement('template');
        template.innerHTML = data;
        let newSVG = template.content.firstChild;

        let svgAttributes = newSVG.getAttributeNames();
        for (let i = 0; i < svgAttributes.length; i++) {
            const attr = svgAttributes[i];
            svg.setAttribute(attr, newSVG.getAttribute(attr));
        }

        svg.innerHTML = newSVG.innerHTML;
    }
}

window.getSVG = getSVG