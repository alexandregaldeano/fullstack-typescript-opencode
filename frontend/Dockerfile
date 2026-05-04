FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json yarn.* ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 80

CMD ["serve", "dist", "-s", "-l", "80"]
