"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexError = exports.Parser = exports.ParseError = void 0;
exports.parseProgram = parseProgram;
const lexer_1 = require("./lexer");
Object.defineProperty(exports, "LexError", { enumerable: true, get: function () { return lexer_1.LexError; } });
class ParseError extends Error {
    constructor(message, pos) {
        super(`${message} (at position ${pos})`);
        this.pos = pos;
        this.name = "ParseError";
    }
}
exports.ParseError = ParseError;
function infixPrecedence(kind) {
    switch (kind) {
        case "+" /* TokenKind.Plus */:
        case "-" /* TokenKind.Minus */:
            return 10 /* Prec.Sum */;
        case "*" /* TokenKind.Star */:
        case "/" /* TokenKind.Slash */:
        case "%" /* TokenKind.Percent */:
            return 20 /* Prec.Product */;
        case "^" /* TokenKind.Caret */:
            return 30 /* Prec.Power */;
        default:
            return 0 /* Prec.None */;
    }
}
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }
    current() {
        return this.tokens[this.pos];
    }
    advance() {
        const t = this.current();
        if (t.kind !== "EOF" /* TokenKind.EOF */)
            this.pos++;
        return t;
    }
    expect(kind, what) {
        const t = this.current();
        if (t.kind !== kind) {
            throw new ParseError(`expected ${what} but found '${t.text || "end of input"}'`, t.pos);
        }
        return this.advance();
    }
    /** Parse one full program: an optional assignment, otherwise an expression. */
    parseProgram() {
        // Lookahead for `ident =`
        const t0 = this.current();
        const t1 = this.tokens[this.pos + 1];
        if (t0.kind === "Ident" /* TokenKind.Ident */ && t1?.kind === "=" /* TokenKind.Assign */) {
            const name = this.advance().text;
            this.advance(); // consume '='
            const value = this.parseExpr(0 /* Prec.None */);
            this.expect("EOF" /* TokenKind.EOF */, "end of input");
            const assign = { type: "Assignment", name, value };
            return assign;
        }
        const expr = this.parseExpr(0 /* Prec.None */);
        this.expect("EOF" /* TokenKind.EOF */, "end of input");
        return expr;
    }
    /** Pratt core: parse an expression whose operators bind at >= minPrec. */
    parseExpr(minPrec) {
        let left = this.parsePrefix();
        for (;;) {
            const t = this.current();
            const prec = infixPrecedence(t.kind);
            if (prec === 0 /* Prec.None */ || prec < minPrec)
                break;
            // '^' is right-associative: keep the same precedence floor on the RHS.
            const rightMin = t.kind === "^" /* TokenKind.Caret */ ? prec : (prec + 1);
            const op = t.text;
            this.advance();
            const right = this.parseExpr(rightMin);
            const node = { type: "BinaryExpr", op, left, right };
            left = node;
        }
        return left;
    }
    /** Prefix position: literals, variables/calls, parens, unary operators. */
    parsePrefix() {
        const t = this.advance();
        switch (t.kind) {
            case "Number" /* TokenKind.Number */: {
                const node = { type: "NumberLiteral", value: t.value };
                return node;
            }
            case "Ident" /* TokenKind.Ident */: {
                if (this.current().kind === "(" /* TokenKind.LParen */) {
                    return this.parseCall(t.text, t.pos);
                }
                const node = { type: "Variable", name: t.text };
                return node;
            }
            case "(" /* TokenKind.LParen */: {
                const expr = this.parseExpr(0 /* Prec.None */);
                this.expect(")" /* TokenKind.RParen */, "')'");
                return expr;
            }
            case "-" /* TokenKind.Minus */:
            case "+" /* TokenKind.Plus */: {
                // Unary binds tighter than + - * / % but looser than ^,
                // matching standard math convention: -2^2 == -(2^2) == -4.
                const operand = this.parseExpr(30 /* Prec.Power */);
                const node = { type: "UnaryExpr", op: t.text, operand };
                return node;
            }
            case "EOF" /* TokenKind.EOF */:
                throw new ParseError("unexpected end of input", t.pos);
            default:
                throw new ParseError(`unexpected token '${t.text}'`, t.pos);
        }
    }
    parseCall(name, pos) {
        this.advance(); // consume '('
        const args = [];
        if (this.current().kind !== ")" /* TokenKind.RParen */) {
            for (;;) {
                args.push(this.parseExpr(0 /* Prec.None */));
                if (this.current().kind === "," /* TokenKind.Comma */) {
                    this.advance();
                    continue;
                }
                break;
            }
        }
        this.expect(")" /* TokenKind.RParen */, "')'");
        if (args.length === 0) {
            throw new ParseError(`function '${name}' requires at least one argument`, pos);
        }
        return { type: "CallExpr", name, args };
    }
}
exports.Parser = Parser;
function parseProgram(source) {
    const tokens = (0, lexer_1.tokenize)(source);
    return new Parser(tokens).parseProgram();
}
