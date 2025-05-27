import { Router } from "express"
import {logoutUser,loginUser,registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAcccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controllers.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import multer from "multer"
const router =Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUser)

router.route("/login").post(loginUser)
//secured Routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").post(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAcccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:userName").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)
export default router;