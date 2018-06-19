#!/usr/bin/env sh
psql -c "select * from users;" "tepuk-nyamuk"  |cat;
psql -c "select * from games;" "tepuk-nyamuk" | cat;
