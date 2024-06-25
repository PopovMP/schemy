'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('lambda - Y combinator', function () {
	it('!5 → 120', function () {
		assert.strictEqual(schemy.evaluate(`

    (((lambda (f)
        (lambda (n)
          ((f f) n)))
      (lambda (f)
        (lambda (n)
          (if (= n 0)
              1
              (* ((f f)  (- n 1))
                 n))))) 5)           `), 120)

	})
})
