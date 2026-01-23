git init
git remote add origin %1

git config user.email "ccs.emersonb@gmail.com"
git config user.name "emerson-bacomo"
git config --global core.editor "code --wait"

git add .
git commit
git push -u origin master

