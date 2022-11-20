const express = require('express');
const router = express.Router();

const {createUser , userLogin,} = require("../controllers/userController")
const {createBook,getBooks, getBooksById,updateBooksById,deleteBookById } = require("../controllers/bookController")
const {auth} = require("../middleware/auth");
const { createReview,updateReview, deleteReview} = require('../controllers/reviewController');


///////////////////////////////////////////////////////////////////// USER ROUTE HANDLER /////////////////////////////////////////////////////////////////////////////////////////////

router.post('/register',createUser)

router.post('/login', userLogin)


///////////////////////////////////////////////////////////////////// BOOK ROUTE HANDLER /////////////////////////////////////////////////////////////////////////////////////////////

router.post('/books',auth, createBook)

router.get('/books',auth, getBooks)

router.get('/books/:bookId',auth, getBooksById)

router.put('/books/:bookId',auth, updateBooksById)

router.delete('/books/:bookId',auth,deleteBookById)


///////////////////////////////////////////////////////////////////// REVIEW ROUTE HANDLER /////////////////////////////////////////////////////////////////////////////////////////////

router.post('/books/:bookId/review', createReview)

router.put('/books/:bookId/review/:reviewId', updateReview)

router.delete('/books/:bookId/review/:reviewId', deleteReview)






module.exports = router;



router.all("/**", function (req, res) {   
    res.status(404).send({
        status: false,
        msg: "The api you request is not available"
    })
});





