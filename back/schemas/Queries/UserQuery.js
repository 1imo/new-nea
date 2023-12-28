const users = require("../../USER_DATA.json")
const graphql = require("graphql")
const { GraphQLObjectType, GraphQLSchema, GraphQLInt, GraphQLString, GraphQLList } = require("graphql")
const { graphqlHTTP } = require("express-graphql")
const UserType = require("../TypeDefs/UserType")
const PostType = require("../TypeDefs/PostType")


const UserQuery = {
        navInfo: {
            type: UserType,
            args: { id: { type: GraphQLInt}, secretkey: { type: GraphQLString }},
            resolve(parent, args) {
                const user = users.find(user => user.id === args.id ? user : null)
                const secret = sensitive[user.id - 1]

                if(secret.id != user.id || secret.secretkey != user.secretkey) {
                    return
                }

                return user
            }
        },
        getPublicInfo: {
            type: UserType,
            args: { username: { type: GraphQLString }},
            resolve(parent, args) {
                const user = users.find(user => user.username === args.username ? user : null)

                return user
            }
        },
        getPosts: {
            type: new GraphQLList(PostType),
            args: { username: { type: GraphQLString }}, 
            resolve(parent, args) {
                const user = users.find(user => user.username === args.username ? user : null)
                
                return user.posts
            }
        },
        getUserSearchResults: {
            type: new GraphQLList(UserType),
            args: { username: { type: GraphQLString }, type: { type: GraphQLString }},
            resolve(parent, args) {
                const applicableUsernames = users.filter(user => user.username.includes(args.username));
                const applicableNames = users.filter(user => user.firstName.includes(args.username));
               
                const raw = [ ... applicableUsernames, ...applicableNames ]

                const res = raw.filter((val, index) => raw.indexOf(val) ===  index)
                
                return res
            }
        }
    }


module.exports = UserQuery