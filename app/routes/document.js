const { connect,  writeFile } = require('../lib/storage/document-store')
const allowedFileExtensions = ['doc','docx']
module.exports = [{
  method: 'GET',
  path: '/document',
  options: {
    handler: async (request, h) => {
      return h.view('document')
    }
  }
},
  {
    method: 'POST',
    path: '/document',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        allow: 'multipart/form-data',
        maxBytes: 2 * 1048576 //2MB
      },
      handler: async (request, h) => {        
        const fileDetails = request.payload.file.hapi
        const contentBuffer = request.payload.file._data
        const fileExtension =fileDetails.filename.split('.').pop().toLowerCase()
        
        //validate
        if( allowedFileExtensions.indexOf(fileExtension) === -1){          
          return h.view('document', { errorMessage: { text: `Invalid file type .${fileExtension}.`, success: false } })
        }
        try {
          //upload
          connect();
          writeFile(fileDetails.filename,contentBuffer)
          //return success        
          return h.view('document', { errorMessage: { text: "File Uploaded successfully", success: true } })
        }
        catch(err) {
          return h.view('document', { errorMessage: { text: `Something went wrong while uploading file ${fileDetails.filename}.`, success: false } })
        }
      }
    }
  }]