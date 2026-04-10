-- ============================================================
-- PHILOSIFY QUIZ - Batch 7: Final push to 500+
-- Fills gaps in: applied, music, cinema, quotes, american_exceptionalism
-- Fills difficulty gaps: 4, 6, 8, 9, 10
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

-- ============================================================
-- APPLIED PHILOSOPHY — 15 more
-- ============================================================

('applied', 4, 'What is the philosophical argument for animal rights?',
  '[{"text": "That the capacity to suffer, not species membership, is the morally relevant criterion for moral consideration", "correct": true}, {"text": "Animals should vote"}, {"text": "Animals are more intelligent than humans"}, {"text": "Only pets have rights"}]',
  'Peter Singer''s utilitarianism and Tom Regan''s rights-based approach both argue that species alone cannot determine moral status. If suffering matters morally, then animal suffering matters — a challenge to human-centered ethics.',
  '{"1": "Animal rights concerns moral consideration, not political participation.", "2": "The argument is about suffering, not comparative intelligence.", "3": "The argument applies to all sentient animals, not just domesticated ones."}'),

('applied', 5, 'What is the "effective altruism" movement and what philosophy underlies it?',
  '[{"text": "Using evidence and reason to determine the most effective ways to help others — grounded in utilitarian consequentialism and impartial concern for all sentient beings", "correct": true}, {"text": "A type of charity auction"}, {"text": "Volunteering without thinking"}, {"text": "Donating only to local causes"}]',
  'Effective altruism (Singer, MacAskill) applies cost-benefit analysis to charitable giving. It asks: where does a dollar save the most lives or prevent the most suffering? This has philosophical implications about impartiality and moral obligation.',
  '{"1": "It is a philosophical movement, not an event format.", "2": "It emphasizes careful reasoning, not spontaneous action.", "3": "It often prioritizes global causes where impact per dollar is highest."}'),

('applied', 6, 'What is the "paradox of tolerance" as applied to free speech policy?',
  '[{"text": "Unlimited free speech may allow the enemies of free speech to destroy it — but restricting speech to protect it risks the very authoritarianism it aims to prevent", "correct": true}, {"text": "That tolerant people cannot speak freely"}, {"text": "That speech has no consequences"}, {"text": "That only intolerant speech is effective"}]',
  'This applied ethics problem has no clean solution. Mill argued truth emerges from open debate. Popper argued intolerance of intolerance is necessary. The tension between these principles shapes every free speech debate.',
  '{"1": "The paradox is about institutional design, not individual behavior.", "2": "Speech has real consequences, which is precisely why the debate exists.", "3": "The paradox concerns all speech, not just intolerant speech."}'),

('applied', 6, 'What is the philosophical case for and against genetic enhancement?',
  '[{"text": "Proponents argue it extends human autonomy and well-being; opponents argue it threatens equality, human dignity, and could create a genetic underclass", "correct": true}, {"text": "Everyone agrees it is good"}, {"text": "Everyone agrees it is bad"}, {"text": "It has no ethical implications"}]',
  'Michael Sandel warns about "the ethics of enhancement" — that engineering children undermines the unconditional acceptance that grounds parental love. Transhumanists counter that refusing to prevent suffering when we can is itself immoral.',
  '{"1": "The debate is deeply contested among philosophers.", "2": "Many philosophers and scientists support it under certain conditions.", "3": "Genetic enhancement raises some of the most profound ethical questions of our era."}'),

('applied', 7, 'What is the "veil of ignorance" applied to immigration policy?',
  '[{"text": "If you did not know which country you would be born in, you would likely favor more open borders — challenging the moral justification for restricting movement based on birth location", "correct": true}, {"text": "Immigrants should wear veils"}, {"text": "Immigration policy should be random"}, {"text": "The veil of ignorance only applies to domestic policy"}]',
  'Joseph Carens used Rawlsian reasoning to argue that citizenship restrictions are the modern equivalent of feudal privilege — morally arbitrary barriers that ration opportunity based on the accident of birth.',
  '{"1": "The veil is a thought experiment, not a dress code.", "2": "The argument is about moral justification, not randomness.", "3": "Rawlsian reasoning can be applied to any policy domain, including international justice."}'),

