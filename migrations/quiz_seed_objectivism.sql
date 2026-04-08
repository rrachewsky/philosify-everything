-- ============================================================
-- QUIZ: Objectivism seed questions
-- The Fountainhead, Atlas Shrugged, Bob Rach's songs,
-- "O Grego, O Frade e a Heroína", and Objectivist philosophy
-- Tagged with region = 'objectivism' for the mandatory Objectivism slot
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, correct_answer, explanation, wrong_explanations, region) VALUES

-- ============================================================
-- THE FOUNTAINHEAD (1943)
-- ============================================================

('aesthetics', 2, 'In Ayn Rand''s "The Fountainhead," what is Howard Roark''s profession?',
  '[{"text": "Architect", "correct": true}, {"text": "Journalist"}, {"text": "Lawyer"}, {"text": "Sculptor"}]',
  '0',
  'Howard Roark is an architect who refuses to compromise his artistic vision. The novel uses architecture as a metaphor for creative integrity — Roark designs buildings as expressions of rational purpose, never borrowing from tradition or pandering to public taste.',
  '{"1": "Dominique Francon writes for a newspaper, and Ellsworth Toohey is a journalist/critic — but Roark is the architect.", "2": "Roark''s trial is a key scene, but he is the defendant, not a lawyer.", "3": "Roark works with physical structures but as an architect, not a sculptor."}',
  'objectivism'),

('ethics', 3, 'In "The Fountainhead," Ellsworth Toohey represents which philosophical archetype?',
  '[{"text": "The second-hander who manipulates through altruism", "correct": true}, {"text": "The heroic individualist"}, {"text": "The honest skeptic"}, {"text": "The pragmatic businessman"}]',
  '0',
  'Ellsworth Toohey is the novel''s intellectual villain — a collectivist who uses the language of altruism and selflessness to destroy individual achievement and consolidate power. He tells Peter Keating: "Don''t set out to raze all shrines — you''ll frighten men. Enshrine mediocrity — and the shrines are razed."',
  '{"1": "Howard Roark is the heroic individualist — Toohey is his ideological opposite.", "2": "Toohey is not a skeptic; he has a deliberate agenda to destroy the exceptional.", "3": "Gail Wynand is closer to the pragmatic businessman archetype, not Toohey."}',
  'objectivism'),

('ethics', 4, 'What is the central moral conflict in "The Fountainhead"?',
  '[{"text": "Individualism vs. collectivism — the creator vs. the second-hander", "correct": true}, {"text": "Capitalism vs. socialism"}, {"text": "Religion vs. atheism"}, {"text": "Democracy vs. dictatorship"}]',
  '0',
  'The Fountainhead''s theme is individualism versus collectivism at the most personal level — the independent mind (Roark) versus those who live through others'' opinions (Keating, Toohey). Rand called it a novel about "the ideal man" and the principle that man''s ego is the fountainhead of human progress.',
  '{"1": "While Rand was pro-capitalist, The Fountainhead''s focus is personal independence, not economic systems.", "2": "Religion appears tangentially but is not the central conflict.", "3": "The novel deals with individual psychology and ethics, not political systems."}',
  'objectivism'),

('quotes', 3, 'Who says "I came here to say that I do not recognize anyone''s right to one minute of my life" in "The Fountainhead"?',
  '[{"text": "Howard Roark", "correct": true}, {"text": "Gail Wynand"}, {"text": "Dominique Francon"}, {"text": "Ellsworth Toohey"}]',
  '0',
  'Howard Roark delivers this line during his courtroom speech at the Cortlandt trial. He argues that no collective need — however urgent — justifies enslaving a creator. The speech is the philosophical climax of the novel, asserting that the right to one''s own life is absolute.',
  '{"1": "Wynand admires Roark but cannot live by these principles himself — he compromises with the mob through his newspaper empire.", "2": "Dominique understands Roark''s principles but initially believes the world will destroy anyone who lives by them.", "3": "Toohey would never say this — his entire philosophy depends on denying individual sovereignty."}',
  'objectivism'),

