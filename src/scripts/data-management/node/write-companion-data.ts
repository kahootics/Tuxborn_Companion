
import writeStaticAsJson from "./write-static-as-json.ts";


/* Write Mods Compendium Data as JSON */
import { modsCompendium, modsCompendiumMini, modCompendiumFilters, modCompendiumFiltersMini } from "../companion-data-fetch.ts";


writeStaticAsJson(modsCompendium, './src/data/mods-compendium/mods-compendium.json', false);
writeStaticAsJson(modsCompendiumMini, './public/data/mods-compendium/mods-compendium-mini.json', true);

writeStaticAsJson(modCompendiumFilters, './src/data/mods-compendium/mods-compendium-filters.json', false);
writeStaticAsJson(modCompendiumFiltersMini, './public/data/mods-compendium/mods-compendium-filters-mini.json', true);


