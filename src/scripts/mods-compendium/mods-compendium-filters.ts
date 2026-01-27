
/* FILTERS LISTS CONTROLS ===================================================================================== */

const filtersInner = document.getElementById('mods-compendium-filters-inner');

const listToggles = filtersInner?.querySelectorAll('[aria-controls]');

const tagListsMap = new Map();

listToggles?.forEach((listToggle) => {
    const controlledId = listToggle.getAttribute('aria-controls');
    
    if(controlledId) {
        const controlled = document.getElementById(controlledId);
        if(controlled) {
            tagListsMap.set(listToggle, controlled);
        }
    }
})

let aListIsOpen: {
    toggle: HTMLElement,
    controlled: HTMLElement
} | null = null;

for(const [toggle, controlled] of tagListsMap) {
    if(toggle.getAttribute('aria-expanded') === 'true') {
        controlled.setAttribute('data-shown', 'true');
        aListIsOpen = {
            toggle: toggle,
            controlled: controlled
        };
    } else {
        controlled.hidden = true;
        controlled.setAttribute('data-shown', 'false');
    }
    toggle.addEventListener('click', () => {
        const isClosed = !(toggle.getAttribute('aria-expanded') === 'true');
        if(isClosed && aListIsOpen !== null) {
            const toClose = aListIsOpen.controlled;
            const toCloseToggle = aListIsOpen.toggle;
            toCloseToggle.setAttribute('aria-expanded', 'false');
            toClose.setAttribute('data-shown', 'false');
            setTimeout(() => {
                toClose.hidden = true;
            }, 600)
        }            
        if(isClosed) {
            
            aListIsOpen = {
                toggle: toggle,
                controlled: controlled
            };

            controlled.hidden = false;
            toggle.setAttribute('aria-expanded', 'true')
            requestAnimationFrame(() => controlled.setAttribute('data-shown', 'true'));
        }
    })
}

/* CONSTANTS DECLARATION ====================================================================================== */

const COMPENDIUM_LENGTH = 201;
const CHECKLIST_LENGTH = 2*COMPENDIUM_LENGTH;
const CHECKLIST_HEX_LENGTH = Math.ceil(CHECKLIST_LENGTH/4);
const CK_START = 'TuxbornSTART'; // Line starter for the checklist state hex-string
const CK_END = 'TuxbornEND';

import { MODS_CHECKLISTS, FILTERS } from "../startup/mods-compendium";

/* UTILITIES IMPORT =========================================================================================== */

import type { MiniMod } from "../data-management/types/mods-compendium-types";
import { toNormalized } from "../utilities/string-parsers";
import { checkboxId, displayId } from "./checklist";
import { createFalseSelect } from "../utilities/DOM";
import { binToHexFromLeft, extractBetween, hexToBinFromLeft, isHex } from "../utilities/string-parsers";


/* HTML ELEMENTS FETCHING AND TYPE VERIFICATION FOR CHECKLIST ================================================= */

/* Checklist creation */
const checklistCreatorForm = document.getElementById('new-checklist-creator');
const checklistCreationTextField = document.getElementById('new-checklist-name') as HTMLInputElement;
if(!((checklistCreatorForm instanceof HTMLFormElement)
    && checklistCreationTextField)
) throw new Error('Checklist creation fields not found'); 

/* Checklist selection */
/* const selectChecklist = document.getElementById('other-checklists'); */
 const strongCurrentChecklist = document.getElementById('current-checklist'); 
if(!((strongCurrentChecklist)
)) throw new Error('Checklist selector field not found');


/* Load/Delete checklist */
const loadChecklistTrigger = document.getElementById('load-different-checklist');
const deleteChecklist = document.getElementById('delete-checklist');
if(!((loadChecklistTrigger instanceof HTMLButtonElement)
    && (deleteChecklist instanceof HTMLButtonElement))
) throw new Error('Checklist load&delete controls could not be found');

/* Export checklist */
const exportChecklist = document.getElementById('checklist-export');
const exportChecklistTrigger = document.getElementById('checklist-export-trigger');
if(!((exportChecklist instanceof HTMLTextAreaElement)
    && (exportChecklistTrigger instanceof HTMLButtonElement))
) throw new Error('Could not find checklist export fields');

