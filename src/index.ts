/**
 * Public API.
 *
 *   import { evaluate, compile, parseProgram } from "expr-evaluator";
 *
 *   evaluate("2 * (3 + 4)");            // 14
 *   evaluate("x^2 + y", { x: 3, y: 1 }); // 10
 *
 * `compile` parses once and returns a reusable function — parse cost is
 * paid a single time when the same expression is evaluated repeatedly.
 */

import { parseProgram } from "./parser";
import { evalProgram, evalExpr, Env, DEFAULT_ENV, builtinNames } from "./evaluator";
import { Program, Expr } from "./ast";

export { LexError } from "./lexer";
export { ParseError } from "./parser";
export { EvalError, DEFAULT_ENV, builtinNames } from "./evaluator";
export type { Env, Expr, Program };

/** Parse and evaluate a source string in one step. */
export function evaluate(source: string, env: Env = {}): number {
  return evalProgram(parseProgram(source), env);
}

/**
 * Parse once, evaluate many times. The returned function closes over the
 * parsed AST; pass a fresh env object per call to avoid leaking state
 * between evaluations (assignments mutate the env they receive).
 */
export function compile(source: string): (env?: Env) => number {
  const program = parseProgram(source);
  return (env: Env = {}) => evalProgram(program, env);
}

/** Parse without evaluating — useful for tooling or AST inspection. */
export function parse(source: string): Program {
  return parseProgram(source);
}

export { parseProgram, evalProgram, evalExpr };
