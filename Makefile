up:
	docker-compose up -d nginx redis elasticsearch clay postgres && make clay-logs

up-clay:
	docker-compose up --build -d clay && make clay-logs

up-nginx:
	docker-compose up --build -d nginx

down:
	docker-compose stop nginx redis elasticsearch clay postgres

rebuild:
	docker-compose stop clay && cd app && npm run build && cd .. && cd spa && npm run-script build -- --mode=none && docker-compose up -d clay && cd .. && make clay-logs

burn:
	@echo "Stopping and removing all containers..."
	docker-compose rm --stop --force -v # -v = associated volumes

rmi-dangle:
	@echo "Cleaning up all dangling Docker images..."
	docker rmi $$(docker images -f "dangling=true")

remove-images:
	@echo "Cleaning up all docker images..."
	docker rmi -f $$(docker images -q)

clay-logs:
	docker-compose exec clay tail -f .pm2/logs/app_name-out.log --retry

clear-logs:
	echo -n > ./app/.pm2/logs/app_name-out.log

enter-clay:
	docker-compose exec clay bash

clear-data:
	rm -rf ./elasticsearch/data && rm -rf ./redis/data && rm -rf ./postgres/data

clear-app:
	rm -rf app/node_modules && ls -d ./app/public/* | grep -v -E "(dist|sitemap)" | xargs rm -rf && rm -rf app/browserify-cache.json

clear-spa:
	rm -rf spa/node_modules  && rm -rf app/public/dist

reset:
	make burn && make clear-data

nuke:
	make reset && make clear-app && make clear-spa && make clear-logs

bootstrap:
	cd ./app &&  cat ./first-run/**/* | clay import -k demo -y clay.radio.com
	@echo ""
	curl -X PUT http://clay.radio.com/_components/google-ad-manager/instances/contentCollectionLogoSponsorship -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_layouts/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_layouts/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_layouts/one-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_layouts/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_layouts/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/topic-page-header/instances/new@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/google-ad-manager/instances/contentCollectionLogoSponsorship -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	if cd ../frequency-clay-translator; then npm run import-pages && cd ../clay-radio; fi
	@echo "\r\n\r\n"
	./migrations/legacy/run-legacy-scripts.sh

dev-bootstrap:
	cd ./app && cat ./first-run/**/* | clay import -k demo -y dev-clay.radio.com
	@echo ""
	curl -X PUT http://clay.radio.com/_components/google-ad-manager/instances/contentCollectionLogoSponsorship -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_layouts/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_layouts/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_layouts/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_layouts/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"

stg-bootstrap:
	cd ./app && cat ./first-run/**/* | clay import -k demo -y stg-clay.radio.com
	@echo ""
	curl -X PUT http://clay.radio.com/_components/google-ad-manager/instances/contentCollectionLogoSponsorship -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_layouts/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_layouts/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_layouts/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_layouts/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"

install-dev:
	cd app && npm ci && cd ../spa && npm ci && npm run-script build -- --mode=none && cd ../app && npm run build

install:
	cd app && npm ci && cd ../spa && npm ci && npm run-script build -- --mode=production && npm run-script production-config && cd ../app && npm run build-production

lint:
	cd app && npm run eslint; cd ../spa && npm run lint -- --no-fix

