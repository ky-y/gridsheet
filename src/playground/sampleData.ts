import { type ColumnType, createCol, type DataType } from "../index.js";

export const columns = [
    createCol("name", "string", {
        title: "aiueo",
        width: "120px",
        readonly: false,
    }),
    createCol("score", "number"),
    createCol("active", "check"),
    createCol("note", "numberString"),
] as const satisfies readonly ColumnType[];

const names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Heidi",
    "Ivan",
    "Judy",
    "Kevin",
    "Leo",
    "Mallory",
    "Nina",
    "Oscar",
    "Peggy",
    "Quentin",
    "Rupert",
    "Sybil",
    "Trent",
    "Uma",
    "Victor",
    "Walter",
    "Xavier",
    "Yvonne",
    "Zara",
];

export const initialData: DataType<typeof columns>[] = new Array(1000)
    .fill(null)
    .map((_, i) => ({
        name: names[i % names.length] as string,
        score: Math.floor(Math.random() * 100),
        active: Math.random() < 0.5,
        note: (Math.random() * 100).toFixed(2),
    }));
