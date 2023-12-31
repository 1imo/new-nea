// Singular post page

import Nav from "../components/Nav"
import Post from "../components/Post"
import {
    useQuery,
    gql
} from "@apollo/client"
import { LOAD_POST } from "../GraphQL/Queries";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// function Home() {
    
    // useEffect(() => {
        //     // if(data)
        //     console.log(data)
        // }, [data])
        
function PostView() {
    const { id } = useParams()

    
    const [ vars, setVars ] = useState(parseInt(id))

    const { loading, error, data } = useQuery(LOAD_POST, {
        variables: {
            id: vars
        }
    })


    useEffect(() => {
        console.log(data)
    }, [data])

    useEffect(() => {
        setVars(parseInt(id))
        console.log(id)
    }, [id])

    
    
    
    return <>
        <Nav />
        {data?.getPost ? 
            <Post data={data?.getPost} />
            : null}
    </>
}
export default PostView