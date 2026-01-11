
import writeStaticAsJson from "./write-static-as-json.ts";


/* Write Mods Compendium Data as JSON */
import { modsCompendium, modsCompendiumMini } from "../companion-data-fetch.ts";


writeStaticAsJson(modsCompendium, './public/data/mods-compendium.json', false);
writeStaticAsJson(modsCompendiumMini, './public/data/mods-mini-compendium.json', true);



