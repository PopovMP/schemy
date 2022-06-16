'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('cond', function () {
	it('One clause with number', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
              [#t 5])         `), 5)
	})

	it('One clause with expression', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
             [#t (+ 2 3)])    `), 5)
	})

	it('Not a case', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
             [#f 3])          `), undefined)
	})

	it('Two clauses: #f, #t', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
            [#f (+ 1 2)]
            [#t (+ 2 3)])     `), 5)
	})

	it('Two clauses: #t, #f', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
            [#t (+ 2 3)]
            [#f (+ 1 2)])     `), 5)
	})

	it('Two clauses: #f, else', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
            [#f   (+ 1 2)]
            [else (+ 2 3)])   `), 5)
	})

	it('Multiple expressions in a clause', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
            [#t (+ 1 1)
                (+ 1 2)
                (+ 2 3)])     `), 5)
	})

	it('Expression as a condition', function () {
		assert.strictEqual(schemy.evaluate(`
        (cond
            [(= 1 2) 0]
            [(= 1 1) 5])      `), 5)
	})
})
