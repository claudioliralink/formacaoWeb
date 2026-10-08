// Executado pela GitHub Action: escreve protegido/dia-N.chave para cada aula cuja data já chegou.
import fs from "node:fs";
const aulas = JSON.parse(fs.readFileSync("protegido/datas.json", "utf8"));
let chaves = {};
try { chaves = JSON.parse(process.env.CHAVES_AULAS || "{}"); } catch (e) { console.error("Segredo CHAVES_AULAS inválido."); process.exit(1); }
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
