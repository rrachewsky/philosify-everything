-- ============================================================
-- PHILOSIFY QUIZ - Seed Batch 3 (400 questions)
-- Fills pool from ~104 to 500+
-- Covers all 14 categories, difficulties 1-10
-- ============================================================

-- ============================================================
-- DIFFICULTY 1 — Famous, well-known (easy identification)
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 1, 'What is metaphysics primarily concerned with?',
  '[{"text": "The fundamental nature of reality", "correct": true}, {"text": "The study of moral behavior"}, {"text": "The analysis of language"}, {"text": "The history of science"}]',
  'Metaphysics is the branch of philosophy dealing with the first principles of things, including abstract concepts such as being, knowing, substance, cause, identity, time, and space.',
  '{"1": "Moral behavior is the domain of ethics, not metaphysics.", "2": "Language analysis belongs to philosophy of language and analytic philosophy.", "3": "History of science is a distinct field from metaphysics."}'),

('epistemology', 1, 'What does epistemology study?',
  '[{"text": "The nature and scope of knowledge", "correct": true}, {"text": "The existence of God"}, {"text": "Political systems"}, {"text": "Human emotions"}]',
  'Epistemology is the branch of philosophy concerned with the theory of knowledge — what we can know, how we know it, and what justifies our beliefs.',
  '{"1": "The existence of God falls under philosophy of religion and theology.", "2": "Political systems are studied in political philosophy.", "3": "Human emotions are studied in psychology and philosophy of mind."}'),

('ethics', 1, 'Which philosopher is most associated with the concept of the "categorical imperative"?',
  '[{"text": "Immanuel Kant", "correct": true}, {"text": "John Stuart Mill"}, {"text": "Friedrich Nietzsche"}, {"text": "David Hume"}]',
  'Kant formulated the categorical imperative as the supreme principle of morality: "Act only according to that maxim whereby you can at the same time will that it should become a universal law."',
  '{"1": "Mill is associated with utilitarianism and the greatest happiness principle.", "2": "Nietzsche rejected universal moral systems and championed the will to power.", "3": "Hume argued that morality is based on sentiment, not reason."}'),

('politics', 1, 'Who wrote "The Republic," describing an ideal state ruled by philosopher-kings?',
  '[{"text": "Plato", "correct": true}, {"text": "Aristotle"}, {"text": "Cicero"}, {"text": "Seneca"}]',
  'Plato wrote "The Republic" around 375 BC, arguing that the ideal state should be governed by philosopher-kings — those who have attained knowledge of the Form of the Good.',
  '{"1": "Aristotle wrote ''Politics'' and disagreed with many of Plato''s ideas about the ideal state.", "2": "Cicero wrote ''On the Republic'' but centuries after Plato.", "3": "Seneca was a Stoic philosopher and advisor to Nero, not known for political theory."}'),

('aesthetics', 1, 'What branch of philosophy deals with the nature of beauty and art?',
  '[{"text": "Aesthetics", "correct": true}, {"text": "Logic"}, {"text": "Ontology"}, {"text": "Pragmatism"}]',
  'Aesthetics examines the nature of beauty, art, taste, and the creation and appreciation of beauty. It is one of the traditional branches of philosophy.',
  '{"1": "Logic deals with the principles of valid reasoning and argumentation.", "2": "Ontology studies the nature of being and existence — a sub-field of metaphysics.", "3": "Pragmatism is a philosophical tradition focused on practical consequences."}'),

('applied', 1, 'What is applied philosophy primarily concerned with?',
  '[{"text": "Using philosophical methods to address real-world problems", "correct": true}, {"text": "Studying ancient philosophical texts"}, {"text": "Creating mathematical proofs"}, {"text": "Writing poetry about existence"}]',
  'Applied philosophy uses philosophical methods, concepts, and theories to examine practical issues in fields like medicine, technology, law, business, and the environment.',
  '{"1": "Studying ancient texts is part of history of philosophy, not applied philosophy specifically.", "2": "Mathematical proofs belong to mathematics and logic.", "3": "Poetry about existence relates to literary expression, not applied philosophy."}'),

('history', 1, 'In which ancient Greek city did Socrates, Plato, and Aristotle primarily teach?',
  '[{"text": "Athens", "correct": true}, {"text": "Sparta"}, {"text": "Corinth"}, {"text": "Thebes"}]',
  'Athens was the intellectual center of ancient Greece. Socrates taught in the Agora, Plato founded the Academy, and Aristotle founded the Lyceum — all in Athens.',
  '{"1": "Sparta was known for its military culture, not philosophical inquiry.", "2": "Corinth was a major trading city but not a center of philosophy.", "3": "Thebes was a powerful city-state but did not host these philosophers."}'),

('american_exceptionalism', 1, 'Which document begins with "We hold these truths to be self-evident"?',
  '[{"text": "The Declaration of Independence", "correct": true}, {"text": "The Constitution"}, {"text": "The Federalist Papers"}, {"text": "The Bill of Rights"}]',
  'Thomas Jefferson wrote these words in the Declaration of Independence (1776), asserting that individual rights to life, liberty, and the pursuit of happiness are self-evident truths — a revolutionary philosophical claim.',
  '{"1": "The Constitution begins with ''We the People'' and establishes the government structure.", "2": "The Federalist Papers are essays arguing for ratification of the Constitution.", "3": "The Bill of Rights lists specific individual rights but has a different preamble."}'),

('virtues', 1, 'Which philosopher identified four cardinal virtues: prudence, justice, temperance, and courage?',
  '[{"text": "Plato", "correct": true}, {"text": "Epicurus"}, {"text": "Confucius"}, {"text": "Thomas Aquinas"}]',
  'Plato identified these four cardinal virtues in "The Republic," each corresponding to a part of the soul and a class of the ideal state. They became foundational in Western ethical thought.',
  '{"1": "Epicurus focused on pleasure and the absence of pain as the highest good.", "2": "Confucius articulated different virtues centered on ren (benevolence) and li (ritual).", "3": "Aquinas adopted Plato''s four virtues but added three theological virtues — he built upon, not originated, the cardinal virtues."}'),

('economics', 1, 'Who wrote "The Wealth of Nations," foundational to free-market economics?',
  '[{"text": "Adam Smith", "correct": true}, {"text": "Karl Marx"}, {"text": "John Maynard Keynes"}, {"text": "David Ricardo"}]',
  'Adam Smith published "An Inquiry into the Nature and Causes of the Wealth of Nations" in 1776, arguing that free markets, division of labor, and self-interest drive prosperity.',
  '{"1": "Marx wrote ''Das Kapital'' criticizing capitalism, not defending free markets.", "2": "Keynes wrote ''The General Theory'' advocating government intervention in economics.", "3": "Ricardo contributed the theory of comparative advantage but did not write this work."}'),

('law', 1, 'What concept describes the principle that no person is above the law?',
  '[{"text": "Rule of law", "correct": true}, {"text": "Social contract"}, {"text": "Natural selection"}, {"text": "Divine right"}]',
  'The rule of law means that laws apply equally to all people, including those who govern. It is a cornerstone of constitutional democracies and individual rights protection.',
  '{"1": "The social contract is a theory about the legitimacy of state authority, not the equality of legal application.", "2": "Natural selection is a biological concept from evolutionary theory.", "3": "Divine right claims that monarchs derive authority from God, the opposite of rule of law."}'),

('music', 1, 'Which composer''s Ninth Symphony includes the "Ode to Joy," celebrating universal brotherhood?',
  '[{"text": "Ludwig van Beethoven", "correct": true}, {"text": "Wolfgang Amadeus Mozart"}, {"text": "Johann Sebastian Bach"}, {"text": "Franz Schubert"}]',
  'Beethoven''s Ninth Symphony (1824) includes a choral setting of Friedrich Schiller''s "Ode to Joy," celebrating the Enlightenment ideals of freedom, unity, and human dignity.',
  '{"1": "Mozart died in 1791, decades before Beethoven''s Ninth was composed.", "2": "Bach composed in the Baroque era, a century before the Ninth.", "3": "Schubert was a contemporary of Beethoven but did not compose the Ninth Symphony."}'),

('cinema', 1, 'Which 1999 film explores the philosophical question of whether our perceived reality is an illusion?',
  '[{"text": "The Matrix", "correct": true}, {"text": "Fight Club"}, {"text": "The Sixth Sense"}, {"text": "American Beauty"}]',
  'The Matrix (1999) directly engages with philosophical skepticism — drawing from Plato''s Cave, Descartes'' evil demon hypothesis, and Nozick''s experience machine thought experiment.',
  '{"1": "Fight Club explores consumerism and identity but not simulated reality.", "2": "The Sixth Sense is about perception but through a supernatural lens, not epistemological.", "3": "American Beauty examines suburban dissatisfaction, not the nature of reality."}'),

('quotes', 1, 'Who said: "The only thing necessary for the triumph of evil is for good men to do nothing"?',
  '[{"text": "Edmund Burke", "correct": true}, {"text": "Thomas Paine"}, {"text": "Benjamin Franklin"}, {"text": "George Washington"}]',
  'This quote is widely attributed to Edmund Burke, the Anglo-Irish statesman and philosopher. It captures the moral responsibility of individuals to actively oppose injustice.',
  '{"1": "Paine wrote ''Common Sense'' and ''The Rights of Man'' but is not credited with this quote.", "2": "Franklin is known for ''An investment in knowledge pays the best interest'' among others.", "3": "Washington is remembered for his farewell address, not this quote."}');

-- ============================================================
-- DIFFICULTY 2 — Recognizable concepts, moderate identification
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 2, 'What is dualism in philosophy of mind?',
  '[{"text": "The view that mind and body are fundamentally different substances", "correct": true}, {"text": "The belief that everything is physical"}, {"text": "The idea that only the mind exists"}, {"text": "The theory that reality is an illusion"}]',
  'Dualism, most famously defended by Descartes, holds that the mental and the physical are two distinct kinds of substance. The mind is non-physical; the body is physical.',
  '{"1": "The belief that everything is physical is called physicalism or materialism.", "2": "The idea that only the mind exists is idealism, not dualism.", "3": "The theory that reality is an illusion is closer to radical skepticism or certain forms of Eastern philosophy."}'),

('epistemology', 2, 'What is empiricism?',
  '[{"text": "The view that knowledge comes primarily from sensory experience", "correct": true}, {"text": "The view that knowledge comes from pure reason alone"}, {"text": "The rejection of all knowledge claims"}, {"text": "The study of moral duties"}]',
  'Empiricism holds that all knowledge is derived from sense experience. Key empiricists include John Locke, George Berkeley, and David Hume.',
  '{"1": "Knowledge from pure reason alone is rationalism, the opposing view.", "2": "Rejecting all knowledge claims is radical skepticism.", "3": "The study of moral duties is deontological ethics."}'),

('ethics', 2, 'What is utilitarianism?',
  '[{"text": "The theory that the best action maximizes overall happiness", "correct": true}, {"text": "The theory that morality comes from God''s commands"}, {"text": "The theory that only self-interest matters"}, {"text": "The theory that tradition determines morality"}]',
  'Utilitarianism, developed by Jeremy Bentham and John Stuart Mill, judges actions by their consequences — specifically, whether they produce the greatest happiness for the greatest number.',
  '{"1": "Morality from God''s commands is divine command theory.", "2": "Only self-interest mattering is ethical egoism.", "3": "Tradition determining morality is a form of moral conservatism or conventionalism."}'),