('applied', 8, 'What is the "mere addition paradox" in population ethics?',
  '[{"text": "Adding people with lives barely worth living seems permissible, but iterating this leads to a vast population with minimal well-being — which seems worse than the original smaller, happier population", "correct": true}, {"text": "A problem with arithmetic"}, {"text": "Adding too many ingredients to a recipe"}, {"text": "A database management issue"}]',
  'Parfit showed that intuitive principles about population lead to contradictions. Each step seems reasonable, but the endpoint is repugnant. No existing moral theory resolves this cleanly — it remains one of philosophy''s hardest problems.',
  '{"1": "It is a philosophical problem about value, not mathematics.", "2": "It concerns population ethics, not cooking.", "3": "It is about moral theory, not information technology."}'),

('applied', 8, 'What is the philosophical debate about cognitive enhancement drugs?',
  '[{"text": "Whether using drugs to improve focus, memory, or intelligence is a form of cheating that undermines authentic achievement, or a legitimate tool like caffeine or education", "correct": true}, {"text": "Whether drugs should be more expensive"}, {"text": "A debate about drug legalization only"}, {"text": "Whether pharmacists need more training"}]',
  'If we accept caffeine, education, and good nutrition as cognitive enhancers, what makes modafinil or nootropics different? The debate touches on authenticity, fairness, human nature, and what counts as genuine accomplishment.',
  '{"1": "The debate is about ethics and authenticity, not pricing.", "2": "It specifically concerns enhancement, not recreational use or general legalization.", "3": "It concerns philosophy of mind and ethics, not pharmaceutical training."}'),

('applied', 9, 'What is the "longtermism" thesis in applied ethics?',
  '[{"text": "That the long-term future of humanity matters enormously, and we should prioritize reducing existential risks even over addressing present suffering, because the potential number of future people dwarfs the current population", "correct": true}, {"text": "That long-term investments are always better"}, {"text": "That planning ahead is good"}, {"text": "That history matters more than the future"}]',
  'William MacAskill and Toby Ord argue that if humanity could survive millions of years, the expected number of future people is astronomically large. Preventing human extinction may therefore be the most important moral priority.',
  '{"1": "Longtermism is a moral thesis about priorities, not an investment strategy.", "2": "It goes far beyond ordinary planning — it argues for radical prioritization of existential risk.", "3": "Longtermism is specifically about the future, not the past."}'),

('applied', 9, 'What is the "alignment problem" in AI safety?',
  '[{"text": "The challenge of ensuring that superintelligent AI systems pursue goals that are aligned with human values — a philosophical problem because human values are complex, contradictory, and difficult to formalize", "correct": true}, {"text": "A problem with wheel alignment"}, {"text": "Aligning text in documents"}, {"text": "A military formation problem"}]',
  'Stuart Russell and Nick Bostrom argue that a sufficiently intelligent AI pursuing even slightly misspecified goals could be catastrophic. The alignment problem is fundamentally philosophical: we must articulate human values precisely enough for a machine to follow them.',
  '{"1": "It concerns AI goal structures, not automotive mechanics.", "2": "It is about value alignment between humans and AI, not typography.", "3": "It is about AI safety, not military tactics."}'),

('applied', 10, 'What is the "experience machine" objection to hedonism and what are its limitations?',
  '[{"text": "Nozick argued our refusal to plug in shows we value reality over pleasure — but critics note this may reflect status quo bias, fear of the unknown, or irrational attachment to ''authenticity'' rather than a genuine insight about value", "correct": true}, {"text": "That experience machines are too expensive"}, {"text": "That the machines do not work"}, {"text": "That pleasure is impossible"}]',
  'Felipe De Brigard''s experiments show that when the question is reversed (would you unplug from a machine you''re already in?), people prefer to stay in — suggesting the intuition may be about familiarity, not philosophical insight about value.',
  '{"1": "The objection is philosophical, not economic.", "2": "The machine is hypothetical and works perfectly by stipulation.", "3": "The thought experiment assumes pleasure is achievable; it questions whether pleasure is sufficient for a good life."}'),

('applied', 10, 'What is the philosophical problem of "moral uncertainty"?',
  '[{"text": "When we are uncertain which moral theory is correct, how should we act? Should we maximize expected moral value across theories, follow the most demanding theory, or default to conventional morality?", "correct": true}, {"text": "Being unsure if you are a good person"}, {"text": "Not knowing the law"}, {"text": "Uncertainty about weather"}]',
  'Will MacAskill''s "Moral Uncertainty" argues that just as we manage empirical uncertainty with probability, we should manage moral uncertainty by weighing our credences in different ethical theories when making decisions.',
  '{"1": "Moral uncertainty is about which theory to follow, not personal moral assessment.", "2": "It concerns ethical theory, not legal knowledge.", "3": "It is about moral reasoning under uncertainty, not empirical uncertainty."}'),

