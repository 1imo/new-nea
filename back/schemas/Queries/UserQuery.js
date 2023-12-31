const users = require("../../USER_DATA.json")
const sensitive = require("../../SENSITIVE_USER_DATA.json")
const graphql = require("graphql")
const { GraphQLObjectType, GraphQLSchema, GraphQLInt, GraphQLString, GraphQLList } = require("graphql")
const { graphqlHTTP } = require("express-graphql")
const UserType = require("../TypeDefs/UserType")
const PostType = require("../TypeDefs/PostType")
const AuthorType = require("../TypeDefs/AuthorType")
const { take, skip } = require('@prisma/client');
const ProfileType = require("../TypeDefs/ProfileType")
const PendingType = require("../TypeDefs/PendingType")
const ChatroomType = require("../TypeDefs/ChatroomType")


const UserQuery = {
        navInfo: {
            type: UserType,
            args: { id: { type: GraphQLString}},
            async resolve(parent, args, { prisma }) {
                console.log(args)

                const user = await prisma.user.findFirst({
                    where: {
                        id: args.id
                    },
                    select: {
                        name: true,
                        username: true
                    }
                })

                console.log(user, "USER")
                

                return user
            }
        },
        getPublicInfo: {
            type: ProfileType,
            args: { username: { type: GraphQLString }},
            async resolve(parent, args, { prisma }) {

                const { id, name, username,
                    friends, friendshipsReceived,
                    followers, following } = await prisma.user.findFirst({
                    where: {
                        username: args.username
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        friends: true,
                        friendshipsReceived: true,
                        followers: true,
                        following: true
                    }
                })

                return {
                    name,
                    username,
                    friendCount: friends.length + friendshipsReceived.length,
                    followerCount: followers.length,
                    followingCount: following.length
                }
            }
        },
        getAllPosts: {
            type: new GraphQLList(PostType),
            args: { username: { type: GraphQLString }}, 
            async resolve(parent, args, { prisma }) {
                // const user = users.find(user => user.username === args.username ? user : null)

                console.log("hit", args)

                const user = await prisma.user.findFirst({
                    where: {
                        username: args.username
                    },
                    select: {
                        posts: {
                            select: {
                              content: true,
                              id: true,
                              user: {
                                select: {
                                  username: true,
                                  name: true
                                }
                              }
                            }
                        }
                    }
                   
                })
                
                return user.posts
            }
        },
        getUserSearchResults: {
            type: new GraphQLList(UserType),
            args: { username: { type: GraphQLString }, type: { type: GraphQLString }},
            async resolve(parent, args, { prisma }) {
                
            
                const names = await prisma.user.findMany({
                    where: {
                        OR: [{ username: { contains: args.username } },
                             { name: { contains: args.username } }]
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                })

                
               
    

                
                return names
            }
        },
        getChatroomData: {
            type: ChatroomType,
            args: { id: { type: GraphQLString }, secretkey: { type: GraphQLString}, chatId: { type: GraphQLString }},
            async resolve(parent, args, { prisma }) {

                console.log("CHATROOM")

                const exists = await prisma.userData.count({
                    where: { 
                        AND: [
                            {id: args.id},
                            {secretkey: args.secretkey}
                        ]
                    }
                })

                // model User {
                //     id                  String         @unique @default(uuid())
                //     username            String         @unique
                //     name                String
                //     userData            UserData?
                //     posts               Post[]
                //     viewedPosts         ViewedPost[]
                //     likedPosts          LikedPost[]
                //     friends             Friendship[]   @relation("User_One")
                //     friendshipsReceived Friendship[]   @relation("User_Two")
                //     following           Follow[]       @relation("Following")
                //     followers           Follow[]       @relation("Follower")
                //     chatroomUsers       ChatroomUser[]
                //     avgRatio            Float          @default(0.0)
                //     multiplier          Float          @default(1.0)
                //     socket              String?
                //     Message             Message[]
                //     lastUpdated         DateTime       @default(now()) @updatedAt
                  
                //     @@index([username])
                //   }
                  
                  
                //   model Follow {
                //     id          String  @id @default(uuid())
                //     follower    User    @relation("Following", fields: [followerId], references: [id])
                //     followerId  String
                //     following   User    @relation("Follower", fields: [followingId], references: [id])
                //     followingId String
                //     denial      Boolean @default(false)
                  
                //     @@unique([followerId, followingId])
                //   }
                  
                  
                //   model Message {
                //     id         String    @id @default(uuid())
                //     content    String
                //     sender     User      @relation(fields: [senderId], references: [id])
                //     senderId   String
                //     date       DateTime  @default(now())
                //     read       Boolean   @default(false)
                //     chatroom   Chatroom? @relation("Chatroom_Messages", fields: [chatroomId], references: [id])
                //     chatroomId String?
                //   }
                  
                //   model Chatroom {
                //     id            String         @id
                //     date          DateTime       @default(now())
                //     chatroomUsers ChatroomUser[]
                //     messages      Message[]      @relation("Chatroom_Messages")
                //   }
                  
                //   model ChatroomUser {
                //     chatroom   Chatroom @relation(fields: [chatroomId], references: [id])
                //     chatroomId String
                //     user       User     @relation(fields: [userId], references: [id])
                //     userId     String
                  
                //     @@id([chatroomId, userId])
                //   }


                let chatroom = {}
            
                if (exists) {
                    chatroom = await prisma.chatroom.findFirst({
                        where: {
                            id: args.chatId
                        },
                        select: {
                            id: true,
                            messages: {
                                select: {
                                    id: true,
                                    content: true,
                                    sender: {
                                        select: {
                                            id: true
                                        }
                                    },
                                    read: true
                                }
                            },
                            chatroomUsers: {
                                select: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            username: true
                                        }
                                    }
                                }
                            }
                        }
                    })

                    console.log(chatroom.chatroomUsers)

                    chatroom = {
                        id: chatroom.id,
                        messages: chatroom.messages,
                        chatters: chatroom.chatroomUsers.map(us => us.user)
                    }

                }

                return chatroom
            }
        },
        getPending: {
            type: new GraphQLList(PendingType),
            args: { id: { type: GraphQLString }, secretkey: { type: GraphQLString } },
            async resolve(parent, args, { prisma }) {

                const exists = await prisma.userData.count({
                    where: { 
                        AND: [
                            {id: args.id},
                            {secretkey: args.secretkey}
                        ]
                    }
                })

                

                
            
                if (exists) {

                    console.log("HITT")
       
                  const follows = await prisma.follow.findMany({
                    where: { 
                        AND: [ { followingId: args.id } ,
                             { denial: false } ]
                        },
                    select: {
                        id: true,
                        follower: {
                            select: {
                                id: true,
                                name: true,
                                username: true
                            }
                        }
                    }
                  })

                //   console.log(follows, "fff")
                
                  

                  return follows.map(data => {
                    return {
                        pendingId: data.id,
                        ...data.follower
                    }
                  })
                }


            }
        },
        getFeed: {
            type: new GraphQLList(PostType),
            args: { id: { type: GraphQLString }, secretkey: { type: GraphQLString }, type: { type: GraphQLString } },
            async resolve(parent, args, { prisma }) {
                console.log("FEED")
                console.log(args, "ARGS")

                const exists = await prisma.userData.count({
                    where: { 
                        AND: [
                            {id: args.id},
                            {secretkey: args.secretkey}
                        ]
                    }
                })

                if(!exists) {
                    return
                }

                // model User {
                //     id                  String         @unique @default(uuid())
                //     username            String         @unique
                //     name                String
                //     userData            UserData?
                //     posts               Post[]
                //     viewedPosts         ViewedPost[]
                //     likedPosts          LikedPost[]
                //     friends             Friendship[]   @relation("User_One")
                //     friendshipsReceived Friendship[]   @relation("User_Two")
                //     following           Follow[]       @relation("Following")
                //     followers           Follow[]       @relation("Follower")
                //     chatroomUsers       ChatroomUser[]
                //     avgRatio            Float          @default(0.0)
                //     multiplier          Float          @default(1.0)
                //     socket              String?
                //     Message             Message[]
                //     lastUpdated         DateTime       @default(now()) @updatedAt
                  
                //     @@index([username])
                //   }
                  
                //   model Friendship {
                //     id        String @id @default(uuid())
                //     userOne   User   @relation("User_One", fields: [userOneId], references: [id])
                //     userOneId String
                //     userTwo   User   @relation("User_Two", fields: [userTwoId], references: [id])
                //     userTwoId String
                  
                //     @@unique([userOneId, userTwoId])
                //   }
                  
                //   model Follow {
                //     id          String  @id @default(uuid())
                //     follower    User    @relation("Following", fields: [followerId], references: [id])
                //     followerId  String
                //     following   User    @relation("Follower", fields: [followingId], references: [id])
                //     followingId String
                //     denial      Boolean @default(false)
                  
                //     @@unique([followerId, followingId])
                //   }

                // model Post {
                //     id         Int          @id @default(autoincrement())
                //     content    String
                //     user       User         @relation(fields: [userId], references: [id])
                //     userId     String
                //     date       DateTime     @default(now())
                //     likedBy    LikedPost[]
                //     viewedBy   ViewedPost[]
                //     avgRatio   Float        @default(0.0)
                //     multiplier Float        @default(1.0) // Ensure decimal point
                //   }

                const posts = await prisma.user.findFirst({
                    where: {
                        id: args.id
                    },
                    select: {
                        following: {
                            select: {
                                following: {
                                    select: {
                                        posts: {
                                            select: {
                                                user: {
                                                    select: {
                                                        name: true,
                                                        id: true,
                                                        username: true
                                                    }
                                                },
                                                content: true,
                                                id: true,
                                                avgRatio: true,
                                                multiplier: true,
                                                date: true
                                            },
                                        }
                                    }
                                },
                            }
                        },
                        friends: {
                            select: {
                                userTwo: {
                                    select: {
                                        posts: {
                                            select: {
                                                user: {
                                                    select: {
                                                        name: true,
                                                        id: true,
                                                        username: true
                                                    }
                                                },
                                                content: true,
                                                id: true,
                                                avgRatio: true,
                                                multiplier: true,
                                                date: true
                                            },
                                        }
                                    }
                                }
                            }
                        },
                        friendshipsReceived: {
                            select: {
                                userOne: {
                                    select: {
                                        posts: {
                                            select: {
                                                user: {
                                                    select: {
                                                        name: true,
                                                        id: true,
                                                        username: true
                                                    }
                                                },
                                                content: true,
                                                id: true,
                                                avgRatio: true,
                                                multiplier: true,
                                                date: true
                                            },
                                        }
                                    }
                                }
                            }
                        }
                    }
                })

                // id: { type: GraphQLInt},
                // content: { type: GraphQLString },
                // user: { type: AuthorType },
                // date: { type: GraphQLString},
                // views: { type: new GraphQLList(AuthorType) },
                // likes: { type: new GraphQLList(AuthorType) },
                // avgRatio: { type: graphql.GraphQLFloat},
                // multiplier: { type: graphql.GraphQLFloat},

                // console.log("POSTS", posts.following[0].following.posts)
                // console.log("POSTSFRIENDS", posts.friends)
                // console.log("POSTSFRIENDS", posts.friendshipsReceived[0].userOne.posts)

                
                
                let followingPosts = []
                let friendsPosts = []


                if(args.type != "Friends") {
                    for(let i = 0; i < posts.following.length; i++) {
                        for(let x = 0; x < posts.following[i]?.following?.posts.length; x++) {
                            followingPosts.unshift(posts.following[i]?.following?.posts[x])
                        }
                    }
                }
                

                if(args.type != "Following") {
                    for(let i = 0; i < posts.friends.length; i++) {
                        for(let x = 0; x < posts.friends[i]?.userTwo?.posts.length; x++) {
                            friendsPosts.unshift(posts.friends[i]?.userTwo?.posts[x])
                        }
                    }
    
                    for(let i = 0; i < posts.friendshipsReceived.length; i++) {
                        for(let x = 0; x < posts.friendshipsReceived[i]?.userOne?.posts.length; x++) {
                            friendsPosts.unshift(posts.friendshipsReceived[i]?.userOne?.posts[x])
                        }
                    }
                }



                
                
                
                
                if(args.type == "Friends") {
                    return friendsPosts
                }

                if(args.type == "Following") {
                    return followingPosts
                }
                
                

                
                
                
                let followingAvgRatio = 0
                let friendsAvgRatio = 0

                if(followingPosts) {
                    for(let i = 0; i < followingPosts.length; i++) {
 
                        followingAvgRatio+=followingPosts[i].avgRatio
                        
                    }
                }

                if(friendsPosts) {
                    for(let i = 0; i < friendsPosts.length; i++) {
                        
                        friendsAvgRatio+=friendsPosts[i].avgRatio
                        
                    }
                }


                const multiplier = followingAvgRatio / friendsAvgRatio ? followingAvgRatio / friendsAvgRatio : 1

                console.log("RATIOS", followingAvgRatio, friendsAvgRatio, multiplier)


                function mergeSort(arr) {
                    if (arr.length <= 1) {
                      return arr
                    }
                  
                    const mid = Math.floor(arr.length / 2)
                    const left = arr.slice(0, mid)
                    const right = arr.slice(mid)
                  
                    return merge(mergeSort(left), mergeSort(right))
                }
                  
                function merge(left, right) {
                  const result = []
                  let leftIndex = 0
                  let rightIndex = 0
                
                  while (leftIndex < left.length && rightIndex < right.length) {
                    if (left[leftIndex].date >= right[rightIndex].date) {
                      result.push(left[leftIndex])
                      leftIndex++
                    } else {
                      result.push(right[rightIndex])
                      rightIndex++
                    }
                  }
                
                  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex))
                }


                followingPosts = mergeSort(followingPosts)
                friendsPosts = mergeSort(friendsPosts)

                if(args.type == "Date") {
                    console.log("DATE")
                    let posts = [].concat(followingPosts).concat(friendsPosts)
                    posts = mergeSort(posts)
                    return posts
                }


                const raw = []

                if(multiplier > 1) {
                    for(let i = 0; i < friendsPosts.length; i++) {
                        const copy = { ...friendsPosts[i] }
                        copy.avgRatio = copy.avgRatio * multiplier / (i + 1) * copy.multiplier
                        raw.push(copy)
                    }

                    for(let i = 0; i < followingPosts.length; i++) {
                        const copy = { ...followingPosts[i] }
                        copy.avgRatio = copy.avgRatio / (i + 1) * copy.multiplier
                        raw.push(copy)
                    }
                } else {
                    for(let i = 0; i < friendsPosts.length; i++) {
                        const copy = { ...friendsPosts[i] }
                        copy.avgRatio = copy.avgRatio / (i + 1) * copy.multiplier
                        raw.push(copy)
                    }

                    for(let i = 0; i < followingPosts.length; i++) {
                        const copy = { ...followingPosts[i] }
                        copy.avgRatio = copy.avgRatio / (i + 1) * copy.multiplier
                        raw.push(copy)
                    }
                }

                // console.log(raw)

                let swaps = 0

                function swapRatio(arr) {
                    for(let i = 0; i < arr.length; i++) {
                        if(i + 1 != arr.length) {
                            if(arr[i].avgRatio < arr[i+1].avgRatio) {
                                const temp = arr[i]
                                arr[i] = arr[i+1]
                                arr[i+1] = temp
                                swaps+=1
                            }
                        }
                    }

                    if(swaps != 0) {
                        swaps = 0
                        swapRatio(arr)
                    }
                }

                swapRatio(raw)


                return raw


            }
        },
        recommendedUsers: {
            type: new GraphQLList(AuthorType),
            args: { id: { type: GraphQLInt }},
            resolve(parent, args) {
                console.log(args, "DISCOVERTHISQUERY")
                const user = users.find(user => user.id === args.id ? user : null)

                const obj = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username
                }


                return [ obj, obj ]

                // const friends = []
                // const following = []

                // const friendsOfFriends = [[], []]
                // const followingOfFriends = [[], []]


                // for(let i = 0; i < user.friends.length; i++) {
                //     const specified = users.find(us => us.id === user.friends[i].id)
                //     friends.push(specified)
                // }

                // for(let i = 0; i < user.following.length; i++) {
                //     const specified = users.find(us => us.id === user.following[i].id)
                //     following.push(specified)
                // }

                // console.log([ ...friends, ...following ])

                // return [ ...friends, ...following ]


                // for(let i = 0; i < friends.length; i++) {

                //     for(let x = 0; x < friends[i].friends.length; x++) {
                //         const specified = users.find(us => us.id === friends[i].friends[x].id)
                //         const copy = { ...specified }
                //         copy.avgRatio = copy.avgRatio * ( x + 1 )
                //         friendsOfFriends[0].push(copy)
                //     }

                //     for(let x = 0; x < friends[i].following.length; x++) {
                //         const specified = users.find(us => us.id === friends[i].following[x].id)
                //         const copy = { ...specified }
                //         copy.avgRatio = copy.avgRatio * ( x + 1 )
                //         friendsOfFriends[1].push(copy)
                //     }
                // }

                // for(let i = 0; i < following.length; i++) {

                //     for(let x = 0; x < following[i].friends.length; x++) {
                //         const specified = users.find(us => us.id === following[i].friends[x].id)
                //         const copy = { ...specified }
                //         copy.avgRatio = copy.avgRatio * ( x + 1 )
                //         followingOfFriends[0].push(copy)
                //     }

                //     for(let x = 0; x < following[i].following.length; x++) {
                //         const specified = users.find(us => us.id === following[i].following[x].id)
                //         const copy = { ...specified }
                //         copy.avgRatio = copy.avgRatio * ( x + 1 )
                //         followingOfFriends[1].push(copy)
                //     }
                // }

                // console.log([ ...friendsOfFriends[0], ...friendsOfFriends[1], ...followingOfFriends[0], ...followingOfFriends[1] ])

                // return [ ...friendsOfFriends[0], ...friendsOfFriends[1], ...followingOfFriends[0], ...followingOfFriends[1] ]


                // function mergeSort(arr) {
                //     if (arr.length <= 1) {
                //       return arr
                //     }
                  
                //     const mid = Math.floor(arr.length / 2)
                //     const left = arr.slice(0, mid)
                //     const right = arr.slice(mid)
                  
                //     return merge(mergeSort(left), mergeSort(right))
                // }
                  
                // function merge(left, right) {
                //   const result = []
                //   let leftIndex = 0
                //   let rightIndex = 0
                
                //   while (leftIndex < left.length && rightIndex < right.length) {
                //     if (left[leftIndex].avgRatio >= right[rightIndex].avgRatio) {
                //       result.push(left[leftIndex])
                //       leftIndex++
                //     } else {
                //       result.push(right[rightIndex])
                //       rightIndex++
                //     }
                //   }
                
                //   return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex))
                // }

                // const friendsFriendsSorted = mergeSort(friendsOfFriends[0])
                // const followingFriendsSorted = mergeSort(friendsOfFriends[1])
                // const friendsFollowingSorted = mergeSort(followingOfFriends[0])
                // const followingFollowingSorted = mergeSort(followingOfFriends[1])
                

                // const formatted = [ ...friendsFriendsSorted, ...followingFollowingSorted, ...followingFriendsSorted, ...friendsFollowingSorted ]

                // console.log(formatted)

               

                // return formatted
                


            }
        }
    }


module.exports = UserQuery