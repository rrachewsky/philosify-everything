-- ============================================================
-- PHILOSIFY QUIZ - Seed Batch 4 (280 more questions)
-- Continues filling pool toward 500+
-- ============================================================

-- ============================================================
-- DIFFICULTY 1-2 — More easy questions for new players
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 1, 'What does the word "philosophy" literally mean?',
  '[{"text": "Love of wisdom", "correct": true}, {"text": "Study of numbers"}, {"text": "Fear of the unknown"}, {"text": "Art of persuasion"}]',
  'The word "philosophy" comes from the Greek "philos" (love) and "sophia" (wisdom). Pythagoras is said to have coined the term, calling himself a "lover of wisdom" rather than claiming to possess it.',
  '{"1": "Study of numbers is mathematics.", "2": "Fear of the unknown is not a philosophical term.", "3": "Art of persuasion is rhetoric."}'),

('epistemology', 1, 'What is the difference between knowledge and belief?',
  '[{"text": "Knowledge requires justification and truth; belief can be held without either", "correct": true}, {"text": "They are the same thing"}, {"text": "Knowledge is always wrong"}, {"text": "Belief is always right"}]',
  'Since Plato, knowledge has been understood as requiring more than mere belief — it must be true and justified. You can believe anything, but to know something, it must actually be the case and you must have good reasons.',
  '{"1": "Philosophers have distinguished them since antiquity.", "2": "Knowledge by definition must be true.", "3": "Beliefs can be false."}'),

('ethics', 1, 'What is the Golden Rule found in many ethical traditions?',
  '[{"text": "Treat others as you would want to be treated", "correct": true}, {"text": "The person with the gold makes the rules"}, {"text": "Always seek gold"}, {"text": "Gold is the highest value"}]',
  'The Golden Rule appears in Christianity, Confucianism, Judaism, Islam, Hinduism, and many other traditions. It is one of the most universal ethical principles across human cultures.',
  '{"1": "That is a cynical joke, not the Golden Rule.", "2": "The Golden Rule is about ethics, not wealth.", "3": "The Golden Rule is about human relationships, not material values."}'),

('politics', 1, 'What is democracy?',
  '[{"text": "A system of government where power is held by the people through voting", "correct": true}, {"text": "Rule by a single king"}, {"text": "Rule by the military"}, {"text": "Rule by the wealthiest citizens"}]',
  'Democracy comes from Greek "demos" (people) and "kratos" (rule). It originated in Athens around the 5th century BC and is now the most common form of government worldwide.',
  '{"1": "Rule by a king is monarchy.", "2": "Rule by the military is a military junta.", "3": "Rule by the wealthy is plutocracy or oligarchy."}'),

('aesthetics', 1, 'What is the Mona Lisa famous for in art philosophy?',
  '[{"text": "Its enigmatic expression raises questions about the nature of beauty and interpretation", "correct": true}, {"text": "It is the largest painting ever made"}, {"text": "It was painted yesterday"}, {"text": "It depicts a landscape only"}]',
  'Leonardo da Vinci''s Mona Lisa (c. 1503-1519) exemplifies how a work of art can mean different things to different viewers. Her ambiguous smile has generated centuries of aesthetic debate about beauty, intention, and perception.',
  '{"1": "The Mona Lisa is relatively small (77cm x 53cm).", "2": "It was painted over 500 years ago.", "3": "It prominently depicts a woman, not just a landscape."}'),

('history', 1, 'Who is considered the first Western philosopher?',
  '[{"text": "Thales of Miletus", "correct": true}, {"text": "Albert Einstein"}, {"text": "William Shakespeare"}, {"text": "Napoleon Bonaparte"}]',
  'Thales of Miletus (c. 624-546 BC) is traditionally regarded as the first Western philosopher. He proposed that water is the fundamental substance of all things — the first recorded attempt to explain nature without mythology.',
  '{"1": "Einstein was a physicist, not a philosopher, and lived in the 20th century.", "2": "Shakespeare was a playwright, not a philosopher.", "3": "Napoleon was a military and political leader, not a philosopher."}'),

('virtues', 1, 'What is courage as a virtue?',
  '[{"text": "The ability to act rightly despite fear or danger", "correct": true}, {"text": "The absence of all fear"}, {"text": "Physical strength"}, {"text": "Ignoring all risks"}]',
  'Aristotle defined courage as the mean between cowardice and recklessness. A courageous person feels fear but acts rightly despite it. It is not fearlessness but mastery of fear in service of what is right.',
  '{"1": "Courage involves feeling fear but acting rightly anyway, not having no fear.", "2": "Physical strength is a physical attribute, not the virtue of courage.", "3": "Ignoring all risks is recklessness, which Aristotle considered a vice."}'),

('economics', 1, 'What is capitalism?',
  '[{"text": "An economic system based on private ownership and voluntary exchange in free markets", "correct": true}, {"text": "A system where the government owns everything"}, {"text": "A system where there is no money"}, {"text": "A system where only one company exists"}]',
  'Capitalism is characterized by private property, voluntary trade, competition, and the profit motive. Adam Smith described its foundations in "The Wealth of Nations" (1776).',
  '{"1": "Government ownership of everything is socialism or communism.", "2": "Capitalism relies on money and prices as signals.", "3": "Capitalism involves competition among many firms."}'),

('law', 1, 'What is justice?',
  '[{"text": "Giving each person what they are due according to fair principles", "correct": true}, {"text": "Whatever the strongest person decides"}, {"text": "Always agreeing with the majority"}, {"text": "Treating everyone identically regardless of circumstances"}]',
  'Justice has been defined since Plato as rendering each person their due. It involves fairness, impartiality, and the protection of rights — it is the foundational concept of legal and political philosophy.',
  '{"1": "Might makes right is the position Plato''s Thrasymachus argues, which Socrates refutes.", "2": "Majority rule without rights protection can produce injustice (tyranny of the majority).", "3": "Justice may require treating different cases differently (equity)."}'),

('music', 1, 'Who composed the famous "Für Elise" piano piece?',
  '[{"text": "Ludwig van Beethoven", "correct": true}, {"text": "Johann Sebastian Bach"}, {"text": "Frederic Chopin"}, {"text": "Claude Debussy"}]',
  'Beethoven composed "Für Elise" (Bagatelle No. 25 in A minor) around 1810. The identity of "Elise" remains debated — she may have been Therese Malfatti or Elisabeth Röckel.',
  '{"1": "Bach composed in the Baroque period, a century before Für Elise.", "2": "Chopin composed piano pieces but not this one.", "3": "Debussy was an Impressionist composer of a later era."}'),

('cinema', 1, 'What genre of film typically explores questions about the meaning of life and human existence?',
  '[{"text": "Drama", "correct": true}, {"text": "Slapstick comedy"}, {"text": "Sports documentary"}, {"text": "Cooking shows"}]',
  'While any genre can raise philosophical questions, dramatic films most consistently explore themes of mortality, meaning, identity, love, loss, and ethical dilemmas.',
  '{"1": "Slapstick focuses on physical humor, not existential themes.", "2": "Sports documentaries focus on athletic achievement.", "3": "Cooking shows focus on culinary skills."}'),

('quotes', 1, 'Who said: "Give me liberty, or give me death!"?',
  '[{"text": "Patrick Henry", "correct": true}, {"text": "George Washington"}, {"text": "Benjamin Franklin"}, {"text": "Thomas Jefferson"}]',
  'Patrick Henry spoke these words in 1775 at the Second Virginia Convention, urging the colonies toward revolution against British rule. It became one of the most famous declarations of the value of liberty.',
  '{"1": "Washington led the Continental Army but did not say this.", "2": "Franklin is known for other famous quotes but not this one.", "3": "Jefferson authored the Declaration of Independence but did not speak this line."}'),