/* Import checklist */
const importChecklist = document.getElementById('checklist-import');
const importChecklistTrigger = document.getElementById('checklist-import-trigger');
const openImportOverChecklist = document.getElementById('open-import-over-checklist');
const checklistImportForm = document.getElementById('checklist-import-form');
if(!((importChecklist instanceof HTMLInputElement)
    && (importChecklistTrigger instanceof HTMLButtonElement) 
    && (openImportOverChecklist instanceof HTMLButtonElement)
    && (checklistImportForm instanceof HTMLFormElement))
) throw new Error('Could not find checklist import fields');

/* completion bar */
const checklist_progress = (function () {
    let _value = 0;
    let _max = 0;
    let max_lock = false;
    let _progress_perc = 0;

    /* completion bar element */
    const checklistCompletionBar = document.getElementById('mods-checklist-progress');
    if(!checklistCompletionBar) throw new Error('Could not find mods checklist completion bar');
    const checklistCompletionBarWrapper = document.getElementById('mods-checklist-progress-wrapper');
    if(!checklistCompletionBarWrapper) throw new Error('Could not find mods checklist completion bar wrapper');

    function setValue(value: number) {
        if(!checklistCompletionBar) return
        _value = value;
        checklistCompletionBar.setAttribute('aria-valuenow', `${value}`);
        _progress_perc = Math.round(_value/_max*100);
        checklistCompletionBar.style.setProperty('--progress-percentage', `${_progress_perc}`);
        checklistCompletionBar.textContent = `${_progress_perc}%`;
    }
    function increaseValue(value: number) {
        setValue(_value + value);
    }
    function decreaseValue(value: number) {
        setValue(_value - value);
    }
    function setMax(max: number) {
        if(max_lock || !checklistCompletionBar) return;
        if(max > 0) {
            _max = max;
            checklistCompletionBar.setAttribute('aria-valuemax', `${max}`);
            max_lock = true;
            setValue(_value);
        }
    }

    return {
        get value() {
            return _value;
        },
        set value(value: number) {
            setValue(value);
        },
        set max(value: number) {
            setMax(value);
        },
        increase(value: number) {
            increaseValue(value);
        },
        decrease(value: number) {
            decreaseValue(value);
        },
        set hidden(hide: boolean) {
            checklistCompletionBarWrapper.hidden = hide;
        }
    }

})();

/* ============================================================================================================ */

const checklist: Uint8Array = new Uint8Array(CHECKLIST_LENGTH);

const currentlyCreatedChecklists = localStorage.getItem(MODS_CHECKLISTS);

const STORED_CHECKLISTS_NAMES = currentlyCreatedChecklists?.split('|');

let current_checklist: string | null = null;

/* Disable import modal toggle if there is no checklist to import */
if(!STORED_CHECKLISTS_NAMES || STORED_CHECKLISTS_NAMES[0]?.length < 3) openImportOverChecklist.disabled = true;

if((STORED_CHECKLISTS_NAMES instanceof Array && STORED_CHECKLISTS_NAMES.length > 0)) {

    const currentChecklistContent = localStorage.getItem(STORED_CHECKLISTS_NAMES[0]);

    /* Add all registered checklists as options in the checklist selector */
    const selectChecklist = createFalseSelect('other-checklists', STORED_CHECKLISTS_NAMES, 'other-checklists');
    /* appendOptions(selectChecklist, STORED_CHECKLISTS_NAMES); */

    /* If there is more than one checklist, allow selection */
    if(STORED_CHECKLISTS_NAMES.length > 1) selectChecklist.disabled = false;
    /* If current checklist is valid, allow deletion and export */
    if(STORED_CHECKLISTS_NAMES[0]?.length > 3) {
        deleteChecklist.disabled = false
        exportChecklist.disabled = false;
        exportChecklistTrigger.disabled = false;
        checklist_progress.hidden = false;
        checklist_progress.value = 0;
    } 
    /* If current checklist has valid content, register it to initialize */
    if(currentChecklistContent) {
        strongCurrentChecklist.textContent = STORED_CHECKLISTS_NAMES[0];
        current_checklist = STORED_CHECKLISTS_NAMES[0];
        const unwrapped = hexToBinFromLeft(currentChecklistContent);

        for(let i = 0; i < unwrapped.length; i++) {
            checklist[i] = unwrapped[i] === '1' ? 1 : 0;
        }

    }

    /* If a checklist different from current is selected, allow it to be loaded */
    selectChecklist.inputs.forEach((input) => input.addEventListener('input', () => {
        /* if current checklist is selected do nothing */
        if(selectChecklist.value === current_checklist) {
            loadChecklistTrigger.disabled = true;
        } else
        /* enable loading if another is selected */
        loadChecklistTrigger.disabled = false;
    }));

    /* Places the selected checklist atop of the stack and refreshes page */
    loadChecklistTrigger.addEventListener('click', () => {
        const toLoad = selectChecklist.value;
        if(STORED_CHECKLISTS_NAMES.includes(toLoad)) {
            STORED_CHECKLISTS_NAMES.splice(STORED_CHECKLISTS_NAMES.indexOf(toLoad), 1);
            STORED_CHECKLISTS_NAMES.unshift(toLoad);
            localStorage.setItem(MODS_CHECKLISTS, STORED_CHECKLISTS_NAMES.join('|'));
            window.location.reload();
        }
    })
    /* Confirm delete action */
    deleteChecklist.addEventListener('click', () => {
        const toDelete = selectChecklist.value;

        const ok = window.confirm(
            `Do you want to delete ${toDelete}?`
        );

        if(ok) {
            if(STORED_CHECKLISTS_NAMES.includes(toDelete)) {
                STORED_CHECKLISTS_NAMES.splice(STORED_CHECKLISTS_NAMES.indexOf(toDelete), 1);
                localStorage.removeItem(toDelete);
                localStorage.setItem(MODS_CHECKLISTS, STORED_CHECKLISTS_NAMES.join('|'));
                window.location.reload();
            }
        }

    })    
}




