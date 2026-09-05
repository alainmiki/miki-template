import express from 'express'
import miki, {__express,registerContextProcessor} from "miki-template"
import path from 'node:path';

const app =express()
const dir=path.join(process.cwd(),"dir")

  // app.engine('html', __express);
  // app.set('view engine', 'html');
  // app.set('views', dir);
  miki.setupExpress(app, { extension: 'html', views: dir });

  // registerContextProcessor((cx)=>({
  //   siteName:"code with miki",
  //   login:{'name':"miki", 'email':"miki@example.com"}
  // }))
  app.get("/",(req,res)=>{
    const users=[
      {'name':"miki", 'email':"miki@example.com"},
      {'name':"miki2", 'email':"miki2@example.com"},
      {'name':"miki3", 'email':"miki3@example.com"}
    ]
    let data=[
      {name:"miki", email:"jack@miki.com",address:"kumba"},
      {name:"luis",email:"luis@miki.com",address:"kumba"}
    ]
    res.render("index",{name:"miki-template context", users:users, data:data})
    // res.send(content)
  })

app.listen(3000, () => {
    console.log('Server is running on port 3000 click: http://localhost:3000')
}  )