import { z } from "zod";

const hasId = z.object({
    id: z.string()
});

const addElement = z.object({
    element: z.any()
});

const SchemaMiniModIdless = z.object({
    name: z.object({
        short: z.string(),
        full: z.string(),
        alias: z.array(z.string()).nullable()
    }),
    relatedMods: z.array(z.string()).nullable(),
    creator: z.string(),
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
    })
});

const SchemaMiniMod = hasId.merge(SchemaMiniModIdless);


const SchemaOptionalsMod = z.object({
    enabled: z.boolean(),
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

const SchemaMod = SchemaOptionalsMod.merge(SchemaMiniMod);


export function validateTypeMiniMod(miniRecord: {}) {
    return SchemaMiniMod.parse(miniRecord);
}

export function validateTypeMod(record: {}) {
    return SchemaMod.parse(record);
}

export function validateTypeModMiniMap(
    record: any[]
): [string, z.infer<typeof SchemaMiniModIdless>] {
    return [
        z.string().parse(record[0]),
        SchemaMiniModIdless.parse(record[1])
    ];
}

export type MiniModIdless = z.infer<typeof SchemaMiniModIdless>;
const SchemaUseMap = addElement.merge(SchemaMiniModIdless);

export type MiniMod = z.infer<typeof SchemaUseMap>;

export function modMiniMap(record: unknown
): [string, z.infer<typeof SchemaMiniModIdless>] {

    const { id, ...rest } = record as any;

    return [
        z.string().parse(id),
        SchemaMiniModIdless.parse(rest)
    ];
}
