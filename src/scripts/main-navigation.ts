
const DURATION = Number(document.documentElement.computedStyleMap().get('--js-anim-time'));
import { slideDown, slideUp } from "./dropdowns";

const leftPanelWrapper = document.getElementById('left-panel-wrapper');
const mainNavWrapper = document.getElementById('main-nav-wrapper');
const mainNavContainer = document.getElementById('main-nav-container');
const mainNavToggle = document.getElementById('main-nav-toggle');
const mainNavTitle = document.getElementById('main-nav-title');
const mainNavBack = document.getElementById('main-nav-back');
const mainNavControls = mainNavWrapper?.querySelectorAll<HTMLElement>('.menu-control[aria-controls]');
const mainNavControlsMap: Map<HTMLElement, HTMLElement> = new Map();
mainNavControls?.forEach((control) => {
    const controlled = document.getElementById(`${control.getAttribute('aria-controls')}`);
    if(controlled) {
        mainNavControlsMap.set(control, controlled);
    } 
})

const droppers = document.querySelectorAll<HTMLElement>('.clipped-dropdown button');
const dropMap: Map<HTMLElement, HTMLElement> = new Map();
droppers.forEach((dropper) => {
    const dropped = document.getElementById(`${dropper.getAttribute('aria-controls')}`);
    if(dropped) {
        dropMap.set(dropper, dropped);
    } 
});


const centralPanelWrapper = document.getElementById('central-panel-dropdowns-wrapper'); 
const filtersWrapper = document.getElementById('mods-compendium-filters-wrapper');
const filtersContainer = document.getElementById('mods-compendium-filters-container');
const filtersToggle = document.getElementById('filters');
const filtersCloser = document.getElementById(`${(filtersWrapper?.id)?.replace('wrapper','close')}`);
const apply = document.getElementById('apply-filters');

if(centralPanelWrapper && filtersWrapper && filtersContainer && filtersToggle && filtersCloser && apply) {
    const filtersDropdown: Dropdown = {
        toggle: filtersToggle, 
        panelWrapper: centralPanelWrapper, 
        menuWrapper: filtersWrapper, 
        menuContainer: filtersContainer,
        menuCloser: filtersCloser
    }
    filtersToggle.addEventListener('click', () => panelDropdownMenu(filtersDropdown));
    apply.addEventListener('click', () => 
        setTimeout(() => {
            panelDropdownClose(filtersDropdown, undefined, 0);
        }, 200)
    )
} else throw new Error('Failed to initialize filters dropdown')

if(leftPanelWrapper && mainNavWrapper && mainNavContainer && mainNavTitle && mainNavBack && mainNavControls && droppers && mainNavToggle) {

    let navLock = false;
    const TITLE_SWAPPER = 'title-out';
    const MAIN_TITLE = mainNavTitle.textContent;
    
    const mainNavDropdown: Dropdown = {
        toggle: mainNavToggle, panelWrapper: leftPanelWrapper, menuWrapper: mainNavWrapper, menuContainer: mainNavContainer
    }
    function navDisappear() { 
        if(navLock) return;
        navLock = true;
        if(mainNavDropdown) {
            atMediaToggle(mainNavDropdown, 1024);
        }
        navLock = false;
    }
    
    mainNavToggle.addEventListener('click', () => {
        panelDropdownMenu(mainNavDropdown, navLock);
    })

    window.addEventListener('load', () => navDisappear());
    window.addEventListener('resize', () => navDisappear());


    function titleSwap(title: HTMLElement, newTitle: string) {
        title.classList.remove(TITLE_SWAPPER);
        requestAnimationFrame(() => {
            title.classList.add(TITLE_SWAPPER); 
            title.textContent = newTitle;
        });
    }

    

    function openNavMenu(toggle: HTMLElement, controlled: HTMLElement, title: HTMLElement, back: HTMLElement) {
        if(navLock) return;
        navLock = true;
        toggle.setAttribute('aria-expanded', 'true');
        controlled.hidden = false;
        back.hidden = false;
        titleSwap(title, toggle.textContent);
        requestAnimationFrame(()=> {
            controlled.setAttribute('data-shown', 'true');
            back.setAttribute('data-shown', 'true');
        })
        mainNavControls?.forEach(control => {
            control.setAttribute('data-shown', 'false');
            setTimeout(() => {
                control.hidden = true;
                navLock = false;
            }, DURATION)
        })
    }

    function closeNavMenus(title: HTMLElement, back: HTMLElement) {
        if(navLock) return;
        navLock = true;
        for(const [control, controlled] of mainNavControlsMap) {
            if(control.getAttribute('aria-expanded') === 'true') {
                control.setAttribute('aria-expanded', 'false');
                controlled.setAttribute('data-shown', 'false')
                setTimeout(()=> {
                    controlled.hidden = true;
                }, DURATION);
            } 
            control.hidden = false;
            requestAnimationFrame(() => {
                control.setAttribute('data-shown', 'true');
            })
        }
        titleSwap(title, MAIN_TITLE);
        back.setAttribute('data-shown', 'false');
        for(const [dropper, dropped] of dropMap) {
            slideUp(DURATION, dropped, dropper);
        }
        setTimeout(()=> {
            back.hidden = true;
            navLock = false;
        }, DURATION);
    }


    for(const [control, controlled] of mainNavControlsMap) {
        control.addEventListener('click', () => openNavMenu(control, controlled, mainNavTitle, mainNavBack));
    }
    mainNavBack.addEventListener('click', () => closeNavMenus(mainNavTitle, mainNavBack));

    for(const [dropper, dropped] of dropMap) {
        dropped.hidden = true;
        dropper.addEventListener('click', () => {
            if(dropper.getAttribute('aria-expanded') === 'true') {
                slideUp(DURATION, dropped, dropper);
            } else {
                slideDown(DURATION, dropped, dropper);
            }
        });
    }

    

} else throw new Error('Failed to initialize Main Menu');

