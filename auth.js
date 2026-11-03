const bcrypt=require("bcryptjs");
const users=require("./users");
const User=require("./User");
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
async function register({name,email,password,className=""}){
 name=String(name||"").trim();email=String(email||"").trim().toLowerCase();password=String(password||"");
 if(name.length<2||name.length>50)fail("O nome deve ter entre 2 e 50 caracteres.");
 if(!emailPattern.test(email)||email.length>120)fail("Informe um e-mail válido.");
 if(password.length<8)fail("A senha precisa ter pelo menos 8 caracteres.");
 if(users.findByEmail(email))fail("Este e-mail já está cadastrado.",409);
 return users.create({name,email,passwordHash:await bcrypt.hash(password,10),className:String(className||"").trim().slice(0,40)});
}
async function login({email,password}){
 const row=users.findByEmail(String(email||"").trim().toLowerCase());
 if(!row||!(await bcrypt.compare(String(password||""),row.password_hash)))fail("E-mail ou senha incorretos.",401);
 return new User({id:row.id,name:row.name,email:row.email,class_name:row.class_name});
}
function getCurrentUser(id){return users.findById(id);}
module.exports={register,login,getCurrentUser};
