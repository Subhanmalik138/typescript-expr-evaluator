"use strict";
/**
 * AST node definitions for parsed expressions.
 *
 * The tree is immutable and plain-data so it can be walked by multiple
 * evaluators (plain interpretation, constant folding, pretty-printing)
 * without coupling them to the parser.
 */
Object.defineProperty(exports, "__esModule", { value: true });
