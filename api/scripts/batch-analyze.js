// ============================================================
// BATCH ANALYSIS SCRIPT - PROPER IMPLEMENTATION
// ============================================================
// - Uses Guide v2.7 LITE from local file
// - Uses full prompt template (same as API)
// - Fetches lyrics via Genius
// - 10 songs/hour to avoid rate limits
// - Calls AI providers directly, saves to Supabase
//
// Usage: node scripts/batch-analyze.js [lang] [model] [startIndex]
// Example: node scripts/batch-analyze.js pt claude 0
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

  // AI API Keys
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROK_API_KEY: process.env.GROK_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,

  // Genius (for lyrics)
  GENIUS_ACCESS_TOKEN: process.env.GENIUS_ACCESS_TOKEN,

  // Spotify (for song identification)
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,

  // No delay - run as fast as possible
  DELAY_BETWEEN_SONGS: 0,
};

const missing = Object.entries(CONFIG)
  .filter(([k, v]) => k !== "DELAY_BETWEEN_SONGS" && !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  console.error(
    "Set them in your shell or use a .env loader before running this script.",
  );
  process.exit(1);
}

const MODELS = ["claude", "openai", "gemini", "grok", "deepseek"];

const LANG_NAMES = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  it: "Italian",
  fr: "French",
  de: "German",
};

// Philosophical weights (Guide v2.7)
const WEIGHTS = {
  ethics: 0.4,
  metaphysics: 0.2,
  epistemology: 0.2,
  politics: 0.1,
  aesthetics: 0.1,
};

// ============================================================
// SONGS DATABASE
// ============================================================

