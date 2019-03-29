echo 'Moving local data/ folder out of dist/'
mv dist/data/ .

echo 'Building with webpack'
webpack --env.dataURL='github' --mode production

echo 'Deploying to gh-pages'
gh-pages -d dist

echo 'Moving local data/ back to dist/'
mv data/ dist/
