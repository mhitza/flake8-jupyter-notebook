const { parseJsonWithLineTracking } = require('./json_parser_line_tracker');

const jsonSource =
`{
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

const result = parseJsonWithLineTracking(jsonSource);

// Access the parsed JSON
console.log(result.parsed.a.b1); // ["01", "02"]

// Access line numbers using the same path structure
console.log(result.helper["a"]["b1"][0]); // 7 (line number where the array is defined)
