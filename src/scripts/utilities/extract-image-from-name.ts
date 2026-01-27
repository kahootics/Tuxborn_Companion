
const images = [
    import.meta.glob<{ default: ImageMetadata }>(`/src/assets/mods-compendium/mods-locations/*.{jpeg,jpg,png,gif}`),
    import.meta.glob<{ default: ImageMetadata }>(`/src/assets/mods-compendium/mods-overviews/*.{jpeg,jpg,png,gif}`),
    import.meta.glob<{ default: ImageMetadata }>(`/src/assets/mods-compendium/general-map/*.{jpeg,jpg,png,gif}`),
    import.meta.glob<{ default: ImageMetadata }>(`/src/assets/mods-compendium/*.{jpeg,jpg,png,gif}`),
];


const paths = [
    '/src/assets/mods-compendium/mods-locations/',
    '/src/assets/mods-compendium/mods-overviews/',
    '/src/assets/mods-compendium/general-map/',
    '/src/assets/mods-compendium/'
]

const formats = ['jpeg','jpg','png','gif'];

function findPath(name: string): {
    mainPath: number;
    imageName: string;
} {
    for (const format of formats) {
        const formatted = name.endsWith(`.${format}`)
            ? name
            : `${name}.${format}`;

        for (const [i, path] of paths.entries()) {
            const possiblePath = `${path}${formatted}`;

            if (images[i][possiblePath]) {
                return {
                    mainPath: i,
                    imageName: possiblePath,
                };
            }
        }
    }

    throw new Error(
        `"${name}" does not exist in glob: ${paths
            .map(p => `${p}*.{jpeg,jpg,png,gif}`)
            .join(' or ')}`
    );
}

export default async function extractImageFromName(name: string) {
    const imageObj = findPath(name);
    const temp = await (images[imageObj.mainPath][imageObj.imageName])();
    return temp.default;
}