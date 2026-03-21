import { describe, expect, it } from "vitest";
import { extractText } from "./reactNode.js";

describe("extractText", () => {
    it("returns string as-is", () => {
        expect(extractText("hello")).toBe("hello");
    });

    it("converts number to string", () => {
        expect(extractText(42)).toBe("42");
    });

    it("returns empty string for null", () => {
        expect(extractText(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
        expect(extractText(undefined)).toBe("");
    });

    it("returns empty string for boolean", () => {
        expect(extractText(true)).toBe("");
        expect(extractText(false)).toBe("");
    });

    it("extracts text from JSX element", () => {
        expect(extractText(<span>hello</span>)).toBe("hello");
    });

    it("extracts text from nested JSX elements", () => {
        expect(
            extractText(
                <span>
                    hello <b>world</b>
                </span>,
            ),
        ).toBe("hello world");
    });

    it("extracts text from deeply nested JSX", () => {
        expect(
            extractText(
                <div>
                    <span>
                        <b>deep</b>
                    </span>
                </div>,
            ),
        ).toBe("deep");
    });

    it("extracts text from fragment-like array", () => {
        expect(extractText(["foo", "bar"])).toBe("foobar");
    });

    it("handles mixed content in JSX", () => {
        expect(extractText(<span>count: {123}</span>)).toBe("count: 123");
    });
});
