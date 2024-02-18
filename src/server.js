const http = require('http');
const url = require('url'); // url module
const query = require('querystring'); // for parsing querystrings from url
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request, response, handler) => {
  const body = [];

  // If there is an error, write it to the console and send
  // back a 400-Bad Request error to the client.
  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  // Each time we get a piece of the body, put it in the array.
  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // When the request is finished sending and we have recieved
  // all of the information, turn the body array into a single entity
  // using Buffer.concat, then turn that into a string.
  // With that string, we can use the querystring library to turn it into an object
  // stored in bodyParams.
  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    // Once we have the bodyParams object, we will call the handler function. We then
    // proceed much like we would with a GET request.
    handler(request, response, bodyParams);
  });
};

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
  // If they go to /addUser
  if (parsedUrl.pathname === '/addUser') {
    // Call our parseBody handler, and pass in the
    // jsonHandler.addUser function as the handler callback function.
    parseBody(request, response, jsonHandler.addUser);
  }
};

const urlStruct = {
  GET: {
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getStyle,
    '/getUsers': jsonHandler.getUsers,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getUsers': jsonHandler.getUsersMeta,
    notFound: jsonHandler.notFound,
  },
};

// function to handle requests
const onRequest = (request, response) => {
  console.log(request.url);

  // first we have to parse information from the url
  const parsedUrl = url.parse(request.url);

  // check if method was POST, otherwise use urlStruct
  // for the sake of this example
  if (request.method === 'POST') {
    return handlePost(request, response, parsedUrl);
  }
  if (!urlStruct[request.method]) {
    return urlStruct.HEAD.notFound(request, response);
  }

  if (urlStruct[request.method][parsedUrl.pathname]) {
    return urlStruct[request.method][parsedUrl.pathname](request, response);
  }

  return urlStruct[request.method].notFound(request, response);
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});
