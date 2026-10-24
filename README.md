# typescript-expr-evaluator

A type-safe arithmetic expression evaluator written in TypeScript: a hand-rolled
lexer, a Pratt (top-down operator precedence) parser producing an immutable AST,
and a tree-walking interpreter — plus a CLI with an interactive REPL.

```ts
import { evaluate, compile } from "typescript-expr-evaluator";

evaluate("2 * (3 + 4)");            // 14
evaluate("x^2 + sin(y)", { x: 3, y: 0 }); // 9

const area = compile("pi * r^2");   // parse once …
area({ r: 5 });                     // … evaluate many times
```

## Features

- Full infix grammar: `+ - * / % ^`, unary `-`/`+`, parentheses
- Correct precedence, with `^` right-associative (`2^3^2` = 512)
- Variables with a caller-supplied environment, top-level assignment (`r = 5`)
- 20 built-in math functions (`sin`, `sqrt`, `ln`, `min`, `max`, `hypot`, …)
- Built-in constants `pi` and `e` (shadowable via the environment)
- Clear errors with source positions: `LexError`, `ParseError`, `EvalError`
- REPL with persistent variables, plus one-shot expression mode
- 40 tests (jest + ts-jest), strict TypeScript, zero runtime dependencies

## Design decisions

1. **Pratt parsing over shunting-yard.** Binding powers make precedence and
   associativity declarative — adding a new operator is one table entry, and
   `^` gets right associativity without special-casing the algorithm.
2. **Immutable plain-data AST.** The parser produces simple object nodes, so
   the evaluator, `compile()`, and any future tooling (pretty-printing,
   constant folding) walk the same structure without parser coupling.
3. **Tree-walking interpreter instead of `eval()`.** User input is parsed and
   evaluated against an explicit environment — no code injection surface, and
   errors name the exact source position.
4. **`compile()` for hot paths.** Parsing is the expensive step; compiling once
   and evaluating per-row pays it a single time for repeated expressions.

## Run it

Requires Node 18+.

```bash
npm install
npm test          # run the test suite
npm run build     # compile to dist/

# CLI
node dist/cli.js "2^10" "sqrt(2) * pi"
node dist/cli.js --var x=3 "x^2 + 1"
node dist/cli.js  # interactive REPL
```

REPL session:

```
> r = 5
5
> 2 * pi * r
31.41592653589793
> vars
{ r: 5 }
```

## Tech stack

TypeScript (strict mode) · Node.js · jest + ts-jest · no runtime dependencies

## License

MIT — see [LICENSE](LICENSE).