('music', 4, 'What philosophical questions does the concept of "musical genius" raise?',
  '[{"text": "Whether exceptional creativity is innate or developed, whether genius transcends cultural context, and whether we can objectively identify greatness in art", "correct": true}, {"text": "Whether geniuses play louder"}, {"text": "Whether genius is measured by album sales"}, {"text": "Whether only classical musicians can be geniuses"}]',
  'The concept of genius (Kant, Schopenhauer, Nietzsche) raises questions about creativity, originality, and aesthetic judgment. Is Mozart''s genius an objective fact or a cultural construction? Can genius emerge in any genre?',
  '{"1": "Volume has nothing to do with philosophical genius.", "2": "Commercial success does not determine artistic greatness.", "3": "Genius can manifest in any musical tradition — jazz, folk, electronic, etc."}'),

('music', 5, 'What is the philosophical relationship between silence and music?',
  '[{"text": "Silence is not the absence of music but its necessary condition — musical meaning arises from the contrast between sound and silence, tension and resolution", "correct": true}, {"text": "Silence and music are completely unrelated"}, {"text": "Music should never include silence"}, {"text": "Silence is always better than music"}]',
  'Cage''s 4''33" demonstrated that silence is never truly silent — ambient sounds become the music. Heidegger''s concept of clearing (Lichtung) parallels this: meaning emerges from the space between things, not from the things themselves.',
  '{"1": "Silence is integral to musical structure — rests, pauses, and space are essential.", "2": "Great compositions use silence strategically for dramatic and emotional effect.", "3": "The relative value of silence and music is a philosophical question, not a settled fact."}'),

('music', 6, 'How does the concept of "authenticity" in folk and blues music connect to existentialist philosophy?',
  '[{"text": "Both value honest expression rooted in lived experience over polished artifice — the raw, personal voice is valued precisely because it represents genuine being rather than performance", "correct": true}, {"text": "Folk musicians read Sartre"}, {"text": "Existentialism is a type of music"}, {"text": "Blues has no philosophical content"}]',
  'The folk and blues traditions prize what Heidegger called "authenticity" (Eigentlichkeit) — being true to one''s own experience rather than conforming to external expectations. Robert Johnson''s crossroads myth parallels Kierkegaard''s leap of faith.',
  '{"1": "The connection is thematic, not about direct intellectual influence.", "2": "Existentialism is a philosophy that resonates with certain musical traditions.", "3": "Blues is among the most philosophically rich musical traditions."}'),

('music', 7, 'What is the philosophical significance of polyrhythm in African musical traditions?',
  '[{"text": "Polyrhythm embodies a worldview where multiple simultaneous truths coexist without contradiction — contrasting with Western music''s tendency toward a single dominant rhythm and resolution", "correct": true}, {"text": "Polyrhythm is random noise"}, {"text": "Only Western music has philosophical significance"}, {"text": "Polyrhythm is a mistake in timing"}]',
  'African polyrhythm reflects a metaphysics of multiplicity — the simultaneous coexistence of different temporal frameworks. This challenges Western binary thinking and has influenced jazz, minimalism, and contemporary philosophy of music.',
  '{"1": "Polyrhythm is highly structured and intentional, not random.", "2": "Every musical tradition carries philosophical implications.", "3": "Polyrhythm requires extraordinary precision in timing."}'),

('music', 8, 'What is Susanne Langer''s theory of music as "virtual time"?',
  '[{"text": "Music creates an experience of time that is different from clock time — a virtual temporal order that gives form to human feeling and inner life", "correct": true}, {"text": "Music travels through time"}, {"text": "Musicians are time travelers"}, {"text": "Music should be precisely timed"}]',
  'In "Feeling and Form," Langer argued that music presents a symbol of "the forms of human feeling" — not by representing emotions but by creating temporal structures (tension, release, flow) that mirror the dynamic patterns of our inner life.',
  '{"1": "''Virtual time'' means music creates its own temporal experience, not that it physically moves through time.", "2": "This is a philosophical theory about perception, not literal time travel.", "3": "It concerns the experiential quality of musical time, not metronomic accuracy."}'),

