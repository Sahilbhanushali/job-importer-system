FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .

RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]


