'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('case', function () {
	it('One clause with number', function () {
		assert.strictEqual(schemy.evaluate(`
            (case 1
                ((1 2 3) "ok") )            `), 'ok')
	})

	it('One clause with expression', function () {
		assert.strictEqual(schemy.evaluate(`
            (case (+ 1 2)
                ((1 2 3) "ok") )            `), 'ok')
	})

	it('do not evaluate datum', function () {
		assert.strictEqual(schemy.evaluate(`
            (case 'x
               [(x) "ex"]
               [('x) "quoted ex"]) `), 'ex')
	})

	it('when there is no match, returns unspecified', function () {
		assert.strictEqual(schemy.evaluate(`
            (case 3
                [(2) "ok"])                `), undefined)
	})

	it('Two clauses', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define n 2)
            (define type (case n
	                         [(0 2 4 6 8) "even"]
	                         [(1 3 5 7 9)  "odd"]))
            type                            `), 'even')
	})

	it('Else', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define n "hello")
            (define type (case n
                            [(0 2 4 6 8) "even"]
                            [(1 3 5 7 9)  "odd"]
                            [else "mhm"]))
            type                            `), 'mhm')
	})

	it('Not a case', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define n "hello")
            (define type (case n
                            [(0 2 4 6 8) "even"]
                            [(1 3 5 7 9)  "odd"]))
            type                            `),
			'Error: Cannot set unspecified value to identifier: type.')
	})

	it('multiple expressions', function () {
		assert.strictEqual(schemy.evaluate(`
            (case 1
                [(1) 1 2 3])               `), 3)
	})

	it('symbol', function () {
		assert.strictEqual(schemy.evaluate(`
            (case 'a
                [(a) "A"])               `), 'A')
	})

	it('string', function () {
		assert.strictEqual(schemy.evaluate(`
            (case "a"
                ((a) "A"))               `), 'A')
	})

	it('match [', function () {
		assert.strictEqual(schemy.evaluate(`
            (case "["
                [("[") 3])               `), 3)
	})

	it('match ]', function () {
		assert.strictEqual(schemy.evaluate(`
            (case "]"
                [("]") 3])               `), 3)
	})
})
