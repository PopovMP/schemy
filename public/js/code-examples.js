"use strict";

const examplesList = [
    {
        name: "Find the maximum of a list",
        code: `;; Find the maximum of a list recursively

(define (max m n)
    (if (> m n) m n))

(define (list-max lst)
    (define (loop rest acc)
        (if (pair? rest)
            (loop (cdr rest)
                  (max (car rest) acc))
            acc))

    (loop lst (car lst)))

(define lst (list 2 5 1))
(display (list-max lst))
`
    },

    {
        name: "Eliminate consecutive duplicates",
        code: `;; Eliminate consecutive duplicates

(define (list-reverse lst)
    (define (loop rest acc)
        (if (pair? rest)
            (loop (cdr rest)
                  (cons (car rest) acc))
            acc))
    (loop lst (list)))

(define (list-remove-duplicates lst)
    (define (loop rest last acc)
        (if (pair? rest)
            (if (eq? (car rest) last)
                (loop (cdr rest) last acc)
                (loop (cdr rest)
                      (car rest)
                      (cons (car rest) acc)))
            (list-reverse acc)))
    (loop lst
          (car lst)
          (cons (car lst) (list))))

(define lst (list 1 1 2 3 4 5 5 6 7 8 8 8 9 9))

(define (list-print lst)
   (if (pair? lst)
       (begin
           (display (car lst))
           (list-print (cdr lst)))
       (list)))

(list-print (list-remove-duplicates lst))
`
    },
    {
        name: "Hanoi tower",
        code: `;; Hanoi tower

(define (solve n a c b)
    (when (> n 0)

        (solve (- n 1) a b c)
        
        (print "Move disk from" a "to" c)
        
        (solve (- n 1) b c a)))

(solve 4 "A" "C" "B")
`
    },

    {
        name: "Mutual recursive odd or even",
        code: `;; Mutual recursive odd or even

(define (odd-even n)
    (define (is-even n)
         (or (= n 0)
             (is-odd (- n 1))))
    (define (is-odd n)
         (and (!= n 0)
              (is-even (- n 1))))
    (if (is-even n)
        'even
        'odd))

(define (check-numbers n)
    (if (< n 10)
        (begin
            (print n 'is (odd-even n))
            (check-numbers (+ n 1)))))

(check-numbers 0)
`
    },

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
        name: "Schemy interprets Schemy",
        code: `;; Schemy source code in a string

(define src "
    (define lst '(6 7))
    (* (car lst) (cdr lst))
" )

(define ilc (parse src)) ; Parse the source code to intermediate language
(define res (eval  ilc)) ; Eval the intermediate language

(display res)
`
    },

    {
        name: "Lambda Calculus",
        code: `;; Lambda Calculus

;; Boolean logic

(define TRUE  (λ (x) (λ (y) x)))
(define FALSE (λ (x) (λ (y) y)))
(define NOT   (λ (p) ((p FALSE) TRUE) ))
(define AND   (λ (p) (λ (q) ((p q) p) )))
(define OR    (λ (p) (λ (q) ((p p) q) )))
(define IF    (λ (p) (λ (x) (λ (y) ((p x) y) )))) 

;; Alonso Church numbers representation

(define zero  (λ (f) (λ (x) x )))
(define one   (λ (f) (λ (x) (f x) )))
(define two   (λ (f) (λ (x) (f (f x)) )))
(define three (λ (f) (λ (x) (f (f (f x))) )))
(define four  (λ (f) (λ (x) (f (f (f (f x)))) )))
(define five  (λ (f) (λ (x) (f (f (f (f (f x))))) )))
(define six   (λ (f) (λ (x) (f (f (f (f (f (f x)))))) )))
(define seven (λ (f) (λ (x) (f (f (f (f (f (f (f x))))))) )))
(define eight (λ (f) (λ (x) (f (f (f (f (f (f (f (f x)))))))) )))
(define nine  (λ (f) (λ (x) (f (f (f (f (f (f (f (f (f x))))))))) )))
(define ten   (λ (f) (λ (x) (f (f (f (f (f (f (f (f (f (f x)))))))))) )))

;; Algebra 

(define succ  (λ (n) (λ (f) (λ (x) (f ((n f) x)) ))))
(define pred  (λ (n) (λ (f) (λ (x) (((n (λ (g) (λ (h) (h (g f))))) (λ (u) x)) (λ (u) u)) ))))

(define add   (λ (m) (λ (n) ((m succ) n) )))
(define sub   (λ (m) (λ (n) ((n pred) m) )))

(define mult  (λ (m) (λ (n) (λ (f) (m (n f)) ))))
(define power (λ (m) (λ (n) (n m) )))

(define zero? (λ (n) ((n (λ (x) FALSE)) TRUE) ))
(define lte?  (λ (m) (λ (n) (zero? ((sub m) n)) )))

;; Converts a Church number to an integer
(define int  (λ (cn) ((cn (λ (n) (+ n 1))) 0)))

;; Converts a Church boolean to bool
(define bool (λ (cb) ((cb true) false) ))

;; Examples
(print "one =" (int one))
(define forty-two ((add ((mult ten) four)) two))
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
(define fac (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((mult n) (fac (pred n))))))))

(print "factorial 5 =" (int (fac five)))

;; Fibonacci
(define fib (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((add (fib ((sub n) one)))
                                 (fib ((sub n) two))))))))

(print "Fibonacci 9 =" (int (fib nine)))
`
    },
];

if (typeof module === "object") {
    module.exports.codeExamples = examplesList;
}
