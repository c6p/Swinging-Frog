
FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Copy over the working HEAD we downloaded from S3
COPY . .

# Run the init script to get our working directory set up if it needs to be
RUN chmod +x ./.remy/scripts/init.sh
RUN ./.remy/scripts/init.sh https://projects.koji-cdn.com/2e962d6e-2419-4d8e-adee-c731d8b6d287.git

# Run install commands if we have them
RUN npm install --prefix .remy
RUN npm install --prefix ./frontend

# Start remy
CMD npm start --prefix ./.remy
