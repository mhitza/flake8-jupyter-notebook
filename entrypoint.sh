#!/usr/bin/env sh -l

flake8_nb --exit-zero --filename=*.ipynb | /annotate
