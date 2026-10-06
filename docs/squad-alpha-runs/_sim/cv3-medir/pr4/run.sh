#!/bin/bash
cd /d/soulmon-pr4
npx esbuild _medir/${1:-m}.ts --bundle --platform=node --format=esm --outfile=_medir/${1:-m}.mjs --loader:.png=dataurl --loader:.webp=dataurl --loader:.jpg=dataurl --loader:.jpeg=dataurl --loader:.svg=dataurl --loader:.gif=dataurl --loader:.mp3=dataurl --loader:.ogg=dataurl --loader:.wav=dataurl --loader:.json=json --log-level=error && node _medir/${1:-m}.mjs
