class CoreLib implements ILib {
	private readonly inter: Interpreter
	private readonly methods: Record<string, (expr: any[], env: any[]) => any> = {
		// Types
		'atom?'   : this.isAtom,
		'boolean?': this.isBoolean,
		'number?' : this.isNumber,
		'string?' : this.isString,
		'null?'   : this.isNull,
		'pair?'   : this.isPair,
		'list?'   : this.isList,

		// Primitive numerical procedures
		'+': this.add,
		'-': this.subtract,
		'*': this.multiply,
		'/': this.divide,
		'modulo' : this.modulo,
		'zero?'  : this.isZero,

		// Numerical comparison
		'=' : this.numEqual,
		'!=': this.numNotEqual,
		'>' : this.numGreater,
		'>=': this.numGreaterOrEqual,
		'<' : this.numLower,
		'<=': this.numLowerOrEqual,

		// General comparison
		'eq?'   : this.isEq,
		'equal?': this.isEqual,

		'not': this.not,
	}

	public readonly builtinFunc: string[]
	public readonly builtinHash: Record<string, boolean> = {}

	constructor(interpreter: Interpreter) {
		this.inter = interpreter

		this.builtinFunc = Object.keys(this.methods)

		for (const func of this.builtinFunc)
			this.builtinHash[func] = true
	}

	public libEvalExpr(expr: any[], env: any[]): any {
		return this.methods[expr[0]].call(this, expr, env)
	}

	// (atom? expr)
	private isAtom(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return !Array.isArray(obj) || obj.length === 0
	}

	// (boolean? expr)
	private isBoolean(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return typeof obj === 'boolean'
	}

	// (number? expr)
	private isNumber(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return typeof obj === 'number'
	}

	// (string? expr)
	private isString(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return typeof obj === 'string'
	}

	// (null? expr)
	private isNull(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return Array.isArray(obj) && obj.length === 0
	}

	// (pair? expr)
	private isPair(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return Array.isArray(obj) && obj.length > 0
	}

	// (list? expr)
	private isList(expr: any[], env: any[]): boolean {
		const [obj] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return Array.isArray(obj)
	}

	// (+ num1 num2 ...)
	private add(expr: any[], env: any[]): number {
		if (expr.length === 1)
			return 0

		if (expr.length === 2) {
			const [num]: [number] = <[number]>this.inter.evalArgs(['number'], expr, env)

			return num
		}

		if (expr.length === 3) {
			const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

			return num1 + num2
		}

		let sum: number = 0
		for (let i: number = 1; i < expr.length; ++i) {
			const num = this.inter.evalExpr(expr[i], env)
			if (typeof num !== 'number')
				throw `Error: '+' requires a number. Given: ${num}`
			sum += num
		}

		return sum
	}

	// (- num1 num2)
	private subtract(expr: any[], env: any[]): number {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 - num2
	}

	// (* num1 num2 ...)
	private multiply(expr: any[], env: any[]): number {
		if (expr.length === 1)
			return 1

		if (expr.length === 2) {
			const [num]: [number] = <[number]>this.inter.evalArgs(['number'], expr, env)

			return num
		}

		if (expr.length === 3) {
			const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

			return num1 * num2
		}

		let res: number = 1
		for (let i: number = 1; i < expr.length; ++i) {
			const num = this.inter.evalExpr(expr[i], env)

			if (typeof num !== 'number')
				throw `Error: '*' requires a number. Given: ${num}`

			res *= num
		}

		return res
	}

	// (/ num1 num2)
	private divide(expr: any[], env: any[]): number {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		if (num2 === 0)
			throw 'Error: \'/\' division by zero.'

		return num1 / num2
	}

	// (modulo num1 num2)
	private modulo(expr: any[], env: any[]): number {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 % num2
	}

	// (zero? num)
	private isZero(expr: any[], env: any[]): boolean {
		const [num]: [number] = <[number]>this.inter.evalArgs(['number'], expr, env)

		return num === 0
	}

	// (= num1 num2)
	private numEqual(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 === num2
	}

	// (> num1 num2)
	private numGreater(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 > num2
	}

	// (< num1 num2)
	private numLower(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 < num2
	}

	// (!= num1 num2)
	private numNotEqual(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 !== num2
	}

	// (>= num1 num2)
	private numGreaterOrEqual(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 >= num2
	}

	// (<= num1 num2)
	private numLowerOrEqual(expr: any[], env: any[]): boolean {
		const [num1, num2]: [number, number] = <[number, number]>this.inter.evalArgs(['number', 'number'], expr, env)

		return num1 <= num2
	}

	// (eq? expr1 expr2)
	private isEq(expr: any[], env: any[]): boolean {
		const [obj1, obj2]: [any, any] = <[any, any]>this.inter.evalArgs(['any', 'any'], expr, env)

		return obj1 === obj2 ||
			(Array.isArray(obj1) && obj1.length === 0 && Array.isArray(obj2) && obj2.length === 0)
	}

	// (equal? expr1 expr2)
	private isEqual(expr: any[], env: any[]): boolean {
		const [obj1, obj2]: [any, any] = <[any, any]>this.inter.evalArgs(['any', 'any'], expr, env)

		return Array.isArray(obj1) || Array.isArray(obj2)
			? Printer.stringify(obj1) === Printer.stringify(obj2)
			: obj1 === obj2
	}

	// (not expr)
	private not(expr: any[], env: any[]): boolean {
		const [obj]: [any] = <[any]>this.inter.evalArgs(['any'], expr, env)

		return !this.inter.isTrue(obj)
	}
}
