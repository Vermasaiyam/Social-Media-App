import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from './ui/button'
// import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FaRegThumbsUp, FaThumbsUp } from "react-icons/fa";
import axios from 'axios'
import { toast } from 'sonner'
import { Badge } from './ui/badge'
import CommentDialog from './CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Link } from 'react-router-dom'
import InitialsAvatar from 'react-initials-avatar';

const Post = ({ post }) => {
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);

    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
    const [postLike, setPostLike] = useState(post.likes.length);
    const [comment, setComment] = useState(post.comments);

    const dispatch = useDispatch();


    const [open1, setOpen1] = useState(false);

    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        if (inputText.trim()) {
            setText(inputText);
        } else {
            setText("");
        }
    }


    const deletePostHandler = async () => {
        try {
            const res = await axios.delete(`http://localhost:8000/api/post/delete/${post?._id}`, { withCredentials: true });
            // console.log(res);

            if (res.data.success) {
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            } else {
                throw new Error("Failed to delete the post");
            }
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.messsage);
        }
    }

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            const res = await axios.get(`http://localhost:8000/api/post/${post._id}/${action}`, { withCredentials: true });
            console.log(res.data);
            if (res.data.success) {
                const updatedLikes = liked ? postLike - 1 : postLike + 1;
                setPostLike(updatedLikes);
                setLiked(!liked);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? {
                        ...p,
                        likes: liked ? p.likes.filter(id => id !== user._id) : [...p.likes, user._id]
                    } : p
                );
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const commentHandler = async () => {
        try {
            const res = await axios.post(`http://localhost:8000/api/post/${post._id}/comment`, { text }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true,
            });
            console.log(res.data);
            if (res.data.success) {
                const updatedCommentData = [...comment, res.data.comment];
                setComment(updatedCommentData);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, comments: updatedCommentData } : p
                );

                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
                setText("");
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className='mt-8 w-full max-w-[26rem] mx-auto bg-white p-4 rounded-xl'>
            <div className='flex items-center justify-between'>
                <Link to={`/profile/${post.author?._id}`} className='flex items-center gap-2'>
                    <Avatar>
                        <AvatarImage src={post.author?.profilePicture} alt="post_image" />
                        <AvatarFallback><InitialsAvatar name={post.author?.username || "CN"} className="h-full w-full flex items-center justify-center bg-slate-200 p-2 rounded-full" /></AvatarFallback>
                    </Avatar>
                    <div className='flex items-center gap-3'>
                        <h1>{post.author?.username}</h1>
                        {user?._id === post.author._id && <Badge variant="secondary">Author</Badge>}
                    </div>
                </Link>
                <Dialog open={open1} onOpenChange={setOpen1}>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' onClick={() => setOpen1(true)} />
                    </DialogTrigger>

                    <DialogContent
                        className="flex flex-col items-center text-sm text-center"
                        onInteractOutside={() => setOpen1(false)} // Close dialog when clicking outside
                    >
                        {post?.author?._id !== user?._id && (
                            <Button variant='ghost' className="cursor-pointer w-fit text-[#ED4956] font-bold">
                                Unfollow
                            </Button>
                        )}

                        <Button variant='ghost' className="cursor-pointer w-fit">
                            Add to favorites
                        </Button>

                        {user && user?._id === post?.author._id && (
                            <Button
                                onClick={deletePostHandler} // Close dialog after deleting post
                                variant='ghost' className="cursor-pointer w-fit"
                            >
                                Delete
                            </Button>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            <img
                className='rounded-sm my-2 w-full aspect-square object-cover'
                src={post.image}
                alt="Post"
            />

            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3'>
                    {
                        liked ?
                            <FaThumbsUp onClick={likeOrDislikeHandler} size={'24'} className='cursor-pointer text-[#042035]' /> :
                            <FaRegThumbsUp onClick={likeOrDislikeHandler} size={'22px'} className='cursor-pointer hover:text-gray-600' />
                    }

                    <MessageCircle
                        onClick={() => {
                            dispatch(setSelectedPost(post));
                            setOpen(true);
                        }}
                        className='cursor-pointer hover:text-gray-600'
                    />
                    <Send className='cursor-pointer hover:text-gray-600' />
                </div>
                <Bookmark
                    // onClick={bookmarkHandler} 
                    className='cursor-pointer hover:text-gray-600' />
            </div>

            <span className='font-medium block mb-2'>{postLike} likes</span>
            <p>
                <span className='font-medium text-base'>
                    {post.author?.username}
                </span><br />

                <p className='text-sm'>{post.caption}</p>
            </p>
            {
                comment.length > 0 && (
                    <span onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }} className='cursor-pointer text-sm text-gray-400'>View all {comment.length} comments</span>
                )
            }
            <CommentDialog open={open} setOpen={setOpen} />
            <div className='flex items-center justify-between my-2'>
                <input
                    type="text"
                    placeholder='Add a comment...'
                    value={text}
                    onChange={changeEventHandler}
                    className='outline-none text-sm w-full'
                />
                {
                    text &&
                    <span onClick={commentHandler} className='text-[#042035] font-semibold cursor-pointer'>Post</span>
                }

            </div>
        </div>
    )
}

export default Post
