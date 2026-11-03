const learning=require("./learning-data");
const users=require("./users");
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function getDashboard(userId){return learning.getDashboard(userId);}
function getEras(userId){return learning.getDashboard(userId).eras;}
function getChallenges(userId){
 const dash=learning.getDashboard(userId), completed=new Set(dash.completedIds), unlocked=new Set(dash.eras.filter(e=>e.unlocked).map(e=>e.id));
 return learning.listChallenges().map(c=>({...c,completed:completed.has(c.id),unlocked:unlocked.has(c.era_id),questionCount:learning.getChallenge(c.id).questions.length}));
}
function getChallenge(userId,id){
 const challenge=learning.getChallenge(id);if(!challenge)fail("Desafio não encontrado.",404);
 const dash=learning.getDashboard(userId);
 if(!dash.eras.find(e=>e.id===challenge.era_id)?.unlocked)fail("Complete uma missão de uma era anterior para desbloquear este desafio.",403);
 const completed=learning.getResults(userId).some(r=>r.challenge_id===id);
 return {...challenge.toPublicJSON(),completed};
}
function submitAnswer(userId,challengeId,questionId,selectedIndex){
 const challenge=learning.getChallenge(challengeId);if(!challenge)fail("Desafio não encontrado.",404);
 const dash=learning.getDashboard(userId);if(!dash.eras.find(e=>e.id===challenge.era_id)?.unlocked)fail("Este período ainda está bloqueado.",403);
 const q=learning.getQuestion(Number(questionId));if(!q||q.challenge_id!==challengeId)fail("Pergunta inválida para este desafio.");
 const index=Number(selectedIndex);const options=JSON.parse(q.options_json);
 if(!Number.isInteger(index)||index<0||index>=options.length)fail("Alternativa inválida.");
 const correct=index===q.correct_index;learning.saveAttempt(userId,q.id,index,correct);
 return {questionId:q.id,correct,correctIndex:q.correct_index,explanation:q.explanation};
}
function finishChallenge(userId,challengeId,answers){
 const challenge=learning.getChallenge(challengeId);if(!challenge)fail("Desafio não encontrado.",404);
 const dash=learning.getDashboard(userId);if(!dash.eras.find(e=>e.id===challenge.era_id)?.unlocked)fail("Este período ainda está bloqueado.",403);
 const existing=learning.getResults(userId).find(r=>r.challenge_id===challengeId);
 if(existing)return {alreadyCompleted:true,xpEarned:0,score:existing.score,total:existing.total,totalXp:dash.xp};
 if(!Array.isArray(answers)||answers.length!==challenge.questions.length)fail("Responda todas as perguntas antes de finalizar.");
 const map=new Map(answers.map(a=>[Number(a.questionId),Number(a.selectedIndex)]));let score=0;
 for(const q of challenge.questions){const choice=map.get(q.id);if(!Number.isInteger(choice)||choice<0||choice>=JSON.parse(q.options_json).length)fail("Existem respostas inválidas ou faltando.");if(choice===q.correct_index)score++;}
 const xpEarned=score*10+(score===challenge.questions.length?10:0);
 learning.saveResult(userId,challengeId,score,challenge.questions.length,xpEarned);
 return {alreadyCompleted:false,score,total:challenge.questions.length,xpEarned,totalXp:learning.getDashboard(userId).xp};
}
function getProgress(userId){return {dashboard:learning.getDashboard(userId),history:learning.getHistory(userId),results:learning.getResults(userId)};}
function getRanking(userId){return users.getRanking(userId);}
function updateProfile(userId,{name,className}){name=String(name||"").trim();if(name.length<2||name.length>50)fail("O nome deve ter entre 2 e 50 caracteres.");return users.updateProfile(userId,{name,className:String(className||"").trim().slice(0,40)});}
module.exports={getDashboard,getEras,getChallenges,getChallenge,submitAnswer,finishChallenge,getProgress,getRanking,updateProfile};
