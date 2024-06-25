"use strict";
class Env {
    static add(symbol, value, modifier, env) {
        if (value === undefined)
            throw `Error: Cannot set unspecified value to identifier: ${symbol}.`;
        for (let i = env.length - 1; i > -1; i--) {
            const cellKey = env[i][0];
            if (cellKey === '#scope')
                break;
            if (cellKey === symbol)
                throw `Error: Identifier already defined: ${symbol}`;
        }
        env.push([symbol, value, modifier]);
    }
    static set(symbol, value, modifier, env) {
        if (value === undefined)
            throw `Error: Cannot set unspecified value to identifier: ${symbol}.`;
        for (let i = env.length - 1; i > -1; --i) {
            if (env[i][0] === symbol) {
                env[i][1] = value;
                env[i][2] = modifier;
                return;
            }
        }
        throw `Error: Identifier is not defined: ${symbol}`;
    }
    static lookup(symbol, env, libs) {
        for (let i = env.length - 1; i > -1; i--) {
            if (symbol === env[i][0]) {
                const val = env[i][1];
                if (val === null)
                    throw `Error: Unspecified value of identifier: ${symbol}`;
                return val;
            }
        }
        for (const lib of libs)
            if (lib.builtinHash[symbol])
                return symbol;
        throw `Error: Unbound identifier: ${symbol}`;
    }
    static has(symbol, env, libs) {
        for (let i = env.length - 1; i > -1; i--)
            if (symbol === env[i][0])
                return true;
        for (const lib of libs)
            if (lib.builtinHash[symbol])
                return true;
        return false;
    }
    static clear(tag, env) {
        let cell;
        do
            cell = env.pop();
        while (cell[0] !== tag);
    }
}
class Interpreter {
    isDebug;
    libs;
    specialForms = {
        'and': this.evalAnd,
        'apply': this.evalApply,
        'begin': this.evalBegin,
        'case': this.evalCase,
        'cond': this.evalCond,
        'debug': this.evalDebug,
        'define': this.evalDefine,
        'define-values': this.evalDefineValues,
        'display': this.evalDisplay,
        'do': this.evalDo,
        'eval': this.evalEval,
        'format': this.evalFormat,
        'if': this.evalIf,
        'lambda': this.evalLambda,
        'let': this.evalLet,
        'let*': this.evalLet,
        'let*-values': this.evalLet,
        'let-values': this.evalLet,
        'letrec': this.evalLet,
        'letrec*': this.evalLet,
        'newline': this.evalNewline,
        'or': this.evalOr,
        'parse': this.evalParse,
        'quasiquote': this.evalQuasiquote,
        'quote': this.evalQuote,
        'raise': this.evalRaise,
        'set!': this.evalSet,
        'unless': this.evalUnless,
        'values': this.evalValues,
        'when': this.evalWhen,
    };
    builtinHash = {};
    options;
    constructor() {
        this.isDebug = false;
        this.libs = [];
        this.options = new Options();
        for (const form of Object.keys(this.specialForms))
            this.builtinHash[form] = true;
    }
    evalCodeTree(codeTree, options, callback) {
        this.options = options;
        this.libs.push(...LibManager.getBuiltinLibs(options.libs, this));
        if (typeof callback === 'function')
            LibManager.manageImports(codeTree, () => callback(this.evalExprList(codeTree, [])));
        else
            return this.evalExprList(codeTree, []);
    }
    evalExprList(exprLst, env) {
        let res;
        for (const expr of exprLst)
            res = this.evalExpr(expr, env);
        return res;
    }
    mapExprList(exprLst, env) {
        const res = [];
        for (const expr of exprLst)
            res.push(this.evalExpr(expr, env));
        return res;
    }
    evalExpr(expr, env) {
        switch (typeof expr) {
            case 'number':
            case 'boolean':
            case 'undefined':
                return expr;
            case 'string':
                return Env.lookup(expr, env, this.libs);
        }
        if (this.isDebug) {
            this.isDebug = false;
            this.dumpExpression(expr);
        }
        const form = expr[0];
        if (form === undefined)
            throw 'Error: Improper function application. Probably: ()';
        if (typeof form === 'string') {
            if (this.builtinHash[form])
                return this.specialForms[form].call(this, expr, env);
            for (let i = 0; i < this.libs.length; ++i)
                if (this.libs[i].builtinHash[form])
                    return this.libs[i].libEvalExpr(expr, env);
        }
        return this.evalApplication(expr, env);
    }
    evalArgs(argTypes, expr, env) {
        const optionalCount = argTypes.filter(Array.isArray).length;
        this.assertArity(expr, argTypes.length, optionalCount);
        return argTypes.map((argType, index) => {
            const isRequired = !Array.isArray(argType);
            const arg = isRequired || index + 1 < expr.length
                ? this.evalExpr(expr[index + 1], env)
                : argTypes[index][1];
            this.assertArgType(expr[0], arg, (isRequired ? argType : argType[0]));
            return arg;
        });
    }
    assertType(arg, argType) {
        switch (argType) {
            case 'any':
                return true;
            case 'list':
                return Array.isArray(arg);
            case 'scalar':
                return ['string', 'number'].includes(typeof arg);
            default:
                return typeof arg === argType;
        }
    }
    isTrue(obj) {
        return typeof obj !== 'boolean' || obj;
    }
    evalCallArgs(expr, env) {
        const args = Array.isArray(expr) && expr[0] === 'list'
            ? expr.slice(1)
            : this.evalExpr(expr, env);
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (typeof arg === 'string')
                args[i] = ['string', arg];
        }
        return args;
    }
    evalApplication(expr, env) {
        const proc = expr[0];
        const isNamed = typeof proc === 'string';
        const procId = isNamed ? proc : proc[0] === 'lambda' ? 'lambda' : 'expression';
        const closure = isNamed ? Env.lookup(proc, env, this.libs) : this.evalExpr(proc, env);
        if (typeof closure === 'string' && Env.has(closure, env, this.libs))
            return this.evalExpr([this.evalExpr(closure, env), ...expr.slice(1)], env);
        if (!Array.isArray(closure) || closure[0] !== 'closure')
            throw `Error: Improper function application. Given: ${Printer.stringify(closure)}`;
        const args = expr.length === 1
            ? []
            : expr.length === 2
                ? Array.isArray(expr[1]) && expr[1][0] === 'values'
                    ? this.evalExpr(expr[1], env).slice(1)
                    : [this.evalExpr(expr[1], env)]
                : this.mapExprList(expr.slice(1), env);
        const params = closure[1];
        const body = closure[2];
        const closureEnv = closure[3].concat([['#scope', procId], ['#args', args], ['#name', procId]]);
        const scopeStart = closureEnv.length - 1;
        const argsCount = args.length;
        const paramsCount = Array.isArray(params) ? params.length : -1;
        if (paramsCount >= 0) {
            const dotIndex = params.indexOf('.');
            if (dotIndex >= 0) {
                if (dotIndex === 0)
                    throw `Error: Unexpected dot (.) as a first param in ${procId}.`;
                else if (dotIndex === params.length)
                    throw `Error: Unexpected dot (.) as a last param in ${procId}.`;
                else if (dotIndex > argsCount)
                    throw `Error: Wrong count of arguments of proc ${procId}. Required min ${dotIndex} but given: ${argsCount}`;
            }
            else if (argsCount !== paramsCount) {
                throw `Error: Wrong count of arguments of proc ${procId}. Required ${paramsCount} but given: ${argsCount}`;
            }
            for (let i = 0; i < params.length; i++) {
                if (params[i] === '.') {
                    Env.add(params[i + 1], args.slice(i), 'arg', closureEnv);
                    break;
                }
                else {
                    Env.add(params[i], args[i], 'arg', closureEnv);
                }
            }
        }
        else {
            if (argsCount === 0)
                throw `Error: No arguments given to proc ${procId}.`;
            Env.add(params, args, 'arg', closureEnv);
        }
        const res = this.evalExprList(body, closureEnv);
        if (Array.isArray(res) && res[0] === 'closure') {
            closureEnv.splice(scopeStart, 1);
        }
        else {
            Env.clear('#scope', closureEnv);
        }
        return res;
    }
    evalDefine(expr, env) {
        if (Array.isArray(expr[1])) {
            const name = expr[1][0];
            const params = expr[1][1] === '.' ? expr[1][2] : expr[1].slice(1);
            const body = expr.slice(2);
            const lambda = ['lambda', params, ...body];
            const closure = this.evalExpr(lambda, env);
            Env.add(name, closure, 'closure', env);
        }
        else {
            const name = expr[1];
            const value = this.evalExpr(expr[2], env);
            Env.add(name, value, 'define', env);
        }
    }
    evalDefineValues(expr, env) {
        const values = this.evalExpr(expr[2], env);
        if (values[0] !== 'values')
            throw `Error: Multiple values required in 'define-values'`;
        if (values.length - 1 !== expr[1].length)
            throw `Error: Values count does not match. Required: ${expr[1].length}, got: ${values.length - 1}`;
        for (let i = 0; i < expr[1].length; ++i)
            Env.add(expr[1][i], values[i + 1], 'define-values', env);
    }
    evalSet(expr, env) {
        const name = expr[1];
        const value = this.evalExpr(expr[2], env);
        Env.set(name, value, 'set!', env);
    }
    evalLambda(expr, env) {
        if (expr.length < 3)
            throw `Error: Improper lambda. Given: ${Printer.stringify(expr)}`;
        return ['closure', expr[1], expr.slice(2), env];
    }
    evalBegin(expr, env) {
        if (expr.length === 1)
            throw 'Error: Empty begin';
        env.push(['#scope', 'begin']);
        const scopeStart = env.length - 1;
        const res = expr.length === 2
            ? this.evalExpr(expr[1], env)
            : this.evalExprList(expr.slice(1), env);
        if (Array.isArray(res) && res[0] === 'closure')
            env.splice(scopeStart, 1);
        else
            Env.clear('#scope', env);
        return res;
    }
    evalApply(expr, env) {
        const proc = expr[1];
        const args = this.evalCallArgs(expr[2], env);
        return this.evalExpr([proc, ...args], env);
    }
    evalLet(expr, env) {
        const proc = expr[0];
        if (expr.length < 3)
            throw `Error: Improper '${proc}' syntax. Missing body.`;
        if (proc === 'let' && typeof expr[1] === 'string' && Array.isArray(expr[2]))
            return this.evalNamedLet(expr, env);
        if (!Array.isArray(expr[1]))
            throw `Error: Improper '${proc}' bindings. Given: ${Printer.stringify(expr[1])}`;
        env.push(['#scope', proc]);
        const scopeStart = env.length - 1;
        if (proc === 'let-values')
            this.bindLetValues(expr[1], env);
        else if (proc === 'let*-values')
            this.bindLetStarValues(expr[1], env);
        else
            this.bindLetVariables(proc, expr[1], env);
        const res = expr.length === 3
            ? this.evalExpr(expr[2], env)
            : this.evalExprList(expr.slice(2), env);
        if (Array.isArray(res) && res[0] === 'closure')
            env.splice(scopeStart, 1);
        else
            Env.clear('#scope', env);
        return res;
    }
    evalNamedLet(expr, env) {
        if (expr.length < 4)
            throw "Error: Improper named 'let' syntax. Missing body.";
        const name = expr[1];
        const vars = expr[2].map((binding) => binding[0]);
        const values = expr[2].map((binding) => binding[1]);
        const body = expr.slice(3);
        const begin = ['begin',
            ['define', name, ['lambda', [...vars], ...body]],
            [name, ...values]];
        return this.evalBegin(begin, env);
    }
    bindLetVariables(form, bindings, env) {
        switch (form) {
            case 'let': {
                const values = bindings.map((binding) => this.evalExpr(binding[1], env));
                for (let i = 0; i < bindings.length; ++i)
                    Env.add(bindings[i][0], values[i], form, env);
                break;
            }
            case 'let*': {
                for (let i = 0; i < bindings.length; ++i)
                    Env.add(bindings[i][0], this.evalExpr(bindings[i][1], env), form, env);
                break;
            }
            case 'letrec': {
                for (let i = 0; i < bindings.length; ++i)
                    Env.add(bindings[i][0], null, form, env);
                const values = bindings.map((binding) => this.evalExpr(binding[1], env));
                for (let i = 0; i < bindings.length; ++i)
                    Env.set(bindings[i][0], values[i], form, env);
                break;
            }
            case 'letrec*': {
                for (let i = 0; i < bindings.length; ++i)
                    Env.add(bindings[i][0], null, form, env);
                for (let i = 0; i < bindings.length; ++i)
                    Env.set(bindings[i][0], this.evalExpr(bindings[i][1], env), form, env);
                break;
            }
        }
    }
    bindLetValues(bindings, env) {
        for (let i = 0; i < bindings.length; ++i) {
            const bindLine = bindings[i];
            const formals = bindLine[0];
            const values = this.evalExpr(bindLine[1], env);
            if (values[0] !== 'values')
                throw `Error: Multiple values required in 'let-values'`;
            if (values.length - 1 !== formals.length)
                throw `Error: Values count does not match. Required: ${formals.length}, got: ${values.length - 1}`;
            for (let i = 0; i < formals.length; ++i)
                Env.add(formals[i], values[i + 1], 'let-values', env);
        }
    }
    bindLetStarValues(bindings, env) {
        for (let i = 0; i < bindings.length; ++i) {
            const bindLine = bindings[i];
            const formals = bindLine[0];
            const values = this.evalExpr(bindLine[1], env);
            if (values[0] !== 'values')
                throw `Error: Multiple values required in 'let*-values'`;
            if (values.length - 1 !== formals.length)
                throw `Error: Values count does not match. Required: ${formals.length}, got: ${values.length - 1}`;
            for (let i = 0; i < formals.length; ++i)
                Env.add(formals[i], values[i + 1], 'let*-values', env);
        }
    }
    evalDo(expr, env) {
        env.push(['#scope', 'do']);
        const bindings = expr[1];
        const inits = bindings.map((binding) => this.evalExpr(binding[1], env));
        for (let i = 0; i < bindings.length; ++i)
            Env.add(bindings[i][0], inits[i], 'init', env);
        while (!this.isTrue(this.evalExpr(expr[2][0], env))) {
            if (expr.length === 4)
                this.evalExpr(expr[3], env);
            else if (expr.length > 4)
                this.evalExprList(expr.slice(3), env);
            const stepValues = [];
            for (const binding of bindings) {
                if (binding.length === 3)
                    stepValues.push(this.evalExpr(binding[2], env));
            }
            for (const binding of bindings) {
                if (binding.length === 3)
                    Env.set(binding[0], stepValues.shift(), 'step', env);
            }
        }
        const res = expr[2].length === 2
            ? this.evalExpr(expr[2][1], env)
            : this.evalExprList(expr[2].slice(1), env);
        Env.clear('#scope', env);
        return res;
    }
    evalAnd(expr, env) {
        if (expr.length === 1)
            return true;
        const val = this.evalExpr(expr[1], env);
        switch (expr.length) {
            case 2:
                return val;
            case 3:
                return this.isTrue(val) ? this.evalExpr(expr[2], env) : val;
            default:
                return this.isTrue(val) ? this.evalAnd(expr.slice(1), env) : val;
        }
    }
    evalOr(expr, env) {
        if (expr.length === 1)
            return false;
        const val = this.evalExpr(expr[1], env);
        switch (expr.length) {
            case 2:
                return val;
            case 3:
                return this.isTrue(val) ? val : this.evalExpr(expr[2], env);
            default:
                return this.isTrue(val) ? val : this.evalOr(expr.slice(1), env);
        }
    }
    evalIf(expr, env) {
        return this.isTrue(this.evalExpr(expr[1], env))
            ? this.evalExpr(expr[2], env)
            : this.evalExpr(expr[3], env);
    }
    evalUnless(expr, env) {
        if (expr.length === 1)
            throw "Error: Empty 'unless'";
        if (expr.length === 2)
            throw "Error: Empty 'unless' body";
        if (this.isTrue(this.evalExpr(expr[1], env)))
            return;
        env.push(['#scope', 'unless']);
        if (expr.length === 3)
            this.evalExpr(expr[2], env);
        else
            this.evalExprList(expr.slice(2), env);
        Env.clear('#scope', env);
    }
    evalValues(expr, env) {
        return ['values', ...this.mapExprList(expr.slice(1), env)];
    }
    evalWhen(expr, env) {
        if (expr.length === 1)
            throw "Error: Empty 'when'";
        if (expr.length === 2)
            throw "Error: Empty 'when' body";
        if (!this.isTrue(this.evalExpr(expr[1], env)))
            return;
        env.push(['#scope', 'when']);
        if (expr.length === 3)
            this.evalExpr(expr[2], env);
        else
            this.evalExprList(expr.slice(2), env);
        Env.clear('#scope', env);
    }
    evalCond(expr, env) {
        const clauses = expr.slice(1);
        env.push(['#scope', 'cond']);
        for (const clause of clauses) {
            if (clause[0] === 'else' || this.isTrue(this.evalExpr(clause[0], env))) {
                const res = clause.length === 2
                    ? this.evalExpr(clause[1], env)
                    : this.evalExprList(clause.slice(1), env);
                Env.clear('#scope', env);
                return res;
            }
        }
        Env.clear('#scope', env);
    }
    evalCase(expr, env) {
        const key = this.evalExpr(expr[1], env);
        const clauses = expr.slice(2);
        for (const clause of clauses) {
            const datum = clause[0];
            if (!Array.isArray(datum) && datum !== 'else')
                throw `Error: 'case' requires datum to be in a list. Given: ${Printer.stringify(datum)}`;
            if (clause.length <= 1)
                throw `Error: 'case' requires a clause with one or more expressions.`;
            const isMatch = datum === 'else' ||
                datum.some((e) => e === key || (e[0] === 'string' && e[1] === key));
            if (!isMatch)
                continue;
            env.push(['#scope', 'case']);
            const res = clause.length === 2
                ? this.evalExpr(clause[1], env)
                : this.evalExprList(clause.slice(1), env);
            Env.clear('#scope', env);
            return res;
        }
    }
    evalDisplay(expr, env) {
        const [obj] = this.evalArgs(['any'], expr, env);
        this.options.printer(Printer.stringify(obj));
    }
    evalNewline(expr, env) {
        this.evalArgs([], expr, env);
        this.options.printer('\r\n');
    }
    evalQuote(expr) {
        if (expr.length !== 2)
            throw 'Error: \'quote\' requires 1 argument. Given: ' + (expr.length - 1);
        return expr[1];
    }
    evalQuasiquote(expr, env) {
        if (expr.length !== 2)
            throw `Error: 'quasiquote' requires 1 argument. Given: ${expr.length - 1}`;
        const isUnquote = (obj) => obj === ',';
        const isUnquoteSplicing = (obj) => obj === '@';
        const datum = expr[1];
        const output = [];
        for (let i = 0; i < datum.length; i++) {
            if (i > 0 && isUnquote(datum[i - 1]))
                output.push(this.evalExpr(datum[i], env));
            else if (i > 0 && isUnquoteSplicing(datum[i - 1]))
                output.push(...this.evalExpr(datum[i], env));
            else if (!isUnquote(datum[i]) && !isUnquoteSplicing(datum[i]))
                output.push(datum[i]);
        }
        return output;
    }
    evalFormat(expr, env) {
        const form = this.mapExprList(expr.slice(1), env);
        const isPrint = typeof form[0] === 'boolean' && form[0];
        const pattern = typeof form[0] === 'string' ? form[0] : form[1];
        const args = form.slice(typeof form[0] === 'string' ? 1 : 2).map(Printer.stringify);
        let index = 0;
        const text = pattern.replace(/~./g, (_) => args[index++]);
        if (!isPrint)
            return text;
        this.options.printer(text);
    }
    evalDebug(_expr, env) {
        this.isDebug = true;
        const maxLen = 500;
        const envDumpList = [];
        for (let i = Math.min(env.length - 1, 20); i > -1; i--) {
            const envText = Printer.stringify(env[i][1]);
            const textLine = envText.length > maxLen ? envText.slice(0, maxLen) + '...' : envText;
            envDumpList.push(`${env[i][0]} = ${textLine}`);
        }
        this.options.printer(`Environment:\n${envDumpList.join('\n')}\n`);
    }
    evalRaise(expr, env) {
        throw this.evalExpr(expr[1], env);
    }
    evalParse(expr, env) {
        const [scr] = this.evalArgs(['string'], expr, env);
        return new Parser().parse(scr);
    }
    evalEval(expr, env) {
        const [obj] = this.evalArgs(['any'], expr, env);
        return this.evalCodeTree(obj, this.options);
    }
    dumpExpression(expr) {
        this.options.printer(`Expression:\n${Printer.stringify(expr)}\n`);
    }
    assertArity(expr, argsCount, optionalCount) {
        const argText = (count) => count === 1 ? '1 argument' : count + ' arguments';
        if (optionalCount === 0 && expr.length !== argsCount + 1)
            throw `Error: '${expr[0]}' requires ${argText(argsCount)}. Given: ${argText(expr.length - 1)}`;
        if (optionalCount !== 0 &&
            (expr.length - 1 < argsCount - optionalCount || expr.length - 1 > argsCount)) {
            throw `Error: '${expr[0]}' requires from ${argText(argsCount - optionalCount)} to ${argText(argsCount)}.` +
                ` Given: ${argText(expr.length - 1)}`;
        }
    }
    assertArgType(name, arg, argType) {
        if (!this.assertType(arg, argType))
            throw `Error: '${name}' requires ${argType}. Given: ${typeof arg} ${this.argToStr(arg)}`;
    }
    argToStr(arg) {
        const maxLength = 25;
        const argText = Printer.stringify(arg);
        return argText.length > maxLength
            ? argText.substring(0, maxLength) + '...'
            : argText;
    }
}
const XMLHttpRequestLib = (typeof XMLHttpRequest === 'function')
    ? XMLHttpRequest
    : require('xmlhttprequest').XMLHttpRequest;
