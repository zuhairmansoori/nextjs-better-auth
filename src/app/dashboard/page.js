import LogoutBtn from "@/components/logoutBtn/LogoutBtn";
import { auth } from "@/lib/auth";import { error } from "better-auth/api";
;
import { headers } from "next/headers";
import { User } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import React from 'react'

async function Page() {
//  throw new Error("Server crashed")

  await new Promise((resolve) =>
    setTimeout(resolve, 3000)    // for custom wait
  )
  const session = await auth.api.getSession({
    headers: await headers()
  })
  // console.log('this is dashboard', session);
  // console.log(session?.user.emailVerified);
// console.log('this is image',session.user.image);
console.log("SESSION =>", session)
console.log("EMAIL VERIFIED =>", session?.user?.emailVerified)

  if (!session) {
    redirect('/')
  }
  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }
  return (
    <div>
      <div className="w-full h-screen flex justify-center items-center bg-black">
        <div className="p-10 bg-white text-gray-800 rounded-2xl shadow-[0px_0px_13px_0px_#fafafa] ">
          <div>         
          <h1 className="text-3xl md:text-4xl text-center font-bold mb-5">
             Welcome To Dashboard</h1>
          <div className="flex flex-col md:flex-row tify-between items-center md:items-start md:gap-10">
            {session?.user?.image ?   <Image className="rounded-2xl" src={session?.user?.image} alt="user image" width={200} loading="eager" height={200}   unoptimized /> : <User className="w-50 h-50"/>}
        
          <div className="grid gap-7 mt-10">
            <h2 className="text-xl md:text-2xl">
               Name :<strong>
                       {session?.user?.name}  
                </strong>   
            </h2>
            <h3 className="text-[18px] md:text-xl">
               Email:
               <strong>{session?.user?.email}</strong>
              </h3>
          </div>
        </div>
        </div>
        <div className="text-center  mt-10"><LogoutBtn /></div>
        
      </div>
       </div>
    </div>
  )
}

export default Page
