import { tokenize, TokenKind, LexError } from "../src/lexer";

describe("lexer", () => {
  test("tokenizes a simple expression", () => {
    const kinds = tokenize("2 + 3").map((t) => t.kind);
    expect(kinds).toEqual([TokenKind.Number, TokenKind.Plus, TokenKind.Number, TokenKind.EOF]);
  });

  test("skips whitespace", () => {
    expect(tokenize(" 1\t+\n2 ").length).toBe(4);
  });

  test("reads floats and scientific notation", () => {
    const toks = tokenize("1.5 2e3 1E-2 .75").slice(0, -1); // drop EOF
    expect(toks.map((t) => t.value)).toEqual([1.5, 2000, 0.01, 0.75]);
  });

  test("reads identifiers", () => {
    const toks = tokenize("foo _bar1");
    expect(toks[0]).toMatchObject({ kind: TokenKind.Ident, text: "foo" });
    expect(toks[1]).toMatchObject({ kind: TokenKind.Ident, text: "_bar1" });
  });

  test("records source positions", () => {
    const toks = tokenize("12 + x");
    expect(toks[0].pos).toBe(0);
    expect(toks[1].pos).toBe(3);
    expect(toks[2].pos).toBe(5);
  });

  test("rejects unexpected characters", () => {
    expect(() => tokenize("2 @ 3")).toThrow(LexError);
    expect(() => tokenize("2 @ 3")).toThrow(/position 2/);
  });

  test("rejects malformed exponents", () => {
    expect(() => tokenize("1e")).toThrow(LexError);
    expect(() => tokenize("1e+")).toThrow(LexError);
  });
});
