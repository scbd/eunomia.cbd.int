FROM mhart/alpine-node:10.6

WORKDIR /usr/src/app

COPY package.json bower.json .bowerrc .npmrc ./

RUN yarn

ENV PORT 8000

EXPOSE 8000

COPY . ./

CMD [ "node", "server" ]
