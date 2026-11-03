const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const { DEMO_USER } = require("./constants");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "historia-quest.db"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      class_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS eras (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL,
      period TEXT NOT NULL, icon TEXT NOT NULL, sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY, era_id TEXT NOT NULL REFERENCES eras(id),
      title TEXT NOT NULL, description TEXT NOT NULL, difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 30, icon TEXT NOT NULL, sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL, options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL, explanation TEXT NOT NULL, sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenge_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES challenges(id),
      score INTEGER NOT NULL, total INTEGER NOT NULL, xp_earned INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, challenge_id)
    );
    CREATE TABLE IF NOT EXISTS answer_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      selected_index INTEGER NOT NULL, is_correct INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  seedContent();
  seedDemoUser();
}

const seedEras = [
  ["antiguidade","Antiguidade","As primeiras grandes civilizações","c. 3500 a.C. – 476 d.C.","🏛️",1],
  ["medieval","Idade Média","Castelos, reinos e transformações","476 – 1453","🏰",2],
  ["moderna","Idade Moderna","Novas ideias e novos caminhos","1453 – 1789","🧭",3],
  ["brasil","História do Brasil","A formação de um país diverso","1500 – atualidade","🇧🇷",4],
  ["contemporaneo","Mundo Contemporâneo","O mundo em transformação","1789 – atualidade","🌎",5]
];