('music', 8, 'What is the philosophical debate between "formalism" and "expressionism" in music aesthetics?',
  '[{"text": "Formalism (Hanslick) says music''s beauty lies in its sonic patterns alone; expressionism says music''s value lies in expressing or evoking emotions and ideas beyond pure sound", "correct": true}, {"text": "Formalism means wearing formal attire; expressionism means being expressive"}, {"text": "They agree completely"}, {"text": "Neither is a real position"}]',
  'Eduard Hanslick argued that music is "tonally moving forms" — beautiful in itself, not as a vehicle for emotion. Romantics countered that music''s power lies precisely in its ability to express what words cannot. This debate remains unresolved.',
  '{"1": "These are aesthetic theories, not about dress codes or personality.", "2": "They are fundamentally opposed positions in philosophy of music.", "3": "Both are major positions defended by serious aestheticians."}'),

('music', 9, 'How does Adorno''s analysis of the twelve-tone technique relate to his social philosophy?',
  '[{"text": "Schoenberg''s atonality resists the commodity form by refusing easy consumption — it embodies the negative dialectic by rejecting false reconciliation in art, mirroring the unresolved contradictions of society", "correct": true}, {"text": "Adorno liked twelve-tone music because it sounds nice"}, {"text": "Twelve-tone technique has no social meaning"}, {"text": "Adorno rejected all modern music"}]',
  'For Adorno, Schoenberg''s music is ''true'' because it refuses to provide the false comfort of tonal resolution. In a world of irreconciled suffering, art that sounds harmonious lies. Only music that embodies dissonance tells the truth.',
  '{"1": "Adorno explicitly argued twelve-tone music is difficult and demanding, not conventionally pleasant.", "2": "Adorno saw all art as having social meaning and political implications.", "3": "Adorno championed Schoenberg''s modernism as the most advanced music of its time."}'),

('music', 10, 'What is the philosophical significance of the concept of "Musica Universalis" (Music of the Spheres)?',
  '[{"text": "The ancient idea that the movements of celestial bodies produce a form of music reflecting mathematical harmony — connecting aesthetics, mathematics, and cosmology in a unified vision of reality", "correct": true}, {"text": "A concert series"}, {"text": "A streaming service"}, {"text": "Background music for planetariums"}]',
  'From Pythagoras through Kepler to modern string theory, the idea that reality has a fundamentally musical-mathematical structure has persisted. It represents the deepest aspiration of philosophy: to find unity beneath apparent diversity.',
  '{"1": "Musica Universalis is an ancient philosophical concept, not a modern event.", "2": "It predates all technology by millennia.", "3": "It is a cosmological thesis, not ambient sound design."}'),

('cinema', 4, 'What philosophical themes does "Blade Runner" explore?',
  '[{"text": "What it means to be human, whether artificial beings can have consciousness and rights, and whether memories define personal identity", "correct": true}, {"text": "How to build robots"}, {"text": "The history of running shoes"}, {"text": "Police procedures"}]',
  'Ridley Scott''s film (1982) directly engages with the problem of other minds, the Turing test, and personal identity through memory. The replicants'' desire for more life raises the question: if they suffer, think, and remember, are they persons?',
  '{"1": "The film uses robots as a vehicle for philosophical questions, not as a technical manual.", "2": "''Blade Runner'' refers to the protagonist''s job, not athletics.", "3": "While it includes detective elements, its core is philosophical."}'),

('cinema', 5, 'How does "Eternal Sunshine of the Spotless Mind" engage with philosophy of memory?',
  '[{"text": "It asks whether erasing painful memories destroys part of our identity, and whether suffering is a necessary component of love and personal growth", "correct": true}, {"text": "It is about sunshine and weather"}, {"text": "It is a documentary about skincare"}, {"text": "It promotes amnesia as therapy"}]',
  'The film explores Locke''s memory theory of identity: if Joel erases his memories of Clementine, is he still the same person? And the Nietzschean question: should we affirm all of life, including suffering, as necessary for meaning?',
  '{"1": "The title is metaphorical, from Alexander Pope''s poetry.", "2": "It is a philosophical drama, not a beauty product film.", "3": "The film ultimately questions whether erasing memories is desirable."}'),

