FROM python:3.9.6-alpine3.14
WORKDIR /youtube-transcript-server
ADD . .
RUN pip3 install -r requirements.txt && \
    pip3 install gunicorn
EXPOSE 5035
CMD ["gunicorn", "-b", "0.0.0.0:5035", "youtube-transcript-server:app"]