const SONGS = {
  en: [
    { title: "The Twist", artist: "Chubby Checker" },
    { title: "Smooth", artist: "Santana feat. Rob Thomas" },
    { title: "Mack the Knife", artist: "Bobby Darin" },
    { title: "Uptown Funk!", artist: "Mark Ronson feat. Bruno Mars" },
    { title: "How Do I Live", artist: "LeAnn Rimes" },
    {
      title: "Party Rock Anthem",
      artist: "LMFAO feat. Lauren Bennett & GoonRock",
    },
    { title: "I Gotta Feeling", artist: "The Black Eyed Peas" },
    { title: "Macarena (Bayside Boys Mix)", artist: "Los Del Rio" },
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Physical", artist: "Olivia Newton-John" },
    { title: "You Light Up My Life", artist: "Debby Boone" },
    { title: "Hey Jude", artist: "The Beatles" },
    { title: "Closer", artist: "The Chainsmokers feat. Halsey" },
    { title: "We Found Love", artist: "Rihanna feat. Calvin Harris" },
    { title: "Low", artist: "Flo Rida feat. T-Pain" },
    { title: "I'm a Believer", artist: "The Monkees" },
    { title: "Radioactive", artist: "Imagine Dragons" },
    { title: "Blinding Lights", artist: "The Weeknd" },
    {
      title: "Despacito (Remix)",
      artist: "Luis Fonsi & Daddy Yankee feat. Justin Bieber",
    },
    { title: "Old Town Road", artist: "Lil Nas X feat. Billy Ray Cyrus" },
    { title: "Circles", artist: "Post Malone" },
    { title: "Levitating", artist: "Dua Lipa" },
    { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
    { title: "Cruel Summer", artist: "Taylor Swift" },
    { title: "As It Was", artist: "Harry Styles" },
    { title: "Heat Waves", artist: "Glass Animals" },
    { title: "Save Your Tears", artist: "The Weeknd & Ariana Grande" },
    { title: "Bad Guy", artist: "Billie Eilish" },
    { title: "Sunflower", artist: "Post Malone & Swae Lee" },
    { title: "Perfect", artist: "Ed Sheeran" },
    { title: "Thinking Out Loud", artist: "Ed Sheeran" },
    { title: "Rolling in the Deep", artist: "Adele" },
    { title: "Someone Like You", artist: "Adele" },
    { title: "Hello", artist: "Adele" },
    { title: "Happy", artist: "Pharrell Williams" },
    { title: "All About That Bass", artist: "Meghan Trainor" },
    { title: "Shake It Off", artist: "Taylor Swift" },
    { title: "Blank Space", artist: "Taylor Swift" },
    { title: "Dark Horse", artist: "Katy Perry feat. Juicy J" },
    { title: "Roar", artist: "Katy Perry" },
    { title: "Firework", artist: "Katy Perry" },
    { title: "California Gurls", artist: "Katy Perry feat. Snoop Dogg" },
    { title: "Tik Tok", artist: "Kesha" },
    { title: "Just Dance", artist: "Lady Gaga feat. Colby O'Donis" },
    { title: "Poker Face", artist: "Lady Gaga" },
    { title: "Bad Romance", artist: "Lady Gaga" },
    { title: "Born This Way", artist: "Lady Gaga" },
    { title: "Single Ladies (Put a Ring on It)", artist: "Beyoncé" },
    { title: "Irreplaceable", artist: "Beyoncé" },
    { title: "Crazy in Love", artist: "Beyoncé feat. Jay-Z" },
    { title: "Umbrella", artist: "Rihanna feat. Jay-Z" },
    { title: "Diamonds", artist: "Rihanna" },
    { title: "Work", artist: "Rihanna feat. Drake" },
    { title: "God's Plan", artist: "Drake" },
    { title: "One Dance", artist: "Drake feat. Wizkid & Kyla" },
    { title: "Hotline Bling", artist: "Drake" },
    { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
    { title: "SexyBack", artist: "Justin Timberlake feat. Timbaland" },
    { title: "Mirrors", artist: "Justin Timberlake" },
    { title: "Yeah!", artist: "Usher feat. Lil Jon & Ludacris" },
    { title: "Burn", artist: "Usher" },
    { title: "U Got It Bad", artist: "Usher" },
    { title: "Hips Don't Lie", artist: "Shakira feat. Wyclef Jean" },
    { title: "Whenever, Wherever", artist: "Shakira" },
    { title: "Believe", artist: "Cher" },
    { title: "Baby One More Time", artist: "Britney Spears" },
    { title: "Oops!... I Did It Again", artist: "Britney Spears" },
    { title: "Toxic", artist: "Britney Spears" },
    { title: "Genie in a Bottle", artist: "Christina Aguilera" },
    { title: "Beautiful", artist: "Christina Aguilera" },
    { title: "Say My Name", artist: "Destiny's Child" },
    { title: "Independent Women Part I", artist: "Destiny's Child" },
    { title: "Survivor", artist: "Destiny's Child" },
    { title: "No Scrubs", artist: "TLC" },
    { title: "Waterfalls", artist: "TLC" },
    { title: "Creep", artist: "TLC" },
    { title: "End of the Road", artist: "Boyz II Men" },
    { title: "I'll Make Love to You", artist: "Boyz II Men" },
    { title: "One Sweet Day", artist: "Mariah Carey & Boyz II Men" },
    { title: "We Belong Together", artist: "Mariah Carey" },
    { title: "Fantasy", artist: "Mariah Carey" },
    { title: "Always Be My Baby", artist: "Mariah Carey" },
    { title: "Hero", artist: "Mariah Carey" },
    { title: "I Will Always Love You", artist: "Whitney Houston" },
    { title: "Greatest Love of All", artist: "Whitney Houston" },
    {
      title: "I Wanna Dance with Somebody (Who Loves Me)",
      artist: "Whitney Houston",
    },
    { title: "Like a Virgin", artist: "Madonna" },
    { title: "Vogue", artist: "Madonna" },
    { title: "Like a Prayer", artist: "Madonna" },
    { title: "Billie Jean", artist: "Michael Jackson" },
    { title: "Beat It", artist: "Michael Jackson" },
    { title: "Thriller", artist: "Michael Jackson" },
    { title: "Black or White", artist: "Michael Jackson" },
    { title: "Purple Rain", artist: "Prince" },
    { title: "When Doves Cry", artist: "Prince" },
    { title: "Kiss", artist: "Prince" },
    { title: "Superstition", artist: "Stevie Wonder" },
    { title: "Sir Duke", artist: "Stevie Wonder" },
    { title: "I Just Called to Say I Love You", artist: "Stevie Wonder" },
    { title: "Respect", artist: "Aretha Franklin" },
  ],
  pt: [
    { title: "Garota de Ipanema", artist: "Tom Jobim & Vinícius de Moraes" },
    { title: "Ai Se Eu Te Pego", artist: "Michel Teló" },
    { title: "Águas de Março", artist: "Elis Regina & Tom Jobim" },
    { title: "Evidências", artist: "Chitãozinho & Xororó" },
    { title: "Aquarela do Brasil", artist: "Gal Costa" },
    { title: "Mas Que Nada", artist: "Jorge Ben Jor" },
    { title: "Chega de Saudade", artist: "João Gilberto" },
    { title: "Oração", artist: "A Banda Mais Bonita da Cidade" },
    { title: "Show das Poderosas", artist: "Anitta" },
    { title: "Amor de Que", artist: "Pabllo Vittar" },
    { title: "Canção do Mar", artist: "Dulce Pontes" },
    { title: "Amar Pelos Dois", artist: "Salvador Sobral" },
    { title: "Velha Infância", artist: "Tribalistas" },
    { title: "Burguesinha", artist: "Seu Jorge" },
    { title: "País Tropical", artist: "Wilson Simonal" },
    { title: "Trem Das Onze", artist: "Adoniran Barbosa" },
    { title: "Anna Júlia", artist: "Los Hermanos" },
    { title: "Leva Tudo", artist: "Calema & Dilsinho" },
    { title: "Fio Maravilha", artist: "Jorge Ben Jor" },
    { title: "Metamorfose Ambulante", artist: "Raul Seixas" },
    { title: "Como Nossos Pais", artist: "Elis Regina" },
    { title: "O Bêbado e a Equilibrista", artist: "Elis Regina" },
    { title: "Construção", artist: "Chico Buarque" },
    { title: "A Banda", artist: "Chico Buarque" },
    { title: "Cálice", artist: "Chico Buarque & Milton Nascimento" },
    { title: "Maria Maria", artist: "Milton Nascimento" },
    { title: "Travessia", artist: "Milton Nascimento" },
    { title: "Oceano", artist: "Djavan" },
    { title: "Flor de Lis", artist: "Djavan" },
    { title: "Sina", artist: "Djavan" },
    { title: "Sozinho", artist: "Caetano Veloso" },
    { title: "Alegria, Alegria", artist: "Caetano Veloso" },
    { title: "Vou Festejar", artist: "Beth Carvalho" },
    { title: "Coisinha do Pai", artist: "Beth Carvalho" },
    { title: "Trem das Cores", artist: "Caetano Veloso" },
    { title: "O Leãozinho", artist: "Caetano Veloso" },
    { title: "Tropicália", artist: "Caetano Veloso" },
    { title: "Aquele Abraço", artist: "Gilberto Gil" },
    { title: "Expresso 2222", artist: "Gilberto Gil" },
    { title: "Andar com Fé", artist: "Gilberto Gil" },
    { title: "Refazenda", artist: "Gilberto Gil" },
    { title: "Sampa", artist: "Caetano Veloso" },
    { title: "Lanterna dos Afogados", artist: "Os Paralamas do Sucesso" },
    { title: "Alagados", artist: "Os Paralamas do Sucesso" },
    { title: "Meu Erro", artist: "Os Paralamas do Sucesso" },
    { title: "Óculos", artist: "Os Paralamas do Sucesso" },
    { title: "Tempo Perdido", artist: "Legião Urbana" },
    { title: "Eduardo e Mônica", artist: "Legião Urbana" },
    { title: "Faroeste Caboclo", artist: "Legião Urbana" },
    { title: "Pais e Filhos", artist: "Legião Urbana" },
    { title: "Será", artist: "Legião Urbana" },
    { title: "Que País É Este", artist: "Legião Urbana" },
    { title: "Primeiros Erros", artist: "Capital Inicial" },
    { title: "Natasha", artist: "Capital Inicial" },
    { title: "Música Urbana", artist: "Capital Inicial" },
    { title: "Exagerado", artist: "Cazuza" },
    { title: "Codinome Beija-Flor", artist: "Cazuza" },
    { title: "O Tempo Não Para", artist: "Cazuza" },
    { title: "Pro Dia Nascer Feliz", artist: "Barão Vermelho" },
    { title: "Bete Balanço", artist: "Barão Vermelho" },
    { title: "Malandragem", artist: "Cássia Eller" },
    { title: "O Segundo Sol", artist: "Cássia Eller" },
    { title: "Por Enquanto", artist: "Cássia Eller" },
    { title: "E.C.T.", artist: "Cássia Eller" },
    { title: "Amor I Love You", artist: "Marisa Monte" },
    { title: "Bem Que Se Quis", artist: "Marisa Monte" },
    { title: "Ainda Bem", artist: "Marisa Monte" },
    { title: "Beija Eu", artist: "Marisa Monte" },
    { title: "Infiel", artist: "Marília Mendonça" },
    { title: "Eu Sei de Cor", artist: "Marília Mendonça" },
    { title: "De Quem É a Culpa?", artist: "Marília Mendonça" },
    { title: "Ciumeira", artist: "Marília Mendonça" },
    { title: "Todo Mundo Vai Sofrer", artist: "Marília Mendonça" },
    { title: "Zé da Recaída", artist: "Gusttavo Lima" },
    { title: "Apelido Carinhoso", artist: "Gusttavo Lima" },
    { title: "Milu", artist: "Gusttavo Lima" },
    { title: "Cem Mil", artist: "Gusttavo Lima" },
    { title: "Na Hora de Amar", artist: "Gusttavo Lima" },
    { title: "Atrasadinha", artist: "Felipe Araújo feat. Ferrugem" },
    { title: "Largado às Traças", artist: "Zé Neto & Cristiano" },
    { title: "Notificação Preferida", artist: "Zé Neto & Cristiano" },
    { title: "Sorte Que Cê Beija Bem", artist: "Maiara & Maraisa" },
    { title: "Medo Bobo", artist: "Maiara & Maraisa" },
    { title: "10%", artist: "Maiara & Maraisa" },
    { title: "A Noite", artist: "Tiê" },
    { title: "Trevo (Tu)", artist: "Anavitória feat. Tiago Iorc" },
    { title: "Coisa Linda", artist: "Tiago Iorc" },
    { title: "Amei Te Ver", artist: "Tiago Iorc" },
    { title: "Dona de Mim", artist: "IZA" },
    { title: "Pesadão", artist: "IZA feat. Marcelo Falcão" },
    { title: "Brisa", artist: "IZA" },
    { title: "Ginga", artist: "IZA feat. Falcão" },
    { title: "Bang", artist: "Anitta" },
    { title: "Downtown", artist: "Anitta feat. J Balvin" },
    {
      title: "Vai Malandra",
      artist: "Anitta feat. MC Zaac, Maejor, Tropkillaz & DJ Yuri Martins",
    },
    { title: "Paradinha", artist: "Anitta" },
    {
      title: "Combatchy",
      artist: "Anitta, Lexa, Luísa Sonza feat. MC Rebecca",
    },
    { title: "Modo Turbo", artist: "Luísa Sonza, Pabllo Vittar feat. Anitta" },
    { title: "K.O.", artist: "Pabllo Vittar" },
    { title: "Corpo Sensual", artist: "Pabllo Vittar feat. Mateus Carrilho" },
  ],
  es: [
    { title: "Despacito", artist: "Luis Fonsi & Daddy Yankee" },
    { title: "La Bamba", artist: "Ritchie Valens" },
    {
      title: "Bailando",
      artist: "Enrique Iglesias feat. Descemer Bueno & Gente De Zona",
    },
    { title: "Rosas", artist: "La Oreja de Van Gogh" },
    { title: "La Camisa Negra", artist: "Juanes" },
    { title: "Livin' la Vida Loca", artist: "Ricky Martin" },
    { title: "Eres Tú", artist: "Mocedades" },
    { title: "Hips Don't Lie (Spanish Version)", artist: "Shakira" },
    { title: "Querida", artist: "Juan Gabriel" },
    { title: "Gasolina", artist: "Daddy Yankee" },
    { title: "Bésame Mucho", artist: "Consuelo Velázquez" },
    { title: "El Rey", artist: "Vicente Fernández" },
    { title: "A Dios le Pido", artist: "Juanes" },
    { title: "Rayando el Sol", artist: "Maná" },
    { title: "Corazón Partío", artist: "Alejandro Sanz" },
    { title: "Malamente", artist: "ROSALÍA" },
    { title: "Oye Como Va", artist: "Santana" },
    { title: "Como La Flor", artist: "Selena" },
    { title: "Vivir Mi Vida", artist: "Marc Anthony" },
    { title: "Mi Gente", artist: "J Balvin & Willy William" },
    { title: "Amor Prohibido", artist: "Selena" },
    { title: "Bidi Bidi Bom Bom", artist: "Selena" },
    {
      title: "El Perdedor",
      artist: "Enrique Iglesias feat. Marco Antonio Solís",
    },
    {
      title: "Súbeme la Radio",
      artist: "Enrique Iglesias feat. Descemer Bueno & Zion & Lennox",
    },
    { title: "Duele el Corazón", artist: "Enrique Iglesias feat. Wisin" },
    { title: "Hero (Spanish Version)", artist: "Enrique Iglesias" },
    { title: "Escapade", artist: "Enrique Iglesias" },
    { title: "Vuelve", artist: "Ricky Martin" },
    { title: "María", artist: "Ricky Martin" },
    { title: "La Copa de la Vida", artist: "Ricky Martin" },
    { title: "She Bangs (Spanish Version)", artist: "Ricky Martin" },
    { title: "Ciega, Sordomuda", artist: "Shakira" },
    { title: "Estoy Aquí", artist: "Shakira" },
    { title: "Antología", artist: "Shakira" },
    { title: "Ojos Así", artist: "Shakira" },
    { title: "Suerte", artist: "Shakira" },
    { title: "La Tortura", artist: "Shakira feat. Alejandro Sanz" },
    { title: "Waka Waka (Esto es África)", artist: "Shakira" },
    { title: "Me Enamora", artist: "Juanes" },
    { title: "Es Por Ti", artist: "Juanes" },
    { title: "Fotografía", artist: "Juanes feat. Nelly Furtado" },
    { title: "Labios Compartidos", artist: "Maná" },
    { title: "Oye Mi Amor", artist: "Maná" },
    { title: "Mariposa Traicionera", artist: "Maná" },
    { title: "En El Muelle de San Blas", artist: "Maná" },
    { title: "Amiga Mía", artist: "Alejandro Sanz" },
    {
      title: "Mi Persona Favorita",
      artist: "Alejandro Sanz feat. Camila Cabello",
    },
    {
      title: "Looking for Paradise",
      artist: "Alejandro Sanz feat. Alicia Keys",
    },
    { title: "No Me Compares", artist: "Alejandro Sanz" },
    { title: "Y ¿Si Fuera Ella?", artist: "Alejandro Sanz" },
    { title: "Hawái", artist: "Maluma" },
    { title: "Felices los 4", artist: "Maluma" },
    { title: "Chantaje", artist: "Shakira feat. Maluma" },
    { title: "Tusa", artist: "KAROL G & Nicki Minaj" },
    { title: "Provenza", artist: "KAROL G" },
    { title: "Bichota", artist: "KAROL G" },
    { title: "Dakiti", artist: "Bad Bunny & Jhay Cortez" },
    { title: "Yonaguni", artist: "Bad Bunny" },
    { title: "Tití Me Preguntó", artist: "Bad Bunny" },
    { title: "Callaita", artist: "Bad Bunny feat. Tainy" },
    { title: "X", artist: "Nicky Jam & J Balvin" },
    { title: "El Perdón", artist: "Nicky Jam & Enrique Iglesias" },
    { title: "Travesuras", artist: "Nicky Jam" },
    { title: "Ay Vamos", artist: "J Balvin" },
    { title: "Ginza", artist: "J Balvin" },
    { title: "Safari", artist: "J Balvin feat. Pharrell Williams, BIA & Sky" },
    { title: "Con Calma", artist: "Daddy Yankee feat. Snow" },
    { title: "Shaky Shaky", artist: "Daddy Yankee" },
    { title: "Dura", artist: "Daddy Yankee" },
    { title: "Limbo", artist: "Daddy Yankee" },
    { title: "Bailar", artist: "Deorro feat. Elvis Crespo" },
    { title: "Suavemente", artist: "Elvis Crespo" },
    { title: "La Vida Es Un Carnaval", artist: "Celia Cruz" },
    { title: "Guantanamera", artist: "Celia Cruz" },
    { title: "Quimbara", artist: "Celia Cruz & Johnny Pacheco" },
    { title: "Pedro Navaja", artist: "Willie Colón & Rubén Blades" },
    { title: "Vivir lo Nuestro", artist: "Marc Anthony & La India" },
    { title: "Valió la Pena", artist: "Marc Anthony" },
    { title: "Tu Amor Me Hace Bien", artist: "Marc Anthony" },
    { title: "Flor Pálida", artist: "Marc Anthony" },
    { title: "Sabor a Mí", artist: "Luis Miguel" },
    { title: "La Barca", artist: "Luis Miguel" },
    { title: "No Sé Tú", artist: "Luis Miguel" },
    { title: "La Incondicional", artist: "Luis Miguel" },
    { title: "Culpable o No", artist: "Luis Miguel" },
    { title: "Entrégate", artist: "Luis Miguel" },
    { title: "Si Nos Dejan", artist: "Luis Miguel" },
    { title: "Amor Eterno", artist: "Rocío Dúrcal" },
    { title: "La Gata Bajo la Lluvia", artist: "Rocío Dúrcal" },
    { title: "Costumbres", artist: "Rocío Dúrcal" },
    { title: "Como Tu Mujer", artist: "Rocío Dúrcal" },
    { title: "Así Fue", artist: "Juan Gabriel" },
    { title: "Hasta Que Te Conocí", artist: "Juan Gabriel" },
    { title: "No Tengo Dinero", artist: "Juan Gabriel" },
    { title: "Abrázame Muy Fuerte", artist: "Juan Gabriel" },
    { title: "El Destino", artist: "Juan Gabriel & Rocío Dúrcal" },
    { title: "Por Mujeres Como Tú", artist: "Pepe Aguilar" },
    { title: "Miedo", artist: "Pepe Aguilar" },
    { title: "Directo Al Corazón", artist: "Pepe Aguilar" },
    { title: "Recuérdame", artist: "Natalia Lafourcade" },
  ],
  it: [
    { title: "Nel blu, dipinto di blu (Volare)", artist: "Domenico Modugno" },
    { title: "Con te partirò", artist: "Andrea Bocelli" },
    { title: "L'italiano", artist: "Toto Cutugno" },
    { title: "Zitti e Buoni", artist: "Måneskin" },
    { title: "Caruso", artist: "Lucio Dalla" },
    { title: "O Sole Mio", artist: "Luciano Pavarotti" },
    { title: "Parole Parole", artist: "Mina" },
    { title: "Gloria", artist: "Umberto Tozzi" },
    { title: "Ti Amo", artist: "Umberto Tozzi" },
    { title: "Azzurro", artist: "Adriano Celentano" },
    { title: "Il Ragazzo della Via Gluck", artist: "Adriano Celentano" },
    { title: "La Solitudine", artist: "Laura Pausini" },
    { title: "Strani Amori", artist: "Laura Pausini" },
    { title: "Tra te e il mare", artist: "Laura Pausini" },
    { title: "Vivimi", artist: "Laura Pausini" },
    { title: "Laura non c'è", artist: "Nek" },
    { title: "Bella Ciao", artist: "Manu Pilas" },
    { title: "E Tu", artist: "Claudio Baglioni" },
    { title: "Piccolo Grande Amore", artist: "Claudio Baglioni" },
    { title: "Almeno tu nell'universo", artist: "Mia Martini" },
    { title: "Senza una donna", artist: "Zucchero" },
    { title: "Baila (Sexy Thing)", artist: "Zucchero" },
    { title: "Il Volo", artist: "Zucchero" },
    { title: "Cose della vita", artist: "Eros Ramazzotti" },
    { title: "Più bella cosa", artist: "Eros Ramazzotti" },
    { title: "Se bastasse una canzone", artist: "Eros Ramazzotti" },
    { title: "Un'altra te", artist: "Eros Ramazzotti" },
    { title: "Terra Promessa", artist: "Eros Ramazzotti" },
    { title: "Perdere l'amore", artist: "Massimo Ranieri" },
    { title: "Rose Rosse", artist: "Massimo Ranieri" },
    { title: "Il cielo in una stanza", artist: "Gino Paoli" },
    { title: "Sapore di sale", artist: "Gino Paoli" },
    { title: "Grande, grande, grande", artist: "Mina" },
    { title: "Se telefonando", artist: "Mina" },
    { title: "Tintarella di luna", artist: "Mina" },
    { title: "Via con me", artist: "Paolo Conte" },
    { title: "L'emozione non ha voce", artist: "Adriano Celentano" },
    { title: "Prisencolinensinainciusol", artist: "Adriano Celentano" },
    { title: "Svalutation", artist: "Adriano Celentano" },
    { title: "Felicità", artist: "Al Bano & Romina Power" },
    { title: "Ci sarà", artist: "Al Bano & Romina Power" },
    { title: "Sharazan", artist: "Al Bano & Romina Power" },
    { title: "Sará perché ti amo", artist: "Ricchi e Poveri" },
    { title: "Mamma Maria", artist: "Ricchi e Poveri" },
    { title: "Che sarà", artist: "Ricchi e Poveri" },
    { title: "Vacanze Romane", artist: "Matia Bazar" },
    { title: "Ti sento", artist: "Matia Bazar" },
    { title: "Solo noi", artist: "Toto Cutugno" },
    { title: "Gente di mare", artist: "Umberto Tozzi & Raf" },
    { title: "Self Control", artist: "Raf" },
    { title: "Cosa resterà degli anni '80", artist: "Raf" },
    { title: "Non me lo so spiegare", artist: "Tiziano Ferro" },
    { title: "Sere nere", artist: "Tiziano Ferro" },
    { title: "Perdono", artist: "Tiziano Ferro" },
    { title: "Ti scatterò una foto", artist: "Tiziano Ferro" },
    { title: "Alla mia età", artist: "Tiziano Ferro" },
    { title: "L'essenziale", artist: "Marco Mengoni" },
    { title: "Due Vite", artist: "Marco Mengoni" },
    { title: "Guerriero", artist: "Marco Mengoni" },
    { title: "Ti vorrei sollevare", artist: "Elisa feat. Giuliano Sangiorgi" },
    { title: "Luce (Tramonti a nord est)", artist: "Elisa" },
    { title: "O forse sei tu", artist: "Elisa" },
    { title: "Mentre tutto scorre", artist: "Negramaro" },
    { title: "Estate", artist: "Negramaro" },
    { title: "Nuvole e lenzuola", artist: "Negramaro" },
    { title: "A te", artist: "Jovanotti" },
    { title: "L'ombelico del mondo", artist: "Jovanotti" },
    { title: "Bella", artist: "Jovanotti" },
    { title: "Sabato", artist: "Jovanotti" },
    { title: "Baciami ancora", artist: "Jovanotti" },
    { title: "Vivere", artist: "Vasco Rossi" },
    { title: "Albachiara", artist: "Vasco Rossi" },
    { title: "Sally", artist: "Vasco Rossi" },
    { title: "Vita Spericolata", artist: "Vasco Rossi" },
    { title: "Un senso", artist: "Vasco Rossi" },
    { title: "Gli angeli", artist: "Vasco Rossi" },
    { title: "Certe Notti", artist: "Ligabue" },
    { title: "Urlando contro il cielo", artist: "Ligabue" },
    { title: "Piccola stella senza cielo", artist: "Ligabue" },
    { title: "Tra palco e realtà", artist: "Ligabue" },
    { title: "La donna cannone", artist: "Francesco De Gregori" },
    { title: "Rimmel", artist: "Francesco De Gregori" },
    { title: "Generale", artist: "Francesco De Gregori" },
    { title: "Piazza Grande", artist: "Lucio Dalla" },
    { title: "Attenti al lupo", artist: "Lucio Dalla" },
    { title: "4 marzo 1943", artist: "Lucio Dalla" },
    { title: "Centro di gravità permanente", artist: "Franco Battiato" },
    { title: "La cura", artist: "Franco Battiato" },
    { title: "Cuccurucucù", artist: "Franco Battiato" },
    { title: "I Giardini di Marzo", artist: "Lucio Battisti" },
    { title: "La canzone del sole", artist: "Lucio Battisti" },
    { title: "Il mio canto libero", artist: "Lucio Battisti" },
    { title: "E penso a te", artist: "Lucio Battisti" },
    { title: "Un'avventura", artist: "Lucio Battisti" },
    { title: "Acqua azzurra, acqua chiara", artist: "Lucio Battisti" },
    { title: "Brividi", artist: "Mahmood & Blanco" },
    { title: "Soldi", artist: "Mahmood" },
    { title: "Occidentali's Karma", artist: "Francesco Gabbani" },
    { title: "Fai Rumore", artist: "Diodato" },
  ],
  fr: [
    { title: "La Vie en Rose", artist: "Edith Piaf" },
    { title: "Non, je ne regrette rien", artist: "Edith Piaf" },
    { title: "Ne me quitte pas", artist: "Jacques Brel" },
    { title: "Tous les mêmes", artist: "Stromae" },
    { title: "Papaoutai", artist: "Stromae" },
    { title: "Alors on danse", artist: "Stromae" },
    { title: "Formidable", artist: "Stromae" },
    { title: "Dernière Danse", artist: "Indila" },
    { title: "Tourner dans le vide", artist: "Indila" },
    {
      title: "Je t'aime... moi non plus",
      artist: "Serge Gainsbourg & Jane Birkin",
    },
    { title: "La Javanaise", artist: "Serge Gainsbourg" },
    { title: "Bonnie and Clyde", artist: "Serge Gainsbourg & Brigitte Bardot" },
    { title: "Mistral Gagnant", artist: "Renaud" },
    { title: "Je l'aime à mourir", artist: "Francis Cabrel" },
    { title: "La Corrida", artist: "Francis Cabrel" },
    { title: "L'encre de tes yeux", artist: "Francis Cabrel" },
    { title: "Petite Marie", artist: "Francis Cabrel" },
    { title: "Pour que tu m'aimes encore", artist: "Celine Dion" },
    { title: "D'amour ou d'amitié", artist: "Celine Dion" },
    { title: "Parler à mon père", artist: "Celine Dion" },
    { title: "S'il suffisait d'aimer", artist: "Celine Dion" },
    { title: "Encore un soir", artist: "Celine Dion" },
    { title: "Elle m'a dit", artist: "Mika" },
    { title: "Je veux", artist: "Zaz" },
    { title: "Éblouie par la nuit", artist: "Zaz" },
    { title: "On ira", artist: "Zaz" },
    { title: "Joe le taxi", artist: "Vanessa Paradis" },
    { title: "La Seine", artist: "Vanessa Paradis & M" },
    { title: "Quelqu'un m'a dit", artist: "Carla Bruni" },
    { title: "Emmenez-moi", artist: "Charles Aznavour" },
    { title: "La Bohème", artist: "Charles Aznavour" },
    { title: "She (Tous les visages de l'amour)", artist: "Charles Aznavour" },
    { title: "Hier encore", artist: "Charles Aznavour" },
    { title: "Que c'est triste Venise", artist: "Charles Aznavour" },
    { title: "Désenchantée", artist: "Mylène Farmer" },
    { title: "Sans contrefaçon", artist: "Mylène Farmer" },
    { title: "Libertine", artist: "Mylène Farmer" },
    { title: "Pourvu qu'elles soient douces", artist: "Mylène Farmer" },
    { title: "California", artist: "Mylène Farmer" },
    { title: "L'Amour à la plage", artist: "Niagara" },
    { title: "Voyage Voyage", artist: "Desireless" },
    { title: "Ella, elle l'a", artist: "France Gall" },
    { title: "Poupée de cire, poupée de son", artist: "France Gall" },
    { title: "Résiste", artist: "France Gall" },
    { title: "Il jouait du piano debout", artist: "France Gall" },
    { title: "Si, maman si", artist: "France Gall" },
    { title: "Babacar", artist: "France Gall" },
    { title: "Message personnel", artist: "Françoise Hardy" },
    { title: "Comment te dire adieu", artist: "Françoise Hardy" },
    { title: "Tous les garçons et les filles", artist: "Françoise Hardy" },
    { title: "Mon amie la rose", artist: "Françoise Hardy" },
    { title: "Le temps de l'amour", artist: "Françoise Hardy" },
    { title: "Comme d'habitude", artist: "Claude François" },
    { title: "Alexandrie Alexandra", artist: "Claude François" },
    { title: "Le téléphone pleure", artist: "Claude François" },
    { title: "Belle", artist: "Garou, Daniel Lavoie & Patrick Fiori" },
    { title: "Le Temps des cathédrales", artist: "Bruno Pelletier" },
    { title: "L'Envie d'aimer", artist: "Daniel Lévi" },
    { title: "Allumer le feu", artist: "Johnny Hallyday" },
    { title: "Que je t'aime", artist: "Johnny Hallyday" },
    { title: "Marie", artist: "Johnny Hallyday" },
    { title: "Gabrielle", artist: "Johnny Hallyday" },
    { title: "Le Pénitencier", artist: "Johnny Hallyday" },
    { title: "Je te promets", artist: "Johnny Hallyday" },
    { title: "L'Envie", artist: "Johnny Hallyday" },
    { title: "San Francisco", artist: "Maxime Le Forestier" },
    { title: "Éducation sentimentale", artist: "Maxime Le Forestier" },
    { title: "Double Je", artist: "Christophe Willem" },
    { title: "Jacques a dit", artist: "Christophe Willem" },
    { title: "Balance ton quoi", artist: "Angèle" },
    { title: "Tout oublier", artist: "Angèle feat. Roméo Elvis" },
    { title: "Oui ou Non", artist: "Angèle" },
    { title: "Ta Reine", artist: "Angèle" },
    { title: "Bruxelles je t'aime", artist: "Angèle" },
    { title: "Fever", artist: "Dua Lipa & Angèle" },
    { title: "Sur ma route", artist: "Black M" },
    { title: "Sapés comme jamais", artist: "Maître Gims feat. Niska" },
    { title: "Bella", artist: "Maître Gims" },
    { title: "J'me tire", artist: "Maître Gims" },
    { title: "Est-ce que tu m'aimes?", artist: "Maître Gims" },
    { title: "Pas là", artist: "Vianney" },
    { title: "Beau-papa", artist: "Vianney" },
    { title: "Je m'en vais", artist: "Vianney" },
    { title: "Dernière Danse", artist: "Kyo" },
    { title: "Le Chemin", artist: "Kyo feat. Sita" },
    { title: "Un homme debout", artist: "Claudio Capéo" },
    { title: "Ça va ça va", artist: "Claudio Capéo" },
    { title: "Mercy", artist: "Madame Monsieur" },
    { title: "Andalouse", artist: "Kendji Girac" },
    { title: "Color Gitano", artist: "Kendji Girac" },
    { title: "Les yeux de la mama", artist: "Kendji Girac" },
    { title: "Aïcha", artist: "Khaled" },
    { title: "C'est la vie", artist: "Khaled" },
    { title: "Didi", artist: "Khaled" },
    { title: "Manhattan-Kaboul", artist: "Renaud & Axelle Red" },
    { title: "Sensualité", artist: "Axelle Red" },
    { title: "Morgane de toi", artist: "Renaud" },
    { title: "La groupie du pianiste", artist: "Michel Berger" },
    { title: "Paradis blanc", artist: "Michel Berger" },
  ],
  de: [
    { title: "99 Luftballons", artist: "Nena" },
    { title: "Du Hast", artist: "Rammstein" },
    { title: "Rock Me Amadeus", artist: "Falco" },
    { title: "Komet", artist: "Udo Lindenberg & Apache 207" },
    { title: "Sonne", artist: "Rammstein" },
    { title: "Engel", artist: "Rammstein" },
    { title: "Deutschland", artist: "Rammstein" },
    { title: "Ausländer", artist: "Rammstein" },
    { title: "Hier kommt Alex", artist: "Die Toten Hosen" },
    { title: "Tage wie diese", artist: "Die Toten Hosen" },
    { title: "Alles aus Liebe", artist: "Die Toten Hosen" },
    { title: "Männer", artist: "Herbert Grönemeyer" },
    { title: "Bochum", artist: "Herbert Grönemeyer" },
    { title: "Flugzeuge im Bauch", artist: "Herbert Grönemeyer" },
    { title: "Mensch", artist: "Herbert Grönemeyer" },
    { title: "Der Weg", artist: "Herbert Grönemeyer" },
    { title: "Zeit, dass sich was dreht", artist: "Herbert Grönemeyer" },
    { title: "Major Tom (Völlig losgelöst)", artist: "Peter Schilling" },
    { title: "Skandal im Sperrbezirk", artist: "Spider Murphy Gang" },
    { title: "Sternenhimmel", artist: "Hubert Kah" },
    { title: "Einmal um die Welt", artist: "Cro" },
    { title: "Easy", artist: "Cro" },
    { title: "Traum", artist: "Cro" },
    { title: "Bye Bye", artist: "Cro" },
    { title: "Lila Wolken", artist: "Marteria, Yasha & Miss Platnum" },
    { title: "Verstrahlt", artist: "Marteria feat. Yasha" },
    { title: "Kids (2 Finger an den Kopf)", artist: "Marteria" },
    { title: "Roller", artist: "Apache 207" },
    { title: "Bläulicht", artist: "Apache 207" },
    { title: "200 km/h", artist: "Apache 207" },
    { title: "Unterwegs", artist: "Apache 207" },
    { title: "Durch den Monsun", artist: "Tokio Hotel" },
    { title: "Rette mich", artist: "Tokio Hotel" },
    { title: "Der letzte Tag", artist: "Tokio Hotel" },
    { title: "An Tagen wie diesen", artist: "Fettes Brot" },
    { title: "Jein", artist: "Fettes Brot" },
    { title: "Emanuela", artist: "Fettes Brot" },
    { title: "Bettina, zieh dir bitte etwas an", artist: "Fettes Brot" },
    { title: "MFG", artist: "Die Fantastischen Vier" },
    { title: "Sie ist weg", artist: "Die Fantastischen Vier" },
    { title: "Die da!?!", artist: "Die Fantastischen Vier" },
    { title: "Zusammen", artist: "Die Fantastischen Vier feat. Clueso" },
    { title: "Gewinner", artist: "Clueso" },
    { title: "Cello", artist: "Udo Lindenberg feat. Clueso" },
    { title: "Stadtaffe", artist: "Peter Fox" },
    { title: "Haus am See", artist: "Peter Fox" },
    { title: "Alles Neu", artist: "Peter Fox" },
    { title: "Schwarz zu Blau", artist: "Peter Fox" },
    { title: "Schüttel deinen Speck", artist: "Peter Fox" },
    { title: "Zukunft Pink", artist: "Peter Fox feat. Inéz" },
    { title: "Dickes B", artist: "Seeed" },
    { title: "Ding", artist: "Seeed" },
    { title: "Augenbling", artist: "Seeed" },
    { title: "Aufstehn!", artist: "Seeed feat. CeeLo Green" },
    { title: "Molle mit Korn", artist: "Seeed" },
    { title: "Aurelie", artist: "Wir sind Helden" },
    { title: "Guten Tag", artist: "Wir sind Helden" },
    { title: "Denkmal", artist: "Wir sind Helden" },
    { title: "Nur ein Wort", artist: "Wir sind Helden" },
    { title: "Das Beste", artist: "Silbermond" },
    { title: "Symphonie", artist: "Silbermond" },
    { title: "Irgendwas bleibt", artist: "Silbermond" },
    { title: "Leichtes Gepäck", artist: "Silbermond" },
    { title: "Geile Zeit", artist: "Juli" },
    { title: "Perfekte Welle", artist: "Juli" },
    { title: "Elektrisches Gefühl", artist: "Juli" },
    { title: "Dieses Leben", artist: "Juli" },
    { title: "Söhne Stammheim", artist: "Die Ärzte" },
    { title: "Männer sind Schweine", artist: "Die Ärzte" },
    { title: "Schrei nach Liebe", artist: "Die Ärzte" },
    { title: "Zu spät", artist: "Die Ärzte" },
    { title: "Westerland", artist: "Die Ärzte" },
    { title: "Junge", artist: "Die Ärzte" },
    { title: "Willst du", artist: "Alligatoah" },
    { title: "Du bist schön", artist: "Alligatoah" },
    { title: "Trostpreis", artist: "Alligatoah" },
    { title: "Soll das so", artist: "Alligatoah" },
    { title: "Astronaut", artist: "Sido feat. Andreas Bourani" },
    { title: "Bilder im Kopf", artist: "Sido" },
    { title: "Einer dieser Steine", artist: "Sido feat. Mark Forster" },
    { title: "Mein Block", artist: "Sido" },
    { title: "Au Revoir", artist: "Mark Forster feat. Sido" },
    { title: "Chöre", artist: "Mark Forster" },
    { title: "Wir sind groß", artist: "Mark Forster" },
    { title: "Übermorgen", artist: "Mark Forster" },
    { title: "Bauch und Kopf", artist: "Mark Forster" },
    { title: "Auf uns", artist: "Andreas Bourani" },
    { title: "Nur in meinem Kopf", artist: "Andreas Bourani" },
    { title: "Eisberg", artist: "Andreas Bourani" },
    { title: "Herz über Kopf", artist: "Joris" },
    { title: "80 Millionen", artist: "Max Giesinger" },
    { title: "Wenn sie tanzt", artist: "Max Giesinger" },
    { title: "Legenden", artist: "Max Giesinger" },
    { title: "Feuerwerk", artist: "Wincent Weiss" },
    { title: "Musik sein", artist: "Wincent Weiss" },
    { title: "An Wunder", artist: "Wincent Weiss" },
    { title: "Sowieso", artist: "Mark Forster" },
    { title: "Lieblingsmensch", artist: "Namika" },
    { title: "Je ne parle pas français", artist: "Namika" },
    { title: "Alles was zählt", artist: "Namika" },
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Classification from score (Guide v2.7)
function classificationFromScore(score) {
  if (score >= 8.1) return "Extremely Revolutionary";
  if (score >= 6.1) return "Revolutionary";
  if (score >= 4.1) return "Moderately Revolutionary";
  if (score >= 2.1) return "Constructive Critique";
  if (score >= 0.1) return "Ambiguous, Leaning Realist";
  if (score >= -2.0) return "Ambiguous, Leaning Evasion";
  if (score >= -4.0) return "Soft Conformist";
  if (score >= -6.0) return "Directly Conformist";
  if (score >= -8.0) return "Strongly Conformist";
  return "Doctrinally Conformist";
}

// Philosophical note from score
function calculatePhilosophicalNote(finalScore) {
  if (finalScore >= 8.1) return 10;
  if (finalScore >= 6.1) return 9;
  if (finalScore >= 4.1) return 8;
  if (finalScore >= 2.1) return 7;
  if (finalScore >= 0.1) return 6;
  if (finalScore >= -2.0) return 5;
  if (finalScore >= -4.0) return 4;
  if (finalScore >= -6.0) return 3;
  if (finalScore >= -8.0) return 2;
  return 1;
}

// Calculate weighted score
function calculateWeightedScore(scores) {
  return (
    (scores.ethics || 0) * WEIGHTS.ethics +
    (scores.metaphysics || 0) * WEIGHTS.metaphysics +
    (scores.epistemology || 0) * WEIGHTS.epistemology +
    (scores.politics || 0) * WEIGHTS.politics +
    (scores.aesthetics || 0) * WEIGHTS.aesthetics
  );
}

// Extract JSON from AI response
function extractJSON(text) {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
    }
  }
  return null;
}

// Load canonical LITE guide from local file
function loadGuide() {
  const guidePath = path.join(__dirname, "..", "guides", "Guide_v2.9_LITE.txt");
  return fs.readFileSync(guidePath, "utf-8");
}

// ============================================================
// LYRICS FETCHING (Genius + Letras.mus.br fallback)
// ============================================================

// Local lyrics cache file
const LYRICS_CACHE_PATH = path.join(__dirname, "lyrics-cache.json");
let lyricsCache = {};

// Load lyrics cache
function loadLyricsCache() {
  try {
    if (fs.existsSync(LYRICS_CACHE_PATH)) {
      lyricsCache = JSON.parse(fs.readFileSync(LYRICS_CACHE_PATH, "utf-8"));
      console.log(
        `   📚 Lyrics cache loaded (${Object.keys(lyricsCache).length} songs)`,
      );
    }
  } catch (e) {
    lyricsCache = {};
  }
}

// Save lyrics cache
function saveLyricsCache() {
  fs.writeFileSync(LYRICS_CACHE_PATH, JSON.stringify(lyricsCache, null, 2));
}

// Create cache key
function getLyricsCacheKey(song, artist) {
  return `${song.toLowerCase().trim()}|${artist.toLowerCase().trim()}`;
}

// Normalize functions (from api/src/lyrics/normalizer.js)
function cleanSongName(song) {
  return song
    .replace(/\s*-\s*Remastered\s+\d{4}/gi, "")
    .replace(/\s*\(\s*Remastered\s+\d{4}\s*\)/gi, "")
    .replace(/\s*-\s*\d{4}\s+Remaster/gi, "")
    .replace(/\s*\(\s*\d{4}\s+Remaster\s*\)/gi, "")
    .replace(
      /\s*-\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)/gi,
      "",
    )
    .replace(
      /\s*\(\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)\s*\)/gi,
      "",
    )
    .replace(
      /\s*\[\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)\s*\]/gi,
      "",
    )
    .replace(/\s*[\(\[]?\s*feat\.?\s+.*?[\)\]]?/gi, "")
    .replace(/\s*[\(\[]?\s*featuring\s+.*?[\)\]]?/gi, "")
    .replace(/\s*[\(\[]?\s*ft\.?\s+.*?[\)\]]?/gi, "")
    .trim();
}

