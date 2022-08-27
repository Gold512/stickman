const SVG_CACHE = {};

export function newSVG(url) {
    if(SVG_CACHE[url] != undefined) {
        const template = document.createElement('template');
        template.innerHTML = SVG_CACHE[url];
        return template.content.firstChild;
    }

    // Make sure './src/svg.svg' and 'src/svg.svg' are the same
    // Other notations like '././' are redundant
    if(url.slice(0, 2) != './') url = './' + url;

    const object = document.createElement('object');
        object.data = url;
        object.type = "image/svg+xml";

    object.onload = () => {
        SVG_CACHE[url] = object.contentDocument.children[0].outerHTML;
    }

    return object;
}