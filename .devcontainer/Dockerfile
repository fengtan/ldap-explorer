# Same version of nodejs as that used for
# - vscode itself https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites
# - CI tests .github/workflows/build.yml
FROM node:20.13.1-slim

# Packages
# Includes fix for "debconf: delaying package configuration, since apt-utils is not installed"
ENV DEBIAN_FRONTEND=noninteractive
RUN \
  apt-get update && \
  apt-get -y install --no-install-recommends apt-utils dialog 2>&1

# Requirements for automated tests (allows to run a temporary vscode instance in the container)
RUN apt-get -y install \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  xvfb

# Tools
RUN apt-get -y install \
  git \
  ldap-utils \
  less \
  pipx \
  sudo \
  vim

# NPM packages
# See https://code.visualstudio.com/api/get-started/your-first-extension
RUN npm install -g \
  generator-code \
  yo

# Runtime
ENV DEBIAN_FRONTEND=dialog
USER node

# Python packages
RUN pipx install pre-commit \
 && mkdir -p /home/node/.cache/pre-commit
