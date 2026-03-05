// @ts-check
import { defineConfig } from 'astro/config';

import remarkSectionize from 'remark-sectionize';

import mdx from '@astrojs/mdx';

export default defineConfig({
    site: 'https://kahootics.github.io',
    base: '/Tuxborn_Companion/',
    integrations: [mdx()],
    markdown: {
        remarkPlugins: [remarkSectionize]
    }
});