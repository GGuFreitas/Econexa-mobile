FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 19000 19001 19002 19006

CMD ["npm", "start", "--", "--non-interactive"]