const localStorageLib = (typeof localStorage === 'object' && localStorage !== null)
    ? localStorage
    : new (require('node-localstorage').LocalStorage)('./schemy-local-storage');
class IoService {
    static get(url, callback) {
        const xmlHttp = new XMLHttpRequestLib();
        xmlHttp.onreadystatechange = readyStateChange;
        xmlHttp.onerror = error;
        xmlHttp.open('GET', url, true);
        xmlHttp.send();
        function readyStateChange() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
                callback(xmlHttp.responseText);
        }
        function error(e) {
            throw `Error: GET: ${url}, ${e.message}`;
        }
    }
    static setItemToLocalStorage(key, item) {
        try {
            if (typeof item === 'string')
                localStorageLib.setItem(key, item);
            else
                localStorageLib.setItem(key, JSON.stringify(item));
        }
        catch (e) {
            throw `Error: Set item to local storage: ${key}, ${e.message}`;
        }
    }
    static getItemFromLocalStorage(key) {
        try {
            const value = localStorageLib.getItem(key);
            return value && JSON.parse(value);
        }
        catch (e) {
            throw 'Error: Get item to local storage: ' + key + ', ' + e.message;
        }
    }
}
class LibManager {
    static getBuiltinLibs(libList, inter) {
        return libList.map(lib => LibManager.createLib(lib, inter));
    }
    static createLib(libName, inter) {
        switch (libName) {
            case 'core-lib':
                return new CoreLib(inter);
            case 'ext-lib':
                return new ExtLib(inter);
            case 'list-lib':
                return new ListLib(inter);
            case 'string-lib':
                return new StringLib(inter);
            default:
                throw `Error: Unknown lib: ${libName}`;
        }
    }
    static manageImports(codeTree, callback) {
        const code = [];
        let currentCodeIndex = 0;
        searchImports(currentCodeIndex);
        function searchImports(index) {
            for (let i = index; i < codeTree.length; i++) {
                const expr = codeTree[i];
                if (Array.isArray(expr) && expr[0] === 'import') {
                    currentCodeIndex = i;
                    const libUrl = expr[1][1];
                    LibManager.importLibrary(libUrl, libManager_import_ready);
                    return;
                }
                else {
                    code.push(expr);
                }
            }
            callback(code);
        }
        function libManager_import_ready(libCodeTree) {
            code.push(...libCodeTree);
            searchImports(currentCodeIndex + 1);
        }
    }
    static importLibrary(libUrl, callback) {
        if (typeof libUrl !== 'string' || libUrl.length === 0)
            throw 'Error: Empty library name';
        const storedLib = IoService.getItemFromLocalStorage(libUrl);
        if (Array.isArray(storedLib) && storedLib.length > 0) {
            callback(storedLib);
            return;
        }
        const libName = libUrl.substring(libUrl.lastIndexOf('/') + 1);
        IoService.get(libUrl, ioService_get_ready);
        function ioService_get_ready(libText) {
            if (typeof libUrl !== 'string' || libUrl.length === 0)
                throw 'Error: Cannot load library content: ' + libName;
            const parser = new Parser();
            const libCode = parser.parse(libText);
            IoService.setItemToLocalStorage(libUrl, libCode);
            callback(libCode);
        }
    }
}
class Options {
    printer;
    libs;
    extContext;
    extFunctions;
    constructor() {
        this.printer = console.log;
        this.libs = ['core-lib', 'ext-lib', 'list-lib', 'string-lib'];
        this.extContext = this;
        this.extFunctions = {};
    }
    static parse(options) {
        const evalOptions = new Options();
        if (typeof options.printer === 'function')
            evalOptions.printer = options.printer;
        if (Array.isArray(options.libs))
            evalOptions.libs = options.libs.slice();
        if (options.extContext)
            evalOptions.extContext = options.extContext;
        if (options.extFunctions)
            evalOptions.extFunctions = options.extFunctions;
        return evalOptions;
    }
}
class Parser {
    isOpenParen = (ch) => ['(', '[', '{'].includes(ch);
    isCloseParen = (ch) => [')', ']', '}'].includes(ch);
    isDelimiter = (ch) => ['(', ')', '[', ']', '{', '}', '\'', '`', ','].includes(ch);
    isWhiteSpace = (ch) => [' ', '\t', '\r', '\n'].includes(ch);
    isLineComment = (ch) => ch === ';';
    isTextNumber = (tx) => /^[-+]?\d+(?:\.\d+)*$/.test(tx);
    parse(codeText) {
        const fixedText = codeText
            .replace(/λ/g, 'lambda')
            .replace(/'\([ \t\r\n]*\)/g, '\'()')
            .replace(/\(string[ \t\r\n]*\)/g, '""')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '""');
        const abbrevList = [['\'', 'quote'], ['`', 'quasiquote']];
        const codeList = this.tokenize(fixedText);
        this.checkMatchingParens(codeList);
        const abbrevResolved = this.expandAbbreviations(codeList, abbrevList);
        const ilTree = this.nest(abbrevResolved);
        return ilTree;
    }
    expandAbbreviations(codeList, abbrevList) {
        if (abbrevList.length === 0)
            return codeList;
        const abbrev = abbrevList[0];
        const expandedSymbols = this.expandSymbolAbbreviation(codeList, abbrev[0], abbrev[1]);
        const expandedLists = this.expandListAbbreviation(expandedSymbols, abbrev[0], abbrev[1]);
        return this.expandAbbreviations(expandedLists, abbrevList.slice(1));
    }
    tokenize(code) {
        const isInFile = (i) => i < code.length;
        const isInLine = (i) => code[i] !== '\n' && code[i] !== undefined;
        const isOpenRangeComment = (i) => code[i] + code[i + 1] === '#|';
        const isCloseRangeComment = (i) => code[i - 1] + code[i] === '|#';
        const isStringChar = (ch) => ch === '"';
        const output = [];
        const pushLexeme = (lexeme) => {
            if (lexeme === '')
                return;
            const value = this.isTextNumber(lexeme) ? Number(lexeme)
                : lexeme === '#t' ? true
                    : lexeme === '#f' ? false
                        : lexeme;
            output.push(value);
        };
        for (let i = 0, lexeme = ''; i < code.length; i++) {
            const ch = code[i];
            if (isStringChar(ch)) {
                const chars = [];
                for (i++; isInFile(i); i++) {
                    if (isStringChar(code[i])) {
                        if (isStringChar(code[i + 1])) {
                            chars.push('"');
                            i++;
                            continue;
                        }
                        break;
                    }
                    chars.push(code[i]);
                }
                output.push('(', 'string', chars.join(''), ')');
                continue;
            }
            if (this.isLineComment(ch)) {
                do {
                    i++;
                } while (isInFile(i) && isInLine(i));
                continue;
            }
            if (isOpenRangeComment(i)) {
                do {
                    i++;
                } while (!isCloseRangeComment(i));
                continue;
            }
            if (this.isWhiteSpace(ch)) {
                pushLexeme(lexeme);
                lexeme = '';
                continue;
            }
            if (this.isDelimiter(ch)) {
                pushLexeme(lexeme);
                lexeme = '';
                output.push(ch);
                continue;
            }
            lexeme += ch;
            if (i === code.length - 1) {
                pushLexeme(lexeme);
                lexeme = '';
            }
        }
        return output;
    }
    expandSymbolAbbreviation(input, abbrevChar, fullForm) {
        const output = [];
        for (let i = 0; i < input.length; i++) {
            const curr = input[i];
            const next = input[i + 1];
            if (curr === abbrevChar && !this.isOpenParen(next) && next !== abbrevChar) {
                output.push('(', fullForm, next, ')');
                i++;
            }
            else {
                output.push(curr);
            }
        }
        return output;
    }
    expandListAbbreviation(input, abbrevChar, fullForm) {
        const output = [];
        for (let i = 0, paren = 0, flag = false; i < input.length; i++) {
            const curr = input[i];
            const next = input[i + 1];
            if (!flag && curr === abbrevChar && this.isOpenParen(next)) {
                output.push('(', fullForm);
                flag = true;
                continue;
            }
            output.push(curr);
            if (flag && this.isOpenParen(curr))
                paren++;
            if (flag && this.isCloseParen(curr))
                paren--;
            if (flag && paren === 0) {
                output.push(')');
                flag = false;
            }
        }
        return output.length > input.length
            ? this.expandListAbbreviation(output, abbrevChar, fullForm)
            : output;
    }
    nest(input) {
        let i = -1;
        function pass(list) {
            if (++i === input.length)
                return list;
            const curr = input[i];
            const prev = input[i - 1];
            if (['{', '[', '('].includes(curr) && prev !== 'string')
                return list.concat([pass([])]).concat(pass([]));
            if ([')', ']', '}'].includes(curr)) {
                if (prev === 'string' && input[i - 2] !== '(' || prev !== 'string')
                    return list;
            }
            return pass(list.concat(curr));
        }
        return pass([]);
    }
    checkMatchingParens(codeList) {
        let curly = 0;
        let square = 0;
        let round = 0;
        for (let i = 0; i < codeList.length; i++) {
            if (codeList[i - 1] === '(' && codeList[i] === 'string')
                i += 2;
            switch (codeList[i]) {
                case '(':
                    round++;
                    break;
                case '[':
                    square++;
                    break;
                case '{':
                    curly++;
                    break;
                case ')':
                    round--;
                    break;
                case ']':
                    square--;
                    break;
                case '}':
                    curly--;
                    break;
            }
        }
        if (curly !== 0)
            throw 'Unmatching curly braces!';
        if (square !== 0)
            throw 'Unmatching square braces!';
        if (round !== 0)
            throw 'Unmatching round braces!';
    }
}
if (typeof module === 'object')
    module.exports.Parser = Parser;
