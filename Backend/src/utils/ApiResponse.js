class ApiResponse{
    constructor(statusCode,data,messaage="Success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = messaage;
        this.success = statusCode<400
        }
}

export {ApiResponse}