function simplifyArtist(artist) {
  if (!artist) return "";
  return artist
    .split(/[,&]/)[0]
    .replace(/\s*(feat|featuring|ft)\.?.*/gi, "")
    .trim();
}

function createSlug(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Delay between Genius calls to avoid rate limiting
const GENIUS_DELAY = 5000; // 5 seconds between Genius requests
let lastGeniusCall = 0;

async function searchGenius(song, artist, retryCount = 0) {
  // Rate limit: wait if needed
  const now = Date.now();
  const elapsed = now - lastGeniusCall;
  if (elapsed < GENIUS_DELAY && lastGeniusCall > 0) {
    await sleep(GENIUS_DELAY - elapsed);
  }
  lastGeniusCall = Date.now();

  try {
    const query = encodeURIComponent(`${song} ${artist}`);
    const response = await fetch(`https://api.genius.com/search?q=${query}`, {
      headers: {
        Authorization: `Bearer ${CONFIG.GENIUS_ACCESS_TOKEN}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (retryCount < 2) {
        console.log(`        ⚠️  Genius rate limited, waiting 30s...`);
        await sleep(30000); // Wait 30 seconds before retry
        return searchGenius(song, artist, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();
    return data.response?.hits?.[0]?.result || null;
  } catch (e) {
    if (retryCount < 2) {
      await sleep(10000);
      return searchGenius(song, artist, retryCount + 1);
    }
    return null;
  }
}

async function scrapeLyrics(geniusUrl, retryCount = 0) {
  await sleep(2000);

  try {
    const response = await fetch(geniusUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    const html = await response.text();

    // Check if we got a Cloudflare challenge page
    if (
      html.includes("Just a moment") ||
      html.includes("cf-browser-verification")
    ) {
      if (retryCount < 2) {
        console.log(`        ⚠️  Cloudflare block, waiting 30s...`);
        await sleep(30000);
        return scrapeLyrics(geniusUrl, retryCount + 1);
      }
      return null;
    }

    // Method 1: Look for data-lyrics-container (current Genius format)
    let lyricsMatch = html.match(
      /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g,
    );

    // Method 2: Fallback to Lyrics__Container class
    if (!lyricsMatch) {
      lyricsMatch = html.match(
        /<div class="Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
      );
    }

    // Method 3: Fallback to lyrics class
    if (!lyricsMatch) {
      lyricsMatch = html.match(
        /<div class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      );
    }

    if (lyricsMatch) {
      let lyrics = lyricsMatch
        .join("\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/\[.*?\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return lyrics;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Letras.mus.br fallback
async function getFromLetrasMusicasBr(song, artist) {
  try {
    const artistSlug = createSlug(simplifyArtist(artist));
    const songSlug = createSlug(cleanSongName(song));

    if (!artistSlug || !songSlug) return null;

    const url = `https://www.letras.mus.br/${artistSlug}/${songSlug}.html`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const lyricMatch = html.match(
      /<div[^>]*class="[^"]*lyric-original[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );
    if (!lyricMatch) return null;

    const lyrics = lyricMatch[1]
      .replace(/<p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();

    if (lyrics.length > 100) {
      console.log(`        ✓ Letras.mus.br (${lyrics.length} chars)`);
      return lyrics;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Use Claude to fetch lyrics (more reliable for popular songs)
async function fetchLyricsFromClaude(song, artist) {
  try {
    const anthropic = new Anthropic({ apiKey: CONFIG.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Please provide the complete lyrics for the song "${song}" by ${artist}. 
        
IMPORTANT: 
- Return ONLY the lyrics, no commentary or explanations
- Include all verses, choruses, bridges
- Do not include section labels like [Verse 1] or [Chorus]
- If you don't know the complete lyrics, say "LYRICS_NOT_FOUND"
- Do not make up or guess lyrics`,
        },
      ],
    });

    const text = response.content[0]?.text || "";

    if (text.includes("LYRICS_NOT_FOUND") || text.length < 100) {
      return null;
    }

    return text.trim();
  } catch (e) {
    console.error(`        ⚠️  Claude lyrics fetch failed: ${e.message}`);
    return null;
  }
}

async function getLyrics(song, artist) {
  const cacheKey = getLyricsCacheKey(song, artist);

  // Check cache first
  if (lyricsCache[cacheKey]) {
    console.log(`        ✓ Cached (${lyricsCache[cacheKey].length} chars)`);
    return lyricsCache[cacheKey];
  }

  // Try Letras.mus.br first (no rate limiting)
  const letrasLyrics = await getFromLetrasMusicasBr(song, artist);
  if (letrasLyrics) {
    lyricsCache[cacheKey] = letrasLyrics;
    saveLyricsCache();
    return letrasLyrics;
  }

  // Try Genius (with rate limiting)
  const geniusResult = await searchGenius(
    cleanSongName(song),
    simplifyArtist(artist),
  );
  if (geniusResult?.url) {
    const lyrics = await scrapeLyrics(geniusResult.url);
    if (lyrics && lyrics.length > 100) {
      console.log(`        ✓ Genius (${lyrics.length} chars)`);
      lyricsCache[cacheKey] = lyrics;
      saveLyricsCache();
      return lyrics;
    }
  }

  // Fallback: Use Claude to fetch lyrics from its training data
  console.log(`        🤖 Trying Claude for lyrics...`);
  const claudeLyrics = await fetchLyricsFromClaude(song, artist);
  if (claudeLyrics) {
    console.log(`        ✓ Claude (${claudeLyrics.length} chars)`);
    lyricsCache[cacheKey] = claudeLyrics;
    saveLyricsCache();
    return claudeLyrics;
  }

  console.log(`        ⚠️  No lyrics found`);
  return null;
}

// ============================================================
// PROMPT BUILDER (from api/src/ai/prompts/template.js)
// ============================================================

function buildAnalysisPrompt(song, artist, lyrics, guide, lang = "en") {
  const targetLanguage = LANG_NAMES[lang] || "English";

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 PHILOSOPHICAL GUIDE v2.7 LITE - MANDATORY REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 YOU MUST CONSULT AND APPLY THE FOLLOWING GUIDE RIGOROUSLY 🚨

${guide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 CRITICAL LANGUAGE INSTRUCTION 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST WRITE YOUR ENTIRE RESPONSE IN ${targetLanguage.toUpperCase()}

⚠️ THIS IS MANDATORY AND NON-NEGOTIABLE ⚠️

EVERY SINGLE WORD must be in ${targetLanguage}:
- ✅ All justifications → ${targetLanguage}
- ✅ philosophical_analysis → ${targetLanguage}
- ✅ historical_context → ${targetLanguage}
- ⚠️ classification → ALWAYS IN ENGLISH (standardized enum)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANÁLISE SOLICITADA:

Música: "${song}"
Artista: ${artist}

LETRA COMPLETA:
${lyrics}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES:
Analise esta música seguindo RIGOROSAMENTE o guia acima.

Retorne APENAS o JSON válido com esta estrutura:
{
  "scorecard": {
    "ethics": { "score": 0, "justification": "..." },
    "metaphysics": { "score": 0, "justification": "..." },
    "epistemology": { "score": 0, "justification": "..." },
    "politics": { "score": 0, "justification": "..." },
    "aesthetics": { "score": 0, "justification": "..." },
    "final_score": 0
  },
  "classification": "...",
  "philosophical_analysis": "...",
  "philosophical_note": 0,
  "historical_context": "...",
  "creative_process": "...",
  "country": "...",
  "genre": "..."
}

🚨 CRITICAL: All scores must be integers from -10 to +10
🚨 CRITICAL: Classification must be one of the exact English values from the guide
🚨 CRITICAL: All text fields (except classification) must be in ${targetLanguage}
`;
}

// ============================================================
// AI MODEL CALLS
// ============================================================

async function callClaude(prompt, lang) {
  const client = new Anthropic({ apiKey: CONFIG.ANTHROPIC_API_KEY });
  const targetLanguage = LANG_NAMES[lang] || "English";

  const response = await client.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 16000,
    temperature: 1,
    thinking: { type: "enabled", budget_tokens: 4000 },
    system: `You are a philosophical analyst specialized in Objectivist philosophy. Write EVERYTHING in ${targetLanguage}.`,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  return textContent?.text || "";
}

async function callOpenAI(prompt, lang) {
  const client = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY, timeout: 90000 });
  const targetLanguage = LANG_NAMES[lang] || "English";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a philosophical analyst. Write EVERYTHING in ${targetLanguage}.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 8000,
  });

  return response.choices[0].message.content;
}

async function callGemini(prompt, lang) {
  const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const targetLanguage = LANG_NAMES[lang] || "English";

  const result = await model.generateContent(
    `Write EVERYTHING in ${targetLanguage}.\n\n${prompt}`,
  );
  return result.response.text();
}

async function callGrok(prompt, lang) {
  const targetLanguage = LANG_NAMES[lang] || "English";

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3-latest",
      messages: [
        {
          role: "system",
          content: `You are a philosophical analyst. Write EVERYTHING in ${targetLanguage}.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callDeepSeek(prompt, lang) {
  const targetLanguage = LANG_NAMES[lang] || "English";

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content: `You are a philosophical analyst. Write EVERYTHING in ${targetLanguage}.`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function analyzeWithModel(song, artist, lyrics, guide, lang, model) {
  const prompt = buildAnalysisPrompt(song, artist, lyrics, guide, lang);

  console.log(`        🤖 Calling ${model}...`);

  let response;
  switch (model) {
    case "claude":
      response = await callClaude(prompt, lang);
      break;
    case "openai":
      response = await callOpenAI(prompt, lang);
      break;
    case "gemini":
      response = await callGemini(prompt, lang);
      break;
    case "grok":
      response = await callGrok(prompt, lang);
      break;
    case "deepseek":
      response = await callDeepSeek(prompt, lang);
      break;
    default:
      throw new Error(`Unknown model: ${model}`);
  }

  const parsed = extractJSON(response);
  if (!parsed) {
    throw new Error("Failed to parse AI response as JSON");
  }

  // Normalize and calculate weighted score
  const scorecard = parsed.scorecard || parsed.scores || {};
  const scores = {
    ethics: scorecard.ethics?.score || scorecard.ethics?.value || 0,
    metaphysics:
      scorecard.metaphysics?.score || scorecard.metaphysics?.value || 0,
    epistemology:
      scorecard.epistemology?.score || scorecard.epistemology?.value || 0,
    politics: scorecard.politics?.score || scorecard.politics?.value || 0,
    aesthetics: scorecard.aesthetics?.score || scorecard.aesthetics?.value || 0,
  };

  const finalScore = calculateWeightedScore(scores);
  const classification = classificationFromScore(finalScore);
  const philosophicalNote = calculatePhilosophicalNote(finalScore);

  return {
    ...parsed,
    scorecard: {
      ethics: {
        score: scores.ethics,
        justification:
          scorecard.ethics?.justification || scorecard.ethics?.reasoning || "",
      },
      metaphysics: {
        score: scores.metaphysics,
        justification:
          scorecard.metaphysics?.justification ||
          scorecard.metaphysics?.reasoning ||
          "",
      },
      epistemology: {
        score: scores.epistemology,
        justification:
          scorecard.epistemology?.justification ||
          scorecard.epistemology?.reasoning ||
          "",
      },
      politics: {
        score: scores.politics,
        justification:
          scorecard.politics?.justification ||
          scorecard.politics?.reasoning ||
          "",
      },
      aesthetics: {
        score: scores.aesthetics,
        justification:
          scorecard.aesthetics?.justification ||
          scorecard.aesthetics?.reasoning ||
          "",
      },
      final_score: Math.round(finalScore * 100) / 100,
    },
    classification,
    philosophical_note: philosophicalNote,
  };
}

// ============================================================
// SPOTIFY API - Get spotify_id for songs
// ============================================================

let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${CONFIG.SPOTIFY_CLIENT_ID}:${CONFIG.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  spotifyToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return spotifyToken;
}

async function getSpotifyId(title, artist) {
  try {
    const token = await getSpotifyToken();
    const query = encodeURIComponent(`track:${title} artist:${artist}`);

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      console.log(`        ⚠️ Spotify search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const spotifyId = data.tracks?.items?.[0]?.id || null;

    if (spotifyId) {
      console.log(`        🎵 Spotify ID: ${spotifyId}`);
    }

    return spotifyId;
  } catch (e) {
    console.log(`        ⚠️ Spotify error: ${e.message}`);
    return null;
  }
}

// ============================================================
// SUPABASE OPERATIONS
// ============================================================

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

async function getOrCreateSong(title, artist) {
  // Check if song exists
  const { data: existing } = await supabase
    .from("songs")
    .select("id, spotify_id")
    .eq("title", title)
    .eq("artist", artist)
    .single();

  if (existing) {
    // If song exists but has no spotify_id, try to get it
    if (!existing.spotify_id) {
      const spotifyId = await getSpotifyId(title, artist);
      if (spotifyId) {
        await supabase
          .from("songs")
          .update({ spotify_id: spotifyId })
          .eq("id", existing.id);
        console.log(`        ✅ Updated spotify_id for existing song`);
      }
    }
    return existing.id;
  }

  // Get spotify_id before creating
  const spotifyId = await getSpotifyId(title, artist);

  // Create new song with spotify_id
  const { data: created, error } = await supabase
    .from("songs")
    .insert({
      title,
      artist,
      spotify_id: spotifyId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

async function checkExistingAnalysis(songId, lang, model) {
  const { data } = await supabase
    .from("analyses")
    .select("id")
    .eq("song_id", songId)
    .eq("language", lang)
    .eq("model", model)
    .single();

  return data?.id || null;
}

// Parse year from various formats (handles "Unknown", strings, etc.)
function parseYear(value) {
  if (!value) return null;
  if (typeof value === "number" && value > 1900 && value < 2100) return value;
  if (typeof value === "string") {
    const match = value.match(/\d{4}/);
    if (match) {
      const year = parseInt(match[0]);
      if (year > 1900 && year < 2100) return year;
    }
  }
  return null;
}

async function saveAnalysis(analysis, songId, lang, model) {
  const scorecard = analysis.scorecard || {};

  const analysisData = {
    song_id: songId,
    language: lang,
    model: model,
    version: 1,
    ethics_score: scorecard.ethics?.score || 0,
    metaphysics_score: scorecard.metaphysics?.score || 0,
    epistemology_score: scorecard.epistemology?.score || 0,
    politics_score: scorecard.politics?.score || 0,
    aesthetics_score: scorecard.aesthetics?.score || 0,
    final_score: scorecard.final_score || 0,
    summary: analysis.philosophical_analysis || analysis.analysis || "",
    ethics_analysis: scorecard.ethics?.justification || "",
    metaphysics_analysis: scorecard.metaphysics?.justification || "",
    epistemology_analysis: scorecard.epistemology?.justification || "",
    politics_analysis: scorecard.politics?.justification || "",
    aesthetics_analysis: scorecard.aesthetics?.justification || "",
    classification: analysis.classification || "",
    philosophical_note: analysis.philosophical_note || "",
    release_year: parseYear(analysis.year || analysis.release_year),
    genre: analysis.genre || null,
    country: analysis.country || null,
    historical_context: analysis.historical_context || null,
    creative_process: analysis.creative_process || null,
    status: "published",
  };

  // Use upsert to handle duplicates gracefully
  const { data, error } = await supabase
    .from("analyses")
    .upsert(analysisData, {
      onConflict: "song_id,language,model",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ============================================================
// MAIN BATCH PROCESS
// ============================================================

async function main() {
  console.log("\n========================================");
  console.log("PHILOSIFY - BATCH ANALYSIS (PROPER)");
  console.log("========================================\n");
  console.log("⏱️  Rate: Maximum speed (no delays)\n");

  // Load guide
  console.log("📖 Loading Guide v2.7 LITE...");
  const guide = loadGuide();
  console.log(`   ✅ Guide loaded (${guide.length} chars)`);

  // Load lyrics cache
  loadLyricsCache();

  const args = process.argv.slice(2);
  const langFilter = args[0];
  const modelFilter = args[1];
  const startIndex = parseInt(args[2]) || 0;

  const languages = langFilter ? [langFilter] : Object.keys(SONGS);
  const models = modelFilter ? [modelFilter] : MODELS;

  let totalSongs = 0;
  for (const lang of languages) {
    totalSongs += SONGS[lang]?.length || 0;
  }
  const totalAnalyses = totalSongs * models.length;
  const estimatedHours = (totalAnalyses * 0.75) / 60; // ~45 seconds per analysis

  console.log(`Languages: ${languages.join(", ")}`);
  console.log(`Models: ${models.join(", ")}`);
  console.log(`Total songs: ${totalSongs}`);
  console.log(`Total analyses: ${totalAnalyses}`);
  console.log(`Estimated time: ${estimatedHours.toFixed(1)} hours`);
  console.log(`Starting from index: ${startIndex}`);
  console.log("\n----------------------------------------\n");

  const report = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    cached: 0,
    noLyrics: 0,
    errors: [],
  };
  let globalIndex = 0;
  let lastAICallTime = 0;

  // Cache for lyrics (fetch once per song, reuse for all models)
  const lyricsCache = new Map();

  for (const lang of languages) {
    const songs = SONGS[lang] || [];
    console.log(
      `\n📁 Processing ${lang.toUpperCase()} (${songs.length} songs)\n`,
    );

    for (const { title, artist } of songs) {
      // Fetch lyrics ONCE per song (before model loop)
      const lyricsCacheKey = `${title}|||${artist}`;
      let lyrics = lyricsCache.get(lyricsCacheKey);

      if (lyrics === undefined) {
        console.log(`\n🎵 "${title}" - ${artist}`);
        console.log(`   📝 Fetching lyrics...`);
        lyrics = await getLyrics(title, artist);
        lyricsCache.set(lyricsCacheKey, lyrics); // Cache even if null

        if (lyrics) {
          console.log(`   ✅ Lyrics found (${lyrics.length} chars)`);
        } else {
          console.log(
            `   ⚠️  No lyrics found - skipping all models for this song`,
          );
        }
      }

      // Skip all models if no lyrics
      if (!lyrics) {
        for (const model of models) {
          globalIndex++;
          if (globalIndex > startIndex) {
            report.noLyrics++;
          } else {
            report.skipped++;
          }
        }
        continue;
      }

      // Get or create song ONCE (before model loop)
      let songId;
      try {
        songId = await getOrCreateSong(title, artist);
      } catch (e) {
        console.log(`   ❌ Failed to get/create song: ${e.message}`);
        for (const model of models) {
          globalIndex++;
          if (globalIndex > startIndex) {
            report.failed++;
            report.errors.push({
              song: title,
              artist,
              lang,
              model,
              error: e.message,
            });
          }
        }
        continue;
      }

      for (const model of models) {
        globalIndex++;

        if (globalIndex <= startIndex) {
          report.skipped++;
          continue;
        }

        report.total++;
        const progress = `[${globalIndex}/${totalAnalyses}]`;
        const now = new Date().toLocaleTimeString();

        console.log(`\n${progress} 🎵 "${title}" - ${artist} (${now})`);
        console.log(`        📍 Lang: ${lang}, Model: ${model}`);

        try {
          // Check if analysis already exists
          const existingId = await checkExistingAnalysis(songId, lang, model);
          if (existingId) {
            report.cached++;
            console.log(`        ⏭️  Already cached (ID: ${existingId})`);
            continue; // No delay for cached items
          }

          // Rate limiting: ensure 6 minutes between AI calls
          const timeSinceLastCall = Date.now() - lastAICallTime;
          if (
            lastAICallTime > 0 &&
            timeSinceLastCall < CONFIG.DELAY_BETWEEN_SONGS
          ) {
            const waitTime = CONFIG.DELAY_BETWEEN_SONGS - timeSinceLastCall;
            const nextTime = new Date(
              Date.now() + waitTime,
            ).toLocaleTimeString();
            console.log(
              `        ⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s... (next at ${nextTime})`,
            );
            await sleep(waitTime);
          }

          // Run analysis with retry (1 retry on failure)
          let analysis;
          let retries = 0;
          while (retries < 2) {
            try {
              analysis = await analyzeWithModel(
                title,
                artist,
                lyrics,
                guide,
                lang,
                model,
              );
              break; // Success
            } catch (e) {
              retries++;
              if (retries < 2) {
                console.log(`        ⚠️  Retry ${retries}/1: ${e.message}`);
                await sleep(10000); // Wait 10s before retry
              } else {
                throw e; // Give up after 1 retry
              }
            }
          }

          lastAICallTime = Date.now();

          // Save to Supabase
          const analysisId = await saveAnalysis(analysis, songId, lang, model);

          report.success++;
          console.log(
            `        ✅ Score: ${analysis.scorecard.final_score}, Class: ${analysis.classification}`,
          );
          console.log(`        💾 Saved (ID: ${analysisId})`);

          // Save progress checkpoint
          console.log(
            `        📊 Progress: ${report.success} success, ${report.cached} cached, ${report.failed} failed`,
          );
        } catch (error) {
          report.failed++;
          console.log(`        ❌ Failed: ${error.message}`);
          report.errors.push({
            song: title,
            artist,
            lang,
            model,
            error: error.message,
          });
        }
      }
    }
  }

  // Final report
  console.log("\n========================================");
  console.log("FINAL REPORT");
  console.log("========================================");
  console.log(`Total attempted: ${report.total}`);
  console.log(`Successful: ${report.success}`);
  console.log(`Already cached: ${report.cached}`);
  console.log(`No lyrics: ${report.noLyrics}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Last index processed: ${globalIndex}`);

  if (report.errors.length > 0) {
    console.log("\n❌ ERRORS:");
    for (const err of report.errors) {
      console.log(
        `   - "${err.song}" (${err.lang}/${err.model}): ${err.error}`,
      );
    }
  }

  // Save progress to file for resume capability
  const progressFile = path.join(__dirname, "batch-progress.json");
  const progressData = {
    lastRun: new Date().toISOString(),
    lastIndex: globalIndex,
    report,
    resumeCommand:
      `node scripts/batch-analyze.js ${langFilter || ""} ${modelFilter || ""} ${globalIndex}`.trim(),
  };
  fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
  console.log(`\n📄 Progress saved to: ${progressFile}`);
  console.log(`   To resume: ${progressData.resumeCommand}`);

  console.log("========================================\n");
}

main().catch(console.error);
