import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export function procesarTexto(texto) {
  return tokenizer.tokenize(texto.toLowerCase()).map((t) => stemmer.stem(t));
}
