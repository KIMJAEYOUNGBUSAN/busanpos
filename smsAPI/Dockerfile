FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY README.md ./
COPY development-plan.md ./

ENV NODE_ENV=production
ENV PORT=3100

EXPOSE 3100

CMD ["node", "server.js"]