('applied', 1, 'What is bioethics?',
  '[{"text": "The study of ethical issues arising from advances in biology and medicine", "correct": true}, {"text": "The study of animal behavior"}, {"text": "A type of organic farming"}, {"text": "A brand of vitamins"}]',
  'Bioethics examines moral questions about genetic engineering, cloning, euthanasia, organ donation, clinical trials, and other issues at the intersection of biology, medicine, and ethics.',
  '{"1": "Animal behavior is ethology, not bioethics.", "2": "Organic farming is agriculture, not bioethics.", "3": "Bioethics is a philosophical field, not a commercial product."}'),

('american_exceptionalism', 1, 'What is the Bill of Rights?',
  '[{"text": "The first ten amendments to the U.S. Constitution, protecting individual freedoms", "correct": true}, {"text": "A list of taxes"}, {"text": "The name of a famous ship"}, {"text": "A British law from 1066"}]',
  'Ratified in 1791, the Bill of Rights guarantees freedoms like speech, religion, press, assembly, and the right to bear arms. It reflects the founders'' philosophical commitment to natural rights and limited government.',
  '{"1": "The Bill of Rights protects freedoms, not imposes taxes.", "2": "It is a constitutional document, not a ship.", "3": "It is an American document from 1791."}');

-- ============================================================
-- DIFFICULTY 2 — More recognizable concepts
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 2, 'What is determinism?',
  '[{"text": "The view that every event is necessitated by prior causes, leaving no room for free will", "correct": true}, {"text": "The belief that you should be determined in your goals"}, {"text": "A mathematical formula"}, {"text": "A type of government"}]',
  'Determinism holds that the state of the universe at any time, together with the laws of nature, completely determines the future. This raises profound questions about moral responsibility and human freedom.',
  '{"1": "Philosophical determinism is about causation, not personal motivation.", "2": "Determinism is a metaphysical thesis, not a mathematical formula.", "3": "Determinism is a metaphysical position, not a form of governance."}'),

('epistemology', 2, 'What is skepticism in philosophy?',
  '[{"text": "The view that knowledge is uncertain or impossible to achieve", "correct": true}, {"text": "Being negative about everything"}, {"text": "A disease"}, {"text": "A type of religion"}]',
  'Philosophical skepticism questions whether we can have genuine knowledge about the world. Pyrrho, Sextus Empiricus, Descartes, and Hume all employed skeptical arguments to test the foundations of belief.',
  '{"1": "Skepticism is a methodological stance, not mere negativity.", "2": "Skepticism is a philosophical position, not a medical condition.", "3": "Skepticism is a philosophical tradition, not a religion."}'),

('ethics', 2, 'What is a moral dilemma?',
  '[{"text": "A situation where every available choice involves violating a moral principle", "correct": true}, {"text": "Any difficult decision"}, {"text": "A math problem about morality"}, {"text": "A type of court case"}]',
  'A true moral dilemma occurs when two or more moral obligations conflict and cannot all be satisfied. Classic examples include the trolley problem and cases of lying to protect an innocent life.',
  '{"1": "Not every difficult decision is a moral dilemma; it requires conflicting moral obligations.", "2": "It is a philosophical concept, not a mathematical problem.", "3": "While dilemmas appear in courts, the concept is broader than legal cases."}'),

('politics', 2, 'What is tyranny?',
  '[{"text": "Cruel and oppressive government rule by a single person or small group", "correct": true}, {"text": "A large dinosaur"}, {"text": "A type of democracy"}, {"text": "A musical instrument"}]',
  'The ancient Greeks identified tyranny as the corruption of monarchy — rule by one for their own benefit rather than the common good. Protection against tyranny was a central concern of the American founders.',
  '{"1": "That is a Tyrannosaurus Rex, a dinosaur.", "2": "Tyranny is the opposite of democracy.", "3": "Tyranny is a political concept, not an instrument."}'),

('aesthetics', 2, 'What is the difference between objective and subjective theories of beauty?',
  '[{"text": "Objective: beauty is a real property of things; Subjective: beauty is in the eye of the beholder", "correct": true}, {"text": "They are the same"}, {"text": "Objective beauty is expensive; subjective is cheap"}, {"text": "Only paintings can be objectively beautiful"}]',
  'This is one of the oldest debates in aesthetics. Plato argued beauty is an objective Form; Hume argued it depends on the observer''s taste and sentiment. The debate continues in contemporary philosophy.',
  '{"1": "They are opposing positions in aesthetic theory.", "2": "Price has nothing to do with this philosophical distinction.", "3": "Both theories apply to all forms of beauty, not just paintings."}'),

('history', 2, 'What was Plato''s Academy?',
  '[{"text": "The first institution of higher learning in the Western world, founded in Athens around 387 BC", "correct": true}, {"text": "A modern university in New York"}, {"text": "An awards ceremony for movies"}, {"text": "A military training camp"}]',
  'Plato founded the Academy in a grove sacred to Athena near Athens. It operated for nearly 900 years until 529 AD, making it the longest-running educational institution in Western history.',
  '{"1": "The Academy was ancient, not modern.", "2": "The Academy Awards are named after a different concept.", "3": "The Academy was devoted to philosophy and mathematics, not military training."}'),

('virtues', 2, 'What is temperance?',
  '[{"text": "The virtue of moderation and self-control in desires and pleasures", "correct": true}, {"text": "The temperature of a room"}, {"text": "A type of metal"}, {"text": "A musical key"}]',
  'Temperance is one of the four cardinal virtues. It involves rational control over appetites and desires — not eliminating pleasure but governing it through reason.',
  '{"1": "Temperance is a moral virtue, not related to temperature.", "2": "Temperance is a character trait, not a material.", "3": "Temperance is an ethical concept, not a musical term."}'),

('economics', 2, 'What is inflation?',
  '[{"text": "A general increase in prices and decrease in the purchasing power of money", "correct": true}, {"text": "Blowing up a balloon"}, {"text": "A type of exercise"}, {"text": "A musical technique"}]',
  'Inflation occurs when the money supply grows faster than the supply of goods and services. Milton Friedman famously said, "Inflation is always and everywhere a monetary phenomenon."',
  '{"1": "Economic inflation is about prices, not balloons.", "2": "Inflation is an economic concept, not a fitness activity.", "3": "Inflation is about purchasing power, not music."}'),

('law', 2, 'What are individual rights?',
  '[{"text": "Moral and legal entitlements that protect individuals from interference by others and by government", "correct": true}, {"text": "The right hand of each person"}, {"text": "Things only rich people have"}, {"text": "Privileges granted by a king that can be revoked"}]',
  'Individual rights — life, liberty, property, speech, religion — are the foundation of constitutional democracies. They are protections against both private and public coercion.',
  '{"1": "Individual rights are legal and moral concepts, not about physical hands.", "2": "Rights apply to all individuals, regardless of wealth.", "3": "Natural rights theory holds that rights are inherent, not granted by any authority."}'),

('music', 2, 'What is a symphony?',
  '[{"text": "A large-scale musical composition for orchestra, typically in multiple movements", "correct": true}, {"text": "A type of telephone"}, {"text": "A single musical note"}, {"text": "A type of dance"}]',
  'The symphony is one of the most important forms in Western classical music. From Haydn and Mozart through Beethoven, Brahms, and Mahler, the symphony has been a vehicle for profound musical and philosophical expression.',
  '{"1": "A symphony is a musical form, not a communication device.", "2": "A symphony is a complex multi-movement work, not a single note.", "3": "A symphony is composed music for orchestra, not a dance form."}'),

('cinema', 2, 'Who directed "Schindler''s List," which explores the moral complexity of the Holocaust?',
  '[{"text": "Steven Spielberg", "correct": true}, {"text": "Martin Scorsese"}, {"text": "Christopher Nolan"}, {"text": "Quentin Tarantino"}]',
  'Spielberg''s "Schindler''s List" (1993) explores how one man''s moral awakening led him to save over 1,100 Jews. It raises questions about moral responsibility, the capacity for good amid evil, and the limits of indifference.',
  '{"1": "Scorsese directed ''Goodfellas'' and ''The Irishman'' but not this film.", "2": "Nolan directed ''Inception'' and ''The Dark Knight'' but not this film.", "3": "Tarantino made ''Inglourious Basterds'' about WWII but not ''Schindler''s List.''"}'),

