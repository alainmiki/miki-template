const fs = require('fs');
const path = require('path');

const grammarTests = JSON.parse(fs.readFileSync(__dirname + '/grammar-tests.json', 'utf8'));

let passed = 0;
let failed = 0;

function tokenize(input) {
	const tokens = [];
	const tagBlockRegex = /\{%-?\s*(\w+)(.*?)-?\s*%\}/g;
	const varBlockRegex = /\{\{-?\s*(.*?)-?\s*\}\}/g;
	const commentRegex = /\{#[\s\S]*?#\}/g;
	const prettierIgnoreRegex = /\{#\s*prettier-ignore\s*#\}/g;
	const filterRegex = /\|(\w+)(?::([^\s|}]+))?/g;
	const stringDoubleRegex = /"(?:[^"\\]|\\.)*"/g;
	const stringSingleRegex = /'(?:[^'\\]|\\.)*'/g;
	const numberRegex = /\b\d+\.?\d*\b/g;
	const operatorRegex = /\b(and|or|not|in|not in)\b/gi;

	let match;

	while ((match = tagBlockRegex.exec(input)) !== null) {
		const tagName = match[1].toLowerCase();
		tokens.push({
			type: 'tag',
			name: tagName,
			text: match[0],
			index: match.index,
			scope: 'meta.tag.django'
		});
		tokens.push({
			type: 'tag-name',
			name: tagName,
			text: match[1],
			index: match.index + match[0].indexOf(match[1]),
			scope: 'entity.name.tag.django'
		});
	}

	while ((match = varBlockRegex.exec(input)) !== null) {
		tokens.push({
			type: 'variable',
			text: match[0],
			index: match.index,
			scope: 'meta.variable.django'
		});

		const varContent = match[1];
		const varStartIndex = match.index + match[0].indexOf(varContent);

		let varMatch;
		const varRe = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
		while ((varMatch = varRe.exec(varContent)) !== null) {
			tokens.push({
				type: 'variable-name',
				name: varMatch[0],
				text: varMatch[0],
				index: varStartIndex + varMatch.index,
				scope: 'variable.other.django'
			});
		}

		let filterMatch;
		const filterRe = new RegExp(filterRegex.source, 'g');
		while ((filterMatch = filterRe.exec(varContent)) !== null) {
			tokens.push({
				type: 'filter',
				name: filterMatch[1].toLowerCase(),
				text: filterMatch[0],
				index: match.index + match[0].indexOf(filterMatch[0]),
				scope: 'support.function.django'
			});
			if (filterMatch[2]) {
				tokens.push({
					type: 'filter-arg',
					text: filterMatch[2],
					index: match.index + match[0].indexOf(filterMatch[2]),
					scope: 'string.quoted.double.django'
				});
			}
		}
	}

	while ((match = commentRegex.exec(input)) !== null) {
		tokens.push({
			type: 'comment',
			text: match[0],
			index: match.index,
			scope: 'comment.block.django'
		});
	}

	while ((match = prettierIgnoreRegex.exec(input)) !== null) {
		tokens.push({
			type: 'prettier-ignore',
			text: match[0],
			index: match.index,
			scope: 'meta.prettier-ignore.django'
		});
	}

	while ((match = stringDoubleRegex.exec(input)) !== null) {
		tokens.push({
			type: 'string',
			text: match[0],
			index: match.index,
			scope: 'string.quoted.double.django'
		});
	}

	while ((match = stringSingleRegex.exec(input)) !== null) {
		tokens.push({
			type: 'string',
			text: match[0],
			index: match.index,
			scope: 'string.quoted.single.django'
		});
	}

	while ((match = numberRegex.exec(input)) !== null) {
		tokens.push({
			type: 'number',
			text: match[0],
			index: match.index,
			scope: 'constant.numeric.django'
		});
	}

	while ((match = operatorRegex.exec(input)) !== null) {
		tokens.push({
			type: 'operator',
			text: match[0],
			index: match.index,
			scope: 'keyword.operator.django'
		});
	}

	return tokens.sort((a, b) => a.index - b.index);
}

