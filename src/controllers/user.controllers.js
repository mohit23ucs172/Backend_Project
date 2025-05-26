import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken = async(userId)=>{
  try{
const user=await User.findById(userId)
const accessToken=user.generateAccessToken()
const refreshToken=user.generateRefreshToken()

user.refreshToken=refreshToken
await user.save({validateBeforeSave:false}) // to avoid password hashing again

return {accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500,"Something went wrong while generating AccessToken And RefreshToken")
  }
}


const registerUser=asyncHandler(async (req,res)=>{
  // res.status(200).json({
  //   message:"ok"
  // })

  //get user detail from frontent
  // validation -not empty
  // check if user already exists: username,email 
  //check for images ,check for avatar
  //upload then to cloudinary,avatar
  //create user object -create entry in db
  //remove password and refresh token field from response
  //check for user creation 
  //return response


const { fullname,email,userName,password } =req.body
console.log("email: ",email)

// if(fullname===""){
// throw new ApiError(400,"Fullname is required")
// }
// if(email===""){
//   throw new ApiError(400,"Email is required")
// }
// if(userName===""){
//   throw new ApiError(400,"Username is required")
// }
// if(password===""){
//   throw new ApiError(400,"Password is required")
// }

if(
  [fullname,userName,password,email].some(
    (field)=>field?.trim()==="")
){
  throw new ApiError(400,"All fields are required")
}

const existedUser=await User.findOne({
  $or:[{userName},{email}]
})
if(existedUser){
  throw new ApiError(409,"User already exists")
}

// console.log("req.files: ",req.files)

const avatarLocalPath=req.files?.avatar[0]?.path;
// const coverImageLocalPath=req.files?.coverImage[0]?.path;



let coverImage = { url: "" }; // Default empty object

if (
  req.files &&
  Array.isArray(req.files.coverImage) &&
  req.files.coverImage.length > 0
) {
  const coverImageLocalPath = req.files.coverImage[0].path;

  if (coverImageLocalPath) {
    const uploadedCover = await uploadOnCloudinary(coverImageLocalPath);
    if (uploadedCover?.url) {
      coverImage = uploadedCover;
    }
  }
}





// let coverImageLocalPath;
// if(req.files &&Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
//   coverImageLocalPath=req.files.coverImage[0].path
// }


const avatar=await uploadOnCloudinary(avatarLocalPath)
// const coverImage=await uploadOnCloudinary(coverImageLocalPath)


 if(!avatar?.url){
  throw new ApiError(400,"Avatar file is Required")
 }

const user= await User.create({
  fullname,
  email,
  userName,
  password,
  avatar:avatar.url,
  coverImage:coverImage.url || ""
 });

const createdUser=await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(500,"SomeThing went wrong while creating User ")
}
// console.log(createdUser);
return res.status(201).json(
  new ApiResponse(200,createdUser,"User Created Successfully")
)

 })

 const loginUser =asyncHandler(async (req,res)=>{
      //req body->data
      //username or email
      //find the user
      //password Check
      //access and refreshToken
      //send cookie
      //response for login
      
      const {email,userName,password}=req.body

    if(!userName && !email){
      throw new ApiError(400,"userName or email is required")
    }
    
    const user = await User.findOne({
      $or:[{userName},{email}]
    })
    if(!user){
      throw new ApiError(404,"User not found")
    }
  const ispasswordValid=  await user.isPasswordCorrect(password)
  if(!ispasswordValid){
    throw new ApiError(401,"Invalid user credential")
  }

   const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)

  const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

const options={
  httpOnly:true,
  secure:true
}

return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  200,
  {
  user:loggedInUser,accessToken,refreshToken
  },
  "User Logged In Successfully"
)

 })

 const logoutUser=asyncHandler(async(req,res)=>{
  User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },
   {
    new:true
   }
  )

  const options={
  httpOnly:true,
  secure:true
}

return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User Logged Out"))
 })

const refreshAccessToken=asyncHandler(async (req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request and Refresh Token is required")
  }

  try{
  const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id)
if(!user){
  throw new ApiError(401,"Invalid refresh token")
}

if(incomingRefreshToken!==user?.refreshToken){
  throw new ApiError(401,"Refresh Token is expired or used")
}

const options={
  httpOnly:true,
  secure:true
}

const {accessToken,newrefreshToken}=await generateAccessTokenAndRefreshToken(user._id)


return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",newrefreshToken,options)
.json(
  new ApiResponse(200,{accessToken,newrefreshToken},"Access Token Refreshed Successfully")
)
}catch(error){
  throw new ApiError(401,error?.message || "Invalid Refresh Token")
}
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}