This directory is intended to hold utilities that should not be used in legacy
migrations.  For instance 'republish-page-uris' may take a while so I'd rather
it not be pasted blindly into a legacy migration causing `make bootstrap` to
take even longer.
