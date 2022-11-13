#!/bin/bash

# Create self-signed CA (certificate authority)
openssl req \
  -x509 \
  -sha256 \
  -nodes \
  -newkey rsa:2048 \
  -subj "/C=CA/ST=QC/L=Montreal/CN=example.org" \
  -keyout rootCA.key \
	-out rootCA.crt

# Create server private key
openssl genrsa -out server.key 2048

# Create CSR (certificate signing request) configuration
cat > csr.conf <<EOF
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C = CA
ST = QC
L = Montreal
CN = example.org

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = example.org
DNS.2 = www.example.org
IP.1 = 192.168.0.1
IP.2 = 192.168.0.2

EOF

# Generate CSR with server private key
openssl req -new -key server.key -out server.csr -config csr.conf

# Create external file
cat > cert.conf <<EOF

authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.org

EOF

# Generate certificate with self-signed CA
openssl x509 -req \
  -in server.csr \
  -CA rootCA.crt \
  -CAkey rootCA.key \
  -CAcreateserial \
  -out server.crt \
  -sha256 \
  -extfile cert.conf
