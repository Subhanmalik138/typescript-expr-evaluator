"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalExpr = exports.evalProgram = exports.parseProgram = exports.builtinNames = exports.DEFAULT_ENV = exports.EvalError = exports.ParseError = exports.LexError = void 0;
exports.evaluate = evaluate;
exports.compile = compile;
exports.parse = parse;
const parser_1 = require("./parser");
Object.defineProperty(exports, "parseProgram", { enumerable: true, get: function () { return parser_1.parseProgram; } });
const evaluator_1 = require("./evaluator");
Object.defineProperty(exports, "evalProgram", { enumerable: true, get: function () { return evaluator_1.evalProgram; } });
Object.defineProperty(exports, "evalExpr", { enumerable: true, get: function () { return evaluator_1.evalExpr; } });
var lexer_1 = require("./lexer");
Object.defineProperty(exports, "LexError", { enumerable: true, get: function () { return lexer_1.LexError; } });
var parser_2 = require("./parser");
Object.defineProperty(exports, "ParseError", { enumerable: true, get: function () { return parser_2.ParseError; } });
var evaluator_2 = require("./evaluator");
Object.defineProperty(exports, "EvalError", { enumerable: true, get: function () { return evaluator_2.EvalError; } });
Object.defineProperty(exports, "DEFAULT_ENV", { enumerable: true, get: function () { return evaluator_2.DEFAULT_ENV; } });
Object.defineProperty(exports, "builtinNames", { enumerable: true, get: function () { return evaluator_2.builtinNames; } });
/** Parse and evaluate a source string in one step. */
function evaluate(source, env = {}) {
    return (0, evaluator_1.evalProgram)((0, parser_1.parseProgram)(source), env);
}
/**
 * Parse once, evaluate many times. The returned function closes over the
 * parsed AST; pass a fresh env object per call to avoid leaking state
 * between evaluations (assignments mutate the env they receive).
 */
function compile(source) {
    const program = (0, parser_1.parseProgram)(source);
    return (env = {}) => (0, evaluator_1.evalProgram)(program, env);
}
/** Parse without evaluating — useful for tooling or AST inspection. */
function parse(source) {
    return (0, parser_1.parseProgram)(source);
}
