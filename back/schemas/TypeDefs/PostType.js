const graphql = require("graphql")
const { GraphQLObjectType, GraphQLSchema, GraphQLInt, GraphQLString, GraphQLList } = require("graphql")
const { graphqlHTTP } = require("express-graphql")

const AuthorType = require("./AuthorType")

const PostType = new GraphQLObjectType({
    name: "Post",
    fields: () => ({
        id: { type: GraphQLInt},
        content: { type: GraphQLString },
        author: { type: AuthorType },
        date: { type: GraphQLString},
        views: { type: new GraphQLList(GraphQLString) },
        likes: { type: new GraphQLList(GraphQLString) },
        avgRatio: { type: graphql.GraphQLFloat}
    })
})

module.exports = PostType