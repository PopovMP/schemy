'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('list lib', function () {
	describe('(append lst1 lst2)', function () {
		it('given two lists, gets a correct list', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(append '(1 2) '(3 4))
			`), [1, 2, 3, 4])
		})

		it('given two nested lists, gets a correct list', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(append '((1 2) (3 4))
				        '((5 6) (7 8)))
        	`), [[1, 2], [3, 4], [5, 6], [7, 8]])
		})
	})

	describe('(list a b c)', function () {
		it('given two lists, gets a correct list', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(list '(1 2) '(3 4))
			`), [[1, 2], [3, 4]])
		})
	})

	describe('(make-list size fill)', function () {
		it('given size and fill, gets a correct list', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(make-list 4 2)
			`), [2, 2, 2, 2])
		})
	})

	describe('(map f lst)', function () {
		it('given func and list, gets a correct result', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(map (lambda (x) (/ x 2))
				     '(2 4 6 8))
			`), [1, 2, 3, 4])
		})
	})

	describe('(list-tail lst pos)', function () {
		it('given a list and a pos, gets elements of the list after the pos', function () {
			assert.deepStrictEqual(schemy.evaluate(`
				(list-tail '(2 4 6 8 9) 3)
			`), [8, 9])
		})
	})
})