('politics', 2, 'What is the social contract theory?',
  '[{"text": "The idea that political authority arises from an agreement among individuals", "correct": true}, {"text": "A legal document between nations"}, {"text": "A theory about economic markets"}, {"text": "A religious covenant with God"}]',
  'Social contract theory, developed by Hobbes, Locke, and Rousseau, argues that legitimate political authority is based on a voluntary agreement among free individuals to form a government.',
  '{"1": "Treaties between nations are international agreements, not the philosophical social contract.", "2": "Economic market theory is a separate domain from political legitimacy.", "3": "A religious covenant is a theological concept, not a secular political theory."}'),

('aesthetics', 2, 'What did Kant mean by "disinterested pleasure" in his theory of beauty?',
  '[{"text": "Appreciating beauty without desire to possess or use the object", "correct": true}, {"text": "Finding no pleasure in art"}, {"text": "Being bored by beautiful things"}, {"text": "Preferring ugliness over beauty"}]',
  'Kant argued in the "Critique of Judgment" that true aesthetic appreciation is free from personal desire, utility, or moral judgment — we appreciate beauty for its own sake.',
  '{"1": "Disinterested does not mean uninterested; it means free from personal stake.", "2": "Kant valued aesthetic experience highly, not boredom.", "3": "Kant celebrated beauty as a bridge between the sensory and the rational."}'),

('applied', 2, 'What is the trolley problem in applied ethics?',
  '[{"text": "A thought experiment about whether to divert a trolley to kill one person instead of five", "correct": true}, {"text": "A problem about public transportation funding"}, {"text": "An economic theory about supply and demand"}, {"text": "A legal case about railway negligence"}]',
  'The trolley problem, introduced by Philippa Foot, tests moral intuitions about action vs. inaction, consequentialism vs. deontology, and the moral weight of killing vs. letting die.',
  '{"1": "It has nothing to do with actual transportation policy.", "2": "It is an ethics problem, not an economics problem.", "3": "It is a thought experiment, not a real legal case."}'),

('history', 2, 'What period is known as the Age of Enlightenment?',
  '[{"text": "The 17th-18th century intellectual movement emphasizing reason and individual rights", "correct": true}, {"text": "The ancient Greek golden age"}, {"text": "The medieval period of religious scholarship"}, {"text": "The 20th century postmodern era"}]',
  'The Enlightenment (roughly 1685-1815) championed reason, science, individual liberty, and skepticism of authority. Key figures include Locke, Voltaire, Montesquieu, Hume, and Kant.',
  '{"1": "Ancient Greece was the classical period, preceding the Enlightenment by 2000 years.", "2": "Medieval religious scholarship is the Scholastic period, which preceded the Enlightenment.", "3": "Postmodernism emerged in the mid-20th century as a reaction against Enlightenment certainties."}'),

('american_exceptionalism', 2, 'What philosophical principle underlies the First Amendment?',
  '[{"text": "That individual liberty of thought and expression is an inalienable right", "correct": true}, {"text": "That the government should control information"}, {"text": "That religion should guide all laws"}, {"text": "That only certain speech deserves protection"}]',
  'The First Amendment protects freedom of speech, religion, press, assembly, and petition — rooted in Enlightenment principles that individuals have natural rights that precede government authority.',
  '{"1": "Government control of information is censorship, the opposite of First Amendment principles.", "2": "The Establishment Clause specifically prevents religion from guiding laws.", "3": "The First Amendment protects speech broadly, not selectively."}'),

('virtues', 2, 'What is the Aristotelian concept of the "golden mean"?',
  '[{"text": "Virtue as the balance between two extremes of excess and deficiency", "correct": true}, {"text": "The average income in a just society"}, {"text": "The middle point of a mathematical equation"}, {"text": "A type of ancient Greek currency"}]',
  'Aristotle argued in the "Nicomachean Ethics" that every virtue is a mean between two vices. Courage is the mean between cowardice (deficiency) and recklessness (excess).',
  '{"1": "This is an ethical concept, not an economic one.", "2": "The golden mean is a moral principle, not a mathematical one.", "3": "It has nothing to do with currency or economics."}'),

('economics', 2, 'What is laissez-faire economics?',
  '[{"text": "The doctrine that government should not interfere in free market operations", "correct": true}, {"text": "A system where the government controls all production"}, {"text": "An economic theory based on equal distribution of wealth"}, {"text": "A monetary policy focused on gold reserves"}]',
  'Laissez-faire (French for "let do") advocates minimal government intervention in economic affairs, trusting free markets and voluntary exchange to allocate resources efficiently.',
  '{"1": "Government control of production is socialism or communism.", "2": "Equal distribution of wealth is egalitarianism or redistributive economics.", "3": "Gold-based monetary policy is the gold standard, a separate concept."}'),

('law', 2, 'What is natural law theory?',
  '[{"text": "The view that certain rights and moral values are inherent in human nature and discoverable by reason", "correct": true}, {"text": "The study of environmental regulations"}, {"text": "The idea that laws should be based on majority vote only"}, {"text": "A theory about the laws of physics"}]',
  'Natural law theory, from Aristotle through Aquinas to Locke, holds that moral principles are objective, universal, and discoverable through reason — they exist independently of any government.',
  '{"1": "Environmental law is a modern legal field, not the philosophical tradition of natural law.", "2": "Majority vote determining law is legal positivism or democratic theory.", "3": "Laws of physics are natural sciences, not natural law philosophy."}'),

('music', 2, 'Which philosophical movement influenced the Romantic era of classical music?',
  '[{"text": "Romanticism — emphasizing emotion, individualism, and the sublime", "correct": true}, {"text": "Logical positivism"}, {"text": "Scholasticism"}, {"text": "Behaviorism"}]',
  'Romantic composers like Beethoven, Chopin, and Wagner drew from the Romantic philosophical movement that valued intense emotion, individual expression, nature, and the transcendent sublime.',
  '{"1": "Logical positivism emerged in the 20th century, long after the Romantic era.", "2": "Scholasticism was a medieval philosophical method focused on reason and theology.", "3": "Behaviorism is a 20th-century psychological theory, not a philosophical influence on Romantic music."}'),

('cinema', 2, 'Which Akira Kurosawa film explores the subjective nature of truth through contradictory accounts of the same event?',
  '[{"text": "Rashomon", "correct": true}, {"text": "Seven Samurai"}, {"text": "Ikiru"}, {"text": "Yojimbo"}]',
  'Rashomon (1950) presents four contradictory accounts of a crime, questioning whether objective truth is attainable. The "Rashomon effect" became a term for contradictory interpretations of the same event.',
  '{"1": "Seven Samurai is about honor and sacrifice, not epistemological uncertainty.", "2": "Ikiru explores the meaning of life through a dying bureaucrat.", "3": "Yojimbo is an action film about a ronin manipulating rival gangs."}'),

('quotes', 2, 'Who said: "God is dead"?',
  '[{"text": "Friedrich Nietzsche", "correct": true}, {"text": "Karl Marx"}, {"text": "Sigmund Freud"}, {"text": "Jean-Paul Sartre"}]',
  'Nietzsche declared "God is dead" in "The Gay Science" (1882) and "Thus Spoke Zarathustra." He meant that the Enlightenment had undermined the foundations of traditional morality and meaning.',
  '{"1": "Marx called religion ''the opium of the people'' but did not use this phrase.", "2": "Freud analyzed religion psychologically but did not make this specific declaration.", "3": "Sartre was an atheist existentialist but the phrase originates with Nietzsche."}');

-- ============================================================
-- DIFFICULTY 3 — Intermediate concepts, matching ideas to thinkers
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 3, 'What is the problem of universals?',
  '[{"text": "Whether abstract properties like ''redness'' exist independently of particular things", "correct": true}, {"text": "Whether the universe is infinite"}, {"text": "Whether humans can travel faster than light"}, {"text": "Whether democracy works in all cultures"}]',
  'The problem of universals asks whether abstract properties (redness, justice, beauty) exist as real entities (realism) or are merely names we give to similarities among particular things (nominalism).',
  '{"1": "The size of the universe is a cosmological question, not a metaphysical problem about universals.", "2": "Speed of light is a physics question.", "3": "Democracy across cultures is a political science question."}'),

('epistemology', 3, 'What is the Gettier problem?',
  '[{"text": "Cases where justified true belief fails to constitute knowledge", "correct": true}, {"text": "The difficulty of learning foreign languages"}, {"text": "A mathematical paradox about infinity"}, {"text": "The problem of translating ancient texts"}]',
  'Edmund Gettier showed in 1963 that a person can have a justified true belief that is not knowledge — because the justification is coincidental. This challenged the traditional definition of knowledge.',
  '{"1": "Language learning is linguistics, not epistemology.", "2": "Infinity paradoxes are mathematical, not epistemological.", "3": "Translation is hermeneutics, a different philosophical field."}'),

('ethics', 3, 'What is the difference between deontological and consequentialist ethics?',
  '[{"text": "Deontology judges actions by rules and duties; consequentialism judges by outcomes", "correct": true}, {"text": "They are the same theory with different names"}, {"text": "Deontology focuses on God; consequentialism focuses on nature"}, {"text": "Deontology is ancient; consequentialism is medieval"}]',
  'Deontological ethics (Kant) says some actions are inherently right or wrong regardless of outcomes. Consequentialism (Mill, Bentham) says only the results of actions determine their moral worth.',
  '{"1": "They are fundamentally different and often conflicting moral theories.", "2": "Deontology is about duty and rules, not necessarily about God; consequentialism is about results, not nature.", "3": "Both traditions have ancient roots but were systematized in the modern period."}'),

('politics', 3, 'What is John Rawls'' "veil of ignorance"?',
  '[{"text": "A thought experiment where people design society without knowing their place in it", "correct": true}, {"text": "A criticism of democracy"}, {"text": "A theory about media censorship"}, {"text": "A defense of monarchy"}]',
  'Rawls proposed in "A Theory of Justice" (1971) that fair principles of justice are those that rational people would choose if they did not know their own social position, talents, or circumstances.',
  '{"1": "Rawls supported liberal democracy, not criticized it.", "2": "The veil of ignorance is about justice, not media.", "3": "Rawls argued against inherited privilege, the opposite of defending monarchy."}'),

('aesthetics', 3, 'What is the difference between "high art" and "low art" according to traditional aesthetics?',
  '[{"text": "High art is considered intellectually challenging and culturally significant; low art is popular entertainment", "correct": true}, {"text": "High art is expensive; low art is cheap"}, {"text": "High art is three-dimensional; low art is flat"}, {"text": "High art is old; low art is modern"}]',
  'Traditional aesthetics distinguished between fine arts (painting, sculpture, classical music) as intellectually elevated, and popular culture (comics, pop music) as mere entertainment. This distinction has been challenged by postmodern thinkers.',
  '{"1": "Price is not the defining criterion; a cheap painting can be high art.", "2": "Dimensionality has nothing to do with the high/low distinction.", "3": "Age is not the criterion; contemporary work can be high art."}'),

