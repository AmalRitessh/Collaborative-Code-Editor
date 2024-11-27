# Use an official Python image as the base image
FROM python:3.9-slim

# Install necessary packages for building and running C++ programs
RUN apt-get update && apt-get install -y \
    g++ \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /apps

# Copy all contents from the current directory to the working directory
COPY . .

# Install Python dependencies if any (ensure you have a requirements.txt)
# Uncomment the next line if you have a requirements.txt file
# RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000
EXPOSE 5000

# Set the default command to run app.py
CMD ["python", "app.py"]

