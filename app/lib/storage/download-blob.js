const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
const { connectionString, useConnectionString, storageAccount } = require('../../config').storageConfig

const downloadBlob = async (container, file) => {
  let blobServiceClient
  if (useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else {
    const uri = `https://${storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
  }

  const client = blobServiceClient.getContainerClient(container)

  if (await client.exists()) {
    try {
      const blob = client.getBlockBlobClient(file)
      return (await blob.downloadToBuffer()).toString()
    } catch (e) {
      console.error(e)
    }
  }
  return undefined
}

module.exports = downloadBlob
