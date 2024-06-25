'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('define-values', function () {

    it('define one value', function () {
        assert.strictEqual(schemy.evaluate(`
			(define-values (a) (values 42))
			a
        `), 42)
    })

    it('define two values', function () {
        assert.strictEqual(schemy.evaluate(`
			(define-values (a b) (values 3 4))
			(+ a b)
        `), 7)
    })

    it('define three values', function () {
        assert.strictEqual(schemy.evaluate(`
			(define-values (a b c) (values 3 4 5))
			(- (* a b) c)
        `), 7)
    })
})
