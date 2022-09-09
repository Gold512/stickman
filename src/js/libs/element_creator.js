// Easier to create HTML with js

export class ElementCreator {
    /**
     * 
     * @param {keyof HTMLElementTagNameMap|HTMLElement} element the tag name of the element to create or a pre-created element
     */
    constructor(element) {
        if(typeof element === 'string') {
            this.element = document.createElement(element);
        } else {
            this.element = element;
        }

        this.unappended = 0;
        this.top = this;
    }

    /**
     * Create a new child element
     * @param {keyof HTMLElementTagNameMap} element - tag name of the element to create
     * @returns {ElementCreator} - element creator of the child element
     */
    newChild(element) {
        const e = new this.constructor(element);
        e.parent = this;
        e.top = this.top || this;
        this.top.unappended++;
        return e;
    }

    /**
     * Append this object to a element
     * @param {HTMLElement} element - the element to append 
     * @returns {HTMLElement} - the element that was appended
     */
    appendTo(element) {
        if(this.parent) throw new Error('cannot re-append sub-element');
        if(this.top.unappended != 0) throw new Error('cannot append when there is unappended child elements')
        element.appendChild(this.element);
        return this.element;
    }

    /**
     * Append a pre-created child element to this element as is
     * without creating a new ElementCreator
     * @param {HTMLElement} element - element to append
     */
    appendChild(element) {
        if(!(element instanceof HTMLElement)) throw new Error('input is not a HTMLElement');
        this.element.appendChild(element);
        return this;
    }

    /**
     * Add text node to element
     * @param {String} text text to add
     */
    text(text) {
        this.element.appendChild(document.createTextNode(text));
        return this;
    }

    /**
     * Append raw HTML string to element innerHTML; script tags still work, use with caution
     * @param {String} html - the html to add
     */
    html(html) {
        this.element.innerHTML += html;
        return this;
    }


    /**
     * 
     * @param {String|String[]} classes - class or list of classes to add to the element
     */
    class(classes) {
        if(!Array.isArray(classes)) classes = [classes];
        for(let i = 0; i < classes.length; i++) {
            this.element.classList.add(classes[i]);
        }
        return this;
    }

    id(id) {
        this.element.id = id;
        return this;
    }

    /**
     * Set css styles
     * @param {Object} styles key value pair of styles and their value
     */
    style(styles) {
        for(let i = 0, k = Object.keys(styles); i < k.length; i++) {
            this.element.style[k[i]] = styles[k[i]];
        }
        return this;
    }

    /**
     * Set css variables
     * @param {Object} styles key value pair of css variables (without the -- prefix) and their value
     */
    styleVariables(styles) {
        for(let i = 0, k = Object.keys(styles); i < k.length; i++) {
            this.element.style.setProperty('--' + k[i], styles[k[i]]);
        }
        return this;
    }

    /**
     * Add event listener to element 
     * @param {keyof HTMLElementEventMap} event 
     * @param {Function} callback
     */
    addEventListener(event, callback) {
        this.element.addEventListener(event, callback);
        return this;
    }

    /**
     * 
     * @param {String} key key of the attribute
     * @param {String} value value of the attribute
     * @returns 
     */
    attribute(key, value) {
        this.element.setAttribute(key, value);
        return this;
    }

    /**
     * use function to operate on the element object
     * @param {function(HTMLElement):void} fn -
     */
    exec(fn) {
        fn(this.element);
        return this;
    }

    /**
     * Perform operations conditionally
     * @param {Boolean} bool - whether or not to execute the callback
     * @param {function(ElementCreator):void} callback - callback when the boolean is true; 
     * @returns {ElementCreator} - reference to this object
     */
    if(bool, callback) {
        if(!bool) return this;
        if(typeof callback !== 'function') throw new Error('callback must be a function');
        callback(this)
        return this;
    }

    /**
     * Ends the chain, appending this element to its designated parent, as well as moving the 
     * function chained object to the parent object
     * @returns {ElementCreator} parent element creator
     */
    get end() {
        if(!this.parent) throw new Error("can only end child element declaration, use appendTo instead");
        this.parent.element.appendChild(this.element);
        this.top.unappended--;
        return this.parent;
    }
}