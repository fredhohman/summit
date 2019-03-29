echo 'Moving local data/ folder out of dist/'
mv dist/data/ .
echo 'Building with webpack'
webpack --env.dataURL='github' --mode production
echo 'Moving local data/ back to dist/'
mv data/ dist/

# echo 'Did you move the data/ folder out of dist/ (y/n)?'
# read answer
# if [ "$answer" != "${answer#[Yy]}" ] ;then
#     echo 'Yes'
#     webpack --env.dataURL='github' --mode production
# else
#     echo 'No'
#     echo 'Please move data/ folder!'
# fi