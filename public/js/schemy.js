"use strict";
class Interpreter {
    isDebug;
    libs;
    builtinHash = {};
    specialForms = {
        'define': this.evalDefine,
        'lambda': this.evalLambda,
        'begin': this.evalBegin,
        'and': this.evalAnd,
        'or': this.evalOr,
        'if': this.evalIf,
        'display': this.evalDisplay,
        'newline': this.evalNewline,
        'quote': this.evalQuote,
        'quasiquote': this.evalQuasiquote,
        'parse': this.evalParse,
        'eval': this.evalEval,
        'debug': this.evalDebug,
    };
    options;
    constructor() {
        this.isDebug = false;
        this.libs = [];
        this.options = new Options();
        for (const form of Object.keys(this.specialForms)) {
            this.builtinHash[form] = true;
        }
    }
    evalCodeTree(codeTree, options, callback) {
        this.options = options;
        this.libs.push(...LibManager.getBuiltinLibs(options.libs, this));
        if (typeof callback === 'function') {
            LibManager.manageImports(codeTree, () => callback(this.evalExprList(codeTree, [])));
        }
        else {
            return this.evalExprList(codeTree, []);
        }
    }
    evalExprList(exprLst, env) {
        let res;
        for (const expr of exprLst) {
            res = this.evalExpr(expr, env);
        }
        return res;
    }
    mapExprList(exprLst, env) {
        const res = [];
        for (const expr of exprLst) {
            res.push(this.evalExpr(expr, env));
        }
        return res;
    }
    evalExpr(expr, env) {
        switch (expr) {
            case 'true': return true;
            case 'false': return false;
        }
        switch (typeof expr) {
            case 'number':
            case 'boolean':
                return expr;
            case 'string':
                return this.lookup(expr, env);
        }
        if (this.isDebug) {
            this.isDebug = false;
            this.dumpExpression(expr);
        }
        const form = expr[0];
        if (form === undefined) {
            throw 'Error: Improper function application. Probably: ()';
        }
        if (typeof form === 'string') {
            if (this.builtinHash[form]) {
                return this.specialForms[form].call(this, expr, env);
            }
            for (const lib of this.libs) {
                if (lib.builtinHash[form]) {
                    return lib.libEvalExpr(expr, env);
                }
            }
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
    addToEnv(symbol, value, modifier, env) {
        if (typeof value === 'undefined') {
            throw `Error: cannot set unspecified value to symbol: ${symbol}.`;
        }
        for (let i = env.length - 1; i > -1; i--) {
            const cellKey = env[i][0];
            if (cellKey === '#scope') {
                break;
            }
            if (cellKey === symbol) {
                throw `Error: Identifier already defined: ${symbol}`;
            }
        }
        env.push([symbol, value, modifier]);
    }
    lookup(symbol, env) {
        for (let i = env.length - 1; i > -1; i--) {
            if (symbol === env[i][0]) {
                return env[i][1];
            }
        }
        for (const lib of this.libs) {
            if (lib.builtinHash[symbol]) {
                return symbol;
            }
        }
        throw `Error: Unbound identifier: ${symbol}`;
    }
    isDefined(symbol, env) {
        for (let i = env.length - 1; i > -1; i--) {
            if (symbol === env[i][0]) {
                return true;
            }
        }
        for (const lib of this.libs) {
            if (lib.builtinHash[symbol]) {
                return true;
            }
        }
        return false;
    }
    clearEnv(tag, env) {
        let cell;
        do {
            cell = env.pop();
        } while (cell[0] !== tag);
    }
    evalApplication(expr, env) {
        const proc = expr[0];
        const isNamed = typeof proc === 'string';
        const procId = isNamed ? proc : proc[0];
        const closure = isNamed
            ? this.lookup(proc, env)
            : this.evalExpr(proc, env);
        if (typeof closure === 'string' && this.isDefined(closure, env)) {
            return this.evalExpr([this.evalExpr(closure, env), ...expr.slice(1)], env);
        }
        if (!Array.isArray(closure) || closure[0] !== 'closure') {
            throw `Error: Improper function application. Given: ${Printer.stringify(closure)}`;
        }
        const args = expr.length === 1
            ? []
            : expr.length === 2
                ? [this.evalExpr(expr[1], env)]
                : this.mapExprList(expr.slice(1), env);
        const params = closure[1];
        const body = closure[2];
        const closureEnv = closure[3].concat([['#scope', procId], ['#args', args], ['#name', procId]]);
        const scopeStart = closureEnv.length - 1;
        for (let i = 0; i < params.length; i++) {
            this.addToEnv(params[i], args[i], 'arg', closureEnv);
        }
        const res = this.evalExprList(body, closureEnv);
        if (Array.isArray(res) && res[0] === 'closure') {
            closureEnv.splice(scopeStart, 1);
        }
        else {
            this.clearEnv('#scope', closureEnv);
        }
        return res;
    }
    evalDefine(expr, env) {
        if (expr.length !== 3) {
            throw 'Error: \'define\' requires a symbol and an expression.';
        }
        if (typeof expr[1] !== 'string') {
            throw 'Error: \'define\' requires a symbol. Given: ' + Printer.stringify(expr[1]);
        }
        const value = this.evalExpr(expr[2], env);
        this.addToEnv(expr[1], value, 'define', env);
    }
    evalBegin(expr, env) {
        if (expr.length === 1) {
            throw 'Error: Empty begin';
        }
        env.push(['#scope', 'begin']);
        const scopeStart = env.length - 1;
        const res = expr.length === 2
            ? this.evalExpr(expr[1], env)
            : this.evalExprList(expr.slice(1), env);
        if (Array.isArray(res) && res[0] === 'closure') {
            env.splice(scopeStart, 1);
        }
        else {
            this.clearEnv('#scope', env);
        }
        return res;
    }
    evalLambda(expr, env) {
        if (expr.length !== 3) {
            throw 'Error: Improper function. Given: ' + Printer.stringify(expr);
        }
        if (!Array.isArray(expr[1])) {
            throw 'Error: Improper function parameters. Given: ' + Printer.stringify(expr);
        }
        return ['closure', expr[1], expr.slice(2), env];
    }
    evalIf(expr, env) {
        if (expr.length !== 4) {
            throw 'Error: \'if\' requires 3 arguments. Given: ' + (expr.length - 1);
        }
        const e1 = this.evalExpr(expr[1], env);
        return typeof e1 === 'boolean' && !e1
            ? this.evalExpr(expr[3], env)
            : this.evalExpr(expr[2], env);
    }
    evalAnd(expr, env) {
        if (expr.length !== 3) {
            throw 'Error: \'and\' requires 2 arguments. Given: ' + (expr.length - 1);
        }
        const e1 = this.evalExpr(expr[1], env);
        return typeof e1 === 'boolean' && !e1
            ? e1
            : this.evalExpr(expr[2], env);
    }
    evalOr(expr, env) {
        if (expr.length !== 3) {
            throw 'Error: \'or\' requires 2 arguments. Given: ' + (expr.length - 1);
        }
        const e1 = this.evalExpr(expr[1], env);
        return typeof e1 === 'boolean' && !e1
            ? this.evalExpr(expr[2], env)
            : e1;
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
        if (expr.length !== 2) {
            throw 'Error: \'quote\' requires 1 argument. Given: ' + (expr.length - 1);
        }
        return expr[1];
    }
    evalQuasiquote(expr, env) {
        if (expr.length !== 2) {
            throw 'Error: \'quasiquote\' requires 1 argument. Given: ' + (expr.length - 1);
        }
        const isUnquote = (obj) => obj === ',';
        const isUnquoteSplicing = (obj) => obj === '@';
        const datum = expr[1];
        const output = [];
        for (let i = 0; i < datum.length; i++) {
            if (i > 0 && isUnquote(datum[i - 1])) {
                output.push(this.evalExpr(datum[i], env));
            }
            else if (i > 0 && isUnquoteSplicing(datum[i - 1])) {
                output.push(...this.evalExpr(datum[i], env));
            }
            else if (!isUnquote(datum[i]) && !isUnquoteSplicing(datum[i])) {
                output.push(datum[i]);
            }
        }
        return output;
    }
    evalDebug(_expr, env) {
        this.isDebug = true;
        const envDumpList = [];
        for (let i = Math.min(env.length - 1, 20); i > -1; i--) {
            envDumpList.push(`${env[i][0]} = ${Printer.stringify(env[i][1]).substr(0, 500)}`);
        }
        this.options.printer(`Environment:\n${envDumpList.join('\n')}\n`);
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
        const argText = (count) => count === 1
            ? '1 argument'
            : count + ' arguments';
        if (optionalCount === 0 && expr.length !== argsCount + 1) {
            throw `Error: '${expr[0]}' requires ${argText(argsCount)}. Given: ${argText(expr.length - 1)}`;
        }
        else if (optionalCount !== 0 &&
            (expr.length - 1 < argsCount - optionalCount || expr.length - 1 > argsCount)) {
            throw `Error: '${expr[0]}' requires from ${argText(argsCount - optionalCount)} to ${argText(argsCount)}.` +
                ` Given: ${argText(expr.length - 1)}`;
        }
    }
    assertArgType(name, arg, argType) {
        if (!this.assertType(arg, argType)) {
            throw `Error: '${name}' requires ${argType}. Given: ${typeof arg} ${this.argToStr(arg)}`;
        }
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
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callback(xmlHttp.responseText);
            }
        }
        function error(e) {
            throw 'Error: GET: ' + url + ', ' + e.message;
        }
    }
    static setItemToLocalStorage(key, item) {
        try {
            if (typeof item === 'string') {
                localStorageLib.setItem(key, item);
            }
            else {
                localStorageLib.setItem(key, JSON.stringify(item));
            }
        }
        catch (e) {
            throw 'Error: Set item to local storage: ' + key + ', ' + e.message;
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
            default:
                throw 'Error: Unknown lib: ' + libName;
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
        if (typeof libUrl !== 'string' || libUrl.length === 0) {
            throw 'Error: Empty library name';
        }
        const storedLib = IoService.getItemFromLocalStorage(libUrl);
        if (Array.isArray(storedLib) && storedLib.length > 0) {
            callback(storedLib);
            return;
        }
        const libName = libUrl.substring(libUrl.lastIndexOf('/') + 1);
        IoService.get(libUrl, ioService_get_ready);
        function ioService_get_ready(libText) {
            if (typeof libUrl !== 'string' || libUrl.length === 0) {
                throw 'Error: Cannot load library content: ' + libName;
            }
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
        this.libs = ['core-lib', 'ext-lib', 'list-lib'];
        this.extContext = this;
        this.extFunctions = {};
    }
    static parse(options) {
        const evalOptions = new Options();
        if (typeof options.printer === 'function') {
            evalOptions.printer = options.printer;
        }
        if (Array.isArray(options.libs)) {
            evalOptions.libs = options.libs.slice();
        }
        if (options.extContext) {
            evalOptions.extContext = options.extContext;
        }
        if (options.extFunctions) {
            evalOptions.extFunctions = options.extFunctions;
        }
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
            .replace(/#t/g, 'true')
            .replace(/#f/g, 'false')
            .replace(/'\([ \t\r\n]*\)/g, '(list)')
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
        if (abbrevList.length === 0) {
            return codeList;
        }
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
            if (lexeme === '') {
                return;
            }
            output.push(this.isTextNumber(lexeme) ? Number(lexeme) : lexeme);
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
            if (flag && this.isOpenParen(curr)) {
                paren++;
            }
            if (flag && this.isCloseParen(curr)) {
                paren--;
            }
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
            if (++i === input.length) {
                return list;
            }
            const curr = input[i];
            const prev = input[i - 1];
            if (['{', '[', '('].includes(curr) && prev !== 'string') {
                return list.concat([pass([])]).concat(pass([]));
            }
            if ([')', ']', '}'].includes(curr)) {
                if (prev === 'string' && input[i - 2] !== '(' || prev !== 'string') {
                    return list;
                }
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
            if (codeList[i - 1] === '(' && codeList[i] === 'string') {
                i += 2;
            }
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
        if (curly !== 0) {
            throw 'Unmatching curly braces!';
        }
        if (square !== 0) {
            throw 'Unmatching square braces!';
        }
        if (round !== 0) {
            throw 'Unmatching round braces!';
        }
    }
}
if (typeof module === 'object') {
    module.exports.Parser = Parser;
}
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
            if (lst.length === 0) {
                return;
            }
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
                texts.push(space() + String(element));
            }
            loop(lst.slice(1));
        }
        const type = typeof input;
        if (input === null || type === 'boolean' || type === 'number') {
            return String(input);
        }
        if (type === 'string') {
            return input;
        }
        if (Array.isArray(input)) {
            if (input.length === 0) {
                return '()';
            }
            texts.push('(');
            loop(input);
            texts.push(')');
            return texts.join('');
        }
        return JSON.stringify(input);
    }
}
if (typeof module === 'object') {
    module.exports.Printer = Printer;
}
class Schemy {
    constructor() {
    }
    evaluate(codeText, optionsParam, callback) {
        const options = optionsParam ? Options.parse(optionsParam) : new Options();
        const parser = new Parser();
        const interpreter = new Interpreter();
        try {
            const ilCode = parser.parse(codeText);
            return interpreter.evalCodeTree(ilCode, options, callback);
        }
        catch (e) {
            if (typeof callback === 'function') {
                callback(e.toString());
            }
            else {
                return e.toString();
            }
        }
    }
}
if (typeof module === 'object') {
    module.exports.Schemy = Schemy;
}
class CoreLib {
    inter;
    methods = {
        'atom?': this.isAtom,
        'boolean?': this.isBoolean,
        'number?': this.isNumber,
        'null?': this.isNull,
        'pair?': this.isPair,
        '+': this.add,
        '-': this.subtract,
        '*': this.multiply,
        '/': this.divide,
        '%': this.modulo,
        '=': this.numEqual,
        '!=': this.numNotEqual,
        '>': this.numGreater,
        '>=': this.numGreaterOrEqual,
        '<': this.numLower,
        '<=': this.numLowerOrEqual,
        'eq?': this.isEq,
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
        return !(Array.isArray(obj) && obj.length === 0);
    }
    isBoolean(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return typeof obj === 'boolean';
    }
    isNumber(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return typeof obj === 'number';
    }
    isNull(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return Array.isArray(obj) && obj.length === 0;
    }
    isPair(expr, env) {
        const [obj] = this.inter.evalArgs(['any'], expr, env);
        return Array.isArray(obj) && obj.length > 0;
    }
    add(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 + num2;
    }
    subtract(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 - num2;
    }
    multiply(expr, env) {
        const [num1, num2] = this.inter.evalArgs(['number', 'number'], expr, env);
        return num1 * num2;
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
        const objects = this.inter.mapExprList(expr.slice(1), env);
        let res = [];
        for (let i = objects.length - 1; i > -1; i--) {
            res = [objects[i], res];
        }
        return res;
    }
    cons(expr, env) {
        const [obj1, obj2] = this.inter.evalArgs(['any', 'any'], expr, env);
        return [obj1, obj2];
    }
    car(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        return obj[0];
    }
    cdr(expr, env) {
        const [obj] = this.inter.evalArgs(['list'], expr, env);
        return obj[1];
    }
}
