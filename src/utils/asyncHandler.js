// make high order funtion with promise
const asyncHandler = (request) => {
  (req, res, next) => {
    Promise.resolve(request(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;

// make high order funtion with try catch

// const asyncHandler = (request) => async (req, res, next) => {
//   try {
//     await request(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({ success: false, message: err.message });
//   }
// };

// ! same funcationality of both function but written syntax are different !!