('quotes', 2, 'Who said: "To be, or not to be, that is the question"?',
  '[{"text": "Hamlet, in Shakespeare''s play", "correct": true}, {"text": "Socrates at his trial"}, {"text": "Abraham Lincoln in a speech"}, {"text": "Albert Einstein in a lecture"}]',
  'This famous soliloquy from "Hamlet" (c. 1600) is one of the most profound philosophical moments in literature — Hamlet contemplates existence, death, and whether enduring life''s suffering is preferable to the uncertainty of death.',
  '{"1": "Socrates addressed different themes at his trial, as recorded in Plato''s Apology.", "2": "Lincoln is known for the Gettysburg Address, not this quote.", "3": "Einstein made many famous statements, but this is Shakespeare."}'),

('applied', 2, 'What is environmental ethics?',
  '[{"text": "The study of moral questions about the relationship between humans and the natural world", "correct": true}, {"text": "Rules for keeping an office clean"}, {"text": "A type of cleaning product"}, {"text": "Environmental science laboratory procedures"}]',
  'Environmental ethics asks whether nature has intrinsic value, what obligations we have to future generations, and how to balance human needs with ecological preservation.',
  '{"1": "Environmental ethics is a philosophical field, not an office policy.", "2": "It is a branch of philosophy, not a product.", "3": "It is a normative field about values, not laboratory procedures."}'),

('american_exceptionalism', 2, 'What is the concept of "unalienable rights"?',
  '[{"text": "Rights that cannot be taken away or surrendered, inherent to all human beings", "correct": true}, {"text": "Rights that aliens have"}, {"text": "Rights that can be bought and sold"}, {"text": "Rights only for citizens"}]',
  'The Declaration of Independence asserts that rights to life, liberty, and the pursuit of happiness are "unalienable" — meaning no government, majority, or authority can legitimately revoke them. They belong to individuals by nature.',
  '{"1": "''Unalienable'' means they cannot be alienated (separated from a person), not related to extraterrestrials.", "2": "Unalienable means they cannot be transferred or sold.", "3": "The Declaration asserts these rights belong to all people, not just citizens."}');

-- ============================================================
-- DIFFICULTY 3-4 — More intermediate questions
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 3, 'What is nihilism?',
  '[{"text": "The view that life has no inherent meaning, purpose, or value", "correct": true}, {"text": "A type of meditation"}, {"text": "An art movement about bright colors"}, {"text": "A political party in France"}]',
  'Nihilism, from Latin "nihil" (nothing), denies objective meaning, moral truths, or inherent purpose. Nietzsche warned that nihilism would follow the "death of God" and sought to overcome it through the will to power.',
  '{"1": "Nihilism is a philosophical position, not a meditation technique.", "2": "Nihilism tends toward bleakness, not bright colors (though Dadaism, which is related, did use art provocatively).", "3": "Nihilism is a philosophical stance, not a political party."}'),

('epistemology', 3, 'What is the difference between a priori and a posteriori knowledge?',
  '[{"text": "A priori knowledge is independent of experience; a posteriori requires experience", "correct": true}, {"text": "A priori is more important than a posteriori"}, {"text": "They are Latin names for different schools"}, {"text": "A priori is guessing; a posteriori is knowing"}]',
  'A priori knowledge (mathematics, logic) can be known through reason alone. A posteriori knowledge (science, history) requires empirical observation. Kant argued some knowledge is synthetic a priori — both informative and independent of experience.',
  '{"1": "Neither is inherently more important; they are different sources of knowledge.", "2": "They are types of knowledge, not schools of philosophy.", "3": "A priori is genuine knowledge through reason, not guessing."}'),

('ethics', 3, 'What is Aristotle''s concept of "phronesis"?',
  '[{"text": "Practical wisdom — the ability to discern the right action in particular circumstances", "correct": true}, {"text": "A Greek dessert"}, {"text": "A type of Greek architecture"}, {"text": "A mathematical theorem"}]',
  'Phronesis (practical wisdom) is the intellectual virtue that guides moral action. Unlike theoretical wisdom (sophia), phronesis involves knowing how to act well in specific, concrete situations. It cannot be reduced to rules.',
  '{"1": "Phronesis is a philosophical concept, not a food.", "2": "It is a virtue of character and intellect, not an architectural style.", "3": "It is an ethical concept, not a mathematical one."}'),

('politics', 3, 'What is anarchism?',
  '[{"text": "The political philosophy that rejects all forms of involuntary government authority", "correct": true}, {"text": "A love of chaos and violence"}, {"text": "A type of music"}, {"text": "A cooking style"}]',
  'Philosophical anarchism (Proudhon, Bakunin, Kropotkin) argues that the state is inherently illegitimate because it relies on coercion. It ranges from collectivist anarchism to anarcho-capitalism (Rothbard).',
  '{"1": "Anarchism is a political philosophy about voluntary association, not chaos for its own sake.", "2": "While punk music adopted anarchist imagery, anarchism is a political philosophy.", "3": "Anarchism is about political organization, not cuisine."}'),

('aesthetics', 3, 'What is mimesis in art theory?',
  '[{"text": "The concept that art imitates or represents reality", "correct": true}, {"text": "A type of mime performance"}, {"text": "A disease"}, {"text": "A cooking technique"}]',
  'Mimesis was central to Greek aesthetic theory. Plato criticized art as a copy of a copy (imitation of the physical world, which is itself an imitation of the Forms). Aristotle saw mimesis more positively as revealing universal truths through representation.',
  '{"1": "While mime involves imitation, mimesis is a broader philosophical concept about art and representation.", "2": "Mimesis is an aesthetic theory, not a medical condition.", "3": "It is about art theory, not cooking."}'),

('history', 3, 'What was the Renaissance and how did it change philosophy?',
  '[{"text": "A 14th-17th century rebirth of classical learning that shifted focus from God to humanity, laying groundwork for modern philosophy", "correct": true}, {"text": "A music festival"}, {"text": "A type of painting technique"}, {"text": "A military campaign"}]',
  'The Renaissance recovered Greek and Roman texts, sparking humanism — the celebration of human reason, creativity, and individual achievement. Thinkers like Machiavelli, Erasmus, and Montaigne challenged medieval assumptions.',
  '{"1": "The Renaissance was a broad cultural and intellectual movement, not just a festival.", "2": "While it produced great art, the Renaissance was a comprehensive cultural transformation.", "3": "The Renaissance was intellectual and cultural, not military."}'),

('applied', 3, 'What is the ethical debate around artificial intelligence?',
  '[{"text": "Whether AI systems can be moral agents, who is responsible for AI decisions, and how to prevent AI from amplifying human biases", "correct": true}, {"text": "Whether robots should pay taxes"}, {"text": "Which programming language is best"}, {"text": "How to make AI more profitable"}]',
  'AI ethics examines questions of autonomy, accountability, transparency, fairness, and the potential for AI to either enhance or undermine human dignity and freedom.',
  '{"1": "AI taxation is a policy question, not the core ethical debate.", "2": "Programming language choice is technical, not ethical.", "3": "Profitability is a business concern; AI ethics focuses on human welfare and rights."}'),

('virtues', 3, 'What is integrity as a virtue?',
  '[{"text": "Consistency between one''s values, words, and actions — being the same person in private as in public", "correct": true}, {"text": "Being good at math"}, {"text": "Physical wholeness"}, {"text": "A type of building material"}]',
  'Integrity comes from Latin "integer" (whole). A person of integrity has unified their character — their actions align with their stated principles, even when no one is watching or when it costs them.',
  '{"1": "Mathematical integrity exists as a concept, but the virtue of integrity is about character.", "2": "While ''integrity'' can mean physical wholeness, the virtue refers to moral wholeness.", "3": "Structural integrity exists in engineering, but this is about moral character."}'),