('applied', 3, 'What is the philosophical basis for informed consent in medicine?',
  '[{"text": "Respect for individual autonomy — the patient''s right to make decisions about their own body", "correct": true}, {"text": "The doctor''s right to choose treatment"}, {"text": "Government regulations about paperwork"}, {"text": "Insurance company requirements"}]',
  'Informed consent is grounded in the Kantian principle of autonomy — treating people as ends in themselves, not merely as means. Patients must understand and voluntarily agree to medical interventions.',
  '{"1": "The doctor''s authority is limited by the patient''s autonomy.", "2": "Informed consent is an ethical principle, not merely a regulatory requirement.", "3": "Insurance requirements are administrative, not philosophical."}'),

('history', 3, 'What was the Scholastic method in medieval philosophy?',
  '[{"text": "A method of critical reasoning using dialectical questioning to resolve contradictions between authorities", "correct": true}, {"text": "A system of physical education"}, {"text": "A method of farming"}, {"text": "A type of military training"}]',
  'Scholasticism, practiced by thinkers like Thomas Aquinas and Peter Abelard, combined Aristotelian logic with Christian theology, using structured debate (quaestiones) to reconcile apparent contradictions.',
  '{"1": "Scholasticism was intellectual, not physical.", "2": "Medieval farming had its own methods but was unrelated to Scholastic philosophy.", "3": "Military training was separate from the university-based Scholastic tradition."}'),

('american_exceptionalism', 3, 'What philosophical idea distinguishes the American founding from the French Revolution?',
  '[{"text": "The American Revolution protected individual natural rights; the French Revolution pursued collective ''general will''", "correct": true}, {"text": "The American Revolution was violent; the French was peaceful"}, {"text": "They had identical philosophies"}, {"text": "The French Revolution came first"}]',
  'The American founders (influenced by Locke) sought to protect pre-existing individual rights through limited government. The French revolutionaries (influenced by Rousseau) sought to remake society through the collective general will, leading to the Terror.',
  '{"1": "Both revolutions were violent, but the French Revolution''s violence was far more extreme.", "2": "Their philosophies were fundamentally different in their view of individual vs. collective rights.", "3": "The American Revolution (1776) preceded the French Revolution (1789)."}'),

('virtues', 3, 'What is the Stoic concept of "apatheia"?',
  '[{"text": "Freedom from destructive passions through rational self-mastery", "correct": true}, {"text": "Complete emotional numbness"}, {"text": "Laziness and indifference"}, {"text": "Physical endurance training"}]',
  'Stoic apatheia does not mean apathy in the modern sense. It means freedom from irrational passions (pathos) that distort judgment — achieved through aligning one''s will with reason and nature.',
  '{"1": "Stoics did not advocate emotional numbness; they distinguished between rational emotions (eupatheiai) and destructive passions.", "2": "Stoics valued active engagement with life, not laziness.", "3": "While Stoics valued physical hardship as training, apatheia is specifically about emotional mastery."}'),

('economics', 3, 'What is the "invisible hand" concept from Adam Smith?',
  '[{"text": "Individuals pursuing self-interest unintentionally promote the public good through market mechanisms", "correct": true}, {"text": "A secret government body controlling the economy"}, {"text": "A supernatural force guiding trade"}, {"text": "A banking regulation from the 18th century"}]',
  'Smith argued that when individuals freely pursue their own economic interests, the competitive market channels their actions toward outcomes that benefit society — without central planning.',
  '{"1": "The invisible hand is a metaphor for emergent order, not a conspiracy.", "2": "Smith was describing a natural economic process, not supernatural intervention.", "3": "It is a theoretical concept, not a regulation."}'),

('law', 3, 'What is legal positivism?',
  '[{"text": "The theory that law is a set of rules created by human authority, separate from morality", "correct": true}, {"text": "The belief that only positive emotions should guide law"}, {"text": "A theory that laws of nature are the only real laws"}, {"text": "The idea that judges should always be optimistic"}]',
  'Legal positivism (Austin, Hart, Kelsen) holds that law is what is enacted by legitimate authority — its validity does not depend on its moral content. This contrasts with natural law theory.',
  '{"1": "The word ''positive'' refers to ''posited'' (enacted by humans), not emotional positivity.", "2": "Natural law theory claims moral principles are real laws; legal positivism disagrees.", "3": "Judicial temperament is irrelevant to legal positivism."}'),

('music', 3, 'How did John Cage''s "4''33" challenge traditional aesthetics?',
  '[{"text": "By presenting silence as music, questioning what constitutes art and the role of the audience", "correct": true}, {"text": "By being the longest symphony ever composed"}, {"text": "By using only electronic instruments"}, {"text": "By being performed underwater"}]',
  'Cage''s 4''33" (1952) consists of four minutes and thirty-three seconds of silence. It challenges the boundary between music and non-music, art and non-art, forcing the audience to hear ambient sounds as the composition.',
  '{"1": "It is one of the shortest compositions, not the longest.", "2": "No instruments are played at all, electronic or otherwise.", "3": "It is performed on a conventional stage."}'),

('cinema', 3, 'What philosophical school is most associated with the films of Andrei Tarkovsky?',
  '[{"text": "Existentialism and spiritual phenomenology — exploring time, memory, and transcendence", "correct": true}, {"text": "Logical positivism"}, {"text": "Marxist materialism"}, {"text": "Analytic philosophy"}]',
  'Tarkovsky''s films (Stalker, Solaris, Mirror) meditate on existential themes: the search for meaning, the nature of time and memory, spiritual longing, and the tension between material and transcendent reality.',
  '{"1": "Logical positivism rejects metaphysical speculation, which Tarkovsky embraced.", "2": "Though Tarkovsky worked in the Soviet Union, his films rejected Marxist materialism in favor of spiritual exploration.", "3": "Analytic philosophy focuses on language and logic, not the cinematic themes Tarkovsky explored."}'),

('quotes', 3, 'Who wrote: "Hell is other people"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Simone de Beauvoir"}, {"text": "Martin Heidegger"}]',
  'Sartre wrote this in his play "No Exit" (1944). It means that we are perpetually judged and defined by others'' perceptions of us, which limits our freedom to define ourselves.',
  '{"1": "Camus explored absurdity and revolt but this specific line is Sartre''s.", "2": "Beauvoir was Sartre''s partner and fellow existentialist but did not write this line.", "3": "Heidegger''s concept of ''Das Man'' (the They) is related but this quote is Sartre''s."}');

-- ============================================================
-- DIFFICULTY 4 — Connecting ideas, understanding arguments
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 4, 'What is the Ship of Theseus problem?',
  '[{"text": "Whether an object that has had all its parts replaced remains the same object", "correct": true}, {"text": "A historical question about Greek naval warfare"}, {"text": "A problem in fluid dynamics"}, {"text": "An astronomical puzzle about constellation names"}]',
  'If every plank of Theseus''s ship is gradually replaced, is it still the same ship? This ancient puzzle probes the nature of identity and persistence through change.',
  '{"1": "It uses a ship as a thought experiment, not as a historical topic.", "2": "It is a metaphysical problem, not a physics problem.", "3": "It has nothing to do with astronomy."}'),

('epistemology', 4, 'What is Descartes'' "evil demon" hypothesis?',
  '[{"text": "The possibility that an omnipotent deceiver makes us believe false things are true, casting doubt on all sensory knowledge", "correct": true}, {"text": "A religious doctrine about Satan"}, {"text": "A theory about mental illness"}, {"text": "A political conspiracy theory"}]',
  'Descartes proposed this in the "Meditations" as the most radical form of skeptical doubt. If a powerful demon could deceive us about everything, what can we know for certain? Only the cogito survives.',
  '{"1": "It is a philosophical thought experiment, not a religious claim.", "2": "It is about the limits of knowledge, not psychological disorders.", "3": "It is epistemological skepticism, not a conspiracy theory."}'),

('ethics', 4, 'What is the "is-ought problem" identified by David Hume?',
  '[{"text": "The gap between descriptive facts about the world and prescriptive moral claims", "correct": true}, {"text": "The difficulty of being morally perfect"}, {"text": "A problem in mathematics"}, {"text": "The conflict between science and religion"}]',
  'Hume observed that many arguments illegitimately derive "ought" (moral) conclusions from "is" (factual) premises. You cannot logically derive what should be from what is without additional moral premises.',
  '{"1": "The is-ought problem is about logical reasoning, not personal moral achievement.", "2": "It is a philosophical problem, not a mathematical one.", "3": "While related to reason vs. faith debates, it is specifically about the logic of moral reasoning."}'),

('politics', 4, 'What is the difference between negative and positive liberty?',
  '[{"text": "Negative liberty is freedom from interference; positive liberty is freedom to achieve one''s potential", "correct": true}, {"text": "Negative liberty is bad; positive liberty is good"}, {"text": "Negative liberty is ancient; positive liberty is modern"}, {"text": "They are identical concepts"}]',
  'Isaiah Berlin distinguished these in "Two Concepts of Liberty" (1958). Negative liberty (Locke, Mill) means absence of external constraints. Positive liberty (Rousseau, Marx) means having the capacity and resources to act.',
  '{"1": "Neither is inherently good or bad; Berlin warned that positive liberty can justify totalitarianism.", "2": "Both concepts have roots in ancient and modern thought.", "3": "They are fundamentally different and often in tension with each other."}'),

('aesthetics', 4, 'What is the concept of the "sublime" in aesthetics?',
  '[{"text": "An experience of awe and terror before something vast or powerful that transcends ordinary beauty", "correct": true}, {"text": "A type of chemical reaction"}, {"text": "A musical note"}, {"text": "A cooking technique"}]',
  'Edmund Burke and Kant analyzed the sublime as an aesthetic experience distinct from beauty — it involves overwhelming power, vastness, or danger that simultaneously attracts and terrifies.',
  '{"1": "Sublimation is a chemical process; the sublime is an aesthetic concept.", "2": "The sublime is a philosophical category, not a musical term.", "3": "The sublime has nothing to do with cooking."}'),

('applied', 4, 'What is the "precautionary principle" in environmental ethics?',
  '[{"text": "When an action risks harm to the public or environment, precaution should be taken even without full scientific certainty", "correct": true}, {"text": "Always choose the cheapest option"}, {"text": "Never take any risks under any circumstances"}, {"text": "Only act when there is 100% certainty of safety"}]',
  'The precautionary principle shifts the burden of proof: those proposing an action must demonstrate it is not harmful, rather than requiring victims to prove harm after the fact.',
  '{"1": "Cost is not the determining factor; safety and environmental protection are.", "2": "It does not prohibit all risk, only argues for caution under uncertainty.", "3": "It acknowledges that 100% certainty is often impossible and decisions must still be made."}'),

('history', 4, 'What was the significance of the trial of Socrates?',
  '[{"text": "It demonstrated the conflict between philosophical inquiry and democratic conformity", "correct": true}, {"text": "It established the first court system"}, {"text": "It proved that democracy always works"}, {"text": "It led to the founding of Rome"}]',
  'Socrates was tried and executed by Athenian democracy in 399 BC for "corrupting the youth" and "impiety." It showed that majority rule can suppress individual thought — a founding insight of political philosophy.',
  '{"1": "Courts existed before Socrates; Athens already had a legal system.", "2": "The trial showed a failure of democracy, not its success.", "3": "The trial had no connection to Roman history."}'),

