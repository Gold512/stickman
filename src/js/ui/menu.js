import { ElementCreator } from "../classes/element_creator.js";
import { newSVG } from "../module/svg.js";
import { toggleStatMenu } from "../ui.js";
import { characterPage, reloadCharacterPage } from "./character.js";
import { settingsPage } from "./settings.js";
import { createStatMenu } from "./skill_tree.js";

function navChange(event) {
    let newPage = Number(event.currentTarget.dataset.index);
    data.pages[data.prevPage].style.display = 'none';
    data.pages[newPage].style.display = '';
    data.prevPage = newPage;
}

// new menu
export function navBar() {
    let tabs = ['Character', 'Skills', 'Settings']
    return new ElementCreator('div')
        .class(['menu-nav-container', 'header'])
        .exec((_, o) => {
            for(let i = 0; i < tabs.length; i++) {
                o.newChild('label')
                    .class('menu-nav-item')
                    .newChild('input')
                        .attribute('type', 'radio')
                        .attribute('name', 'nav-tab')
                        .if(i === 0, obj => {obj.attribute('checked', true)})
                        .dataset('index', i)
                        .addEventListener('change', navChange)
                        .end
                    .newChild('span')
                        .text(tabs[i])
                        .end
                    .end
            }
        }).
        newChild('button')
            .class(['menu-nav-item', 'close'])
            .addEventListener('click', () => toggleStatMenu())
            .newChild('div')
                .class('img')
                .appendChild(newSVG('./src/svg/icons/close.svg'))
                .end
            .end
}

function skillsPage() {
    let page = new ElementCreator('div').id('skills-page')
        .style({display: 'none'})
        .class('page')
    createStatMenu(page.element);
    return page;
}

let pages = [characterPage, skillsPage, settingsPage];
let data = {pages:[]};

export function createMenu() {
    data.prevPage = 0;
    return new ElementCreator('div')
        .class(['menu-container', 'auto-height'])
        .appendChild(navBar())
        .newChild('div')
            .class(['menu-main-content', 'content'])
            .exec((_, elementCreator) => {
                for(let i = 0; i < pages.length; i++) {
                    let page = pages[i]()
                    elementCreator.appendChild(page);
                    data.pages.push(page.element);
                }
            })
            .end
}

export function reloadMenu(player) {
    reloadCharacterPage(player)
}