('economics', 3, 'What is the "tragedy of the commons"?',
  '[{"text": "When individuals acting in self-interest deplete a shared resource, harming everyone — because no one owns the resource", "correct": true}, {"text": "A Shakespeare play"}, {"text": "A sad story about ordinary people"}, {"text": "A failure of the stock market"}]',
  'Garrett Hardin described how shared resources (fisheries, pastures, atmosphere) are overused when no one has property rights over them. Each person benefits from taking more, but the collective result is ruin.',
  '{"1": "It is an economic concept, not a literary work (though it sounds like one).", "2": "''Commons'' refers to shared resources, not common people.", "3": "It applies to shared resources, not specifically to financial markets."}'),

('law', 3, 'What is the presumption of innocence?',
  '[{"text": "The legal principle that a person is considered innocent until proven guilty beyond reasonable doubt", "correct": true}, {"text": "The belief that everyone is innocent"}, {"text": "A rule about children"}, {"text": "A type of insurance"}]',
  'The presumption of innocence is a fundamental right in criminal law. It places the burden of proof on the prosecution and protects individuals from arbitrary punishment — a cornerstone of justice since Roman law.',
  '{"1": "It is a legal standard for criminal proceedings, not a general belief.", "2": "It applies to all accused persons, not specifically children.", "3": "It is a legal principle, not an insurance product."}'),

('music', 3, 'What role did music play in Plato''s ideal state?',
  '[{"text": "Plato believed certain musical modes could shape character and should be regulated by the state to promote virtue", "correct": true}, {"text": "Plato banned all music"}, {"text": "Plato invented the piano"}, {"text": "Plato was a famous musician"}]',
  'In "The Republic," Plato argued that certain harmonies (Dorian, Phrygian) build courage and temperance, while others encourage laziness or excess. He proposed censoring harmful music — one of the first theories of music''s moral power.',
  '{"1": "Plato did not ban all music; he wanted to regulate which modes were used.", "2": "The piano was invented millennia after Plato.", "3": "Plato was a philosopher, not a musician."}'),

('cinema', 3, 'What philosophical themes does Christopher Nolan''s "Memento" explore?',
  '[{"text": "The reliability of memory, personal identity, and whether we can know the truth about our own past", "correct": true}, {"text": "The history of the Roman Empire"}, {"text": "How to build a house"}, {"text": "The stock market"}]',
  '"Memento" (2000) follows a man with short-term memory loss investigating his wife''s murder. Its reverse chronology forces viewers to experience his epistemological crisis — can we trust our own memories to construct a coherent identity?',
  '{"1": "The film is set in the present day, not ancient Rome.", "2": "It is about memory and identity, not construction.", "3": "It is a psychological thriller, not a financial film."}'),

('quotes', 3, 'Who wrote: "No man is an island, entire of itself"?',
  '[{"text": "John Donne", "correct": true}, {"text": "William Shakespeare"}, {"text": "John Milton"}, {"text": "Geoffrey Chaucer"}]',
  'John Donne wrote this in "Meditation XVII" (1624), arguing that every person is connected to all of humanity. "Any man''s death diminishes me, because I am involved in mankind; therefore never send to know for whom the bell tolls; it tolls for thee."',
  '{"1": "Shakespeare was a contemporary but this is from Donne''s Devotions.", "2": "Milton wrote ''Paradise Lost'' but not this meditation.", "3": "Chaucer wrote ''The Canterbury Tales'' centuries before Donne."}'),

('american_exceptionalism', 3, 'What is the philosophical significance of the Federalist Papers?',
  '[{"text": "They apply Enlightenment philosophy to the practical design of a republican government, explaining how to protect liberty through constitutional structure", "correct": true}, {"text": "They are a collection of poems"}, {"text": "They describe military strategies"}, {"text": "They are a cookbook from the colonial era"}]',
  'Written by Hamilton, Madison, and Jay (1787-1788), the Federalist Papers argue that a well-designed constitution can channel human ambition to protect liberty — applying Montesquieu, Locke, and Hume to practical governance.',
  '{"1": "The Federalist Papers are political essays, not poetry.", "2": "They discuss political structure, not military tactics.", "3": "They are about constitutional philosophy, not cooking."}');

-- ============================================================
-- DIFFICULTY 4-5 — More connecting ideas
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 4, 'What is the "hard problem of consciousness"?',
  '[{"text": "Explaining why and how physical brain processes give rise to subjective experience (qualia)", "correct": true}, {"text": "A difficult math equation"}, {"text": "The problem of staying awake during lectures"}, {"text": "A hardware issue with computers"}]',
  'David Chalmers coined this term to distinguish explaining subjective experience from explaining cognitive functions. We can explain how the brain processes color, but WHY does seeing red FEEL like anything at all?',
  '{"1": "The ''hard problem'' is philosophical, not mathematical.", "2": "It concerns the nature of consciousness itself, not attentiveness.", "3": "It is about biological consciousness, not computer hardware."}'),

('epistemology', 4, 'What is Thomas Kuhn''s concept of "paradigm shifts"?',
  '[{"text": "Revolutionary changes in the fundamental assumptions and methods of a scientific field, not gradual accumulation of knowledge", "correct": true}, {"text": "Changing gears in a car"}, {"text": "A type of dance move"}, {"text": "A method of cooking"}]',
  'Kuhn argued in "The Structure of Scientific Revolutions" (1962) that science does not progress linearly. Normal science operates within a paradigm until anomalies accumulate and trigger a revolution — a fundamental shift in worldview.',
  '{"1": "A paradigm shift is about intellectual revolution, not mechanical gears.", "2": "It is a concept in philosophy of science, not a dance.", "3": "It concerns scientific methodology, not cooking."}'),

('ethics', 4, 'What is the problem of moral luck?',
  '[{"text": "That moral judgments often depend on factors beyond a person''s control, challenging the assumption that morality requires voluntary action", "correct": true}, {"text": "A gambling theory"}, {"text": "The luck of finding moral people"}, {"text": "A lottery for ethical prizes"}]',
  'Bernard Williams and Thomas Nagel showed that we judge a drunk driver more harshly if a child happens to run into the road — even though the driver''s recklessness is identical whether or not a child appears. Luck affects moral judgment.',
  '{"1": "Moral luck is about the role of chance in moral evaluation, not gambling.", "2": "It is about how we judge actions, not about finding moral people.", "3": "It is a philosophical problem, not a competition."}'),

('politics', 4, 'What is Tocqueville''s concept of "tyranny of the majority"?',
  '[{"text": "The danger that democratic majorities will oppress minorities, imposing conformity of thought and suppressing dissent", "correct": true}, {"text": "A board game"}, {"text": "A military formation"}, {"text": "A type of election fraud"}]',
  'In "Democracy in America" (1835), Tocqueville warned that democracy''s greatest danger is not political tyranny but social conformity — the majority''s power to silence dissenting voices through social pressure.',
  '{"1": "It is a political philosophy concept, not a game.", "2": "It concerns political power dynamics, not military tactics.", "3": "It is about legitimate majority power being misused, not fraud."}'),

('virtues', 4, 'What is the difference between a virtue and a skill?',
  '[{"text": "Virtues involve consistent moral character and motivation; skills are technical abilities that can be used for good or ill", "correct": true}, {"text": "They are the same thing"}, {"text": "Skills are more important than virtues"}, {"text": "Virtues are physical; skills are mental"}]',
  'A skilled surgeon could use their abilities to heal or to harm. Virtue ensures the skill is directed toward good ends. Aristotle noted that virtues require the right motivation, not just the right action.',
  '{"1": "Philosophers distinguish them precisely because they have different moral significance.", "2": "Importance depends on context; philosophers argue virtues are necessary to direct skills properly.", "3": "Both virtues and skills have mental and behavioral components."}'),

('economics', 4, 'What is "creative destruction" in economics?',
  '[{"text": "The process where innovation destroys old industries and creates new ones, driving economic progress", "correct": true}, {"text": "Destroying art to make new art"}, {"text": "A military strategy"}, {"text": "A construction technique"}]',
  'Joseph Schumpeter described creative destruction as the essential fact of capitalism — entrepreneurs innovate, replacing old products and methods. The horse-and-buggy industry was destroyed by automobiles, creating vastly more wealth.',
  '{"1": "It is about economic transformation, not artistic destruction.", "2": "It is an economic concept, not a military one.", "3": "It is about market dynamics, not building methods."}'),

