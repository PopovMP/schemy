'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../public/js/schemy.js').Schemy

const schemy = new Schemy()

describe('List declaration', function () {
	it('empty list: \'() → \'()', function () {
		assert.deepStrictEqual(schemy.evaluate('\'()'), [])
	})

	it('empty list: (list) → \'()', function () {
		assert.deepStrictEqual(schemy.evaluate('(list)'), [])
	})

	it('(list 1)', function () {
		assert.deepStrictEqual(schemy.evaluate('(list 1)'), [1])
	})

	it('(list 1 2)', function () {
		assert.deepStrictEqual(schemy.evaluate('(list 1 2)'), [1, [2]])
	})

	it('non empty num list: (cons 1 2)', function () {
		assert.deepStrictEqual(schemy.evaluate('(cons 1 2)'), [1, 2])
	})

	it('car', function () {
		assert.deepStrictEqual(schemy.evaluate('(car (cons 1 2))'), 1)
	})

	it('cdr', function () {
		assert.deepStrictEqual(schemy.evaluate('(cdr (cons 1 2))'), 2)
	})
})
