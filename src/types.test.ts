import { describe, expect, it } from "vitest";
import { createCol } from "./types.js";

describe("createCol", () => {
    it("creates a simple column definition", () => {
        const col = createCol("name", "string", { title: "名前", width: 100 });
        expect(col).toEqual({ key: "name", type: "string", title: "名前", width: 100 });
    });

    it("creates a select column with options", () => {
        const options = [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
        ];
        const col = createCol("status", "select", { options });
        expect(col).toEqual({ key: "status", type: "select", options });
    });
});
