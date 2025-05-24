import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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
export {registerUser}