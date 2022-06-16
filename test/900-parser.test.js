'use strict'

const assert            = require('assert')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {Parser, Printer} = require('../assets/js/schemy.js')

const parser = new Parser()

describe('Parser', function () {
	describe('tokenize expression', function () {
		it('one digit', function () {
			assert.deepStrictEqual(parser.tokenize('1'), [1])
		})

		it('define - number', function () {
			assert.deepStrictEqual(parser.tokenize('(define n 25)'), ['(', 'define', 'n', 25, ')'])
		})

		it('define - list', function () {
			assert.deepStrictEqual(parser.tokenize('(define lst (cons 1 2))'),
				['(', 'define', 'lst', '(', 'cons', 1, 2, ')', ')'])
		})

		it('define - quote', function () {
			assert.deepStrictEqual(parser.tokenize('(define lst \'(1 2 3))'),
				['(', 'define', 'lst', '\'', '(', 1, 2, 3, ')', ')'])
		})

		it('code in parenthesis', function () {
			assert.deepStrictEqual(parser.tokenize('(+ a b)'), ['(', '+', 'a', 'b', ')'])
		})

		it('Multiple expr', function () {
			assert.deepStrictEqual(parser.tokenize('1 2'), [1, 2])
		})
	})

	describe('tokenize comments', function () {
		it('comment at new line', function () {
			assert.deepStrictEqual(parser.tokenize(';; me comment'), [])
		})

		it('comment after code', function () {
			assert.deepStrictEqual(parser.tokenize('(define foo 1) ;; comment'),
				['(', 'define', 'foo', 1, ')'])
		})
	})

	describe('parser', function () {
		it('parse 1', function () {
			const codeText = '1'
			assert.deepStrictEqual(parser.parse(codeText), [1])
		})

		it('parse 2', function () {
			const codeText = '1 2 a'
			assert.deepStrictEqual(parser.parse(codeText), [1, 2, 'a'])
		})

		it('parse 3 - 1', function () {
			const codeText = '(a) (b)'
			assert.deepStrictEqual(parser.parse(codeText), [['a'], ['b']])
		})

		it('parse two lists', function () {
			const codeText = '(list 1 2) (list 3 4)'
			assert.deepStrictEqual(parser.parse(codeText), [['list', 1, 2], ['list', 3, 4]])
		})

		it('parse two quotes', function () {
			const codeText = '\'(1 2) \'(3 4)'
			assert.deepStrictEqual(parser.parse(codeText), [['quote', [1, 2]], ['quote', [3, 4]]])
		})

		it('parse 4', function () {
			const codeText = `
                (define fac
                   (lambda (n)
                     (if (= n 0)
                         1
                         (* (fac (- n 1))  n))))
                (fac 5)
            `

			const ilCode = [
				['define', 'fac',
					['lambda', ['n'],
						['if', ['=', 'n', 0],
							   1,
							   ['*', ['fac', ['-', 'n', 1]], 'n']]]],
				['fac', 5]
			]

			assert.deepStrictEqual(parser.parse(codeText), ilCode)

			const printText = `((define fac (lambda (n) (if (= n 0) 1 (* (fac (- n 1)) n)))) (fac 5))`

			assert.deepStrictEqual(Printer.stringify(ilCode), printText)
		})
	})
})
