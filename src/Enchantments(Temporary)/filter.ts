import { createFalseSelect } from "../scripts/utilities/DOM"

// All the variable magnitudes displayed
const magnis = document.querySelectorAll<HTMLElement>('[data-mag-base]');
const magnitudes: Map<HTMLElement, {
    base: string,
    growth: number,
    zero: number,
    mag: Function
}> = new Map();

magnis.forEach(mag => {
    magnitudes.set(mag, {
        base: mag.getAttribute('data-mag-base') ?? '0',
        growth: Number(mag.getAttribute('data-mag-growth')) ?? 0,
        zero: Number(mag.getAttribute('data-mag-zero')) ?? 0,
        mag(val: number) {
            return Math.floor(this.zero*(1 + this.growth*Math.pow(val/100,2)))
        }
    })
})
function updateMagnitudes(skill: number) {
    magnitudes.forEach((data,mag) => {

        mag.textContent = data.mag(skill);

    })
}

// The filters inputs
const enchLev = document.getElementById('enchanting-level');
const enchRange = document.getElementById('enchanting-range');
const select = createFalseSelect('enchantsd', ['base', 'skill'],'Enchantment');

if(!(enchRange instanceof HTMLInputElement && enchLev)) throw new Error('Missing Enchanting skill input')

enchRange.style.setProperty('--range-pct', ((Number(enchRange.value) - 15) / 85 * 100) + '%');

select.inputs.forEach(input => input.addEventListener('change', () => {

    switch(select.value) {
        case('base'): {
            magnitudes.forEach((data,mag) => {
                mag.innerText = data.base;
            })
        } break;
        case('skill'): {
            updateMagnitudes(Number(enchRange.value));
        } break;
    }
    
}))


enchRange.addEventListener('input', () => {
    const value = enchRange.value;
    enchLev.innerText = value;
    const pct = (Number(value) - 15) / 85 * 100;
    enchRange.style.setProperty('--range-pct', pct + '%');
    
    const skill = Number(enchRange.value);
    if(select.value === 'skill') 
        updateMagnitudes(skill);
    updateEnchantsPrices(skill);
})

/* =================================================================== */

const sort = createFalseSelect('enchantsort', ['default', 'name', 'mod', 'value', 'tier'],'Enchantment');
const form = document.getElementById('enchantments-filters');
const search = document.getElementById('search-input');

if(!(search instanceof HTMLInputElement && form instanceof HTMLFormElement)) throw new Error("Couldn't find search field");

form.addEventListener('submit', e => {e.preventDefault()});

const enchantments = document.querySelectorAll<HTMLElement>('[data-ench-eff-list]');

const enchsSearch = new Map();
const enchsSort: any[] = [];

enchantments.forEach(enchant => {
    enchsSearch.set(enchant, enchant.getAttribute('data-ench-eff-list')?.toLocaleLowerCase());
    enchsSort.push({
        ench: enchant,
        default: Number(enchant.getAttribute('data-default')),
        tier: Number(enchant.getAttribute('data-tier')),
        name: enchant.getAttribute('data-name'),
        mod: enchant.getAttribute('data-mod'),
        restrictions: enchant.getAttribute('data-restrictions'),
        value: Number(enchant.getAttribute('data-value')),
        valueTxt: document.getElementById(`${enchant.id}-value`)
    })
})

let timer_search: number;

search.addEventListener('input', () => {
    clearTimeout(timer_search);

    timer_search = setTimeout(() => {

        const input = search.value.toLocaleLowerCase().trim();
        enchsSearch.forEach((string, enchant) => {

            enchant.hidden = 
            !(string.includes(input));
        })
    }, 500);
})

let timer_sort: number;


sort.inputs.forEach(input => input.addEventListener('input',() => {
    clearTimeout(timer_sort);
    timer_sort = setTimeout(() => {

        const sortKey = sort.value;
        const frag = document.createDocumentFragment();

        switch(typeof enchsSort[0][sortKey]) {
            case('string'): enchsSort.sort((a,b) => 
                a[sortKey].localeCompare(b[sortKey], undefined, { sensitivity: 'base' })
            ); break;
            case('number'): {
                if(sortKey === 'value') {
                    enchsSort.sort((a,b) => 
                        b[sortKey] - a[sortKey]
                    ); 
                } else enchsSort.sort((a,b) => 
                    a[sortKey] - b[sortKey]
                ); 
            }break;
        }

        

        enchsSort.forEach(ench => {
            frag.appendChild(ench.ench)
        })

        document.getElementById('mods-compendium')?.appendChild(frag);
    },300)
}))

/* ============================================ */

const restriction = createFalseSelect('enchantrestrict', [
    'none','Head','Neck','Body','Hands','Finger','Feet','Shield'],'Enchantment');
let timer_rest: number;


restriction.inputs.forEach(input => input.addEventListener('input',() => {
    clearTimeout(timer_rest);
    timer_rest = setTimeout(() => {
        const rest = restriction.value;

        if(rest === 'none') {
            enchsSort.forEach(enchant => enchant.ench.hidden = false)

        } else {
            enchsSort.forEach(enchant => {
                const temp = enchant.restrictions;
                enchant.ench.hidden = 
                !(temp === null 
                || temp.includes(rest))
                 
            })
        }
        
    }, 300);
}))

/* ====================================================== */

const toggle = document.getElementById('filters');

toggle?.addEventListener('click',()=> {
    const isEx = toggle.getAttribute('aria-expanded') === 'true';
    form.hidden = isEx;
    toggle.setAttribute('aria-expanded',`${!isEx}`);
})



/* ============================================================ */

function calcEnchantPrice(atZero: number, skill: number) {
    const skillMult = ((100 - skill)/(1 + skill*0.026) + skill*Math.pow(2.71828,(-skill/82)))/100;
    return Math.round(atZero * skillMult);
}

function updateEnchantsPrices(skill: number) {
    enchsSort.forEach(enchant => {
        enchant.valueTxt.textContent = calcEnchantPrice(enchant.value,skill);
    })
}