class Printer {
    static stringify(input) {
        const texts = [];
        const isOpenParen = (c) => ['{', '[', '('].includes(c);
        const isQuoteAbbrev = (c) => c === '\'';
        const lastChar = () => texts[texts.length - 1][texts[texts.length - 1].length - 1];
        const space = () => texts[texts.length - 1].length === 0 || isOpenParen(lastChar()) || isQuoteAbbrev(lastChar()) ? '' : ' ';
        function printClosure(closure) {
            texts.push('lambda (');
            loop(closure[1]);
            texts.push(')');
            loop(closure[2]);
        }
        function printQuote(obj) {
            if (Array.isArray(obj)) {
                texts.push(space() + '\'(');
                loop(obj);
                texts.push(')');
            }
            else {
                texts.push(space() + '\'' + obj);
            }
        }
        function loop(lst) {
            if (lst.length === 0)
                return;
            const element = lst[0];
            if (element === 'closure') {
                printClosure(lst);
                return;
            }
            if (Array.isArray(element)) {
                if (element[0] === 'string') {
                    texts.push(space() + '"' + element[1] + '"');
                }
                else if (element[0] === 'quote') {
                    printQuote(element[1]);
                }
                else {
                    texts.push(space() + '(');
                    loop(element);
                    texts.push(')');
                }
            }
            else {
                const val = String(element);
                const finalVal = val === 'true'
                    ? '#t'
                    : val === 'false'
                        ? '#f'
                        : val;
                texts.push(space() + finalVal);
            }
            loop(lst.slice(1));
        }
        const type = typeof input;
        if (input === null)
            return `'()`;
        if (type === 'boolean')
            return input ? '#t' : '#f';
        if (type === 'number')
            return String(input);
        if (type === 'string')
            return input;
        if (Array.isArray(input)) {
            if (input.length === 0)
                return '()';
            texts.push('(');
            loop(input);
            texts.push(')');
            return texts.join('');
        }
        return JSON.stringify(input);
    }
}
if (typeof module === 'object')
    module.exports.Printer = Printer;
