import {
    asyncHandler,
    apiError,
    apiResponse,
    uploadOnCloudinary,
} from "../utils/index.js";
import User from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(
            500,
            "Something went wrong while generating token !!"
        );
    }
};

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
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    )
        coverImageLocalPath = req.files.coverImage[0].path;

    if (!avtarLocalPath) {
        throw new apiError(400, "Avtar is required !!");
    }

    //! step 5 :: upload coverImage or avtar on cloudinary
    const avtarCloud = await uploadOnCloudinary(avtarLocalPath);

    let coverImageCloud;
    if (coverImageLocalPath)
        coverImageCloud = await uploadOnCloudinary(coverImageLocalPath);
    if (!avtarCloud) throw new apiError(400, "Avtar is required !!");

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

const loginUser = asyncHandler(async (req, res) => {
    // ? get data from user request.
    // ? check user is existing or not?. ( email, userName )
    // ? check the password is match or not.
    // ? if password is matchen then create ( access token, refresh token )
    // ? send secure token via cookies

    // step 1 :: get data from user request
    const { username, email, password } = req.body;
    if (!username && !email)
        throw new apiError(401, "Username or email is required !!");

    // step 2 :: check user is existing or not. ( email, userName )
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!existingUser) throw new apiError(404, "User not found !!");

    // step 3 :: check existing user password
    const passwordCheck = await existingUser.isPasswordCorrect(password);
    if (!passwordCheck) throw new apiError(401, "Invalid user credentials !!");

    // step 4 :: create access and refresh token.
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        existingUser._id
    );

    // step 5 :: set access and refresh token in cookies.
    // updated user data with refresh token.

    const updatedUser = await User.findById(existingUser._id).select(
        "-password -refreshToken"
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("access_token", accessToken, option)
        .cookie("refresh_token", refreshToken, option)
        .json(
            new apiResponse(
                200,
                {
                    user: updatedUser,
                    accessToken,
                    refreshToken,
                },
                "user created successfully !!"
            )
        );
});

export { registerUser, loginUser };
