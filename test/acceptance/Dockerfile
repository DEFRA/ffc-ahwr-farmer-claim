ARG PARENT_VERSION=1.2.16-node16.14.2
ARG PORT_DEBUG=9229

# Development
FROM defradigital/node-development:${PARENT_VERSION}
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node-development:${PARENT_VERSION}
ARG PORT_DEBUG
EXPOSE ${PORT_DEBUG}
COPY --chown=root:node --chmod=755 package*.json ./
RUN npm ci
COPY --chown=root:node --chmod=755 . .
CMD [ "npm", "run", "test" ]