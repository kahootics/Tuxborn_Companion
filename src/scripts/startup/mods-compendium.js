export const MODS_CHECKLISTS = 'mods-checklists'; // Name of the checklist in localStorage
export const FILTERS = {
    CHECKBOXES: 'selected-checkboxes',
    RADIOS: 'selected-radios',
    SELECTS: 'selected-selects'
} // Name of the filters in localStorage

export default() => {if(localStorage.getItem('selected-radios') || localStorage.getItem('mods-checklists') !== '' || localStorage.getItem('selected-checkboxes') || localStorage.getItem('selected-selects'))document.documentElement.setAttribute('aria-busy','true')}