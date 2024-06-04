#!/usr/bin/env bash

docker build -t test-action-locally .

which sestatus > /dev/null

seflag=""
if [ $? -eq 0 ]; then
  seflag=":z"
fi

ignore='
unmatched
empty.ipynb
'

docker run --volume "$PWD:$PWD$seflag" --workdir $PWD --env INPUT_DEBUG='true' --env INPUT_IGNORE="$ignore" test-action-locally
