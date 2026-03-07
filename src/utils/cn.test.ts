import { describe, expect, it } from "vitest";
import { cn } from "./cn.js";

describe("cn", () => {
    it("joins multiple class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("filters out null and undefined", () => {
        expect(cn("foo", null, "bar", undefined)).toBe("foo bar");
    });

    it("returns empty string when all values are falsy", () => {
        expect(cn(null, undefined)).toBe("");
    });

    it("returns empty string with no arguments", () => {
        expect(cn()).toBe("");
    });
});
