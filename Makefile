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

rm-all:
	@echo "Removing all stopped containers..."
	docker rm $$(docker ps -aq --filter name=^$$(basename $$(pwd)))

burn:
	@echo "Stopping and removing all containers..."
	make down && make rm-all

rmi-dangle:
	@echo "Cleaning up all dangling Docker images..."
	docker rmi $$(docker images -f "dangling=true")

remove-images:
	@echo "Cleaning up all docker images..."
	docker rmi -f $$(docker images -q)

clay-logs:
	docker-compose logs -f clay

enter-clay:
	docker-compose exec clay bash

clear-data:
	rm -rf ./elasticsearch/data && rm -rf ./redis/data && rm -rf ./postgres/data

clear-app:
	rm -rf app/node_modules && ls -d ./app/public/* | grep -v dist | xargs rm -rf && rm -rf app/browserify-cache.json

clear-spa:
	rm -rf spa/node_modules  && rm -rf app/public/dist

reset:
	make burn && make clear-data

nuke:
	make reset && make clear-app && make clear-spa

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
	cd spa && npm i && npm run-script build -- --mode=none && cd ../app && npm i && npm run build

install:
	cd spa && npm i && npm run-script build -- --mode=production && npm run-script production-config && cd ../app && npm i && npm run build-production

lint:
	cd app && npm run eslint; cd ../spa && npm run lint -- --no-fix

build-player:
	if cd ./radio-web-player; then git pull; else git clone git@bitbucket.org:entercom/rad-web-player.git ./radio-web-player; fi
	cd ./radio-web-player && npm i && npm run build
	mkdir -p ./app/public/web-player
	cd ./radio-web-player/demo-site && npm i && npm run build
	cp -r ./radio-web-player/demo-site/dist/* ./app/public/web-player/

snapshot:
	make down
	if [ -d './.snapshot' ]; then rm -rf ./.snapshot; fi
	mkdir ./.snapshot;
	docker save -o ./.snapshot/clay-radio_clay clay-radio_clay
	cp -R ./elasticsearch ./.snapshot/elasticsearch
	cp -R ./redis ./.snapshot/redis
	cp -R ./postgres ./.snapshot/postgres

restore:
	make down
	rm -rf ./elasticsearch
	rm -rf ./redis
	rm -rf ./postgres
	cp -R ./.snapshot/elasticsearch ./elasticsearch
	cp -R ./.snapshot/redis ./redis
	cp -R ./.snapshot/postgres ./postgres
	docker load -i ./.snapshot/clay-radio_clay

.PHONY: spa
spa:
	cd spa && npm i && npm run-script build -- --mode=none

spa-dev:
	cd spa && npm i && npm run-script build -- --mode=none --watch

app-dev:
	cd app && npm i && npm run watch