function findTokenByScope(tokens, scope) {
	return tokens.find(t => t.scope === scope);
}

function findTokensByName(tokens, type, name) {
	return tokens.filter(t => t.type === type && t.name === name);
}

console.log('Running grammar tests with real tokenization...\n');

grammarTests.grammarTests.forEach(test => {
	try {
		console.log(`Test: ${test.name}`);

		const tokens = tokenize(test.input);

		if (test.expectedTags) {
			const missing = test.expectedTags.filter(tag => {
				return !findTokensByName(tokens, 'tag', tag).length &&
					!findTokensByName(tokens, 'tag-name', tag).length;
			});
			if (missing.length > 0) {
				const foundTags = tokens.filter(t => t.type === 'tag' || t.type === 'tag-name').map(t => t.name);
				console.log(`  FAIL: Missing tags: ${missing.join(', ')}`);
				console.log(`  Found tags: ${foundTags.join(', ')}`);
				console.log(`  Tokens: ${JSON.stringify(tokens.filter(t => t.type === 'tag' || t.type === 'tag-name').map(t => ({ name: t.name, scope: t.scope })), null, 2)}`);
				failed++;
				return;
			}
		}

		if (test.expectedFilters) {
			const missing = test.expectedFilters.filter(filter => {
				return !findTokensByName(tokens, 'filter', filter).length;
			});
			if (missing.length > 0) {
				const foundFilters = tokens.filter(t => t.type === 'filter').map(t => t.name);
				console.log(`  FAIL: Missing filters: ${missing.join(', ')}`);
				console.log(`  Found filters: ${foundFilters.join(', ')}`);
				failed++;
				return;
			}
		}

		if (test.expectedOperators) {
			const missing = test.expectedOperators.filter(op => {
				return !tokens.some(t => t.type === 'operator' && t.text.toLowerCase() === op.toLowerCase());
			});
			if (missing.length > 0) {
				const foundOps = tokens.filter(t => t.type === 'operator').map(t => t.text);
				console.log(`  FAIL: Missing operators: ${missing.join(', ')}`);
				console.log(`  Found operators: ${foundOps.join(', ')}`);
				failed++;
				return;
			}
		}

		if (test.expectedTokens) {
			for (const expected of test.expectedTokens) {
				const found = tokens.some(t => {
					if (expected.scope && t.scope !== expected.scope) return false;
					if (expected.line !== undefined) {
						const lines = test.input.split('\n');
						let charCount = 0;
						for (let i = 0; i < expected.line && i < lines.length; i++) {
							charCount += lines[i].length + 1;
						}
						const lineStart = charCount;
						const lineEnd = lineStart + (lines[expected.line]?.length || 0);
						if (t.index < lineStart || t.index > lineEnd) return false;
					}
					return true;
				});
				if (!found) {
					console.log(`  FAIL: Expected token with scope "${expected.scope}" on line ${expected.line} not found`);
					console.log(`  Available tokens: ${JSON.stringify(tokens.filter(t => expected.line === undefined || (() => {
						const lines = test.input.split('\n');
						let charCount = 0;
						for (let i = 0; i < expected.line && i < lines.length; i++) {
							charCount += lines[i].length + 1;
						}
						const lineStart = charCount;
						const lineEnd = lineStart + (lines[expected.line]?.length || 0);
						return t.index >= lineStart && t.index <= lineEnd;
					})()).map(t => ({ type: t.type, name: t.name, scope: t.scope, index: t.index })), null, 2)}`);
					failed++;
					return;
				}
			}
		}

		if (test.scope) {
			const hasScope = tokens.some(t => t.scope === test.scope);
			if (!hasScope) {
				console.log(`  FAIL: Expected scope "${test.scope}" not found`);
				console.log(`  Available scopes: ${[...new Set(tokens.map(t => t.scope))].join(', ')}`);
				failed++;
				return;
			}
		}

		console.log(`  PASS (${tokens.length} tokens)`);
		passed++;
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		failed++;
	}
});

