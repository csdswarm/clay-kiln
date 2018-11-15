FROM node:8.9.0

###### For Dev
RUN apt-get update
RUN apt-get -y install vim

ENV HOME=/usr/src/app

COPY package.json $HOME/
COPY package-lock.json $HOME/

WORKDIR $HOME/
RUN npm i

# Build application source into image and run container
COPY . $HOME/

EXPOSE 3001
