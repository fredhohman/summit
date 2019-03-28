echo 'Did you move the data/ folder out of dist/ (y/n)?'
read answer
if [ "$answer" != "${answer#[Yy]}" ] ;then
    echo 'Yes'
    webpack --env.dataURL='github' --mode production
else
    echo 'No'
    echo 'Please move data/ folder!'
fi