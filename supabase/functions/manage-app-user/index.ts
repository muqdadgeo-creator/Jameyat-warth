import { createClient } from "npm:@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H});
const N=(v)=>String(v??"").trim().toLowerCase().replace(/\s+/g,"");
const HEX=(v)=>Array.from(new TextEncoder().encode(String(v??""))).map(b=>b.toString(16).padStart(2,"0")).join("");
const E=(u)=>"u_"+HEX(N(u))+"@users.warith.local";
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 try{
  const auth=req.headers.get("Authorization"); if(!auth?.startsWith("Bearer "))return J({error:"غير مصرح"},401);
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SECRET_KEY")!;
  if(!url||!anon||!secret)throw new Error("إعدادات Supabase السرية غير مكتملة");
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:{user},error:ue}=await userClient.auth.getUser(); if(ue||!user)return J({error:"جلسة الدخول غير صالحة"},401);
  const b=await req.json().catch(()=>({})),a=String(b.action||"");
  if(a==="presence"){
   const now=new Date().toISOString(),patch:any={last_activity_at:now};
   if(b.visit===true)patch.last_visit_at=now;
   const {data:presenceRow,error:presenceError}=await admin.from("app_users").update(patch).eq("auth_user_id",user.id).eq("is_active",true).select("id").maybeSingle();
   if(presenceError)throw presenceError;
   if(!presenceRow)return J({ok:false,error:"حساب المستخدم غير مرتبط أو موقوف"},403);
   return J({ok:true});
  }
  const {data:owner,error:oe}=await admin.from("app_users").select("role,is_active").eq("auth_user_id",user.id).maybeSingle();
  if(oe)throw oe;
  if(!owner||owner.role!=="owner"||owner.is_active!==true)return J({error:"هذه العملية متاحة للمالك فقط"},403);
  if(a==="list"){
   const {data,error}=await admin.from("app_users").select("id,username,display_name,role,is_active,auth_user_id,auth_email,created_at,updated_at,last_visit_at,last_activity_at").order("created_at",{ascending:true});
   if(error)throw error; return J({ok:true,users:data||[]});
  }
  if(a==="create"){
   const display_name=String(b.display_name||"").trim(),username=N(b.username||display_name),password=String(b.password||""),role=String(b.role||"inspection");
   if(!display_name||!username||!password)return J({ok:false,error:"اسم المستخدم والرمز مطلوبان"});
   if(password.length<6)return J({ok:false,error:"الرمز يجب أن يكون 6 أحرف أو أرقام على الأقل"});
   if(role==="owner")return J({ok:false,error:"لا يمكن إنشاء مالك من هنا"});
   const {data:dup,error:de}=await admin.from("app_users").select("id").eq("username",username).maybeSingle();
   if(de)throw de; if(dup)return J({ok:false,error:"اسم المستخدم موجود مسبقاً"});
   const authEmail=E(username);
   const c=await admin.auth.admin.createUser({email:authEmail,password,email_confirm:true,user_metadata:{username,display_name}});
   if(c.error||!c.data.user)return J({ok:false,error:c.error?.message||"تعذر إنشاء حساب Supabase Auth"});
   const {data:row,error}=await admin.from("app_users").insert({username,display_name,role,is_active:true,auth_user_id:c.data.user.id,auth_email:authEmail}).select("id,username,display_name,role,is_active,auth_user_id,auth_email,created_at,updated_at,last_visit_at,last_activity_at").single();
   if(error){await admin.auth.admin.deleteUser(c.data.user.id);throw error}
   return J({ok:true,user:row});
  }
  if(a==="update"){
   const id=String(b.id||"").trim(),display_name=String(b.display_name||"").trim(),username=N(b.username||display_name),role=String(b.role||"inspection"),password=String(b.password||"");
   if(!id||!display_name||!username)return J({ok:false,error:"بيانات المستخدم غير مكتملة"});
   if(role==="owner")return J({ok:false,error:"لا يمكن تحويل موظف إلى مالك من هنا"});
   if(password&&password.length<6)return J({ok:false,error:"الرمز يجب أن يكون 6 أحرف أو أرقام على الأقل"});
   const {data:target,error:te}=await admin.from("app_users").select("id,username,role,is_active,auth_user_id,auth_email").eq("id",id).maybeSingle();
   if(te)throw te; if(!target)return J({ok:false,error:"المستخدم غير موجود"});
   if(target.role==="owner")return J({ok:false,error:"لا يمكن تعديل حساب المالك من هنا"});
   const {data:dup,error:de}=await admin.from("app_users").select("id").eq("username",username).neq("id",id).maybeSingle();
   if(de)throw de; if(dup)return J({ok:false,error:"اسم المستخدم موجود مسبقاً"});
   const authEmail=E(username);
   if(target.auth_user_id){
    const authPatch:any={user_metadata:{username,display_name}};
    if(password)authPatch.password=password;
    if(authEmail!==target.auth_email)authPatch.email=authEmail;
    const au=await admin.auth.admin.updateUserById(target.auth_user_id,authPatch);
    if(au.error)return J({ok:false,error:au.error.message});
   }
   const {data:row,error}=await admin.from("app_users").update({username,display_name,role,auth_email:authEmail,updated_at:new Date().toISOString()}).eq("id",id).select("id,username,display_name,role,is_active,auth_user_id,auth_email,created_at,updated_at,last_visit_at,last_activity_at").single();
   if(error)throw error;
   return J({ok:true,user:row});
  }
  return J({ok:false,error:"عملية غير معروفة"});
 }catch(e){return J({ok:false,error:e instanceof Error?e.message:"خطأ غير متوقع"})}
});