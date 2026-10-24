/**
 * Pratt (top-down operator precedence) parser.
 *
 * Precedence table (higher binds tighter):
 *   10  + -
 *   20  * / %
 *   30  ^              (right-associative: 2^3^2 == 2^(3^2))
 *   30  unary - +      (binds like ^: -2^2 == -(2^2), but -2*3 == (-2)*3)
 * Parentheses and function calls bind tightest via primary expressions.
 *
 * The parser also accepts a single top-level assignment of the form
 * `name = expr` — nested assignments are rejected.
 */
import { Token, LexError } from "./lexer";
import { Program } from "./ast";
export declare class ParseError extends Error {
    readonly pos: number;
    constructor(message: string, pos: number);
}
export declare class Parser {
    private readonly tokens;
    private pos;
    constructor(tokens: Token[]);
    private current;
    private advance;
    private expect;
    /** Parse one full program: an optional assignment, otherwise an expression. */
    parseProgram(): Program;
    /** Pratt core: parse an expression whose operators bind at >= minPrec. */
    private parseExpr;
    /** Prefix position: literals, variables/calls, parens, unary operators. */
    private parsePrefix;
    private parseCall;
}
export declare function parseProgram(source: string): Program;
export { LexError };
