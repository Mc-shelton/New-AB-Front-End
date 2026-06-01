import { useLocation } from "react-router-dom"

const useQuery = ()=>{
    const params =  new URLSearchParams(useLocation().search)
    let p:any={}
    params.forEach((l,x)=>{
        p[x]=l
    })
    return p    
}

export default useQuery