"use strict";

const examplesList = [
    {
        name: "Find the maximum of a list",
        code: `;; Find the maximum of a list recursively

(define max
  (lambda (m n)
      (if (> m n) m n)))

(define list-max
  (lambda (lst)
     (begin
       (define loop
         (lambda (rest acc)
            (if (pair? rest)
                (loop (cdr rest)
                      (max (car rest) acc))
                acc)))

       (loop lst (car lst)))))

(define lst (list 2 5 1))
(display (list-max lst))
`
    },

    {
        name: "Eliminate consecutive duplicates",
        code: `;; Eliminate consecutive duplicates

(define list-reverse
  (lambda (lst)
     (begin
       (define loop
         (lambda (rest acc)
            (if (pair? rest)
                (loop (cdr rest)
                      (cons (car rest) acc))
                acc)))
       (loop lst (list)))))

(define list-remove-duplicates
  (lambda (lst)
     (begin
       (define loop
         (lambda (rest last acc)
            (if (pair? rest)
                (if (eq? (car rest) last)
                    (loop (cdr rest) last acc)
                    (loop (cdr rest)
                          (car rest)
                          (cons (car rest) acc)))
                (list-reverse acc))))
       (loop lst
             (car lst)
             (cons (car lst) (list))))))

(define lst (list 1 1 2 3 4 5 5 6 7 8 8 8 9 9))

(define list-print
  (lambda (lst)
     (if (pair? lst)
         (begin
           (display (car lst))
           (list-print (cdr lst)))
         (list))))

(list-print (list-remove-duplicates lst))
`
    },
    {
        name: "Hanoi tower",
        code: `;; Hanoi tower

(const move (from to)
    (print "Move disk from" from "to" to) )

(const solve (n from to through)
    (when (> n 0)
          (solve (- n 1) from through to)
          (move from to)
          (solve (- n 1) through to from) ))

(solve 4 "A" "C" "B")
`
    },

    {
        name: "Mutual recursive default parameters",
        code: `;; Mutual recursive default parameters

(const odd-even (n
               (is-even (λ (n)
                   (or (= n 0)
                       (is-odd (- n 1)))))
               (is-odd (λ (n)
                   (and (!= n 0)
                        (is-even (- n 1))))))
    (if (is-even n)
        'even
        'odd))

(for n (list-range 10)
    (print n 'is (odd-even n)))
`
    },

    {
        name: "Closure adder",
        code: `;; Closure adder

(const add ((m 0))
    (λ ((n null))
       (if (equal n null)
           m
           (add (+ n m)))))

(print '((add))           "=>" ((add))           )
(print '((add 3))         "=>" ((add 3))         )
(print '(((add 3) 4))     "=>" (((add 3) 4))     )
(print '((((add 3) 4) 5)) "=>" ((((add 3) 4) 5)) )
`
    },

    {
        name: "Closure counter",
        code: `;; Closure counter

(const make-counter ((initial-value 0) (delta 1))
    (let value (- initial-value delta))
    (λ () (inc value delta)) )

(const count (make-counter))
(print (count) (count) (count) (count))

(const count10  (make-counter 0 10))
(print (count10) (count10) (count10) (count10))

(const counter (make-counter 4 -1))
(while (counter) (print "***"))
`   },

    {
        name: "Y combinator - factorial",
        code: `;; Y combinator - factorial

(((λ (f)
     (λ (n)
        ((f f) n) ))
  (λ (f)
     (λ (n)
        (if (= n 0)
            1
            (* n ((f f) (- n 1))) )))) 5)
`   },

    {
        name: "EASL interprets EASL",
        code: `;; EASL source code in a string
(const src "
    (const lst '(1 2 3 4 5 6 7))
    (const len (list-length lst))
    (* 6 len)
" )

(const ilc (parse src)) ; Parse the source code to intermediate language
(const res (eval  ilc)) ; Eval the intermediate language

(print "The answer is:" res)
`
    },

    {
        name: "OOP - List based",
        code: `;; OOP - List based

(enum .fname .lname .age)

(const person.new (fname lname age)
     (list fname lname age) )

(const person.clone (person)
    (list-slice person) )

(const person.grow (person)
    (list-set person .age (+ (list-get person .age) 1)))

(const person.say (person)
    (print (list-join person " ")))

(const john (person.new "John" "Doe" 33))
(person.say  john)
(person.grow john)
(person.say  john)
`
    },

    {
        name: "OOP - Message based",
        code: `;; Demonstration of a message based OOP implemented with closure.

;; Person's attributes
(enum .first-name .last-name .clone)

;; Person factory
(const make-person (first-name last-name)
    (lambda ((action -1) (value ""))
        (cond
            ((= action .first-name) 
                  (if value
                      (make-person value  last-name)
                      first-name))
            ((= action .last-name)
                  (if value
                      (make-person first-name value)
                      last-name ))
            ((= action .clone)
                  (make-person first-name last-name))
            (else (~ "I am " first-name " " last-name "!")))))

;; Create a person: John Smith
(const john-smith (make-person "John" "Smith"))

;; Get properties
(print (john-smith))
(print "My first name is:" (john-smith .first-name))
(print "My last  name is:" (john-smith .last-name ))

;; When set a property, the factory returns a new object
(const john-doe (john-smith .last-name "Doe"))
(print (john-doe))

;; clone an object
(const john-doe-clone (john-doe .clone))

;; Change the first name of the clone
(const jane-doe (john-doe-clone .first-name "Jane"))
(print (jane-doe))
`   },

    {
        name: "OOP - Lambda Calculus style",
        code: `;; OOP - Lambda Calculus style

(const Person (name initial-age)
   (let age initial-age)
   (const grow (λ ()
                  (inc age)))
   (λ (f)
      (f name age grow)))

(const name (name age grow) name)
(const age  (name age grow) age)
(const grow (name age grow) (grow))
(const who  (name age grow) (print name age))

(const john (Person "John" 33))
(john grow)

(const Singer (person)
    (const sing (λ (song)
                   (print "🎵" song)))
    (λ (f)
       (f person sing)))

(const person (person sing) person)
(const sing   (person sing) sing)

(const johnSinger (Singer john))
((johnSinger person) who)
((johnSinger sing) "Tra la la")
`
    },

    {
        name: "Unit testing with 'assert-lib'",
        code: `;; Unit tests

(import "https://easl.forexsb.com/easl/assert.easl")

(assert.equal (+ 2 3) 5 "Sum two numbers")

(assert.true '(1 2 3) "A non empty list is true.")

(assert.equal (if true  4 5) 4
              "When the condition is true, 'if' returns the first expression")
(assert.equal (if false 4 5) 5
              "When the condition is false, 'if' returns the second expression")

(assert.equal (if true  4 (print "I'M NOT PRINTED")) 4
              "When the condition is true, 'if' evaluates only the first expression")
(assert.equal (if false (print "I'M NOT PRINTED") 5) 5
              "When the condition is false, 'if' evaluates only the second expression")

;; The function is closed in 'lambda' to prevent pollution of the global scope
((lambda ()
	(const sum (a b) (+ a b))
    (assert.equal (sum 2 3) 5 "Call a function with two args.") ))

(assert.equal 13 42 "The answer to Life, the Universe, and Everything!")
`
    },

    {
        name: "Lambda Calculus",
        code: `;; Lambda Calculus

;; Lambda Calculus

;; Boolean logic

(const TRUE  (λ (x) (λ (y) x)))
(const FALSE (λ (x) (λ (y) y)))
(const NOT   (λ (p) ((p FALSE) TRUE) ))
(const AND   (λ (p) (λ (q) ((p q) p) )))
(const OR    (λ (p) (λ (q) ((p p) q) )))
(const IF    (λ (p) (λ (x) (λ (y) ((p x) y) )))) 

;; Alonso Church numbers representation

(const zero  (λ (f) (λ (x) x )))
(const one   (λ (f) (λ (x) (f x) )))
(const two   (λ (f) (λ (x) (f (f x)) )))
(const three (λ (f) (λ (x) (f (f (f x))) )))
(const four  (λ (f) (λ (x) (f (f (f (f x)))) )))
(const five  (λ (f) (λ (x) (f (f (f (f (f x))))) )))
(const six   (λ (f) (λ (x) (f (f (f (f (f (f x)))))) )))
(const seven (λ (f) (λ (x) (f (f (f (f (f (f (f x))))))) )))
(const eight (λ (f) (λ (x) (f (f (f (f (f (f (f (f x)))))))) )))
(const nine  (λ (f) (λ (x) (f (f (f (f (f (f (f (f (f x))))))))) )))
(const ten   (λ (f) (λ (x) (f (f (f (f (f (f (f (f (f (f x)))))))))) )))

;; Algebra 

(const succ     (λ (n) (λ (f) (λ (x) (f ((n f) x)) ))))
(const pred     (λ (n) (λ (f) (λ (x) (((n (λ (g) (λ (h) (h (g f))))) (λ (u) x)) (λ (u) u)) ))))

(const add      (λ (m) (λ (n) ((m succ) n) )))
(const sub      (λ (m) (λ (n) ((n pred) m) )))

(const mult     (λ (m) (λ (n) (λ (f) (m (n f)) ))))
(const power    (λ (m) (λ (n) (n m) )))

(const zero?    (λ (n) ((n (λ (x) FALSE)) TRUE) ))
(const lte?     (λ (m) (λ (n) (zero? ((sub m) n)) )))

;; Converts a Church number to an integer
(const int  (λ (cn) ((cn (λ (n) (+ n 1))) 0)))

;; Converts a Church boolean to bool
(const bool (λ (cb) ((cb true) false) ))

;; Examples
(print "one =" (int one))
(const forty-two ((add ((mult ten) four)) two))
(print "forty-one   =" (int (pred forty-two)))
(print "forty-two   =" (int forty-two))
(print "forty-three =" (int (succ forty-two)))
(print "zero? 0"  (bool (zero? zero)))
(print "zero? 1"  (bool (zero?  one)))
(print "lte? 3 4" (bool ((lte? three)  four)))
(print "lte? 4 3" (bool ((lte?  four) three)))

;; Boolean logic
(print)
(print "(not  true) =>" (bool (NOT  TRUE)))
(print "(not false) =>" (bool (NOT FALSE)))
(print)
(print "((true  one) two) =>" (int ((TRUE  one) two)))
(print "((false one) two) =>" (int ((FALSE one) two)))
(print)
(print "((and  true)  true) =>" (bool ((AND  TRUE)  TRUE)))
(print "((and false)  true) =>" (bool ((AND FALSE)  TRUE)))
(print "((and  true) false) =>" (bool ((AND  TRUE) FALSE)))
(print "((and false) false) =>" (bool ((AND FALSE) FALSE)))
(print)
(print "((or  true)   true) =>" (bool ((OR  TRUE)  TRUE)))
(print "((or false)   true) =>" (bool ((OR FALSE)  TRUE)))
(print "((or  true)  false) =>" (bool ((OR  TRUE) FALSE)))
(print "((or false)  false) =>" (bool ((OR FALSE) FALSE)))
(print)
(print "(((if  true) one) two) =>" (int (((IF  TRUE) one) two)))
(print "(((if false) one) two) =>" (int (((IF FALSE) one) two)))
(print)

;; Factorial
(const fac (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((mult n) (fac (pred n))))))))

(print "factorial 5 =" (int (fac five)))

;; Fibonacci
(const fib (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((add (fib ((sub n) one)))
                                 (fib ((sub n) two))))))))

(print "Fibonacci 9 =" (int (fib nine)))

`
    },

    {
        name: "BrainFuck Interpreter",
        code: `;; BrainFuck Interpreter

(const code-text  "

   Adds two digits from the input
   ,>++++++[<-------->-],[<+>-]<.
 
")

(const input-text "34")

(const code-list '())
(for ch (string-split code-text)
   (when (list-has (list "+" "-" ">" "<" "," "." "[" "]") ch)
       (list-push code-list ch)))

(let code-index  0)
(const code-len (list-length code-list))

(let input-index 0)
(const input-list (string-split input-text))

(const buffer '(0))
(let pointer  0)
(let command "")
(let output  "")
(let steps    0)

(while (< code-index code-len)
    ;; Read the current command.
    (set command (list-get code-list code-index))
    (inc code-index)
    (inc steps)
 
    (case command
        ;; Increment the pointer.
        ((">") (inc pointer)
             (when (= (list-length buffer) pointer)
                 (list-push buffer 0) ))

        ;; Decrement the pointer.
        (("<") (if (> pointer 0)
                   (dec pointer)
                   (print "Error: pointer < 0")))

        ;; Increment the byte at the pointer.
        (("+") (list-set buffer pointer
                     (+ (list-get buffer pointer) 1) ))

        ;; Decrement the byte at the pointer.
        (("-") (list-set buffer pointer
                     (- (list-get buffer pointer) 1) ))

        ;; Output the byte at the pointer.
        ((".") (set output (~ output
                            (string-from-char-code (list-get buffer pointer))) ))

        ;; Input a byte and store it in the byte at the pointer.
        ((",") (const input (list-get input-list input-index))
             (inc input-index)
             (list-set buffer pointer
                     (if (equal (type-of input) "string")
                         (string-char-code-at input 0)
                         0 )))

        ;; Jump forward past the matching ] if the byte at the pointer is zero.
        ("[" (when (= (list-get buffer pointer) 0)
                   (let depth 1)
                   (while (> depth 0)
                          (set command (list-get code-list code-index))
                          (inc code-index)
                          (case command
                              ("[" (inc depth))
                              ("]" (dec depth)) ))))

        ;; Jump backward to the matching [ unless the byte at the pointer is zero.
        ("]" (when (not (= (list-get buffer pointer) 0))
                   (let depth 1)
                   (dec code-index 2)
                   (while (> depth 0)
                          (set command (list-get code-list code-index))
                          (dec code-index)
                          (case command
                              ("]" (inc depth))
                              ("[" (dec depth)) ))
                   (inc code-index) )) ))

(print "Buffer: " (list-join buffer ""))
(print "Pointer:"  pointer)
(print "Steps:  "  steps)
(print ".....................")
(print "Input:  " (list-join input-list ""))
(print "Output: "  output)
`
    },


];

if (typeof module === "object") {
    module.exports.codeExamples = examplesList;
}
