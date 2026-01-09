import { z } from "zod";

const SchemaMod = z.object({
    id: z.string(),
    enabled: z.boolean(),
    name: z.object({
        short: z.string(),
        full: z.string(),
        alias: z.array(z.string()).nullable()
    }),
    relatedMods: z.array(z.string()).nullable(),
    creator: z.string(),
    image: z.object({
        int: z.string().nullable(),
        ext: z.string()
    }),
    overview: z.string(),
    link: z.object({
        nexus: z.string(),
        wiki: z.string().nullable(),
        misc: z.string().nullable(),
    }),
    version: z.object({
        added: z.number(),
        available: z.array(z.number())
    }),
    category: z.string(),
    length: z.number(),
    displays: z.number(),
    tags: z.object({
        misc: z.array(z.string()).nullable(),
        content: z.array(z.string()).nullable(),
        location: z.array(z.string()).nullable(),
    }),
    req: z.object({
        level: z.number(),
        misc: z.string().nullable()
    }),
    quest: z.object({
        initial: z.string().nullable(),
        other: z.array(z.string()).nullable()
    }),
    howTo: z.object({
        text: z.string().nullable(),
        title: z.string().nullable()
    }),
    where: z.object({
        desc: z.string().nullable(),
        title: z.string().nullable(),
        image: z.object({
            int: z.string().nullable(),
            ext: z.string().nullable()
        })
    }),
    notes: z.object({
        text: z.string().nullable(),
        title: z.string().nullable()
    })
});


export default function validateTypeMods(records: any[]) {
    return records.map( record => (SchemaMod.parse(record)));
}

export function validateTypeMod(record: {}) {
    return SchemaMod.parse(record);
}