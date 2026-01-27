
export const idStarter = 'modId_'; /* IMPORTANT */

export function displayId(modId: string) {
    return modId.replace(idStarter,'modDs_');
}

export function checkboxId(modId: string) {
    return modId.replace(idStarter,'modCk_');
}


