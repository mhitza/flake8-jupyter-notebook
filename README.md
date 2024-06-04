A container and a wrapper script around [flake8][1] to validate python code within Jupyter
notebooks. flake8 will pick up configuration files in your project, but [some options are not supported](#flake8-configuration-support) and
will cause the action to fail (sommetimes silently).


## Motivation

An easy way to automate [flake8][1] code checks over code blocks defined in a
Jupyter notebook.


## Example usage

```yaml
jobs:
  flake8:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - uses: mhitza/flake8-jupyter-notebook@v1
      with:
        debug: 'false' # set 'true' for additional logging
        # paths and files to ignore, one regexp rule per line
        ignore: |
          tests/
          test\.ipynb$
```

![annotation-screenshot]


## Implementation details

There is an existing project, called [flake8-nb][3] that performs the same task as this
action. While initial implementation tried to wrapp the annotation script around that
utility, it was abandoned and instead flake8 was used because:

  1. [flake8-nb][3] did not report absolute line number within the notebook file, instead it
     reported only relative line numbers within the checked code blocks.
  2. A notebook might be checked in the repository without the code cells
     evaluated. In that case [flake8-nb][3] would report on cells without a number,
     and tracking back from the reported error to absolute line numbers became a more
     difficult task than wrapping around [flake8][1].

In order to check the notebook, the [annotate][4] script keeps track of all the various code
blocks within the notebook, concatenates them into a single source and pipes it into [flake8][1].


## Known limitations

**Supports version 4 compatible notebook formats**. It will just silently skip
over other notebook formats, as it's using *regular expressions based on indentation level* to
extract source blocks. If you're of aware of any JavaScript JSON parser that keeps track of the
source lines parsed I'd be happy to hear about it.


Due to implementation details and Jupyter notebook specific idiosyncrasies, some warnings and errors
reported by [flake8][1] are ignored by default (hardcoded in source code). The following list is not
necessarily exhaustive and might change based on testing and issues raised.

 - [E302 Expected 2 blank lines][E302] when reported for the first line of a code block.
 - [E305 Expected 2 blank lines after end of function or class][E305], as with E302,
   when reported for the first line of a code block.
 - [E402 Module level import not at top of file][E402]. In tested notebooks
   code sections will tend to import modules just before usage.
 - [F821 Undefined name name][F821]. When the undefined name stands for the Jupyter builtin function
   `display`



### flake8 configuration support

The following options which can be defined in a flake8 configuration file are not supported.

Any option that changes the output of flake8: `--quiet`, `--count`, `--format` (only default supported),
`--show-source`, `--statistics`.

Anything that relies on filename/paths, as code is passed in to flake8 via stdin.
Thus the following options will have no effect: `--exclude`, `--extend-exclude`, `--filename`, `--per-file-ignores`


[1]: https://flake8.pycqa.org/en/latest/
[annotation-screenshot]: https://user-images.githubusercontent.com/273079/82093965-d6585d00-9704-11ea-9159-c8b72a9b89c8.png
[3]: https://github.com/s-weigand/flake8-nb
[4]: annotate
[E302]: https://archive.vn/Bj1tc
[E305]: https://archive.vn/a3tr2
[E402]: https://archive.vn/i7NWk
[F821]: https://archive.ph/Ysz7l
