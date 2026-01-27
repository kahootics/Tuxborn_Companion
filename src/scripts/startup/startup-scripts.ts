import clips from './clip-shapes.js';
import themes from './theme.js';
import flips from './flip-cards.js';
import modsCompendium from './mods-compendium.js';

const scripting = {
    clips,
    themes,
    flips,
    modsCompendium,
} as const;

export type ScriptName = keyof typeof scripting;

const BODY_REGEX = /\(\)\s*=>\s*\{([\s\S]*?)\}/;

function extractScriptBody(fn: Function): string {
    const match = fn.toString().match(BODY_REGEX);
    if (!match) {
        throw new Error('Invalid script format');
    }
    return match[1];
}

export default function startupScripts(...scripts: ScriptName[]) {
    const bodies: string[] = [];
    const remaining = new Set(scripts);

    for (const name of Object.keys(scripting) as ScriptName[]) {
        if (remaining.has(name)) {
            bodies.push(extractScriptBody(scripting[name]));
            remaining.delete(name);
        }
    }

    if (remaining.size > 0) {
        throw new Error(
            `No setup function found for [${[...remaining].join(', ')}]`
        );
    }

    return `(()=>{${bodies.join(';')}})()`;
}
