const graphql = require("graphql")
const { GraphQLObjectType, GraphQLSchema, GraphQLInt, GraphQLString, GraphQLList } = require("graphql")
const { graphqlHTTP } = require("express-graphql")
const postData = require("../../POST_DATA.json")
const PostType = require("./PostType")
const ChatroomType = require("./ChatroomType")
const UserType = require("./UserType")
const ShortUserType = require("./ShortUserType")


const PublicUserType = new GraphQLObjectType({
    name: "PublicUser",
    fields: () => ({
        id: { type: GraphQLInt},
        username: { type: GraphQLString},
        firstName: { type: GraphQLString},
        lastName: { type: GraphQLString},
        posts: { type: new GraphQLList(PostType),
            resolve(parent, args) {
              // Retrieve the posts for the current user
              const posts = [];
              for (const post of postData) {
                if (post.author.id === parent.id) {
                  posts.push(post);
                }
              }
              return posts 
            }
        },
        friends: { type: new GraphQLList(ShortUserType) },
        followers: { type: new GraphQLList(ShortUserType) },
        following: { type: new GraphQLList(ShortUserType) },
        friendCount: { type: GraphQLInt },
        followerCount: { type: GraphQLInt },
        followingCount: { type: GraphQLInt }
    })
})

module.exports = PublicUserType