('american_exceptionalism', 4, 'How does the concept of "checks and balances" reflect philosophical skepticism about human nature?',
  '[{"text": "It assumes that power corrupts, so no single branch should hold unchecked authority", "correct": true}, {"text": "It assumes all people are naturally good"}, {"text": "It was designed to make government faster"}, {"text": "It was copied directly from the British monarchy"}]',
  'The founders, influenced by Montesquieu and drawing on Calvinist skepticism about human goodness, designed separation of powers to prevent tyranny by dividing authority among competing branches.',
  '{"1": "The system assumes the opposite — that people in power will tend toward abuse without constraints.", "2": "Checks and balances deliberately slow government to prevent hasty tyranny.", "3": "It was inspired by Montesquieu''s analysis of the British system but redesigned as a republic, not a monarchy."}'),

('virtues', 4, 'What is Aristotle''s concept of "eudaimonia"?',
  '[{"text": "Human flourishing through the practice of virtue over a complete life", "correct": true}, {"text": "A type of Greek dance"}, {"text": "A form of government"}, {"text": "A mathematical theorem"}]',
  'Eudaimonia is often translated as "happiness" but more accurately means "flourishing" or "living well." For Aristotle, it is achieved by exercising the virtues consistently throughout one''s life.',
  '{"1": "Eudaimonia is a philosophical concept, not a dance.", "2": "It is about individual human excellence, not political organization.", "3": "It is an ethical concept, not a mathematical one."}'),

('economics', 4, 'What is Frederic Bastiat''s "broken window fallacy"?',
  '[{"text": "The error of thinking that destruction creates economic benefit because it stimulates repair spending", "correct": true}, {"text": "A theory about window manufacturing"}, {"text": "A tax policy about property damage"}, {"text": "An architectural principle"}]',
  'Bastiat showed that while a broken window creates work for the glazier, the money spent on repair would have been spent elsewhere more productively. Destruction diverts resources; it does not create wealth.',
  '{"1": "It is an economics lesson, not about manufacturing.", "2": "It is a thought experiment about economic reasoning, not a specific tax policy.", "3": "It has nothing to do with architecture."}'),

('law', 4, 'What is "jury nullification"?',
  '[{"text": "When a jury acquits a defendant despite evidence of guilt, because they believe the law itself is unjust", "correct": true}, {"text": "When a jury is dismissed for misconduct"}, {"text": "When a judge overrules the jury"}, {"text": "When all jurors vote guilty"}]',
  'Jury nullification is the power of juries to act as a check on unjust laws. Historically used to resist the Fugitive Slave Act — jurors refused to convict those who helped escaped slaves.',
  '{"1": "Jury dismissal is a procedural matter, not nullification.", "2": "A judge overruling a jury is a directed verdict, not nullification.", "3": "Unanimous guilty verdicts are convictions, the opposite of nullification."}'),

('music', 4, 'What philosophical tension does Wagner''s concept of "Gesamtkunstwerk" attempt to resolve?',
  '[{"text": "The separation between individual art forms, by fusing music, drama, poetry, and visual art into a total work", "correct": true}, {"text": "The conflict between German and Italian opera"}, {"text": "The disagreement about tuning systems"}, {"text": "The rivalry between orchestras"}]',
  'Wagner''s Gesamtkunstwerk (total work of art) aimed to reunify arts that had been separated since ancient Greek drama, creating an immersive experience that elevates the audience beyond individual senses.',
  '{"1": "While Wagner competed with Italian opera, Gesamtkunstwerk is about synthesis of art forms, not national rivalry.", "2": "Tuning systems are acoustic/technical, not what Gesamtkunstwerk addresses.", "3": "Orchestral rivalry is institutional, not philosophical."}'),

('cinema', 4, 'How does Stanley Kubrick''s "2001: A Space Odyssey" engage with philosophy of technology?',
  '[{"text": "By showing technology as both humanity''s greatest tool and existential threat through HAL 9000", "correct": true}, {"text": "By documenting actual space missions"}, {"text": "By promoting space tourism"}, {"text": "By criticizing all forms of technology"}]',
  'Kubrick''s film traces humanity''s evolution alongside tools — from bone weapons to AI — suggesting technology is inseparable from human progress but also poses risks when it surpasses human control.',
  '{"1": "The film is fiction, not a documentary.", "2": "It is a philosophical meditation, not a promotional film.", "3": "Kubrick does not reject technology; he examines its dual nature."}'),

('quotes', 4, 'Who wrote: "Man is condemned to be free"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Friedrich Nietzsche"}, {"text": "Martin Heidegger"}]',
  'Sartre wrote this in "Existentialism Is a Humanism" (1946). Because there is no predetermined human nature or divine plan, we are radically free — and radically responsible for our choices.',
  '{"1": "Camus explored freedom through the lens of absurdity, but this specific formulation is Sartre''s.", "2": "Nietzsche celebrated freedom but did not frame it as condemnation.", "3": "Heidegger discussed ''thrownness'' (Geworfenheit) but not ''condemnation to freedom.''"}');

-- ============================================================
-- DIFFICULTY 5 — Advanced concepts, nuanced distinctions
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 5, 'What is the difference between ontological and cosmological arguments for God''s existence?',
  '[{"text": "Ontological argues from the concept of a perfect being; cosmological argues from the existence of the universe needing a cause", "correct": true}, {"text": "They are identical arguments"}, {"text": "Ontological is scientific; cosmological is religious"}, {"text": "Ontological is Eastern; cosmological is Western"}]',
  'Anselm''s ontological argument reasons purely from the concept of God as the greatest conceivable being. Aquinas''s cosmological argument reasons from observable facts — things exist, change happens — to a necessary first cause.',
  '{"1": "They are structurally different types of arguments.", "2": "Both are philosophical, not scientific; neither is purely religious.", "3": "Both originate in Western philosophy."}'),

('epistemology', 5, 'What is the difference between internalism and externalism in epistemology?',
  '[{"text": "Internalism requires the knower to have cognitive access to their justification; externalism does not", "correct": true}, {"text": "Internalism is subjective; externalism is about the external world"}, {"text": "They are competing theories in physics"}, {"text": "Internalism is Eastern philosophy; externalism is Western"}]',
  'Internalists hold that justification must be mentally accessible to the believer. Externalists (like reliabilists) hold that a belief can be justified by a reliable process even if the believer cannot articulate why.',
  '{"1": "Both are about the conditions for knowledge, not about subjectivity vs. objectivity directly.", "2": "These are epistemological theories, not physics.", "3": "Both are debates within Western analytic epistemology."}'),

('ethics', 5, 'What is the "demandingness objection" against utilitarianism?',
  '[{"text": "That utilitarianism requires too much self-sacrifice by demanding we always maximize overall happiness", "correct": true}, {"text": "That utilitarianism is too easy to follow"}, {"text": "That utilitarianism conflicts with mathematics"}, {"text": "That utilitarianism was invented too recently"}]',
  'If we must always act to maximize total happiness, we should donate most of our income, never rest when others suffer, and constantly sacrifice personal projects. Critics argue this exceeds reasonable moral demands.',
  '{"1": "The objection is precisely that it demands too much, not too little.", "2": "Utilitarianism is a philosophical theory; it does not conflict with mathematics.", "3": "Utilitarianism dates to the 18th century, which is not the issue."}'),

('politics', 5, 'What is the difference between libertarianism and classical liberalism?',
  '[{"text": "Both value individual liberty, but classical liberalism accepts a minimal state while some libertarians advocate for no state at all", "correct": true}, {"text": "They are completely identical"}, {"text": "Libertarianism is left-wing; classical liberalism is right-wing"}, {"text": "Classical liberalism opposes all markets"}]',
  'Classical liberals (Locke, Smith, Mill) accept a limited government to protect rights. Libertarians range from minarchists (minimal state) to anarcho-capitalists (no state). They share roots but differ on the role of government.',
  '{"1": "They overlap significantly but are not identical.", "2": "Both span the political spectrum; neither is purely left or right.", "3": "Classical liberalism was built on free market principles."}'),

('aesthetics', 5, 'What is Walter Benjamin''s concept of "aura" in art?',
  '[{"text": "The unique presence and authenticity of an original work that is diminished by mechanical reproduction", "correct": true}, {"text": "A visual glow around paintings"}, {"text": "The frame of a picture"}, {"text": "The price of artwork at auction"}]',
  'In "The Work of Art in the Age of Mechanical Reproduction" (1935), Benjamin argued that photography and film destroy the "aura" — the unique, unrepeatable presence of the original — transforming art''s social function.',
  '{"1": "Aura is a theoretical concept about authenticity, not a literal visual effect.", "2": "Framing is a physical element, not what Benjamin meant.", "3": "Market value is economic, not what Benjamin analyzed."}'),

('applied', 5, 'What is the philosophical problem with "algorithmic bias"?',
  '[{"text": "Algorithms can perpetuate and amplify existing social prejudices embedded in their training data, raising questions about justice and responsibility", "correct": true}, {"text": "Algorithms are always perfectly fair"}, {"text": "Only humans can be biased, never machines"}, {"text": "Bias only exists in political contexts"}]',
  'When AI systems learn from historically biased data, they reproduce those biases at scale. This raises questions about distributive justice, accountability, and whether we can build truly neutral systems.',
  '{"1": "Algorithms reflect the data and design choices of their creators, which can be biased.", "2": "Machines inherit biases from their human-created training data and design.", "3": "Bias exists in many contexts — economic, social, algorithmic, not just political."}'),

('history', 5, 'How did the rediscovery of Aristotle in the 12th century transform European philosophy?',
  '[{"text": "It introduced systematic empirical reasoning into a tradition dominated by Platonic idealism and theology", "correct": true}, {"text": "It had no effect whatsoever"}, {"text": "It ended all philosophical inquiry"}, {"text": "It replaced Christianity with paganism"}]',
  'Aristotle''s works, preserved by Islamic scholars, reintroduced logic, natural philosophy, and empirical methodology to medieval Europe. Aquinas synthesized Aristotle with Christianity, creating Scholasticism.',
  '{"1": "It had enormous transformative effects on European thought.", "2": "It invigorated philosophy, not ended it.", "3": "Aquinas integrated Aristotle with Christianity rather than replacing it."}'),

('american_exceptionalism', 5, 'How does the American concept of "ordered liberty" differ from pure libertarianism?',
  '[{"text": "Ordered liberty holds that freedom requires a framework of law and institutional constraints to prevent license from destroying liberty itself", "correct": true}, {"text": "They are identical"}, {"text": "Ordered liberty opposes all freedom"}, {"text": "Pure libertarianism supports government control"}]',
  'The founders believed liberty without law becomes anarchy, which leads to tyranny. Constitutional limits, separation of powers, and rule of law create the structure within which individual freedom flourishes.',
  '{"1": "They share values but ordered liberty accepts institutional constraints that some libertarians reject.", "2": "Ordered liberty champions freedom within a constitutional framework.", "3": "Pure libertarianism opposes government control, which is why it differs from ordered liberty."}'),

