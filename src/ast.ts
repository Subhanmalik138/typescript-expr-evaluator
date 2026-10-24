/**
 * AST node definitions for parsed expressions.
 *
 * The tree is immutable and plain-data so it can be walked by multiple
 * evaluators (plain interpretation, constant folding, pretty-printing)
 * without coupling them to the parser.
 */

export type BinaryOp = "+" | "-" | "*" | "/" | "%" | "^";
export type UnaryOp = "-" | "+";

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}

export interface Variable {
  type: "Variable";
  name: string;
}

export interface UnaryExpr {
  type: "UnaryExpr";
  op: UnaryOp;
  operand: Expr;
}

export interface BinaryExpr {
  type: "BinaryExpr";
  op: BinaryOp;
  left: Expr;
  right: Expr;
}

export interface CallExpr {
  type: "CallExpr";
  name: string;
  args: Expr[];
}

/** An assignment statement: `name = <expr>`. Only produced at top level. */
export interface Assignment {
  type: "Assignment";
  name: string;
  value: Expr;
}

export type Expr = NumberLiteral | Variable | UnaryExpr | BinaryExpr | CallExpr;
export type Program = Expr | Assignment;
