# Use Node.js LTS image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the backend code
COPY . .

# Expose backend port
EXPOSE 8000

# Start backend server
CMD ["node", "src/index.js"]