class Schemy {
    constructor() { }
    evaluate(codeText, optionsParam, callback) {
        const options = optionsParam ? Options.parse(optionsParam) : new Options();
        const parser = new Parser();
        const interpreter = new Interpreter();
        try {
            const ilCode = parser.parse(codeText);
            return interpreter.evalCodeTree(ilCode, options, callback);
        }
        catch (e) {
            if (typeof callback === 'function')
                callback(e.toString());
            else
                return e.toString();
        }
    }
}
if (typeof module === 'object')
    module.exports.Schemy = Schemy;
class CoreLib {
    inter;
    methods = {
        'atom?': this.isAtom,
        'boolean?': this.isBoolean,
        'number?': this.isNumber,
        'string?': this.isString,
        'null?': this.isNull,
        'pair?': this.isPair,
        'list?': this.isList,
        '+': this.add,
        '-': this.subtract,
        '*': this.multiply,
        '/': this.divide,
        'modulo': this.modulo,
        'zero?': this.isZero,
        '=': this.numEqual,
        '!=': this.numNotEqual,
        '>': this.numGreater,
        '>=': this.numGreaterOrEqual,
        '<': this.numLower,
        '<=': this.numLowerOrEqual,
        'eq?': this.isEq,
        'equal?': this.isEqual,
        'not': this.not,
    };
    builtinFunc;
    builtinHash = {};
    constructor(interpreter) {
        this.inter = interpreter;
        this.builtinFunc = Object.keys(this.methods);
        for (const func of this.builtinFunc) {
            this.builtinHash[func] = true;
        }
    }
    libEvalExpr(expr, env) {
        return this.methods[expr[0]].call(this, expr, env);
    }
    isAtom(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return !Array.isArray(obj) || obj.length === 0;
    }
    isBoolean(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return typeof obj === 'boolean';
    }
    isNumber(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return typeof obj === 'number';
    }
    isString(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return typeof obj === 'string';
    }
    isNull(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return Array.isArray(obj) && obj.length === 0;
    }
    isPair(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return Array.isArray(obj) && obj.length > 0;
    }
    isList(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return Array.isArray(obj);
    }
    add(expr, env) {
        if (expr.length === 1) {
            return 0;
        }
        if (expr.length === 2) {
            const [num] = this.inter.evalArgs(['number'], expr, env);
            return num;
        }
        if (expr.length === 3) {
            const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
            return num1 + num2;
        }
        let sum = 0;
        for (let i = 1; i < expr.length; i++) {
            const num = this.inter.evalExpr(expr[i], env);
            if (typeof num !== 'number') {
                throw `Error: '+' requires a number. Given: ${num}`;
            }
            sum += num;
        }
        return sum;
    }
    subtract(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 - num2;
    }
    multiply(expr, env) {
        if (expr.length === 1) {
            return 1;
        }
        if (expr.length === 2) {
            const [num] = this.inter.evalArgs(['number'], expr, env);
            return num;
        }
        if (expr.length === 3) {
            const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
            return num1 * num2;
        }
        let res = 1;
        for (let i = 1; i < expr.length; i++) {
            const num = this.inter.evalExpr(expr[i], env);
            if (typeof num !== 'number') {
                throw `Error: '*' requires a number. Given: ${num}`;
            }
            res *= num;
        }
        return res;
    }
    divide(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        if (num2 === 0) {
            throw 'Error: \'/\' division by zero.';
        }
        return num1 / num2;
    }
    modulo(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 % num2;
    }
    isZero(expr, env) {
        const [num] = this.inter.evalArgs(['number'], expr, env);
        return num === 0;
    }
    numEqual(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 === num2;
    }
    numGreater(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 > num2;
    }
    numLower(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 < num2;
    }
    numNotEqual(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 !== num2;
    }
    numGreaterOrEqual(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 >= num2;
    }
    numLowerOrEqual(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 <= num2;
    }
    isEq(expr, env) {
        const [obj1, obj2] = this.inter.evalArgs(['any', 'any'], expr, env);
        return obj1 === obj2 ||
            (Array.isArray(obj1) && obj1.length === 0 && Array.isArray(obj2) && obj2.length === 0);
    }
    isEqual(expr, env) {
        const [obj1, obj2] = this.inter.evalArgs(['any', 'any'], expr, env);
        return Array.isArray(obj1) || Array.isArray(obj2)
            ? Printer.stringify(obj1) === Printer.stringify(obj2)
            : obj1 === obj2;
    }
    not(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return !this.inter.isTrue(obj);
    }
}
class ExtLib {
    inter;
    builtinFunc = [];
    builtinHash = {};
    constructor(interpreter) {
        this.inter = interpreter;
        for (const funcName of Object.keys(this.inter.options.extFunctions)) {
            this.builtinFunc.push(funcName);
            this.builtinHash[funcName] = true;
        }
    }
    libEvalExpr(expr, env) {
        const funcName = expr[0];
        const argsList = this.inter.mapExprList(expr.slice(1), env);
        return this.inter.options.extFunctions[funcName].apply(this.inter.options.extContext, argsList);
    }
}
class ListLib {
    inter;
    methods = {
        'list': this.list,
        'cons': this.cons,
        'car': this.car,
        'cdr': this.cdr,
        'caar': this.caar,
        'cadr': this.cadr,
        'cdar': this.cdar,
        'cddr': this.cddr,
        'caddr': this.caddr,
        'cadddr': this.cadddr,
        'caddddr': this.caddddr,
        'append': this.append,
        'length': this.length,
        'list-ref': this.listRef,
        'list-tail': this.listTail,
        'make-list': this.makeList,
        'map': this.map,
        'reverse': this.reverse,
    };
    builtinFunc;
    builtinHash = {};
    constructor(interpreter) {
        this.inter = interpreter;
        this.builtinFunc = Object.keys(this.methods);
        for (const func of this.builtinFunc) {
            this.builtinHash[func] = true;
        }
    }
    libEvalExpr(expr, env) {
        return this.methods[expr[0]].call(this, expr, env);
    }
    list(expr, env) {
        if (expr.length === 1) {
            return [];
        }
        return this.inter.mapExprList(expr.slice(1), env);
    }
    cons(expr, env) {
        const [obj1, obj2] = this.inter.evalArgs(['any', 'any'], expr, env);
        return Array.isArray(obj2)
            ? obj2.length === 0
                ? [obj1]
                : [obj1, ...obj2]
            : [obj1, obj2];
    }
    car(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length === 0) {
            throw `Error in 'car': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[0];
    }
    cdr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length === 0) {
            throw `Error in 'cdr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj.slice(1);
    }
    caar(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || !Array.isArray(obj[0]) || obj[0].length === 0) {
            throw `Error in 'caar': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[0][0];
    }
    cdar(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || !Array.isArray(obj[0]) || obj[0].length === 0) {
            throw `Error in 'cdar': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[0].slice(1);
    }
    cadr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length < 2) {
            throw `Error in 'cadr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[1];
    }
    cddr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length < 2) {
            throw `Error in 'cddr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj.slice(2);
    }
    caddr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length < 3) {
            throw `Error in 'caddr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[2];
    }
    cadddr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length < 4) {
            throw `Error in 'cadddr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[3];
    }
    caddddr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        if (!Array.isArray(obj) || obj.length < 5) {
            throw `Error in 'caddddr': Incorrect list structure: ${Printer.stringify(obj)}`;
        }
        return obj[4];
    }
    append(expr, env) {
        const [list, item] = this.inter.evalArgs(['list', 'any'], expr, env);
        return list.length === 0 ? item : list.concat(item);
    }
    length(expr, env) {
        const [list] = this.inter.evalArgs(['list'], expr, env);
        return list.length;
    }
    reverse(expr, env) {
        const [list] = this.inter.evalArgs(['list'], expr, env);
        return [...list].reverse();
    }
    makeList(expr, env) {
        const [size, fill] = this.inter.evalArgs(['number', 'scalar'], expr, env);
        const res = [];
        for (let i = 0; i < size; i++) {
            res.push(fill);
        }
        return res;
    }
    listTail(expr, env) {
        const [lst, k] = this.inter.evalArgs(['list', 'number'], expr, env);
        return lst.slice(k);
    }
    listRef(expr, env) {
        const [lst, k] = this.inter.evalArgs(['list', 'number'], expr, env);
        return lst[k];
    }
    map(expr, env) {
        const proc = expr[1];
        const args = this.inter.evalCallArgs(expr[2], env);
        return args.map(item => this.inter.evalExpr([proc, item], env));
    }
}
class StringLib {
    inter;
    methods = {
        'string': this.string,
        'string-append': this.stringAppend,
        'string-length': this.stringLength,
        'string->number': this.stringToNumber,
        'string->uppercase': this.stringToUppercase,
        'string->downcase': this.stringToDowncase,
    };
    builtinFunc;
    builtinHash = {};
    constructor(interpreter) {
        this.inter = interpreter;
        this.builtinFunc = Object.keys(this.methods);
        for (const func of this.builtinFunc) {
            this.builtinHash[func] = true;
        }
    }
    libEvalExpr(expr, env) {
        return this.methods[expr[0]].call(this, expr, env);
    }
    string(expr, _env) {
        if (expr.length !== 2) {
            throw 'Error: \'string\' requires 1 argument. Given: ' + (expr.length - 1);
        }
        return expr[1];
    }
    stringAppend(expr, env) {
        return this.inter.mapExprList(expr.slice(1), env)
            .map(Printer.stringify)
            .reduce((acc, e) => acc + e);
    }
    stringLength(expr, env) {
        const [str] = this.inter.evalArgs(['string'], expr, env);
        return str.length;
    }
    stringToNumber(expr, env) {
        const [str] = this.inter.evalArgs(['string'], expr, env);
        return Number(str);
    }
    stringToUppercase(expr, env) {
        const [str] = this.inter.evalArgs(['string'], expr, env);
        return str.toUpperCase();
    }
    stringToDowncase(expr, env) {
        const [str] = this.inter.evalArgs(['string'], expr, env);
        return str.toLowerCase();
    }
}
//# sourceMappingURL=schemy.js.map