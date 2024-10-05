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
import { setPosts } from '@/redux/postSlice'

const Post = ({ post }) => {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);

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
                throw new Error("Failed to delete the post"); // Manually throw an error if `success` is not true
            }
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.messsage);
        }
    }

    return (
        <div className='my-16 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Avatar>
                        <AvatarImage src={post.author?.profilePicture} alt="post_image" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className='flex items-center gap-3'>
                        <h1>{post.author?.username}</h1>
                        {user?._id === post.author._id && <Badge variant="secondary">Author</Badge>}
                    </div>
                </div>
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
                    {/* {
                        liked ? 
                    <FaThumbsUp size={'24'} className='cursor-pointer text-[#042035]' /> :
                    } */}
                    <FaRegThumbsUp size={'22px'} className='cursor-pointer hover:text-gray-600' />

                    <MessageCircle
                        onClick={() => {
                            // dispatch(setSelectedPost(post));
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

            <span className='font-medium block mb-2'>{post?.likes.length} likes</span>
            <p>
                <span className='font-medium text-base'>
                    {post.author?.username}
                </span><br />

                <p className='text-sm'>{post.caption}</p>
            </p>
            <span onClick={() => setOpen(true)} className='cursor-pointer text-sm text-gray-500'>view all 10 comments</span>
            {/* {
                comment.length > 0 && (
                    <span onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }} className='cursor-pointer text-sm text-gray-400'>View all {comment.length} comments</span>
                )
            } */}
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
                    <span className='text-[#042035] font-semibold cursor-pointer'>Post</span>
                }

            </div>
        </div>
    )
}

export default Post
