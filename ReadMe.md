# Minimal Scheme

## Use on  server

    npm install
    npm run build
    npm run test

Execute code:

```javascript
const Schemy = require("../bin/schemy.js").Schemy
const schemy = new Schemy()

const code = `(define a 5)
              (+ a a)`

const res = schemy.evaluate(code)
console.log(res) // -> 10
```

## Use in browser

```javascript
<script src="js/schemy.js"></script>
<script>
	const schemy = new Schemy()

	const code = `(define a 5)
	              (+ a a)`

	const res = schemy.evaluate(code)
	console.log(res) // -> 10
</script>
```

## Forms

### Quote
```scheme
(quote <expression>)
'<expression>
```

### Definition

```scheme
(define <symbol> <expression>)
```

### Lambda
Accepts zero or more bound parameters.
Evaluates and returns the value of the body expression.

```scheme
(lambda (p0 p1 ... pn)
  <expression>)
```

### Condition
Contains three expressions

```scheme
(if <expression>  ; test expression
    <expression>  ; then expression
    <expression>) ; else expression
```

### Block of code
Evaluates all expressions in order.
Returns the value of the last expression

```scheme
(begin <expression 1>
       <expression 2>
       ...
       <expression n>)
```

## Primitive data types

###Symbol

`'symbol`

### Number

`1 3.14 +42.5 -22.5`

### Lambda

```scheme
(lambda () expr)
(lambda (p1 p2 ... pn) expr)
```

### List

```scheme
'()
(list)

'(1 2 3)
(list 1 2 3)
(cons 1 (cons 2 (cons 3 '())))
```

### String

"Hello world!"

## Standard procedures

### Confirm data type:
```scheme
(number?  e)
(symbol?  e)
```

### Comparison:

```scheme
(eq? e1 e2) ; Returns 1 or '()
```

### Lists:

```scheme
(cons e1 e2)
(car e)
(cdr e)
```

### Output:

```scheme
(display e)
(newline)
```

### Math:

```scheme
(+  e1 e2)
(-  e1 e2)
(*  e1 e2)
(/  e1 e2)

(modulo e)
(round  e)
(floor  e)

(=  e1 e2)
(>  e1 e2)
(>= e1 e2)
(<  e1 e2)
(<= e1 e2)
```
