up:
	docker-compose up -d nginx redis elasticsearch clay && make clay-logs

up-clay:
	docker-compose up --build -d clay && make clay-logs

up-nginx:
	docker-compose up --build -d nginx

down:
	docker-compose stop nginx redis elasticsearch clay

rm-all:
	@echo "Removing all stopped containers..."
	docker rm $$(DOCKER ps -aq)

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
	rm -rf ./elasticsearch/data && rm -rf ./redis/data

bootstrap:
	cd ./app &&  cat ./first-run/**/* | clay import -k demo -y clay.radio.com
	@echo ""
	curl -X PUT http://clay.radio.com/_components/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/one-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT http://clay.radio.com/_components/topic-page-header/instances/new@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	if cd ../frequency-clay-translator; then npm run import-pages && cd ../clay-radio; fi
	@echo "\r\n\r\n"
	./migrations/legacy/run-legacy-scripts.sh

dev-bootstrap:
	cd ./app && cat ./first-run/**/* | clay import -k demo -y dev-clay.radio.com
	@echo ""
	curl -X PUT https://dev-clay.radio.com/_components/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_components/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_components/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_components/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://dev-clay.radio.com/_components/topic-page-header/instances/new@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"

stg-bootstrap:
	cd ./app && cat ./first-run/**/* | clay import -k demo -y stg-clay.radio.com
	@echo ""
	curl -X PUT https://stg-clay.radio.com/_components/one-column-layout/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_components/one-column-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_components/one-column-full-width-layout/instances/bare@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_components/two-column-layout/instances/article@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_pages/author@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_pages/topic@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	curl -X PUT https://stg-clay.radio.com/_components/topic-page-header/instances/new@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"

install-dev:
	cd app && npm i && node -r dotenv/config ./node_modules/.bin/gulp && cd ../spa && npm i && npm run-script build -- --mode=none

install:
	cd app && npm i && node -r dotenv/config ./node_modules/.bin/gulp && cd ../spa && npm i && npm run-script build -- --mode=production && npm run-script production-config

lint:
	cd app && npm run eslint && cd ../spa && npm run lint -- --no-fix

.PHONY: spa
spa:
	cd spa && npm i && npm run-script build -- --mode=none
