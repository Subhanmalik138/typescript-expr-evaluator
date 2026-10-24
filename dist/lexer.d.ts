/**
 * Lexer — converts a raw expression string into a stream of tokens.
 *
 * Numbers support decimal points and scientific notation (e.g. 1.5e-3).
 * Identifiers may contain letters, digits and underscores, but must not
 * start with a digit. Everything else must be a recognized operator or
 * punctuation; anything else is a lexical error with position info.
 */
export declare const enum TokenKind {
    Number = "Number",
    Ident = "Ident",
    Plus = "+",
    Minus = "-",
    Star = "*",
    Slash = "/",
    Percent = "%",
    Caret = "^",
    LParen = "(",
    RParen = ")",
    Comma = ",",
    Assign = "=",
    EOF = "EOF"
}
export interface Token {
    kind: TokenKind;
    /** Lexeme as it appeared in the source (empty for EOF). */
    text: string;
    /** Numeric value for Number tokens. */
    value: number;
    /** 0-based character offset in the source. */
    pos: number;
}
export declare class LexError extends Error {
    readonly pos: number;
    constructor(message: string, pos: number);
}
export declare function tokenize(source: string): Token[];
