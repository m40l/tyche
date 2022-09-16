#!/bin/sh

cd client
npm i
npm run build
cd ../
npm i
tsc
npm run prod