('cinema', 6, 'What is the philosophical significance of Hitchcock''s "Rear Window"?',
  '[{"text": "It explores voyeurism, the ethics of surveillance, and how we construct narratives about others from limited observation — a cinematic epistemology experiment", "correct": true}, {"text": "It is about window installation"}, {"text": "It teaches photography"}, {"text": "It is a real estate film"}]',
  'Hitchcock turns the viewer into a voyeur alongside Jeff, raising questions about the ethics of watching, the reliability of perception, and how we project meaning onto the fragments of others'' lives we observe.',
  '{"1": "The ''window'' is a metaphor for cinema itself and the act of watching.", "2": "While photography features in the plot, the film''s themes are epistemological.", "3": "The setting is a vehicle for philosophical themes, not a real estate showcase."}'),

('cinema', 6, 'How does "Groundhog Day" function as a philosophical allegory?',
  '[{"text": "Phil''s time loop mirrors Nietzsche''s eternal recurrence — he must learn to affirm life and find meaning through self-improvement and genuine connection rather than hedonism or nihilism", "correct": true}, {"text": "It is about weather forecasting"}, {"text": "It is a documentary about groundhogs"}, {"text": "It has no deeper meaning"}]',
  'The film traces Phil from hedonism (exploiting the loop for pleasure) through nihilism (suicide attempts) to genuine virtue (using each day to become better and help others). It dramatizes Kierkegaard''s stages of existence.',
  '{"1": "Weather forecasting is the surface plot; the philosophical journey is the substance.", "2": "The groundhog is a plot device, not the subject.", "3": "It has been analyzed by philosophers, theologians, and Buddhist scholars as a profound allegory."}'),

('cinema', 7, 'What is the philosophical significance of "slow cinema" (Tarkovsky, Béla Tarr, Tsai Ming-liang)?',
  '[{"text": "By forcing viewers to experience duration and boredom, slow cinema challenges consumerist attention spans and creates space for contemplation about time, existence, and meaning", "correct": true}, {"text": "The directors forgot to edit"}, {"text": "The cameras were broken"}, {"text": "Slow cinema is just bad filmmaking"}]',
  'Slow cinema resists the capitalist demand for constant stimulation. Like Heidegger''s concept of Gelassenheit (releasement), it asks viewers to let go of the desire for action and sit with the experience of being in time.',
  '{"1": "Long takes are deliberate artistic and philosophical choices.", "2": "The pacing is intentional and requires sophisticated cinematography.", "3": "Slow cinema is a respected international movement with serious philosophical foundations."}'),

('cinema', 8, 'What is the "male gaze" theory in feminist film philosophy?',
  '[{"text": "Laura Mulvey argued that mainstream cinema positions the viewer as a heterosexual male subject, objectifying women through camera work, narrative structure, and visual pleasure", "correct": true}, {"text": "That men watch more movies"}, {"text": "A theory about eye health"}, {"text": "That only men can be cinematographers"}]',
  'Mulvey''s "Visual Pleasure and Narrative Cinema" (1975) used psychoanalytic theory to show how cinema''s visual structures encode patriarchal power relations. This influenced decades of feminist film theory and practice.',
  '{"1": "The theory concerns how cinema constructs the viewing subject, not viewing frequency.", "2": "It is about the politics of representation, not ophthalmology.", "3": "It critiques institutional structures, not individual capabilities."}'),

('cinema', 9, 'What is Gilles Deleuze''s distinction between the "movement-image" and the "time-image"?',
  '[{"text": "Classical cinema uses movement-images (action-driven, causal narrative); postwar cinema introduced time-images (direct presentations of time through contemplative, non-linear structures)", "correct": true}, {"text": "Moving pictures vs. still photographs"}, {"text": "Fast films vs. slow films"}, {"text": "Color films vs. black and white"}]',
  'In "Cinema 1" and "Cinema 2," Deleuze argued that WWII shattered the action-oriented worldview of classical cinema. Italian neorealism and the French New Wave responded with images that present time directly, rather than subordinating it to action.',
  '{"1": "Both are types of cinematic image, not the difference between motion and stillness.", "2": "The distinction is conceptual, not about pacing alone.", "3": "It concerns the structure of cinematic thought, not technical format."}'),

