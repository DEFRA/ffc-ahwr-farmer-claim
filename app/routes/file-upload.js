const { connect, writeFile } = require('../lib/storage/document-store')
const fileExtensionRegEx = /\.(docx|DOCX|doc|DOC)$/
module.exports = [{
  method: 'GET',
  path: '/file-upload',
  options: {
    handler: async (request, h) => {
      return h.view('file-upload')
    }
  }
},
{
  method: 'POST',
  path: '/file-upload',
  options: {
    payload: {
      output: 'stream',
      parse: true,
      failAction: async (request, h, _error) => {
        return h.view('file-upload', { ...request.payload, errorMessage: { text: 'file size is greater than 2MB.' } }).code(400).takeover()
      },
      multipart: true,
      allow: 'multipart/form-data',
      maxBytes: 2 * 1048576 // 2MB
    },
    handler: async (request, h) => {
      const fileDetails = request.payload.file.hapi
      const contentBuffer = request.payload.file._data
      const fileExtension = fileDetails.filename.split('.').pop().toLowerCase()

      // validate
      if (!fileExtensionRegEx.test(fileDetails.filename)) {
        return h.view('file-upload', { errorMessage: { text: `${fileDetails.filename} file has invalid type .${fileExtension}.`, success: false } }).code(400).takeover()
      }
      try {
        // upload
        connect()
        writeFile(fileDetails.filename, contentBuffer)
        // return success
        return h.view('file-upload', { errorMessage: { text: `${fileDetails.filename} file Uploaded successfully`, success: true } })
      } catch (err) {
        return h.view('file-upload', { errorMessage: { text: `Something went wrong while uploading file ${fileDetails.filename}.`, success: false } })
      }
    }
  }
}]
