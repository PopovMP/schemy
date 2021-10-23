class Interpreter {
	private isDebug: boolean
	private readonly libs: ILib[]
	public readonly builtinHash: Record<string, boolean> = {}
	private readonly specialForms: Record<string, (expr: any[], env: any[]) => any> = {
		'define'    : this.evalDefine,
		'lambda'    : this.evalLambda,
		'begin'     : this.evalBegin,
		'apply'     : this.evalApply,

		'let'       : this.evalLet,
		'let*'      : this.evalLet,
		'letrec'    : this.evalLet,
		'letrec*'   : this.evalLet,

		'and'       : this.evalAnd,
		'or'        : this.evalOr,
		'if'        : this.evalIf,
		'when'      : this.evalWhen,
		'unless'    : this.evalUnless,
		'cond'      : this.evalCond,
		'case'      : this.evalCase,

		'display'   : this.evalDisplay,
		'newline'   : this.evalNewline,
		'format'    : this.evalFormat,

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
	// ((lambda params expr+) arg*)
	private evalApplication(expr: any[], env: any[]): any {
		const proc: string | any[]    = expr[0]
		const isNamed: boolean        = typeof proc === 'string'
		const procId: string          = isNamed ? proc as string : proc[0] === 'lambda' ? 'lambda' : 'expression'
		const closure: any[] | string = isNamed ? this.lookup(proc as string, env) : this.evalExpr(proc, env)

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

		// (closure params body env)
		const params: any        = closure[1]
		const body: any[]        = closure[2]
		const closureEnv: any[]  = closure[3].concat([['#scope', procId], ['#args', args], ['#name', procId]])
		const scopeStart: number = closureEnv.length - 1

		// Parameters binding
		const argsCount: number   = expr.length - 1
		const paramsCount: number = Array.isArray(params) ? params.length : -1

		if (paramsCount >= 0) {
			// Bind args to params

			const dotIndex: number = params.indexOf('.')
			if (dotIndex >= 0) {
				if (dotIndex === 0) {
					throw `Error: Unexpected dot (.) as a first param in ${procId}.`
				}
				else if (dotIndex === params.length) {
					throw `Error: Unexpected dot (.) as a last param in ${procId}.`
				}
				else if (dotIndex > argsCount) {
					throw `Error: Wrong count of arguments of proc ${procId}. Required min ${dotIndex} but given: ${argsCount}`
				}
			}
			else if (argsCount !== paramsCount) {
				throw `Error: Wrong count of arguments of proc ${procId}. Required ${paramsCount} but given: ${argsCount}`
			}

			for (let i: number = 0; i < params.length; i++) {
				if (params[i] === '.') {
					this.addToEnv(params[i + 1], args.slice(i), 'arg', closureEnv)
					break
				}
				else  {
					this.addToEnv(params[i], args[i], 'arg', closureEnv)
				}
			}
		}
		else {
			// Catch all ars
			if (argsCount === 0) {
				throw `Error: No arguments given to proc ${procId}.`
			}

			// Bind all arguments to the parameter
			this.addToEnv(params, args, 'arg', closureEnv)
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

	// (define name expr)        ; Variable definition
	// (define (name p*) expr+)  ; Procedure definition
	// (define (name . p) expr+) ; Procedure definition - catch all args
	private evalDefine(expr: any[], env: any[]): void {
		if ( Array.isArray(expr[1]) ) {
			// Define procedure
			const name: string  = expr[1][0]
			const params: any   = expr[1][1] === '.' ? expr[1][2] : expr[1].slice(1)
			const body: any[]   = expr.slice(2)
			const lambda: any[] = ['lambda', params, ...body]
			const closure: any  = this.evalExpr(lambda, env)
			this.addToEnv(name, closure, 'closure', env)
		}
		else {
			// Define variable
			const name: string = expr[1]
			const value: any   = this.evalExpr(expr[2], env)
			this.addToEnv(name, value, 'define', env)
		}
	}

	// (lambda (p*)   expr+)
	// (lambda params expr+) ; Catch all args
	private evalLambda(expr: any[], env: any[]): any[] {
		if (expr.length < 3) {
			throw 'Error: Improper lambda. Given: ' + Printer.stringify(expr)
		}

		// (closure params body env)
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

	// (apply symbol (list arg*) | expr)
	private evalApply(expr: any[], env: any[]): any {
		const procId: string  = expr[1]

		const callArgs: any[] = Array.isArray(expr[2]) && expr[2][0] === 'list'
			? expr[2].slice(1)
			: this.evalExpr(expr[2], env)

		for (let i: number = 0; i < callArgs.length; i++) {
			const arg: any = callArgs[i]
			if (typeof arg === 'string' && !['true', 'false'].includes(arg)) {
				callArgs[i] = ['string', arg]
			}
			else if (arg === true) {
				callArgs[i] = 'true'
			}
			else if (arg === false) {
				callArgs[i] = 'false'
			}
			else if (arg === null) {
				callArgs[i] = "'()"
			}
		}

		return this.evalExpr([procId, ...callArgs], env)
	}

	// (let ([name value]+) expr+)
	private evalLet(expr: any[], env: any[]): any[] {
		if (expr.length < 3) {
			throw 'Error: Improper \'let\' syntax. Missing body.'
		}

		if (typeof expr[1] === 'string' && Array.isArray(expr[2])) {
			return this.evalNamedLet(expr, env)
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

	// (let name ([var value]+) expr+)
	private evalNamedLet(expr: any[], env: any[]): any[] {
		if (expr.length < 4) {
			throw 'Error: Improper named \'let\' syntax. Missing body.'
		}

		env.push(['#scope', 'let'])
		const scopeStart: number = env.length - 1

		const bindings: any[] = expr[2]
		const args: string[] = []
		for (const binding of bindings) {
			const name: string = binding[0]
			const value: any   = this.evalExpr(binding[1], env)
			this.addToEnv(name, value, 'let', env)
			args.push(name)
		}

		const body: any[]   = expr.slice(3)
		const lambda: any[] = ['lambda', args, ...body]
		const closure: any  = this.evalExpr(lambda, env)
		this.addToEnv(expr[1], closure, 'closure', env)

		const res: any = expr.length === 4
			? this.evalExpr(expr[3], env)
			: this.evalExprList(expr.slice(3), env)

		if (Array.isArray(res) && res[0] === 'closure') {
			env.splice(scopeStart, 1)
		}
		else {
			this.clearEnv('#scope', env)
		}

		return res
	}

	// (and)            => true
	// (and expr)       => expr
	// (and expr expr*) => the first faulty or the last one
	private evalAnd(expr: any[], env: any[]): any {
		switch (expr.length) {
			case 1:return true
			case 2:return this.evalExpr(expr[1], env)
			case 3:return this.evalExpr(expr[1], env) && this.evalExpr(expr[2], env)
		}

		return this.evalExpr(expr[1], env) && this.evalAnd(expr.slice(1), env)
	}

	// (or)            => false
	// (or expr)       => expr
	// (or expr expr*) => the first truthy or the last one
	private evalOr(expr: any[], env: any[]): any {
		switch (expr.length) {
			case 1:return false
			case 2:return this.evalExpr(expr[1], env)
			case 3:return this.evalExpr(expr[1], env) || this.evalExpr(expr[2], env)
		}

		return this.evalExpr(expr[1], env) || this.evalOr(expr.slice(1), env)
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

	// (unless test-expr
	//         expr+)
	private evalUnless(expr: any[], env: any[]): void {
		if (expr.length === 1) {
			throw 'Error: Empty \'unless\''
		}

		if (expr.length === 2) {
			throw 'Error: Empty \'unless\' body'
		}

		if ( this.isTrue(this.evalExpr(expr[1], env)) ) {
			return
		}

		env.push(['#scope', 'unless'])

		if (expr.length === 3) {
			this.evalExpr(expr[2], env)
		}
		else {
			this.evalExprList(expr.slice(2), env)
		}

		this.clearEnv('#scope', env)
	}

	// (when test-expr
	//       expr+)
	private evalWhen(expr: any[], env: any[]): void {
		if (expr.length === 1) {
			throw 'Error: Empty \'when\''
		}

		if (expr.length === 2) {
			throw 'Error: Empty \'when\' body'
		}

		if ( !this.isTrue(this.evalExpr(expr[1], env)) ) {
			return
		}

		env.push(['#scope', 'when'])

		if (expr.length === 3) {
			this.evalExpr(expr[2], env)
		}
		else {
			this.evalExprList(expr.slice(2), env)
		}

		this.clearEnv('#scope', env)
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

	// (format pattern args...)
	// (format #t pattern args...)
	private evalFormat(expr: any[], env: any[]): string | undefined {
		const form: any[]      = this.mapExprList(expr.slice(1), env)
		const isPrint: boolean = typeof form[0] === 'boolean' && form[0]
		const pattern: string  = typeof form[0] === 'string' ? form[0] : form[1]
		const args: string[]   = form.slice(typeof form[0] === 'string' ? 1 : 2)
										.map((arg: any) => Printer.stringify(arg))

		let index = 0

		function replacer(_match: string): string {
			return args[index++]
		}

		const res: string = pattern.replace(/~./g, replacer)

		if (isPrint) {
			this.options.printer(res)
		}

		return isPrint ? undefined : res
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
