FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Copy the entrypoint script and make it executable inside the container
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

# Set the entrypoint script to be the first thing that runs when the container starts.
ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "server/app.js"]