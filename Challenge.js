class Challenge {
  constructor(row, questions = []) { Object.assign(this,row); this.questions=questions; }
  toPublicJSON() {
    return {
      id:this.id, eraId:this.era_id, title:this.title, description:this.description,
      difficulty:this.difficulty, xpReward:this.xp_reward, icon:this.icon,
      questions:this.questions.map(q => ({
        id:q.id, text:q.question_text, options:JSON.parse(q.options_json)
      }))
    };
  }
}
module.exports = Challenge;
