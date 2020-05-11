#!/usr/bin/env sh

export DEBUG=$1
flake8_nb --exit-zero --filename=*.ipynb | /annotate
