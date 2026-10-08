// Executado pela GitHub Action: escreve protegido/dia-N.chave para cada aula cuja data já chegou.
import fs from "node:fs";
const aulas = JSON.parse(fs.readFileSync("protegido/datas.json", "utf8"));
let chaves = {};
try { chaves = JSON.parse(process.env.CHAVES_AULAS || "{}"); } catch (e) { console.error("Segredo CHAVES_AULAS inválido."); process.exit(1); }
import crypto from "node:crypto";
// Verifica se o segredo tem as chaves certas (compara resumos SHA-256; não revela as chaves)
let verif = {};
try { verif = JSON.parse(fs.readFileSync("protegido/verificacao.json", "utf8")); } catch (e) {}
let erros = 0;
for (const a of aulas) {
  const k = chaves[a.dia];
  const ok = k && verif[a.dia] && crypto.createHash("sha256").update(k).digest("hex") === verif[a.dia];
  if (ok) console.log("Verificação: chave do Dia " + a.dia + " correcta.");
  else { erros++; console.log("::error::Verificação: a chave do Dia " + a.dia + " no segredo CHAVES_AULAS está em falta ou errada."); }
}
if (!erros) console.log("Verificação: segredo CHAVES_AULAS correcto para os " + aulas.length + " dias.");
const agora = Date.now();
for (const a of aulas) {
  const destino = "protegido/dia-" + a.dia + ".chave";
  if (agora >= Date.parse(a.liberta)) {
    if (!chaves[a.dia]) { console.log("Dia " + a.dia + ": data chegou, mas falta a chave no segredo."); continue; }
    fs.writeFileSync(destino, chaves[a.dia]);
    console.log("Dia " + a.dia + ": libertado.");
  } else {
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    console.log("Dia " + a.dia + ": fechado até " + a.liberta + ".");
  }
}
