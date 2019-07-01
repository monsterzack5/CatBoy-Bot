#!/usr/bin/bash
for file in $(find ./src -name '*.js')
   do
       # removes the last 3 chars and replaces them
       # use `git mv` so git keeps file history
       git mv $file $(echo "${file: : -3}.ts")
done