('cinema', 10, 'What is the philosophical relationship between cinema and dreaming?',
  '[{"text": "Both involve immersive visual narratives experienced passively in darkness; cinema functions as a collective dream that reveals unconscious desires, fears, and cultural mythologies", "correct": true}, {"text": "Watching films causes sleepiness"}, {"text": "Dreams are always about films"}, {"text": "Cinema replaced dreaming"}]',
  'From Münsterberg through Metz to Žižek, philosophers have analyzed cinema as a dream-machine. Projection in darkness, passive reception, identification with characters, and the suspension of disbelief mirror the structure of dreaming.',
  '{"1": "The comparison is structural and psychological, not about drowsiness.", "2": "Dreams have their own independent content; the comparison is about experiential structure.", "3": "Cinema and dreaming coexist; one did not replace the other."}'),

('quotes', 4, 'Who said: "The mind is everything. What you think you become"?',
  '[{"text": "Buddha", "correct": true}, {"text": "Socrates"}, {"text": "Confucius"}, {"text": "Lao Tzu"}]',
  'This teaching from the Dhammapada reflects Buddhism''s emphasis on the mind as the source of all experience. It parallels the Stoic insight that our judgments, not external events, determine our well-being.',
  '{"1": "Socrates valued self-examination but this specific teaching is Buddhist.", "2": "Confucius focused on social relations and ritual, not this psychological insight.", "3": "Lao Tzu emphasized naturalness and non-action, a different emphasis from this quote."}'),

('quotes', 5, 'Who wrote: "The measure of a man is what he does with power"?',
  '[{"text": "Plato", "correct": true}, {"text": "Aristotle"}, {"text": "Thucydides"}, {"text": "Pericles"}]',
  'Plato explored this theme throughout "The Republic" and the "Allegory of the Ring of Gyges" — would a just man remain just if he could act with impunity? Power reveals character because it removes external constraints.',
  '{"1": "Aristotle discussed virtue but this formulation about power is attributed to Plato.", "2": "Thucydides was a historian who recorded similar insights but this is Plato''s.", "3": "Pericles was a statesman; this philosophical observation comes from Plato."}'),

('quotes', 6, 'Who wrote: "In the depth of winter, I finally learned that within me there lay an invincible summer"?',
  '[{"text": "Albert Camus", "correct": true}, {"text": "Jean-Paul Sartre"}, {"text": "Simone de Beauvoir"}, {"text": "André Gide"}]',
  'Camus wrote this in "Return to Tipasa" (1954). It captures his philosophy of absurdist affirmation — even in the face of a meaningless universe, the human spirit contains an unconquerable capacity for joy and meaning-creation.',
  '{"1": "Sartre''s existentialism was more austere; Camus''s absurdism retained this lyrical affirmation.", "2": "Beauvoir wrote about freedom and oppression but this quote is Camus''s.", "3": "Gide influenced Camus but this specific passage is from Camus''s essay."}'),

('quotes', 7, 'Who wrote: "Whereof one cannot speak, thereof one must be silent"?',
  '[{"text": "Ludwig Wittgenstein", "correct": true}, {"text": "Bertrand Russell"}, {"text": "G.E. Moore"}, {"text": "Karl Popper"}]',
  'The final proposition of Wittgenstein''s "Tractatus Logico-Philosophicus" (1921). It draws the boundary of meaningful language at the limits of what can be logically pictured, consigning ethics, aesthetics, and metaphysics to silence.',
  '{"1": "Russell was Wittgenstein''s teacher but this line is Wittgenstein''s.", "2": "Moore influenced early analytic philosophy but did not write this.", "3": "Popper was a philosopher of science with different concerns."}'),

('quotes', 7, 'Who wrote: "The absurd is born of the confrontation between the human need for meaning and the unreasonable silence of the world"?',
  '[{"text": "Albert Camus", "correct": true}, {"text": "Franz Kafka"}, {"text": "Samuel Beckett"}, {"text": "Søren Kierkegaard"}]',
  'Camus defined the absurd in "The Myth of Sisyphus" (1942) as the gap between our desire for meaning and the universe''s refusal to provide it. His response: revolt, freedom, and passion — not suicide or religious hope.',
  '{"1": "Kafka depicted absurdity in fiction but Camus formulated this philosophical definition.", "2": "Beckett dramatized meaninglessness but did not articulate this specific formulation.", "3": "Kierkegaard dealt with absurdity through the ''leap of faith''; Camus rejected that solution."}'),