/* Showable mods sets (contain mod IDs) */
const showableMods: Set<string> = new Set();
const show_no_locMods: Set<string> = new Set(); 
const show_no_verMods: Set<string> = new Set(); 
/* Sets of selected inputs (contain their IDs)  */
const selectedCheckboxes: Set<string> = new Set();
const selectedRadios: Set<string> = new Set();

/* Remember me checkbox */
const rememberMe = document.getElementById('remember-mods-compendium-filters') as HTMLInputElement;

/* Filters dropdown toggle */
const mainToggle = document.getElementById('filters') as HTMLButtonElement;
/* Compendium object, necessary for sorting (direct parent of all mod articles) */
const compendium = document.getElementById('mods-compendium');

/* Active filters quick-view */
const locationActive = document.getElementById('location-tag-active');
const activeTagsField = document.getElementById('tag-filters-active');


try {

    /* LOCK FILTERS UNTIL THEY ARE INITIALIZED ================================================================ */

    if(!activeTagsField || !locationActive) throw new Error('Active filters quick-view fields could not be found');

    if(!mainToggle) throw new Error('Could not find filters section toggle');
    mainToggle.disabled = true;

    if(!rememberMe) throw new Error('Could not find filters section remember choice');
    if(!compendium) throw new Error('Could not find the Mods Compendium');

    /* IF PRESENT, INITIALIZE PREVIOUS FILTERS ================================================================ */

    const previousCheckboxes = localStorage.getItem(FILTERS.CHECKBOXES);
    if(previousCheckboxes) {
        /* Setup list of active checkboxes to initialize */
        previousCheckboxes.split('|').forEach((check) => selectedCheckboxes.add(check));
    }
    const previousRadios = localStorage.getItem(FILTERS.RADIOS);
    if(previousRadios) {
        /* Check remembered radio to initialize correctly */
        previousRadios.split('|').forEach((radio) => {
            const temp = document.getElementById(`tagId_${radio}`) as HTMLInputElement;
            if(temp) temp.checked = true;
        })
    }
    /* Prepare an object of previous selects */
    const previousSelects = localStorage.getItem(FILTERS.SELECTS);
    const previousSelectsObj = previousSelects ? JSON.parse(previousSelects) : null;


    /* IMPORTING MODS DATA FROM JSON ========================================================================== */

    const resModsCompendiumMini = await fetch(`/Tuxborn_Companion/data/mods-compendium/mods-compendium-mini.json?nocache=${crypto.randomUUID()}`);
    if(!resModsCompendiumMini.ok) throw new Error('Fetch failed: ' + resModsCompendiumMini.status);
    const outModsCompendiumMini = await resModsCompendiumMini.json();

    type MiniModElement = MiniMod & { 
        element: HTMLElement,
        matchCount: number,
        is_location: boolean,
        is_version: boolean,
        is_checked: boolean,
        is_found: boolean /* Search boolean, unused */
     };
            
    const modsCompendiumMap: Map<string, MiniModElement> = new Map();
    const tempModsCompendiumMap: Map<string, MiniMod> = new Map(outModsCompendiumMini);
    let checklist_progress_max = 0;

    for (const [key, value] of tempModsCompendiumMap) {

        /* Build mods compendium ================ */
        const mod = document.getElementById(key);
        if(mod) {
            if(!mod.hidden) {
                showableMods.add(key);
                show_no_locMods.add(key);
                show_no_verMods.add(key);
            }
            modsCompendiumMap.set(key, { ...value, 
                element: mod, 
                matchCount: 0,
                is_location: true, 
                is_version: true,
                is_checked: false,
                is_found: true 
            });
        } else throw new Error(`Could not find mod article with ID: ${key}`);

        /* Build checklist ==================== */
        const ckBox = document.getElementById(checkboxId(key)) as HTMLInputElement;
        const ckOrder = Number(ckBox?.getAttribute('data-checklist-order'));
        const ckTarget = modsCompendiumMap.get(key);
        if(ckBox && (typeof ckOrder === 'number') && ckTarget) {


            const lengthVal = ckTarget.length;
            checklist_progress_max += lengthVal;

            /* Remember */
            if(current_checklist) {
                ckBox.disabled = false;
                if(checklist[ckOrder] === 1) {
                    ckBox.checked = true;
                    checklist_progress.increase(lengthVal);
                } else {
                    ckBox.checked = false;
                }
            }
            

            ckBox.addEventListener('input', () => {
                const state = ckBox.checked;
                checklist[ckOrder] = state ? 1 : 0;
                ckTarget.is_checked = state;

                requestAnimationFrame(() => state 
                ? checklist_progress.increase(lengthVal)
                : checklist_progress.decrease(lengthVal));
                
                updateChecklist();
            })
        } else throw new Error(`Failed to initialize completion checkbox at ${key} with checkbox ${checkboxId(key)}: ${ckBox} ${ckOrder} ${ckTarget}`)
        
        /* Build displays ==================== */
        if(ckTarget.displays > 0) {
            const dsBox = document.getElementById(displayId(key)) as HTMLInputElement;
            const dsOrder = ckOrder + 1;
            if(dsBox && dsOrder) {

                if(current_checklist) {
                    dsBox.disabled = false;
                    checklist[dsOrder] === 1 ? dsBox.checked = true : dsBox.checked = false;
                }

                dsBox.addEventListener('input', () => {
                    checklist[dsOrder] = dsBox.checked ? 1 : 0;
                    updateChecklist();
                })
            } else throw new Error(`Failed to initialize completion displays at ${key} with checkbox ${displayId(key)}: ${dsBox} ${dsOrder}`)
        }
        
    }
    checklist_progress.max = checklist_progress_max;


    /* FILTERING =================================================================================================================================================== */

    /* COMPLETED SELECT ============================================================================== */

    let _hideChecked = false;

    const CHECKLIST_COMPLETED = ['show', 'hide'];

    const checklistSelect = createFalseSelect('checklist',CHECKLIST_COMPLETED, 'checklist')

    /* Completed Select Tag REMEMBERED ================ */
    if(previousSelectsObj?.checklistSelect) {
        checklistSelect.value = previousSelectsObj.checklistSelect;
    }

    _hideChecked = checklistSelect.value === CHECKLIST_COMPLETED[1];

    checklistSelect.inputs.forEach((input) => input.addEventListener('input', () => {
        _hideChecked = checklistSelect.value === CHECKLIST_COMPLETED[1];
        updateShowables();
        updateTagsDisabled();
    }));

    /* IMPORTING FILTERS DATA FROM JSON ======================================================================= */

    const resModsCompendiumFiltersMini = await fetch(`/Tuxborn_Companion/data/mods-compendium/mods-compendium-filters-mini.json?nocache=${crypto.randomUUID()}`);
    if(!resModsCompendiumFiltersMini.ok) throw new Error('Fetch failed: ' + resModsCompendiumFiltersMini.status);
    const outModsCompendiumFiltersMini = await resModsCompendiumFiltersMini.json();

    const activeRadios: Map<string, HTMLInputElement> = new Map();
    const modsCompendiumTagsMap: Map<HTMLInputElement , {id: string, matches: Set<string>}> = new Map();

    for(const item of outModsCompendiumFiltersMini.tags ) {
        /* get the tag checkbox/radio input */
        const elementTag = document.getElementById(item.id) as HTMLInputElement;
        if(elementTag) {
            /* map tagEl, modsThatHaveTheTag */
            modsCompendiumTagsMap.set(elementTag, {
                id: item.id,
                matches: new Set(item.matches)
            });
            
            const type = elementTag.type;

    /* CHECKBOX INPUT =============================================================================== */
            
            if(type === 'checkbox') {

                /* Create the associated button that removes the tag ================ */
                const associatedButton = document.createElement('button');
                initializeBoxAssociatedButton(associatedButton, elementTag);

                /* Checkbox Tag REMEMBERED ================ */
                if(selectedCheckboxes.has(elementTag.id.replace('tagId_',''))) {
                    elementTag.checked = true;
                    const matches = modsCompendiumTagsMap.get(elementTag)?.matches;
                    /* increase count for those mods */
                    if(matches) stepMatchCount(matches, true); /* shouldn't fail */
                    activeTagsField?.appendChild(associatedButton);
                }

                elementTag.addEventListener('input', () => {

                    if(elementTag.checked) {
                    /* Checkbox Tag checked ================ */
                        /* add to current filters */
                        selectedCheckboxes.add(elementTag.id.replace('tagId_',''));
                        /* extract mods that have the tag */
                        const matches = modsCompendiumTagsMap.get(elementTag)?.matches;
                        /* increase count for those mods */
                        if(matches) stepMatchCount(matches, true); /* shouldn't fail */
                        /* Update no-results ============== */
                        updateTagsDisabled();
                        /* Append associated button for quick removal */
                        activeTagsField?.appendChild(associatedButton);

                    } else {
                    /* Checkbox Tag un-checked ============== */
                        activeTagsField?.removeChild(associatedButton);
                        uncheckTagBox(elementTag);
                    }
                    
                });

    /* RADIO INPUT ================================================================================== */

            } else if(type === 'radio') {
                const radioName = elementTag.name.toLowerCase();
                /* register first active radio at startup */
                if(elementTag.checked) {
                    if(activeRadios.get(radioName)) throw new Error(`${radioName} cannot have two active radios: ${activeRadios.get(radioName)?.id} & ${elementTag.id}`);
                    activeRadios.set(radioName, elementTag);
                    selectedRadios.add(elementTag.id.replace('tagId_',''));
                    if(radioName === 'location') locationImageUpdate(elementTag);
                } 
                /* Listener for input */
                elementTag.addEventListener('input', () => {
                    radioTagSwitch(elementTag, radioName);
                    if(radioName === 'location') locationImageUpdate(elementTag);
                })


    /* ERRORS ======================================================================================= */
    
            } else throw new Error(`Input with ID ${item.id} has a not allowed type: ${type}`)
            
        } else throw new Error(`Could not find filter with ID: ${item.id}`);
    }

    /* FUNCTIONS ====================================================================================== */

    function updateChecklist() {
        if(!current_checklist || !exportChecklist) return;
        const hex = binToHexFromLeft(checklist.join(''));
        localStorage.setItem(current_checklist, hex);
        exportChecklist.textContent = `${CK_START}${hex}${CK_END}`
    }

    /* Initialize a button that turns off the checkbox associated with it */
    function initializeBoxAssociatedButton(button: HTMLButtonElement, elementTagCheckbox: HTMLInputElement) {
        const tag = elementTagCheckbox.getAttribute('data-text-content');
        const type = elementTagCheckbox.getAttribute('data-type') ?? '';
        const inner = document.createElement('span');
        button.setAttribute('aria-label', `Click to remove ${tag} from filters`);
        button.setAttribute('data-type', type)
        button.type = 'button';
        button.classList = 'clip-shape clip-as-border octagone';
        inner.classList = 'clip-shape octagone max-size';
        inner.textContent = tag;
        button.appendChild(inner);
        button.addEventListener('click', () => {
            /* remove from current filters */
            elementTagCheckbox.checked = false;
            activeTagsField?.removeChild(button);
            uncheckTagBox(elementTagCheckbox);
        });
    }

    /* Un-check event of checkbox */
    function uncheckTagBox(elementTagCheckbox: HTMLInputElement) {
        /* remove from current filters */
        selectedCheckboxes.delete(elementTagCheckbox.id.replace('tagId_',''));
        /* extract mods that have the tag */
        const matches = modsCompendiumTagsMap.get(elementTagCheckbox)?.matches;
        /* decrease count for those mods */
        if(matches) stepMatchCount(matches, false); /* shouldn't fail */
        /* Update no-results ============== */
        updateTagsDisabled();
    }

    /* Increases/decreases counter for checkbox filters */
    function stepMatchCount(matches: Set<string>, increase: boolean) {
        matches.forEach((match) => {
            const temp = modsCompendiumMap.get(match);
            if(temp) {
                increase ? temp.matchCount++ : temp.matchCount--;
                updateShowables();
            } 
        });
    }

    /* Radio input event (a radio cannot be unchecked manually) */
    function radioTagSwitch(radioElement: HTMLInputElement, radioName: string) {
        const currentRadio = activeRadios.get(radioElement.name);
        /* only act if the radio is different fom currently active one */
        if(radioElement === currentRadio) return;
        /* if it is, remove previous from filters */
        if(currentRadio) {
            selectedRadios.delete(currentRadio?.id.replace('tagId_',''));
            activeRadios.set(radioName, radioElement);
            selectedRadios.add(radioElement.id.replace('tagId_',''));
        }

        const matches = modsCompendiumTagsMap.get(radioElement)?.matches;
        if(matches) {

            switch(radioName) {
                case('location'): {
                    for(const [id, modObj] of modsCompendiumMap) {
                        modObj.is_location = matches.has(id);
                    }
                    break;
                }
                case('version'): {
                    for(const [id, modObj] of modsCompendiumMap) {
                        modObj.is_version = matches.has(id);
                    }
                    break;
                }
                default: throw new Error(`${radioName} is not among available radios`)
            }
                        
            updateShowables();
            updateTagsDisabled();
        } /* shouldn't fail */
    }

    function updateShowables() {
        const trueVal = selectedCheckboxes.size;
        for(const [id, modMap] of modsCompendiumMap) { 

            const condition_base = (modMap.matchCount === trueVal) && !(_hideChecked && modMap.is_checked) && modMap.is_found;
            const condition_no_ver = condition_base && modMap.is_location;
            const condition_no_loc = condition_base && modMap.is_version;
            const condition = condition_no_loc && modMap.is_location;

            if(condition) {
                showableMods.add(id);
            } else showableMods.delete(id);
            /* Radio buttons ignore themselves to estabilish if they would proc a null result */
            if(condition_no_loc) {
                show_no_locMods.add(id);
            } else show_no_locMods.delete(id);
            if(condition_no_ver) {
                show_no_verMods.add(id);
            } else show_no_verMods.delete(id);
        }
    }

    function updateTagsDisabled() {
        const showables = [...showableMods];
        const show_locoless = [...show_no_locMods];
        const show_versoless = [...show_no_verMods];
        for(const [tagElement, tagObj] of modsCompendiumTagsMap) {

            if(tagElement.checked) continue;
            let hasMatch = false;
            const inputName = tagElement.name;

            switch(inputName) {
                case('location'): {
                    hasMatch = show_locoless.some((showableMod) => tagObj.matches.has(showableMod));
                    break;
                }
                case('version'): {
                    hasMatch = show_versoless.some((showableMod) => tagObj.matches.has(showableMod));
                    break;
                }
                default: {
                    hasMatch = showables.some((showableMod) => tagObj.matches.has(showableMod));
                    break;
                }
            }

            if(hasMatch) {
                tagElement.disabled = false;
            } else tagElement.disabled = true;
        }
        /* special condition for disabling hide/show completed select */
        if(!_hideChecked || (_hideChecked && (showables.some((showableMod) => !(modsCompendiumMap.get(showableMod)?.is_checked))))) {
            checklistSelect.disabled = false;
        } else checklistSelect.disabled = true;
    }

    /* Updates the image showcase of current location */
    function locationImageUpdate(elementLocationTag: HTMLInputElement) {
        const src = `url("${elementLocationTag.getAttribute('data-location-src')}")`;
        if(src && filtersInner) {
            requestAnimationFrame(() => filtersInner.style.setProperty('--tx-active-loc', src));
        }
    }

    /* SORTING ===================================================================================================================================================== */

    /* BUILD CURRENT-VIEW ARRAY FROM MODS DATA ================================================================ */

    const SORT_LIST = ['category', 'name', 'creator', 'length', 'level'];
    const SORT_DIRECTIONS = ['ascending', 'descending'];

    const modsCurrentView: any[] = [];

    for (const [key, value] of modsCompendiumMap) {
        modsCurrentView.push({
            element: value.element,
            id: key,
            [SORT_LIST[0]]: value.category.order,
            [SORT_LIST[1]]: value.name.full,
            [SORT_LIST[2]]: value.creator,
            [SORT_LIST[3]]: value.length,
            [SORT_LIST[4]]: value.req.level
        })
    }

    /* INITIALIZE SORT SELECTORS ============================================================================== */

    const sort_type = createFalseSelect('sort-mods', SORT_LIST, 'sort');
    const sort_dir = createFalseSelect('sort-dir',SORT_DIRECTIONS,'sort-dir');
    
    /* SORTING FUNCTION ======================================================================================= */

    /* Sorting State INITIALIZE ================ */
    let lastSorted: string = sort_type.value;
    let lastDir: string = sort_dir.value;

    /* Sorting Select Tag REMEMBERED ================ */
    if(previousSelectsObj?.sortTypeSelect) {
        sort_type.value = previousSelectsObj.sortTypeSelect;
    }
    if(previousSelectsObj?.sortDirSelect) {
        sort_dir.value = previousSelectsObj.sortDirSelect;
    }

    function sortMods(sortType: string, sortDir: string) {
        if(sortType === lastSorted && lastDir === sortDir) return;

        /* Correct sorting by ID to get consistent sort results */
        modsCurrentView.sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base' }));

        switch(typeof modsCurrentView[0][sortType]) {
            case 'string': {
                sortDir === SORT_DIRECTIONS[0]
                ? modsCurrentView.sort((a, b) => a[sortType].localeCompare(b[sortType], undefined, { sensitivity: 'base' }))
                : modsCurrentView.sort((b, a) => a[sortType].localeCompare(b[sortType], undefined, { sensitivity: 'base' }));
                break;
            }
            case 'number': {
                sortDir === SORT_DIRECTIONS[0]
                ? modsCurrentView.sort((a, b) => a[sortType] - b[sortType] )
                : modsCurrentView.sort((b, a) => a[sortType] - b[sortType] );
                break;
            }
            default: throw new Error(`Filter type ${sortType} does not exist`);
        }

        lastSorted = sortType;
        lastDir = sortDir;

        const newView = document.createDocumentFragment();
        modsCurrentView.forEach((mod) => {
            newView.appendChild(mod.element);
        });
        compendium?.appendChild(newView);
    }

    /* APPLY & RESET FILTERS BUTTON =========================================================================== */

    const apply = document.getElementById('apply-filters');
    const reset = document.getElementById('reset-filters');
    const root = document.documentElement;
    if(!apply || !reset) throw new Error('Could not find apply/reset controls in filter section');

    /* Security lock variable */
    let filterLock = false;

    /* FUNCTIONS =============== */

    function filterMods() {
        for(const [id, modMap] of modsCompendiumMap) {
            if(showableMods.has(id)) {
                modMap.element.hidden = false;
            } else modMap.element.hidden = true;
        }
    }

    /* REMEMBER ================ */

    if(previousCheckboxes || previousRadios || previousSelects) {
        /* if data to remember is present, tick the remember box and initialize filters state on such data */
        rememberMe.checked = true;
        updateShowables();
        updateTagsDisabled();
        filterMods();
        sortMods(sort_type.value, sort_dir.value);
    }

    let _remember = rememberMe.checked;
    rememberMe.addEventListener('input', () => {
        _remember = rememberMe.checked;
    })

    /* APPLY ================ */

    apply.addEventListener('click', () => {
        if(filterLock) return;
        filterLock = true;
        root.setAttribute('aria-busy', 'true');
        window.scroll({top: 0});
        setTimeout(() => {
            /* FILTER */

            filterMods();

            /* SORT */
            sortMods(sort_type.value, sort_dir.value);
            /* REMEMBER (?) */
            setTimeout(() => {
                if(rememberMe.checked) {
                    localStorage.setItem(FILTERS.CHECKBOXES, [...selectedCheckboxes].join('|'));
                    localStorage.setItem(FILTERS.RADIOS, [...selectedRadios].join('|'));
                    localStorage.setItem(FILTERS.SELECTS, JSON.stringify({
                        checklistSelect: checklistSelect.value, 
                        sortTypeSelect: sort_type.value, 
                        sortDirSelect: sort_dir.value
                    }));
                } else {
                    localStorage.removeItem(FILTERS.CHECKBOXES);
                    localStorage.removeItem(FILTERS.RADIOS);
                    localStorage.removeItem(FILTERS.SELECTS);
                }

                root.setAttribute('aria-busy', 'false');
                filterLock = false;
            },100)

        }, 500)        
    })

    /* RESET ================ */

    reset.addEventListener('click', () => {
        selectedCheckboxes.clear();
        for(const [id, mod] of modsCompendiumMap) {
            mod.matchCount = 0;
        }
        while (activeTagsField.firstChild) {
            activeTagsField.removeChild(activeTagsField.firstChild);
        }

        setTimeout(() => {
            rememberMe.checked = _remember;
            sort_type.reset();
            sort_dir.reset();
            filtersInner?.querySelectorAll<HTMLInputElement>('[id][type="radio"]:checked')
                .forEach((radio) => radioTagSwitch(radio, radio.name.toLowerCase()));
            const loc = activeRadios.get('location');
            if(loc) locationImageUpdate(loc);

            _hideChecked = checklistSelect.value === CHECKLIST_COMPLETED[1];
            updateShowables();
            updateTagsDisabled();
        },100)
        
    });


    /* CHECKLIST FUNCTIONS ==================================================================================== */

    updateChecklist();

    /* CHECKLIST ================ */

    /* Divert checklist creation form submit */
    checklistCreatorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        /* check validity of proposed name */
        if (!checklistCreatorForm.checkValidity()) {
            checklistCreatorForm.reportValidity();
            return;
        }

        const formData = new FormData(checklistCreatorForm);
        const checklist = formData.get('new-checklist-name')?.toString().trim();
 
        if (!checklist) {
            alert('Checklist name is not valid!')
            return;
        }

        createNewChecklist(checklist);  

    });

    /* Prevent creation of already existing checklist (case-sensitive) */
    checklistCreationTextField.addEventListener('input', () => {
        const possibleChecklist = checklistCreationTextField.value.toString().trim();
        if(STORED_CHECKLISTS_NAMES) {
            if(STORED_CHECKLISTS_NAMES.includes(possibleChecklist)) {
                checklistCreationTextField.setCustomValidity('A checklist with this name already exists!');
            } else checklistCreationTextField.setCustomValidity('');
        }   
    });

    /* Create a new checklist item in storage and set it as first in order */
    function createNewChecklist(checklistName: string) {
        if(currentlyCreatedChecklists) {
            localStorage.setItem(MODS_CHECKLISTS, `${checklistName}|${currentlyCreatedChecklists}`);
        } else {
            localStorage.setItem(MODS_CHECKLISTS, checklistName);
        }      
        localStorage.setItem(checklistName,'0'.repeat(checklist.length));  
        /* Checklists are only loaded with the page startup: refresh obligatory */
        window.location.reload();
    }


    
    /* Copy to clipboard the current checklist hex-string */
    exportChecklistTrigger.addEventListener('click', async () => {
        /* Update checklist just-in-case */
        updateChecklist();
        try {
            await navigator.clipboard.writeText(exportChecklist.value);
            alert('Checklist succesfully copied to clipboard');
        } catch {
            exportChecklist.select(); 
            alert('Copy failed, please try again or copy directly from text field');
        }
    });

    
    /* Divert submit of import form */
    importChecklistTrigger.addEventListener('click', (e) => {
        e.preventDefault();

        if (!checklistImportForm.checkValidity()) {
            checklistImportForm.reportValidity();
            return;
        }

        const formData = new FormData(checklistImportForm);
        const importedChecklist = formData.get('checklist-import')
            ?.toString().replace(CK_START, '')
            .replace(CK_END,'').trim();
 
        if (!importedChecklist || !current_checklist) {
            alert('Failed to import checklist, imported data may be not correctly formatted');
            return;
        }

        const ok = window.confirm(
`Data from current checklist will be overwritten;
you will not be able to retrieve them once done.
Do you want to proceed with the import?`)

        if(!ok) return;

        /* Overwrites current checklist data with imported data */
        localStorage.setItem(current_checklist, importedChecklist);
        window.location.reload();

    })

    /* Verify correct format of proposed imported data */
    importChecklist.addEventListener('input', () => {

        let possibleChecklistData = importChecklist.value.toString().trim();
        
        if(possibleChecklistData.startsWith(CK_START) && possibleChecklistData.endsWith(CK_END)) {
            /* Removes primer and closer from data to leave only the hex-string */
            possibleChecklistData = extractBetween(possibleChecklistData, CK_START, CK_END) ?? '';
        }
        if(!isHex(possibleChecklistData)) {
            importChecklist.setCustomValidity('Data must be in hexadecimal format');
        } else if(!(possibleChecklistData.length === CHECKLIST_HEX_LENGTH)) {
            importChecklist.setCustomValidity('Data is too short to represent the entire checklist');
        } else importChecklist.setCustomValidity('');
    })


} catch(error) {
    console.error(`Failed to initialize filters; ${error}`);
    mainToggle.ariaDisabled = 'true';
} finally {
    if(mainToggle.ariaDisabled !== 'true') mainToggle.disabled = false;
    requestAnimationFrame(() => document.documentElement.removeAttribute('aria-busy'));
}





