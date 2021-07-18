FROM rasa/rasa:2.8.0-full
ADD . /app
COPY credentials_docker.yml /app/credentials.yml
COPY endpoints_docker.yml /app/endpoints.yml
EXPOSE 5005
CMD ["run"]