('aesthetics', 5, 'In "The Fountainhead," what does the Cortlandt housing project symbolize?',
  '[{"text": "The destruction of a creator''s work when collectivism claims ownership of his mind", "correct": true}, {"text": "The triumph of public housing policy"}, {"text": "The failure of modern architecture"}, {"text": "The corruption of government contracts"}]',
  '0',
  'Roark designs Cortlandt as low-cost housing on the condition that his design is built exactly as conceived. When others alter it beyond recognition, he dynamites it — asserting that a creator''s right to his work is inviolable. The project symbolizes what happens when society claims the products of a man''s mind while denying him credit or control.',
  '{"1": "The novel does not endorse public housing — it shows how the collective corrupts even good intentions.", "2": "The architecture itself was brilliant; the problem was collective appropriation.", "3": "Government corruption is secondary — the deeper issue is the moral principle of intellectual property."}',
  'objectivism'),

('applied', 4, 'Peter Keating in "The Fountainhead" succeeds initially by doing what?',
  '[{"text": "Living through others'' approval — copying, flattering, and conforming", "correct": true}, {"text": "Working harder than anyone else"}, {"text": "Innovating with bold architectural designs"}, {"text": "Inheriting his father''s firm"}]',
  '0',
  'Keating is the quintessential "second-hander" — he achieves conventional success by copying trends, flattering the right people, and doing what others expect. But his success is hollow because none of it comes from his own judgment. Rand uses Keating to show that social approval without self-earned achievement leads to spiritual emptiness.',
  '{"1": "Keating does not work particularly hard — he takes shortcuts and relies on others (including Roark) to do his real work.", "2": "Keating never innovates; he copies whatever style is fashionable.", "3": "Keating joins an existing firm (Francon & Heyer) through connections, not inheritance."}',
  'objectivism'),

-- ============================================================
-- ATLAS SHRUGGED (1957)
-- ============================================================

('quotes', 1, 'Which Ayn Rand novel opens with the question "Who is John Galt?"',
  '[{"text": "Atlas Shrugged", "correct": true}, {"text": "The Fountainhead"}, {"text": "We the Living"}, {"text": "Anthem"}]',
  '0',
  '"Who is John Galt?" is the famous opening line of Atlas Shrugged (1957). It begins as a slang expression of despair in a collapsing world, but by the novel''s end, the question is answered: John Galt is the man who stopped the motor of the world by convincing the producers to go on strike.',
  '{"1": "The Fountainhead (1943) is about Howard Roark, not John Galt.", "2": "We the Living (1936) is set in Soviet Russia and has no character named Galt.", "3": "Anthem (1938) is a dystopian novella about a collectivist society with no Galt character."}',
  'objectivism'),

('ethics', 3, 'In Atlas Shrugged, what does Francisco d''Anconia''s "money speech" argue?',
  '[{"text": "Money is the tool of free exchange among productive people — not the root of evil", "correct": true}, {"text": "Money corrupts all who possess it"}, {"text": "Gold should replace paper currency"}, {"text": "The rich have a duty to redistribute wealth"}]',
  '0',
  'Francisco''s money speech at Jim Taggart''s wedding is one of the novel''s key philosophical passages. He argues that money is "the material shape of the principle that men who wish to deal with one another must deal by trade and give value for value." Money is only evil when obtained by force or fraud — when earned through production, it represents the best in human achievement.',
  '{"1": "This is exactly the position Francisco refutes — the saying ''money is the root of all evil'' mistakes the tool for the wielder.", "2": "The speech is about the moral meaning of money, not monetary policy.", "3": "Francisco explicitly rejects the idea that producers owe anything to non-producers."}',
  'objectivism'),

('politics', 4, 'What is the "strike" in Atlas Shrugged?',
  '[{"text": "The producers and creators withdraw from a society that exploits them", "correct": true}, {"text": "A labor union walkout at Taggart Transcontinental"}, {"text": "A government shutdown of private industry"}, {"text": "A consumer boycott of Rearden Metal"}]',
  '0',
  'John Galt organizes a strike of the mind — the world''s most productive thinkers, inventors, and entrepreneurs withdraw from society, refusing to be sacrificed to those who condemn and exploit them. Galt''s strike demonstrates that the "motor of the world" is not muscle but mind, and that civilization collapses when its creators are driven away.',
  '{"1": "This is an inversion — Atlas Shrugged shows that the real power lies with the creators, not the laborers organized by unions.", "2": "The government tries to control industry but the strike is voluntary withdrawal by the producers.", "3": "Rearden Metal is celebrated by its users; the opposition comes from competitors and regulators, not consumers."}',
  'objectivism'),