('virtues', 5, 'What is the difference between Aristotelian virtue ethics and Stoic virtue ethics?',
  '[{"text": "Aristotle held that external goods contribute to flourishing; Stoics held that virtue alone is sufficient for happiness", "correct": true}, {"text": "They are identical"}, {"text": "Aristotle rejected virtue; Stoics embraced it"}, {"text": "Stoics came before Aristotle"}]',
  'Aristotle argued that health, wealth, and friends contribute to eudaimonia alongside virtue. Stoics like Epictetus and Marcus Aurelius held that virtue alone guarantees happiness, regardless of external circumstances.',
  '{"1": "Both are virtue ethics traditions but differ on the role of external goods.", "2": "Aristotle was the founder of systematic virtue ethics.", "3": "Aristotle (384-322 BC) preceded the Stoic school (founded ~300 BC)."}'),

('economics', 5, 'What is the Austrian School''s critique of central economic planning?',
  '[{"text": "That no central authority can possess the dispersed local knowledge needed to allocate resources efficiently", "correct": true}, {"text": "That planning is morally wrong"}, {"text": "That mathematics cannot be applied to economics"}, {"text": "That only monarchy can manage an economy"}]',
  'Hayek''s "knowledge problem" argues that economic knowledge is dispersed among millions of individuals. No central planner can aggregate this knowledge; only market prices can transmit it efficiently.',
  '{"1": "The critique is epistemic (about knowledge), not primarily moral.", "2": "Austrian economists use mathematical reasoning; the critique is about information, not math.", "3": "Austrian economists advocate free markets, not monarchy."}'),

('law', 5, 'What is the difference between "rule of law" and "rule by law"?',
  '[{"text": "Rule of law means law constrains everyone including rulers; rule by law means rulers use law as a tool of power", "correct": true}, {"text": "They are synonyms"}, {"text": "Rule of law is ancient; rule by law is modern"}, {"text": "Rule by law is more democratic"}]',
  'Rule of law implies that law is supreme — no one is above it. Rule by law means the government uses law instrumentally to control the population while exempting itself. The distinction is fundamental to liberty.',
  '{"1": "They are opposite concepts despite similar wording.", "2": "Both concepts appear throughout history.", "3": "Rule by law can be authoritarian, the opposite of democratic."}'),

('music', 5, 'How does Theodor Adorno''s critique of popular music relate to the Frankfurt School''s broader philosophy?',
  '[{"text": "Adorno argued that mass-produced music creates passive consumers, serving as a tool of cultural domination that prevents critical thinking", "correct": true}, {"text": "Adorno loved all popular music"}, {"text": "The Frankfurt School had no interest in culture"}, {"text": "Adorno argued music has no social significance"}]',
  'Adorno saw the "culture industry" as producing standardized entertainment that pacifies the masses and prevents them from questioning capitalist social relations — art becomes a commodity rather than a vehicle for truth.',
  '{"1": "Adorno was famously critical of popular music, especially jazz and Tin Pan Alley.", "2": "Cultural critique was central to the Frankfurt School''s project.", "3": "Adorno believed music had enormous social and political significance."}'),

('cinema', 5, 'What philosophical concept does the "auteur theory" of cinema embody?',
  '[{"text": "That the director is the primary creative author of a film, expressing a personal philosophical vision through their body of work", "correct": true}, {"text": "That films should have no director"}, {"text": "That only documentaries are real cinema"}, {"text": "That audiences create the meaning of films"}]',
  'The auteur theory (Cahiers du Cinéma, Andrew Sarris) applies the Romantic concept of artistic genius to cinema — the director''s personal vision, recurring themes, and style constitute authorship comparable to a novelist or painter.',
  '{"1": "Auteur theory elevates the director, not eliminates them.", "2": "Auteur theory applies to all cinema, not just documentaries.", "3": "While audience interpretation matters, auteur theory focuses on the director''s intentional vision."}'),

('quotes', 5, 'Who wrote: "Entities should not be multiplied beyond necessity"?',
  '[{"text": "William of Ockham", "correct": true}, {"text": "Thomas Aquinas"}, {"text": "Roger Bacon"}, {"text": "Duns Scotus"}]',
  'This principle, known as Occam''s Razor, advocates parsimony in explanation — the simplest theory that fits the evidence should be preferred. It remains a cornerstone of scientific and philosophical reasoning.',
  '{"1": "Aquinas was a contemporary but favored more elaborate metaphysical systems.", "2": "Roger Bacon was an empiricist but did not formulate this principle.", "3": "Duns Scotus was a rival Scholastic philosopher with different methodological commitments."}');

-- ============================================================
-- DIFFICULTY 6 — Cross-tradition comparisons, deeper analysis
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 6, 'How does Leibniz''s principle of sufficient reason differ from Hume''s regularity theory of causation?',
  '[{"text": "Leibniz holds that everything has a reason for being as it is; Hume argues we only observe constant conjunction, not genuine causation", "correct": true}, {"text": "They agree on everything"}, {"text": "Hume believed in rational necessity; Leibniz was an empiricist"}, {"text": "Neither philosopher discussed causation"}]',
  'Leibniz was a rationalist who believed reality is structured by logical necessity. Hume was an empiricist who argued that causation is merely a habit of mind — we never perceive the necessary connection itself.',
  '{"1": "They fundamentally disagreed on the nature of causation.", "2": "Their positions are reversed: Leibniz was the rationalist, Hume the empiricist.", "3": "Both extensively discussed causation."}'),

('epistemology', 6, 'What is the "brain in a vat" thought experiment and which historical argument does it update?',
  '[{"text": "A modern version of Descartes'' evil demon: you might be a disembodied brain being fed false experiences by a computer", "correct": true}, {"text": "An experiment in neurosurgery"}, {"text": "A theory about artificial intelligence creation"}, {"text": "A dietary philosophy"}]',
  'Hilary Putnam''s "brain in a vat" scenario modernizes Cartesian skepticism. It asks: how can you know you are not a brain being electrically stimulated to experience an illusory world? Putnam used it to argue for semantic externalism.',
  '{"1": "It is a thought experiment, not an actual surgical procedure.", "2": "It questions knowledge of reality, not how to build AI.", "3": "It has nothing to do with diet."}'),

('ethics', 6, 'How does Bernard Williams'' critique of utilitarianism through "integrity" differ from Kantian objections?',
  '[{"text": "Williams argues utilitarianism alienates people from their deepest commitments; Kant objects that it fails to respect persons as ends in themselves", "correct": true}, {"text": "Williams and Kant agree completely"}, {"text": "Williams is a utilitarian; Kant is a nihilist"}, {"text": "Neither criticized utilitarianism"}]',
  'Williams argued that by demanding we always maximize aggregate welfare, utilitarianism destroys personal integrity — our ground projects and commitments that make life meaningful. Kant''s objection is about treating people merely as means.',
  '{"1": "They critique utilitarianism from different angles — personal integrity vs. respect for persons.", "2": "Williams was a critic of utilitarianism; Kant was a deontologist, not a nihilist.", "3": "Both were famous critics of utilitarian moral theory."}'),

('politics', 6, 'What is the difference between communitarianism and liberalism in political philosophy?',
  '[{"text": "Liberalism prioritizes individual rights and autonomy; communitarianism argues that identity and morality are shaped by community membership", "correct": true}, {"text": "They are the same theory"}, {"text": "Communitarianism rejects all community"}, {"text": "Liberalism opposes individual rights"}]',
  'Communitarians (MacIntyre, Sandel, Taylor) criticize liberal individualism for ignoring how communities shape identity, values, and moral reasoning. Liberals (Rawls, Dworkin) argue that individual rights must be protected from communal pressure.',
  '{"1": "They represent fundamentally different orientations toward the individual-community relationship.", "2": "Communitarianism champions community; the name itself indicates this.", "3": "Liberalism is built on individual rights — that is its core commitment."}'),

('aesthetics', 6, 'What is Heidegger''s concept of art as "the setting-into-work of truth"?',
  '[{"text": "Art reveals truths about being and existence that cannot be captured by scientific or propositional knowledge", "correct": true}, {"text": "Art is merely decorative"}, {"text": "Truth can only be found in mathematics"}, {"text": "Art should represent photographs exactly"}]',
  'In "The Origin of the Work of Art," Heidegger argued that great art opens up a world of meaning — it discloses truth about what it means to be, in ways that science and logic cannot articulate.',
  '{"1": "Heidegger held art to be one of the highest forms of truth-disclosure.", "2": "Heidegger explicitly argued against reducing truth to logical or mathematical propositions.", "3": "Heidegger valued art''s capacity to reveal, not to copy appearances."}'),

('applied', 6, 'What is the "repugnant conclusion" in population ethics?',
  '[{"text": "That for any population of happy people, a much larger population with barely worth-living lives would have greater total utility", "correct": true}, {"text": "A conclusion about pollution"}, {"text": "A theory about criminal sentencing"}, {"text": "An argument against vegetarianism"}]',
  'Derek Parfit''s "repugnant conclusion" shows that total utilitarianism implies we should prefer a world of billions of people with minimally positive lives over a smaller world of very happy people — because the total happiness is greater.',
  '{"1": "It is about population ethics and utility, not environmental pollution.", "2": "It concerns the value of different population sizes, not criminal justice.", "3": "It is about aggregate welfare, not dietary choices."}'),

('history', 6, 'How did Islamic philosophy preserve and transform Greek philosophical traditions?',
  '[{"text": "Muslim scholars translated, commented on, and extended Aristotle and Plato, transmitting them to medieval Europe through Spain and Sicily", "correct": true}, {"text": "Islamic civilization had no contact with Greek philosophy"}, {"text": "Muslim scholars destroyed all Greek texts"}, {"text": "Greek philosophy was only preserved in China"}]',
  'Al-Kindi, Al-Farabi, Avicenna, and Averroes translated and critically engaged with Greek works. Averroes'' commentaries on Aristotle were so influential that medieval Europeans called him simply "The Commentator."',
  '{"1": "Islamic scholars were the primary preservers and transmitters of Greek philosophy.", "2": "Muslim scholars devoted enormous effort to preserving and extending Greek texts.", "3": "While Chinese philosophy has its own rich tradition, Greek philosophy was primarily preserved through the Islamic world."}'),

('american_exceptionalism', 6, 'How does Frederick Douglass''s philosophy reconcile natural rights theory with the reality of slavery?',
  '[{"text": "Douglass argued that the Constitution''s principles of liberty were inherently anti-slavery, and that the nation must live up to its own founding ideals", "correct": true}, {"text": "Douglass rejected the Constitution entirely"}, {"text": "Douglass supported slavery"}, {"text": "Douglass was not a philosopher"}]',
  'In "What to the Slave Is the Fourth of July?" Douglass used the founders'' own natural rights philosophy as a weapon against slavery — arguing America''s promise was real but unfulfilled, not inherently flawed.',
  '{"1": "Douglass saw the Constitution as an anti-slavery document that had been betrayed, not one to reject.", "2": "Douglass was one of the most powerful voices against slavery in American history.", "3": "Douglass was a profound political and moral philosopher."}'),

