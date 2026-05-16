export const magnitudes = {
    base: 'base',
    atZero: 'skill',
    atHundred: '100'
}

export function calcEnchantPrice(atZero: number, skill: number) {
    const skillMult = (100 - skill)/(1 + skill*0.026) + skill*Math.pow(2.71828,(-skill/82))/100;
    return Math.round(atZero * skillMult);
}