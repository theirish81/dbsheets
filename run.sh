sudo docker run --rm -p 5000:5000 -v `pwd`/etc:/usr/src/app/etc -v `pwd`/sheets:/usr/src/app/sheets -ti theirish81/dbsheets $@
