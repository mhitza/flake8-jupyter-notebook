#!/usr/bin/env sh

flake8_nb --exit-zero --filename=*.ipynb | /annotate
