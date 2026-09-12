const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const prettier = require('prettier');
const djangoPlugin = require('prettier-plugin-django');

class MikiTemplateFormatter {
	constructor(diagnosticCollection) {
		this.diagnosticCollection = diagnosticCollection;
		this.defaultOptions = {
			tabWidth: 2,
			printWidth: 5000,
			semi: false,
			singleQuote: true,
			trailingComma: 'none',
			parser: 'melody',
			plugins: [djangoPlugin],
			htmlWhitespaceSensitivity: 'ignore',
			embeddedLanguageFormatting: 'off',
			templateType: 'django'
		};
	}

	async provideDocumentFormattingEdits(document, options, token) {
		const otext = document.getText();
		if (!otext.trim()) return [];

		let resolvedOptions = { ...this.defaultOptions };
		try {
			const config = await prettier.resolveConfig(document.uri.fsPath);
			if (config) {
				Object.assign(resolvedOptions, config);
			}
		} catch (e) {
			console.warn('Could not resolve prettier config:', e.message);
		}

		resolvedOptions.plugins = [djangoPlugin];
		resolvedOptions.parser = 'melody';
		resolvedOptions.htmlWhitespaceSensitivity = 'ignore';
		resolvedOptions.embeddedLanguageFormatting = 'off';
		resolvedOptions.templateType = 'django';

		let formattedText;
		try {
			formattedText = await prettier.format(otext, {
				...resolvedOptions,
				parser: 'melody',
				plugins: [djangoPlugin]
			});
		} catch (error) {
			this.reportDiagnostic(document, error);
			return [];
		}

		if (!formattedText || formattedText === otext) return [];

		formattedText = this.formatEmbeddedLanguages(formattedText, otext, resolvedOptions);

		const range = new vscode.Range(
			document.positionAt(0),
			document.positionAt(otext.length)
		);
		return [new vscode.TextEdit(range, formattedText)];
	}

	formatEmbeddedLanguages(formattedText, originalText, options) {
		try {
			const htmlPlugin = require('prettier/parser-html');
			const result = htmlPlugin.parsers.html.parse(formattedText, null, {});
			if (!result.children) return formattedText;

			let incrChars = 0;
			let incrLines = 0;
			const eol = formattedText.includes('\r\n') ? '\r\n' : '\n';
			const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth || 2);

			const processNode = (node) => {
				if (!node.children) return;
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i];
					if (child.type === 'element' && (child.name === 'script' || child.name === 'style')) {
						if (child.children.length === 0) continue;

						const prev = child.prev;
						if (prev && prev.value && prev.value.trim().endsWith('{# prettier-ignore #}')) {
							processNode(child);
							continue;
						}

						const textNode = child.children[0];
						if (!textNode || !textNode.value || !textNode.value.trim()) {
							processNode(child);
							continue;
						}

						const ctext = textNode.value;
						const parser = child.name === 'script' ? 'babel' : 'css';
						const tagOffset = textNode.sourceSpan.start.offset;
						let tagOffset2 = tagOffset;
						while (tagOffset2 > 0 && formattedText[tagOffset2 + incrChars] !== '\n') {
							tagOffset2--;
						}
						const tagIndent = formattedText
							.slice(tagOffset2 + 1 + incrChars, tagOffset + incrChars)
							.replace(/\S/g, ' ');

						const raw = '\n'.repeat(textNode.sourceSpan.start.line + incrLines) +
							' '.repeat(textNode.sourceSpan.start.col) + ctext;

						let embeddedFormatted;
						try {
							embeddedFormatted = prettier.format(raw, {
								...options,
								parser,
								plugins: [parser === 'babel' ? require('prettier/parser-babel') : require('prettier/parser-postcss')]
							}).trim();
						} catch (e) {
							processNode(child);
							continue;
						}

						const lines = embeddedFormatted.split(eol);
						const indented = lines.map(line => tagIndent + indent + line).join(eol);
						const replacement = eol + indented + eol + tagIndent;

						const start = textNode.sourceSpan.start.offset;
						formattedText = formattedText.slice(0, start + incrChars) + replacement + formattedText.slice(start + textNode.value.length + incrChars);
						const delta = replacement.length - textNode.value.length;
						incrChars += delta;
						incrLines += replacement.split(eol).length - textNode.value.split(eol).length;
					} else {
						processNode(child);
					}
				}
			};
			processNode(result);
		} catch (e) {
			console.warn('Embedded language formatting failed:', e.message);
		}
		return formattedText;
	}

	reportDiagnostic(document, error) {
		if (!this.diagnosticCollection || !error.loc) return;
		this.diagnosticCollection.clear();
		const loc = error.loc;
		if (!loc.end) {
			loc.end = { line: loc.start.line, column: loc.start.column + 1 };
		}
		const range = new vscode.Range(
			new vscode.Position(loc.start.line - 1, loc.start.column - 1),
			new vscode.Position(loc.end.line - 1, loc.end.column - 1)
		);
		const message = error.message.split(' \t ')[0].split('\n')[0];
		const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
		setTimeout(() => {
			this.diagnosticCollection.set(document.uri, [diagnostic]);
		}, 250);
	}
}