('virtues', 6, 'How does Nietzsche''s "master morality" differ from "slave morality"?',
  '[{"text": "Master morality values strength, nobility, and self-affirmation; slave morality values humility, pity, and resentment of the powerful", "correct": true}, {"text": "They are the same thing"}, {"text": "Master morality is about literal slave ownership"}, {"text": "Nietzsche endorsed slave morality"}]',
  'In "On the Genealogy of Morals," Nietzsche traced morality''s origins to two types: the noble''s self-affirming values and the weak''s reactive resentment (ressentiment) that redefines strength as evil.',
  '{"1": "They are opposing moral frameworks in Nietzsche''s genealogical analysis.", "2": "Nietzsche used these terms philosophically, not literally about slavery as an institution.", "3": "Nietzsche was critical of slave morality as life-denying."}'),

('economics', 6, 'What is the Cantillon Effect and why is it philosophically significant?',
  '[{"text": "New money benefits those who receive it first, increasing inequality — it shows that monetary policy has distributive consequences", "correct": true}, {"text": "A theory about canal building"}, {"text": "A law about restaurant pricing"}, {"text": "A medical theory about blood circulation"}]',
  'Richard Cantillon observed that money enters the economy at specific points, benefiting those closest to the source. By the time it reaches the broader economy, prices have already risen. This reveals that inflation is never neutral.',
  '{"1": "Cantillon was an economist, not an engineer.", "2": "The effect describes monetary distribution, not food pricing.", "3": "Cantillon wrote about economics, not medicine."}'),

('law', 6, 'What is the tension between Hart''s legal positivism and Dworkin''s interpretivism?',
  '[{"text": "Hart says law is a system of rules identified by social facts; Dworkin argues law also includes principles that require moral interpretation", "correct": true}, {"text": "They completely agree"}, {"text": "Hart was a judge; Dworkin was a politician"}, {"text": "Neither contributed to legal philosophy"}]',
  'Hart argued that law consists of primary rules (obligations) and secondary rules (rules about rules), identified by a "rule of recognition." Dworkin countered that hard cases require judges to apply moral principles, not just rules.',
  '{"1": "The Hart-Dworkin debate is one of the most important disagreements in legal philosophy.", "2": "Both were legal philosophers and professors, not judges or politicians.", "3": "Both are among the most influential legal philosophers of the 20th century."}'),

('music', 6, 'What philosophical problem does the concept of "authenticity" in music performance raise?',
  '[{"text": "Whether performing music exactly as the composer intended is possible or desirable, and what constitutes fidelity to a work", "correct": true}, {"text": "Whether musicians should wear costumes"}, {"text": "Whether concerts should be free"}, {"text": "Whether vinyl sounds better than digital"}]',
  'The authenticity debate asks: should we play Bach on period instruments at historical tempos? Or does each performance necessarily interpret and re-create the work? This connects to broader questions about the identity of artworks.',
  '{"1": "The debate is about musical interpretation, not costuming.", "2": "Concert pricing is economic, not philosophical.", "3": "Audio format preferences are technical, not the core philosophical issue."}'),

('cinema', 6, 'How does Terrence Malick''s filmmaking embody Heideggerian phenomenology?',
  '[{"text": "Through meditative attention to being-in-the-world, natural beauty, and the way consciousness is always already embedded in a meaningful environment", "correct": true}, {"text": "By using only dialogue"}, {"text": "By making documentaries about Heidegger"}, {"text": "By avoiding all visual beauty"}]',
  'Malick, who studied philosophy at Harvard and translated Heidegger, creates films (The Tree of Life, The Thin Red Line) that immerse viewers in the experience of being — light, nature, inner monologue — rather than conventional narrative.',
  '{"1": "Malick''s films are known for minimal dialogue and emphasis on visual storytelling.", "2": "Malick makes philosophical fiction films, not documentaries.", "3": "Malick''s films are celebrated for their extraordinary visual beauty."}'),

('quotes', 6, 'Who wrote: "The tradition of all dead generations weighs like a nightmare on the brains of the living"?',
  '[{"text": "Karl Marx", "correct": true}, {"text": "Georg Hegel"}, {"text": "Max Weber"}, {"text": "Antonio Gramsci"}]',
  'Marx wrote this in "The Eighteenth Brumaire of Louis Bonaparte" (1852), arguing that people make history but not under conditions of their choosing — they are constrained by inherited social structures and ideologies.',
  '{"1": "Hegel saw tradition as the progressive unfolding of Spirit, not a nightmare.", "2": "Weber analyzed tradition through bureaucracy and rationalization but did not write this specific line.", "3": "Gramsci developed the concept of cultural hegemony but this quote is Marx''s."}');

-- ============================================================
-- DIFFICULTY 7 — Expert level, obscure works, subtle differences
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 7, 'What is Quine''s critique of the analytic-synthetic distinction?',
  '[{"text": "That no clear boundary exists between truths by definition and truths by fact, undermining a central pillar of logical positivism", "correct": true}, {"text": "That mathematics is useless"}, {"text": "That all philosophy should be abandoned"}, {"text": "That English is superior to other languages"}]',
  'In "Two Dogmas of Empiricism" (1951), Quine argued that the supposed distinction between analytic truths (true by meaning) and synthetic truths (true by fact) cannot be sustained — all beliefs face empirical evidence as a whole.',
  '{"1": "Quine valued mathematics highly; he was a logician.", "2": "Quine sought to reform philosophy, not abandon it.", "3": "Quine''s argument is about the structure of knowledge, not about any natural language."}'),

('epistemology', 7, 'What is Alvin Goldman''s process reliabilism?',
  '[{"text": "A belief is justified if it is produced by a cognitive process that reliably produces true beliefs, regardless of whether the believer knows this", "correct": true}, {"text": "A theory about reliable computer systems"}, {"text": "A method for testing physical products"}, {"text": "A type of statistical analysis"}]',
  'Goldman proposed that justification depends on the reliability of the belief-forming process (perception, memory, reasoning), not on the believer''s ability to articulate their reasons. This is a form of epistemic externalism.',
  '{"1": "It is about human cognition, not computer science.", "2": "It is epistemological, not about product testing.", "3": "It is a theory of knowledge justification, not a statistical method."}'),

('ethics', 7, 'What is G.E. Moore''s "open question argument" against ethical naturalism?',
  '[{"text": "For any natural property N, it is always meaningful to ask ''Is N good?'' — showing that ''good'' cannot be defined as any natural property", "correct": true}, {"text": "An argument about opening hours of shops"}, {"text": "A debate technique in political campaigns"}, {"text": "A theory about questionnaire design"}]',
  'Moore argued in "Principia Ethica" (1903) that if "good" meant "pleasurable" (or any natural property), then asking "Is pleasure good?" would be trivially true — but it''s a substantive question, proving "good" is indefinable.',
  '{"1": "The ''open question'' is a logical test about the nature of moral concepts.", "2": "It is a meta-ethical argument, not a political technique.", "3": "It concerns moral philosophy, not survey methodology."}'),

('politics', 7, 'What is Carl Schmitt''s concept of "the political" and how does it challenge liberal theory?',
  '[{"text": "The political is defined by the friend-enemy distinction, which liberalism cannot eliminate through procedural neutrality or rational deliberation", "correct": true}, {"text": "Schmitt was a liberal democrat"}, {"text": "The political means polite conversation"}, {"text": "Schmitt argued that conflict is impossible"}]',
  'Schmitt argued that the essence of politics is the existential distinction between friend and enemy. Liberalism''s attempt to replace politics with economics, law, or ethics ultimately fails because it cannot eliminate this fundamental antagonism.',
  '{"1": "Schmitt was a critic of liberalism and parliamentary democracy.", "2": "Schmitt defined the political by conflict, not politeness.", "3": "Schmitt argued that political conflict is ineliminable."}'),

('aesthetics', 7, 'What is Arthur Danto''s thesis about the "end of art"?',
  '[{"text": "That after Warhol, art became self-conscious philosophy — any object can be art, so art as a progressive historical narrative has reached its conclusion", "correct": true}, {"text": "That no more art will ever be created"}, {"text": "That only painting counts as art"}, {"text": "That art museums should close"}]',
  'Danto argued that Warhol''s Brillo Boxes showed that visual appearance cannot distinguish art from non-art. Art became a philosophical question about its own nature, ending the historical narrative of stylistic progress.',
  '{"1": "Danto meant the end of art''s historical narrative, not the cessation of art-making.", "2": "Danto''s point is that any medium or object can be art.", "3": "Danto championed art museums and institutions."}'),

('applied', 7, 'What is the "non-identity problem" in ethics?',
  '[{"text": "Future people cannot be harmed by current policies because those policies determine which specific individuals will exist", "correct": true}, {"text": "A problem with identity theft"}, {"text": "The difficulty of remembering names"}, {"text": "A psychological disorder"}]',
  'Derek Parfit showed that if we choose a policy that causes a different set of people to be born, those people cannot claim they were harmed — since the alternative policy would mean they never existed. This challenges intergenerational justice arguments.',
  '{"1": "It is about the metaphysics of identity and future persons, not identity theft.", "2": "It is a philosophical problem, not about memory.", "3": "It is a problem in ethics and metaphysics, not psychology."}'),

('history', 7, 'What was the significance of the Leibniz-Clarke correspondence?',
  '[{"text": "It debated whether space and time are absolute (Newton/Clarke) or relational (Leibniz), shaping the foundations of physics and metaphysics", "correct": true}, {"text": "It was about postal reform"}, {"text": "It settled a property dispute"}, {"text": "It was about religious conversion"}]',
  'Samuel Clarke defended Newton''s view that space and time are absolute containers; Leibniz argued they are merely relations between objects. This debate anticipated Einstein''s relativity and remains foundational in philosophy of physics.',
  '{"1": "The correspondence was purely philosophical and scientific.", "2": "It concerned the nature of space and time, not property.", "3": "While theological arguments appeared, the core debate was about physics and metaphysics."}'),

('economics', 7, 'What is the "calculation problem" that Mises posed against socialism?',
  '[{"text": "Without market prices for capital goods, a socialist economy cannot rationally calculate which production methods are most efficient", "correct": true}, {"text": "A problem with calculator batteries"}, {"text": "The difficulty of counting population"}, {"text": "A challenge in teaching arithmetic"}]',
  'Ludwig von Mises argued in 1920 that socialism cannot perform economic calculation because state ownership of means of production eliminates the market prices needed to compare the value of different uses of capital.',
  '{"1": "The calculation problem is about economic planning, not physical calculators.", "2": "It concerns resource allocation, not population counting.", "3": "It is an economic theory, not a pedagogical problem."}'),

('law', 7, 'What is Lon Fuller''s "inner morality of law" and how does it challenge legal positivism?',
  '[{"text": "Law must satisfy eight formal requirements (generality, promulgation, non-retroactivity, clarity, consistency, possibility, stability, congruence) to function as law at all", "correct": true}, {"text": "Judges must be moral people"}, {"text": "Only religious law is valid"}, {"text": "Law has no connection to any principles"}]',
  'Fuller argued that law has an inherent morality in its very form — a system failing these eight criteria is not merely bad law but fails to be law altogether. This bridges legal positivism and natural law theory.',
  '{"1": "Fuller''s argument is about the formal structure of legal systems, not the character of individual judges.", "2": "Fuller was a secular legal philosopher, not arguing for religious law.", "3": "Fuller''s entire project was to show law''s connection to principles of legality."}'),