const seedChallenges = [
 {id:"egito",era:"antiguidade",title:"Os mistérios do Egito",description:"Faraós, pirâmides e o Rio Nilo.",difficulty:"facil",icon:"𓂀",questions:[
  ["Qual rio foi essencial para a agricultura do Egito Antigo?",["Rio Tigre","Rio Nilo","Rio Eufrates","Rio Jordão"],1,"As cheias do Nilo fertilizavam o solo e ajudavam a sustentar a agricultura egípcia."],
  ["Como era chamado o governante do Egito Antigo?",["Cônsul","Czar","Faraó","Senador"],2,"O faraó concentrava poder político e religioso na sociedade egípcia."],
  ["Qual era uma das principais funções das pirâmides?",["Servir como túmulos reais","Armazenar navios","Ser mercados públicos","Treinar soldados"],0,"As pirâmides mais conhecidas foram construídas como monumentos funerários para faraós."]
 ]},
 {id:"grecia",era:"antiguidade",title:"Herança da Grécia",description:"Filosofia, democracia e cidades-Estado.",difficulty:"facil",icon:"🏺",questions:[
  ["Em qual cidade-Estado surgiu uma forma antiga de democracia?",["Esparta","Atenas","Troia","Cartago"],1,"Atenas desenvolveu uma democracia direta, embora excluísse mulheres, escravizados e estrangeiros."],
  ["Quem eram Sócrates, Platão e Aristóteles?",["Imperadores romanos","Filósofos gregos","Generais persas","Poetas egípcios"],1,"Esses pensadores influenciaram profundamente a filosofia ocidental."],
  ["Qual era uma característica da organização política grega?",["Um único reino sempre unificado","Cidades-Estado independentes","Ausência de comércio","Governo mundial"],1,"A Grécia Antiga era formada por diversas pólis, cada uma com suas instituições."]
 ]},
 {id:"roma",era:"antiguidade",title:"Ascensão de Roma",description:"Da República ao Império Romano.",difficulty:"medio",icon:"🛡️",questions:[
  ["Qual mar conectava muitas regiões do Império Romano?",["Mar Báltico","Mar Mediterrâneo","Mar do Norte","Mar Cáspio"],1,"O Mediterrâneo era uma importante rota de comércio e circulação no mundo romano."],
  ["O que foi a República Romana?",["Um período sem leis","Uma forma de governo com instituições e magistrados","Uma colônia grega","Uma religião"],1,"Na República, o poder era distribuído entre instituições, embora houvesse fortes desigualdades sociais."],
  ["Em que ano tradicionalmente se situa a queda do Império Romano do Ocidente?",["476 d.C.","1492","1789","1914"],0,"O ano de 476 d.C. é usado convencionalmente como marco da queda do Império Romano do Ocidente."]
 ]},
 {id:"feudalismo",era:"medieval",title:"Segredos do feudalismo",description:"Sociedade, trabalho e poder na Idade Média.",difficulty:"medio",icon:"🏰",questions:[
  ["Qual atividade era a base da economia feudal europeia?",["Indústria automobilística","Agricultura","Extração de petróleo","Produção digital"],1,"A agricultura era central, e grande parte da população vivia no campo."],
  ["Como se chamavam as grandes propriedades rurais medievais?",["Feudos","Fábricas","Províncias modernas","Fóruns"],0,"Os feudos eram unidades de terra e poder, com relações sociais específicas."],
  ["A sociedade feudal era marcada principalmente por:",["Igualdade total","Hierarquias e obrigações sociais","Voto universal","Economia industrial"],1,"A sociedade era hierarquizada, com obrigações entre senhores e camponeses, entre outros grupos."]
 ]},
 {id:"cruzadas",era:"medieval",title:"Cruzadas e contatos",description:"Religião, poder e encontros culturais.",difficulty:"medio",icon:"⚜️",questions:[
  ["As Cruzadas medievais foram expedições ligadas principalmente a:",["Disputas religiosas e políticas","Exploração espacial","Revolução Industrial","Unificação italiana"],0,"As Cruzadas envolveram motivações religiosas, políticas e econômicas e tiveram consequências diversas."],
  ["Qual cidade era considerada sagrada por cristãos, muçulmanos e judeus?",["Jerusalém","Londres","Lisboa","Paris"],0,"Jerusalém tem grande importância religiosa para as três tradições."],
  ["Um efeito dos contatos medievais entre regiões foi:",["A circulação de produtos e conhecimentos","O fim imediato de todas as guerras","O desaparecimento do comércio","A criação das fábricas modernas"],0,"Os contatos contribuíram para circulação de mercadorias, conhecimentos e também conflitos."]
 ]},
 {id:"navegacoes",era:"moderna",title:"Grandes navegações",description:"Rotas marítimas e expansão europeia.",difficulty:"medio",icon:"⛵",questions:[
  ["Qual país europeu foi pioneiro em várias viagens atlânticas no século XV?",["Portugal","Suécia","Rússia","Suíça"],0,"Portugal foi pioneiro em várias viagens atlânticas e na exploração de rotas pela costa africana."],
  ["Uma motivação das navegações europeias era:",["Encontrar rotas comerciais para a Ásia","Acabar com todo o comércio","Evitar contato marítimo","Criar a internet"],0,"A busca por especiarias, metais e rotas comerciais esteve entre os fatores da expansão."],
  ["As navegações europeias contribuíram para:",["Isolar todos os continentes","Ampliar contatos, comércio e colonização","Eliminar conflitos","Encerrar a escravidão imediatamente"],1,"A expansão conectou regiões, mas também envolveu conquista, colonização e exploração."]
 ]},
 {id:"renascimento",era:"moderna",title:"Ideias do Renascimento",description:"Arte, ciência e humanismo.",difficulty:"facil",icon:"🎨",questions:[
  ["O Renascimento valorizou, entre outros aspectos:",["Humanismo e investigação da Antiguidade clássica","A proibição da arte","O fim do estudo científico","A rejeição de toda cultura antiga"],0,"O Renascimento valorizou o humanismo e retomou referências artísticas e intelectuais greco-romanas."],
  ["Leonardo da Vinci ficou conhecido por atuar como:",["Artista e inventor","Faraó","Imperador romano","Navegador viking"],0,"Leonardo da Vinci foi artista, estudioso e inventor do Renascimento."],
  ["Em qual região europeia o Renascimento começou a ganhar força?",["Península Itálica","Escandinávia","Sibéria","Ilhas do Pacífico"],0,"Cidades da Península Itálica, como Florença, foram centros importantes do Renascimento."]
 ]},
 {id:"brasil-colonia",era:"brasil",title:"Brasil colonial",description:"Colonização, economia e resistência.",difficulty:"facil",icon:"🌿",questions:[
  ["Em qual ano a chegada da frota de Pedro Álvares Cabral é tradicionalmente situada?",["1500","1530","1822","1889"],0,"A chegada portuguesa à costa do território que hoje é o Brasil é tradicionalmente datada de 1500."],
  ["Qual produto teve grande importância na economia colonial no Nordeste?",["Cana-de-açúcar","Automóveis","Silício","Petróleo refinado"],0,"A produção açucareira foi central na economia colonial, sustentada pela escravização."],
  ["Quilombos eram, entre outras coisas:",["Comunidades de resistência à escravidão","Tribunais portugueses","Portos ingleses","Escolas militares reais"],0,"Quilombos foram comunidades formadas principalmente por pessoas que resistiam à escravização."]
 ]},
 {id:"independencia",era:"brasil",title:"Independência do Brasil",description:"O processo político de 1822.",difficulty:"facil",icon:"📜",questions:[
  ["Em que ano ocorreu a Independência do Brasil?",["1808","1822","1888","1889"],1,"A Independência foi proclamada em 7 de setembro de 1822, em um processo político complexo."],
  ["Quem foi proclamado imperador após a Independência?",["Dom João VI","Dom Pedro I","Dom Pedro II","Deodoro da Fonseca"],1,"Dom Pedro I tornou-se o primeiro imperador do Brasil independente."],
  ["A Independência significou imediatamente o fim da escravidão?",["Sim, em 1822","Não, a escravidão continuou até 1888","Sim, em 1831","Não, mas terminou em 1823"],1,"A escravidão permaneceu legal no Brasil até a Lei Áurea, em 1888."]
 ]},
 {id:"revolucoes",era:"contemporaneo",title:"Era das revoluções",description:"Mudanças políticas e industriais.",difficulty:"medio",icon:"⚙️",questions:[
  ["Em que ano começou a Revolução Francesa?",["1492","1776","1789","1917"],2,"A Revolução Francesa começou em 1789 e questionou a monarquia absolutista e privilégios sociais."],
  ["A Revolução Industrial começou primeiro em:",["Inglaterra","Brasil","Egito","Japão"],0,"A industrialização começou na Inglaterra no século XVIII, transformando produção e trabalho."],
  ["Qual ideia esteve ligada à Revolução Francesa?",["Liberdade e igualdade jurídica","Restauração do feudalismo","Fim de toda participação política","Proibição de constituições"],0,"Liberdade, igualdade e soberania popular foram ideias importantes, ainda que aplicadas de forma limitada."]
 ]},
 {id:"guerras",era:"contemporaneo",title:"Século das guerras",description:"Guerras mundiais e suas consequências.",difficulty:"medio",icon:"🕊️",questions:[
  ["Em que período ocorreu a Segunda Guerra Mundial?",["1914–1918","1939–1945","1947–1991","1789–1799"],1,"A Segunda Guerra Mundial ocorreu de 1939 a 1945."],
  ["Qual organização internacional foi criada em 1945 para promover cooperação e paz?",["ONU","União Europeia","Liga Hanseática","Mercosul"],0,"A Organização das Nações Unidas foi fundada em 1945, após a Segunda Guerra Mundial."],
  ["A Guerra Fria foi marcada principalmente pela rivalidade entre:",["Roma e Cartago","Estados Unidos e União Soviética","Portugal e Espanha no século XV","Atenas e Esparta"],1,"A Guerra Fria foi uma disputa geopolítica, ideológica e militar entre os EUA e a URSS."]
 ]}
];

