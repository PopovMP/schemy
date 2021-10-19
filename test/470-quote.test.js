"use strict";

const assert = require("assert");
const {describe, it} = require("@popovmp/mocha-tiny");
const {Schemy, Parser} = require("../public/js/schemy.js");

const schemy = new Schemy();
const parser = new Parser();

describe("quote", function () {
    it("(quote a) -> a", function () {
        assert.strictEqual(schemy.evaluate(` (quote a) `), "a");
    });

    it("(quote 1) -> 1", function () {
        assert.strictEqual(schemy.evaluate(` (quote 1) `), 1);
    });

    it("(quote (a 1)) -> (a 1)", function () {
        assert.deepStrictEqual(schemy.evaluate(` (quote (a 1)) `), ["a", 1]);
    });

    it("(quote (list a 1)) -> (list a 1)", function () {
        assert.deepStrictEqual(schemy.evaluate(` (quote (list a 1)) `), ["list", "a", 1]);
    });
});

describe("' quote abbreviation", function () {
    it("'a -> a", function () {
        assert.strictEqual(schemy.evaluate(`'a`), "a");
    });

    it(" 'a -> a", function () {
        assert.strictEqual(schemy.evaluate(` 'a `), "a");
    });

    it(" ''a -> (quote a)", function () {
        assert.deepStrictEqual(schemy.evaluate(` ''a `), ["quote", "a"]);
    });

    it(" (cons 'a '()) -> (a)", function () {
        assert.deepStrictEqual(schemy.evaluate(` (cons 'a '()) `), ["a", []]);
    });

    it(" (cons 'a 'b) -> (a  b)", function () {
        assert.deepStrictEqual(schemy.evaluate(` (cons 'a 'b) `), ["a", "b"]);
    });

    it(" '(a) -> (a)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '(a) `), ["a"]);
    });

    it(" ''(a) -> (a)", function () {
        assert.deepStrictEqual(schemy.evaluate(` ''(a) `), ["quote", ["a"]]);
    });

    it(" '(a b 1) -> '(a b 1)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '(a b 1) `), ["a", "b", 1]);
    });

    it(" '(a 'b 1) -> '(a 'b 1)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '(a 'b 1) `), ["a", ["quote", "b"], 1]);
    });
});


describe("nested quote abbrev", function () {
    it("'('(1))", function () {
        assert.deepStrictEqual(schemy.evaluate(` '('(1)) `), [["quote", [1]]]);
    });

    it("'('(1) 2) text", function () {
        assert.strictEqual(parser.expandListAbbreviation( parser.tokenize(
            ` '('(1) 2) `), "'", "quote" ).join(" "),
            "( quote ( ( quote ( 1 ) ) 2 ) )" );
    });

    it("'('(1 2 3) 2) text", function () {
        assert.strictEqual(parser.expandListAbbreviation( parser.tokenize(
            ` '('(1 2 3) 2) `), "'", "quote" ).join(" "),
            "( quote ( ( quote ( 1 2 3 ) ) 2 ) )" );
    });

    it("'('(1) 2)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '('(1) 2) `) ,
            [["quote", [1]], 2] );
    });

    it("'('(1 2 3) 2)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '('(1 2 3) 2) `),
            [["quote", [1, 2, 3]], 2] );
    });

    it("'(1 '(2 '(3)) 4)", function () {
        assert.deepStrictEqual(schemy.evaluate(` '(1 '(2 '(3)) 4) `), [1, ["quote", [2, ["quote", [3]]]], 4]);
    });
});