('virtues', 7, 'What is Alasdair MacIntyre''s argument in "After Virtue" about the crisis of modern morality?',
  '[{"text": "Modern moral discourse is incoherent because we use fragments of past ethical traditions stripped of the teleological frameworks that made them intelligible", "correct": true}, {"text": "Modern morality is perfect"}, {"text": "Virtue ethics was never important"}, {"text": "Only ancient Greeks had moral problems"}]',
  'MacIntyre argued that Enlightenment attempts to justify morality without Aristotelian teleology produced rival, irreconcilable moral claims. Only recovering the tradition of virtue ethics within practices and communities can restore moral coherence.',
  '{"1": "MacIntyre''s entire thesis is that modern morality is in crisis.", "2": "MacIntyre argued for the recovery of virtue ethics as essential.", "3": "MacIntyre''s argument spans all of Western moral history, not just ancient Greece."}');

-- ============================================================
-- DIFFICULTY 8 — Expert, detailed doctrines, subtle distinctions
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 8, 'What is the difference between type identity theory and functionalism in philosophy of mind?',
  '[{"text": "Type identity says mental states ARE brain states; functionalism says mental states are defined by their functional role regardless of physical substrate", "correct": true}, {"text": "They are the same theory"}, {"text": "Functionalism denies the existence of minds"}, {"text": "Type identity is about typography"}]',
  'Type identity (Place, Smart) claims pain IS C-fiber firing. Functionalism (Putnam, early) says pain is whatever plays the causal role of pain — it could be neurons, silicon, or anything with the right functional organization.',
  '{"1": "They are competing theories with fundamentally different implications for AI and multiple realizability.", "2": "Functionalism accepts the existence of mental states; it just defines them functionally.", "3": "Type identity is about the mind-brain relationship, not printing."}'),

('epistemology', 8, 'What is the significance of Kripke''s argument for a posteriori necessities?',
  '[{"text": "Some necessary truths (like water = H2O) can only be known through empirical investigation, challenging the traditional equation of necessary with a priori", "correct": true}, {"text": "All knowledge is innate"}, {"text": "Nothing is necessary"}, {"text": "Empirical science is impossible"}]',
  'Kripke showed in "Naming and Necessity" (1972) that "Water is H2O" is necessarily true (in all possible worlds) yet known empirically. This shattered the Kantian assumption that necessity implies a priori knowability.',
  '{"1": "Kripke argued some knowledge is empirical, not that all is innate.", "2": "Kripke affirmed the existence of necessary truths; he just showed they can be empirically discovered.", "3": "Kripke''s work supports the power of empirical science."}'),

('ethics', 8, 'What is Christine Korsgaard''s "constructivism" in moral philosophy?',
  '[{"text": "Moral truths are not discovered but constructed by rational agents through the process of reflective endorsement of their own practical identities", "correct": true}, {"text": "Morality is about building physical structures"}, {"text": "Only construction workers have moral status"}, {"text": "Moral truths are written in scripture"}]',
  'Korsgaard argues that moral obligation arises when rational agents reflect on their motives and endorse them as expressive of their practical identity. Morality is created through rational self-legislation, following Kant.',
  '{"1": "''Constructivism'' here means moral values are constructed through reason, not physical building.", "2": "Moral status applies to all rational agents in Korsgaard''s theory.", "3": "Korsgaard''s approach is secular and Kantian, not scriptural."}'),

('politics', 8, 'What is Philip Pettit''s concept of "freedom as non-domination"?',
  '[{"text": "Freedom requires not merely the absence of interference but the absence of the capacity for arbitrary interference by others", "correct": true}, {"text": "Freedom means doing whatever you want"}, {"text": "Non-domination is a type of board game"}, {"text": "Pettit rejected all concepts of freedom"}]',
  'Pettit distinguishes his republican concept from Berlin''s negative liberty. A slave with a kind master lacks freedom even without actual interference — because the master has the power to interfere arbitrarily. The structural capacity for domination is the problem.',
  '{"1": "Pettit''s concept is more demanding than mere absence of interference.", "2": "Non-domination is a political philosophy concept, not a game.", "3": "Pettit is a champion of a specific kind of freedom, not a rejecter of freedom."}'),

('history', 8, 'What was the significance of the Methodenstreit in economics and philosophy?',
  '[{"text": "A debate between the Austrian School (Menger) and the German Historical School (Schmoller) over whether economics should use abstract deductive theory or historical-empirical methods", "correct": true}, {"text": "A cooking competition"}, {"text": "A war between Austria and Germany"}, {"text": "A debate about teaching methods in primary schools"}]',
  'The Methodenstreit (1880s) shaped the foundations of social science methodology. Menger argued for universal economic laws derived from individual action; Schmoller insisted that economic truths are historically contingent.',
  '{"1": "It was an intellectual debate about methodology, not a competition.", "2": "It was an academic dispute, not a military conflict.", "3": "It concerned the methodology of economics as a science."}'),

('aesthetics', 8, 'What is Nelson Goodman''s "grue" problem and how does it relate to aesthetics?',
  '[{"text": "It shows that any set of observations is compatible with infinite hypotheses, challenging the idea that artistic style can be objectively identified from examples alone", "correct": true}, {"text": "A problem about glue manufacturing"}, {"text": "A color theory for painters"}, {"text": "A cooking problem about gruel"}]',
  'Goodman''s "grue" (green until 2050, then blue) shows that induction is underdetermined. Applied to aesthetics, this means that identifying an artist''s style or a genre''s characteristics from examples is never logically conclusive.',
  '{"1": "''Grue'' is a philosophical neologism, not related to adhesives.", "2": "It is about the logic of classification, not practical color theory.", "3": "''Grue'' is not ''gruel'' — it is a thought experiment about induction."}'),

('virtues', 8, 'What is the difference between Philippa Foot''s "natural goodness" approach and neo-Aristotelian virtue ethics?',
  '[{"text": "Foot grounds virtue in the natural teleology of living organisms — goodness for humans is like goodness for any species: fulfilling the life-form''s characteristic patterns", "correct": true}, {"text": "Foot rejected virtue ethics"}, {"text": "Foot was a utilitarian"}, {"text": "There is no difference"}]',
  'In "Natural Goodness" (2001), Foot argued that human virtues are grounded in our nature as a species — just as deep roots are good for an oak. This naturalizes Aristotelian teleology without requiring cosmic purpose.',
  '{"1": "Foot was one of the most important revivalists of virtue ethics.", "2": "Foot explicitly opposed utilitarianism and argued for virtue-based ethics.", "3": "Foot''s approach is distinctive within neo-Aristotelian virtue ethics."}'),

('economics', 8, 'What is the Coase theorem and what are its philosophical implications for property rights?',
  '[{"text": "If transaction costs are zero, initial allocation of property rights does not affect economic efficiency, because parties will bargain to the optimal outcome regardless", "correct": true}, {"text": "A theorem about coastal erosion"}, {"text": "A law about coat ownership"}, {"text": "A mathematical proof about prime numbers"}]',
  'Ronald Coase showed that externalities can be resolved through private bargaining if property rights are clear and transaction costs are low. The philosophical implication: the problem is not externalities per se but transaction costs and unclear rights.',
  '{"1": "Coase is an economist, not a geologist.", "2": "It concerns property rights generally, not clothing.", "3": "It is an economic theorem, not a number theory proof."}'),

('law', 8, 'What is the difference between Hart''s "rule of recognition" and Kelsen''s "Grundnorm"?',
  '[{"text": "Hart''s rule is a social fact about official practice; Kelsen''s Grundnorm is a presupposed logical condition for the validity of all other legal norms", "correct": true}, {"text": "They are identical concepts"}, {"text": "Hart was German; Kelsen was English"}, {"text": "Neither contributed to jurisprudence"}]',
  'Hart''s rule of recognition is an empirical social practice — officials actually accept certain criteria for identifying valid law. Kelsen''s Grundnorm is a transcendental presupposition, a logical hypothesis that grounds the entire legal system.',
  '{"1": "They are structurally similar but philosophically distinct.", "2": "Hart was British; Kelsen was Austrian.", "3": "Both are among the most influential legal theorists of the 20th century."}');

-- ============================================================
-- DIFFICULTY 9 — Master level, specialized academic knowledge
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 9, 'What is David Lewis''s modal realism?',
  '[{"text": "The thesis that all possible worlds are equally real, concrete universes — ours is merely actual to us, not metaphysically privileged", "correct": true}, {"text": "A theory about fashion trends"}, {"text": "The idea that only our world exists"}, {"text": "A theory about video game design"}]',
  'Lewis argued in "On the Plurality of Worlds" (1986) that every way the world could have been is a real, concrete world. A "possible world" where unicorns exist literally exists — we just don''t happen to be there.',
  '{"1": "Modal realism concerns possible worlds in philosophy, not fashion.", "2": "Lewis''s thesis is precisely that other possible worlds exist as concretely as ours.", "3": "Modal realism is metaphysics, not game design."}'),

('epistemology', 9, 'What is Timothy Williamson''s "knowledge-first" epistemology?',
  '[{"text": "Knowledge is a primitive, unanalyzable mental state — not reducible to justified true belief plus conditions — and is the most general factive mental state", "correct": true}, {"text": "That the first thing you learn is the most important"}, {"text": "That knowledge only comes from textbooks"}, {"text": "That memorization is superior to understanding"}]',
  'Williamson reverses the traditional project: instead of analyzing knowledge into components (belief, truth, justification), he treats knowledge as basic and explains other concepts (belief, evidence, assertion) in terms of it.',
  '{"1": "''Knowledge-first'' refers to the theoretical priority of knowledge, not temporal priority.", "2": "Williamson''s theory is about the nature of knowledge itself, not its sources.", "3": "Williamson distinguishes knowledge from mere belief or memorization."}'),

('ethics', 9, 'What is Derek Parfit''s "triple theory" in "On What Matters"?',
  '[{"text": "That Kantian deontology, consequentialism, and contractualism converge on the same fundamental moral principles when properly understood", "correct": true}, {"text": "That there are three types of food"}, {"text": "That morality has three levels: easy, medium, hard"}, {"text": "That only three philosophers matter"}]',
  'Parfit spent decades arguing that the three major moral traditions are not genuinely opposed — they are "climbing the same mountain on different sides." His convergence thesis aims to end the impasse between competing ethical theories.',
  '{"1": "The triple theory is about moral philosophy, not nutrition.", "2": "It concerns the structure of moral theories, not difficulty levels.", "3": "Parfit engaged with hundreds of philosophers across all traditions."}'),

('politics', 9, 'What is the difference between Habermas''s "discourse ethics" and Rawls''s "political liberalism"?',
  '[{"text": "Habermas derives moral norms from the conditions of rational discourse itself; Rawls seeks overlapping consensus among reasonable comprehensive doctrines without grounding in any one", "correct": true}, {"text": "They are the same theory"}, {"text": "Habermas rejected democracy"}, {"text": "Rawls was a Marxist"}]',
  'Habermas argues that valid moral norms are those that all affected parties would accept in an ideal speech situation. Rawls seeks principles that diverse worldviews can endorse from an "overlapping consensus" without sharing foundations.',
  '{"1": "They share liberal democratic commitments but differ fundamentally in justificatory strategy.", "2": "Habermas is a champion of deliberative democracy.", "3": "Rawls was a liberal egalitarian, not a Marxist."}'),

