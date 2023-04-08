#!/bin/bash
# @description: Copy the colibri2 files to vhdl-by-hgb -> node_modules/colibri2
# @author: jakobjung10

cd colibri/src/config/helpers/
python3 generate_config.py
python3 generate_web.py
cd ../../../

npm install
rm -rf ../vhdl-by-hgb/node_modules/colibri2/out/
cp -R out ../vhdl-by-hgb/node_modules/colibri2/