('epistemology', 5, 'John Galt''s radio speech in Atlas Shrugged begins with which philosophical axiom?',
  '[{"text": "Existence exists — and the act of grasping that statement implies two corollary axioms: that something exists which one perceives and that one exists possessing consciousness", "correct": true}, {"text": "I think, therefore I am"}, {"text": "The greatest good for the greatest number"}, {"text": "From each according to his ability, to each according to his needs"}]',
  '0',
  'Galt''s speech establishes the foundation of Objectivist epistemology: existence exists (the axiom of existence), consciousness is conscious of something (the axiom of consciousness), and A is A (the law of identity). These axioms are self-evident — any attempt to deny them requires using them.',
  '{"1": "Descartes'' ''Cogito'' starts from doubt; Galt starts from existence as a self-evident given — a fundamentally different approach.", "2": "Utilitarianism (Bentham/Mill) is precisely the ethics Galt''s speech refutes.", "3": "This is Marx''s formula — the opposite of Galt''s principle that each man exists for his own sake."}',
  'objectivism'),

('ethics', 3, 'In Atlas Shrugged, Hank Rearden is put on trial for what?',
  '[{"text": "Selling his metal to whomever he chooses, defying government allocation orders", "correct": true}, {"text": "Tax evasion"}, {"text": "Environmental pollution"}, {"text": "Monopolistic practices"}]',
  '0',
  'Rearden is tried under the "Equalization of Opportunity Bill" for selling Rearden Metal in quantities he chooses to buyers he selects. His trial speech mirrors Roark''s in The Fountainhead — he refuses to accept the premise that his productive ability creates an obligation to serve others. He declares he will not apologize for being good at what he does.',
  '{"1": "The trial is about the right to dispose of one''s own product, not taxes.", "2": "Environmental concerns play no role — the charge is about defying allocation controls.", "3": "Rearden is not accused of monopoly but of refusing to submit his production to government control."}',
  'objectivism'),

('aesthetics', 4, 'What does the image of Atlas holding the world on his shoulders represent in Ayn Rand''s philosophy?',
  '[{"text": "The productive individual who carries civilization — and who should shrug off the burden when exploited", "correct": true}, {"text": "The weight of religious guilt"}, {"text": "The importance of physical strength"}, {"text": "The duty of the strong to serve the weak"}]',
  '0',
  'When Francisco asks Rearden what advice he would give Atlas if he saw him struggling under the weight of the world, Rearden answers: "To shrug." The novel argues that the great producers are the Atlases of civilization — and that their moral right is to refuse the role of sacrificial animals carrying a world that condemns them.',
  '{"1": "Religion is not the primary target — the metaphor is about any system that demands sacrifice of the able to the unable.", "2": "The point is intellectual and moral strength, not physical.", "3": "This is exactly what Rand rejects — the idea that ability creates a duty to serve others is the morality Atlas Shrugged opposes."}',
  'objectivism'),

('quotes', 2, 'In Atlas Shrugged, what oath do the strikers take when they join Galt''s Gulch?',
  '[{"text": "I swear by my life and my love of it that I will never live for the sake of another man, nor ask another man to live for mine", "correct": true}, {"text": "I pledge allegiance to reason and individual rights"}, {"text": "I promise to produce only for those who deserve it"}, {"text": "I vow to destroy the system that enslaves the productive"}]',
  '0',
  'This oath is the moral core of Atlas Shrugged and of Objectivist ethics. It rejects both self-sacrifice (living for others) and the exploitation of others (asking others to live for you). It establishes the trader principle: free people deal with each other by voluntary exchange of value for value.',
  '{"1": "While consistent with Objectivism, this is not the oath used in the novel.", "2": "The oath is about all human relationships, not just production/trade.", "3": "The strikers'' goal is not destruction but withdrawal — they build a new society in the Gulch rather than tearing down the old one."}',
  'objectivism'),

