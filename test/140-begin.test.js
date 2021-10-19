'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../public/js/schemy.js').Schemy

const schemy = new Schemy()

describe('begin', function () {

	it('(begin) → Error', function () {
		assert.strictEqual(schemy.evaluate('(begin)'),
			'Error: Empty begin')
	})

	it('(begin 1) → 1', function () {
		assert.strictEqual(schemy.evaluate('(begin 1)'), 1)
	})

	it('(begin 1 2) → 2', function () {
		assert.strictEqual(schemy.evaluate('(begin 1 2)'), 2)
	})

	it('(begin (+ 7 1) (+ 1 2)) → 3', function () {
		assert.strictEqual(schemy.evaluate('(begin (+ 7 1) (+ 1 2))'), 3)
	})

	it('define in begin', function () {
		assert.strictEqual(schemy.evaluate(`
            (begin
                (define a 5)
                (define b 6)
                (+ a b) )           `), 11)
	})

	it('nested begin', function () {
		assert.strictEqual(schemy.evaluate(`
            (begin
                (begin
                    (begin
                        (define a 5)
                        (define b 6)
                        (+ a b) ))) `), 11)
	})

	it('scope accessible from inner begin', function () {
		assert.strictEqual(schemy.evaluate(`
            (begin
                (define a 5)
                (begin
                    (define b 6)
                    (begin
                       (+ a b) )))  `), 11)
	})
})