function seedContent() {
  const insertEra = db.prepare("INSERT OR IGNORE INTO eras(id,title,subtitle,period,icon,sort_order) VALUES(?,?,?,?,?,?)");
  const insertChallenge = db.prepare("INSERT OR IGNORE INTO challenges(id,era_id,title,description,difficulty,xp_reward,icon,sort_order) VALUES(?,?,?,?,?,?,?,?)");
  const insertQuestion = db.prepare("INSERT INTO questions(challenge_id,question_text,options_json,correct_index,explanation,sort_order) VALUES(?,?,?,?,?,?)");
  db.exec("BEGIN");
  try {
    seedEras.forEach(e => insertEra.run(...e));
    seedChallenges.forEach((c,i) => {
      insertChallenge.run(c.id,c.era,c.title,c.description,c.difficulty,30,c.icon,i+1);
      if (db.prepare("SELECT COUNT(*) count FROM questions WHERE challenge_id=?").get(c.id).count === 0) {
        c.questions.forEach((q,j) => insertQuestion.run(c.id,q[0],JSON.stringify(q[1]),q[2],q[3],j+1));
      }
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
function seedDemoUser() {
  // Garante que a conta de demonstração sempre tenha a senha documentada.
  // Isso também corrige bancos locais antigos que possam ter outra senha salva.
  const passwordHash = bcrypt.hashSync(DEMO_USER.password, 10);
  const existing = db.prepare("SELECT id FROM users WHERE lower(email)=lower(?)").get(DEMO_USER.email);
  if (existing) {
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(passwordHash, existing.id);
  } else {
    db.prepare("INSERT INTO users(name,email,password_hash,class_name) VALUES(?,?,?,?)")
      .run(DEMO_USER.name, DEMO_USER.email, passwordHash, "Turma demonstração");
  }
}
module.exports = { db, initializeDatabase };
