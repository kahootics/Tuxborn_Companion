
let slideLock = false;

export function slideUp(duration: number, controlled: HTMLElement, control?: HTMLElement,) {
    if(slideLock) return;
    control?.setAttribute('aria-expanded', 'false');
    controlled.style.setProperty('height', `${controlled.scrollHeight}px`);
    requestAnimationFrame(() => {
                    controlled.style.setProperty('height', '0px');
    })
    setTimeout(() => {
        controlled.hidden = true;
        /* controlled.style.removeProperty('height'); */
        slideLock = false;
    }, duration);
}

export function slideDown(duration: number, controlled: HTMLElement, control?: HTMLElement,) {
    if(slideLock) return;
    control?.setAttribute('aria-expanded', 'true');
    controlled.hidden = false;
    controlled.style.setProperty('height', '0px');
    requestAnimationFrame(() => {
        controlled.style.setProperty('height', `${controlled.scrollHeight}px`);
    })
    setTimeout(() => {
        slideLock = false;
        controlled.style.removeProperty('height');
    }, duration);
}

const droppers = document.querySelectorAll<HTMLElement>('.dropdown[aria-controls]');
const dropMap: Map<HTMLElement, HTMLElement> = new Map();
droppers.forEach((dropper) => {
    const dropped = document.getElementById(`${dropper.getAttribute('aria-controls')}`);
    if(dropped) {
        dropMap.set(dropper, dropped);
    } 
});

for(const [dropper, dropped] of dropMap) {
    dropped.hidden = true;
    dropper.addEventListener('click', () => {
        if(dropper.getAttribute('aria-expanded') === 'true') {
            slideUp(600, dropped, dropper);
        } else {
            slideDown(600, dropped, dropper);
        }
    });
}