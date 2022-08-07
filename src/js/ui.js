const display = {
    menu: 'block'
}

function toggleStatMenu() {
    const menu = document.getElementById('stat-menu');

    if(menu.style.display != 'none') {
        menu.style.display = 'none';
    } else {
        menu.style.display = display.menu;
    }
}

export function initUI() {
    document.getElementById('stats').addEventListener('click', toggleStatMenu)
}