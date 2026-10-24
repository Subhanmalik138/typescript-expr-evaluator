#!/usr/bin/env node
"use strict";
/**
 * CLI: evaluate expressions from argv, or drop into a REPL.
 *
 *   $ expr-eval "2^10" "sqrt(2) * pi"
 *   $ expr-eval --var x=3 "x^2 + 1"
 *   $ expr-eval            # interactive REPL with persistent variables
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const index_1 = require("./index");
function parseVars(args) {
    const vars = {};
    const rest = [];
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
        }
        else {
            rest.push(a);
        }
    }
    return { vars, rest };
}
function run(source, env) {
    try {
        console.log((0, index_1.evaluate)(source, env));
    }
    catch (err) {
        if (err instanceof index_1.LexError || err instanceof index_1.ParseError || err instanceof index_1.EvalError) {
            console.error(`error: ${err.message}`);
            process.exitCode = 1;
        }
        else {
            throw err;
        }
    }
}
function repl() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> ",
    });
    const env = {};
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
            console.log((0, index_1.evaluate)(input, env));
        }
        catch (err) {
            if (err instanceof index_1.LexError || err instanceof index_1.ParseError || err instanceof index_1.EvalError) {
                console.error(`error: ${err.message}`);
            }
            else {
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
}
else {
    for (const expr of rest)
        run(expr, vars);
}
