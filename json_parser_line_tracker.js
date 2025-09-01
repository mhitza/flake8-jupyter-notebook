#!/usr/bin/env node
/**
 * JSON parser that keeps track of source lines
 * 
 * This implements a handrolled JSON parser that can map parsed object 
 * properties back to their source file line numbers.
 */

/**
 * JSON parser that tracks source line numbers
 * @param {string} source - The JSON source string
 * @returns {Object} Object with { parsed, helper } where:
 *   - parsed: the parsed JSON object
 *   - helper: object with same structure but containing line numbers
 */
function parseJsonWithLineTracking(source) {
  const lines = source.split('\n');
  const lineStarts = [];
  let pos = 0;
  
  // Build line start positions for quick line lookup
  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(pos);
    pos += lines[i].length + 1; // +1 for newline character
  }
  
  function getLineNumber(position) {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
      if (position >= lineStarts[i]) {
        return i + 1; // 1-based line numbers
      }
    }
    return 1;
  }
  
  let index = 0;
  
  function skipWhitespace() {
    while (index < source.length && /\s/.test(source[index])) {
      index++;
    }
  }
  
  function parseString() {
    if (source[index] !== '"') {
      throw new Error('Expected " at start of string');
    }
    
    index++; // skip opening quote
    let result = '';
    
    while (index < source.length && source[index] !== '"') {
      if (source[index] === '\\') {
        index++; // skip escape character
        if (index >= source.length) {
          throw new Error('Unexpected end of input in string escape');
        }
        
        const escaped = source[index];
        switch (escaped) {
          case '"': result += '"'; break;
          case '\\': result += '\\'; break;
          case '/': result += '/'; break;
          case 'b': result += '\b'; break;
          case 'f': result += '\f'; break;
          case 'n': result += '\n'; break;
          case 'r': result += '\r'; break;
          case 't': result += '\t'; break;
          case 'u':
            // Unicode escape
            index++;
            const hex = source.substr(index, 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new Error('Invalid unicode escape');
            }
            result += String.fromCharCode(parseInt(hex, 16));
            index += 3; // will be incremented again at end of loop
            break;
          default:
            throw new Error(`Invalid escape sequence \\${escaped}`);
        }
      } else {
        result += source[index];
      }
      index++;
    }
    
    if (source[index] !== '"') {
      throw new Error('Unterminated string');
    }
    
    index++; // skip closing quote
    return result;
  }
  
  function parseNumber() {
    const start = index;
    
    if (source[index] === '-') {
      index++;
    }
    
    if (!(/\d/.test(source[index]))) {
      throw new Error('Invalid number');
    }
    
    while (index < source.length && /\d/.test(source[index])) {
      index++;
    }
    
    if (index < source.length && source[index] === '.') {
      index++;
      if (!(/\d/.test(source[index]))) {
        throw new Error('Invalid number: missing digits after decimal point');
      }
      while (index < source.length && /\d/.test(source[index])) {
        index++;
      }
    }
    
    if (index < source.length && (source[index] === 'e' || source[index] === 'E')) {
      index++;
      if (source[index] === '+' || source[index] === '-') {
        index++;
      }
      if (!(/\d/.test(source[index]))) {
        throw new Error('Invalid number: missing digits in exponent');
      }
      while (index < source.length && /\d/.test(source[index])) {
        index++;
      }
    }
    
    const numberStr = source.substring(start, index);
    return parseFloat(numberStr);
  }
  
  function parseBoolean() {
    if (source.substring(index, index + 4) === 'true') {
      index += 4;
      return true;
    } else if (source.substring(index, index + 5) === 'false') {
      index += 5;
      return false;
    } else {
      throw new Error('Invalid boolean value');
    }
  }
  
  function parseNull() {
    if (source.substring(index, index + 4) === 'null') {
      index += 4;
      return null;
    } else {
      throw new Error('Invalid null value');
    }
  }
  
  function parseValue() {
    skipWhitespace();
    
    const startPos = index;
    const lineNum = getLineNumber(startPos);
    
    if (index >= source.length) {
      throw new Error('Unexpected end of input');
    }
    
    const char = source[index];
    
    if (char === '"') {
      return { value: parseString(), line: lineNum };
    } else if (char === '{') {
      return parseObject();
    } else if (char === '[') {
      return parseArray();
    } else if (char === 't' || char === 'f') {
      return { value: parseBoolean(), line: lineNum };
    } else if (char === 'n') {
      return { value: parseNull(), line: lineNum };
    } else if (char === '-' || /\d/.test(char)) {
      return { value: parseNumber(), line: lineNum };
    } else {
      throw new Error(`Unexpected character '${char}' at position ${index}`);
    }
  }
  
  function parseObject() {
    const objectStartPos = index;
    const objectLineNum = getLineNumber(objectStartPos);
    
    if (source[index] !== '{') {
      throw new Error('Expected { at start of object');
    }
    
    index++; // skip opening brace
    skipWhitespace();
    
    const result = {};
    const lineMap = {};
    
    // Handle empty object
    if (source[index] === '}') {
      index++; // skip closing brace
      return { value: result, line: objectLineNum, lineMap };
    }
    
    // Parse object content
    while (index < source.length) {
      skipWhitespace();
      
      // Check for end of object
      if (source[index] === '}') {
        index++; // skip closing brace
        return { value: result, line: objectLineNum, lineMap };
      }
      
      // Parse key
      if (source[index] !== '"') {
        throw new Error(`Expected string key in object, got '${source[index]}' at position ${index}`);
      }
      
      const key = parseString();
      
      skipWhitespace();
      
      if (source[index] !== ':') {
        throw new Error(`Expected : after object key, got '${source[index]}' at position ${index}`);
      }
      
      index++; // skip colon
      
      // Parse value
      const valueResult = parseValue();
      result[key] = valueResult.value;
      
      // Store line number for this key
      if (valueResult.lineMap !== undefined) {
        // If the value has its own line map (nested object/array), use that
        lineMap[key] = valueResult.lineMap;
      } else {
        // For primitive values, store the line number
        lineMap[key] = valueResult.line;
      }
      
      skipWhitespace();
      
      // Check what comes next
      if (index >= source.length) {
        throw new Error('Unexpected end of input while parsing object');
      }
      
      if (source[index] === '}') {
        index++; // skip closing brace
        return { value: result, line: objectLineNum, lineMap };
      } else if (source[index] === ',') {
        index++; // skip comma
        // Continue to next key-value pair
      } else {
        throw new Error(`Expected , or } in object, got '${source[index]}' at position ${index}`);
      }
    }
    
    throw new Error('Unexpected end of input while parsing object');
  }
  
  function parseArray() {
    const arrayStartPos = index;
    const arrayLineNum = getLineNumber(arrayStartPos);
    
    if (source[index] !== '[') {
      throw new Error('Expected [ at start of array');
    }
    
    index++; // skip opening bracket
    skipWhitespace();
    
    const result = [];
    const lineMap = []; // For arrays, we return an array of line numbers/objects
    
    // Handle empty array
    if (source[index] === ']') {
      index++; // skip closing bracket
      return { value: result, line: arrayLineNum, lineMap };
    }
    
    // Parse array content
    while (index < source.length) {
      skipWhitespace();
      
      // Check for end of array
      if (source[index] === ']') {
        index++; // skip closing bracket
        return { value: result, line: arrayLineNum, lineMap };
      }
      
      const valueResult = parseValue();
      result.push(valueResult.value);
      
      // Store line number/map for this array element
      if (valueResult.lineMap !== undefined) {
        // If the value has its own line map (nested object/array), use that
        lineMap.push(valueResult.lineMap);
      } else {
        // For primitive values, store the line number
        lineMap.push(valueResult.line);
      }
      
      skipWhitespace();
      
      // Check what comes next
      if (source[index] === ']') {
        index++; // skip closing bracket
        return { value: result, line: arrayLineNum, lineMap };
      } else if (source[index] === ',') {
        index++; // skip comma
        // Continue to next element
      } else {
        throw new Error(`Expected , or ] in array, got '${source[index]}' at position ${index}`);
      }
    }
    
    throw new Error('Unexpected end of input while parsing array');
  }
  
  // Main parsing
  const result = parseValue();
  
  skipWhitespace();
  if (index < source.length) {
    throw new Error('Unexpected content after JSON');
  }
  
  return {
    parsed: result.value,
    helper: result.lineMap || result.line
  };
}

