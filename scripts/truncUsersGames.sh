#!/usr/bin/env sh
if [ "$(uname -s)" == "Darwin" ]; then
	# mac osx
	psql -c "truncate users;" "tepuk-nyamuk";
	psql -c "truncate games;" "tepuk-nyamuk";
else 
	# ubuntu
	sudo -i -u postgres psql -c "truncate users;" "tepuk-nyamuk";
	sudo -i -u postgres psql -c "truncate games;" "tepuk-nyamuk";
fi
redis-cli flushall;
