
const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const validator = require('../validator/validator')
const reviewModel = require("../models/reviewModel")
const aws= require("aws-sdk")



aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    let s3= new aws.S3({apiVersion: '2006-03-01'}); 

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  
        Key: "abc/" + file.originalname,  
        Body: file.buffer
    }

    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        return resolve(data.Location)
    })
})
}









exports.createBook = async (req, res) => {

    try {

        let data = req.body;  //getting data from request body
        let userloged = req.decodedToken //decodedToken is present in request that we have set in auth middleware it contains loggedIn UserId
        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt,bookCover } = data //Destructuring data

         if (Object.keys(data).length == 0)  //checking is there any data is provided in request body or not
           return res.status(400).send({ status: false, message: "you have to enter all details" })

       // Validation for all fields
        
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "title required" })
        }
        if (!validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "excerpt required" })
        } if (!userId) {
            return res.status(400).send({ status: false, message: "UserId required" })
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(403).send({ status: false, message: "provide valid userId" })
        }
        if (!validator.isValid(category)) {
            return res.status(400).send({ status: false, message: "category required" })
        }
        if (!validator.isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "ISBN required" })
        }
        if (!validator.isValidIsbn(ISBN)) {
            return res.status(400).send({ status: false, message: "Please enter a valid ISBN number" })
        }
        if (!validator.isValid(subcategory)) {
            return res.status(400).send({ status: false, message: "subcategory required" })
        }
          
        if (!validator.isValid(releasedAt)) {
            return res.status(400).send({ status: false, message: "releasedAt required" })
        }
       
         if(subcategory.length == 0) return res.status(400).send({status: false , message: "Please enter valid string in subcategory"})
        if (data.isDeleted === true) {  //if document is set to deleted true it will create timestamp
            let DeletedAt = new Date()
            data.deletedAt = DeletedAt
        }

        //aws //
        let files=req.files

        if (!(files&&files.length)) {
           return res.status(400).send({ status: false, message: " Please Provide The bookCover" });}

         const uploadedBookCover = await uploadFile(files[0])

         data.bookCover=uploadedBookCover

        if (!validator.isValidDate(releasedAt)) { return res.status(400).send({ status: false, msg: "Please enter date in YYYY-MM-DD" }) }

        const checktitle = await bookModel.findOne({ title: title }) //validation incase same title exists
    if (checktitle) { return res.status(400).send({ status: false, message: "Title already exists please enter new Title" }) }
       const checkIsbn = await bookModel.findOne({ ISBN: ISBN })  //validation incase same title exists
        if (checkIsbn) { return res.status(400).send({ status: false, message: "ISBN already exists please enter new ISBN" }) }

      if (userId != userloged) { //In this block verifying BookId belongs to same user or not
            return res.status(403).send({ status: false, data: "Not authorized" })
         }
        const saveBook = await bookModel.create(data)
        return res.status(201).send({ status: true, message: "Book successfully created", data: saveBook })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }


}


/////////////////////////////////////////////////////////////////////Get Books /////////////////////////////////////////////////////////////////////////////////////////////


