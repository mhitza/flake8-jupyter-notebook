A container and a wrapper script around [flake8][1] to validate python code within Jupyter
notebooks.


## Motivation

An easy way to automate the [flake8][1] code checks over the code blocks defined in a
Jupyter notebook.


## Example usage

```yaml
jobs:
  flake8:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - uses: mhitza/flake8-jupyter-notebook@v1
```

![annotation-screenshot]


## Implementation details

There is an existing project, called [flake8-nb][3] that performs the same task as this
action. While initial implementation tried to wrapped the annotation script around that
utility, it was abandoned and instead flake8 was used instead because:

  1. [flake8-nb][3] did not report absolute line number within the notebook file, instead it
     reported only relative line numbers within the checked code block.
  2. A notebook might be checked in the repository without the code cells having been
     evaluated. In that case [flake8-nb][3] would report multiple cells without a number,
     and tracking back from the reported error to absolute line numbers became a more
     difficult task than wrapping around [flake8][1].

In order to check the notebook, the [annotate][4] script keeps track of all the various code
blocks within the notebook, concatenates them into a single file and then pipes it as
input to [flake8][1]. 


## Known limitations

First of **it only supports version format 4 for notebooks**. It will just silently skip
over other notebook formats, as it's using *regular expressions around indentation level* to
extract source blocks. If you're of any JavaScript JSON parser that keeps track of the
source line parsed I'd be happy to hear about it.


Because of implementation details and Jupyter notebook specifics, some warnings and errors
reported by [flake8][1] are ignored. The following list is not necessarily exhaustive and
prone to be updated based on more testing.

 - [E302 Expected 2 blank lines][E302] when reported for the first line of a code block.
 - [E305 Expected 2 blank lines after end of function or class][E305], as with E302 just
   when it's reported for the first line of a code block.
 - [E402 Module level import not at top of file][E402]. In the tested notebooks different
   code sections will import modules just when needed.
 - [F821 Undefined name name][F821]. When the undefined name stands for the Jupyter builtin function
   `display`



[1]: https://flake8.pycqa.org/en/latest/
[annotation-screenshot]: https://user-images.githubusercontent.com/273079/82093965-d6585d00-9704-11ea-9159-c8b72a9b89c8.png
[3]: https://github.com/s-weigand/flake8-nb
[4]: annotate
[E302]: https://archive.vn/Bj1tc
[E305]: https://archive.vn/a3tr2
[E402]: https://archive.vn/i7NWk
[F821]: https://archive.ph/Ysz7l
