const { db } = require("./database");
const User = require("./User");
function findByEmail(email) { return db.prepare("SELECT * FROM users WHERE lower(email)=lower(?)").get(email) || null; }
function findById(id) {
  const row=db.prepare("SELECT id,name,email,class_name FROM users WHERE id=?").get(id);
  return row ? new User(row) : null;
}
function create({name,email,passwordHash,className=""}) {
  const info=db.prepare("INSERT INTO users(name,email,password_hash,class_name) VALUES(?,?,?,?)").run(name,email,passwordHash,className);
  return findById(info.lastInsertRowid);
}
function updateProfile(id,{name,className}) {
  db.prepare("UPDATE users SET name=?,class_name=? WHERE id=?").run(name,className,id);
  return findById(id);
}
function getRanking(userId) {
  return db.prepare(`SELECT u.id,u.name,u.class_name,COALESCE(SUM(r.xp_earned),0) xp,COUNT(r.id) missions
    FROM users u LEFT JOIN challenge_results r ON r.user_id=u.id
    GROUP BY u.id ORDER BY xp DESC,u.name ASC LIMIT 20`).all().map((u,i)=>({...u,position:i+1,isCurrentUser:u.id===userId}));
}
module.exports={findByEmail,findById,create,updateProfile,getRanking};