const TAGS = {
	if: { doc: 'Conditionally renders content based on an expression.', syntax: '{% if condition %}' },
	elif: { doc: 'Else-if condition in an if block.', syntax: '{% elif condition %}' },
	else: { doc: 'Else block for if conditions.', syntax: '{% else %}' },
	endif: { doc: 'End of an if block.', syntax: '{% endif %}' },
	for: { doc: 'Iterates over arrays or objects.', syntax: '{% for item in items %}' },
	endfor: { doc: 'End of a for loop.', syntax: '{% endfor %}' },
	empty: { doc: 'Content shown when loop has no items.', syntax: '{% empty %}' },
	with: { doc: 'Creates scoped aliases for variables.', syntax: '{% with var as alias %}' },
	endwith: { doc: 'End of a with block.', syntax: '{% endwith %}' },
	cycle: { doc: 'Outputs one of its arguments for each iteration.', syntax: "{% cycle 'val1' 'val2' %}" },
	resetcycle: { doc: 'Resets the cycle counter to its initial value.', syntax: '{% resetcycle %}' },
	firstof: { doc: 'Outputs the first argument that evaluates to true.', syntax: '{% firstof var1 var2 "fallback" %}' },
	comment: { doc: 'Block comment that is stripped from output.', syntax: '{% comment %} ... {% endcomment %}' },
	endcomment: { doc: 'End of comment block.', syntax: '{% endcomment %}' },
	verbatim: { doc: 'Prevents all tag/variable parsing inside.', syntax: '{% verbatim %} ... {% endverbatim %}' },
	endverbatim: { doc: 'End of verbatim block.', syntax: '{% endverbatim %}' },
	include: { doc: 'Includes another template file.', syntax: '{% include "template.html" %}' },
	extends: { doc: 'Must be first tag - specifies parent template.', syntax: '{% extends "base.html" %}' },
	block: { doc: 'Defines a replaceable section.', syntax: '{% block name %} ... {% endblock %}' },
	endblock: { doc: 'End of a block.', syntax: '{% endblock %}' },
	'block.super': { doc: 'Renders parent template block content.', syntax: '{{ block.super }}' },
	partialdef: { doc: 'Defines a reusable fragment (miki-template).', syntax: '{% partialdef name %} ... {% endpartialdef %}' },
	endpartialdef: { doc: 'End of partialdef block.', syntax: '{% endpartialdef %}' },
	partial: { doc: 'Renders a previously defined partial.', syntax: '{% partial name %}' },
	load: { doc: 'Loads additional filter libraries.', syntax: '{% load i18n %}' },
	spaceless: { doc: 'Removes whitespace between HTML tags.', syntax: '{% spaceless %} ... {% endspaceless %}' },
	endspaceless: { doc: 'End of spaceless block.', syntax: '{% endspaceless %}' },
	autoescape: { doc: 'Controls HTML escaping.', syntax: '{% autoescape on %} ... {% endautoescape %}' },
	endautoescape: { doc: 'End of autoescape block.', syntax: '{% endautoescape %}' },
	filter: { doc: 'Applies a filter to block content.', syntax: '{% filter lower %} ... {% endfilter %}' },
	endfilter: { doc: 'End of filter block.', syntax: '{% endfilter %}' },
	ifchanged: { doc: 'Outputs content only if a value has changed since the last iteration.', syntax: '{% ifchanged %} ... {% endifchanged %}' },
	endifchanged: { doc: 'End of ifchanged block.', syntax: '{% endifchanged %}' },
	ifequal: { doc: 'Outputs content if two values are equal (planned).', syntax: '{% ifequal a b %} ... {% endifequal %}' },
	endifequal: { doc: 'End of ifequal block.', syntax: '{% endifequal %}' },
	ifnotequal: { doc: 'Outputs content if two values are not equal (planned).', syntax: '{% ifnotequal a b %} ... {% endifnotequal %}' },
	endifnotequal: { doc: 'End of ifnotequal block.', syntax: '{% endifnotequal %}' },
	lorem: { doc: 'Outputs lorem ipsum text.', syntax: '{% lorem [count] [method] [random] %}' },
	now: { doc: 'Outputs the current date/time in the given format.', syntax: '{% now "DATE_FORMAT" %}' },
	ssi: { doc: 'Outputs contents of a file on the server (deprecated, planned).', syntax: '{% ssi "path/to/file" %}' },
	thumbnail: { doc: 'Starts a thumbnail block (sorl-thumbnail).', syntax: '{% thumbnail %} ... {% endthumbnail %}' },
	endthumbnail: { doc: 'End of thumbnail block.', syntax: '{% endthumbnail %}' },
	thumbnail_opts: { doc: 'Thumbnail options for sorl-thumbnail.', syntax: '{% thumbnail source 100x100 crop upscale %}' },
	get_media_prefix: { doc: 'Returns the MEDIA_PREFIX setting.', syntax: '{% get_media_prefix %}' },
	get_static_prefix: { doc: 'Returns the STATIC_PREFIX setting.', syntax: '{% get_static_prefix %}' },
	templatetag: { doc: 'Outputs a template tag symbol.', syntax: '{% templatetag openblock %}' },
	trans: { doc: 'Outputs a translated string.', syntax: '{% trans "Hello" %}' },
	translate: { doc: 'Alias of trans - outputs a translated string (planned).', syntax: '{% translate "Hello" %}' },
	blocktrans: { doc: 'Translates a block of text.', syntax: '{% blocktrans %} ... {% endblocktrans %}' },
	endblocktrans: { doc: 'End of blocktrans.', syntax: '{% endblocktrans %}' },
	plural: { doc: 'Plural form in blocktrans (planned).', syntax: '{% plural count=var %}' },
	language: { doc: 'Switches active language.', syntax: '{% language "fr" %} ... {% endlanguage %}' },
	endlanguage: { doc: 'End of language block.', syntax: '{% endlanguage %}' },
	regroup: { doc: 'Regroups a list by a common attribute.', syntax: '{% regroup items by attr as groups %}' },
	widthratio: { doc: 'Calculates proportional width.', syntax: '{% widthratio value max max_width %}' },
	debug: { doc: 'Dumps template context.', syntax: '{% debug %}' },
	csrf_token: { doc: 'Outputs CSRF token hidden input.', syntax: '{% csrf_token %}' },
	csp_nonce_attr: { doc: 'Outputs CSP nonce attribute.', syntax: '{% csp_nonce_attr %}' },
	static: { doc: 'Generates URL for static asset.', syntax: '{% static "css/app.css" %}' },
	url: { doc: 'Generates URL for named route.', syntax: '{% url "route-name" %}' },
	compress: { doc: 'Compresses linked CSS/JS (django-compressor, planned).', syntax: '{% compress css %} ... {% endcompress %}' },
	endcompress: { doc: 'End of compress block.', syntax: '{% endcompress %}' },
	placeholder: { doc: 'Placeholder for django CMS (planned).', syntax: '{% placeholder content %}' },
	addtoblock: { doc: 'Appends content to a block (miki-template).', syntax: '{% addtoblock css %} ... {% endaddtoblock %}' },
	endaddtoblock: { doc: 'End of addtoblock.', syntax: '{% endaddtoblock %}' },
	cache: { doc: 'Caches block content (miki-template).', syntax: '{% cache timeout key %} ... {% endcache %}' },
	endcache: { doc: 'End of cache block.', syntax: '{% endcache %}' },
	set: { doc: 'Sets a variable in the current context (miki-template).', syntax: '{% set var = value %}' },
	endset: { doc: 'End of set block (miki-template).', syntax: '{% endset %}' },
	// Additional Django-only tags (planned for miki)
	ssi_modified: { doc: 'Outputs file contents with optional caching.', syntax: '{% ssi "path/to/file" parsed %}' },
	staticfiles: { doc: 'Static files tag (planned).', syntax: '{% staticfiles %}' },
	bootable: { doc: 'Bootable tag (planned).', syntax: '{% bootable %}' },
};

