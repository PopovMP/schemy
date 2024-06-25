'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('let-values', function () {

    it('one binding line', function () {
        assert.strictEqual(schemy.evaluate(`
			(let-values ([(a b) (values 3 4)])
			    (+ a b))
        `), 7)
    })

    it('one binding lines', function () {
        assert.strictEqual(schemy.evaluate(`
			(let-values ([(a b) (values 10 7)]
			             [(c d) (values 12 8)])
			    (* (- a b) (- c d)))
        `), 12)
    })
})

describe('let*-values', function () {

    it('one binding line', function () {
        assert.deepStrictEqual(schemy.evaluate(`
            (let ([a 'a] [b 'b] [x 'x] [y 'y])
                 (let*-values ([(a b) (values x y)]
                               [(x y) (values a b)])
                     (list a b x y)))
        `), ['x', 'y', 'x', 'y'])
    })
})