('quotes', 8, 'Who wrote: "The most thought-provoking thing in our thought-provoking time is that we are still not thinking"?',
  '[{"text": "Martin Heidegger", "correct": true}, {"text": "Edmund Husserl"}, {"text": "Hannah Arendt"}, {"text": "Hans-Georg Gadamer"}]',
  'Heidegger opened "What Is Called Thinking?" (1951-52) with this provocation. He meant that modern technological society calculates and computes but does not truly think — does not question the meaning of Being.',
  '{"1": "Husserl was Heidegger''s teacher but this quote is from Heidegger''s later work.", "2": "Arendt studied under Heidegger and valued thinking, but this specific formulation is his.", "3": "Gadamer developed hermeneutics but this quote is Heidegger''s."}'),

('quotes', 8, 'Who wrote: "Freedom is what we do with what is done to us"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Viktor Frankl"}, {"text": "Simone Weil"}]',
  'Sartre''s existentialism insists that even in the most constrained circumstances, we remain free to choose our attitude and response. This echoes Stoic philosophy and anticipates Frankl''s similar insight from the concentration camps.',
  '{"1": "Camus explored freedom through absurdity but this specific formulation is Sartre''s.", "2": "Frankl''s ''Man''s Search for Meaning'' expresses a similar idea but this quote is Sartre''s.", "3": "Weil wrote about affliction and grace but this phrasing is Sartre''s."}'),

('quotes', 9, 'Who wrote: "Not how the world is, is the mystical, but that it is"?',
  '[{"text": "Ludwig Wittgenstein", "correct": true}, {"text": "Martin Heidegger"}, {"text": "Rudolf Carnap"}, {"text": "Alfred North Whitehead"}]',
  'From the "Tractatus" (proposition 6.44). Wittgenstein distinguishes scientific questions (how the world works) from the mystical (that there is a world at all). This resonates with Heidegger''s fundamental question: "Why is there something rather than nothing?"',
  '{"1": "Heidegger asked a similar question but this specific proposition is Wittgenstein''s.", "2": "Carnap rejected mysticism; Wittgenstein preserved a space for it.", "3": "Whitehead developed process philosophy but this quote is from the Tractatus."}'),

('quotes', 10, 'Who wrote: "What is rational is actual; what is actual is rational"?',
  '[{"text": "G.W.F. Hegel", "correct": true}, {"text": "Immanuel Kant"}, {"text": "Friedrich Schelling"}, {"text": "Johann Fichte"}]',
  'Hegel wrote this in the preface to "Philosophy of Right" (1820). It does not mean everything that exists is good — it means that reason is at work in the actual development of history, and that the rational will ultimately manifest in reality.',
  '{"1": "Kant separated the rational from the actual more sharply; this synthesis is distinctly Hegelian.", "2": "Schelling moved toward nature-philosophy rather than this rational-actual identity.", "3": "Fichte emphasized the ego''s activity rather than the rationality of actuality."}'),

('american_exceptionalism', 4, 'What is the philosophical significance of the Emancipation Proclamation?',
  '[{"text": "It applied the Declaration''s principle that all men are created equal to its logical conclusion — extending natural rights to enslaved people and forcing the nation to confront its own founding philosophy", "correct": true}, {"text": "It was only about economics"}, {"text": "It had no philosophical basis"}, {"text": "It was universally popular"}]',
  'Lincoln''s Emancipation Proclamation (1863) was not just a war measure — it was a philosophical act that forced America to either abandon or fulfill its founding ideals. It made the Civil War explicitly about human freedom.',
  '{"1": "While it had economic implications, its philosophical basis was natural rights.", "2": "It drew directly from the philosophical principles of the Declaration of Independence.", "3": "It was deeply controversial and opposed by many, even in the North."}'),

('american_exceptionalism', 5, 'How does the concept of "American pragmatism" differ from European philosophy?',
  '[{"text": "Pragmatism (Peirce, James, Dewey) judges ideas by their practical consequences rather than abstract truth — reflecting America''s practical, experimental culture", "correct": true}, {"text": "Americans don''t have philosophy"}, {"text": "Pragmatism means being practical about money"}, {"text": "European and American philosophy are identical"}]',
  'American pragmatism was the first major philosophical movement to originate in the United States. It rejected European rationalism''s quest for absolute certainty in favor of fallibilism, experimentalism, and democratic inquiry.',
  '{"1": "America produced one of the most influential philosophical movements of the modern era.", "2": "Pragmatism is about the practical consequences of IDEAS, not financial practicality.", "3": "They have distinct traditions, methods, and concerns."}'),

