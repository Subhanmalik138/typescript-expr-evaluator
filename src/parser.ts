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

import { Token, TokenKind, tokenize, LexError } from "./lexer";
import {
  Expr,
  Program,
  BinaryOp,
  UnaryOp,
  NumberLiteral,
  Variable,
  UnaryExpr,
  BinaryExpr,
  CallExpr,
  Assignment,
} from "./ast";

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly pos: number,
  ) {
    super(`${message} (at position ${pos})`);
    this.name = "ParseError";
  }
}

const enum Prec {
  None = 0,
  Sum = 10,
  Product = 20,
  Power = 30,
  Unary = 40,
}

function infixPrecedence(kind: TokenKind): Prec {
  switch (kind) {
    case TokenKind.Plus:
    case TokenKind.Minus:
      return Prec.Sum;
    case TokenKind.Star:
    case TokenKind.Slash:
    case TokenKind.Percent:
      return Prec.Product;
    case TokenKind.Caret:
      return Prec.Power;
    default:
      return Prec.None;
  }
}

export class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.current();
    if (t.kind !== TokenKind.EOF) this.pos++;
    return t;
  }

  private expect(kind: TokenKind, what: string): Token {
    const t = this.current();
    if (t.kind !== kind) {
      throw new ParseError(`expected ${what} but found '${t.text || "end of input"}'`, t.pos);
    }
    return this.advance();
  }

  /** Parse one full program: an optional assignment, otherwise an expression. */
  parseProgram(): Program {
    // Lookahead for `ident =`
    const t0 = this.current();
    const t1 = this.tokens[this.pos + 1];
    if (t0.kind === TokenKind.Ident && t1?.kind === TokenKind.Assign) {
      const name = this.advance().text;
      this.advance(); // consume '='
      const value = this.parseExpr(Prec.None);
      this.expect(TokenKind.EOF, "end of input");
      const assign: Assignment = { type: "Assignment", name, value };
      return assign;
    }
    const expr = this.parseExpr(Prec.None);
    this.expect(TokenKind.EOF, "end of input");
    return expr;
  }

  /** Pratt core: parse an expression whose operators bind at >= minPrec. */
  private parseExpr(minPrec: Prec): Expr {
    let left = this.parsePrefix();

    for (;;) {
      const t = this.current();
      const prec = infixPrecedence(t.kind);
      if (prec === Prec.None || prec < minPrec) break;

      // '^' is right-associative: keep the same precedence floor on the RHS.
      const rightMin: Prec = t.kind === TokenKind.Caret ? prec : (prec + 1) as Prec;
      const op = t.text as BinaryOp;
      this.advance();
      const right = this.parseExpr(rightMin);
      const node: BinaryExpr = { type: "BinaryExpr", op, left, right };
      left = node;
    }

    return left;
  }

  /** Prefix position: literals, variables/calls, parens, unary operators. */
  private parsePrefix(): Expr {
    const t = this.advance();
    switch (t.kind) {
      case TokenKind.Number: {
        const node: NumberLiteral = { type: "NumberLiteral", value: t.value };
        return node;
      }
      case TokenKind.Ident: {
        if (this.current().kind === TokenKind.LParen) {
          return this.parseCall(t.text, t.pos);
        }
        const node: Variable = { type: "Variable", name: t.text };
        return node;
      }
      case TokenKind.LParen: {
        const expr = this.parseExpr(Prec.None);
        this.expect(TokenKind.RParen, "')'");
        return expr;
      }
      case TokenKind.Minus:
      case TokenKind.Plus: {
        // Unary binds tighter than + - * / % but looser than ^,
        // matching standard math convention: -2^2 == -(2^2) == -4.
        const operand = this.parseExpr(Prec.Power);
        const node: UnaryExpr = { type: "UnaryExpr", op: t.text as UnaryOp, operand };
        return node;
      }
      case TokenKind.EOF:
        throw new ParseError("unexpected end of input", t.pos);
      default:
        throw new ParseError(`unexpected token '${t.text}'`, t.pos);
    }
  }

  private parseCall(name: string, pos: number): CallExpr {
    this.advance(); // consume '('
    const args: Expr[] = [];
    if (this.current().kind !== TokenKind.RParen) {
      for (;;) {
        args.push(this.parseExpr(Prec.None));
        if (this.current().kind === TokenKind.Comma) {
          this.advance();
          continue;
        }
        break;
      }
    }
    this.expect(TokenKind.RParen, "')'");
    if (args.length === 0) {
      throw new ParseError(`function '${name}' requires at least one argument`, pos);
    }
    return { type: "CallExpr", name, args };
  }
}

export function parseProgram(source: string): Program {
  const tokens = tokenize(source);
  return new Parser(tokens).parseProgram();
}

export { LexError };
