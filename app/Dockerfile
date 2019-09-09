FROM node:10.16.3-jessie

###### For Dev
RUN apt-get update
RUN apt-get -y install vim

ENV HOME=/usr/src/app

COPY package.json $HOME/
COPY npm-shrinkwrap.json $HOME/

WORKDIR $HOME/
RUN npm i

# Build application source into image and run container
COPY . $HOME/

EXPOSE 3001
