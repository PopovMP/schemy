'use strict'

const app = {}

function initialize()
{
	const codeMirrorOptions = {
		lineNumbers   : true,
		matchBrackets : true,
		mode          : 'schemy-mode',
		theme         : 'schemy',
		indentUnit    : 4,
		indentWithTabs: false,
		tabSize       : 4,
	}

	const view = {
		codeAreaElem     : document.getElementById('code-area'),
		buttonRun        : document.getElementById('run-button'),
		codeOutputElem   : document.getElementById('code-output'),
		codeExamplesElem : document.getElementById('select-examples'),
		runningTime      : document.getElementById('running-time'),
	}

	app.editor      = CodeMirror.fromTextArea(view.codeAreaElem, codeMirrorOptions)
	app.evalOptions = {printer: interpreter_print}
	app.view        = view
	app.schemy      = new Schemy()

	setExamples()
	setDefaultCode()

	view.buttonRun.addEventListener('click', buttonRun_click)
	document.addEventListener('keydown', document_keydown)
	window.addEventListener('beforeunload', window_beforeUnload)

}

function setExamples()
{
	const exampleNames = examplesList.map(function (e) {
		return e.name
	})

	for (let i = 0; i < exampleNames.length; i++) {
		const name        = exampleNames[i]
		const exampleLink = '<a href="#" class="example-link">' + name + '</a><br />'
		app.view.codeExamplesElem.insertAdjacentHTML('beforeend', exampleLink)
	}

	const exampleLinks = document.getElementsByClassName('example-link')
	for (let j = 0; j < exampleLinks.length; j++) {
		const link = exampleLinks[j]
		link.addEventListener('click', exampleLink_click)
	}
}

function setDefaultCode()
{
	try {
		const code = JSON.parse(localStorage.getItem('schemeCode'))
		app.editor.getDoc().setValue(code || examplesList[0].code)
	}
	catch (e) {
		localStorage.removeItem('schemeCode')
		app.editor.getDoc().setValue(examplesList[0].code)
	}

	clearOutput()
}

function runCode(codeText)
{
	clearOutput()

	const startTime = Date.now()

	app.schemy.evaluate(codeText, app.evalOptions, (output) => {
		const time = Date.now() - startTime
		app.view.runningTime.innerText = 'Run time: ' + time + 'ms.'

		if (typeof output !== 'undefined')
			showOutput(output)
	})
}

function clearOutput()
{
	app.view.codeOutputElem.value = ''
}

function showOutput(output)
{
	app.view.codeOutputElem.value += output
}

function exampleLink_click(event)
{
	event.preventDefault()

	const exampleName = event.target.innerHTML
	for (let i = 0; i < examplesList.length; i++) {
		if (examplesList[i].name === exampleName) {
			app.editor.getDoc().setValue(examplesList[i].code)
			clearOutput()
			return
		}
	}
}

function buttonRun_click(event)
{
	event.preventDefault()
	const code = app.editor.getDoc().getValue()
	runCode(code)
}

function interpreter_print(output)
{
	showOutput(output)
}

function document_keydown(event)
{
	if (event.ctrlKey && event.keyCode === 76) {
		// "Ctrl" + "L" - inserts λ
		event.preventDefault()
		insertTextInEditor('λ')
	}
	else if (event.ctrlKey && event.keyCode === 82 || event.keyCode === 116) {
		// "Ctrl" + "R" or F5 - run
		event.preventDefault()
		const code = app.editor.getDoc().getValue()
		runCode(code)
	}
	else if (event.ctrlKey && event.keyCode === 75) {
		// "Ctrl" + "K" - clear console
		event.preventDefault()
		clearOutput()
	}
}

function insertTextInEditor(str)
{
	const selection = app.editor.getSelection()

	if (selection.length > 0) {
		app.editor.replaceSelection(str)
	}
	else {
		const doc    = app.editor.getDoc()
		const cursor = doc.getCursor()
		const pos    = {line: cursor.line, ch: cursor.ch}

		doc.replaceRange(str, pos)
	}
}

function window_beforeUnload()
{
	const code = app.editor.getDoc().getValue()
	localStorage.setItem('schemeCode', JSON.stringify(code))
}