('law', 4, 'What is the difference between "positive rights" and "negative rights"?',
  '[{"text": "Negative rights require others to refrain from interfering; positive rights require others to provide something", "correct": true}, {"text": "Negative rights are bad; positive rights are good"}, {"text": "They are identical"}, {"text": "Only one type exists in law"}]',
  'Freedom of speech (negative right) means the government cannot silence you. Right to education (positive right) means someone must provide schooling. The distinction has enormous implications for the proper role of government.',
  '{"1": "Neither is inherently good or bad; they represent different claims.", "2": "They are fundamentally different types of moral and legal claims.", "3": "Both types appear in constitutions and international law."}'),

('music', 4, 'What philosophical question does the concept of "absolute music" raise?',
  '[{"text": "Whether music can express meaning, truth, or emotion on its own, without words, narrative, or visual representation", "correct": true}, {"text": "Whether music should be extremely loud"}, {"text": "Whether only one type of music exists"}, {"text": "Whether music should be free of charge"}]',
  'The debate between absolute music (pure instrumental) and program music (with narrative) mirrors broader aesthetic questions: can abstract form convey truth? Hanslick argued music''s beauty is purely formal; Schopenhauer saw it as expressing the will itself.',
  '{"1": "Volume is not the philosophical issue.", "2": "Absolute music is one approach, not a claim that only one type exists.", "3": "It concerns the nature of musical meaning, not pricing."}'),

('cinema', 4, 'What is the philosophical significance of the documentary form?',
  '[{"text": "It raises questions about whether objective truth can be captured on film, and about the ethics of representing real people and events", "correct": true}, {"text": "Documentaries are always completely objective"}, {"text": "Documentaries are fictional"}, {"text": "Documentaries have no philosophical significance"}]',
  'Every documentary involves framing, editing, and perspective — raising epistemological questions about representation. Errol Morris''s "The Thin Blue Line" showed how documentary filmmaking can both reveal and construct truth.',
  '{"1": "All documentaries involve selection and interpretation; pure objectivity is debatable.", "2": "Documentaries aim to represent reality, though they involve editorial choices.", "3": "Documentary ethics and epistemology are rich philosophical topics."}'),

('applied', 4, 'What is the "veil of ignorance" approach to fairness in policy?',
  '[{"text": "Designing policies as if you don''t know your own position in society — your race, wealth, gender, or abilities", "correct": true}, {"text": "Wearing a blindfold while voting"}, {"text": "Ignoring all facts when making decisions"}, {"text": "A fashion trend"}]',
  'Rawls''s thought experiment asks: what policies would you choose if you didn''t know whether you''d be rich or poor, healthy or sick, born into a majority or minority? This tests whether a policy is truly fair.',
  '{"1": "It is a mental exercise, not a literal blindfold.", "2": "It involves reasoning about fairness, not ignoring facts.", "3": "It is a philosophical concept, not a fashion choice."}'),

('american_exceptionalism', 4, 'How does the concept of "E Pluribus Unum" reflect a philosophical achievement?',
  '[{"text": "It resolves the tension between individual diversity and national unity through voluntary association under shared principles rather than ethnic or religious identity", "correct": true}, {"text": "It is a spell from Harry Potter"}, {"text": "It means everyone must be identical"}, {"text": "It is an economic formula"}]',
  '"Out of many, one" captures the founders'' vision of a nation united by ideas (liberty, equality, rule of law) rather than by blood, soil, or religion. This was philosophically revolutionary — a nation defined by principles, not ethnicity.',
  '{"1": "It is a Latin motto of the United States, not fiction.", "2": "It celebrates diversity within unity, not uniformity.", "3": "It is a political philosophy concept, not an economics formula."}'),

('quotes', 4, 'Who wrote: "The unforgivable crime is soft hitting. Do not hit at all if it can be avoided; but never hit softly"?',
  '[{"text": "Theodore Roosevelt", "correct": true}, {"text": "Winston Churchill"}, {"text": "Napoleon Bonaparte"}, {"text": "Sun Tzu"}]',
  'Roosevelt embodied the philosophy of vigorous, decisive action. This quote reflects his belief that half-measures are worse than inaction — a principle he applied in politics, conservation, and personal life.',
  '{"1": "Churchill had similar spirit but this specific quote is Roosevelt''s.", "2": "Napoleon was known for decisive action but this is not his quote.", "3": "Sun Tzu wrote about strategy in ''The Art of War'' but this is Roosevelt."}');

-- ============================================================
-- DIFFICULTY 5-6 — More advanced questions
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 5, 'What is the difference between substance dualism and property dualism?',
  '[{"text": "Substance dualism says mind and body are different substances; property dualism says mental properties are non-physical properties of a physical brain", "correct": true}, {"text": "They are identical"}, {"text": "Substance dualism is about chemicals"}, {"text": "Property dualism is about real estate"}]',
  'Substance dualism (Descartes) posits two kinds of stuff: mind and matter. Property dualism accepts only physical substance but argues it has irreducible mental properties — consciousness emerges from but is not identical to brain states.',
  '{"1": "They offer fundamentally different accounts of the mind-body relationship.", "2": "Substance here means metaphysical substance, not chemicals.", "3": "Property here means metaphysical properties, not real estate."}'),

('epistemology', 5, 'What is the "regress problem" in epistemology?',
  '[{"text": "Every justified belief requires another justified belief as its basis, leading to an infinite chain unless stopped by foundational beliefs, coherence, or pragmatic considerations", "correct": true}, {"text": "A problem with going backwards in time"}, {"text": "A fitness problem about regression exercises"}, {"text": "A decline in educational standards"}]',
  'The regress problem asks: what ultimately justifies our beliefs? Foundationalists say basic beliefs need no further justification. Coherentists say beliefs justify each other in a web. Infinitists accept the infinite chain.',
  '{"1": "Regress here means an infinite chain of justification, not time travel.", "2": "It is an epistemological problem, not a fitness concept.", "3": "It is about the structure of knowledge, not educational decline."}'),

('ethics', 5, 'What is virtue signaling and why is it philosophically problematic?',
  '[{"text": "Publicly expressing moral values primarily to enhance one''s social status rather than from genuine conviction — it separates the appearance of virtue from its substance", "correct": true}, {"text": "A type of traffic signal"}, {"text": "A fitness exercise"}, {"text": "A radio frequency"}]',
  'Virtue signaling is philosophically problematic because it inverts the purpose of moral expression. Aristotle would recognize it as a failure of integrity — the appearance of virtue without the internal disposition that gives it moral worth.',
  '{"1": "Virtue signaling is about moral behavior, not traffic.", "2": "It is a social phenomenon, not physical exercise.", "3": "It is about moral expression, not telecommunications."}'),

('politics', 5, 'What is the concept of "spontaneous order" and how does it challenge central planning?',
  '[{"text": "Complex social order emerges from individual actions without central direction — markets, language, and law evolve through human action but not human design", "correct": true}, {"text": "Randomly placing items on a desk"}, {"text": "A type of military drill"}, {"text": "A restaurant seating policy"}]',
  'Hayek, building on Adam Ferguson''s insight that institutions are "the result of human action but not of human design," argued that the most complex and beneficial social orders emerge spontaneously from free interaction, not from planning.',
  '{"1": "Spontaneous order is a sophisticated philosophical concept about social institutions, not random arrangement.", "2": "It is about social organization, not military discipline.", "3": "It concerns the emergence of social institutions, not restaurant management."}'),

('aesthetics', 5, 'What is the "intentional fallacy" in literary criticism?',
  '[{"text": "The error of judging a work of art by the author''s stated intentions rather than by what the work itself achieves", "correct": true}, {"text": "Intentionally making artistic mistakes"}, {"text": "A logical error about intentions in ethics"}, {"text": "A type of painting technique"}]',
  'Wimsatt and Beardsley argued that a poem belongs to the public once published — the author''s biography or stated aims are irrelevant to its meaning. The work must be judged on its own terms.',
  '{"1": "The ''fallacy'' is a critical error, not deliberate artistic mistakes.", "2": "While intentions matter in ethics, the intentional fallacy is a concept in aesthetics.", "3": "It is a principle of literary criticism, not a painting method."}'),