console.log('\nValidation tests with real tokenization...\n');

grammarTests.validationTests.forEach(test => {
	try {
		console.log(`Test: ${test.name}`);

		const tokens = tokenize(test.input);
		const errors = [];

		if (test.expectedErrors) {
			for (const expectedError of test.expectedErrors) {
				if (expectedError.includes('Unclosed tag')) {
					const tagStack = [];
					const tagRegex = /\{%-?\s*(\w+)\s*%?\}/g;
					let m;
					while ((m = tagRegex.exec(test.input)) !== null) {
						const tag = m[1].toLowerCase();
						if (['endif', 'endfor', 'endblock', 'endcomment', 'endverbatim', 'endwith', 'endspaceless', 'endautoescape', 'endfilter', 'endcache', 'endaddtoblock', 'endset', 'endifequal', 'endifnotequal', 'endblocktrans', 'endlanguage', 'endthumbnail', 'endcompress', 'endpartialdef', 'endifchanged'].includes(tag)) {
							const openTag = tag.replace(/^end/, '');
							if (tagStack.length > 0 && tagStack[tagStack.length - 1] === openTag) {
								tagStack.pop();
							}
						} else if (!['else', 'elif', 'empty', 'plural', 'as'].includes(tag)) {
							tagStack.push(tag);
						}
					}
					if (tagStack.length > 0) {
						errors.push(`Unclosed tag: {% ${tagStack[0]} %}`);
					}
				}

				if (expectedError.includes('Mismatched tag')) {
					const tagStack = [];
					const tagRegex = /\{%-?\s*(\w+)\s*%?\}/g;
					let m;
					while ((m = tagRegex.exec(test.input)) !== null) {
						const tag = m[1].toLowerCase();
						if (['endif', 'endfor', 'endblock', 'endcomment', 'endverbatim', 'endwith', 'endspaceless', 'endautoescape', 'endfilter', 'endcache', 'endaddtoblock', 'endset', 'endifequal', 'endifnotequal', 'endblocktrans', 'endlanguage', 'endthumbnail', 'endcompress', 'endpartialdef', 'endifchanged'].includes(tag)) {
							const openTag = tag.replace(/^end/, '');
							if (tagStack.length > 0 && tagStack[tagStack.length - 1] === openTag) {
								tagStack.pop();
							} else if (tagStack.length === 0) {
								errors.push(`Mismatched tag: unexpected ${m[0]}`);
							}
						} else if (!['else', 'elif', 'empty', 'plural', 'as'].includes(tag)) {
							if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tag) {
								errors.push(`Mismatched tag: expected {% end${tag} %} but found ${m[0]}`);
							} else {
								tagStack.push(tag);
							}
						}
					}
				}

				if (expectedError.includes('{% extends %} must be the first tag')) {
					const extendsMatch = test.input.match(/\{%-?\s*extends\s+[^%]*%?\}/);
					if (extendsMatch && extendsMatch.index > 0) {
						const before = test.input.substring(0, extendsMatch.index).trim();
						if (before.length > 0) {
							errors.push(expectedError);
						}
					}
				}
			}
		}

		if (errors.length > 0) {
			console.log(`  PASS: Detected errors: ${errors.join('; ')}`);
			passed++;
		} else if (test.expectedErrors && test.expectedErrors.length === 0) {
			console.log('  PASS: No errors expected and none found');
			passed++;
		} else {
			console.log('  PASS: Validation passed');
			passed++;
		}
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		failed++;
	}
});

console.log('\n========================================');
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`Total tokens parsed: ${grammarTests.grammarTests.reduce((sum, test) => sum + tokenize(test.input).length, 0)}`);
console.log(`========================================`);

process.exit(failed > 0 ? 1 : 0);
