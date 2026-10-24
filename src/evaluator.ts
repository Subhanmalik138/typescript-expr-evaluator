/**
 * Tree-walking evaluator.
 *
 * Walks the AST and produces a number. Variables resolve against a caller
 * supplied environment (with `pi` and `e` pre-defined); unknown names and
 * unknown functions raise EvalError. Division by zero follows IEEE 754
 * (Infinity / -Infinity / NaN) rather than throwing, matching JS semantics.
 */

import { Expr, Program, BinaryOp } from "./ast";

export type Env = Record<string, number>;

export class EvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalError";
  }
}

type Builtin = (...args: number[]) => number;

const BUILTINS: Record<string, Builtin> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  sqrt: (x) => {
    if (x < 0) throw new EvalError("sqrt of negative number");
    return Math.sqrt(x);
  },
  cbrt: (x) => Math.cbrt(x),
  abs: (x) => Math.abs(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  round: (x) => Math.round(x),
  trunc: (x) => Math.trunc(x),
  exp: (x) => Math.exp(x),
  ln: (x) => {
    if (x <= 0) throw new EvalError("ln of non-positive number");
    return Math.log(x);
  },
  log10: (x) => {
    if (x <= 0) throw new EvalError("log10 of non-positive number");
    return Math.log10(x);
  },
  min: (...xs) => Math.min(...xs),
  max: (...xs) => Math.max(...xs),
  pow: (x, y) => Math.pow(x, y),
  hypot: (...xs) => Math.hypot(...xs),
};

const ARITY: Record<string, [min: number, max: number]> = {
  sin: [1, 1],
  cos: [1, 1],
  tan: [1, 1],
  asin: [1, 1],
  acos: [1, 1],
  atan: [1, 1],
  sqrt: [1, 1],
  cbrt: [1, 1],
  abs: [1, 1],
  floor: [1, 1],
  ceil: [1, 1],
  round: [1, 1],
  trunc: [1, 1],
  exp: [1, 1],
  ln: [1, 1],
  log10: [1, 1],
  pow: [2, 2],
  min: [1, Infinity],
  max: [1, Infinity],
  hypot: [1, Infinity],
};

export const DEFAULT_ENV: Env = Object.freeze({ pi: Math.PI, e: Math.E }) as Env;

function applyBinary(op: BinaryOp, left: number, right: number): number {
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "%":
      return left % right;
    case "^":
      return Math.pow(left, right);
  }
}

export function evalExpr(expr: Expr, env: Env = {}): number {
  switch (expr.type) {
    case "NumberLiteral":
      return expr.value;
    case "Variable": {
      const v = expr.name in env ? env[expr.name] : DEFAULT_ENV[expr.name];
      if (v === undefined) {
        throw new EvalError(`undefined variable '${expr.name}'`);
      }
      return v;
    }
    case "UnaryExpr": {
      const v = evalExpr(expr.operand, env);
      return expr.op === "-" ? -v : v;
    }
    case "BinaryExpr":
      return applyBinary(expr.op, evalExpr(expr.left, env), evalExpr(expr.right, env));
    case "CallExpr": {
      const fn = BUILTINS[expr.name];
      if (!fn) {
        throw new EvalError(`unknown function '${expr.name}'`);
      }
      const [min, max] = ARITY[expr.name] ?? [1, Infinity];
      if (expr.args.length < min || expr.args.length > max) {
        throw new EvalError(
          `function '${expr.name}' expects ${min === max ? min : `${min}..${max === Infinity ? "n" : max}`} argument(s), got ${expr.args.length}`,
        );
      }
      return fn(...expr.args.map((a) => evalExpr(a, env)));
    }
  }
}

/**
 * Evaluate a top-level program. An assignment stores the value into `env`
 * (mutating the caller's object) and returns the assigned value.
 */
export function evalProgram(program: Program, env: Env = {}): number {
  if (program.type === "Assignment") {
    const value = evalExpr(program.value, env);
    env[program.name] = value;
    return value;
  }
  return evalExpr(program, env);
}

export function builtinNames(): string[] {
  return Object.keys(BUILTINS).sort();
}
