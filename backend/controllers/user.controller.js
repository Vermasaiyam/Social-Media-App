import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Empty fields!!!",
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "User already exists.",
                success: false,
            });
        };
        const hashedPassword = await bcrypt.hash(password, 7);
        await User.create({
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Empty fields!!!",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "User not exists.",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                success: false,
            });
        };

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // populate each post if in the posts array
        const populatedPosts = await Promise.all(
            user.posts.map(async (postId) => {
                const post = await Post.findById(postId);
                if (post.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        )

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts,
        }

        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const logout = async (req, res) => {
    try {
        // Clear the cookie
        res.cookie("token", "", {
            httpOnly: true,
            sameSite: 'Strict',
            expires: new Date(0)
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).populate({ path: 'posts', createdAt: -1 }).populate('bookmarks');
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender, username } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (username) user.username = username;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated successfully.',
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'No users.',
            })
        };
        return res.status(200).json({
            users: suggestedUsers,
            success: true,
        })
    } catch (error) {
        console.log(error);
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const userId = req.id;
        const targetUserId = req.params.id;
        if (userId === targetUserId) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself!!!',
                success: false,
            });
        }

        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found!!!',
                success: false,
            });
        }
        // check kro ki follow krna hai ya unfollow
        const isFollowing = user.following.includes(targetUserId);
        if (isFollowing) {
            // unfollow logic
            // jb ek sath do cheez handle krre h to Promise use krte h
            await Promise.all([
                User.updateOne({ _id: userId }, { $pull: { following: targetUserId } }),
                User.updateOne({ _id: targetUserId }, { $pull: { followers: userId } }),
            ])
            return res.status(200).json({ message: 'Unfollowed successfully', success: true });
        } else {
            // follow logic
            await Promise.all([
                User.updateOne({ _id: userId }, { $push: { following: targetUserId } }),
                User.updateOne({ _id: targetUserId }, { $push: { followers: userId } }),
            ])
            return res.status(200).json({ message: 'Followed successfully', success: true });
        }
    } catch (error) {
        console.log(error);
    }
}