const FILTERS = {
	upper: { doc: 'Converts to UPPERCASE.', syntax: '{{ value|upper }}', args: [] },
	lower: { doc: 'Converts to lowercase.', syntax: '{{ value|lower }}', args: [] },
	title: { doc: 'Converts to Title Case.', syntax: '{{ value|title }}', args: [] },
	capfirst: { doc: 'Capitalizes first character.', syntax: '{{ value|capfirst }}', args: [] },
	slugify: { doc: 'Converts to URL-safe slug.', syntax: '{{ value|slugify }}', args: [] },
	wordcount: { doc: 'Returns word count.', syntax: '{{ text|wordcount }}', args: [] },
	wordwrap: { doc: 'Wraps text at word boundaries.', syntax: '{{ text|wordwrap:80 }}', args: ['width?'] },
	striptags: { doc: 'Removes HTML tags.', syntax: '{{ html|striptags }}', args: [] },
	truncatewords: { doc: 'Truncates to N words.', syntax: '{{ text|truncatewords:10 }}', args: ['n'] },
	truncatechars: { doc: 'Truncates to N characters.', syntax: '{{ text|truncatechars:100 }}', args: ['n'] },
	truncatewords_html: { doc: 'Truncates to N words, preserving HTML.', syntax: '{{ text|truncatewords_html:10 }}', args: ['n'] },
	truncatechars_html: { doc: 'Truncates to N characters, preserving HTML.', syntax: '{{ html|truncatechars_html:100 }}', args: ['n'] },
	linebreaks: { doc: 'Converts newlines to HTML paragraphs.', syntax: '{{ text|linebreaks }}', args: [] },
	linebreaksbr: { doc: 'Converts newlines to <br>.', syntax: '{{ text|linebreaksbr }}', args: [] },
	cut: { doc: 'Removes occurrences of value.', syntax: '{{ value|cut:" " }}', args: ['value'] },
	addslashes: { doc: 'Adds backslashes before quotes.', syntax: "{{ value|addslashes }}", args: [] },
	removetags: { doc: 'Removes specific HTML tags.', syntax: '{{ html|removetags:"p,div" }}', args: ['tags'] },
	safe: { doc: 'Marks value as HTML-safe.', syntax: '{{ html|safe }}', args: [] },
	escape: { doc: 'Escapes HTML entities.', syntax: '{{ value|escape }}', args: [] },
	urlencode: { doc: 'URL encodes the value.', syntax: '{{ value|urlencode }}', args: [] },
	escapeuri: { doc: 'Full URL encoding.', syntax: '{{ url|escapeuri }}', args: [] },
	escapeurl: { doc: 'Full URL encoding.', syntax: '{{ url|escapeurl }}', args: [] },
	urlize: { doc: 'Converts URLs to HTML links.', syntax: '{{ text|urlize }}', args: [] },
	escapejs: { doc: 'Escapes for JavaScript (planned).', syntax: '{{ value|escapejs }}', args: [] },
	force_escape: { doc: 'Escapes HTML entities immediately (planned).', syntax: '{{ value|force_escape }}', args: [] },
	iriencode: { doc: 'Escapes IRI to be URL-safe (planned).', syntax: '{{ url|iriencode }}', args: [] },
	fix_ampersands: { doc: 'Replaces ampersands with &amp; (planned).', syntax: '{{ value|fix_ampersands }}', args: [] },
	safeseq: { doc: 'Marks a sequence as HTML-safe (planned).', syntax: '{{ list|safeseq }}', args: [] },
	urlizetrunc: { doc: 'Converts URLs to links, truncating long URLs (planned).', syntax: '{{ text|urlizetrunc:60 }}', args: ['num'] },
	stringformat: { doc: 'Python-style format.', syntax: '{{ value|stringformat:"s" }}', args: ['fmt'] },
	center: { doc: 'Centers text in field (planned).', syntax: '{{ value|center:10 }}', args: ['width'] },
	ljust: { doc: 'Left justifies text (planned).', syntax: '{{ value|ljust:10 }}', args: ['width'] },
	rjust: { doc: 'Right justifies text (planned).', syntax: '{{ value|rjust:10 }}', args: ['width'] },
	length: { doc: 'Returns length.', syntax: '{{ value|length }}', args: [] },
	length_is: { doc: 'Checks if length equals N.', syntax: '{{ value|length_is:5 }}', args: ['n'] },
	unordered_list: { doc: 'Converts a nested list to an HTML unordered list (planned).', syntax: '{{ list|unordered_list }}', args: [] },
	make_list: { doc: 'Converts a value to a list (planned).', syntax: '{{ value|make_list }}', args: [] },
	get_digit: { doc: 'Get digit by position.', syntax: '{{ number|get_digit:1 }}', args: ['position'] },
	linenumbers: { doc: 'Displays 1-based line numbers (planned).', syntax: '{{ text|linenumbers }}', args: [] },
	join: { doc: 'Joins array with separator.', syntax: '{{ list|join:", " }}', args: ['separator'] },
	slice: { doc: 'Slices array/string.', syntax: "{{ value|slice:'0:3' }}", args: ['start:end'] },
	first: { doc: 'Returns first element.', syntax: '{{ list|first }}', args: [] },
	last: { doc: 'Returns last element.', syntax: '{{ list|last }}', args: [] },
	dictsort: { doc: 'Sorts by key (ascending).', syntax: '{{ list|dictsort:"name" }}', args: ['key'] },
	dictsortreversed: { doc: 'Sorts by key (descending).', syntax: '{{ list|dictsortreversed:"name" }}', args: ['key'] },
	random: { doc: 'Returns a random element from a list.', syntax: '{{ list|random }}', args: [] },
	default: { doc: 'Fallback if falsy.', syntax: '{{ value|default:"fallback" }}', args: ['fallback'] },
	default_if_none: { doc: 'Fallback if None/undefined.', syntax: '{{ value|default_if_none:"fallback" }}', args: ['fallback'] },
	firstof: { doc: 'First truthy value.', syntax: '{{ val1|firstof:val2:val3 }}', args: ['val2', 'val3'] },
	date: { doc: 'Formats date.', syntax: '{{ date|date:"Y-m-d" }}', args: ['format'] },
	time: { doc: 'Formats time.', syntax: '{{ date|time:"H:i" }}', args: ['format'] },
	strftime: { doc: 'Format with date-fns.', syntax: '{{ date|strftime:"PPpp" }}', args: ['format'] },
	timesince: { doc: 'Human-readable time ago.', syntax: '{{ date|timesince }}', args: ['other_date?'] },
	timeuntil: { doc: 'Human-readable time until.', syntax: '{{ date|timeuntil }}', args: ['other_date?'] },
	time_diff: { doc: 'Outputs the difference between two dates.', syntax: '{{ date|time_diff:other_date }}', args: ['other_date?'] },
	ago: { doc: 'Outputs a human-readable "time ago" string.', syntax: '{{ date|ago }}', args: [] },
	until: { doc: 'Outputs a human-readable "time until" string.', syntax: '{{ date|until }}', args: [] },
	add: { doc: 'Adds N to value.', syntax: '{{ value|add:5 }}', args: ['n'] },
	sub: { doc: 'Subtracts N from value.', syntax: '{{ value|sub:5 }}', args: ['n'] },
	mult: { doc: 'Multiplies value by N.', syntax: '{{ value|mult:5 }}', args: ['n'] },
	mod: { doc: 'Returns the remainder of division.', syntax: '{{ value|mod:5 }}', args: ['n'] },
	divisibleby: { doc: 'Checks divisibility.', syntax: '{{ value|divisibleby:2 }}', args: ['n'] },
	floatformat: { doc: 'Formats decimal places.', syntax: '{{ value|floatformat:2 }}', args: ['decimals?'] },
	yesno: { doc: 'Maps boolean to strings.', syntax: '{{ value|yesno:"yes,no,maybe" }}', args: ['yes,no,maybe'] },
	pluralize: { doc: 'Returns plural suffix.', syntax: '{{ count|pluralize }}', args: ['suffix?'] },
	filesizeformat: { doc: 'Human-readable file size.', syntax: '{{ bytes|filesizeformat }}', args: [] },
	trans: { doc: 'Translates string.', syntax: '{{ "Hello"|trans }}', args: ['fallback?'] },
	regroup: { doc: 'Groups list by attribute.', syntax: '{{ list|regroup:"category" }}', args: ['key'] },
	phone2numeric: { doc: 'Converts letters to phone keypad digits.', syntax: '{{ value|phone2numeric }}', args: [] },
	pprint: { doc: 'Pretty-prints a variable.', syntax: '{{ value|pprint }}', args: [] },
	json_script: { doc: 'JSON script tag (planned).', syntax: "{{ data|json_script:'id' }}", args: ['id'] },
	json: { doc: 'Converts a value to JSON string.', syntax: '{{ data|json }}', args: [] },
	// miki-template specific math filters
	square: { doc: 'Returns the square of a number.', syntax: '{{ value|square }}', args: [] },
	sqrt: { doc: 'Returns the square root of a number.', syntax: '{{ value|sqrt }}', args: [] },
	abs: { doc: 'Returns the absolute value.', syntax: '{{ value|abs }}', args: [] },
	round: { doc: 'Rounds to N decimal places.', syntax: '{{ value|round:2 }}', args: ['decimals?'] },
	floor: { doc: 'Rounds down to nearest integer.', syntax: '{{ value|floor }}', args: [] },
	ceil: { doc: 'Rounds up to nearest integer.', syntax: '{{ value|ceil }}', args: [] },
	min: { doc: 'Minimum of value and arg (or array min).', syntax: '{{ value|min:other }}', args: ['other?'] },
	max: { doc: 'Maximum of value and arg (or array max).', syntax: '{{ value|max:other }}', args: ['other?'] },
	sum: { doc: 'Sums all elements in a list.', syntax: '{{ list|sum }}', args: [] },
	average: { doc: 'Returns the average of a list.', syntax: '{{ list|average }}', args: [] },
	reverse: { doc: 'Reverses a list or string.', syntax: '{{ value|reverse }}', args: [] },
	sort: { doc: 'Sorts a list.', syntax: '{{ list|sort }}', args: [] },
	unique: { doc: 'Removes duplicates from a list.', syntax: '{{ list|unique }}', args: [] },
	split: { doc: 'Splits a string by separator.', syntax: "{{ value|split:',' }}", args: ['separator'] },
	replace: { doc: 'Replaces occurrences in a string.', syntax: "{{ value|replace:'old,new' }}", args: ['old,new'] },
	base64_encode: { doc: 'Base64 encodes a string.', syntax: '{{ value|base64_encode }}', args: [] },
	base64_decode: { doc: 'Base64 decodes a string.', syntax: '{{ value|base64_decode }}', args: [] },
	range: { doc: 'Generates a range of numbers.', syntax: '{{ end|range:0 }}', args: ['start?'] },
	currency: { doc: 'Formats a number as currency.', syntax: "{{ value|currency:'$' }}", args: ['symbol?'] },
	phone_number: { doc: 'Formats a phone number.', syntax: '{{ value|phone_number }}', args: [] },
	email: { doc: 'Converts email to a mailto link.', syntax: '{{ value|email }}', args: [] },
	mask: { doc: 'Masks a value showing only last N characters.', syntax: "{{ value|mask:'*' }}", args: ['char?'] },
	whatsapp_link: { doc: 'Generates a WhatsApp link from a phone number.', syntax: "{{ value|whatsapp_link:'message' }}", args: ['message?'] },
	intcomma: { doc: 'Adds commas to integer.', syntax: '{{ number|intcomma }}', args: [] },
	intword: { doc: 'Large number to word.', syntax: '{{ number|intword }}', args: [] },
	apnumber: { doc: '1→one, 2→two.', syntax: '{{ number|apnumber }}', args: [] },
	ordinal: { doc: '1→1st, 2→2nd.', syntax: '{{ number|ordinal }}', args: [] },
	naturalday: { doc: '"yesterday", "today".', syntax: '{{ date|naturalday }}', args: [] },
	naturaldate: { doc: 'Formats a date without the time.', syntax: '{{ date|naturaldate }}', args: [] },
	naturaltime: { doc: 'Natural human-readable time.', syntax: '{{ date|naturaltime }}', args: [] },
};

	const FORLOOP_VARS = [
		{ name: 'forloop.counter', doc: '1-indexed loop counter' },
		{ name: 'forloop.counter0', doc: '0-indexed loop counter' },
		{ name: 'forloop.revcounter', doc: 'Remaining iterations (1-indexed)' },
		{ name: 'forloop.revcounter0', doc: 'Remaining iterations (0-indexed)' },
		{ name: 'forloop.first', doc: 'True if first iteration' },
		{ name: 'forloop.last', doc: 'True if last iteration' },
		{ name: 'forloop.parentloop', doc: 'Reference to parent loop' },
	];

	const COLOR_REGEX = /(?:#[0-9A-Fa-f]{3,8}|rgba?\s*\([^)]+\)|hsla?\s*\([^)]+\))/g;

const SUPPORTED_LANGUAGES = ['miki-template', 'django-html', 'django-txt', 'html', 'htm', 'tpl', 'j2', 'jinja', 'jinja2'];
const TEMPLATE_EXTENSIONS = /\.(miki|miki-template|django|dj|html|htm|tpl|j2|jinja|jinja2)$/;

const virtualDocumentContents = new Map();
const virtualDocumentPaths = new Map();

vscode.workspace.registerTextDocumentContentProvider('miki-embedded-content', {
	provideTextDocumentContent(uri) {
		const path = uri.path;
		const lastSlash = path.lastIndexOf('/');
		const originalUri = decodeURIComponent(path.slice(1, lastSlash));
		return virtualDocumentContents.get(originalUri) || '';
	}
});

function createVirtualDoc(document, languageId = 'html') {
	const originalUri = document.uri.toString();
	const key = languageId !== 'html' ? `${originalUri}.${languageId}` : originalUri;

	virtualDocumentContents.set(key, document.getText());

	let path;
	if (virtualDocumentPaths.has(key)) {
		path = virtualDocumentPaths.get(key);
	} else {
		path = `/${encodeURIComponent(key)}/${Math.random()}.${languageId}`;
		virtualDocumentPaths.set(key, path);
	}

	return vscode.Uri.from({
		scheme: 'miki-embedded-content',
		authority: 'miki-template',
		path
	});
}

function clearVirtualDocumentContents() {
	virtualDocumentContents.clear();
	virtualDocumentPaths.clear();
}

function registerVirtualDocumentEvents(context) {
	const disposables = [
		vscode.workspace.onDidChangeTextDocument(event => {
			if (SUPPORTED_LANGUAGES.includes(event.document.languageId)) {
				const key = event.document.uri.toString();
				virtualDocumentContents.delete(key);
				virtualDocumentContents.delete(`${key}.html`);
				virtualDocumentContents.delete(`${key}.css`);
				virtualDocumentContents.delete(`${key}.javascript`);
			}
		}),
		vscode.workspace.onDidCloseTextDocument(doc => {
			if (SUPPORTED_LANGUAGES.includes(doc.languageId)) {
				const key = doc.uri.toString();
				virtualDocumentContents.delete(key);
				virtualDocumentPaths.delete(key);
			}
		}),
		vscode.workspace.onDidRenameFiles(event => {
			event.files.forEach(f => {
				virtualDocumentContents.delete(f.oldUri.toString());
				virtualDocumentPaths.delete(f.oldUri.toString());
			});
		})
	];
	disposables.forEach(d => context.subscriptions.push(d));
}

let customFilters =[];
let customTags =[];
let diagnosticCollection;
let colorDecorationType;
let bracketHighlightDecorations = new Map();

	function debounce(fn, delay) {
		let timer;
return (...args) => {
	clearTimeout(timer);
	timer = setTimeout(() => fn(...args), delay);
};
}

function createCompletionItem(name, info, kind) {
	const item = new vscode.CompletionItem(name, kind);
	item.detail = info.syntax;
	item.documentation = new vscode.MarkdownString(info.doc);
	return item;
}

const TAG_COMPLETIONS = Object.entries(TAGS).map(([name]) => createCompletionItem(name, TAGS[name], vscode.CompletionItemKind.Keyword));
const FILTER_COMPLETIONS = Object.entries(FILTERS).map(([name]) => createCompletionItem(name, FILTERS[name], vscode.CompletionItemKind.Function));
const FORLOOP_COMPLETIONS = FORLOOP_VARS.map(v => {
	const item = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
	item.detail = v.name;
	item.documentation = v.doc;
	return item;
});

function isInsideForLoop(document, position) {
	const textBefore = document.getText(new vscode.Range(0, 0, position.line, position.character));
	const forMatch = textBefore.match(/\{%-?\s*for\s+\S+\s+in\s+[^\}]*$/);
	const endforMatch = textBefore.match(/\{%-?\s*endfor\s/);
	if (forMatch && (!endforMatch || forMatch.index > endforMatch.index)) {
		return true;
	}
	return false;
}

function scanForCustomTagsAndFilters(workspaceFolder) {
	if (!workspaceFolder) return;

	const configFiles = [
		path.join(workspaceFolder, 'miki-template.config.js'),
		path.join(workspaceFolder, 'miki-template.config.json'),
		path.join(workspaceFolder, '.mikirc'),
		path.join(workspaceFolder, 'package.json'),
	];

	for (const configFile of configFiles) {
		try {
			if (fs.existsSync(configFile)) {
				const content = fs.readFileSync(configFile, 'utf8');
				if (configFile.endsWith('.json')) {
					const config = JSON.parse(content);
					if (config.filters) customFilters = [...customFilters, ...config.filters];
					if (config.tags) customTags = [...customTags, ...config.tags];
					if (config.mikiTemplate && config.mikiTemplate.filters) {
						customFilters = [...customFilters, ...config.mikiTemplate.filters];
					}
				} else if (configFile.endsWith('.js')) {
					const match = content.match(/registerFilter\s*\(\s*['"](\w+)['"]/g);
					if (match) {
						match.forEach(m => {
							const name = m.match(/['"](\w+)['"]/)[1];
							if (!customFilters.includes(name)) customFilters.push(name);
						});
					}
				}
			}
		} catch (e) { }
	}
}

function getAllReferences(word, workspaceFolder) {
	const references = [];
	if (!workspaceFolder) return references;

	function searchInFolder(folder) {
		try {
			const entries = fs.readdirSync(folder, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(folder, entry.name);
				if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
					searchInFolder(fullPath);
				} else if (entry.isFile() && TEMPLATE_EXTENSIONS.test(entry.name)) {
					try {
						const content = fs.readFileSync(fullPath, 'utf8');
						const lines = content.split('\n');
						lines.forEach((line, idx) => {
							if (line.includes(word)) {
								references.push(new vscode.Location(
									vscode.Uri.file(fullPath),
									new vscode.Range(idx, 0, idx, line.length)
								));
							}
						});
					} catch (e) { }
				}
			}
		} catch (e) { }
	}

	searchInFolder(workspaceFolder.uri.fsPath);
	return references;
}

function findTemplateFiles(workspaceFolder) {
	const results = [];
	if (!workspaceFolder) return results;

	function search(folder) {
		try {
			const entries = fs.readdirSync(folder, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(folder, entry.name);
				if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
					search(fullPath);
				} else if (entry.isFile() && TEMPLATE_EXTENSIONS.test(entry.name)) {
					const relativePath = path.relative(workspaceFolder.uri.fsPath, fullPath).replace(/\\/g, '/');
					results.push({
						label: entry.name,
						detail: relativePath,
						fsPath: fullPath,
						relativePath: relativePath
					});
				}
			}
		} catch (e) { }
	}

	search(workspaceFolder.uri.fsPath);
	return results.sort((a, b) => a.label.localeCompare(b.label));
}

function activate(context) {
	const config = vscode.workspace.getConfiguration('miki-template');

	diagnosticCollection = vscode.languages.createDiagnosticCollection('miki-template');

	registerVirtualDocumentEvents(context);

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	scanForCustomTagsAndFilters(workspaceFolder);

	const customFilterCompletions = customFilters.map(name => {
		const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
		item.detail = `{{ value|${name} }}`;
		item.documentation = `Custom filter: ${name}`;
		return item;
	});

	const customTagCompletions = customTags.map(name => {
		const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
		item.detail = `{% ${name} %}`;
		item.documentation = `Custom tag: ${name}`;
		return item;
	});

	// Completion Provider with Path Completions
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		SUPPORTED_LANGUAGES,
		{
			async provideCompletionItems(document, position, token, context) {
				if (!config.get('enableCompletions', true)) return [];

				const line = document.lineAt(position).text;
				const beforeCursor = line.substring(0, position.character);
				const allCompletions = [];

				if (beforeCursor.match(/\{%\s*$/)) {
					allCompletions.push(...TAG_COMPLETIONS, ...customTagCompletions);
					return allCompletions;
				}

				if (beforeCursor.match(/\{%\s*load\s+/) && !beforeCursor.match(/\{%\s*load\s+\S+\s+\S+/)) {
					return ['i18n', 'humanize', 'cache', 'lorem'].map(
						lib => new vscode.CompletionItem(lib, vscode.CompletionItemKind.Module)
					);
				}

				// Path completions for include "..." and extends "..."
				const pathMatch = beforeCursor.match(/\{%-?\s*(include|extends)\s+["']?([\w/.-]*)$/);
				if (pathMatch) {
					const files = findTemplateFiles(workspaceFolder);
					const partial = pathMatch[2] || '';
					const filtered = files.filter(f =>
						f.label.toLowerCase().includes(partial.toLowerCase()) ||
						f.relativePath.toLowerCase().includes(partial.toLowerCase())
					);
					return filtered.map(f => {
						const item = new vscode.CompletionItem(f.label, vscode.CompletionItemKind.File);
						item.detail = f.relativePath;
						item.insertText = `"${f.relativePath}" `;
						return item;
					});
				}

				if (beforeCursor.match(/\{\{[^|]*$/)) {
					allCompletions.push(...FILTER_COMPLETIONS, ...customFilterCompletions);
					if (isInsideForLoop(document, position)) {
						allCompletions.push(...FORLOOP_COMPLETIONS);
					}
					return allCompletions;
				}

				if (beforeCursor.match(/\|\s*$/)) {
					allCompletions.push(...FILTER_COMPLETIONS, ...customFilterCompletions);
					return allCompletions;
				}

				// Delegate to HTML/CSS/JS language server for embedded content
				try {
					const vdocUri = createVirtualDoc(document, 'html');
					const vdocCompletions = await vscode.commands.executeCommand(
						'vscode.executeCompletionItemProvider',
						vdocUri,
						position,
						context?.triggerCharacter
					);
					if (vdocCompletions?.items?.length) {
						return vdocCompletions.items;
					}
				} catch (e) {
					// Fallback to empty list if virtual doc completion fails
				}

				return [];
			}
		},
		'{', '%', '|', ' ', '"', "'"
	);

	// Hover Provider
	const hoverProvider = vscode.languages.registerHoverProvider(
		SUPPORTED_LANGUAGES,
		{
			async provideHover(document, position, token) {
				if (!config.get('enableHover', true)) return null;

				const word = document.getText(document.getWordRangeAtPosition(position));

				if (TAGS[word]) {
					const info = TAGS[word];
					return new vscode.Hover(new vscode.MarkdownString(`**\\${word}**\n\n${info.doc}\n\n\`\`\`django\n${info.syntax}\n\`\`\``));
				}

				if (FILTERS[word] || customFilters.includes(word)) {
					const info = FILTERS[word] || { doc: 'Custom filter', syntax: `{{ value|${word} }}` };
					const argsDoc = info.args && info.args.length > 0 ? `\n\n**Arguments:** \`${info.args.join('`, `')}\`` : '';
					return new vscode.Hover(new vscode.MarkdownString(`**${word}**\n\n${info.doc}${argsDoc}\n\n\`\`\`django\n${info.syntax}\n\`\`\``));
				}

				// Hover for block.super
				const wordRange = document.getWordRangeAtPosition(position);
				if (wordRange) {
					const wordAtCursor = document.getText(wordRange);
					if (wordAtCursor === 'block' || wordAtCursor === 'super') {
						const line = document.lineAt(position).text;
						const lineUntilCursor = line.substring(0, position.character);
						if (lineUntilCursor.includes('block.super') || lineUntilCursor.includes('{{ block.')) {
							return new vscode.Hover(new vscode.MarkdownString(`**{{ block.super }}**\n\nRenders the parent template's block content. Use inside a \`{% block %}\` to include parent content.`));
						}
					}
				}

				// Delegate to HTML language server for embedded content hover
				try {
					const vdocUri = createVirtualDoc(document, 'html');
					const hovers = await vscode.commands.executeCommand(
						'vscode.executeHoverProvider',
						vdocUri,
						position
					);
					if (hovers && hovers.length > 0) {
						return hovers[0];
					}
				} catch (e) {
					// Fallback to null if virtual doc hover fails
				}

				return null;
			}
		}
	);

	// Semantic Token Provider
	const tokenTypesSemantic = ['tag', 'variable', 'filter', 'comment', 'string', 'operator'];
	const semanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider(
		SUPPORTED_LANGUAGES,
		{
			provideDocumentSemanticTokens(document) {
				const builder = new vscode.SemanticTokensBuilder();
				const text = document.getText();

				const tagRegex = /\{%-?\s*\w+/g;
				const varRegex = /\{\{[^}]*\}\}/g;
				const commentRegex = /\{#[^}]*#\}/g;

				let match;

				while ((match = tagRegex.exec(text)) !== null) {
					const startPos = document.positionAt(match.index);
					builder.push(startPos.line, startPos.character, match[0].length, 'entity.name.tag', 0);
				}

				while ((match = varRegex.exec(text)) !== null) {
					const startPos = document.positionAt(match.index);
					builder.push(startPos.line, startPos.character, match[0].length, 'variable', 0);
				}

				while ((match = commentRegex.exec(text)) !== null) {
					const startPos = document.positionAt(match.index);
					builder.push(startPos.line, startPos.character, match[0].length, 'comment', 0);
				}

				return builder.build();
			}
		},
		new vscode.SemanticTokensLegend(tokenTypesSemantic, [])
	);

	// Inlay Hints Provider
	const inlayHintsProvider = vscode.languages.registerInlayHintsProvider(
		SUPPORTED_LANGUAGES,
		{
			provideInlayHints(document, range) {
				if (!config.get('enableInlayHints', true)) return [];

				const hints = [];
				const text = document.getText(range);
				const filterArgRegex = /\|(\w+)(?::(["']?)(\w+)\2)?/g;
				let match;

				while ((match = filterArgRegex.exec(text)) !== null) {
					const filterName = match[1];
					if (FILTERS[filterName] && FILTERS[filterName].args && FILTERS[filterName].args.length > 0) {
						const pos = document.positionAt(match.index);
						hints.push(new vscode.InlayHint(`${filterName}:`, vscode.InlayHintKind.Parameter));
					}
				}

				return hints;
			}
		}
	);

	// Definition Provider
	const definitionProvider = vscode.languages.registerDefinitionProvider(
		SUPPORTED_LANGUAGES,
		{
			provideDefinition(document, position) {
				const word = document.getText(document.getWordRangeAtPosition(position));
				if (!['include', 'extends', 'block', 'partial', 'partialdef'].includes(word)) return null;

				const line = document.lineAt(position).text;
				const fileMatch = line.match(/\{%-?\s*(?:include|extends|block|partial|partialdef)\s+["']([^"']+)["']/);
				if (fileMatch) {
					const currentDir = path.dirname(document.uri.fsPath);
					const fileName = fileMatch[1];
					const paths = [
						path.join(currentDir, fileName),
						path.join(currentDir, fileName.replace(/^\//, '')),
						path.join(currentDir, '..', fileName),
						path.join(currentDir, 'templates', fileName),
					];

					for (const fsPath of paths) {
						try {
							if (fs.existsSync(fsPath)) {
								return new vscode.Location(vscode.Uri.file(fsPath), new vscode.Position(0, 0));
							}
						} catch (e) { }
					}
				}
				return null;
			}
		}
	);

	// Rename Provider
	const renameProvider = vscode.languages.registerRenameProvider(
		SUPPORTED_LANGUAGES,
		{
			provideRenameEdits(document, position, newName) {
				const line = document.lineAt(position).text;

				const blockMatch = line.match(/\{%-?\s*block\s+(\w+)/);
				if (!blockMatch) return null;

				const oldBlockName = blockMatch[1];
				const workspaceEdit = new vscode.WorkspaceEdit();

				const fullText = document.getText();
				const blockDefRegex = new RegExp(`\\{%-?\\s*block\\s+${oldBlockName}\\b`, 'g');
				const blockSuperRegex = new RegExp(`\\{\\{[^}]*block\\.${oldBlockName}[^}]*\\}\\}`, 'g');

				let match;
				while ((match = blockDefRegex.exec(fullText)) !== null) {
					const pos = document.positionAt(match.index);
					workspaceEdit.replace(document.uri, new vscode.Range(pos, pos.translate(0, oldBlockName.length)), newName);
				}

				while ((match = blockSuperRegex.exec(fullText)) !== null) {
					const pos = document.positionAt(match.index);
					const text = match[0];
					workspaceEdit.replace(document.uri, new vscode.Range(pos, pos.translate(0, text.length)), text.replace(new RegExp(`block\\.${oldBlockName}`, 'g'), `block.${newName}`));
				}

				if (workspaceFolder) {
					const otherEdits = getBlockRenameEdits(oldBlockName, newName, workspaceFolder, document.uri);
					for (const [uri, edits] of otherEdits.entries()) {
						for (const edit of edits) {
							workspaceEdit.replace(uri, edit.range, edit.newText);
						}
					}
				}

				return workspaceEdit;
			}
		}
	);

	function getBlockRenameEdits(oldBlockName, newBlockName, folder, currentDocUri) {
		const fileEditsMap = new Map();

		function search(dir) {
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);
					if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
						search(fullPath);
					} else if (entry.isFile() && TEMPLATE_EXTENSIONS.test(entry.name)) {
						const uri = vscode.Uri.file(fullPath);
						if (uri.toString() === currentDocUri.toString()) continue;

						try {
							const content = fs.readFileSync(fullPath, 'utf8');
							if (content.includes(`block.${oldBlockName}`) || content.includes(`{% block ${oldBlockName}`)) {
								const edits = [];
								const blockSuperRegex = new RegExp(`block\\.${oldBlockName}`, 'g');
								const blockDefRegex = new RegExp(`\\{%-?\\s*block\\s+${oldBlockName}\\b`, 'g');

								let match;

								while ((match = blockSuperRegex.exec(content)) !== null) {
									const pos = new vscode.Position(0, 0).translate(0, match.index);
									edits.push(new vscode.TextEdit(new vscode.Range(pos, pos.translate(0, match[0].length)), `block.${newBlockName}`));
								}

								while ((match = blockDefRegex.exec(content)) !== null) {
									const pos = new vscode.Position(0, 0).translate(0, match.index);
									edits.push(new vscode.TextEdit(new vscode.Range(pos, pos.translate(0, match[0].length)), `{% block ${newBlockName}`));
								}

								if (edits.length > 0) {
									fileEditsMap.set(uri, edits);
								}
							}
						} catch (e) { }
					}
				}
			} catch (e) { }
		}

		search(folder.uri.fsPath);
		return fileEditsMap;
	}

	// Document Symbol Provider
	const symbolProvider = vscode.languages.registerDocumentSymbolProvider(
		SUPPORTED_LANGUAGES,
		{
			provideDocumentSymbols(document) {
				const symbols = [];
				const lines = document.getText().split('\n');

				lines.forEach((line, index) => {
					const range = new vscode.Range(index, 0, index, line.length);

					const blockMatch = line.match(/\{%-?\s*block\s+(\w+)/);
					if (blockMatch) symbols.push(new vscode.SymbolInformation(blockMatch[1], vscode.SymbolKind.Method, range, document.uri));

					const extendsMatch = line.match(/\{%-?\s*extends\s+["']([^"']+)["']/);
					if (extendsMatch) symbols.push(new vscode.SymbolInformation(`↳ ${extendsMatch[1]}`, vscode.SymbolKind.Class, range, document.uri));

					const includeMatch = line.match(/\{%-?\s*include\s+["']([^"']+)["']/);
					if (includeMatch) symbols.push(new vscode.SymbolInformation(`⊂ ${includeMatch[1]}`, vscode.SymbolKind.Reference, range, document.uri));

					const partialdefMatch = line.match(/\{%-?\s*partialdef\s+(\w+)/);
					if (partialdefMatch) symbols.push(new vscode.SymbolInformation(`§ ${partialdefMatch[1]}`, vscode.SymbolKind.Function, range, document.uri));
				});

				return symbols;
			}
		}
	);

	// Selection Range Provider
	const selectionRangeProvider = vscode.languages.registerSelectionRangeProvider(
		SUPPORTED_LANGUAGES,
		{
			provideSelectionRanges(document, positions) {
				const results = [];
				for (const pos of positions) {
					const ranges = [];
					const line = document.lineAt(pos.line).text;

					const tagMatch = line.match(/\{%-?\s*(\w+)[^}]*%\}[\s\S]*\{%-?\s*end\1\s*%/);
					if (tagMatch) {
						const startIdx = line.indexOf(tagMatch[0]);
						const endIdx = startIdx + tagMatch[0].length;
						ranges.push(new vscode.SelectionRange(new vscode.Range(pos.line, startIdx, pos.line, endIdx)));
					}

					const varMatch = line.match(/\{\{[\s\S]*?\}\}/);
					if (varMatch && pos.character >= line.indexOf(varMatch[0]) && pos.character <= line.indexOf(varMatch[0]) + varMatch[0].length) {
						const startIdx = line.indexOf(varMatch[0]);
						const endIdx = startIdx + varMatch[0].length;
						ranges.push(new vscode.SelectionRange(new vscode.Range(pos.line, startIdx, pos.line, endIdx)));
					}

					ranges.push(new vscode.SelectionRange(new vscode.Range(pos, pos)));
					results.push(ranges);
				}
				return results;
			}
		}
	);

	// References Provider
	const referencesProvider = vscode.languages.registerReferencesProvider(
		SUPPORTED_LANGUAGES,
		{
			provideReferences(document, position, context) {
				const line = document.lineAt(position).text;
				const results = [];

				const blockDefMatch = line.match(/\{%-?\s*block\s+(\w+)/);
				if (blockDefMatch) {
					const blockName = blockDefMatch[1];
					results.push(...getAllReferences(`block.super`, workspaceFolder));
					results.push(...getAllReferences(`{{ block.${blockName} }}`, workspaceFolder));
				}

				const includeMatch = line.match(/\{%-?\s*include\s+["']([^"']+)["']/);
				if (includeMatch) {
					const fileName = includeMatch[1];
					results.push(...getAllReferences(`include "${fileName}"`, workspaceFolder));
					results.push(...getAllReferences(`include '${fileName}'`, workspaceFolder));
				}

				return results;
			}
		}
	);

	// Code Actions Provider
	const codeActionsProvider = vscode.languages.registerCodeActionsProvider(
		SUPPORTED_LANGUAGES,
		{
			provideCodeActions(document, range, context) {
				if (!config.get('enableCodeActions', true)) return [];

				const actions = [];
				const line = document.lineAt(range.start.line).text;

				const openIfs = (line.match(/\{%-?\s*if\b/g) || []).length;
				const closeIfs = (line.match(/\{%-?\s*endif\b/g) || []).length;
				if (openIfs > closeIfs) {
					actions.push(new vscode.CodeAction('Add missing {% endif %}', { command: 'type', arguments: ['{% endif %}'] }, vscode.CodeActionKind.QuickFix));
				}

				const openFors = (line.match(/\{%-?\s*for\b/g) || []).length;
				const closeFors = (line.match(/\{%-?\s*endfor\b/g) || []).length;
				if (openFors > closeFors) {
					actions.push(new vscode.CodeAction('Add missing {% endfor %}', { command: 'type', arguments: ['{% endfor %}'] }, vscode.CodeActionKind.QuickFix));
				}

				if (line.includes('{{') && !line.includes('{% block')) {
					const action = new vscode.CodeAction('Wrap in {% block %}');
					action.command = { command: 'miki-template.wrapInBlock', title: 'Wrap in Block' };
					actions.push(action);
				}

				return actions;
			}
		}
	);

	// Color Decorations
	function updateColorDecorations(document) {
		if (!config.get('enableColorDecorations', true)) {
			if (colorDecorationType) {
				colorDecorationType.dispose();
				colorDecorationType = null;
			}
			return;
		}

		if (!colorDecorationType) {
			colorDecorationType = vscode.window.createTextEditorDecorationType({
				backgroundColor: new vscode.ThemeColor('editor.wordHighlightBackground'),
				borderRadius: '2px'
			});
		}

		const editors = vscode.window.visibleTextEditors.filter(e => e.document === document);
		const decorations = [];

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			let match;
			const regex = new RegExp(COLOR_REGEX);
			while ((match = regex.exec(line.text)) !== null) {
				decorations.push({
					range: new vscode.Range(i, match.index, i, match.index + match[0].length)
				});
			}
		}

		editors.forEach(editor => editor.setDecorations(colorDecorationType, decorations));
	}

	// Bracket Matching Highlights
	function updateBracketHighlights(document) {
		if (!config.get('enableBracketHighlight', true)) {
			bracketHighlightDecorations.forEach(d => d.dispose());
			bracketHighlightDecorations.clear();
			return;
		}

		const decorations = [];
		const text = document.getText();

		for (let i = 0; i < text.length; i++) {
			if (text.substring(i, i + 2) === '{%') {
				const endIdx = text.indexOf('%}', i);
				if (endIdx !== -1) {
					const tagContent = text.substring(i + 2, endIdx).trim();
				const openMatch = tagContent.match(/^(if|for|with|block|comment|verbatim|spaceless|autoescape|filter|cache|addtoblock|partialdef|blocktrans|language|compress|thumbnail|ifequal|ifnotequal|firstof)\b/);
				const closeMatch = tagContent.match(/^end(if|for|with|block|comment|verbatim|spaceless|autoescape|filter|cache|addtoblock|partialdef|blocktrans|language|compress|thumbnail|equal|notequal|firstof)\b/);

					if (openMatch) {
						decorations.push({
							range: new vscode.Range(document.positionAt(i), document.positionAt(i + 2)),
							options: { color: 'editorBracketHighlight.foreground1' }
						});
					} else if (closeMatch) {
						decorations.push({
							range: new vscode.Range(document.positionAt(i), document.positionAt(i + 2)),
							options: { color: 'editorBracketHighlight.foreground2' }
						});
					}
					i = endIdx + 1;
				}
			}
		}

		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document === document) {
			const decoType = vscode.window.createTextEditorDecorationType({});
			editor.setDecorations(decoType, decorations);
			bracketHighlightDecorations.set(document.uri.toString(), decoType);
		}
	}

	// Validation
	function validateDocument(document) {
		if (!config.get('enableValidation', true)) {
			diagnosticCollection.delete(document.uri);
			return;
		}

		const diagnostics = [];
		const lines = document.getText().split('\n');
		const openTags = [];

		lines.forEach((line, index) => {
			if (line.match(/\{%-?\s*extends\s+["']([^"']+)["']/) && index > 0) {
				const prevContent = lines.slice(0, index).join('').replace(/\s/g, '');
				if (prevContent.match(/\{%/)) {
					diagnostics.push(new vscode.Diagnostic(
						new vscode.Range(index, 0, index, line.length),
						'{% extends %} must be the first tag',
						vscode.DiagnosticSeverity.Warning
					));
				}
			}

			const openTagMatch = line.match(/\{%-?\s*(if|elif|for|with|block|comment|verbatim|spaceless|autoescape|filter|cache|addtoblock|partialdef|blocktrans|language|compress|thumbnail|ifequal|ifnotequal)\b[^}]*%}/g);
			if (openTagMatch) {
				openTagMatch.forEach(tag => {
					const nameMatch = tag.match(/\{%-?\s*(\w+)/);
					if (nameMatch && !['elif', 'empty', 'else', 'plural'].includes(nameMatch[1])) {
						openTags.push({ name: nameMatch[1], line: index + 1 });
					}
				});
			}

			const closeTagMatch = line.match(/\{%-?\s*end(if|elif|for|with|block|comment|verbatim|spaceless|autoescape|filter|cache|addtoblock|partialdef|blocktrans|language|compress|thumbnail|equal|notequal)\b[^}]*%}/g);
			if (closeTagMatch) {
				closeTagMatch.forEach(tag => {
					const nameMatch = tag.match(/\{%-?\s*end(\w+)/);
					if (nameMatch) {
						const idx = openTags.findIndex(t => t.name === nameMatch[1]);
						if (idx !== -1) openTags.splice(idx, 1);
					}
				});
			}
		});

		for (const tag of openTags) {
			if (!['empty', 'else', 'elif', 'plural'].includes(tag.name)) {
				diagnostics.push(new vscode.Diagnostic(
					new vscode.Range(tag.line - 1, 0, tag.line - 1, 100),
					`Unclosed tag: {% ${tag.name} %}`,
					vscode.DiagnosticSeverity.Warning
				));
			}
		}

		diagnosticCollection.set(document.uri, diagnostics);
	}

	const debouncedValidate = debounce(validateDocument, 300);
	const debouncedColorUpdate = debounce(updateColorDecorations, 200);
	const debouncedBracketUpdate = debounce(updateBracketHighlights, 200);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (SUPPORTED_LANGUAGES.includes(event.document.languageId)) {
				debouncedValidate(event.document);
				debouncedColorUpdate(event.document);
				debouncedBracketUpdate(event.document);
			}
		}),
		vscode.workspace.onDidOpenTextDocument(document => {
			if (SUPPORTED_LANGUAGES.includes(document.languageId)) {
				validateDocument(document);
				updateColorDecorations(document);
				updateBracketHighlights(document);
			}
		}),
		vscode.window.onDidChangeVisibleTextEditors(editors => {
			editors.forEach(editor => {
				if (SUPPORTED_LANGUAGES.includes(editor.document.languageId)) {
					updateColorDecorations(editor.document);
					updateBracketHighlights(editor.document);
				}
			});
		})
	);

	// Smart Paste
	context.subscriptions.push(
		vscode.workspace.onWillPaste(async e => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			if (!SUPPORTED_LANGUAGES.includes(editor.document.languageId)) return;
			if (!config.get('enableSmartPaste', true)) return;

			const pasteText = e.text;
			const hasHtml = /<[a-z][\s\S]*>/i.test(pasteText);

			if (hasHtml && !pasteText.includes('|safe') && !pasteText.includes('|escape')) {
				e.text = pasteText + '|safe';
			}
		})
	);

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('miki-template.validateAll', () => {
			vscode.workspace.textDocuments.forEach(doc => {
				if (SUPPORTED_LANGUAGES.includes(doc.languageId)) {
					validateDocument(doc);
				}
			});
			vscode.window.showInformationMessage('Template validation complete');
		}),

		vscode.commands.registerCommand('miki-template.insertFilter', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			if (selectedText) {
				editor.edit(editBuilder => {
					editBuilder.replace(selection, `{{ ${selectedText}| }}`);
				}).then(() => {
					const newPos = selection.start.translate(0, selectedText.length + 4);
					editor.selection = new vscode.Selection(newPos, newPos);
				});
			}
		}),

		vscode.commands.registerCommand('miki-template.wrapInBlock', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			editor.edit(editBuilder => {
				editBuilder.replace(selection, '{% block ${1:name} %}\n' + selectedText + '\n{% endblock %}');
			});
		}),

		vscode.commands.registerCommand('miki-template.wrapInFor', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			editor.edit(editBuilder => {
				editBuilder.replace(selection, '{% for ${1:item} in ${2:items} %}\n' + selectedText + '\n{% endfor %}');
			});
		}),

		vscode.commands.registerCommand('miki-template.wrapInIf', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			editor.edit(editBuilder => {
				editBuilder.replace(selection, '{% if ${1:condition} %}\n' + selectedText + '\n{% endif %}');
			});
		}),

		vscode.commands.registerCommand('miki-template.addPrettierIgnore', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const line = editor.selection.start.line;
			editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(line, 0), '{# prettier-ignore #}\n');
			});
		}),

		vscode.commands.registerCommand('miki-template.goToNextBlock', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const doc = editor.document;
			const pos = editor.selection.active;
			for (let i = pos.line + 1; i < doc.lineCount; i++) {
				if (doc.lineAt(i).text.includes('{% block ')) {
					editor.selection = new vscode.Selection(i, 0, i, 0);
					editor.revealRange(new vscode.Range(i, 0, i, 0));
					return;
				}
			}
		}),

		vscode.commands.registerCommand('miki-template.goToPrevBlock', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const doc = editor.document;
			const pos = editor.selection.active;
			for (let i = pos.line - 1; i >= 0; i--) {
				if (doc.lineAt(i).text.includes('{% block ')) {
					editor.selection = new vscode.Selection(i, 0, i, 0);
					editor.revealRange(new vscode.Range(i, 0, i, 0));
					return;
				}
			}
		}),

		vscode.commands.registerCommand('miki-template.previewTemplate', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const content = editor.document.getText();
			const panel = vscode.window.createWebviewPanel('templatePreview', 'Template Preview', vscode.ViewColumn.Two);
			const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui;padding:20px;background:#1e1e1e;color:#d4d4d4}</style></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
			panel.webview.html = htmlContent;
		}),

		vscode.commands.registerCommand('miki-template.showOutline', async () => {
			const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', vscode.window.activeTextEditor.document.uri);
			if (symbols && symbols.length > 0) {
				const items = symbols.map(s => ({ label: s.name, detail: vscode.SymbolKind[s.kind] }));
				const selected = await vscode.window.showQuickPick(items);
				if (selected) {
					const symbol = symbols.find(s => s.name === selected.label);
					if (symbol) {
						const range = symbol.location.range;
						vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.start);
						vscode.window.activeTextEditor.revealRange(range);
					}
				}
			}
		}),

		vscode.commands.registerCommand('miki-template.findBlockReferences', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;
			const refs = await vscode.commands.executeCommand('vscode.executeReferenceProvider', editor.document.uri, editor.selection.active);
			if (refs && refs.length > 0) {
				await vscode.commands.executeCommand('editor.action.showReferences', editor.document.uri, editor.selection.active, refs);
			}
		})
	);

	// Register Document Formatting Provider
	const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider(
		SUPPORTED_LANGUAGES,
		{
			provideDocumentFormattingEdits: async (document, options, token) => {
				try {
					const formatter = new MikiTemplateFormatter(diagnosticCollection);
					return await formatter.provideDocumentFormattingEdits(document, options, token);
				} catch (error) {
					console.error('Formatting error:', error);
					return [];
				}
			}
		}
	);

	context.subscriptions.push(formattingProvider);

	context.subscriptions.push(
		completionProvider,
		hoverProvider,
		semanticTokensProvider,
		inlayHintsProvider,
		definitionProvider,
		renameProvider,
		symbolProvider,
		selectionRangeProvider,
		referencesProvider,
		codeActionsProvider
	);
}

function deactivate() {
	if (diagnosticCollection) diagnosticCollection.clear();
	if (colorDecorationType) colorDecorationType.dispose();
	bracketHighlightDecorations.forEach(d => d.dispose());
}

module.exports = { activate, deactivate };
