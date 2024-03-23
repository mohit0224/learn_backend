import User from "../models/user.model.js";
import {
    asyncHandler,
    apiError,
    apiResponse,
    uploadOnCloudinary,
} from "../utils/index.js";
import jwt from "jsonwebtoken";

//! ----------------------------------------------------------------
//! -----------------generate tokens fnc----------------------------
//! ----------------------------------------------------------------
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

//! ----------------------------------------------------------------
//! -----------------cookies option---------------------------------
//! ----------------------------------------------------------------
const option = {
    httpOnly: true,
    secure: true,
};

//! ----------------------------------------------------------------
//! -----------------register user----------------------------------
//! ----------------------------------------------------------------
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

//! ----------------------------------------------------------------
//! -----------------login user-------------------------------------
//! ----------------------------------------------------------------
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

//! ----------------------------------------------------------------
//! -----------------logout user------------------------------------
//! ----------------------------------------------------------------
const loggedOut = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("access_token", option)
        .clearCookie("refresh_token", option)
        .json(new apiResponse(200, {}, "user logged out successfully !!"));
});

//! ----------------------------------------------------------------
//! -----------------refresh user token-----------------------------
//! ----------------------------------------------------------------
const refreshUserToken = asyncHandler(async (req, res) => {
    // get refresh token from cookie/req.body
    // verify the refresh token
    // get user info from verifiedToken
    // match imcomingToken with user info refreshToken
    // generate new tokens
    //

    // ? step 1 :: get refresh token
    const incomingRefreshToken =
        req.cookies.refresh_token || req.body.refreshToken;
    if (!incomingRefreshToken)
        throw new apiError(401, "Invalid refresh token !!");

    try {
        // ? step 2 :: verify the token
        const verifiedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN
        );

        // ? step 3 :: get user from verifiedToken
        const user = await User.findById(verifiedToken._id);
        if (!user) throw new apiError(401, "Invaild refresh token !!");

        // ? step 4 :: match incoming token with user.token
        if (incomingRefreshToken !== user?.refreshToken)
            throw new apiError(401, "Refresh token is expired or used !!");

        // ? step 5 :: generate new tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        res.status(200)
            .cookie("access_token", accessToken, option)
            .cookie("refresh_token", refreshToken, option)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed !!"
                )
            );
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token !!");
    }
});

//! ----------------------------------------------------------------
//! -----------------change current user password-------------------
//! ----------------------------------------------------------------
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword && !newPassword)
        throw new apiError(401, "Enter old and new password !!");
    else if (oldPassword === newPassword)
        throw new apiError(
            401,
            "New password cann't be same as old password !!"
        );
    else if (!oldPassword)
        throw new apiError(401, "Old password is required !!");
    else if (!newPassword)
        throw new apiError(401, "New password is required !!");

    const user = await User.findById(req.user?._id);
    const passwordCheck = await user.isPasswordCorrect(oldPassword);
    if (!passwordCheck) throw new apiError(404, "Old password is incorrect !!");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new apiResponse(201, {}, "Password changed !!"));
});

//! ----------------------------------------------------------------
//! -----------------get current user-------------------------------
//! ----------------------------------------------------------------
const getCurrentUser = asyncHandler(async (req, res) =>
    res.status(200).json(new apiResponse(201, req.user, "Current user !!"))
);

//! ----------------------------------------------------------------
//! -----------------update account details-------------------------
//! ----------------------------------------------------------------
const updateAccount = asyncHandler(async (req, res) => {
    const { fullName, username, email } = req.body;
    if (!fullName && !username && !email)
        throw new apiError(401, "Please enter the feilds !!");

    const existedUserByUsername = await User.findOne({ username });
    if (existedUserByUsername)
        throw new apiError(401, `User with ( ${username} ) already exists`);

    const existedUserByEmail = await User.findOne({ email });
    if (existedUserByEmail)
        throw new apiError(401, `User with ( ${email} ) already exists`);

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: fullName || req.user.fullName,
                username: username || req.user.username,
                email: email || req.user.email,
            },
        },
        { new: true }
    );

    res.status(200).json(
        new apiResponse(200, { updatedUser }, "Successfully updated !!")
    );
});

export {
    registerUser,
    loginUser,
    loggedOut,
    refreshUserToken,
    changePassword,
    getCurrentUser,
    updateAccount,
};
