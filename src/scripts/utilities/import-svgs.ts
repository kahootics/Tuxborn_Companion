
import type { SvgComponent } from "astro/types";
import { toSafeKebab } from "./string-parsers";

const SVGs = import.meta.glob<{ default: SvgComponent & ImageMetadata}>('/src/assets/svg/*.svg', { eager: true });

export default function getSVG(name: string): SvgComponent & ImageMetadata {
    const svgPath = `/src/assets/svg/${name}.svg`;
  
    const svg = SVGs[svgPath];
  
    if (svg) {
        return svg.default;
    } else {
        throw new Error(`SVG ${name} not found.`);
    }
}

export function getSVGsStyleString(svgs: string[]) {
    return svgs.map((svg) => `--svg-${toSafeKebab(svg)}: url("${getSVG(svg).src}")`).join(';')
}