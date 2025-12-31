

const allMods = document.querySelectorAll<HTMLElement>('.mod-article');

/* Filter container + toggle */
const filterToggle = document.getElementById('tx-filters-section-toggle');
const filtersContainer = document.getElementById('tx-filters-section') as HTMLElement;

/* toggle for the selection list + list  */
const tagSelectionToggles = document.querySelectorAll('.tag-selection-toggle');
/* filters activaction trigger */
const applyFilters = document.getElementById('apply-filters');

const wikiLinksSection = document.getElementById('wiki-links-section') as HTMLElement;
    const wikiLinks = document.getElementById('wiki-links');


if(allMods && filterToggle && filtersContainer && applyFilters && tagSelectionToggles && wikiLinks && wikiLinksSection) {


    const filters = new Map<string, Set<string>>();;

    function slide(toggle: HTMLElement, slided: HTMLElement, duration: number, open?: boolean): void {
        /* acts as toggle if open state is not forced */
        if(typeof open === 'undefined') {
            open = toggle.getAttribute('aria-expanded') === 'true';
        } else { open = !open }
        
        if(!open) { 
            slided.hidden = open;
        } else { 
            setTimeout(() => {
                slided.hidden = open;
            }, duration)
        }
        requestAnimationFrame(() => {
            toggle.setAttribute('aria-expanded', `${!open}`);
            slided.setAttribute('data-height-null', `${open}`);
        });        
    }

    

    /* filter container animation */
    const dur = 400;
    filtersContainer.style.setProperty('--js-calc-duration', `${dur}ms`);
    filterToggle.addEventListener('click', () => {
        slide(filterToggle,filtersContainer,dur)
        slide(wikiLinks,wikiLinksSection,200,false)
    });

    /* wiki nav animation */
    wikiLinks.addEventListener('click', () => {
        slide(wikiLinks,wikiLinksSection,200)
        slide(filterToggle,filtersContainer,dur,false)
    })

    /* tag selection list animation */
    tagSelectionToggles.forEach((tagSelectionToggle) => {
        
        const tagType = tagSelectionToggle.getAttribute('data-tags-type');
        const toggle = tagSelectionToggle as HTMLElement;
        const list = document.querySelector(`.selectable-tags-list[data-tags-type="${tagType}"]`) as HTMLElement;
        const selectedFilters = document.querySelector(`.filters-selected[data-tags-type="${tagType}"]`);
        const selectables = list.querySelectorAll('.selectable-tag');


        if(toggle && list && selectedFilters && selectables && tagType) {

            /* tag selection list animation */
            list.style.setProperty('--js-calc-duration', `200ms`);
            toggle.addEventListener('click',() => slide(toggle,list,200));
            tagSelectionToggles.forEach((otherToggle) => {
                if(otherToggle != tagSelectionToggle) {
                    (otherToggle as HTMLElement).addEventListener('click', () => 
                    slide(toggle, list, 200, false));
                }
            })
            
            

            /* setting up filters map */
            filters.set(tagType, new Set<string>());
            const filter = filters.get(tagType);

            /* creating filters */
            selectables.forEach((selectable) => {
                const checkbox = selectable.querySelector('input');
                checkbox?.addEventListener('input', () => {
                    if(checkbox.checked) {
                        /* filter creation */
                        const newFilter = document.createElement('li');
                        const filterItem = document.createElement('button');
                        filterItem.setAttribute('type', 'button');
                        filterItem.setAttribute('aria-label', 'this tag was selected, click to remove');
                        filterItem.textContent = `${selectable.textContent.trim()}`;
                        const value = checkbox.value;
                        filterItem.setAttribute('data-tag-filter', value);
                        
                        filter?.add(value);
                        newFilter.appendChild(filterItem)
                        selectedFilters.appendChild(newFilter);
                        /* filter removal */
                        filterItem.addEventListener('click', () => {
                            filter?.delete(value);
                            selectedFilters.removeChild(newFilter);
                            checkbox.checked = false;
                        })
                    } else {
                        const value = checkbox.value;
                        filter?.delete(value);
                        const toKill = selectedFilters.querySelector(`li:has(>[data-tag-filter="${value}"])`);
                        if(toKill) { selectedFilters.removeChild(toKill); }
                    }
                })
            })
        }
    })


    function setBusy(getBusy: boolean): void {
        getBusy ? document.getElementById('tx-mod-articles')?.setAttribute('aria-busy', 'true')
        : document.getElementById('tx-mod-articles')?.removeAttribute('aria-busy');
    }

    function modFilter(mod: HTMLElement, filters: Map<string, Set<string>>): boolean {
        for (const [type, filter] of filters) {
            /* extract tags */ 
            /* NOTE: refactor by pre-creating maps of each mod with filtering datas */
            const tags = mod.getAttribute(`data-tx-${type}-tags`)?.split(' ') ?? [];
            /* check if each tag stored in filter is also in the corresponding dataset */
            if([...filter].some((tag) => !tags.includes(tag))) {
                return false;
            }
        }
        return true;
    }


    /* let the filters run */
    applyFilters.addEventListener('click', () => {

        setBusy(true);

        setTimeout(() => {
            allMods.forEach((mod) => {
            
            const shouldShow = modFilter(mod,filters);
            const isHidden = mod.hidden;
            if(shouldShow && isHidden) {
                setTimeout(() => mod.hidden = false)
            } else if(!shouldShow && !isHidden) {
                setTimeout(() => mod.hidden = true)
            }
            
            });
            setTimeout(() => {
                slide(filterToggle,filtersContainer,dur,false);
                requestAnimationFrame(() => {
                    setBusy(false);
                })
            },500)
        },1)
        
            
        


    })

    
}