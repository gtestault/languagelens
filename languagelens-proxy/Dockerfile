FROM golang:1.16.6-alpine3.14 as builder
ENV GO111MODULE=on
WORKDIR /languagelens-proxy
ADD . .
RUN go build -v -o languagelens-proxy .
FROM alpine:latest
EXPOSE 5034
WORKDIR /languagelens-proxy
COPY --from=builder /languagelens-proxy/languagelens-proxy .
CMD ["./languagelens-proxy"]