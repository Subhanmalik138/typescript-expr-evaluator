import { parseProgram, ParseError } from "../src/parser";
import { Expr } from "../src/ast";

function parseExpr(src: string): Expr {
  const p = parseProgram(src);
  if (p.type === "Assignment") throw new Error("expected expression");
  return p;
}

describe("parser", () => {
  test("respects * over +", () => {
    const e = parseExpr("2 + 3 * 4");
    expect(e).toMatchObject({
      type: "BinaryExpr",
      op: "+",
      right: { type: "BinaryExpr", op: "*" },
    });
  });

  test("parentheses override precedence", () => {
    const e = parseExpr("(2 + 3) * 4");
    expect(e).toMatchObject({
      type: "BinaryExpr",
      op: "*",
      left: { type: "BinaryExpr", op: "+" },
    });
  });

  test("^ is right-associative", () => {
    const e = parseExpr("2 ^ 3 ^ 2");
    expect(e).toMatchObject({
      type: "BinaryExpr",
      op: "^",
      right: { type: "BinaryExpr", op: "^" },
    });
  });

  test("unary minus binds looser than ^, tighter than *", () => {
    // Standard math convention: -2^2 == -(2^2), not (-2)^2.
    const e = parseExpr("-2 ^ 2");
    expect(e).toMatchObject({
      type: "UnaryExpr",
      op: "-",
      operand: { type: "BinaryExpr", op: "^" },
    });
    const e2 = parseExpr("-2 * 3");
    expect(e2).toMatchObject({
      type: "BinaryExpr",
      op: "*",
      left: { type: "UnaryExpr", op: "-" },
    });
  });

  test("parses function calls with multiple args", () => {
    const e = parseExpr("max(1, 2 + 3, x)");
    expect(e).toMatchObject({ type: "CallExpr", name: "max" });
    if (e.type === "CallExpr") expect(e.args).toHaveLength(3);
  });

  test("parses top-level assignment", () => {
    const p = parseProgram("radius = 2 * pi");
    expect(p).toMatchObject({ type: "Assignment", name: "radius" });
  });

  test("rejects nested assignment", () => {
    expect(() => parseProgram("1 + (x = 2)")).toThrow(ParseError);
  });

  test("rejects trailing garbage", () => {
    expect(() => parseProgram("1 + 2 3")).toThrow(ParseError);
  });

  test("rejects empty input", () => {
    expect(() => parseProgram("")).toThrow(ParseError);
    expect(() => parseProgram("   ")).toThrow(ParseError);
  });

  test("rejects dangling operator", () => {
    expect(() => parseProgram("2 +")).toThrow(ParseError);
  });

  test("rejects empty function call", () => {
    expect(() => parseProgram("sin()")).toThrow(ParseError);
  });
});
