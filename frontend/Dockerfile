FROM node:23-alpine as build

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app
RUN npm ci

COPY . /app
RUN npm run build

FROM ubuntu
RUN apt-get update
RUN apt-get install nginx -y

COPY --from=build /app/dist /var/www/html/
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