('applied', 5, 'What is Directive 10-289 in Atlas Shrugged?',
  '[{"text": "A government order freezing all economic activity — workers cannot quit, businesses cannot close, patents are nationalized", "correct": true}, {"text": "A secret code used by the strikers to communicate"}, {"text": "The founding charter of Galt''s Gulch"}, {"text": "A military order to arrest John Galt"}]',
  '0',
  'Directive 10-289 is the novel''s most chilling moment of government overreach — it freezes the entire economy in place, forbidding anyone from quitting their job, closing a business, or introducing new inventions. All patents and copyrights are signed over to the state. Rand wrote it as the logical endpoint of collectivism: total control over the human mind.',
  '{"1": "The strikers communicate through personal contact, not codes.", "2": "Galt''s Gulch has no formal charter — it operates on voluntary agreement.", "3": "Galt''s arrest comes later in the novel under different circumstances."}',
  'objectivism'),

-- ============================================================
-- BOB RACH'S SONGS & "O GREGO, O FRADE E A HEROÍNA"
-- ============================================================

('music', 3, 'Bob Rach''s song "Heroine" celebrates which philosophical archetype?',
  '[{"text": "The Randian heroine: a woman of reason, independence, and productive achievement", "correct": true}, {"text": "A tragic figure who sacrifices herself for others"}, {"text": "A revolutionary fighting against capitalism"}, {"text": "A mystic seeking spiritual enlightenment"}]',
  '0',
  '"Heroine" celebrates the rational woman who lives by her own judgment — the Objectivist ideal of a person whose heroism lies not in sacrifice but in the courage to think independently, create value, and pursue happiness as a moral right. This echoes Rand''s heroines like Dagny Taggart.',
  '{"1": "Self-sacrifice is the opposite of the Objectivist heroine — Rand''s heroes live for their own values, not as martyrs.", "2": "The song celebrates individual achievement, not anti-capitalist revolution.", "3": "Mysticism is rejected in Objectivism; the heroine acts by reason, not faith."}',
  'objectivism'),

('music', 3, 'Bob Rach''s song "My Life is Mine" echoes which principle from The Fountainhead?',
  '[{"text": "Howard Roark''s declaration that no one has a right to one minute of his life", "correct": true}, {"text": "Ellsworth Toohey''s argument for serving the collective"}, {"text": "Peter Keating''s pursuit of social approval"}, {"text": "Gail Wynand''s belief in power through media"}]',
  '0',
  '"My Life is Mine" is an anthem of individual sovereignty and self-ownership, directly echoing Roark''s courtroom speech: "I came here to say that I do not recognize anyone''s right to one minute of my life." The song affirms that your life belongs to you — not to society, the state, or the collective.',
  '{"1": "Toohey''s argument is the opposite — he demands that individuals serve the collective.", "2": "Keating lives for others'' approval, which is precisely what the song rejects.", "3": "Wynand seeks power over others; the song is about sovereignty over one''s own life."}',
  'objectivism'),

('epistemology', 4, 'Bob Rach''s song "Blank Slate" challenges the idea that humans are born as a tabula rasa. Which philosopher originally proposed the blank slate concept?',
  '[{"text": "John Locke", "correct": true}, {"text": "Aristotle"}, {"text": "Ayn Rand"}, {"text": "Friedrich Nietzsche"}]',
  '0',
  'John Locke proposed that the mind at birth is a "tabula rasa" (blank slate) with no innate ideas, and that all knowledge comes from experience. Bob Rach''s "Blank Slate" challenges this by arguing that humans have a specific nature — volitional and rational — aligning with both Steven Pinker''s scientific critique and Rand''s view that man has an identity (A is A).',
  '{"1": "Aristotle believed in natural capacities and potentials, not a completely blank slate.", "2": "Rand rejected the blank slate — she argued man has a specific nature requiring reason to survive.", "3": "Nietzsche was concerned with will to power and revaluation of values, not tabula rasa."}',
  'objectivism'),

('epistemology', 4, 'In "O Grego, O Frade e a Heroína," what is the fundamental distinction between animals and humans?',
  '[{"text": "Animals operate by instinct (automatic); humans operate by reason (volitional)", "correct": true}, {"text": "Animals are stronger; humans are smarter"}, {"text": "Animals live in nature; humans live in civilization"}, {"text": "Animals are selfish; humans are altruistic"}]',
  '0',
  'The book argues that applying the word "instinct" to humans is a philosophical error. Animals act by automatic, deterministic instinct — they do not choose. Humans act by reason, which is volitional — they must choose to think. This distinction is the foundation of human rights: because man must use reason to survive, he must be free to exercise it.',
  '{"1": "The distinction is not about degree (smarter/stronger) but about kind — instinct vs. reason are fundamentally different.", "2": "Living in civilization is a consequence of reason, not the fundamental distinction.", "3": "The book rejects this framing — virtuous self-interest is rational, and altruism as self-sacrifice is not inherently human."}',
  'objectivism'),

