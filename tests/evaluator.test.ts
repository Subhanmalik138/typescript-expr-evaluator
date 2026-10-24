import { evaluate, compile, EvalError } from "../src/index";
import { parseProgram } from "../src/parser";
import { evalProgram } from "../src/evaluator";

describe("evaluator", () => {
  test("arithmetic with precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 - 2 - 3")).toBe(5); // left-assoc
    expect(evaluate("100 / 10 / 2")).toBe(5);
    expect(evaluate("17 % 5")).toBe(2);
  });

  test("right-associative power", () => {
    expect(evaluate("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluate("2 ^ (3 ^ 2)")).toBe(512);
  });

  test("unary operators", () => {
    expect(evaluate("-3 + 5")).toBe(2);
    expect(evaluate("--3")).toBe(3);
    expect(evaluate("-2 ^ 2")).toBe(-4);
    expect(evaluate("(-2) ^ 2")).toBe(4);
    expect(evaluate("+-3")).toBe(-3);
  });

  test("built-in functions", () => {
    expect(evaluate("sqrt(16)")).toBe(4);
    expect(evaluate("sin(0)")).toBe(0);
    expect(evaluate("cos(0)")).toBe(1);
    expect(evaluate("abs(-7)")).toBe(7);
    expect(evaluate("floor(3.9)")).toBe(3);
    expect(evaluate("ceil(3.1)")).toBe(4);
    expect(evaluate("max(1, 9, 4)")).toBe(9);
    expect(evaluate("min(1, 9, 4)")).toBe(1);
    expect(evaluate("pow(2, 10)")).toBe(1024);
    expect(evaluate("ln(e)")).toBeCloseTo(1);
    expect(evaluate("log10(1000)")).toBe(3);
    expect(evaluate("hypot(3, 4)")).toBe(5);
  });

  test("constants pi and e", () => {
    expect(evaluate("pi")).toBeCloseTo(Math.PI);
    expect(evaluate("2 * pi")).toBeCloseTo(2 * Math.PI);
    expect(evaluate("e")).toBeCloseTo(Math.E);
  });

  test("variables from env", () => {
    expect(evaluate("x^2 + 2*x + 1", { x: 3 })).toBe(16);
    expect(evaluate("a + b", { a: 1, b: 2 })).toBe(3);
  });

  test("env shadows constants", () => {
    expect(evaluate("pi + 1", { pi: 3 })).toBe(4);
  });

  test("assignment stores into env", () => {
    const env = {};
    expect(evalProgram(parseProgram("r = 5"), env)).toBe(5);
    expect(env).toMatchObject({ r: 5 });
    expect(evaluate("2 * pi * r", env)).toBeCloseTo(2 * Math.PI * 5);
  });

  test("nested expressions in calls", () => {
    expect(evaluate("sqrt(max(9, 16) + min(1, 2))")).toBeCloseTo(Math.sqrt(17));
  });

  test("compile reuses the AST", () => {
    const f = compile("x^2 + 1");
    expect(f({ x: 2 })).toBe(5);
    expect(f({ x: 5 })).toBe(26);
    expect(() => f()).toThrow(EvalError); // x undefined with empty env
  });

  test("division by zero follows IEEE 754", () => {
    expect(evaluate("1 / 0")).toBe(Infinity);
    expect(evaluate("-1 / 0")).toBe(-Infinity);
    expect(evaluate("0 / 0")).toBeNaN();
  });

  test("errors: undefined variable", () => {
    expect(() => evaluate("x + 1")).toThrow(EvalError);
    expect(() => evaluate("x + 1")).toThrow(/undefined variable 'x'/);
  });

  test("errors: unknown function", () => {
    expect(() => evaluate("frobnicate(2)")).toThrow(/unknown function/);
  });

  test("errors: wrong arity", () => {
    expect(() => evaluate("sqrt(1, 2)")).toThrow(/expects 1 argument/);
    expect(() => evaluate("pow(2)")).toThrow(/expects 2 argument/);
  });

  test("errors: domain violations", () => {
    expect(() => evaluate("sqrt(-1)")).toThrow(/negative/);
    expect(() => evaluate("ln(0)")).toThrow(/non-positive/);
  });
});
