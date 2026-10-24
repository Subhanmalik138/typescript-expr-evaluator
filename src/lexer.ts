/**
 * Lexer — converts a raw expression string into a stream of tokens.
 *
 * Numbers support decimal points and scientific notation (e.g. 1.5e-3).
 * Identifiers may contain letters, digits and underscores, but must not
 * start with a digit. Everything else must be a recognized operator or
 * punctuation; anything else is a lexical error with position info.
 */

export const enum TokenKind {
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
  EOF = "EOF",
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

export class LexError extends Error {
  constructor(
    message: string,
    public readonly pos: number,
  ) {
    super(`${message} (at position ${pos})`);
    this.name = "LexError";
  }
}

const SINGLE_CHAR_TOKENS: Record<string, TokenKind> = {
  "+": TokenKind.Plus,
  "-": TokenKind.Minus,
  "*": TokenKind.Star,
  "/": TokenKind.Slash,
  "%": TokenKind.Percent,
  "^": TokenKind.Caret,
  "(": TokenKind.LParen,
  ")": TokenKind.RParen,
  ",": TokenKind.Comma,
  "=": TokenKind.Assign,
};

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const peek = (): string => source[i] ?? "";
  const isDigit = (c: string): boolean => c >= "0" && c <= "9";
  const isIdentStart = (c: string): boolean =>
    (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  const isIdentPart = (c: string): boolean => isIdentStart(c) || isDigit(c);

  while (i < source.length) {
    const c = peek();

    // Whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    // Number: digits, optional fraction, optional exponent.
    if (isDigit(c) || (c === "." && isDigit(source[i + 1] ?? ""))) {
      const start = i;
      while (isDigit(peek())) i++;
      if (peek() === "." && isDigit(source[i + 1] ?? "")) {
        i++;
        while (isDigit(peek())) i++;
      }
      if (peek() === "e" || peek() === "E") {
        const expStart = i;
        i++;
        if (peek() === "+" || peek() === "-") i++;
        if (!isDigit(peek())) {
          throw new LexError("malformed scientific notation", expStart);
        }
        while (isDigit(peek())) i++;
      }
      const text = source.slice(start, i);
      tokens.push({ kind: TokenKind.Number, text, value: Number(text), pos: start });
      continue;
    }

    // Identifier
    if (isIdentStart(c)) {
      const start = i;
      while (isIdentPart(peek())) i++;
      const text = source.slice(start, i);
      tokens.push({ kind: TokenKind.Ident, text, value: NaN, pos: start });
      continue;
    }

    // Single-char operator / punctuation
    const kind = SINGLE_CHAR_TOKENS[c];
    if (kind !== undefined) {
      tokens.push({ kind, text: c, value: NaN, pos: i });
      i++;
      continue;
    }

    throw new LexError(`unexpected character '${c}'`, i);
  }

  tokens.push({ kind: TokenKind.EOF, text: "", value: NaN, pos: source.length });
  return tokens;
}