('applied', 3, 'In "O Grego, O Frade e a Heroína," who does "The Greek" represent?',
  '[{"text": "Aristotle and the rational philosophical tradition", "correct": true}, {"text": "Plato and the world of Forms"}, {"text": "Diogenes and the Cynic rejection of society"}, {"text": "Socrates and the Socratic method"}]',
  '0',
  '"The Greek" represents Aristotle — the philosopher who established logic, identified the law of identity (A is A), and grounded knowledge in reality. He represents the rational tradition that Objectivism builds upon: reason as man''s fundamental tool of survival, reality as objective, and human flourishing as the purpose of ethics.',
  '{"1": "Plato''s world of Forms posits a reality beyond the senses — the opposite of the Aristotelian empirical tradition the book champions.", "2": "Diogenes rejected material civilization; the book celebrates productive achievement.", "3": "While Socrates was important, the book specifically identifies Aristotle as the representative of reason."}',
  'objectivism'),

-- ============================================================
-- GENERAL OBJECTIVIST PHILOSOPHY
-- ============================================================

('ethics', 2, 'In Objectivism, what does "sacrifice" mean?',
  '[{"text": "Giving up a greater value for a lesser value", "correct": true}, {"text": "Any act of generosity"}, {"text": "Helping others in need"}, {"text": "Giving up something you don''t want"}]',
  '0',
  'Rand defined sacrifice precisely: it is the surrender of a greater value for the sake of a lesser value or a non-value. Helping a friend you love is not sacrifice — you are acting for a value. But destroying your career to please someone who doesn''t matter to you is sacrifice. The distinction is crucial: not all giving is sacrifice.',
  '{"1": "Generosity toward genuine values (friends, loved ones) is not sacrifice in Objectivism — it is acting for your values.", "2": "Helping others you value is rational and selfish in the Objectivist sense — it serves your values.", "3": "Giving up something you don''t want involves no loss of value and is therefore not sacrifice."}',
  'objectivism'),

('ethics', 3, 'What is the difference between a hero and a martyr in Objectivist philosophy?',
  '[{"text": "A hero acts by reason to achieve values; a martyr acts by faith and embraces suffering as virtue", "correct": true}, {"text": "A hero is brave; a martyr is cowardly"}, {"text": "A hero fights in war; a martyr dies for religion"}, {"text": "There is no meaningful difference"}]',
  '0',
  'In Objectivism, the hero-martyr distinction is essential. A hero is someone who uses reason to pursue and achieve values — life, happiness, productive work. A martyr treats suffering as proof of virtue and sacrifice as the highest moral act. The hero says "my life is worth living"; the martyr says "my death proves my worth."',
  '{"1": "Bravery vs. cowardice misses the point — a martyr can be physically brave while being philosophically wrong about the purpose of life.", "2": "The distinction is philosophical, not about specific contexts like war or religion.", "3": "Objectivism considers this one of the most important distinctions in ethics."}',
  'objectivism'),

('epistemology', 2, 'What is the Objectivist axiom "A is A" also known as?',
  '[{"text": "The Law of Identity", "correct": true}, {"text": "The Law of Excluded Middle"}, {"text": "The Categorical Imperative"}, {"text": "The Uncertainty Principle"}]',
  '0',
  '"A is A" is the Law of Identity, first formulated by Aristotle: a thing is what it is, independent of anyone''s wishes, feelings, or beliefs. Rand made this axiom the cornerstone of Objectivism — existence exists, things have specific natures, and reality is not subject to human consciousness. It is the foundation of all rational thought.',
  '{"1": "The Law of Excluded Middle (a statement is either true or false) is a different logical law, though related.", "2": "The Categorical Imperative is Kant''s moral formula — unrelated to the law of identity.", "3": "The Uncertainty Principle is from quantum physics (Heisenberg) — not a philosophical axiom."}',
  'objectivism');
