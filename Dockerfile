#######
# SPA
#######
FROM node:10.16.3 as spa

ENV HOME=/usr/src/spa

ARG mode=none
ARG npm-final-step='cd ../app && npm ci && npm run build'

COPY spa/package.json $HOME/
COPY spa/package-lock.json $HOME/

WORKDIR $HOME
RUN npm ci

COPY spa $HOME/
COPY app $HOME/../app/

RUN cd spa && npm ci && npm run-script build -- --mode=${mode} && \
    ${npm-final-step}

#######
# APP
#######
FROM node:10.16.3

ENV HOME=/usr/src/app

COPY app/package.json $HOME/
COPY app/package-lock.json $HOME/

WORKDIR $HOME/
RUN npm ci

# Build application source into image and run container
COPY app $HOME/
# COPY --from=spa /usr/src/app/public/dist/js/app.* $HOME/public/dist/js/
# COPY --from=spa /usr/src/app/sites/demo/config.yml $HOME/sites/demo/

# RUN npm run build-production
RUN npm install pm2 -g

EXPOSE 3001

USER node

CMD ["pm2-runtime", "app.js", "--instances", "2"]