('american_exceptionalism', 6, 'How does the Second Amendment reflect philosophical debates about the relationship between citizens and the state?',
  '[{"text": "It embodies the Lockean principle that citizens retain the natural right to self-defense, including against government tyranny — the state does not have a monopoly on legitimate force", "correct": true}, {"text": "It has no philosophical basis"}, {"text": "It was about hunting"}, {"text": "It only applies to the military"}]',
  'The founders, having just fought a revolution against a government that tried to disarm them, enshrined the right to bear arms as a philosophical check on state power. It reflects the social contract theory that government serves the people, not the reverse.',
  '{"1": "It is grounded in Enlightenment political philosophy about natural rights.", "2": "While hunting was common, the philosophical purpose was protection against tyranny.", "3": "The Supreme Court has affirmed it as an individual right, not solely a collective military one."}'),

('american_exceptionalism', 7, 'What is the philosophical tension between Hamilton''s and Jefferson''s visions of America?',
  '[{"text": "Hamilton favored a strong central government, national bank, and industrial economy; Jefferson favored agrarian democracy, states'' rights, and minimal government — a tension between order and liberty that defines American politics", "correct": true}, {"text": "They agreed on everything"}, {"text": "Only Hamilton had a philosophy"}, {"text": "The disagreement was personal, not philosophical"}]',
  'This founding tension reflects deeper philosophical questions: Is concentrated power necessary for national strength (Hamilton), or is dispersed power necessary for individual freedom (Jefferson)? America has oscillated between these poles ever since.',
  '{"1": "Their disagreements were among the most consequential in American history.", "2": "Both were profound political thinkers with distinct philosophical frameworks.", "3": "Their personal rivalry was driven by genuinely different philosophical visions."}'),

('american_exceptionalism', 8, 'How does Tocqueville''s analysis of "self-interest rightly understood" relate to American civil society?',
  '[{"text": "Americans solve the tension between self-interest and community by understanding that helping others ultimately serves their own long-term interests — creating voluntary associations that maintain social order without government coercion", "correct": true}, {"text": "Americans are purely selfish"}, {"text": "Tocqueville criticized all self-interest"}, {"text": "Civil society has no philosophical basis"}]',
  'Tocqueville observed that Americans'' practical genius was recognizing that cooperation serves individual interests. This "self-interest rightly understood" produces voluntary associations (churches, clubs, charities) that maintain social bonds without state direction.',
  '{"1": "Tocqueville observed Americans balancing self-interest with voluntary community engagement.", "2": "Tocqueville distinguished enlightened self-interest from narrow selfishness.", "3": "Civil society theory is a rich philosophical tradition from Ferguson through Tocqueville to Putnam."}'),

('american_exceptionalism', 9, 'What is the philosophical significance of Martin Luther King Jr.''s concept of "creative tension"?',
  '[{"text": "Nonviolent direct action creates a crisis that forces a community to confront its contradictions — applying Hegelian dialectics to the struggle for justice by making hidden injustice visible and unavoidable", "correct": true}, {"text": "King wanted to create conflict for its own sake"}, {"text": "Creative tension is an art technique"}, {"text": "King rejected all philosophical frameworks"}]',
  'In "Letter from Birmingham Jail," King explicitly invoked Socrates''s gadfly role and the theological concept of creative tension. He argued that just as Socrates provoked Athenians to think, nonviolent protest provokes communities to act justly.',
  '{"1": "King''s nonviolence was strategic and philosophical, aimed at justice, not conflict for its own sake.", "2": "It is a philosophical-political concept, not an artistic one.", "3": "King was deeply versed in philosophy — Hegel, Thoreau, Gandhi, Tillich, Niebuhr."}'),

('american_exceptionalism', 10, 'How does the American constitutional concept of "enumerated powers" embody a specific philosophical anthropology?',
  '[{"text": "It assumes that human nature tends toward the abuse of power, so government authority must be explicitly limited to only those powers specifically granted — all other powers remain with the people", "correct": true}, {"text": "It means the government can do anything"}, {"text": "It is a mathematical concept"}, {"text": "It only applies to counting votes"}]',
  'The Tenth Amendment reserves all non-enumerated powers to the states or the people. This reflects the founders'' Calvinist-influenced skepticism about human nature and their Lockean commitment to government by consent within strict limits.',
  '{"1": "Enumerated powers LIMIT government to specific grants of authority.", "2": "It is a constitutional principle, not a mathematical one.", "3": "''Enumerated'' means listed/specified, referring to governmental powers, not vote counting."}');
