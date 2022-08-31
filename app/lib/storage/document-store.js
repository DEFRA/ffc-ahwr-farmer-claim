const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
const { connectionString, useConnectionString, storageAccount, appDocumentsContainer } = require('../../config').storageConfig
let container

const connect = () => {
  let blobServiceClient
  if (useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else {
    const uri = `https://${storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
  }
  container = blobServiceClient.getContainerClient(appDocumentsContainer)
}

const getBlob = async (filename) => {
  return container.getBlockBlobClient(`${filename}`)
}

const downloadFile = async (filename) => {
  const blob = await getBlob(filename)
  return blob.downloadToBuffer()
}

const writeFile = async (filename, content) => {
  const blob = container.getBlockBlobClient(filename)
  await blob.upload(content, content.length)
}

module.exports = {
  connect,
  writeFile,
  downloadFile
}