exports.getBooks = async (req, res) => {

    try {
        let query = req.query  //getting data from query params   

        if (Object.keys(query).length == 0) {   //This block will work to fetch all books incase no filter is provided

            let book = await bookModel.find({ isDeleted: false }).sort({ title: 1 }).select({createdAt: 0 , updatedAt:0 , __v:0 , isDeleted: 0,subcategory:0, ISBN:0})
            book.sort((a, b) => a.title.localeCompare(b.title)) //enables caseInsensitive and sort the array 
            if (book.length == 0) return res.status(404).send({ status: false, message: "No book found" });

            return res.status(200).send({ status: false, message: "Book list", data: book })
        }
        if (query.userId) {  //validation to check that is valid userId or not
            if (!validator.isValidObjectId(query.userId)) return res.status(400).send({ status: false, message: "Please Provide Valid User Id" });
        }

        let filter = {
            isDeleted: false
        };
        if (Object.keys(query).length !== 0) { //this block will work in case filter is provided


            if (query.subcategory) {
                query.subcategory = { $in: query.subcategory.split(",") };
            }
            filter['$or'] = [
                { userId: query.userId },
                { category: query.category },
                { subcategory: query.subcategory }
            ];
        }

        let filterByquery = await bookModel.find(filter).sort({ title: 1 }).select({createdAt: 0 , updatedAt:0 , __v:0, isDeleted: 0,subcategory:0,ISBN:0}) //finding book from database 
        filterByquery.sort((a, b) => a.title.localeCompare(b.title)) //enables caseInsensitive and sort the array

        if (filterByquery.length == 0) return res.status(404).send({ status: false, message: "No Book found" })
        return res.status(200).send({ status: true, message: "Books list", data: filterByquery });
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}


/////////////////////////////////////////////////////////////////////Get Book By Id /////////////////////////////////////////////////////////////////////////////////////////////


exports.getBooksById = async function (req, res) {

    try {
        let bookId = req.params.bookId; //getting bookId from params  

        //Validation to check is that valid bookId or not
        if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please Provide Valid Book Id" });

        const book = await bookModel.findOne({ _id: bookId }).select({ __v: 0, ISBN: 0 })  // finding book using bookId
        if (!book) { return res.status(404).send({ status: false, message: "book not found" }) }

        if (book.isDeleted == true) return res.status(404).send({ status: false, message: "Book is deleted or not found" })

        let reviews = await reviewModel.find({ bookId: book._id, isDeleted: false }).select({ isDeleted: 0, __v: 0, createdAt: 0, updatedAt: 0 })

        let booksWithReview = book.toObject();  //converting book document to object
        Object.assign(booksWithReview, { reviewsData: reviews }); //copying object using object.assign method
        return res.status(200).send({ status: true, message: "Books List", data: booksWithReview })


    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}
/////////////////////////////////////////////////////////////////////Update Book By Id /////////////////////////////////////////////////////////////////////////////////////////////


exports.updateBooksById = async (req, res) => {
    try {

        let bookId = req.params.bookId; //getting bookId from params  
        let userloged = req.decodedToken; //decodedToken is present in request that we have set in auth middleware it contains loggedIn UserId

        const { title, excerpt, releasedAt, ISBN } = req.body //Destructuring data comming from request body

        //Validation to check is that valid bookId or not
        if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please provide valid bookId" });

        //checking is there any data is provided in request body or not
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please enter data in  body" });

        let book = await bookModel.findById(bookId)
        if (!book || book.isDeleted == true) { return res.status(404).send({ status: false, message: "book not found or already deleted" }) }

        // comparing userID got from book document with userId from decodedToken
        if (book.userId != userloged) return res.status(403).send({ status: false, message: "Not Authorised" })

        //Validation for all fields
        if (title) {
            if (!validator.isValid(title)) {
                return res.status(400).send({ status: false, message: "Enter title in correct format" })
            }
            const dublicateTitle = await bookModel.findOne({ title: title })

            if (dublicateTitle) {
                return res.status(400).send({ status: false, message: `${title} is already exists please enter new title` })
            }
        }
        if (ISBN) {
            if (!validator.isValidIsbn(ISBN)) {
                return res.status(400).send({ status: false, message: "ISBN is in incorrect format" })
            }

            let dublicateISBN = await bookModel.findOne({ ISBN: ISBN })
            if (dublicateISBN) {
                return res.status(400).send({ status: false, message: `ISBN already exists please enter new ISBN` })
            }
        }

        if (releasedAt) {
            if (!validator.isValid(releasedAt) || !validator.isValidDate(releasedAt)) {
                return res.status(400).send({ status: false, message: "releasedAt is in incorrect format (YYYY-MM-DD)" })
            }
        }


        const updateBook = await bookModel.findOneAndUpdate({ _id: bookId }, { title: title, excerpt: excerpt, releasedAt: releasedAt, $set: { ISBN: ISBN } }, { new: true })
        return res.status(200).send({ status: true, message: "Updated Succesfully", data: updateBook })


    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }

}

exports.deleteBookById = async (req, res) => {

    try {

        let id = req.params.bookId;
        let userloged = req.decodedToken //decodedToken is present in request that we have set in auth middleware it contains loggedIn UserrId

        if (!validator.isValidObjectId(id)) {   //Validation to check is that valid bookId or not
            return res.status(400).send({ status: false, messageg: 'BookId is invalid.' });
        }

        if (id) {
            let findbook = await bookModel.findById(id)  // checking if book is available in DB or not
            if (!findbook) return res.status(404).send({ status: false, messageg: `no book found by this BookID:${id}` });

            // comparing userID got from book document with userId from decodedToken
            if (findbook.userId != userloged) {
                return res.status(403).send({ status: false, data: "Not authorized" })
            }

            if (findbook.isDeleted == false) {
                await bookModel.findOneAndUpdate(
                    { _id: id },
                    {
                        isDeleted: true, deletedAt: new Date()
                    });
                return res.status(200).send({ status: true, message: "Your data deleted successfully" });

            } else {
                return res.status(404).send({ status: false, message: "Book already deleted" });
            }
        }
    } catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
}


