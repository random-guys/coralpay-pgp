FROM mhart/alpine-node:10 as Base

WORKDIR /app

COPY package.json yarn.lock ./

RUN apk add --no-cache make gcc g++ python

COPY . .

RUN yarn && yarn build

FROM mhart/alpine-node:10

WORKDIR /app

COPY --from=Base /app .

RUN apk add gnupg

COPY run.sh /app

CMD [ "yarn", "start" ]