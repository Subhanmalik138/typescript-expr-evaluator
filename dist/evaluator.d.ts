/**
 * Tree-walking evaluator.
 *
 * Walks the AST and produces a number. Variables resolve against a caller
 * supplied environment (with `pi` and `e` pre-defined); unknown names and
 * unknown functions raise EvalError. Division by zero follows IEEE 754
 * (Infinity / -Infinity / NaN) rather than throwing, matching JS semantics.
 */
import { Expr, Program } from "./ast";
export type Env = Record<string, number>;
export declare class EvalError extends Error {
    constructor(message: string);
}
export declare const DEFAULT_ENV: Env;
export declare function evalExpr(expr: Expr, env?: Env): number;
/**
 * Evaluate a top-level program. An assignment stores the value into `env`
 * (mutating the caller's object) and returns the assigned value.
 */
export declare function evalProgram(program: Program, env?: Env): number;
export declare function builtinNames(): string[];