('virtues', 5, 'What is the difference between moral virtue and intellectual virtue in Aristotle?',
  '[{"text": "Moral virtues (courage, temperance) are habits of character formed through practice; intellectual virtues (wisdom, understanding) are developed through teaching and reflection", "correct": true}, {"text": "Moral virtues are more important"}, {"text": "Intellectual virtues are only for academics"}, {"text": "Aristotle rejected intellectual virtues"}]',
  'Aristotle distinguished two kinds of excellence: moral virtues develop through habituation (doing courageous acts makes you courageous) while intellectual virtues develop through instruction and contemplation.',
  '{"1": "Aristotle valued both; phronesis (practical wisdom) bridges them.", "2": "Aristotle believed all people should develop intellectual virtues, not just scholars.", "3": "Aristotle devoted significant attention to intellectual virtues in the Nicomachean Ethics."}'),

('economics', 5, 'What is "moral hazard" and why is it philosophically significant?',
  '[{"text": "When protection from risk encourages riskier behavior — insurance, bailouts, or safety nets change incentives and can increase the very harms they aim to prevent", "correct": true}, {"text": "A dangerous chemical"}, {"text": "A type of extreme sport"}, {"text": "A road hazard"}]',
  'Moral hazard reveals that consequences shape behavior. When banks know they will be bailed out, they take greater risks. The philosophical significance: good intentions (protecting people) can create perverse incentives.',
  '{"1": "Moral hazard is an economic concept, not a chemical.", "2": "It is about incentive structures, not sports.", "3": "It is about behavioral incentives, not road conditions."}'),

('law', 5, 'What is the concept of "substantive due process"?',
  '[{"text": "The principle that certain fundamental rights are protected from government interference regardless of the procedures used — the substance of law, not just its process, must be fair", "correct": true}, {"text": "A cooking technique"}, {"text": "A type of building foundation"}, {"text": "A chemical process"}]',
  'Substantive due process extends the Fourteenth Amendment beyond procedural fairness to protect fundamental liberties (privacy, bodily autonomy, family relationships) from government intrusion, even through properly enacted laws.',
  '{"1": "Due process is a legal concept, not a culinary one.", "2": "It is about legal foundations, not physical ones.", "3": "It concerns constitutional law, not chemistry."}'),

('history', 5, 'What was the significance of the Stoic concept of cosmopolitanism for later philosophy?',
  '[{"text": "The Stoic idea that all humans are citizens of the world, regardless of local origin, laid the groundwork for universal human rights and international law", "correct": true}, {"text": "It was about cosmetics"}, {"text": "It only applied to Greeks"}, {"text": "It was quickly forgotten"}]',
  'Marcus Aurelius wrote: "My city and country, so far as I am Antoninus, is Rome, but so far as I am a man, it is the world." This Stoic universalism influenced natural law theory, Kant''s cosmopolitan right, and the UN Declaration of Human Rights.',
  '{"1": "Cosmopolitanism is about world citizenship, not cosmetics.", "2": "The entire point of Stoic cosmopolitanism was to transcend local and ethnic boundaries.", "3": "It profoundly influenced Western political philosophy for millennia."}'),

('music', 5, 'What is the relationship between Schopenhauer''s philosophy and Wagner''s music?',
  '[{"text": "Schopenhauer argued music directly expresses the will (ultimate reality), which deeply influenced Wagner''s vision of music-drama as the supreme art form", "correct": true}, {"text": "They were enemies"}, {"text": "Schopenhauer hated music"}, {"text": "Wagner never read philosophy"}]',
  'Wagner discovered Schopenhauer in 1854 and it transformed his art. Schopenhauer''s claim that music bypasses representation to express the metaphysical will directly gave Wagner a philosophical foundation for opera as Gesamtkunstwerk.',
  '{"1": "Wagner was profoundly influenced by Schopenhauer; he read ''The World as Will and Representation'' repeatedly.", "2": "Schopenhauer gave music the highest place among the arts.", "3": "Wagner was deeply engaged with philosophy, especially Schopenhauer and later Nietzsche."}'),

('cinema', 5, 'What philosophical questions does the "Ship of Theseus" (2012 film by Anand Gandhi) explore?',
  '[{"text": "Personal identity and continuity through organ transplantation — when parts of you are replaced, are you still you?", "correct": true}, {"text": "Ancient Greek naval warfare"}, {"text": "Modern shipping logistics"}, {"text": "How to repair wooden boats"}]',
  'This film uses three stories of organ recipients to explore the ancient metaphysical puzzle in a contemporary medical context: a blind photographer who regains sight, a monk who needs an animal organ, and a stockbroker with a transplanted kidney.',
  '{"1": "The film applies the ancient thought experiment to modern medicine, not ancient warfare.", "2": "It concerns personal identity, not commercial shipping.", "3": "It uses the ship metaphor for human identity, not literal boat repair."}'),

('applied', 5, 'What is the "right to be forgotten" and what philosophical tensions does it create?',
  '[{"text": "The claim that individuals should be able to have personal information removed from the internet, creating tension between privacy and freedom of information", "correct": true}, {"text": "A memory loss treatment"}, {"text": "A game where you try to be invisible"}, {"text": "A type of amnesia"}]',
  'The right to be forgotten (EU GDPR Article 17) creates a direct conflict between two values: the individual''s right to control their digital identity and the public''s right to access information. Neither can fully prevail without harming the other.',
  '{"1": "It is a legal and philosophical concept about data privacy, not a medical treatment.", "2": "It is about digital privacy rights, not a game.", "3": "It concerns voluntary data deletion, not involuntary memory loss."}'),

('quotes', 5, 'Who wrote: "Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither Liberty nor Safety"?',
  '[{"text": "Benjamin Franklin", "correct": true}, {"text": "Thomas Jefferson"}, {"text": "John Adams"}, {"text": "Alexander Hamilton"}]',
  'Franklin wrote this in 1755 on behalf of the Pennsylvania Assembly. It captures the philosophical principle that liberty and security are not truly opposed — sacrificing liberty for security ultimately destroys both.',
  '{"1": "Jefferson expressed similar sentiments but this specific quote is Franklin''s.", "2": "Adams was concerned with balancing liberty and order but did not write this.", "3": "Hamilton favored stronger government but this quote is attributed to Franklin."}');

-- ============================================================
-- DIFFICULTY 7-8 — More expert questions
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 7, 'What is mereological nihilism?',
  '[{"text": "The view that composite objects do not exist — only fundamental simples arranged in certain ways exist", "correct": true}, {"text": "A form of political nihilism about government agencies"}, {"text": "The denial that parts exist"}, {"text": "A theory about nothing at all existing"}]',
  'Peter van Inwagen and others argue that there are no tables or chairs — only particles arranged ''tablewise'' or ''chairwise.'' This radical position avoids problems about when parts compose a whole but challenges common sense.',
  '{"1": "It is a metaphysical thesis about composition, not politics.", "2": "It denies composites, not parts themselves — simples (fundamental particles) still exist.", "3": "It is not general nihilism; it specifically concerns composite objects."}'),

('epistemology', 7, 'What is the difference between evidentialist and pragmatist theories of epistemic justification?',
  '[{"text": "Evidentialism holds that belief should be proportioned to evidence alone; pragmatism allows practical consequences to play a role in justification", "correct": true}, {"text": "They are identical"}, {"text": "Evidentialism is about court evidence only"}, {"text": "Pragmatism rejects all evidence"}]',
  'W.K. Clifford''s evidentialism says it is always wrong to believe anything without sufficient evidence. William James''s pragmatism responds that when evidence is inconclusive, practical consequences of belief can legitimately tip the balance.',
  '{"1": "They represent fundamentally different approaches to the ethics of belief.", "2": "Evidentialism is a general epistemological position, not limited to courts.", "3": "Pragmatism accepts evidence but also weighs practical consequences."}'),

