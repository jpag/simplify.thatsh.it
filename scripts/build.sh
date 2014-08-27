r.js -o build.js
cd ../public/assets/js


printf "Removing _controllers folder \n"
rm -rf _controllers

printf "Removing _models folder \n"
rm -rf _models

printf "Removing _wrappers folder \n"
rm -rf _wrappers

printf "Removing template.js \n"
rm _template.js

printf "Removing JS lib files \n"
# rm -rf lib
#remove the require.js file from the lib folder then put it back in once everything is deleted
mv _lib/require.js require.js 

rm -rf _lib/* 

mv require.js _lib/require.js


#save a unique version in the logs
printf "Moving build result file \n"
mv -f build.txt ../../../scripts/logs/build.$(date "+%Y-%m-%d_%H.%M.%S").txt

printf "All done! \n"

