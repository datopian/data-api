FROM node:12-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# COPY package*.json ./
COPY package.json ./
COPY yarn.lock ./

COPY . .

EXPOSE 3000

RUN yarn
# If you are building your code for production
# RUN npm ci --only=production

CMD [ "yarn", "start" ]