# Use an official Python runtime as a parent image
FROM python:3.8-slim-buster

# Set the working directory in the container to /app
WORKDIR /app

# Add current directory code to working directory in Docker image
ADD . /app

# Install any needed packages specified in requirements.txt
RUN pip install --upgrade pip
RUN pip install fastapi uvicorn[standard]
RUN pip install opencv-python-headless
RUN pip install torch torchvision
RUN pip install numpy
# Add any other dependencies you need

# Make port 80 available to the world outside this container
EXPOSE 80

# Run the command to start uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
