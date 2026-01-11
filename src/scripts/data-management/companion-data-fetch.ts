
import fetchSheetDataset from './CSV/fetch-sheet-dataset.ts';
import companionDatasheets from '../../data/companion-datasheets.json';

/* Mods Compendium fetch & validation */
import { validateTypeMod, modMiniMap } from './types/mods-compedium-types.ts';

const modsCompendiumRaw = await fetchSheetDataset(companionDatasheets.modsCompendium.id, companionDatasheets.modsCompendium.gid, '[//n]', '|');

const modsCompendiumTypeless = modsCompendiumRaw.filter((record) => record.enabled === true);

export const modsCompendium = modsCompendiumTypeless.map(validateTypeMod);

export const modsCompendiumMini = modsCompendiumTypeless.map(modMiniMap);