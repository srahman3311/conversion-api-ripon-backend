const axios = require("axios");


const makeApiCall = async (endpoint, headers, body) => {

    try {

        const response = await axios.post(endpoint, body, headers);

        return response.data;

    } catch(error) {
        
        return "Something went wrong";
    }
    

}


module.exports = makeApiCall;