#!/bin/bash

# Generate CA (certificate authority) key
openssl genrsa \
  -des3 \
  -out rootCA.key \
  2048

# Generate CA cert
openssl req \
  -x509 \
  -new \
  -nodes \
  -key rootCA.key \
  -sha256 \
  -days 1825 \
  -out rootCA.pem \
  -subj "/C=CA/ST=Quebec/L=Montreal/O=Code/CN=example.org"

# Generate server key
openssl genrsa \
  -out openldap.key \
  2048

# Generate CSR (certificate signing request)
openssl req \
  -new \
  -key openldap.key \
  -out openldap.csr \
  -subj "/C=CA/ST=Quebec/L=Montreal/O=Code/CN=example.org"

# Generate server cert
openssl x509 \
  -req \
  -in openldap.csr \
  -CA rootCA.pem \
  -CAkey rootCA.key \
  -CAcreateserial \
  -out openldap.crt \
  -days 825 \
  -sha256