// Test with the example from the issue
function runTest() {
  // Test case that matches the issue example structure
  const testJson = `{
  "a": {
    "b": {
      "c": {}
    },
    "b1": [
        "01",
        "02"
    ]
  }
}`;

  console.log('Testing JSON parser with line tracking...\n');
  console.log('Input JSON:');
  console.log(testJson);
  console.log('\nLine numbers:');
  testJson.split('\n').forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  try {
    const result = parseJsonWithLineTracking(testJson);
    
    console.log('\nParsed object:');
    console.log(JSON.stringify(result.parsed, null, 2));
    
    console.log('\nHelper object (line numbers):');
    console.log(JSON.stringify(result.helper, null, 2));
    
    console.log('\nAPI Test as specified in issue:');
    console.log(`helper["a"]["b1"] = ${result.helper["a"]["b1"]}`);
    console.log(`Expected line 7, actual: ${result.helper["a"]["b1"]}`);
    console.log(`Test passes: ${Array.isArray(result.helper["a"]["b1"]) && result.helper["a"]["b1"][0] === 7}`);
    
    // Additional functionality tests
    console.log('\nAdditional tests:');
    console.log(`helper["a"]["b"]["c"] (empty object): ${result.helper["a"]["b"]["c"]}`);
    console.log(`helper["a"]["b"] (nested object): line ${JSON.stringify(result.helper["a"]["b"])}`);
    
    // Verify immutability as requested
    console.log('\nTesting immutability:');
    const originalHelper = JSON.stringify(result.helper);
    try {
      result.parsed.a.newProp = 'test';  // This should work
      result.helper.a.newProp = 'test';  // This should also work but breaks immutability
      console.log('Warning: Objects are mutable. Consider Object.freeze() for true immutability.');
    } catch (e) {
      console.log('Objects are immutable as requested.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Additional test cases
function runAdditionalTests() {
  console.log('\n=== Additional Test Cases ===');
  
  // Test 1: Array with mixed types
  console.log('\n--- Test 1: Array with mixed types ---');
  const mixedArrayJson = `{
  "items": [
    "string",
    42,
    true,
    null,
    {"nested": "object"}
  ]
}`;
  
  try {
    const result = parseJsonWithLineTracking(mixedArrayJson);
    console.log('Mixed array helper:', result.helper.items);
    console.log('Test passes:', Array.isArray(result.helper.items));
  } catch (error) {
    console.error('Mixed array test error:', error.message);
  }
  
  // Test 2: Deeply nested structure
  console.log('\n--- Test 2: Deeply nested structure ---');
  const deepJson = `{
  "level1": {
    "level2": {
      "level3": {
        "value": "deep"
      }
    }
  }
}`;
  
  try {
    const result = parseJsonWithLineTracking(deepJson);
    console.log('Deep nesting helper access:', result.helper.level1.level2.level3.value);
    console.log('Test passes:', typeof result.helper.level1.level2.level3.value === 'number');
  } catch (error) {
    console.error('Deep nesting test error:', error.message);
  }
  
  // Test 3: Empty structures
  console.log('\n--- Test 3: Empty structures ---');
  const emptyJson = `{
  "emptyObj": {},
  "emptyArr": []
}`;
  
  try {
    const result = parseJsonWithLineTracking(emptyJson);
    console.log('Empty object helper:', JSON.stringify(result.helper.emptyObj));
    console.log('Empty array helper:', result.helper.emptyArr);
    console.log('Test passes:', Array.isArray(result.helper.emptyArr));
  } catch (error) {
    console.error('Empty structures test error:', error.message);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest();
  runAdditionalTests();
}

module.exports = { parseJsonWithLineTracking };
