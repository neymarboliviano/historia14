const { db } = require("./database");
const Challenge = require("./Challenge");
function listEras(){return db.prepare("SELECT * FROM eras ORDER BY sort_order").all();}
function listChallenges(){return db.prepare("SELECT c.*,e.title era_title FROM challenges c JOIN eras e ON e.id=c.era_id ORDER BY e.sort_order,c.sort_order").all();}
function getChallenge(id){
 const row=db.prepare("SELECT * FROM challenges WHERE id=?").get(id); if(!row)return null;
 return new Challenge(row,db.prepare("SELECT * FROM questions WHERE challenge_id=? ORDER BY sort_order").all(id));
}
function getResults(userId){return db.prepare("SELECT challenge_id,score,total,xp_earned,completed_at FROM challenge_results WHERE user_id=?").all(userId);}
function getAttempts(userId){return db.prepare("SELECT COUNT(*) total,COALESCE(SUM(is_correct),0) correct FROM answer_attempts WHERE user_id=?").get(userId);}
function saveAttempt(userId,questionId,selectedIndex,isCorrect){db.prepare("INSERT INTO answer_attempts(user_id,question_id,selected_index,is_correct) VALUES(?,?,?,?)").run(userId,questionId,selectedIndex,isCorrect?1:0);}
function getQuestion(id){return db.prepare("SELECT * FROM questions WHERE id=?").get(id)||null;}
function saveResult(userId,challengeId,score,total,xp){return db.prepare("INSERT OR IGNORE INTO challenge_results(user_id,challenge_id,score,total,xp_earned) VALUES(?,?,?,?,?)").run(userId,challengeId,score,total,xp);}
function getHistory(userId){return db.prepare("SELECT r.*,c.title challenge_title FROM challenge_results r JOIN challenges c ON c.id=r.challenge_id WHERE user_id=? ORDER BY completed_at DESC LIMIT 20").all(userId);}
function getDashboard(userId){
 const results=getResults(userId), attempts=getAttempts(userId), eras=listEras(), challenges=listChallenges();
 const completed=new Set(results.map(r=>r.challenge_id)), xp=results.reduce((s,r)=>s+r.xp_earned,0);
 const unlocked=new Set(eras.length?[eras[0].id]:[]);
 eras.forEach((era,i)=>{if(i>0){const previous=eras[i-1];if(challenges.some(c=>c.era_id===previous.id&&completed.has(c.id)))unlocked.add(era.id);}});
 return {xp,level:Math.floor(xp/100)+1,xpToNext:100-(xp%100),completedCount:completed.size,totalChallenges:challenges.length,
  progress:Math.round(completed.size/Math.max(challenges.length,1)*100),answered:attempts.total,correct:attempts.correct,
  accuracy:attempts.total?Math.round(attempts.correct/attempts.total*100):0,
  eras:eras.map(e=>{const list=challenges.filter(c=>c.era_id===e.id),done=list.filter(c=>completed.has(c.id)).length;return {...e,completed:done,total:list.length,progress:list.length?Math.round(done/list.length*100):0,unlocked:unlocked.has(e.id)};}),
  completedIds:[...completed]};
}
module.exports={listEras,listChallenges,getChallenge,getResults,getAttempts,saveAttempt,getQuestion,saveResult,getHistory,getDashboard};
