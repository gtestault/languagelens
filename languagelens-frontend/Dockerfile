FROM node:16-alpine3.11 as builder
WORKDIR /frontend
RUN apk add gzip
COPY package.json package.json /frontend/
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:mainline-alpine
WORKDIR /var/www/languagelens-frontend
COPY --from=builder /frontend/build/ .
COPY ./nginx.conf /etc/nginx/nginx.conf