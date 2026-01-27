
import { getImage } from "astro:assets";

export default async function imageToFormat(image: ImageMetadata, format: string) {
    const optimizedImage = await getImage({src: image, format: format});
    return optimizedImage;
}