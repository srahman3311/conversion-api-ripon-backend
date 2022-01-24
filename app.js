require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fileUpload = require("express-fileupload");
const FormData = require("form-data");
const axios = require("axios");

// Express Module
const app = express();



// Cross Platform Resource Sharing
//app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cors());

// Without express-fileupload we cannot access request.files
app.use(fileUpload()); // File system upload middleware, not database upload

// Static Files
app.use(express.static(__dirname + "/public"));

// Middlewares
app.use(express.json());
//app.use(express.urlencoded({ extended: true }))



app.post("/upload", async (request, response) => {


    const imageFile = request.files.file;



    // mv method is given by express-fileupload package
    imageFile.mv(`./public/images/${imageFile.name}`, async (uploadError) => {


        if(uploadError) return response.status(500).send("Something went wrong");

        const filePath = path.join(__dirname, "/public/images/", imageFile.name);
        
        const file = fs.createReadStream(filePath);

        const data = new FormData();
        data.append("file", file);

        const endpoint = "https://api2.online-convert.com/jobs";
        const config = {
            headers: {
                "x-oc-api-key": process.env.API_KEY,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            }
        }

        const requestBody = {
            "conversion": [{
                "category": "document",
                "target": "pdf"
            }]
        }

        try {

            const newResponse = await axios.post(endpoint, requestBody, config);
    
            const { id, server } = newResponse.data;
            
            const conversionEndpoint = `${server}/upload-file/${id}`;
            const newConfig = {
                headers: {
                    "x-oc-api-key": process.env.API_KEY,
                    "x-oc-upload-uuid": "random_tex",
                    ...data.getHeaders()

                }
            }
    
            try {
    
                const conversionResponse = await axios.post(conversionEndpoint, data, newConfig);
                console.log(conversionResponse.data);

                const jobConfig = {
                    headers: {
                        "x-oc-api-key": process.env.API_KEY,
                        "Cache-Control": "no-cache"
                    }
                }

                const jobEndpoint = "https://api2.online-convert.com/jobs/" + id

                try {

                    getJobInfo();

                    function getJobInfo() {

                        setTimeout(async () => {

                            const jobResponse = await axios.get(jobEndpoint, jobConfig);

                            if(jobResponse.data.status.code === "completed") {
                                return response.status(200).send(jobResponse.data.output[0].uri)
                            }

                            getJobInfo();
                            
                        }, 2000);

                    }

                } catch(error) {
                    console.log(error.response.data);
                } 
    
            } catch(error) {
                console.log(error.response.data);
            }
    
        } catch(error) {
            console.log(error.response.data);
        }
    
        
        /*

        file.on("data", async (chunk) => {
            
            const data = new FormData();
            data.append("file", chunk, {
                contentType: imageFile.type,
                filename: imageFile.name
            });

       

            const endpoint = "https://api2.online-convert.com/jobs";
            const config = {
                headers: {
                    "x-oc-api-key": process.env.API_KEY,
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache"
                }
            }
    
            const requestBody = {
                "conversion": [{
                    "category": "image",
                    "target": "png"
                }]
            }

            try {

                const newResponse = await axios.post(endpoint, requestBody, config);
        
                const { id, server } = newResponse.data;
               
                const conversionEndpoint = `${server}/upload-file/${id}`;
                const newConfig = {
                    headers: {
                        "x-oc-api-key": process.env.API_KEY,
                        "x-oc-upload-uuid": "random_tex",
                        "Content-Type": "multipart/form-data",

                    }
                }
        
                try {
        
                    const conversionResponse = await axios.post(conversionEndpoint, data, newConfig);
                    console.log(conversionResponse.data);
        
                } catch(error) {
                    console.log(error.response.data);
                }
        
            } catch(error) {
                console.log(error.response.data);
            }
        
            return response.status(200).send("Hello");

        })
        */

    });
    
})


app.post("/remote-upload", async (request, response) => {

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


















// Inserting a user
/*
let password = "ubaid123";

bcrypt.genSalt(10, (err, salt) => {
    if(err) throw err;

    bcrypt.hash(password, salt, (err, hash) => {

        if(err) throw err;
        password = hash;


        const sql = "insert into users values ?";
        const values = [[1003, "Ubaid", "Rahman", "ubaid123", "Director", password, "admin", "active"]];


        connection.query(sql, [values], err => {
            if(err) throw err;

            console.log("values inserted");
        });
    });

});

*/

/*

let sql = "insert into payorders values ?";
let values = [
    [1045, '2020-12-26', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, 'not released', 'pending', 'added'],
    [1046, '2020-12-27', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, 'not released', 'pending', 'added'],
    [1047, '2020-12-28', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1048, '2020-12-29', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1049, '2020-12-30', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1050, '2020-12-31', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1051, '2020-12-10', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1052, '2020-12-11', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1053, '2020-12-12', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1054, '2020-12-13', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1055, '2020-12-14', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1056, '2020-12-14', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1057, '2020-12-15', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1058, '2020-12-15', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1059, '2020-12-16', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1060, '2020-12-15', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1061, '2020-12-25', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1062, '2020-12-28', 'cube3311', 'Rupali', 'Uttara', 'Ubaid', 2825.20, "not released", "pending", 'added'],
    [1063, '2020-12-27', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1064, '2020-12-09', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1065, '2020-12-11', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1066, '2020-12-11', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1067, '2020-12-13', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1068, '2020-12-18', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1069, '2020-12-13', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1070, '2020-12-18', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1071, '2020-12-19', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1072, '2020-12-19', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1073, '2020-12-20', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1074, '2020-12-20', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1075, '2020-12-21', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1076, '2020-12-21', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1077, '2020-12-22', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1078, '2020-12-23', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1079, '2020-12-24', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1080, '2020-12-24', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1081, '2020-12-24', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1082, '2020-12-18', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1083, '2020-12-13', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1084, '2020-12-14', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],
    [1085, '2020-12-11', 'square42', 'Janata', 'mirpur', 'Dhoni', 2825.20, 'not released', 'pending', 'added'],


];

connection.query(sql, [values], (err, result) => {
    if(err) throw err;
    console.log("one row added");
});


*/










/*
let sql = "insert into jobs values ?";
let values = [
    [1052, 'A', 'A-3', 'Construction', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1053, 'A', 'A-4', 'HUUUUU', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1054, 'A', 'A-5', 'Done', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1055, 'A', 'A-6', 'Uli', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1056, 'A', 'A-7', 'Kueer', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1057, 'C', 'C-1', 'Werik', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1058, 'C', 'C-2', 'Hubby', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1059, 'A', 'A-8', 'Jker', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1060, 'A', 'A-9', 'Gathering', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1061, 'A', 'A-10', 'Sticker', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1062, 'A', 'A-12', 'Label', 25344.20, 258578.20, 2825.20, 254857, 'active'],
    [1063, 'A', 'A-13', 'Heavy Plant', 25344.20, 258578.20, 2825.20, 254857, 'active']


];

connection.query(sql, [values], (err, result) => {
    if(err) throw err;
    console.log("one row added");
});
*/









