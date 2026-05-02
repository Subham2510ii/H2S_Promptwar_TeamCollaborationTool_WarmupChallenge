# Use the official lightweight Nginx image
FROM nginx:alpine

# Copy local files to the Nginx static HTML directory
COPY . /usr/share/nginx/html

# Copy the Nginx configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run will automatically pass the PORT environment variable.
# We set a default of 8080 just in case.
ENV PORT 8080
