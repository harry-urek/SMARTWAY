FROM node:24-alpine


WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Create logs directory
RUN mkdir -p logs


EXPOSE 8080 9876


ENV NODE_ENV=production
ENV PORT=8080


CMD ["npm", "start"] 