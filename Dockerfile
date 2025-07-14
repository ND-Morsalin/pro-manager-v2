# Use official Node.js image
FROM node:alpine

# Set working directory
WORKDIR /app
# Install OpenSSL
RUN apk add --no-cache openssl
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install pnpm -g

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN pnpm i

RUN pnpm build

# Expose your app port
EXPOSE 5000
# Set environment variables 

# Start the app (now dist/server.js will exist)
# CMD ["tail", "-f", "/dev/null"]
CMD [ "npm", "run", "start" ]
