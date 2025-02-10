# Official Python image as the base image
FROM python:3.9-slim

# Install necessary packages for building and running C++ programs
RUN apt-get update && apt-get install -y \
    g++ \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /CollaBrix

# Copying all files to directory
COPY . .

# Installing Flask dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Env variable
ENV PORT=5000

# Expose port 5000
EXPOSE 5000

# Set the default command to run app.py
CMD ["python", "app.py"]