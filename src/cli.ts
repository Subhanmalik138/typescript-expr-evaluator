#!/usr/bin/env node
/**
 * CLI: evaluate expressions from argv, or drop into a REPL.
 *
 *   $ expr-eval "2^10" "sqrt(2) * pi"
 *   $ expr-eval --var x=3 "x^2 + 1"
 *   $ expr-eval            # interactive REPL with persistent variables
 */

import * as readline from "readline";
import { evaluate, Env, LexError, ParseError, EvalError } from "./index";

function parseVars(args: string[]): { vars: Env; rest: string[] } {
  const vars: Env = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--var" || a === "-v") {
      const pair = args[++i];
      if (!pair || !pair.includes("=")) {
        console.error(`error: --var expects NAME=VALUE, got '${pair ?? ""}'`);
        process.exit(2);
      }
      const [name, raw] = pair.split("=", 2);
      const value = Number(raw);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || Number.isNaN(value)) {
        console.error(`error: bad variable assignment '${pair}'`);
        process.exit(2);
      }
      vars[name] = value;
    } else {
      rest.push(a);
    }
  }
  return { vars, rest };
}

function run(source: string, env: Env): void {
  try {
    console.log(evaluate(source, env));
  } catch (err) {
    if (err instanceof LexError || err instanceof ParseError || err instanceof EvalError) {
      console.error(`error: ${err.message}`);
      process.exitCode = 1;
    } else {
      throw err;
    }
  }
}

function repl(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  const env: Env = {};
  console.log("expr-eval REPL — type an expression, 'vars' to list variables, Ctrl+C to exit.");
  rl.prompt();
  rl.on("line", (line) => {
    const input = line.trim();
    if (input === "") {
      rl.prompt();
      return;
    }
    if (input === "vars") {
      console.log(env);
      rl.prompt();
      return;
    }
    if (input === "exit" || input === "quit") {
      rl.close();
      return;
    }
    try {
      console.log(evaluate(input, env));
    } catch (err) {
      if (err instanceof LexError || err instanceof ParseError || err instanceof EvalError) {
        console.error(`error: ${err.message}`);
      } else {
        throw err;
      }
    }
    rl.prompt();
  });
  rl.on("close", () => console.log("bye."));
}

const { vars, rest } = parseVars(process.argv.slice(2));
if (rest.length === 0) {
  repl();
} else {
  for (const expr of rest) run(expr, vars);
}
