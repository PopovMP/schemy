class Interpreter {
	private isDebug: boolean
	private readonly libs: ILib[]
	public readonly builtinHash: Record<string, boolean> = {}
	private readonly specialForms: Record<string, (expr: any[], env: any[]) => any> = {
		'define'    : this.evalDefine,
		'lambda'    : this.evalLambda,
		'begin'     : this.evalBegin,

		'let'       : this.evalLet,
		'let*'      : this.evalLet,
		'letrec'    : this.evalLet,
		'letrec*'   : this.evalLet,

		'and'       : this.evalAnd,
		'or'        : this.evalOr,
		'if'        : this.evalIf,
		'cond'      : this.evalCond,
		'case'      : this.evalCase,

		'display'   : this.evalDisplay,
		'newline'   : this.evalNewline,
		'print'     : this.evalPrint,

		'quote'     : this.evalQuote,
		'quasiquote': this.evalQuasiquote,

		'parse'     : this.evalParse,
		'eval'      : this.evalEval,
		'debug'     : this.evalDebug,
		'raise'     : this.evalRaise,
	}

	public options: Options

	constructor() {
		this.isDebug = false
		this.libs    = []
		this.options = new Options()

		for (const form of Object.keys(this.specialForms)) {
			this.builtinHash[form] = true
		}
	}

	public evalCodeTree(codeTree: any[], options: Options, callback?: Function): any {
		this.options = options
		this.libs.push(...LibManager.getBuiltinLibs(options.libs, this))

		if (typeof callback === 'function') {
			LibManager.manageImports(codeTree, () =>
				callback( this.evalExprList(codeTree, []) ))
		}
		else {
			return this.evalExprList(codeTree, [])
		}
	}

	public evalExprList(exprLst: any[], env: any[]): any {
		let res: any

		for (const expr of exprLst) {
			res = this.evalExpr(expr, env)
		}

		return res
	}

	public mapExprList(exprLst: any[], env: any[]): any[] {
		const res: any[] = []

		for (const expr of exprLst) {
			res.push(this.evalExpr(expr, env))
		}

		return res
	}

	public evalExpr(expr: any | any[], env: any[]): any {
		// Constants
		switch (expr) {
			case 'true'  : return true
			case 'false' : return false
		}

		// Types
		switch (typeof expr) {
			case 'number'  :
			case 'boolean' :
				return expr
			case 'string' :
				return this.lookup(expr, env)
		}

		if (this.isDebug) {
			this.isDebug = false
			this.dumpExpression(expr)
		}

		const form: any = expr[0]

		if (form === undefined) {
			throw 'Error: Improper function application. Probably: ()'
		}

		// Special form or a builtin proc
		if (typeof form === 'string') {
			if (this.builtinHash[form]) {
				return this.specialForms[form].call(this, expr, env)
			}

			for (const lib of this.libs) {
				if (lib.builtinHash[form]) {
					return lib.libEvalExpr(expr, env)
				}
			}
		}

		// User proc
		return this.evalApplication(expr, env)
	}

	public evalArgs(argTypes: (string | [string, any])[], expr: any[], env: any[]): any[] {
		const optionalCount: number = argTypes.filter(Array.isArray).length
		this.assertArity(expr, argTypes.length, optionalCount)

		return argTypes.map((argType: string | [string, any], index: number) => {
			const isRequired = !Array.isArray(argType)
			const arg: any   = isRequired || index + 1 < expr.length
				? this.evalExpr(expr[index + 1], env)
				: argTypes[index][1]

			this.assertArgType(expr[0], arg, (isRequired ? argType : argType[0]) as string)

			return arg
		})
	}

	public assertType(arg: any, argType: string): boolean {
		switch (argType) {
			case 'any':
				return true
			case 'list':
				return Array.isArray(arg)
			case 'scalar':
				return ['string', 'number'].includes(typeof arg)
			default:
				return typeof arg === argType
		}
	}

	public isTrue(obj: any): boolean {
		return typeof obj !== 'boolean' || obj
	}

	private addToEnv(symbol: string, value: any, modifier: string, env: any[]): void {
		if (typeof value === 'undefined') {
			throw `Error: cannot set unspecified value to symbol: ${symbol}.`
		}

		for (let i = env.length - 1; i > -1; i--) {
			const cellKey = env[i][0]

			if (cellKey === '#scope') {
				break
			}

			if (cellKey === symbol) {
				throw `Error: Identifier already defined: ${symbol}`
			}
		}

		env.push([symbol, value, modifier])
	}

	private lookup(symbol: string, env: any[]): any {
		for (let i = env.length - 1; i > -1; i--) {
			if (symbol === env[i][0]) {
				return env[i][1]
			}
		}

		for (const lib of this.libs) {
			if (lib.builtinHash[symbol]) {
				return symbol
			}
		}

		throw `Error: Unbound identifier: ${symbol}`
	}

	private isDefined(symbol: string, env: any[]): any {
		for (let i = env.length - 1; i > -1; i--) {
			if (symbol === env[i][0]) {
				return true
			}
		}

		for (const lib of this.libs) {
			if (lib.builtinHash[symbol]) {
				return true
			}
		}

		return false
	}

	private clearEnv(tag: string, env: any[]): void {
		let cell: [string, any]
		do {
			cell = env.pop()
		} while (cell[0] !== tag)
	}

	// (proc arg*)
	// ((lambda (par*) expr+) arg*)
	private evalApplication(expr: any[], env: any[]): any {
		const proc: string | any[]    = expr[0]
		const isNamed: boolean        = typeof proc === 'string'
		const procId: string          = isNamed ? proc as string : proc[0]
		const closure: any[] | string = isNamed
			? this.lookup(proc as string, env)
			: this.evalExpr(proc, env)

		if (typeof closure === 'string' && this.isDefined(closure, env)) {
			return this.evalExpr([this.evalExpr(closure, env), ...expr.slice(1)], env)
		}

		if (!Array.isArray(closure) || closure[0] !== 'closure') {
			throw `Error: Improper function application. Given: ${Printer.stringify(closure)}`
		}

		const args: any[] = expr.length === 1
			? []
			: expr.length === 2
				? [this.evalExpr(expr[1], env)]
				: this.mapExprList(expr.slice(1), env)

		const params: any[]      = closure[1]
		const body: any[]        = closure[2]
		const closureEnv: any[]  = closure[3].concat([['#scope', procId], ['#args', args], ['#name', procId]])
		const scopeStart: number = closureEnv.length - 1

		for (let i: number = 0; i < params.length; i++) {
			this.addToEnv(params[i], args[i], 'arg', closureEnv)
		}

		const res: any = this.evalExprList(body, closureEnv)

		if (Array.isArray(res) && res[0] === 'closure') {
			// Doesn't clean the scope to preserve the closure.
			// Remove only the initial scope tag
			closureEnv.splice(scopeStart, 1)
		}
		else {
			this.clearEnv('#scope', closureEnv)
		}

		return res
	}

	// (define symbol expr)      ; Variable definition
	// (define (symbol p*) expr) ; Procedure definition
	private evalDefine(expr: any[], env: any[]): void {
		if ( Array.isArray(expr[1]) ) {
			// Define procedure
			const name: string  = expr[1][0]
			const lambda: any[] = ['lambda', expr[1].slice(1), ...expr.slice(2)]
			const proc: any     = this.evalExpr(lambda, env)
			this.addToEnv(name, proc, 'closure', env)
		}
		else {
			// Define variable
			const name: string = expr[1]
			const value: any   = this.evalExpr(expr[2], env)
			this.addToEnv(name, value, 'define', env)
		}
	}

	// (lambda (par*) expr)
	private evalLambda(expr: any[], env: any[]): any[] {
		if (expr.length < 3) {
			throw 'Error: Improper function. Given: ' + Printer.stringify(expr)
		}

		if (!Array.isArray(expr[1])) {
			throw 'Error: Improper function parameters. Given: ' + Printer.stringify(expr)
		}

		// (closure (par*) body env)
		return ['closure', expr[1], expr.slice(2), env]
	}

	// (begin expr+)
	private evalBegin(expr: any[], env: any[]): any {
		if (expr.length === 1) {
			throw 'Error: Empty begin'
		}

		env.push(['#scope', 'begin'])
		const scopeStart: number = env.length - 1

		const res: any = expr.length === 2
			? this.evalExpr(expr[1], env)
			: this.evalExprList(expr.slice(1), env)

		if (Array.isArray(res) && res[0] === 'closure') {
			env.splice(scopeStart, 1)
		}
		else {
			this.clearEnv('#scope', env)
		}

		return res
	}

	// (let ([name value]+) expr+)
	private evalLet(expr: any[], env: any[]): any[] {
		if (expr.length < 3) {
			throw 'Error: Improper \'let\' syntax. Missing body.'
		}

		if (!Array.isArray(expr[1]) || !Array.isArray(expr[1][0])) {
			throw 'Error: Improper \'let\' bindings. Given: ' + Printer.stringify(expr[1])
		}

		env.push(['#scope', 'let'])
		const scopeStart: number = env.length - 1

		const bindings: any[] = expr[1]
		for (const binding of bindings) {
			const name: string = binding[0]
			const value: any   = this.evalExpr(binding[1], env)
			this.addToEnv(name, value, 'define', env)
		}

		const res: any = expr.length === 3
			? this.evalExpr(expr[2], env)
			: this.evalExprList(expr.slice(2), env)

		if (Array.isArray(res) && res[0] === 'closure') {
			env.splice(scopeStart, 1)
		}
		else {
			this.clearEnv('#scope', env)
		}

		return res
	}

	// (and e1 e2)
	private evalAnd(expr: any[], env: any[]): any {
		if (expr.length !== 3) {
			throw 'Error: \'and\' requires 2 arguments. Given: ' + (expr.length - 1)
		}

		const e1: any = this.evalExpr(expr[1], env)

		return this.isTrue(e1)
			? this.evalExpr(expr[2], env)
			: e1
	}

	// (or e1 e2)
	private evalOr(expr: any[], env: any[]): any {
		if (expr.length !== 3) {
			throw 'Error: \'or\' requires 2 arguments. Given: ' + (expr.length - 1)
		}

		const e1: any = this.evalExpr(expr[1], env)

		return this.isTrue(e1)
			? e1
			: this.evalExpr(expr[2], env)
	}

	// (if test then else)
	// (if test then)
	private evalIf(expr: any[], env: any[]): any {
		const test: any = this.evalExpr(expr[1], env)

		return this.isTrue(test)
			? this.evalExpr(expr[2], env)
			: expr.length === 4
				? this.evalExpr(expr[3], env)
				: undefined
	}

	// (cond
	//     (test expr+)
	//     ...
	//     (else expr+))
	private evalCond(expr: any, env: any[]): any {
		const clauses: any[] = expr.slice(1)
		env.push(['#scope', 'cond'])

		for (const clause of clauses) {
			if (clause[0] === 'else' || this.isTrue( this.evalExpr(clause[0], env) )) {
				const res: any = clause.length === 2
					? this.evalExpr(clause[1], env)
					: this.evalExprList(clause.slice(1), env)
				this.clearEnv('#scope', env)
				return res
			}
		}

		this.clearEnv('#scope', env)

		return undefined
	}

	// (case expr
	//     ((datum+) expr)
	//     ...
	//     (else     expr))
	private evalCase(expr: any, env: any[]): any {
		const key: any       = this.evalExpr(expr[1], env)
		const clauses: any[] = expr.slice(2)

		for (const clause of clauses) {
			const datum: any[] | string = clause[0]
			if (!Array.isArray(datum) && datum !== 'else') {
				throw `Error: 'case' requires datum to be in a list. Given: ${Printer.stringify(datum)}`
			}
			if (clause.length <= 1) {
				throw `Error: 'case' requires a clause with one or more expressions.`
			}

			const isMatch = datum === 'else' ||
				datum.some((e: any | any[]) => e === key || (e[0] === 'string' && e[1] === key))

			if (isMatch) {
				env.push(['#scope', 'case'])
				const res: any = clause.length === 2
					? this.evalExpr(clause[1], env)
					: this.evalExprList(clause.slice(1), env)
				this.clearEnv('#scope', env)
				return res
			}
		}

		return undefined
	}

	// (display expr)
	private evalDisplay(expr: any[], env: any[]): void {
		const [obj] = <[any]>this.evalArgs(['any'], expr, env)

		this.options.printer(Printer.stringify(obj))
	}

	// (newline)
	private evalNewline(expr: any[], env: any[]): void {
		this.evalArgs([], expr, env)

		this.options.printer('\r\n')
	}

	// (quote obj) => obj
	private evalQuote(expr: any[]): any {
		if (expr.length !== 2) {
			throw 'Error: \'quote\' requires 1 argument. Given: ' + (expr.length - 1)
		}

		return expr[1]
	}

	// (quasiquote obj) => obj
	private evalQuasiquote(expr: any[], env: any[]): any {
		if (expr.length !== 2) {
			throw 'Error: \'quasiquote\' requires 1 argument. Given: ' + (expr.length - 1)
		}

		const isUnquote         = (obj: any): boolean => obj === ','
		const isUnquoteSplicing = (obj: any): boolean => obj === '@'

		const datum: any    = expr[1]
		const output: any[] = []

		for (let i: number = 0; i < datum.length; i++) {
			if (i > 0 && isUnquote(datum[i - 1])) {
				output.push(this.evalExpr(datum[i], env))
			}
			else if (i > 0 && isUnquoteSplicing(datum[i - 1])) {
				output.push(...this.evalExpr(datum[i], env))
			}
			else if (!isUnquote(datum[i]) && !isUnquoteSplicing(datum[i])) {
				output.push(datum[i])
			}
		}

		return output
	}

	// (print expr1 expr2 ...)
	private evalPrint(expr: any[], env: any[]): void {
		if (expr.length === 1) {
			this.options.printer('\r\n')
		}
		else if (expr.length === 2) {
			const text: string = Printer.stringify(this.evalExpr(expr[1], env))
			this.options.printer(text + '\r\n')
		}
		else {
			const text: string = this.mapExprList(expr.slice(1), env)
				.map(Printer.stringify)
				.join(' ')
			this.options.printer(text + '\r\n')
		}
	}

	// (debug)
	private evalDebug(_expr: any[], env: any): void {
		this.isDebug = true

		const envDumpList: string[] = []
		for (let i = Math.min(env.length - 1, 20); i > -1; i--) {
			envDumpList.push(`${env[i][0]} = ${Printer.stringify(env[i][1]).substr(0, 500)}`)
		}

		this.options.printer(`Environment:\n${envDumpList.join('\n')}\n`)
	}

	// (raise expr)
	private evalRaise(expr: any[], env: any): void {
		throw this.evalExpr(expr[1], env);
	}

	// (parse src)
	private evalParse(expr: any[], env: any[]): any[] {
		const [scr] = <[string]>this.evalArgs(['string'], expr, env)

		return new Parser().parse(scr)
	}

	// (eval src)
	private evalEval(expr: any[], env: any[]): any[] {
		const [obj] = <[any]>this.evalArgs(['any'], expr, env)

		return this.evalCodeTree(obj, this.options)
	}

	private dumpExpression(expr: any[]): void {
		this.options.printer(`Expression:\n${Printer.stringify(expr)}\n`)
	}

	private assertArity(expr: any[], argsCount: number, optionalCount: number): void {
		const argText = (count: number) => count === 1
			? '1 argument'
			: count + ' arguments'

		if (optionalCount === 0 && expr.length !== argsCount + 1) {
			throw `Error: '${expr[0]}' requires ${argText(argsCount)}. Given: ${argText(expr.length - 1)}`
		}
		else if (optionalCount !== 0 &&
			(expr.length - 1 < argsCount - optionalCount || expr.length - 1 > argsCount)) {
			throw `Error: '${expr[0]}' requires from ${argText(argsCount - optionalCount)} to ${argText(argsCount)}.` +
			` Given: ${argText(expr.length - 1)}`
		}
	}

	private assertArgType(name: string, arg: any, argType: string): void {
		if (!this.assertType(arg, argType)) {
			throw `Error: '${name}' requires ${argType}. Given: ${typeof arg} ${this.argToStr(arg)}`
		}
	}

	private argToStr(arg: any): string {
		const maxLength: number = 25
		const argText: string   = Printer.stringify(arg)
		return argText.length > maxLength
			? argText.substring(0, maxLength) + '...'
			: argText
	}
}
