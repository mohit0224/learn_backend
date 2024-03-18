import {
    asyncHandler,
    apiError,
    apiResponse,
    uploadOnCloudinary,
} from "../utils/index.js";
import User from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
    //? get user information from frontend.
    //? check validations.
    //? check if the user is existed or not.
    //? check image, avtar.
    //? upload image, avtar on cloudinary.
    //? create user object. Upload or save user object on db.
    //? check user created or not, and remove user password and refresh token fields.
    //? return res.

    //! spet 1 :: get user information
    const { username, fullName, email, password } = req.body;

    //! step 2 :: check empty field validation
    if (
        [username, fullName, email, password].some(
            (fields) => fields?.trim() === ""
        )
    ) {
        throw new apiError(400, "all fields are required !!");
    }

    //! step 3 :: check user existence
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new apiError(
            409,
            "user already exists with this username or email !!"
        );
    }

    //! step 4 :: check coverImage or avtar
    const avtarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avtarLocalPath) {
        throw new apiError(400, "Avtar is required !!");
    }

    //! step 5 :: upload coverImage or avtar on cloudinary
    const avtarCloud = await uploadOnCloudinary(avtarLocalPath);
    const coverImageCloud = await uploadOnCloudinary(coverImageLocalPath);
    if (!avtarCloud) {
        throw new apiError(400, "Avtar is required !!");
    }

    //! step 6 :: create user object upload on db
    const newUser = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avtarCloud.secure_url,
        coverImage: coverImageCloud?.secure_url || "",
    });

    //! step 7 :: check user created or not
    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new apiError(500, "Something went wrong while creating user !!");
    }

    //! step 8 :: return res
    return res
        .status(201)
        .json(
            new apiResponse(200, createdUser, "user created successfully !!")
        );
});

export { registerUser };
