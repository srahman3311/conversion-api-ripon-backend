require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Important read - How to send a file using nodejs
// https://maximorlov.com/send-a-file-with-axios-in-nodejs/

// Express Module
const app = express();

// Cross Platform Resource Sharing
app.use(cors());

// Middlewares
app.use(fileUpload()); // File system upload middleware, not database upload
app.use(express.json());




app.post("/convert", async (request, response) => {

    //return response.status(200).send("Ok");

    // Destructuring request body to get targetFileFormat
    let { targetFileFormat } = request.body;

    // Initializing category with the value document. If target file format is not jpg or mp3 then 
    let category = "document";

    if(targetFileFormat === "WORD") targetFileFormat = "docx"
    if(targetFileFormat === "POWERPOINT") targetFileFormat = "pptx";

    // If target file format is jpg or mp3 then update the category as image or audio
    if(targetFileFormat === "JPG") category = "image";
    if(targetFileFormat === "MP3") category = "audio";

    // File is parsed by express-fileupload middleware. File data is saved temporarily in application's memory
    const file = request.files.file;

    // Appending a file to form data requires either buffer or stream. express-fileupload middleware lets us
    // access file's buffer by tapping into file.data property. Third argument of data.append is also a must. 
    // It's the file's original name 
    const data = new FormData();
    data.append("file", file.data, file.name);

    // To send a local file we need to use fs.createReadStream method in the following way. But I didn't find any
    // use case of sending local files, because user is going to upload the file and we need to send it. Unless we
    // want to save the file first in the disk we don't need this at all. But putting it here if we see a use case 
    // in the future

    // const file = fs.createReadStream("./public/images/" + file.name)
    // data.append("file", file)

    console.log(targetFileFormat, category)
    
    const endpoint = "https://api2.online-convert.com/jobs";
    let config = { 
        headers: {
            "x-oc-api-key": process.env.API_KEY,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
    }

    const requestBody = {
        "conversion": [{
            "category": category,
            "target": targetFileFormat.toLowerCase()
        }]
    }

    try {

        const newResponse = await axios.post(endpoint, requestBody, config);

        const { id, server } = newResponse.data;
        
        const conversionEndpoint = `${server}/upload-file/${id}`;

        // Before calling conversion endpoint we need to do a several things. First we need to add maxContentLength
        // and maxBodyLength to axios config. After that we need add two properties to the axios headers. 
        // One is form type (example - multipart/form-data) and another is unique file id generated by uuid package
        config.maxContentLength = Infinity;
        config.maxBodyLength = Infinity;
        config.headers = {
            ...config.headers, 
            "x-oc-upload-uuid": uuidv4(),
            ...data.getHeaders()
        }

        try {

            const conversionResponse = await axios.post(conversionEndpoint, data, config);

            config = {
                headers: {
                    "x-oc-api-key": process.env.API_KEY,
                    "Cache-Control": "no-cache"
                }
            }

            const jobEndpoint = "https://api2.online-convert.com/jobs/" + id;

            // Initializing interval with five seconds, but need to dynamically update if video file is being converted
            let interval = 5000;

            // If category is audio then video file is being converted. As video files are expected to be large in
            // size so delay must be greater than initially set value
            if(category === "audio") interval = 10000;

            // We need to poll the request to know when the conversion completes. Because not immediately file
            // conversion will be completed so we need to make api calls in regular intervals. Once the conversion
            // job is complete we will send the download url to client
            try {

                // It's a recursive function. It will call itself until the conversion is completed
                getJobInfo();

                function getJobInfo() {

                    setTimeout(async () => {

                        const jobResponse = await axios.get(jobEndpoint, config);

                        // If conversion is complete send the downloadUri to client
                        if(jobResponse.data.status.code === "completed") {
                            return response.status(200).send(jobResponse.data.output[0].uri)
                        }

                        // Conversion is still processing make another api call to know the status after 2 seconds
                        getJobInfo();
                        
                    }, interval);
                }

            } catch(error) {
                console.log("initial error: " + error.response.data);
                return response.status(500).send("Something went wrong")
            } 
        } catch(error) {
            console.log(error.response.data);
            return response.status(500).send("Something went wrong")
        }
    } catch(error) {
        console.log(error.response.data);
        return response.status(500).send("Something went wrong")
    }
})




app.post("/remote-convert", async (request, response) => {

    // https://comicsnake.com/uploads/posts/2020-03/1585224686_03.jpg

    const endpoint = "https://api2.online-convert.com/jobs";
    const config = {
        headers: {
            "x-oc-api-key": process.env.API_KEY,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
    }

    const requestBody = {
        "input": [{
            "type": "remote",
            "source": "https://comicsnake.com/uploads/posts/2020-03/1585224686_03.jpg"
        }],
        "conversion": [{
            "target": "png"
        }]
    }

    try {

        const newResponse = await axios.post(endpoint, requestBody, config);

        const id = newResponse.data.id;

        const jobConfig = {
            headers: {
                "x-oc-api-key": process.env.API_KEY,
                "Cache-Control": "no-cache"
            }
        }

        try {

            const jobEndpoint = "https://api2.online-convert.com/jobs/" + id;

            const jobResponse = await axios.get(jobEndpoint, jobConfig);
            console.log("data");
            console.log(jobResponse.data);

            return response.status(200).send("OK");

        } catch(error) {
            console.log(error.response.data);
            return response.status(500).send("Something went wrong");
        }
        
        

    } catch(error) {
        console.log(error.response.data);
        return response.status(500).send("Something went wrong");
    }

    

})


// Port & Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`server started on port ${PORT}`));

