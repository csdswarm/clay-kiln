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

bootstrap-gallery:
	@echo "Creating page..."
	cd ./app && cat ./first-run/galleries-update/_* | clay import -k demo -y radio.com
	@echo "\r\n\r\n"
	@echo "Creating component instance..."
	curl -X PUT https://radio.com/_components/gallery/instances/new -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
	@echo "\r\n\r\n"
	@echo "Updating _lists new-pages..."
	clay export radio.com/_lists/new-pages -y > ./app/first-run/galleries-update/lists.yml
	@echo "\r\n\r\n"
	node ./app/first-run/galleries-update/lists-update.js
	@echo "\r\n\r\n"
	cat ./app/first-run/galleries-update/lists.yml | clay import -k demo -y radio.com
	@echo "\r\n\r\n"

index-update:
	@echo "Creating new index..."
	curl -X PUT "radio.com:9200/published-content_v1" -H 'Content-Type: application/json' -d'\
	{\
		"settings" : {\
			"analysis": {\
				"analyzer": {\
					"tag_analyzer": {\
						"tokenizer": "standard",\
						"filter": [\
							"standard",\
							"my_ascii_folding",\
							"lowercase"\
						],\
						"char_filter": [\
							"remove_whitespace",\
							"remove_punctuation"\
						]\
					},\
					"author_analyzer": {\
						"tokenizer": "standard",\
						"filter": [\
							"standard",\
							"my_ascii_folding",\
							"lowercase"\
						],\
						"char_filter": [\
							"remove_whitespace",\
							"remove_punctuation"\
						]\
					}\
				},\
				"filter": {\
					"my_ascii_folding": {\
						"type": "asciifolding",\
						"preserve_original": true\
					}\
				},\
				"char_filter": {\
					"remove_whitespace": {\
						"type": "pattern_replace",\
						"pattern": "\\s+",\
						"replacement": "-"\
					},\
					"remove_punctuation": {\
						"type": "pattern_replace",\
						"pattern": "[.,/#!$%\\^&\\*;:{}=\\-_`~()'\'']",\
						"replacement": ""\
					}\
				}\
			}\
		},\
		"mappings" : {\
			"_doc": {\
				"dynamic": false,\
				"properties": {\
					"displayHeadline": {\
						"type": "text"\
					},\
					"plaintextDisplayHeadline": {\
						"type": "text"\
					},\
					"authors": {\
						"type": "keyword",\
						"fields": {\
							"normalized": {\
								"type": "text",\
								"analyzer": "author_analyzer"\
							}\
						}\
					},\
					"date": {\
						"type": "date",\
						"store": true\
					},\
					"canonicalUrl": {\
						"type": "keyword",\
						"store": true\
					},\
					"feedImage": {\
						"type": "keyword"\
					},\
					"tags": {\
						"type": "keyword",\
						"fields": {\
							"normalized": {\
								"type": "text",\
								"analyzer": "tag_analyzer"\
							}\
						}\
					},\
					"sectionFront": {\
						"type": "keyword"\
					},\
					"contentType": {\
						"type": "keyword"\
					},\
					"teaser": {\
						"type": "text"\
					},\
					"site": {\
						"type": "keyword"\
					},\
					"pageUri": {\
						"type": "keyword",\
						"store": true\
					},\
					"lead": {\
						"type": "keyword"\
					}\
				}\
			}\
		}\
	}\
	'/
	@echo "\r\n\r\n"
	@echo "Copying old index data to new index..."
	curl -X POST "radio.com:9200/_reindex" -H 'Content-Type: application/json' -d'\
	{\
	  "source": {\
	    "index": "published-articles_v1"\
	  },\
	  "dest": {\
	    "index": "published-content_v1"\
	  }\
	}\
	'/
	@echo "\r\n\r\n"
	@echo "Removing old alias and adding new..."
	curl -X POST "radio.com:9200/_aliases" -H 'Content-Type: application/json' -d'\
	{\
	    "actions" : [\
	        { "remove" : { "index" : "published-articles_v1", "alias" : "published-articles" } },\
	        { "add" : { "index" : "published-content_v1", "alias" : "published-content" } }\
	    ]\
	}\
	'/
	@echo "Deleting old index \r\n\r\n"
	curl -X DELETE "radio.com:9200/published-articles_v1"
	@echo "\r\n\r\n"

install-dev:
	cd app && npm i && node ./node_modules/.bin/gulp && cd ../spa && npm i && npm run-script build -- --mode=none

install:
	cd app && npm i && node ./node_modules/.bin/gulp && cd ../spa && npm i && npm run-script build -- --mode=production && npm run-script production-config

lint:
	cd app && npm run eslint && cd ../spa && npm run lint -- --no-fix

.PHONY: spa
spa:
	cd spa && npm i && npm run-script build -- --mode=none
