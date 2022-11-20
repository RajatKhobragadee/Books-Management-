const reviewModel = require('../models/reviewModel')
const bookModel = require('../models/bookModel')
const validator = require('../validator/validator')

///////////////////////////////////////////////////////////////////// CREATE REVIEW /////////////////////////////////////////////////////////////////////////////////////////////

exports.createReview = async (req, res) => {
  try {
    let id = req.params.bookId; //getting book Id from request params

    //Validation to check is that valid bookId or not
    if (!validator.isValidObjectId(id)) return res.status(400).send({ status: false, message: "Please enter valid bookId" });

    let checkBook = await bookModel.findById(id);
    if (!checkBook) return res.status(404).send({ status: false, message: "Book not found" });

    if (checkBook.isDeleted == true) return res.status(404).send({ status: false, message: "Book is already deleted" });

    let data = req.body; // getting data from request body

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please provide data in body" });

    let { review, rating, reviewedBy } = data;  //Destructuring data

    if (!rating) return res.status(400).send({ status: false, message: "Rating is required and should not be zero" });

    if (validator.validString(reviewedBy) || validator.validString(review)) return res.status(400).send({ status: false, send: "Please enter rewiew and reviewdBy in a valid string" });

    if (!validator.validString(rating)) return res.status(400).send({ status: false, message: "Please enter rating in digits" });

    if (!((rating < 6) && (rating > 0))) return res.status(400).send({ status: false, message: "Rating should be between 1 - 5 numbers" });



    data.bookId = id //storing bookId got from params inside reviews bookId

    let reviewDa = await reviewModel.create(data)  // creating review document

    let newReview = await reviewModel.find(reviewDa).select({ __v: 0, createdAt: 0, updatedAt: 0 })

    let check = await bookModel.findByIdAndUpdate(
      { _id: id },
      { $inc: { reviews: 1 } },
      { new: true }
    )

   let bookData = check.toObject(); //converting book document to object
    Object.assign(bookData, { reviewsData: newReview });  //copying object using object.assign method

    return res.status(201).send({ status: true, message: "Success", data: bookData })
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message })
  }
}

///////////////////////////////////////////////////////////////////// UPDATE REVIEW /////////////////////////////////////////////////////////////////////////////////////////////



exports.updateReview = async (req, res) => {
  try {

    let id = req.params;
    let { bookId, reviewId } = id; // Destructuring Id's

    // here validation for ID
    if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please enter valid bookID" })

    if (!validator.isValidObjectId(reviewId)) return res.status(400).send({ status: false, message: "Please enter valid reviewID" })

    let book = await bookModel.findById(bookId);
    if (!book) return res.status(404).send({ status: false, message: "Book not found" });

    if (book.isDeleted == true) return res.status(404).send({ status: false, message: "Book is already deleted" });

    let checkReview = await reviewModel.findById(reviewId);
    if (!checkReview) return res.status(404).send({ status: false, message: "Review not found" });

    if (checkReview.bookId.toString() !== bookId) return res.status(400).send({ status: false, message: "Please enter correct bookId" })

    if (checkReview.isDeleted == true) return res.status(404).send({ status: false, message: "Review is already deleted" });

    let data = req.body;

    let { review, rating, reviewedBy } = data;   // Destructuring data
    
    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please provide data in body" });

    if (!rating) return res.status(400).send({ status: false, message: "Rating is required and should not be zero" });

    if (validator.validString(reviewedBy) || validator.validString(review)) return res.status(400).send({ status: false, send: "Please enter rewiew and reviewdBy in a valid string" });

    if (!validator.validString(rating)) return res.status(400).send({ status: false, message: "Please enter rating in digits" });

   if (!((rating < 6) && (rating > 0))) return res.status(400).send({ status: false, message: "Rating should be between 1 - 5 numbers" });

    let arrayReview = await reviewModel.findByIdAndUpdate(
      { _id: reviewId },
      data,
      { new: true }
    ).select({ __v: 0, createdAt: 0, updatedAt: 0 })

    let bookReview = book.toObject(); //converting book document to object
    Object.assign(bookReview, { reviewsData: arrayReview }); //copying object using object.assign method
    return res.status(200).send({ status: true, message: "Review Updated Successfully", data: bookReview })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

///////////////////////////////////////////////////////////////////// DELETE REVIEW /////////////////////////////////////////////////////////////////////////////////////////////

exports.deleteReview = async (req, res) => {
  try {

    let data = req.params;
    let { bookId, reviewId } = data;  // Destructuring Id's

    // here validation for ID
    if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please enter valid bookID" })

    if (!validator.isValidObjectId(reviewId)) return res.status(400).send({ status: false, message: "Please enter valid reviewID" })

    let book = await bookModel.findById(bookId);
    if (!book) return res.status(404).send({ status: false, message: "Book not found" });

    if (book.isDeleted == true) return res.status(404).send({ status: false, message: "Book is already deleted" });

    let review = await reviewModel.findById(reviewId);
    if (!review) return res.status(404).send({ status: false, message: "Review not found" });

    if (review.bookId.toString() !== bookId) return res.status(400).send({ status: false, message: "Please enter correct bookId" })

    if (review.isDeleted == true) return res.status(404).send({ status: false, message: "Review is already deleted" });

    await reviewModel.updateOne(  // setting isDeleted key true
      { _id: reviewId },
      { isDeleted: true }
    )

    await bookModel.updateOne(  // Decreasing review count by 1
      { _id: bookId },
      { $inc: { reviews: -1 } }
    )
    return res.status(200).send({ status: true, message: "Review Deleted Successfully" });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}