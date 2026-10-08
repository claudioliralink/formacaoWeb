// Executado pela GitHub Action: escreve protegido/dia-N.chave para cada aula cuja data já chegou.
// O valor vem do segredo CHAVES_AULAS e está cifrado com o código da turma.
import fs from "node:fs";
import crypto from "node:crypto";
const aulas = JSON.parse(fs.readFileSync("protegido/datas.json", "utf8"));
let verif = {};
try { verif = JSON.parse(fs.readFileSync("protegido/verificacao.json", "utf8")); } catch (e) {}
let chaves = {};
try { chaves = JSON.parse(process.env.CHAVES_AULAS || "{}"); } catch (e) { console.log("::error::Segredo CHAVES_AULAS inválido (não é JSON)."); }
const ok = {};
let erros = 0;
for (const a of aulas) {
  const k = chaves[a.dia];
  ok[a.dia] = !!(k && verif[a.dia] && crypto.createHash("sha256").update(k).digest("hex") === verif[a.dia]);
  if (ok[a.dia]) console.log("Verificação: chave do Dia " + a.dia + " correcta.");
  else { erros++; console.log("::error::Verificação: a chave do Dia " + a.dia + " no segredo CHAVES_AULAS está em falta ou errada."); }
}
if (!erros) console.log("Verificação: segredo CHAVES_AULAS correcto para os " + aulas.length + " dias.");
const agora = Date.now();
for (const a of aulas) {
  const destino = "protegido/dia-" + a.dia + ".chave";
  if (agora >= Date.parse(a.liberta) && ok[a.dia]) {
    fs.writeFileSync(destino, chaves[a.dia]);
    console.log("Dia " + a.dia + ": libertado.");
  } else {
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    console.log("Dia " + a.dia + ": " + (agora >= Date.parse(a.liberta) ? "data chegou, mas a chave do segredo não é válida." : "fechado até " + a.liberta + "."));
  }
}
