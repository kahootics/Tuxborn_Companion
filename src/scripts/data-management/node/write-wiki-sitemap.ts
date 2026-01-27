
import writeStaticAsJson from "./write-static-as-json.ts";


const rawUrl = (page: string) => `https://raw.githubusercontent.com/wiki/Omni-guides/Tuxborn/${page.replaceAll(' ', '-')}`;
const pageUrl = (page: string) => `https://github.com/Omni-guides/Tuxborn/wiki/${page.replaceAll(' ', '-')}`;

function extractLinks(markdown: string) {
    const wikiLinkRegex = /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g;
    const links: Set<string> = new Set();
    let match;

    while ((match = wikiLinkRegex.exec(markdown)) !== null) {
        links.add(match[1]);
    }

    return [...links];
}

export type PageNode = {
    link: string;
    children?: PageNode[];
};

const visited = new Set<string>();

async function extractLinksDeep(page: string, maxDepth: number): Promise<PageNode | null> {
    if (visited.has(page) || maxDepth === 0) return null;
    visited.add(page);

    const url = rawUrl(page.endsWith('.md') ? page : `${page}.md`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch fail: ' + url + res.status) ;

    const markdown = await res.text();
    const links = extractLinks(markdown);
    

    const children: PageNode[] = [];

    for (const link of links) {

        const child = await extractLinksDeep(link, maxDepth - 1);
        if (child) {
            children.push(child);
        }
    }

    return {
        link: page,
        ...(children.length > 0 ? { children } : {})
    };
}

const sitemap = await extractLinksDeep('_Sidebar.md', 3);


writeStaticAsJson(sitemap, './src/data/wiki-sitemap.json', false);