('ethics', 7, 'What is the Doctrine of Double Effect?',
  '[{"text": "It is permissible to cause harm as a foreseen but unintended side effect of a good action, but not to cause that same harm as a means to the good end", "correct": true}, {"text": "A theory about twin siblings"}, {"text": "A military strategy about double attacks"}, {"text": "A photography technique"}]',
  'Attributed to Aquinas, this doctrine distinguishes between a surgeon who foresees a patient''s death as a side effect of risky surgery (permissible) and one who kills the patient to harvest organs for five others (impermissible).',
  '{"1": "''Double'' refers to the two effects (intended good and foreseen harm), not twins.", "2": "It is an ethical principle, not a military concept.", "3": "It is moral philosophy, not photography."}'),

('politics', 7, 'What is the difference between Oakeshott''s conservatism and Burke''s?',
  '[{"text": "Burke grounds conservatism in the accumulated wisdom of tradition against abstract rationalism; Oakeshott grounds it in a disposition to enjoy the present rather than pursue ideological transformation", "correct": true}, {"text": "They are the same"}, {"text": "Oakeshott was a radical progressive"}, {"text": "Burke rejected all tradition"}]',
  'Burke argues that inherited institutions embody more wisdom than any individual rationalist can design. Oakeshott goes further — conservatism is not a doctrine but a temperamental preference for the familiar, the tried, the intimate.',
  '{"1": "They share conservative sensibilities but differ in philosophical foundations.", "2": "Oakeshott was one of the 20th century''s most important conservative thinkers.", "3": "Burke is the founding figure of philosophical conservatism, deeply committed to tradition."}'),

('aesthetics', 7, 'What is the relationship between Kant''s "free beauty" and "dependent beauty"?',
  '[{"text": "Free beauty is appreciated without any concept of what the object should be; dependent beauty requires judging the object against a concept of its purpose or type", "correct": true}, {"text": "Free beauty costs nothing; dependent beauty is expensive"}, {"text": "They are the same concept"}, {"text": "Kant rejected the idea of beauty"}]',
  'A flower exhibits free beauty — we appreciate it without needing to know what a ''perfect'' flower is. A building exhibits dependent beauty — we judge it partly by how well it serves its function. This distinction maps onto pure vs. applied aesthetics.',
  '{"1": "''Free'' and ''dependent'' refer to the role of concepts in judgment, not to cost.", "2": "They are distinct categories within Kant''s aesthetic theory.", "3": "Kant devoted his ''Critique of Judgment'' to analyzing beauty."}'),

('virtues', 7, 'What is the "situationist challenge" to virtue ethics?',
  '[{"text": "Empirical psychology suggests character traits are less consistent than virtue ethicists assume — people''s behavior varies dramatically with situational factors rather than stable character", "correct": true}, {"text": "A challenge to perform virtuous acts in difficult situations"}, {"text": "A reality TV show about ethics"}, {"text": "A military scenario training exercise"}]',
  'John Doris and Gilbert Harman cited experiments (Milgram, Zimbardo, Good Samaritan) showing that situational pressures predict behavior better than character traits. If stable character traits are rare, virtue ethics rests on an empirical mistake.',
  '{"1": "The challenge is empirical/philosophical, not a practical exercise.", "2": "It is a serious academic debate, not entertainment.", "3": "It concerns moral psychology, not military training."}'),

('economics', 7, 'What is the Hayekian "knowledge problem" and how does it differ from the Misesian "calculation problem"?',
  '[{"text": "Mises argued socialism cannot calculate without market prices; Hayek deepened this to argue that much economic knowledge is tacit and dispersed, impossible to centralize even with computers", "correct": true}, {"text": "They are the same argument"}, {"text": "Hayek supported central planning"}, {"text": "Mises was a socialist"}]',
  'Mises (1920) showed that without prices for capital goods, rational economic calculation is impossible. Hayek (1945) went further: even if a planner had all explicit data, the tacit, local, ever-changing knowledge that market participants use cannot be centralized.',
  '{"1": "Hayek built on Mises but added a distinct epistemological dimension.", "2": "Hayek was the foremost critic of central planning.", "3": "Mises was the foremost defender of free-market capitalism."}'),

('law', 7, 'What is the difference between "originalism" and "living constitutionalism"?',
  '[{"text": "Originalism interprets the constitution by its original public meaning; living constitutionalism sees it as evolving with changing societal values", "correct": true}, {"text": "They are the same approach"}, {"text": "Originalism is progressive; living constitutionalism is conservative"}, {"text": "Neither applies to actual courts"}]',
  'Scalia championed originalism — the Constitution means what its ratifiers understood. Breyer and others argue the Constitution''s broad principles must be applied to circumstances the founders could not have foreseen.',
  '{"1": "They are fundamentally different approaches to constitutional interpretation.", "2": "Originalism is generally associated with judicial conservatism; living constitutionalism with progressivism.", "3": "Both are actively used by judges at all levels."}'),

('history', 7, 'What was the "quarrel of the ancients and moderns" and why does it matter?',
  '[{"text": "A 17th-century debate about whether modern thinkers had surpassed the ancients, establishing the idea of intellectual progress that defines modernity", "correct": true}, {"text": "A war between Greece and France"}, {"text": "A family dispute"}, {"text": "A sports rivalry"}]',
  'This debate (Perrault vs. Boileau, Swift''s "Battle of the Books") asked whether contemporary culture had exceeded classical achievement. The moderns'' victory established the Enlightenment idea of progress that shaped all subsequent Western thought.',
  '{"1": "It was an intellectual debate, not a military conflict.", "2": "It was a cultural debate among intellectuals, not a family matter.", "3": "It concerned intellectual and cultural progress, not athletics."}'),

('music', 7, 'What is Pythagoras''s contribution to both music theory and philosophy?',
  '[{"text": "He discovered that musical harmony corresponds to mathematical ratios, leading to the idea that reality itself has a mathematical structure", "correct": true}, {"text": "He invented the guitar"}, {"text": "He wrote symphonies"}, {"text": "He rejected music as meaningless"}]',
  'Pythagoras found that harmonious intervals correspond to simple numerical ratios (octave = 2:1, fifth = 3:2). This led to his revolutionary insight that the cosmos itself might be structured by mathematical relationships — "all is number."',
  '{"1": "Pythagoras studied string vibrations, not guitars (which came much later).", "2": "Symphonies were a much later form; Pythagoras studied the mathematics of sound.", "3": "Pythagoras saw music as the key to understanding cosmic order."}'),

('cinema', 7, 'What is the philosophical significance of the "Kuleshov Effect" in cinema?',
  '[{"text": "It demonstrates that meaning in film is created by the juxtaposition of images, not inherent in individual shots — viewers project emotion and narrative onto neutral footage based on context", "correct": true}, {"text": "A camera manufacturing defect"}, {"text": "A type of film coloring"}, {"text": "A Russian dance move"}]',
  'Lev Kuleshov showed that the same shot of an expressionless face, when intercut with a bowl of soup, a dead child, or a woman, was read as hunger, grief, or desire. This proved that montage — not content — creates cinematic meaning.',
  '{"1": "The Kuleshov Effect is about perception and meaning, not equipment.", "2": "It is about editing and cognitive interpretation, not visual coloring.", "3": "It is a concept in film theory, not a dance."}'),

('applied', 7, 'What is the "experience machine" thought experiment and what does it show?',
  '[{"text": "Nozick asks: would you plug into a machine that provides perfect simulated happiness? Most say no, suggesting we value authentic experience and real achievement, not just pleasant feelings", "correct": true}, {"text": "A washing machine that learns your preferences"}, {"text": "A theory about gaining work experience"}, {"text": "An amusement park ride"}]',
  'Robert Nozick''s thought experiment challenges hedonistic utilitarianism. If happiness were all that mattered, we should plug in. That most people refuse shows we value reality, authenticity, and actual accomplishment — not just subjective satisfaction.',
  '{"1": "It is a philosophical thought experiment, not an appliance.", "2": "It concerns the nature of well-being, not career development.", "3": "It is a mental exercise, not a physical ride."}');

