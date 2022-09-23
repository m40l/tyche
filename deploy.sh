#!/bin/sh

git pull
cd client
npm i
npm run build
cd ../
npm i