"use strict";

const examplesList = [
    {
        name: "Find the maximum of a list",
        code: `;; Find the maximum of a list recursively

(define (list-max lst)
    (letrec
        ([max  (lambda (m n)
    	           (if (> m n) m n))]
         [loop (lambda (rest acc)
                   (if (pair? rest)
                       (loop (cdr rest)
                             (max (car rest) acc))
                       acc))])

    	(loop lst (car lst))))

(display (list-max (list 2 5 8 1)))
`
    },

    {
        name: "Eliminate consecutive duplicates",
        code: `;; Eliminate consecutive duplicates

(define (eliminate-duplicates lst)
    (letrec
        ([loop (lambda (rest acc)
                   (if (pair? rest)
                       (loop (cdr rest)
                             (if (eq? (car rest) (car acc))
                                 acc
                                 (cons (car rest) acc)))
                       (reverse acc)))])
        (loop lst
            (list (car lst)))))

(define lst (list 1 1 2 3 4 5 5 6 7 8 8 8 9 9))
(format #t "~S\\n" (eliminate-duplicates lst))
`
    },

    {
        name: "Quick Sort algorithm",
        code: `;; Quick Sort

(define (quick-sort arr)
    (if (pair? arr)
		(letrec
	        ([loop (lambda (pivot arr left right)
                (if (pair? arr)
                    (loop pivot
                          (cdr arr)
                          (if (<= (car arr) pivot)
                              (cons (car arr) left)
                              left)
                          (if (> (car arr) pivot)
                              (cons (car arr) right)
                              right))
                    (append (quick-sort left)
                            (cons pivot (quick-sort right)))))])
            (loop (car arr) (cdr arr) (list) (list)))
        arr))

(display (quick-sort (list 7 3 5 8 2 1 9 6 4 0)))
`
    },
	{
		name: "100 Doors",
		code: `;; 100 Doors
;; http://www.rosettacode.org/wiki/100_doors

(define (toggle nth doors)
    (define (loop n rest acc)
        (if (pair? rest)
            (if (= n nth)
                (loop 1
                      (cdr rest)
                      (cons (if (eq? (car rest) 1) 0 1) acc))
                (loop (+ n 1)
                      (cdr rest)
                      (cons (car rest) acc)))
            (reverse acc)))
    (loop 1 doors (list)))

(define (run doors)
    (define (loop n acc)
        (if (<= n (length doors))
            (loop (+ n 1)
                  (toggle n acc))
            acc))
    (loop 1 doors))

(define lst (make-list 100 0))
(format #t "~S\\n" (run lst))
`
	},

    {
        name: "Fizz Buzz",
        code: `;; Fizz Buzz
;; http://www.rosettacode.org/wiki/FizzBuzz

; Solution

(define (fizz-buzz n)
    (show (list-ref (list n "Fizz" "Buzz" "FizzBuzz")
                    (+ (if (zero? (modulo n 3)) 1 0)
                       (if (zero? (modulo n 5)) 2 0)))))

; Helpers

(define (show x)
    (if (number? x)
        (cond
            [(< x  10) (display "  ") (display x) (display " ")]
            [(< x 100) (display  " ") (display x) (display " ")]
            [#t                       (display x) (display " ")])
        (begin
            (display x)
            (if (eq? x "FizzBuzz")
                (newline)
                (display " ")))))

(define (loop n max)
    (when (<= n max)
          (fizz-buzz n)
          (loop (+ n 1) max)))

(loop  1 120)
`
    },

	{
		name: "Hanoi tower",
		code: `;; Hanoi tower

(define (solve n a c b)
    (when (> n 0)

        (solve (- n 1) a b c)
        
        (format #t "Move disk from ~S to ~S\\n" a c)
        
        (solve (- n 1) b c a)))

(solve 4 "A" "C" "B")
`
	},

    {
        name: "Mutual recursive odd or even",
        code: `;; Mutual recursive odd or even

(define (odds-evens n)
    (letrec
        ([is-even (lambda (n)
                      (or (= n 0)
                          (is-odd (- n 1))))]
    
         [is-odd (lambda (n)
                     (and (> n 0)
                          (is-even (- n 1))))]
    
         [loop (lambda (n odds evens)
                   (if (< n 0)
                       (cons odds (cons evens '()))
                       (if (is-even n)
                           (loop (- n 1) odds (cons n evens))
                           (loop (- n 1) (cons n odds) evens))))])
    
        (loop n '() '())))

(define res (odds-evens 29))
(format #t "Odds : ~A\\n" (car  res))
(format #t "Evens: ~A\\n" (cadr res))
`
    },

	{
		name: "Diamond Kata",
		code: `;; Diamond Kata
; ___A___
; __B_B__
; _C___C_
; D_____D
; _C___C_
; __B_B__
; ___A___

; Generic functions

(define (display-list lst)
    (define (loop rest)
        (when (pair? rest)
              (display (car rest))
              (newline)
              (loop (cdr rest))))
    (loop lst))

; Diamond functions

(define (make-line half-line)
    (append half-line
            (cdr (reverse half-line))))

(define (make-half-line lst n)
    (define (loop i rest acc)
        (if (pair? rest)
           (if (= i n)
               (loop (+ i 1)
                     (cdr rest)
                     (cons (car rest) acc))
               (loop (+ i 1)
                     (cdr rest)
                     (cons "_" acc)))
            acc))
    (loop 0 lst '()))

(define (make-diamond lines)
    (append (reverse lines)
            (cdr lines)))

(define (make-half-diamond lst)
    (define (loop i rest acc)
        (if (pair? rest)
            (loop (+ i 1)
                  (cdr rest)
                  (cons (make-line (make-half-line lst i))
                        acc))
            acc))
    (loop 0 lst '()))

; Run

(display-list
    (make-diamond
        (make-half-diamond
            (list "A" "B" "C" "D"))))
`
	},

    {
        name: "Y Combinator - Factorial",
        code: `;; Y Combinator - Factorial

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
        name: "Y Combinator - Fibonacci",
        code: `;; Y Combinator - Fibonacci

(define (fibo n)
    (((((λ (f)
           (λ (n)
              (λ (prev)
                 (λ (curr)
                    ((((f f) n) prev) curr)))))
        (λ (f)
           (λ (n)
              (λ (prev)
                 (λ (curr)
                    (if (= n 0)
                        curr
                        ((((f f) (- n 1)) curr) (+ prev curr))))))))
       n) 0) 1))

((((λ (f)
      (λ (n)
         (λ (i)
            (((f f) n) i))))
   (λ (f)
      (λ (n)
         (λ (i)
            (begin
                (format #t "Fibonacci ~S => ~S\\n" i (fibo i))
                (if (< i n)
                    (((f f) n) (+ i 1))))))))
  10) 1)
`
    },

    {
        name: "Schemy interprets Schemy",
        code: `;; Schemy source code in a string

(define src "
    (define lst '(6 7))
    (* (car lst) (cadr lst))
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

(define Zero? (λ (n) ((n (λ (x) FALSE)) TRUE) ))
(define lte?  (λ (m) (λ (n) (Zero? ((sub m) n)) )))

;; Converts a Church number to an integer
(define int  (λ (cn) ((cn (λ (n) (+ n 1))) 0)))

;; Converts a Church boolean to bool
(define bool (λ (cb) ((cb #t) #f) ))

;; Examples
(format #t "one = ~S\\n" (int one))
(define forty-two ((add ((mult ten) four)) two))
(format #t "forty-one   = ~S\\n" (int (pred forty-two)))
(format #t "forty-two   = ~S\\n" (int forty-two))
(format #t "forty-three = ~S\\n" (int (succ forty-two)))
(format #t "Zero? 0 ~S\\n"  (bool (Zero? zero)))
(format #t "Zero? 1 ~S\\n"  (bool (Zero?  one)))
(format #t "lte? 3 4 ~S\\n" (bool ((lte? three)  four)))
(format #t "lte? 4 3 ~S\\n" (bool ((lte?  four) three)))

;; Boolean logic
(newline)
(format #t "(not  true) => ~S\\n" (bool (NOT  TRUE)))
(format #t "(not false) => ~S\\n" (bool (NOT FALSE)))
(newline)
(format #t "((true  one) two) => ~S\\n" (int ((TRUE  one) two)))
(format #t "((false one) two) => ~S\\n" (int ((FALSE one) two)))
(newline)
(format #t "((and  true)  true) => ~S\\n" (bool ((AND  TRUE)  TRUE)))
(format #t "((and false)  true) => ~S\\n" (bool ((AND FALSE)  TRUE)))
(format #t "((and  true) false) => ~S\\n" (bool ((AND  TRUE) FALSE)))
(format #t "((and false) false) => ~S\\n" (bool ((AND FALSE) FALSE)))
(newline)
(format #t "((or  true)   true) => ~S\\n" (bool ((OR  TRUE)  TRUE)))
(format #t "((or false)   true) => ~S\\n" (bool ((OR FALSE)  TRUE)))
(format #t "((or  true)  false) => ~S\\n" (bool ((OR  TRUE) FALSE)))
(format #t "((or false)  false) => ~S\\n" (bool ((OR FALSE) FALSE)))
(newline)
(format #t "(((if  true) one) two) => ~S\\n" (int (((IF  TRUE) one) two)))
(format #t "(((if false) one) two) => ~S\\n" (int (((IF FALSE) one) two)))
(newline)

;; Factorial
(define fac (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((mult n) (fac (pred n))))))))

(format #t "factorial 5 = ~S\\n" (int (fac five)))

;; Fibonacci
(define fib (λ (n) ((((IF ((lte? n) one))
                     (λ () one))
                     (λ () ((add (fib ((sub n) one)))
                                 (fib ((sub n) two))))))))

(format #t "Fibonacci 9 = ~S\\n" (int (fib nine)))
`
    },

	{
		name: "The Lisp defined in McCarthy's 1960 paper",
		code: `;; The Lisp defined in McCarthy's 1960 paper, translated into Scheme.
;; Assumes forms: define, cond, quote
;; Assumes procs: atom?, number?, boolean?, eq?, cons, car, cdr

(define (caar. a)
  (car (car a)))

(define (cadr. a)
  (car (cdr a)))

(define (cdar. a)
  (cdr (car a)))

(define (cddr. a)
  (cdr (cdr a)))

(define (cadar. a)
  (cadr. (car a)))

(define (caddr. a)
  (cadr. (cdr a)))

(define (caddar. a)
  (caddr. (car a)))

(define (eval. e a)
  (cond
    [(atom? e)
       (cond
         [(eq? e 'nil) '()]
         [(eq? e 't  )  #t]
         [(number?  e)   e]
         [(boolean? e)   e]
         [#t  (assoc. e a)])]

    [(atom? (car e))
       (cond
         [(eq? (car e) 'quote) (cadr. e)]
         [(eq? (car e) 'cond ) (cond. (cdr e) a)]

         [(eq? (car e) 'atom ) (atom? (eval. (cadr. e) a))]
         [(eq? (car e) 'eq   ) (eq?   (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'cons ) (cons  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'car  ) (car   (eval. (cadr. e) a))]
         [(eq? (car e) 'cdr  ) (cdr   (eval. (cadr. e) a))]

         [(eq? (car e) 'add  ) (+  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'subt ) (-  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'mult ) (*  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'dev  ) (/  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'gt   ) (>  (eval. (cadr. e) a) (eval. (caddr. e) a))]
         [(eq? (car e) 'lt   ) (<  (eval. (cadr. e) a) (eval. (caddr. e) a))]

         ; Application
         [#t (eval. (cons (assoc. (car e) a) ; (label name (lambda...))
                          (cdr e))           ; (args...)
                     a)])]

    [(eq? (caar. e) 'label ) 
     (eval. (cons (caddar. e)         ; (lambda (params...) body)
                  (cdr e))            ; (args...)
            (cons (cons (cadar. e)    ; name
                        (cons (car e) ; (label name (lambda...))
                              '()))
                  a))]

    [(eq? (caar. e) 'lambda)         ; ((lambda (params...) body) args...)
     (eval. (caddar. e)              ; body
            (append.                 ; make environment
              (pair. (cadar. e)      ; (params...)
                     (evlis. (cdr e) ; (args...)
                              a))
              a))]
              
    [#t (raise (format "Unrecognised syntax: ~S" (car e)))]))

(define (cond. c a)
  (cond [(eval. (caar.  c) a)
         (eval. (cadar. c) a)]
        [#t (cond. (cdr c) a)]))

(define (append. u v)
  (cond [(eq? u '()) v]
        [#t (cons (car u)
                  (append. (cdr u) v))]))

(define (assoc. e a)
  (cond [(eq? a '()) '()]
        [(eq? e (caar. a)) (cadar. a)]
        [#t (assoc. e (cdr a))]))

(define (pair. u v)
  (cond [(eq? u '()) '()]
        [#t (cons (cons (car u)
                        (cons (car v) '()))
                  (pair. (cdr u) (cdr v)))]))

(define (evlis. u a)
  (cond [(eq? u '()) '()]
        [#t (cons (eval.  (car u) a)
                  (evlis. (cdr u) a))]))

(eval.
 '((label loop
     (lambda (n acc)
       (cond
         [(eq n 0) acc]
         [t (loop (subt n 1)
                  (cons
                    ((label fibo
                       (lambda (n)
                         (cond [(eq n 0) 1]
                               [(eq n 1) 1]
                               [t (add (fibo (subt n 1))
                                       (fibo (subt n 2)))])))
                     n)
                    acc))])))
   10 nil)
 '())`
	},

];

if (typeof module === "object") {
    module.exports.codeExamples = examplesList;
}
