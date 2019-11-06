FROM mhart/alpine-node:10 as Base

WORKDIR /app

COPY package.json yarn.lock ./

RUN apk add --no-cache make gcc g++ python

COPY /src/example/keys /app/dist/example/keys

COPY . .

FROM mhart/alpine-node:10

WORKDIR /app

COPY --from=Base /app .

RUN apk add gnupg

COPY mypassphrase.txt /app

COPY run.sh /app

RUN chmod a+x ./run.sh && sh ./run.sh

CMD [ "yarn", "start" ]