('history', 9, 'What was the significance of the Vienna Circle for 20th century philosophy?',
  '[{"text": "They developed logical positivism, arguing that only empirically verifiable or logically tautological statements are meaningful, influencing analytic philosophy profoundly", "correct": true}, {"text": "They were a music ensemble"}, {"text": "They studied Viennese pastry techniques"}, {"text": "They were a political party"}]',
  'The Vienna Circle (Schlick, Carnap, Neurath, Gödel) formulated the verification principle, developed formal logic, and sought to unify science. Though logical positivism was later abandoned, it shaped the entire trajectory of analytic philosophy.',
  '{"1": "The Vienna Circle was a philosophical movement, not a musical group.", "2": "They studied logic and science, not culinary arts.", "3": "They were an intellectual circle, not a political party."}'),

('aesthetics', 9, 'What is Theodor Adorno''s concept of "negative dialectics" as applied to art?',
  '[{"text": "Art''s truth content lies in its resistance to synthesis and reconciliation — authentic art preserves contradiction and refuses to harmonize antagonisms that are real", "correct": true}, {"text": "Art should always be cheerful"}, {"text": "Dialectics has no relation to art"}, {"text": "All art is negative"}]',
  'Adorno rejected Hegel''s positive dialectic (thesis-antithesis-synthesis) in favor of a dialectic that refuses resolution. Great art embodies social contradictions without resolving them, maintaining critical tension.',
  '{"1": "Adorno valued art that confronts suffering, not that conceals it with cheerfulness.", "2": "Adorno spent his career connecting dialectical philosophy to aesthetic theory.", "3": "Not all art is negative; Adorno identified specific works whose form embodies genuine critical content."}'),

('virtues', 9, 'What is Julia Annas''s argument for virtue as a skill in "Intelligent Virtue"?',
  '[{"text": "Virtue is a practical skill requiring intelligent responsiveness to particulars, developed through practice and reflection, analogous to becoming an expert musician or craftsman", "correct": true}, {"text": "Virtue is an innate talent that cannot be learned"}, {"text": "Virtue is following rules mechanically"}, {"text": "Annas rejected virtue ethics"}]',
  'Annas argues that virtuous action requires the same kind of practical intelligence as skilled performance — it is not mere habit or rule-following but responsive, creative engagement that improves through deliberate practice.',
  '{"1": "Annas explicitly argues that virtue is learned through practice, not innate.", "2": "Annas distinguishes virtue from mechanical rule-following as requiring intelligent judgment.", "3": "Annas is a leading contemporary virtue ethicist."}'),

('economics', 9, 'What is the "impossibility theorem" of Kenneth Arrow?',
  '[{"text": "No voting system can simultaneously satisfy all of a set of reasonable fairness conditions when there are three or more alternatives", "correct": true}, {"text": "A theorem proving flight is impossible"}, {"text": "A proof that markets cannot exist"}, {"text": "A demonstration that mathematics is inconsistent"}]',
  'Arrow proved in 1951 that no rank-order voting system can convert individual preferences into a community-wide preference while satisfying unanimity, non-dictatorship, and independence of irrelevant alternatives simultaneously.',
  '{"1": "Arrow''s theorem is about social choice and voting, not aerodynamics.", "2": "Arrow''s theorem is about collective decision-making, not market existence.", "3": "Arrow''s theorem is consistent mathematics proving a limitation on voting systems."}'),

('law', 9, 'What is Joseph Raz''s "service conception" of authority?',
  '[{"text": "Authority is legitimate when subjects would better conform to reasons that already apply to them by following the authority''s directives than by acting on their own judgment", "correct": true}, {"text": "Authority means having the most servants"}, {"text": "Only religious authorities are legitimate"}, {"text": "Authority is always illegitimate"}]',
  'Raz''s "normal justification thesis" holds that authority is justified when it mediates between people and the reasons that apply to them — the authority serves them by helping them do what they already have reason to do, better.',
  '{"1": "''Service'' refers to the authority serving the governed, not having servants.", "2": "Raz''s theory is secular and applies to political, legal, and other forms of authority.", "3": "Raz provides conditions under which authority IS legitimate."}');

-- ============================================================
-- DIFFICULTY 10 — Master level, original source texts
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 10, 'What is the relationship between Heidegger''s "ontological difference" and the "question of Being"?',
  '[{"text": "The ontological difference distinguishes Being (Sein) from beings (Seiendes); the question of Being asks about the meaning of Being itself, which Western philosophy has ''forgotten'' by focusing only on beings", "correct": true}, {"text": "They are unrelated concepts"}, {"text": "Heidegger rejected ontology"}, {"text": "The ontological difference is a mathematical concept"}]',
  'Heidegger''s central project in "Being and Time" was to reawaken the question of the meaning of Being — not what exists, but what it means to be at all. Western metaphysics, he argued, confused Being with the highest being (God, substance, subject).',
  '{"1": "The ontological difference is the foundation of Heidegger''s entire philosophical project.", "2": "Heidegger sought to transform ontology, not reject it.", "3": "The ontological difference is a philosophical distinction, not mathematical."}'),

('epistemology', 10, 'What is the significance of Gödel''s incompleteness theorems for epistemology and philosophy of mathematics?',
  '[{"text": "Any consistent formal system capable of expressing arithmetic contains true statements that cannot be proven within it, showing the limits of formal proof as a path to mathematical truth", "correct": true}, {"text": "Mathematics is entirely wrong"}, {"text": "Computers can solve all mathematical problems"}, {"text": "Logic is unnecessary"}]',
  'Gödel proved in 1931 that Hilbert''s program of formalizing all mathematics was impossible. There will always be true mathematical statements unprovable within any consistent system — mathematical truth transcends formal provability.',
  '{"1": "Gödel showed limits to formal systems, not that mathematics itself is wrong.", "2": "Gödel''s theorem implies there are limits to what any computational system can prove.", "3": "Gödel was a logician who demonstrated the power AND limits of logic."}'),

('ethics', 10, 'What is the structure of Kant''s argument in the Groundwork for the second formulation of the categorical imperative?',
  '[{"text": "Rational beings have absolute worth as ends in themselves because rationality is the condition for all other value; thus we must never treat humanity merely as a means", "correct": true}, {"text": "People are valuable because they are productive workers"}, {"text": "Only the wealthy have moral worth"}, {"text": "The categorical imperative has only one formulation"}]',
  'Kant argued that rational nature is the source of all value — without a valuer, nothing has value. Therefore rational beings have dignity (unconditional worth), not mere price. This grounds the prohibition on treating people merely as instruments.',
  '{"1": "Kant''s argument is about rationality as the source of value, not economic productivity.", "2": "Kant explicitly argued that all rational beings have equal, unconditional worth regardless of wealth.", "3": "Kant presented multiple formulations of the categorical imperative, including the humanity formula."}'),

('politics', 10, 'How does Hannah Arendt''s concept of "the banality of evil" revise traditional moral philosophy?',
  '[{"text": "Evil can result not from monstrous intentions but from thoughtlessness — the failure to think, to examine one''s actions from the perspective of others, making ordinary bureaucrats complicit in atrocity", "correct": true}, {"text": "Evil does not exist"}, {"text": "Only bankers are evil"}, {"text": "Arendt defended totalitarianism"}]',
  'Arendt observed Eichmann and concluded that his evil was not demonic but banal — he simply failed to think about what he was doing. This challenged the assumption that great evil requires great malice, pointing instead to the moral danger of thoughtlessness.',
  '{"1": "Arendt affirmed the reality of evil; she redefined its typical character.", "2": "Arendt''s analysis applies to bureaucratic complicity generally, not to any specific profession.", "3": "Arendt was one of the 20th century''s most powerful critics of totalitarianism."}'),

('history', 10, 'What is the philosophical significance of the Averroist thesis of "double truth"?',
  '[{"text": "The controversial claim attributed to Latin Averroists that something can be true in philosophy but false in theology, raising fundamental questions about the unity of truth", "correct": true}, {"text": "That every statement is both true and false"}, {"text": "A theory about twin siblings"}, {"text": "A bookkeeping method"}]',
  'The double truth doctrine (condemned in 1277) suggested philosophy and theology could reach contradictory conclusions, both valid in their domains. This crisis forced Aquinas to demonstrate their compatibility and shaped the entire trajectory of Western thought.',
  '{"1": "Double truth is about the relationship between faith and reason, not about logical contradiction.", "2": "It has nothing to do with siblings.", "3": "It is a medieval philosophical thesis, not an accounting method."}'),

('virtues', 10, 'What is the difference between Michael Slote''s "agent-based" virtue ethics and Rosalind Hursthouse''s "agent-focused" approach?',
  '[{"text": "Slote evaluates actions entirely by the inner states of the agent (motives, character); Hursthouse evaluates actions by what a virtuous person would characteristically do in the circumstances", "correct": true}, {"text": "They are the same theory"}, {"text": "Slote rejected virtue ethics; Hursthouse accepted it"}, {"text": "Neither is a virtue ethicist"}]',
  'Slote''s agent-based theory makes the moral quality of actions derivative of the agent''s character states. Hursthouse''s agent-focused theory uses the virtuous agent as a reference point but grounds virtues in human flourishing, maintaining an action-guidance dimension.',
  '{"1": "They are distinct approaches within the broader virtue ethics tradition.", "2": "Both are virtue ethicists; they differ on the relationship between character and right action.", "3": "Both are leading contemporary virtue ethicists."}'),

('economics', 10, 'What is the philosophical significance of the "socialist calculation debate" between Mises/Hayek and Lange/Lerner?',
  '[{"text": "It revealed that the core issue is not mathematical but epistemological — whether dispersed tacit knowledge can be centrally aggregated, which Hayek argued it fundamentally cannot", "correct": true}, {"text": "It was about calculating restaurant tips"}, {"text": "Both sides agreed completely"}, {"text": "It concerned calculator manufacturing"}]',
  'Lange and Lerner proposed "market socialism" using trial-and-error pricing. Hayek responded that the real problem is not computation but discovery — market prices transmit information that no central authority can replicate because much knowledge is tacit and local.',
  '{"1": "The debate concerned the feasibility of economic planning, not gratuities.", "2": "The two sides fundamentally disagreed about whether central planning could work.", "3": "The debate was about economic methodology, not electronics."}'),

('law', 10, 'What is the significance of the Hart-Fuller debate about Nazi law for legal philosophy?',
  '[{"text": "Hart argued Nazi statutes were valid law (however immoral); Fuller argued they failed to be law at all because they violated the inner morality of law — revealing the deepest divide between positivism and natural law", "correct": true}, {"text": "They debated traffic laws"}, {"text": "Both defended Nazi law"}, {"text": "The debate was about patent law"}]',
  'The 1958 Hart-Fuller debate in the Harvard Law Review crystallized the central question of jurisprudence: can an unjust system qualify as "law"? Hart said yes (separating law from morality); Fuller said no (law requires minimum moral content in its form).',
  '{"1": "The debate concerned the nature of law itself, not any specific regulatory domain.", "2": "Neither defended Nazi law; they debated whether it counted as law in a philosophical sense.", "3": "The debate was about jurisprudential foundations, not intellectual property."}');
