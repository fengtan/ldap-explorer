# Same version of nodejs as that used for vscode itself https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites
FROM node:16-slim

# Packages
# Includes fix for "debconf: delaying package configuration, since apt-utils is not installed"
ENV DEBIAN_FRONTEND=noninteractive
RUN \
  apt-get update && \
  apt-get -y install --no-install-recommends apt-utils dialog 2>&1

# Tools
RUN apt-get -y install \
  git \
  ldap-utils \
  less \
  sudo \
  vim

# Python packages.
RUN apt-get -y install python3-pip
RUN pip3 install --upgrade pre-commit \
 && mkdir -p /home/node/.cache/pre-commit \
 && chown node /home/node/.cache/pre-commit

# NPM packages
# See https://code.visualstudio.com/api/get-started/your-first-extension
RUN npm install -g \
  yo \
  generator-code

# Runtime
ENV DEBIAN_FRONTEND=dialog
USER node
