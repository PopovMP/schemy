'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Easl           = require('../assets/js/schemy.js').Schemy

const easl = new Easl()

describe('apply', function () {
	it('apply define lambda with an empty list of args', function () {
		assert.strictEqual(easl.evaluate(`
            (define lam (lambda () 5))
            (apply lam '())                           `), 5)
	})

	it('apply define lambda with one arg - number', function () {
		assert.strictEqual(easl.evaluate(`
            (define double (lambda (n) (* 2 n)))
            (apply double '(2))                       `), 4)
	})

	it('apply define lambda with one arg - string', function () {
		assert.strictEqual(easl.evaluate(`
            (define identity (lambda (a) a))
            (apply identity '("hello"))               `), 'hello')
	})

	it('apply define lambda with list of args', function () {
		assert.strictEqual(easl.evaluate(`
            (define sum (lambda (a b) (+ a b)))
            (apply sum '(2 3))                        `), 5)
	})

	it('apply define lambda with list of args string', function () {
		assert.strictEqual(easl.evaluate(`
            (define (concat-three a b c) (string-append a b c))
            (apply concat-three '("hello" " " "world"))    `), 'hello world')
	})

	it('apply function with empty list of args', function () {
		assert.strictEqual(easl.evaluate(`
            (define (f) 5)
            (apply f '())                             `), 5)
	})

	it('apply function with one arg - number', function () {
		assert.strictEqual(easl.evaluate(`
            (define (double n) (* 2 n))
            (apply double '(2))                       `), 4)
	})

	it('apply function with one arg - string', function () {
		assert.strictEqual(easl.evaluate(`
            (define (id a) a)
            (apply id '("hello"))               `), 'hello')
	})

	it('apply function with list of args', function () {
		assert.strictEqual(easl.evaluate(`
            (define (sum a b) (+ a b))
            (apply sum '(2 3))                        `), 5)
	})

	it('apply lambda with list of num args', function () {
		assert.strictEqual(easl.evaluate(`
            (apply (lambda (a b) (+ a b)) '(2 3))     `), 5)
	})

	it('apply lambda with list of string args', function () {
		assert.strictEqual(easl.evaluate(`
            (apply (lambda (a b) (string-append a b)) '("2" "3")) `), '23')
	})

	it('apply builtin function with numbers', function () {
		assert.strictEqual(easl.evaluate(`
            (apply + '(2 3 4 5 6))                    `), 20)
	})

	it('apply builtin function with strings', function () {
		assert.strictEqual(easl.evaluate(`
            (apply string-append '("a" "b" "c"))                  `), 'abc')
	})

	it('apply or with trues', function () {
		assert.strictEqual(easl.evaluate(`
            (apply or '(#t #t #t))              `), true)
	})

	it('apply or with true, false', function () {
		assert.strictEqual(easl.evaluate(`
            (apply or '(#t #f))                  `), true)
	})

	it('apply and with trues', function () {
		assert.strictEqual(easl.evaluate(`
            (apply and '(#t #t #t))             `), true)
	})

	it('apply and with true, false', function () {
		assert.strictEqual(easl.evaluate(`
            (apply and '(#t #f))                 `), false)
	})

	it('apply builtin function with an array', function () {
		assert.deepStrictEqual(easl.evaluate(`
            (apply cdr (list (list 2 3 4 5 6)))        `), [3, 4, 5, 6])
	})

	it('apply builtin function with defined empty list', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '())
            (apply * lst)                            `), 1)
	})

	it('apply builtin function with defined non empty list', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '(3 4))
            (apply + lst)                            `), 7)
	})

	it('apply builtin function with defined list of strings', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '("a" "b"))
            (apply string-append lst)                `), 'ab')
	})

	it('apply or with defined list of booleans 1', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '(#f #t))
            (apply or lst)                            `), true)
	})

	it('apply builtin function with list of num vars', function () {
		assert.strictEqual(easl.evaluate(`
            (define x 1)
            (define y 2)
            (define lst (cons x (cons y '())))
            (apply + lst)                            `), 3)
	})

	it('apply builtin function with list of string vars', function () {
		assert.strictEqual(easl.evaluate(`
            (define x "a")
            (define y "b")
            (define lst (list x y))
            (apply string-append lst)                `), 'ab')
	})

	it('apply builtin function with list of boolean vars', function () {
		assert.strictEqual(easl.evaluate(`
            (define f #f)
            (define t #t)
            (define lst (list f t))
            (apply and lst)                         `), false)
	})

	it('apply or list of \'() and num', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '('() 42))
            (apply and lst)                            `), 42)
	})

	it('apply or list of \'() and string', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '('() "a"))
            (apply and lst)                            `), 'a')
	})

	it('apply or list of \'() and boolean', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst '('() #t))
            (apply and lst)                            `), true)
	})

	it('apply builtin function with list of boolean true', function () {
		assert.strictEqual(easl.evaluate(`
            (define t1 #t)
            (define t2 #t)
            (define t3 42)
            (define lst (list t1 t2 t3))
            (apply and lst)                            `), 42)
	})

	it('apply with expression, which produces num list', function () {
		assert.strictEqual(easl.evaluate(`
            (apply + (cdr (list 0 1 2 3 4)))           `), 10)
	})

	it('apply with expression, which produces string list', function () {
		assert.strictEqual(easl.evaluate(`
            (apply string-append  (cons "a" (cons "b" (cons "c" '()))))   `), 'abc')
	})

	it('factorial 5', function () {
		assert.strictEqual(easl.evaluate(`
            (apply * (cdr (list 0 1 2 3 4 5)))       `), 120)
	})

	it('factorial 5 - 2', function () {
		assert.strictEqual(easl.evaluate(`
            (define lst (cdr (list 0 1 2 3 4 5)))
            (apply * lst)                            `), 120)
	})
})
