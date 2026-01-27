
import fetchSheetDataset from './CSV/fetch-sheet-dataset.ts';
import companionDatasheets from '../../data/companion-datasheets.json';

/* Mods Compendium fetch & validation */
import { validateTypeMod, modMiniMap } from './types/mods-compendium-types.ts';
import { parseModsCompendiumFilters, validateTypeArrayFilters } from './types/mods-compendium-filters-types.ts';

/* MODS  */
const modsCompendiumRaw = await fetchSheetDataset(companionDatasheets.modsCompendium.id, companionDatasheets.modsCompendium.gid, '[//n]', '|');

const modsCompendiumTypeless = modsCompendiumRaw.filter((record) => record.enabled === true);

export const modsCompendium = modsCompendiumTypeless.map(mod => {mod.searchable = ''; return mod;}).map(validateTypeMod);

export const modsCompendiumMini = modsCompendiumTypeless.map(modMiniMap);


/* FILTERS  */
const modCompendiumFiltersRaw = await fetchSheetDataset(companionDatasheets.modsFiltersData.id,companionDatasheets.modsFiltersData.gid);

export const modCompendiumFilters = parseModsCompendiumFilters(modCompendiumFiltersRaw);

const modCompendiumFiltersMiniRaw: any = {
    tags: []
};

for(const [type, values] of Object.entries(modCompendiumFilters)) {
    if(type !== 'category') {
        values.map((value, i) => {
            modCompendiumFiltersMiniRaw.tags.push({
                matches: value.matches,
                id: value.id
            });
        })
    } if(type === 'category') {
        modCompendiumFiltersMiniRaw.category = values;
    }
}

export const modCompendiumFiltersMini = validateTypeArrayFilters(modCompendiumFiltersMiniRaw);;