type Dropdown = {
    toggle: HTMLElement, 
    panelWrapper: HTMLElement, 
    menuWrapper: HTMLElement, 
    menuContainer: HTMLElement,
    menuCloser?: HTMLElement
};

let currentOpenDropdown: Dropdown | null =  null;
let panelLock = false;

function lockScroll(lock: boolean) {
    lock 
    ? document.documentElement.style.overflow = 'hidden'
    : document.documentElement.style.removeProperty('overflow');
}

function panelDropdownOpen(dropdown: Dropdown) {
    lockScroll(true);

    currentOpenDropdown = dropdown;
    dropdown.panelWrapper.style.display = 'block';
    dropdown.menuWrapper.hidden = false;

    requestAnimationFrame(() => {
    dropdown.toggle.setAttribute('aria-expanded', 'true');
        dropdown.menuContainer.setAttribute('data-shown', 'true');
    })

    setTimeout(() => {
        panelLock = false;
    }, 2*DURATION)
}

function panelDropdownClose(dropdown: Dropdown, callbackDropdown?: Dropdown, duration?: number) {
    
    const DUR: number = duration ?? DURATION;

    requestAnimationFrame(() => {
        dropdown.toggle.setAttribute('aria-expanded', 'false');
        dropdown.menuContainer.setAttribute('data-shown', 'false');
    })

    setTimeout(() => {
        currentOpenDropdown = null;
        if(callbackDropdown) {
            requestAnimationFrame( () => panelDropdownOpen(callbackDropdown));
        } else lockScroll(false);
    }, 5/4*DUR)
    
    setTimeout(() => {
        dropdown.panelWrapper.style.display = 'none';
        dropdown.menuWrapper.hidden = true;
        if(!callbackDropdown) panelLock = false;
    }, 2*DUR)
}

function panelDropdownForceClose(dropdown: Dropdown, close: boolean) {
    close ? dropdown.panelWrapper.style.display = 'none' : dropdown.panelWrapper.style.display = 'block';
    const antiCloseStr = `${!close}`;
    dropdown.toggle.hidden = !close;
    dropdown.toggle.setAttribute('aria-expanded', antiCloseStr);
    dropdown.menuWrapper.hidden = close;
    dropdown.menuContainer.setAttribute('data-shown', antiCloseStr);
}

function panelDropdownMenu(dropdown: Dropdown, extraLock?: boolean) {
        if(panelLock) return;
        if(extraLock === true) return;
        panelLock = true;
        const isOpen = dropdown.toggle.getAttribute('aria-expanded') === 'true';
        if(isOpen) {
            panelDropdownClose(dropdown);
        } else {
            if(currentOpenDropdown !== null) {
                panelDropdownClose(currentOpenDropdown, (dropdown))
            } else {
                panelDropdownOpen(dropdown);
            }
            if(dropdown.menuCloser) dropdown.menuCloser.addEventListener('click',() => panelDropdownClose(dropdown));
        }
    }

    


function atMediaToggle(dropdown: Dropdown, maxWidthPx: number) {
    const match = window.matchMedia(`(max-width:${maxWidthPx}px)`).matches;
    if(match && currentOpenDropdown === dropdown) currentOpenDropdown = null; 
    panelDropdownForceClose(dropdown, match);
}