-- ============================================================
-- DIFFICULTY 9-10 — More master level
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 9, 'What is the "truthmaker principle" and why is it controversial?',
  '[{"text": "Every truth must be made true by some entity or state of affairs in the world — controversial because negative truths and modal truths seem to lack obvious truthmakers", "correct": true}, {"text": "A principle about lie detectors"}, {"text": "A rule for journalists"}, {"text": "A manufacturing quality standard"}]',
  'The truthmaker principle demands ontological accountability: if ''there are no unicorns'' is true, what in reality makes it true? The absence of unicorns? A negative state of affairs? This pushes metaphysics into difficult territory.',
  '{"1": "Truthmaking is a metaphysical concept, not about detecting lies.", "2": "It is about the relationship between truth and reality, not journalism.", "3": "It is a philosophical principle, not a manufacturing standard."}'),

('epistemology', 9, 'What is the "swamping problem" for reliabilism?',
  '[{"text": "If a reliable process produces a true belief, the reliability adds no value beyond the truth itself — like good coffee tastes the same whether from a reliable or unreliable machine", "correct": true}, {"text": "A problem with swampy terrain"}, {"text": "A plumbing issue"}, {"text": "A flooding emergency protocol"}]',
  'The swamping problem (Zagzebski, Kvanvig) challenges process reliabilism by asking: what value does reliability add to a belief that is already true? If knowledge is more valuable than mere true belief, reliability alone cannot explain why.',
  '{"1": "''Swamping'' here means the truth value overwhelms the reliability value, not actual swamps.", "2": "It is an epistemological problem, not a plumbing issue.", "3": "It concerns the value of knowledge, not emergency management."}'),

('ethics', 9, 'What is the "separateness of persons" objection to utilitarianism?',
  '[{"text": "Utilitarianism treats society as a single super-organism whose total welfare is to be maximized, ignoring the moral significance of boundaries between individuals", "correct": true}, {"text": "That people should live separately"}, {"text": "An argument for social distancing"}, {"text": "A theory about personality differences"}]',
  'Rawls and Nozick argue that utilitarianism''s aggregation of welfare across persons is illegitimate. Just as it is rational for me to sacrifice present pleasure for future benefit, utilitarianism assumes it is rational to sacrifice one person for others — but persons are not interchangeable.',
  '{"1": "It is about the moral unit of analysis, not living arrangements.", "2": "It is a deep moral philosophy objection, not a public health measure.", "3": "It concerns moral theory, not psychology."}'),

('politics', 9, 'What is Chantal Mouffe''s concept of "agonistic pluralism"?',
  '[{"text": "Democratic politics should transform enemies into adversaries who share a commitment to democratic institutions while contesting their interpretation — conflict is constitutive of democracy, not a failure of it", "correct": true}, {"text": "A theory about athletic competition"}, {"text": "A medical condition"}, {"text": "A type of gardening"}]',
  'Mouffe argues against Habermas''s deliberative consensus. Genuine political passions and conflicts cannot be eliminated through rational deliberation. Healthy democracy channels antagonism into agonism — passionate but rules-bound contestation.',
  '{"1": "''Agonistic'' comes from ''agon'' (contest), applied to politics, not sports specifically.", "2": "It is a political theory, not a medical condition.", "3": "It concerns democratic conflict, not horticulture."}'),

('history', 9, 'What was the philosophical significance of the condemnation of 1277?',
  '[{"text": "The Bishop of Paris condemned 219 philosophical propositions, inadvertently liberating natural philosophy from Aristotelian constraints and preparing the ground for modern science", "correct": true}, {"text": "A criminal trial"}, {"text": "A building code violation"}, {"text": "A literary review"}]',
  'By condemning Aristotelian necessitarianism, the 1277 condemnation made it legitimate to hypothesize that God could have created nature differently — opening the door to empirical investigation of contingent natural laws, a precondition for modern science.',
  '{"1": "It was a theological-philosophical condemnation, not a criminal case.", "2": "It concerned intellectual propositions, not buildings.", "3": "It was an ecclesiastical act, not literary criticism."}'),

('aesthetics', 9, 'What is Adorno''s concept of the "truth content" (Wahrheitsgehalt) of artworks?',
  '[{"text": "Artworks have objective truth content that is sedimented social experience — they register historical suffering and contradiction in their form, not their explicit content or the artist''s intentions", "correct": true}, {"text": "The factual accuracy of art"}, {"text": "The resale value of art"}, {"text": "Whether art is made from genuine materials"}]',
  'For Adorno, Beethoven''s late quartets are ''true'' not because they state truths but because their fractured form embodies the contradictions of their historical moment. Truth content is deciphered through immanent critique of the work''s structure.',
  '{"1": "Truth content is about historical and social truth embedded in aesthetic form, not factual accuracy.", "2": "It concerns philosophical meaning, not market value.", "3": "It is about artistic truth, not material authenticity."}'),

('economics', 9, 'What is the Mundell-Fleming "impossible trinity" and what philosophical choice does it force?',
  '[{"text": "A country cannot simultaneously have free capital movement, a fixed exchange rate, and independent monetary policy — it must sacrifice one, revealing inescapable tradeoffs in political economy", "correct": true}, {"text": "A religious doctrine"}, {"text": "A three-body problem in physics"}, {"text": "A triathlon training program"}]',
  'The impossible trinity shows that economic policy involves irreducible tradeoffs. Like Arrow''s impossibility theorem in social choice, it demonstrates that certain combinations of desirable properties are logically incompatible.',
  '{"1": "The ''trinity'' refers to three policy goals, not religious doctrine.", "2": "While analogous to the physics problem in structure, it concerns macroeconomics.", "3": "It is an economic constraint, not an athletic program."}'),

('virtues', 9, 'What is the "unity of the virtues" thesis and why do contemporary virtue ethicists debate it?',
  '[{"text": "The ancient claim that possessing any virtue fully requires possessing all virtues — you cannot be truly courageous without also being just, temperate, and wise", "correct": true}, {"text": "That all virtues are the same virtue"}, {"text": "That only one virtue matters"}, {"text": "That virtues should be united under one government"}]',
  'Socrates and the Stoics held that the virtues are unified. A common objection: people seem to have some virtues but not others. Defenders argue that apparent courage without justice is mere recklessness — genuine virtue requires practical wisdom that connects all virtues.',
  '{"1": "Unity means interconnection, not identity — each virtue is distinct but requires the others.", "2": "The thesis claims all virtues are required, not that only one matters.", "3": "It is an ethical thesis about character, not a political one."}'),

('law', 9, 'What is the philosophical problem of "hard cases" in law?',
  '[{"text": "Cases where existing legal rules do not clearly determine the outcome, forcing judges to exercise discretion — raising the question of whether they discover or create law", "correct": true}, {"text": "Cases involving very heavy evidence"}, {"text": "Physically difficult courtroom conditions"}, {"text": "Cases that take a long time"}]',
  'Dworkin argued that judges in hard cases discover the right answer by interpreting law as integrity. Hart argued that law has an "open texture" and judges inevitably exercise discretion. This debate defines modern jurisprudence.',
  '{"1": "''Hard'' refers to legal difficulty, not physical weight.", "2": "It concerns legal reasoning, not courtroom conditions.", "3": "It is about legal indeterminacy, not case duration."}'),

('quotes', 9, 'Who wrote: "The owl of Minerva spreads its wings only with the falling of the dusk"?',
  '[{"text": "G.W.F. Hegel", "correct": true}, {"text": "Immanuel Kant"}, {"text": "Arthur Schopenhauer"}, {"text": "Friedrich Schelling"}]',
  'Hegel wrote this in the preface to "Philosophy of Right" (1820), meaning that philosophy understands an era only after it has ended. Wisdom arrives too late to change events — it can only comprehend what has already unfolded.',
  '{"1": "Kant emphasized the role of reason in shaping the future, not retrospective understanding.", "2": "Schopenhauer had a pessimistic worldview but this specific metaphor is Hegel''s.", "3": "Schelling was Hegel''s early collaborator but this quote is from Hegel''s mature work."}');