build-player:
	if cd ./radio-web-player; then git pull; else git clone git@bitbucket.org:entercom/rad-web-player.git ./radio-web-player; fi
	cd ./radio-web-player && npm i && npm run build
	mkdir -p ./app/public/web-player
	cd ./radio-web-player/demo-site && npm i && npm run build
	cp -r ./radio-web-player/demo-site/dist/* ./app/public/web-player/

# function to wrap logic without exposing a target
# https://coderwall.com/p/cezf6g/define-your-own-function-in-a-makefile
#
# the syntax is kinda goofy because the entire script needs to be a single line
#   in order for it to be in the calling 'if' statement.  There may be a better
#   way but we're already using Makefile.
#
# previously we didn't have named snapshots so to keep the code functionally
#   equivalent we just move the files which existed at the root into the new
#   snapshot named 'default'
define migrate-snapshot-to-default
	rm -rf ./.snapshot/default; \
	mkdir ./.snapshot/default; \
	mv ./.snapshot/elasticsearch ./.snapshot/default/elasticsearch; \
	mv ./.snapshot/postgres ./.snapshot/default/postgres; \
	mv ./.snapshot/redis ./.snapshot/default/redis; \
	mv ./.snapshot/clay-radio_clay ./.snapshot/default/clay-radio_clay
endef

snapshot:
	make down
	if [ -d ./.snapshot/elasticsearch ]; then $(call migrate-snapshot-to-default); fi
	if [ ! -d './.snapshot' ]; then mkdir ./.snapshot; fi
	if [ -d './.snapshot/$(name)' ]; then rm -rf './.snapshot/$(name)'; fi
	mkdir './.snapshot/$(name)';
	docker save -o './.snapshot/$(name)/clay-radio_clay' clay-radio_clay
	cp -R ./elasticsearch './.snapshot/$(name)/elasticsearch'
	cp -R ./redis './.snapshot/$(name)/redis'
	cp -R ./postgres './.snapshot/$(name)/postgres'

snapshot: name = default

restore:
	make down
	if [ -d ./.snapshot/elasticsearch ]; then $(call migrate-snapshot-to-default); fi
	if [ ! -d './.snapshot/$(name)' ]; then echo "snapshot './.snapshot/$(name)' doesn't exist"; exit 1; fi
	rm -rf ./elasticsearch
	rm -rf ./redis
	rm -rf ./postgres
	cp -R './.snapshot/$(name)/elasticsearch' ./elasticsearch
	cp -R './.snapshot/$(name)/redis' ./redis
	cp -R './.snapshot/$(name)/postgres' ./postgres
	docker load -i './.snapshot/$(name)/clay-radio_clay'

restore: name = default

gen-certs:
	cd nginx &&	mkdir -p certs
	cd nginx/certs && mkcert *.radio.com

.PHONY: spa
spa:
	cd spa && npm ci && npm run-script build -- --mode=none

spa-dev:
	cd spa && npm ci && npm run-script build -- --mode=none --watch

app-dev:
	cd app && npm ci && npm run watch

generate-local-env:
	sops --decrypt app/clay-radio.secret.sops.yml > app/unencrypted.yml && yq r app/unencrypted.yml stringData > app/temp.yml && yq r app/local.values.yml configmap.data >> app/temp.yml && yq r -j app/temp.yml | jq . | yq r - --prettyPrint | sed 's/: /=/g' | cat > app/.env && rm app/temp.yml

encrypt-local-env:
	sops --encrypt --kms arn:aws:kms:us-east-1:477779916141:key/4c93f4a2-4e95-4386-8796-c55df146b6a1 app/unencrypted.yml > app/clay-radio.secret.sops.yml

encrypt-development-env:
	sops --encrypt --kms arn:aws:kms:us-east-1:477779916141:key/4c93f4a2-4e95-4386-8796-c55df146b6a1 deploy/development/unencrypted.yml > deploy/development/clay-radio.secret.sops.yml

encrypt-staging-env:
	sops --encrypt --kms arn:aws:kms:us-east-1:477779916141:key/4c93f4a2-4e95-4386-8796-c55df146b6a1 deploy/staging/unencrypted.yml > deploy/staging/clay-radio.secret.sops.yml

encrypt-production-env:
	sops --encrypt --kms arn:aws:kms:us-east-1:477779916141:key/df2d9bbc-3eb3-47cf-acc9-457cf1823b29 deploy/production/unencrypted.yml> deploy/production/clay-radio.secret.sops.yml

decrypt-env:
ifdef env
	sops --decrypt deploy/$(env)/clay-radio.secret.sops.yml > deploy/$(env)/unencrypted.yml
else
	sops --decrypt app/clay-radio.secret.sops.yml > app/unencrypted.yml
endif
