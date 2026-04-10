-- PHILOSIFY QUIZ SEED - All new questions
-- Run in Supabase SQL Editor

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 1, 'What is metaphysics primarily concerned with?',
  '[{"text": "The fundamental nature of reality", "correct": true}, {"text": "The study of moral behavior"}, {"text": "The analysis of language"}, {"text": "The history of science"}]',
  'Metaphysics is the branch of philosophy dealing with the first principles of things, including abstract concepts such as being, knowing, substance, cause, identity, time, and space.',
  '{"1": "Moral behavior is the domain of ethics, not metaphysics.", "2": "Language analysis belongs to philosophy of language and analytic philosophy.", "3": "History of science is a distinct field from metaphysics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 1, 'What does epistemology study?',
  '[{"text": "The nature and scope of knowledge", "correct": true}, {"text": "The existence of God"}, {"text": "Political systems"}, {"text": "Human emotions"}]',
  'Epistemology is the branch of philosophy concerned with the theory of knowledge — what we can know, how we know it, and what justifies our beliefs.',
  '{"1": "The existence of God falls under philosophy of religion and theology.", "2": "Political systems are studied in political philosophy.", "3": "Human emotions are studied in psychology and philosophy of mind."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 1, 'Which philosopher is most associated with the concept of the "categorical imperative"?',
  '[{"text": "Immanuel Kant", "correct": true}, {"text": "John Stuart Mill"}, {"text": "Friedrich Nietzsche"}, {"text": "David Hume"}]',
  'Kant formulated the categorical imperative as the supreme principle of morality: "Act only according to that maxim whereby you can at the same time will that it should become a universal law."',
  '{"1": "Mill is associated with utilitarianism and the greatest happiness principle.", "2": "Nietzsche rejected universal moral systems and championed the will to power.", "3": "Hume argued that morality is based on sentiment, not reason."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 1, 'Who wrote "The Republic," describing an ideal state ruled by philosopher-kings?',
  '[{"text": "Plato", "correct": true}, {"text": "Aristotle"}, {"text": "Cicero"}, {"text": "Seneca"}]',
  'Plato wrote "The Republic" around 375 BC, arguing that the ideal state should be governed by philosopher-kings — those who have attained knowledge of the Form of the Good.',
  '{"1": "Aristotle wrote ''Politics'' and disagreed with many of Plato''s ideas about the ideal state.", "2": "Cicero wrote ''On the Republic'' but centuries after Plato.", "3": "Seneca was a Stoic philosopher and advisor to Nero, not known for political theory."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 1, 'What branch of philosophy deals with the nature of beauty and art?',
  '[{"text": "Aesthetics", "correct": true}, {"text": "Logic"}, {"text": "Ontology"}, {"text": "Pragmatism"}]',
  'Aesthetics examines the nature of beauty, art, taste, and the creation and appreciation of beauty. It is one of the traditional branches of philosophy.',
  '{"1": "Logic deals with the principles of valid reasoning and argumentation.", "2": "Ontology studies the nature of being and existence — a sub-field of metaphysics.", "3": "Pragmatism is a philosophical tradition focused on practical consequences."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 1, 'What is applied philosophy primarily concerned with?',
  '[{"text": "Using philosophical methods to address real-world problems", "correct": true}, {"text": "Studying ancient philosophical texts"}, {"text": "Creating mathematical proofs"}, {"text": "Writing poetry about existence"}]',
  'Applied philosophy uses philosophical methods, concepts, and theories to examine practical issues in fields like medicine, technology, law, business, and the environment.',
  '{"1": "Studying ancient texts is part of history of philosophy, not applied philosophy specifically.", "2": "Mathematical proofs belong to mathematics and logic.", "3": "Poetry about existence relates to literary expression, not applied philosophy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 1, 'In which ancient Greek city did Socrates, Plato, and Aristotle primarily teach?',
  '[{"text": "Athens", "correct": true}, {"text": "Sparta"}, {"text": "Corinth"}, {"text": "Thebes"}]',
  'Athens was the intellectual center of ancient Greece. Socrates taught in the Agora, Plato founded the Academy, and Aristotle founded the Lyceum — all in Athens.',
  '{"1": "Sparta was known for its military culture, not philosophical inquiry.", "2": "Corinth was a major trading city but not a center of philosophy.", "3": "Thebes was a powerful city-state but did not host these philosophers."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 1, 'Which document begins with "We hold these truths to be self-evident"?',
  '[{"text": "The Declaration of Independence", "correct": true}, {"text": "The Constitution"}, {"text": "The Federalist Papers"}, {"text": "The Bill of Rights"}]',
  'Thomas Jefferson wrote these words in the Declaration of Independence (1776), asserting that individual rights to life, liberty, and the pursuit of happiness are self-evident truths — a revolutionary philosophical claim.',
  '{"1": "The Constitution begins with ''We the People'' and establishes the government structure.", "2": "The Federalist Papers are essays arguing for ratification of the Constitution.", "3": "The Bill of Rights lists specific individual rights but has a different preamble."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 1, 'Which philosopher identified four cardinal virtues: prudence, justice, temperance, and courage?',
  '[{"text": "Plato", "correct": true}, {"text": "Epicurus"}, {"text": "Confucius"}, {"text": "Thomas Aquinas"}]',
  'Plato identified these four cardinal virtues in "The Republic," each corresponding to a part of the soul and a class of the ideal state. They became foundational in Western ethical thought.',
  '{"1": "Epicurus focused on pleasure and the absence of pain as the highest good.", "2": "Confucius articulated different virtues centered on ren (benevolence) and li (ritual).", "3": "Aquinas adopted Plato''s four virtues but added three theological virtues — he built upon, not originated, the cardinal virtues."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 1, 'Who wrote "The Wealth of Nations," foundational to free-market economics?',
  '[{"text": "Adam Smith", "correct": true}, {"text": "Karl Marx"}, {"text": "John Maynard Keynes"}, {"text": "David Ricardo"}]',
  'Adam Smith published "An Inquiry into the Nature and Causes of the Wealth of Nations" in 1776, arguing that free markets, division of labor, and self-interest drive prosperity.',
  '{"1": "Marx wrote ''Das Kapital'' criticizing capitalism, not defending free markets.", "2": "Keynes wrote ''The General Theory'' advocating government intervention in economics.", "3": "Ricardo contributed the theory of comparative advantage but did not write this work."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 1, 'What concept describes the principle that no person is above the law?',
  '[{"text": "Rule of law", "correct": true}, {"text": "Social contract"}, {"text": "Natural selection"}, {"text": "Divine right"}]',
  'The rule of law means that laws apply equally to all people, including those who govern. It is a cornerstone of constitutional democracies and individual rights protection.',
  '{"1": "The social contract is a theory about the legitimacy of state authority, not the equality of legal application.", "2": "Natural selection is a biological concept from evolutionary theory.", "3": "Divine right claims that monarchs derive authority from God, the opposite of rule of law."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 1, 'Which composer''s Ninth Symphony includes the "Ode to Joy," celebrating universal brotherhood?',
  '[{"text": "Ludwig van Beethoven", "correct": true}, {"text": "Wolfgang Amadeus Mozart"}, {"text": "Johann Sebastian Bach"}, {"text": "Franz Schubert"}]',
  'Beethoven''s Ninth Symphony (1824) includes a choral setting of Friedrich Schiller''s "Ode to Joy," celebrating the Enlightenment ideals of freedom, unity, and human dignity.',
  '{"1": "Mozart died in 1791, decades before Beethoven''s Ninth was composed.", "2": "Bach composed in the Baroque era, a century before the Ninth.", "3": "Schubert was a contemporary of Beethoven but did not compose the Ninth Symphony."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 1, 'Which 1999 film explores the philosophical question of whether our perceived reality is an illusion?',
  '[{"text": "The Matrix", "correct": true}, {"text": "Fight Club"}, {"text": "The Sixth Sense"}, {"text": "American Beauty"}]',
  'The Matrix (1999) directly engages with philosophical skepticism — drawing from Plato''s Cave, Descartes'' evil demon hypothesis, and Nozick''s experience machine thought experiment.',
  '{"1": "Fight Club explores consumerism and identity but not simulated reality.", "2": "The Sixth Sense is about perception but through a supernatural lens, not epistemological.", "3": "American Beauty examines suburban dissatisfaction, not the nature of reality."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 1, 'Who said: "The only thing necessary for the triumph of evil is for good men to do nothing"?',
  '[{"text": "Edmund Burke", "correct": true}, {"text": "Thomas Paine"}, {"text": "Benjamin Franklin"}, {"text": "George Washington"}]',
  'This quote is widely attributed to Edmund Burke, the Anglo-Irish statesman and philosopher. It captures the moral responsibility of individuals to actively oppose injustice.',
  '{"1": "Paine wrote ''Common Sense'' and ''The Rights of Man'' but is not credited with this quote.", "2": "Franklin is known for ''An investment in knowledge pays the best interest'' among others.", "3": "Washington is remembered for his farewell address, not this quote."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 2, 'What is dualism in philosophy of mind?',
  '[{"text": "The view that mind and body are fundamentally different substances", "correct": true}, {"text": "The belief that everything is physical"}, {"text": "The idea that only the mind exists"}, {"text": "The theory that reality is an illusion"}]',
  'Dualism, most famously defended by Descartes, holds that the mental and the physical are two distinct kinds of substance. The mind is non-physical; the body is physical.',
  '{"1": "The belief that everything is physical is called physicalism or materialism.", "2": "The idea that only the mind exists is idealism, not dualism.", "3": "The theory that reality is an illusion is closer to radical skepticism or certain forms of Eastern philosophy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 2, 'What is empiricism?',
  '[{"text": "The view that knowledge comes primarily from sensory experience", "correct": true}, {"text": "The view that knowledge comes from pure reason alone"}, {"text": "The rejection of all knowledge claims"}, {"text": "The study of moral duties"}]',
  'Empiricism holds that all knowledge is derived from sense experience. Key empiricists include John Locke, George Berkeley, and David Hume.',
  '{"1": "Knowledge from pure reason alone is rationalism, the opposing view.", "2": "Rejecting all knowledge claims is radical skepticism.", "3": "The study of moral duties is deontological ethics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 2, 'What is utilitarianism?',
  '[{"text": "The theory that the best action maximizes overall happiness", "correct": true}, {"text": "The theory that morality comes from God''s commands"}, {"text": "The theory that only self-interest matters"}, {"text": "The theory that tradition determines morality"}]',
  'Utilitarianism, developed by Jeremy Bentham and John Stuart Mill, judges actions by their consequences — specifically, whether they produce the greatest happiness for the greatest number.',
  '{"1": "Morality from God''s commands is divine command theory.", "2": "Only self-interest mattering is ethical egoism.", "3": "Tradition determining morality is a form of moral conservatism or conventionalism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 2, 'What is the social contract theory?',
  '[{"text": "The idea that political authority arises from an agreement among individuals", "correct": true}, {"text": "A legal document between nations"}, {"text": "A theory about economic markets"}, {"text": "A religious covenant with God"}]',
  'Social contract theory, developed by Hobbes, Locke, and Rousseau, argues that legitimate political authority is based on a voluntary agreement among free individuals to form a government.',
  '{"1": "Treaties between nations are international agreements, not the philosophical social contract.", "2": "Economic market theory is a separate domain from political legitimacy.", "3": "A religious covenant is a theological concept, not a secular political theory."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 2, 'What did Kant mean by "disinterested pleasure" in his theory of beauty?',
  '[{"text": "Appreciating beauty without desire to possess or use the object", "correct": true}, {"text": "Finding no pleasure in art"}, {"text": "Being bored by beautiful things"}, {"text": "Preferring ugliness over beauty"}]',
  'Kant argued in the "Critique of Judgment" that true aesthetic appreciation is free from personal desire, utility, or moral judgment — we appreciate beauty for its own sake.',
  '{"1": "Disinterested does not mean uninterested; it means free from personal stake.", "2": "Kant valued aesthetic experience highly, not boredom.", "3": "Kant celebrated beauty as a bridge between the sensory and the rational."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 2, 'What is the trolley problem in applied ethics?',
  '[{"text": "A thought experiment about whether to divert a trolley to kill one person instead of five", "correct": true}, {"text": "A problem about public transportation funding"}, {"text": "An economic theory about supply and demand"}, {"text": "A legal case about railway negligence"}]',
  'The trolley problem, introduced by Philippa Foot, tests moral intuitions about action vs. inaction, consequentialism vs. deontology, and the moral weight of killing vs. letting die.',
  '{"1": "It has nothing to do with actual transportation policy.", "2": "It is an ethics problem, not an economics problem.", "3": "It is a thought experiment, not a real legal case."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 2, 'What period is known as the Age of Enlightenment?',
  '[{"text": "The 17th-18th century intellectual movement emphasizing reason and individual rights", "correct": true}, {"text": "The ancient Greek golden age"}, {"text": "The medieval period of religious scholarship"}, {"text": "The 20th century postmodern era"}]',
  'The Enlightenment (roughly 1685-1815) championed reason, science, individual liberty, and skepticism of authority. Key figures include Locke, Voltaire, Montesquieu, Hume, and Kant.',
  '{"1": "Ancient Greece was the classical period, preceding the Enlightenment by 2000 years.", "2": "Medieval religious scholarship is the Scholastic period, which preceded the Enlightenment.", "3": "Postmodernism emerged in the mid-20th century as a reaction against Enlightenment certainties."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 2, 'What philosophical principle underlies the First Amendment?',
  '[{"text": "That individual liberty of thought and expression is an inalienable right", "correct": true}, {"text": "That the government should control information"}, {"text": "That religion should guide all laws"}, {"text": "That only certain speech deserves protection"}]',
  'The First Amendment protects freedom of speech, religion, press, assembly, and petition — rooted in Enlightenment principles that individuals have natural rights that precede government authority.',
  '{"1": "Government control of information is censorship, the opposite of First Amendment principles.", "2": "The Establishment Clause specifically prevents religion from guiding laws.", "3": "The First Amendment protects speech broadly, not selectively."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 2, 'What is the Aristotelian concept of the "golden mean"?',
  '[{"text": "Virtue as the balance between two extremes of excess and deficiency", "correct": true}, {"text": "The average income in a just society"}, {"text": "The middle point of a mathematical equation"}, {"text": "A type of ancient Greek currency"}]',
  'Aristotle argued in the "Nicomachean Ethics" that every virtue is a mean between two vices. Courage is the mean between cowardice (deficiency) and recklessness (excess).',
  '{"1": "This is an ethical concept, not an economic one.", "2": "The golden mean is a moral principle, not a mathematical one.", "3": "It has nothing to do with currency or economics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 2, 'What is laissez-faire economics?',
  '[{"text": "The doctrine that government should not interfere in free market operations", "correct": true}, {"text": "A system where the government controls all production"}, {"text": "An economic theory based on equal distribution of wealth"}, {"text": "A monetary policy focused on gold reserves"}]',
  'Laissez-faire (French for "let do") advocates minimal government intervention in economic affairs, trusting free markets and voluntary exchange to allocate resources efficiently.',
  '{"1": "Government control of production is socialism or communism.", "2": "Equal distribution of wealth is egalitarianism or redistributive economics.", "3": "Gold-based monetary policy is the gold standard, a separate concept."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 2, 'What is natural law theory?',
  '[{"text": "The view that certain rights and moral values are inherent in human nature and discoverable by reason", "correct": true}, {"text": "The study of environmental regulations"}, {"text": "The idea that laws should be based on majority vote only"}, {"text": "A theory about the laws of physics"}]',
  'Natural law theory, from Aristotle through Aquinas to Locke, holds that moral principles are objective, universal, and discoverable through reason — they exist independently of any government.',
  '{"1": "Environmental law is a modern legal field, not the philosophical tradition of natural law.", "2": "Majority vote determining law is legal positivism or democratic theory.", "3": "Laws of physics are natural sciences, not natural law philosophy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 2, 'Which philosophical movement influenced the Romantic era of classical music?',
  '[{"text": "Romanticism — emphasizing emotion, individualism, and the sublime", "correct": true}, {"text": "Logical positivism"}, {"text": "Scholasticism"}, {"text": "Behaviorism"}]',
  'Romantic composers like Beethoven, Chopin, and Wagner drew from the Romantic philosophical movement that valued intense emotion, individual expression, nature, and the transcendent sublime.',
  '{"1": "Logical positivism emerged in the 20th century, long after the Romantic era.", "2": "Scholasticism was a medieval philosophical method focused on reason and theology.", "3": "Behaviorism is a 20th-century psychological theory, not a philosophical influence on Romantic music."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 2, 'Which Akira Kurosawa film explores the subjective nature of truth through contradictory accounts of the same event?',
  '[{"text": "Rashomon", "correct": true}, {"text": "Seven Samurai"}, {"text": "Ikiru"}, {"text": "Yojimbo"}]',
  'Rashomon (1950) presents four contradictory accounts of a crime, questioning whether objective truth is attainable. The "Rashomon effect" became a term for contradictory interpretations of the same event.',
  '{"1": "Seven Samurai is about honor and sacrifice, not epistemological uncertainty.", "2": "Ikiru explores the meaning of life through a dying bureaucrat.", "3": "Yojimbo is an action film about a ronin manipulating rival gangs."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 2, 'Who said: "God is dead"?',
  '[{"text": "Friedrich Nietzsche", "correct": true}, {"text": "Karl Marx"}, {"text": "Sigmund Freud"}, {"text": "Jean-Paul Sartre"}]',
  'Nietzsche declared "God is dead" in "The Gay Science" (1882) and "Thus Spoke Zarathustra." He meant that the Enlightenment had undermined the foundations of traditional morality and meaning.',
  '{"1": "Marx called religion ''the opium of the people'' but did not use this phrase.", "2": "Freud analyzed religion psychologically but did not make this specific declaration.", "3": "Sartre was an atheist existentialist but the phrase originates with Nietzsche."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 3, 'What is the problem of universals?',
  '[{"text": "Whether abstract properties like ''redness'' exist independently of particular things", "correct": true}, {"text": "Whether the universe is infinite"}, {"text": "Whether humans can travel faster than light"}, {"text": "Whether democracy works in all cultures"}]',
  'The problem of universals asks whether abstract properties (redness, justice, beauty) exist as real entities (realism) or are merely names we give to similarities among particular things (nominalism).',
  '{"1": "The size of the universe is a cosmological question, not a metaphysical problem about universals.", "2": "Speed of light is a physics question.", "3": "Democracy across cultures is a political science question."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 3, 'What is the Gettier problem?',
  '[{"text": "Cases where justified true belief fails to constitute knowledge", "correct": true}, {"text": "The difficulty of learning foreign languages"}, {"text": "A mathematical paradox about infinity"}, {"text": "The problem of translating ancient texts"}]',
  'Edmund Gettier showed in 1963 that a person can have a justified true belief that is not knowledge — because the justification is coincidental. This challenged the traditional definition of knowledge.',
  '{"1": "Language learning is linguistics, not epistemology.", "2": "Infinity paradoxes are mathematical, not epistemological.", "3": "Translation is hermeneutics, a different philosophical field."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 3, 'What is the difference between deontological and consequentialist ethics?',
  '[{"text": "Deontology judges actions by rules and duties; consequentialism judges by outcomes", "correct": true}, {"text": "They are the same theory with different names"}, {"text": "Deontology focuses on God; consequentialism focuses on nature"}, {"text": "Deontology is ancient; consequentialism is medieval"}]',
  'Deontological ethics (Kant) says some actions are inherently right or wrong regardless of outcomes. Consequentialism (Mill, Bentham) says only the results of actions determine their moral worth.',
  '{"1": "They are fundamentally different and often conflicting moral theories.", "2": "Deontology is about duty and rules, not necessarily about God; consequentialism is about results, not nature.", "3": "Both traditions have ancient roots but were systematized in the modern period."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 3, 'What is John Rawls'' "veil of ignorance"?',
  '[{"text": "A thought experiment where people design society without knowing their place in it", "correct": true}, {"text": "A criticism of democracy"}, {"text": "A theory about media censorship"}, {"text": "A defense of monarchy"}]',
  'Rawls proposed in "A Theory of Justice" (1971) that fair principles of justice are those that rational people would choose if they did not know their own social position, talents, or circumstances.',
  '{"1": "Rawls supported liberal democracy, not criticized it.", "2": "The veil of ignorance is about justice, not media.", "3": "Rawls argued against inherited privilege, the opposite of defending monarchy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 3, 'What is the difference between "high art" and "low art" according to traditional aesthetics?',
  '[{"text": "High art is considered intellectually challenging and culturally significant; low art is popular entertainment", "correct": true}, {"text": "High art is expensive; low art is cheap"}, {"text": "High art is three-dimensional; low art is flat"}, {"text": "High art is old; low art is modern"}]',
  'Traditional aesthetics distinguished between fine arts (painting, sculpture, classical music) as intellectually elevated, and popular culture (comics, pop music) as mere entertainment. This distinction has been challenged by postmodern thinkers.',
  '{"1": "Price is not the defining criterion; a cheap painting can be high art.", "2": "Dimensionality has nothing to do with the high/low distinction.", "3": "Age is not the criterion; contemporary work can be high art."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 3, 'What is the philosophical basis for informed consent in medicine?',
  '[{"text": "Respect for individual autonomy — the patient''s right to make decisions about their own body", "correct": true}, {"text": "The doctor''s right to choose treatment"}, {"text": "Government regulations about paperwork"}, {"text": "Insurance company requirements"}]',
  'Informed consent is grounded in the Kantian principle of autonomy — treating people as ends in themselves, not merely as means. Patients must understand and voluntarily agree to medical interventions.',
  '{"1": "The doctor''s authority is limited by the patient''s autonomy.", "2": "Informed consent is an ethical principle, not merely a regulatory requirement.", "3": "Insurance requirements are administrative, not philosophical."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 3, 'What was the Scholastic method in medieval philosophy?',
  '[{"text": "A method of critical reasoning using dialectical questioning to resolve contradictions between authorities", "correct": true}, {"text": "A system of physical education"}, {"text": "A method of farming"}, {"text": "A type of military training"}]',
  'Scholasticism, practiced by thinkers like Thomas Aquinas and Peter Abelard, combined Aristotelian logic with Christian theology, using structured debate (quaestiones) to reconcile apparent contradictions.',
  '{"1": "Scholasticism was intellectual, not physical.", "2": "Medieval farming had its own methods but was unrelated to Scholastic philosophy.", "3": "Military training was separate from the university-based Scholastic tradition."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 3, 'What philosophical idea distinguishes the American founding from the French Revolution?',
  '[{"text": "The American Revolution protected individual natural rights; the French Revolution pursued collective ''general will''", "correct": true}, {"text": "The American Revolution was violent; the French was peaceful"}, {"text": "They had identical philosophies"}, {"text": "The French Revolution came first"}]',
  'The American founders (influenced by Locke) sought to protect pre-existing individual rights through limited government. The French revolutionaries (influenced by Rousseau) sought to remake society through the collective general will, leading to the Terror.',
  '{"1": "Both revolutions were violent, but the French Revolution''s violence was far more extreme.", "2": "Their philosophies were fundamentally different in their view of individual vs. collective rights.", "3": "The American Revolution (1776) preceded the French Revolution (1789)."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 3, 'What is the Stoic concept of "apatheia"?',
  '[{"text": "Freedom from destructive passions through rational self-mastery", "correct": true}, {"text": "Complete emotional numbness"}, {"text": "Laziness and indifference"}, {"text": "Physical endurance training"}]',
  'Stoic apatheia does not mean apathy in the modern sense. It means freedom from irrational passions (pathos) that distort judgment — achieved through aligning one''s will with reason and nature.',
  '{"1": "Stoics did not advocate emotional numbness; they distinguished between rational emotions (eupatheiai) and destructive passions.", "2": "Stoics valued active engagement with life, not laziness.", "3": "While Stoics valued physical hardship as training, apatheia is specifically about emotional mastery."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 3, 'What is the "invisible hand" concept from Adam Smith?',
  '[{"text": "Individuals pursuing self-interest unintentionally promote the public good through market mechanisms", "correct": true}, {"text": "A secret government body controlling the economy"}, {"text": "A supernatural force guiding trade"}, {"text": "A banking regulation from the 18th century"}]',
  'Smith argued that when individuals freely pursue their own economic interests, the competitive market channels their actions toward outcomes that benefit society — without central planning.',
  '{"1": "The invisible hand is a metaphor for emergent order, not a conspiracy.", "2": "Smith was describing a natural economic process, not supernatural intervention.", "3": "It is a theoretical concept, not a regulation."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 3, 'What is legal positivism?',
  '[{"text": "The theory that law is a set of rules created by human authority, separate from morality", "correct": true}, {"text": "The belief that only positive emotions should guide law"}, {"text": "A theory that laws of nature are the only real laws"}, {"text": "The idea that judges should always be optimistic"}]',
  'Legal positivism (Austin, Hart, Kelsen) holds that law is what is enacted by legitimate authority — its validity does not depend on its moral content. This contrasts with natural law theory.',
  '{"1": "The word ''positive'' refers to ''posited'' (enacted by humans), not emotional positivity.", "2": "Natural law theory claims moral principles are real laws; legal positivism disagrees.", "3": "Judicial temperament is irrelevant to legal positivism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 3, 'How did John Cage''s "4''33" challenge traditional aesthetics?',
  '[{"text": "By presenting silence as music, questioning what constitutes art and the role of the audience", "correct": true}, {"text": "By being the longest symphony ever composed"}, {"text": "By using only electronic instruments"}, {"text": "By being performed underwater"}]',
  'Cage''s 4''33" (1952) consists of four minutes and thirty-three seconds of silence. It challenges the boundary between music and non-music, art and non-art, forcing the audience to hear ambient sounds as the composition.',
  '{"1": "It is one of the shortest compositions, not the longest.", "2": "No instruments are played at all, electronic or otherwise.", "3": "It is performed on a conventional stage."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 3, 'What philosophical school is most associated with the films of Andrei Tarkovsky?',
  '[{"text": "Existentialism and spiritual phenomenology — exploring time, memory, and transcendence", "correct": true}, {"text": "Logical positivism"}, {"text": "Marxist materialism"}, {"text": "Analytic philosophy"}]',
  'Tarkovsky''s films (Stalker, Solaris, Mirror) meditate on existential themes: the search for meaning, the nature of time and memory, spiritual longing, and the tension between material and transcendent reality.',
  '{"1": "Logical positivism rejects metaphysical speculation, which Tarkovsky embraced.", "2": "Though Tarkovsky worked in the Soviet Union, his films rejected Marxist materialism in favor of spiritual exploration.", "3": "Analytic philosophy focuses on language and logic, not the cinematic themes Tarkovsky explored."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 3, 'Who wrote: "Hell is other people"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Simone de Beauvoir"}, {"text": "Martin Heidegger"}]',
  'Sartre wrote this in his play "No Exit" (1944). It means that we are perpetually judged and defined by others'' perceptions of us, which limits our freedom to define ourselves.',
  '{"1": "Camus explored absurdity and revolt but this specific line is Sartre''s.", "2": "Beauvoir was Sartre''s partner and fellow existentialist but did not write this line.", "3": "Heidegger''s concept of ''Das Man'' (the They) is related but this quote is Sartre''s."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 4, 'What is the Ship of Theseus problem?',
  '[{"text": "Whether an object that has had all its parts replaced remains the same object", "correct": true}, {"text": "A historical question about Greek naval warfare"}, {"text": "A problem in fluid dynamics"}, {"text": "An astronomical puzzle about constellation names"}]',
  'If every plank of Theseus''s ship is gradually replaced, is it still the same ship? This ancient puzzle probes the nature of identity and persistence through change.',
  '{"1": "It uses a ship as a thought experiment, not as a historical topic.", "2": "It is a metaphysical problem, not a physics problem.", "3": "It has nothing to do with astronomy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 4, 'What is Descartes'' "evil demon" hypothesis?',
  '[{"text": "The possibility that an omnipotent deceiver makes us believe false things are true, casting doubt on all sensory knowledge", "correct": true}, {"text": "A religious doctrine about Satan"}, {"text": "A theory about mental illness"}, {"text": "A political conspiracy theory"}]',
  'Descartes proposed this in the "Meditations" as the most radical form of skeptical doubt. If a powerful demon could deceive us about everything, what can we know for certain? Only the cogito survives.',
  '{"1": "It is a philosophical thought experiment, not a religious claim.", "2": "It is about the limits of knowledge, not psychological disorders.", "3": "It is epistemological skepticism, not a conspiracy theory."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 4, 'What is the "is-ought problem" identified by David Hume?',
  '[{"text": "The gap between descriptive facts about the world and prescriptive moral claims", "correct": true}, {"text": "The difficulty of being morally perfect"}, {"text": "A problem in mathematics"}, {"text": "The conflict between science and religion"}]',
  'Hume observed that many arguments illegitimately derive "ought" (moral) conclusions from "is" (factual) premises. You cannot logically derive what should be from what is without additional moral premises.',
  '{"1": "The is-ought problem is about logical reasoning, not personal moral achievement.", "2": "It is a philosophical problem, not a mathematical one.", "3": "While related to reason vs. faith debates, it is specifically about the logic of moral reasoning."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 4, 'What is the difference between negative and positive liberty?',
  '[{"text": "Negative liberty is freedom from interference; positive liberty is freedom to achieve one''s potential", "correct": true}, {"text": "Negative liberty is bad; positive liberty is good"}, {"text": "Negative liberty is ancient; positive liberty is modern"}, {"text": "They are identical concepts"}]',
  'Isaiah Berlin distinguished these in "Two Concepts of Liberty" (1958). Negative liberty (Locke, Mill) means absence of external constraints. Positive liberty (Rousseau, Marx) means having the capacity and resources to act.',
  '{"1": "Neither is inherently good or bad; Berlin warned that positive liberty can justify totalitarianism.", "2": "Both concepts have roots in ancient and modern thought.", "3": "They are fundamentally different and often in tension with each other."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 4, 'What is the concept of the "sublime" in aesthetics?',
  '[{"text": "An experience of awe and terror before something vast or powerful that transcends ordinary beauty", "correct": true}, {"text": "A type of chemical reaction"}, {"text": "A musical note"}, {"text": "A cooking technique"}]',
  'Edmund Burke and Kant analyzed the sublime as an aesthetic experience distinct from beauty — it involves overwhelming power, vastness, or danger that simultaneously attracts and terrifies.',
  '{"1": "Sublimation is a chemical process; the sublime is an aesthetic concept.", "2": "The sublime is a philosophical category, not a musical term.", "3": "The sublime has nothing to do with cooking."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 4, 'What is the "precautionary principle" in environmental ethics?',
  '[{"text": "When an action risks harm to the public or environment, precaution should be taken even without full scientific certainty", "correct": true}, {"text": "Always choose the cheapest option"}, {"text": "Never take any risks under any circumstances"}, {"text": "Only act when there is 100% certainty of safety"}]',
  'The precautionary principle shifts the burden of proof: those proposing an action must demonstrate it is not harmful, rather than requiring victims to prove harm after the fact.',
  '{"1": "Cost is not the determining factor; safety and environmental protection are.", "2": "It does not prohibit all risk, only argues for caution under uncertainty.", "3": "It acknowledges that 100% certainty is often impossible and decisions must still be made."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 4, 'What was the significance of the trial of Socrates?',
  '[{"text": "It demonstrated the conflict between philosophical inquiry and democratic conformity", "correct": true}, {"text": "It established the first court system"}, {"text": "It proved that democracy always works"}, {"text": "It led to the founding of Rome"}]',
  'Socrates was tried and executed by Athenian democracy in 399 BC for "corrupting the youth" and "impiety." It showed that majority rule can suppress individual thought — a founding insight of political philosophy.',
  '{"1": "Courts existed before Socrates; Athens already had a legal system.", "2": "The trial showed a failure of democracy, not its success.", "3": "The trial had no connection to Roman history."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 4, 'How does the concept of "checks and balances" reflect philosophical skepticism about human nature?',
  '[{"text": "It assumes that power corrupts, so no single branch should hold unchecked authority", "correct": true}, {"text": "It assumes all people are naturally good"}, {"text": "It was designed to make government faster"}, {"text": "It was copied directly from the British monarchy"}]',
  'The founders, influenced by Montesquieu and drawing on Calvinist skepticism about human goodness, designed separation of powers to prevent tyranny by dividing authority among competing branches.',
  '{"1": "The system assumes the opposite — that people in power will tend toward abuse without constraints.", "2": "Checks and balances deliberately slow government to prevent hasty tyranny.", "3": "It was inspired by Montesquieu''s analysis of the British system but redesigned as a republic, not a monarchy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 4, 'What is Aristotle''s concept of "eudaimonia"?',
  '[{"text": "Human flourishing through the practice of virtue over a complete life", "correct": true}, {"text": "A type of Greek dance"}, {"text": "A form of government"}, {"text": "A mathematical theorem"}]',
  'Eudaimonia is often translated as "happiness" but more accurately means "flourishing" or "living well." For Aristotle, it is achieved by exercising the virtues consistently throughout one''s life.',
  '{"1": "Eudaimonia is a philosophical concept, not a dance.", "2": "It is about individual human excellence, not political organization.", "3": "It is an ethical concept, not a mathematical one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 4, 'What is Frederic Bastiat''s "broken window fallacy"?',
  '[{"text": "The error of thinking that destruction creates economic benefit because it stimulates repair spending", "correct": true}, {"text": "A theory about window manufacturing"}, {"text": "A tax policy about property damage"}, {"text": "An architectural principle"}]',
  'Bastiat showed that while a broken window creates work for the glazier, the money spent on repair would have been spent elsewhere more productively. Destruction diverts resources; it does not create wealth.',
  '{"1": "It is an economics lesson, not about manufacturing.", "2": "It is a thought experiment about economic reasoning, not a specific tax policy.", "3": "It has nothing to do with architecture."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 4, 'What is "jury nullification"?',
  '[{"text": "When a jury acquits a defendant despite evidence of guilt, because they believe the law itself is unjust", "correct": true}, {"text": "When a jury is dismissed for misconduct"}, {"text": "When a judge overrules the jury"}, {"text": "When all jurors vote guilty"}]',
  'Jury nullification is the power of juries to act as a check on unjust laws. Historically used to resist the Fugitive Slave Act — jurors refused to convict those who helped escaped slaves.',
  '{"1": "Jury dismissal is a procedural matter, not nullification.", "2": "A judge overruling a jury is a directed verdict, not nullification.", "3": "Unanimous guilty verdicts are convictions, the opposite of nullification."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 4, 'What philosophical tension does Wagner''s concept of "Gesamtkunstwerk" attempt to resolve?',
  '[{"text": "The separation between individual art forms, by fusing music, drama, poetry, and visual art into a total work", "correct": true}, {"text": "The conflict between German and Italian opera"}, {"text": "The disagreement about tuning systems"}, {"text": "The rivalry between orchestras"}]',
  'Wagner''s Gesamtkunstwerk (total work of art) aimed to reunify arts that had been separated since ancient Greek drama, creating an immersive experience that elevates the audience beyond individual senses.',
  '{"1": "While Wagner competed with Italian opera, Gesamtkunstwerk is about synthesis of art forms, not national rivalry.", "2": "Tuning systems are acoustic/technical, not what Gesamtkunstwerk addresses.", "3": "Orchestral rivalry is institutional, not philosophical."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 4, 'How does Stanley Kubrick''s "2001: A Space Odyssey" engage with philosophy of technology?',
  '[{"text": "By showing technology as both humanity''s greatest tool and existential threat through HAL 9000", "correct": true}, {"text": "By documenting actual space missions"}, {"text": "By promoting space tourism"}, {"text": "By criticizing all forms of technology"}]',
  'Kubrick''s film traces humanity''s evolution alongside tools — from bone weapons to AI — suggesting technology is inseparable from human progress but also poses risks when it surpasses human control.',
  '{"1": "The film is fiction, not a documentary.", "2": "It is a philosophical meditation, not a promotional film.", "3": "Kubrick does not reject technology; he examines its dual nature."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 4, 'Who wrote: "Man is condemned to be free"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Friedrich Nietzsche"}, {"text": "Martin Heidegger"}]',
  'Sartre wrote this in "Existentialism Is a Humanism" (1946). Because there is no predetermined human nature or divine plan, we are radically free — and radically responsible for our choices.',
  '{"1": "Camus explored freedom through the lens of absurdity, but this specific formulation is Sartre''s.", "2": "Nietzsche celebrated freedom but did not frame it as condemnation.", "3": "Heidegger discussed ''thrownness'' (Geworfenheit) but not ''condemnation to freedom.''"}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 5, 'What is the difference between ontological and cosmological arguments for God''s existence?',
  '[{"text": "Ontological argues from the concept of a perfect being; cosmological argues from the existence of the universe needing a cause", "correct": true}, {"text": "They are identical arguments"}, {"text": "Ontological is scientific; cosmological is religious"}, {"text": "Ontological is Eastern; cosmological is Western"}]',
  'Anselm''s ontological argument reasons purely from the concept of God as the greatest conceivable being. Aquinas''s cosmological argument reasons from observable facts — things exist, change happens — to a necessary first cause.',
  '{"1": "They are structurally different types of arguments.", "2": "Both are philosophical, not scientific; neither is purely religious.", "3": "Both originate in Western philosophy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 5, 'What is the difference between internalism and externalism in epistemology?',
  '[{"text": "Internalism requires the knower to have cognitive access to their justification; externalism does not", "correct": true}, {"text": "Internalism is subjective; externalism is about the external world"}, {"text": "They are competing theories in physics"}, {"text": "Internalism is Eastern philosophy; externalism is Western"}]',
  'Internalists hold that justification must be mentally accessible to the believer. Externalists (like reliabilists) hold that a belief can be justified by a reliable process even if the believer cannot articulate why.',
  '{"1": "Both are about the conditions for knowledge, not about subjectivity vs. objectivity directly.", "2": "These are epistemological theories, not physics.", "3": "Both are debates within Western analytic epistemology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 5, 'What is the "demandingness objection" against utilitarianism?',
  '[{"text": "That utilitarianism requires too much self-sacrifice by demanding we always maximize overall happiness", "correct": true}, {"text": "That utilitarianism is too easy to follow"}, {"text": "That utilitarianism conflicts with mathematics"}, {"text": "That utilitarianism was invented too recently"}]',
  'If we must always act to maximize total happiness, we should donate most of our income, never rest when others suffer, and constantly sacrifice personal projects. Critics argue this exceeds reasonable moral demands.',
  '{"1": "The objection is precisely that it demands too much, not too little.", "2": "Utilitarianism is a philosophical theory; it does not conflict with mathematics.", "3": "Utilitarianism dates to the 18th century, which is not the issue."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 5, 'What is the difference between libertarianism and classical liberalism?',
  '[{"text": "Both value individual liberty, but classical liberalism accepts a minimal state while some libertarians advocate for no state at all", "correct": true}, {"text": "They are completely identical"}, {"text": "Libertarianism is left-wing; classical liberalism is right-wing"}, {"text": "Classical liberalism opposes all markets"}]',
  'Classical liberals (Locke, Smith, Mill) accept a limited government to protect rights. Libertarians range from minarchists (minimal state) to anarcho-capitalists (no state). They share roots but differ on the role of government.',
  '{"1": "They overlap significantly but are not identical.", "2": "Both span the political spectrum; neither is purely left or right.", "3": "Classical liberalism was built on free market principles."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 5, 'What is Walter Benjamin''s concept of "aura" in art?',
  '[{"text": "The unique presence and authenticity of an original work that is diminished by mechanical reproduction", "correct": true}, {"text": "A visual glow around paintings"}, {"text": "The frame of a picture"}, {"text": "The price of artwork at auction"}]',
  'In "The Work of Art in the Age of Mechanical Reproduction" (1935), Benjamin argued that photography and film destroy the "aura" — the unique, unrepeatable presence of the original — transforming art''s social function.',
  '{"1": "Aura is a theoretical concept about authenticity, not a literal visual effect.", "2": "Framing is a physical element, not what Benjamin meant.", "3": "Market value is economic, not what Benjamin analyzed."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 5, 'What is the philosophical problem with "algorithmic bias"?',
  '[{"text": "Algorithms can perpetuate and amplify existing social prejudices embedded in their training data, raising questions about justice and responsibility", "correct": true}, {"text": "Algorithms are always perfectly fair"}, {"text": "Only humans can be biased, never machines"}, {"text": "Bias only exists in political contexts"}]',
  'When AI systems learn from historically biased data, they reproduce those biases at scale. This raises questions about distributive justice, accountability, and whether we can build truly neutral systems.',
  '{"1": "Algorithms reflect the data and design choices of their creators, which can be biased.", "2": "Machines inherit biases from their human-created training data and design.", "3": "Bias exists in many contexts — economic, social, algorithmic, not just political."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 5, 'How did the rediscovery of Aristotle in the 12th century transform European philosophy?',
  '[{"text": "It introduced systematic empirical reasoning into a tradition dominated by Platonic idealism and theology", "correct": true}, {"text": "It had no effect whatsoever"}, {"text": "It ended all philosophical inquiry"}, {"text": "It replaced Christianity with paganism"}]',
  'Aristotle''s works, preserved by Islamic scholars, reintroduced logic, natural philosophy, and empirical methodology to medieval Europe. Aquinas synthesized Aristotle with Christianity, creating Scholasticism.',
  '{"1": "It had enormous transformative effects on European thought.", "2": "It invigorated philosophy, not ended it.", "3": "Aquinas integrated Aristotle with Christianity rather than replacing it."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 5, 'How does the American concept of "ordered liberty" differ from pure libertarianism?',
  '[{"text": "Ordered liberty holds that freedom requires a framework of law and institutional constraints to prevent license from destroying liberty itself", "correct": true}, {"text": "They are identical"}, {"text": "Ordered liberty opposes all freedom"}, {"text": "Pure libertarianism supports government control"}]',
  'The founders believed liberty without law becomes anarchy, which leads to tyranny. Constitutional limits, separation of powers, and rule of law create the structure within which individual freedom flourishes.',
  '{"1": "They share values but ordered liberty accepts institutional constraints that some libertarians reject.", "2": "Ordered liberty champions freedom within a constitutional framework.", "3": "Pure libertarianism opposes government control, which is why it differs from ordered liberty."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 5, 'What is the difference between Aristotelian virtue ethics and Stoic virtue ethics?',
  '[{"text": "Aristotle held that external goods contribute to flourishing; Stoics held that virtue alone is sufficient for happiness", "correct": true}, {"text": "They are identical"}, {"text": "Aristotle rejected virtue; Stoics embraced it"}, {"text": "Stoics came before Aristotle"}]',
  'Aristotle argued that health, wealth, and friends contribute to eudaimonia alongside virtue. Stoics like Epictetus and Marcus Aurelius held that virtue alone guarantees happiness, regardless of external circumstances.',
  '{"1": "Both are virtue ethics traditions but differ on the role of external goods.", "2": "Aristotle was the founder of systematic virtue ethics.", "3": "Aristotle (384-322 BC) preceded the Stoic school (founded ~300 BC)."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 5, 'What is the Austrian School''s critique of central economic planning?',
  '[{"text": "That no central authority can possess the dispersed local knowledge needed to allocate resources efficiently", "correct": true}, {"text": "That planning is morally wrong"}, {"text": "That mathematics cannot be applied to economics"}, {"text": "That only monarchy can manage an economy"}]',
  'Hayek''s "knowledge problem" argues that economic knowledge is dispersed among millions of individuals. No central planner can aggregate this knowledge; only market prices can transmit it efficiently.',
  '{"1": "The critique is epistemic (about knowledge), not primarily moral.", "2": "Austrian economists use mathematical reasoning; the critique is about information, not math.", "3": "Austrian economists advocate free markets, not monarchy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 5, 'What is the difference between "rule of law" and "rule by law"?',
  '[{"text": "Rule of law means law constrains everyone including rulers; rule by law means rulers use law as a tool of power", "correct": true}, {"text": "They are synonyms"}, {"text": "Rule of law is ancient; rule by law is modern"}, {"text": "Rule by law is more democratic"}]',
  'Rule of law implies that law is supreme — no one is above it. Rule by law means the government uses law instrumentally to control the population while exempting itself. The distinction is fundamental to liberty.',
  '{"1": "They are opposite concepts despite similar wording.", "2": "Both concepts appear throughout history.", "3": "Rule by law can be authoritarian, the opposite of democratic."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 5, 'How does Theodor Adorno''s critique of popular music relate to the Frankfurt School''s broader philosophy?',
  '[{"text": "Adorno argued that mass-produced music creates passive consumers, serving as a tool of cultural domination that prevents critical thinking", "correct": true}, {"text": "Adorno loved all popular music"}, {"text": "The Frankfurt School had no interest in culture"}, {"text": "Adorno argued music has no social significance"}]',
  'Adorno saw the "culture industry" as producing standardized entertainment that pacifies the masses and prevents them from questioning capitalist social relations — art becomes a commodity rather than a vehicle for truth.',
  '{"1": "Adorno was famously critical of popular music, especially jazz and Tin Pan Alley.", "2": "Cultural critique was central to the Frankfurt School''s project.", "3": "Adorno believed music had enormous social and political significance."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 5, 'What philosophical concept does the "auteur theory" of cinema embody?',
  '[{"text": "That the director is the primary creative author of a film, expressing a personal philosophical vision through their body of work", "correct": true}, {"text": "That films should have no director"}, {"text": "That only documentaries are real cinema"}, {"text": "That audiences create the meaning of films"}]',
  'The auteur theory (Cahiers du Cinéma, Andrew Sarris) applies the Romantic concept of artistic genius to cinema — the director''s personal vision, recurring themes, and style constitute authorship comparable to a novelist or painter.',
  '{"1": "Auteur theory elevates the director, not eliminates them.", "2": "Auteur theory applies to all cinema, not just documentaries.", "3": "While audience interpretation matters, auteur theory focuses on the director''s intentional vision."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 5, 'Who wrote: "Entities should not be multiplied beyond necessity"?',
  '[{"text": "William of Ockham", "correct": true}, {"text": "Thomas Aquinas"}, {"text": "Roger Bacon"}, {"text": "Duns Scotus"}]',
  'This principle, known as Occam''s Razor, advocates parsimony in explanation — the simplest theory that fits the evidence should be preferred. It remains a cornerstone of scientific and philosophical reasoning.',
  '{"1": "Aquinas was a contemporary but favored more elaborate metaphysical systems.", "2": "Roger Bacon was an empiricist but did not formulate this principle.", "3": "Duns Scotus was a rival Scholastic philosopher with different methodological commitments."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 6, 'How does Leibniz''s principle of sufficient reason differ from Hume''s regularity theory of causation?',
  '[{"text": "Leibniz holds that everything has a reason for being as it is; Hume argues we only observe constant conjunction, not genuine causation", "correct": true}, {"text": "They agree on everything"}, {"text": "Hume believed in rational necessity; Leibniz was an empiricist"}, {"text": "Neither philosopher discussed causation"}]',
  'Leibniz was a rationalist who believed reality is structured by logical necessity. Hume was an empiricist who argued that causation is merely a habit of mind — we never perceive the necessary connection itself.',
  '{"1": "They fundamentally disagreed on the nature of causation.", "2": "Their positions are reversed: Leibniz was the rationalist, Hume the empiricist.", "3": "Both extensively discussed causation."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 6, 'What is the "brain in a vat" thought experiment and which historical argument does it update?',
  '[{"text": "A modern version of Descartes'' evil demon: you might be a disembodied brain being fed false experiences by a computer", "correct": true}, {"text": "An experiment in neurosurgery"}, {"text": "A theory about artificial intelligence creation"}, {"text": "A dietary philosophy"}]',
  'Hilary Putnam''s "brain in a vat" scenario modernizes Cartesian skepticism. It asks: how can you know you are not a brain being electrically stimulated to experience an illusory world? Putnam used it to argue for semantic externalism.',
  '{"1": "It is a thought experiment, not an actual surgical procedure.", "2": "It questions knowledge of reality, not how to build AI.", "3": "It has nothing to do with diet."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 6, 'How does Bernard Williams'' critique of utilitarianism through "integrity" differ from Kantian objections?',
  '[{"text": "Williams argues utilitarianism alienates people from their deepest commitments; Kant objects that it fails to respect persons as ends in themselves", "correct": true}, {"text": "Williams and Kant agree completely"}, {"text": "Williams is a utilitarian; Kant is a nihilist"}, {"text": "Neither criticized utilitarianism"}]',
  'Williams argued that by demanding we always maximize aggregate welfare, utilitarianism destroys personal integrity — our ground projects and commitments that make life meaningful. Kant''s objection is about treating people merely as means.',
  '{"1": "They critique utilitarianism from different angles — personal integrity vs. respect for persons.", "2": "Williams was a critic of utilitarianism; Kant was a deontologist, not a nihilist.", "3": "Both were famous critics of utilitarian moral theory."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 6, 'What is the difference between communitarianism and liberalism in political philosophy?',
  '[{"text": "Liberalism prioritizes individual rights and autonomy; communitarianism argues that identity and morality are shaped by community membership", "correct": true}, {"text": "They are the same theory"}, {"text": "Communitarianism rejects all community"}, {"text": "Liberalism opposes individual rights"}]',
  'Communitarians (MacIntyre, Sandel, Taylor) criticize liberal individualism for ignoring how communities shape identity, values, and moral reasoning. Liberals (Rawls, Dworkin) argue that individual rights must be protected from communal pressure.',
  '{"1": "They represent fundamentally different orientations toward the individual-community relationship.", "2": "Communitarianism champions community; the name itself indicates this.", "3": "Liberalism is built on individual rights — that is its core commitment."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 6, 'What is Heidegger''s concept of art as "the setting-into-work of truth"?',
  '[{"text": "Art reveals truths about being and existence that cannot be captured by scientific or propositional knowledge", "correct": true}, {"text": "Art is merely decorative"}, {"text": "Truth can only be found in mathematics"}, {"text": "Art should represent photographs exactly"}]',
  'In "The Origin of the Work of Art," Heidegger argued that great art opens up a world of meaning — it discloses truth about what it means to be, in ways that science and logic cannot articulate.',
  '{"1": "Heidegger held art to be one of the highest forms of truth-disclosure.", "2": "Heidegger explicitly argued against reducing truth to logical or mathematical propositions.", "3": "Heidegger valued art''s capacity to reveal, not to copy appearances."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 6, 'What is the "repugnant conclusion" in population ethics?',
  '[{"text": "That for any population of happy people, a much larger population with barely worth-living lives would have greater total utility", "correct": true}, {"text": "A conclusion about pollution"}, {"text": "A theory about criminal sentencing"}, {"text": "An argument against vegetarianism"}]',
  'Derek Parfit''s "repugnant conclusion" shows that total utilitarianism implies we should prefer a world of billions of people with minimally positive lives over a smaller world of very happy people — because the total happiness is greater.',
  '{"1": "It is about population ethics and utility, not environmental pollution.", "2": "It concerns the value of different population sizes, not criminal justice.", "3": "It is about aggregate welfare, not dietary choices."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 6, 'How did Islamic philosophy preserve and transform Greek philosophical traditions?',
  '[{"text": "Muslim scholars translated, commented on, and extended Aristotle and Plato, transmitting them to medieval Europe through Spain and Sicily", "correct": true}, {"text": "Islamic civilization had no contact with Greek philosophy"}, {"text": "Muslim scholars destroyed all Greek texts"}, {"text": "Greek philosophy was only preserved in China"}]',
  'Al-Kindi, Al-Farabi, Avicenna, and Averroes translated and critically engaged with Greek works. Averroes'' commentaries on Aristotle were so influential that medieval Europeans called him simply "The Commentator."',
  '{"1": "Islamic scholars were the primary preservers and transmitters of Greek philosophy.", "2": "Muslim scholars devoted enormous effort to preserving and extending Greek texts.", "3": "While Chinese philosophy has its own rich tradition, Greek philosophy was primarily preserved through the Islamic world."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 6, 'How does Frederick Douglass''s philosophy reconcile natural rights theory with the reality of slavery?',
  '[{"text": "Douglass argued that the Constitution''s principles of liberty were inherently anti-slavery, and that the nation must live up to its own founding ideals", "correct": true}, {"text": "Douglass rejected the Constitution entirely"}, {"text": "Douglass supported slavery"}, {"text": "Douglass was not a philosopher"}]',
  'In "What to the Slave Is the Fourth of July?" Douglass used the founders'' own natural rights philosophy as a weapon against slavery — arguing America''s promise was real but unfulfilled, not inherently flawed.',
  '{"1": "Douglass saw the Constitution as an anti-slavery document that had been betrayed, not one to reject.", "2": "Douglass was one of the most powerful voices against slavery in American history.", "3": "Douglass was a profound political and moral philosopher."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 6, 'How does Nietzsche''s "master morality" differ from "slave morality"?',
  '[{"text": "Master morality values strength, nobility, and self-affirmation; slave morality values humility, pity, and resentment of the powerful", "correct": true}, {"text": "They are the same thing"}, {"text": "Master morality is about literal slave ownership"}, {"text": "Nietzsche endorsed slave morality"}]',
  'In "On the Genealogy of Morals," Nietzsche traced morality''s origins to two types: the noble''s self-affirming values and the weak''s reactive resentment (ressentiment) that redefines strength as evil.',
  '{"1": "They are opposing moral frameworks in Nietzsche''s genealogical analysis.", "2": "Nietzsche used these terms philosophically, not literally about slavery as an institution.", "3": "Nietzsche was critical of slave morality as life-denying."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 6, 'What is the Cantillon Effect and why is it philosophically significant?',
  '[{"text": "New money benefits those who receive it first, increasing inequality — it shows that monetary policy has distributive consequences", "correct": true}, {"text": "A theory about canal building"}, {"text": "A law about restaurant pricing"}, {"text": "A medical theory about blood circulation"}]',
  'Richard Cantillon observed that money enters the economy at specific points, benefiting those closest to the source. By the time it reaches the broader economy, prices have already risen. This reveals that inflation is never neutral.',
  '{"1": "Cantillon was an economist, not an engineer.", "2": "The effect describes monetary distribution, not food pricing.", "3": "Cantillon wrote about economics, not medicine."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 6, 'What is the tension between Hart''s legal positivism and Dworkin''s interpretivism?',
  '[{"text": "Hart says law is a system of rules identified by social facts; Dworkin argues law also includes principles that require moral interpretation", "correct": true}, {"text": "They completely agree"}, {"text": "Hart was a judge; Dworkin was a politician"}, {"text": "Neither contributed to legal philosophy"}]',
  'Hart argued that law consists of primary rules (obligations) and secondary rules (rules about rules), identified by a "rule of recognition." Dworkin countered that hard cases require judges to apply moral principles, not just rules.',
  '{"1": "The Hart-Dworkin debate is one of the most important disagreements in legal philosophy.", "2": "Both were legal philosophers and professors, not judges or politicians.", "3": "Both are among the most influential legal philosophers of the 20th century."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 6, 'What philosophical problem does the concept of "authenticity" in music performance raise?',
  '[{"text": "Whether performing music exactly as the composer intended is possible or desirable, and what constitutes fidelity to a work", "correct": true}, {"text": "Whether musicians should wear costumes"}, {"text": "Whether concerts should be free"}, {"text": "Whether vinyl sounds better than digital"}]',
  'The authenticity debate asks: should we play Bach on period instruments at historical tempos? Or does each performance necessarily interpret and re-create the work? This connects to broader questions about the identity of artworks.',
  '{"1": "The debate is about musical interpretation, not costuming.", "2": "Concert pricing is economic, not philosophical.", "3": "Audio format preferences are technical, not the core philosophical issue."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 6, 'How does Terrence Malick''s filmmaking embody Heideggerian phenomenology?',
  '[{"text": "Through meditative attention to being-in-the-world, natural beauty, and the way consciousness is always already embedded in a meaningful environment", "correct": true}, {"text": "By using only dialogue"}, {"text": "By making documentaries about Heidegger"}, {"text": "By avoiding all visual beauty"}]',
  'Malick, who studied philosophy at Harvard and translated Heidegger, creates films (The Tree of Life, The Thin Red Line) that immerse viewers in the experience of being — light, nature, inner monologue — rather than conventional narrative.',
  '{"1": "Malick''s films are known for minimal dialogue and emphasis on visual storytelling.", "2": "Malick makes philosophical fiction films, not documentaries.", "3": "Malick''s films are celebrated for their extraordinary visual beauty."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 6, 'Who wrote: "The tradition of all dead generations weighs like a nightmare on the brains of the living"?',
  '[{"text": "Karl Marx", "correct": true}, {"text": "Georg Hegel"}, {"text": "Max Weber"}, {"text": "Antonio Gramsci"}]',
  'Marx wrote this in "The Eighteenth Brumaire of Louis Bonaparte" (1852), arguing that people make history but not under conditions of their choosing — they are constrained by inherited social structures and ideologies.',
  '{"1": "Hegel saw tradition as the progressive unfolding of Spirit, not a nightmare.", "2": "Weber analyzed tradition through bureaucracy and rationalization but did not write this specific line.", "3": "Gramsci developed the concept of cultural hegemony but this quote is Marx''s."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 7, 'What is Quine''s critique of the analytic-synthetic distinction?',
  '[{"text": "That no clear boundary exists between truths by definition and truths by fact, undermining a central pillar of logical positivism", "correct": true}, {"text": "That mathematics is useless"}, {"text": "That all philosophy should be abandoned"}, {"text": "That English is superior to other languages"}]',
  'In "Two Dogmas of Empiricism" (1951), Quine argued that the supposed distinction between analytic truths (true by meaning) and synthetic truths (true by fact) cannot be sustained — all beliefs face empirical evidence as a whole.',
  '{"1": "Quine valued mathematics highly; he was a logician.", "2": "Quine sought to reform philosophy, not abandon it.", "3": "Quine''s argument is about the structure of knowledge, not about any natural language."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 7, 'What is Alvin Goldman''s process reliabilism?',
  '[{"text": "A belief is justified if it is produced by a cognitive process that reliably produces true beliefs, regardless of whether the believer knows this", "correct": true}, {"text": "A theory about reliable computer systems"}, {"text": "A method for testing physical products"}, {"text": "A type of statistical analysis"}]',
  'Goldman proposed that justification depends on the reliability of the belief-forming process (perception, memory, reasoning), not on the believer''s ability to articulate their reasons. This is a form of epistemic externalism.',
  '{"1": "It is about human cognition, not computer science.", "2": "It is epistemological, not about product testing.", "3": "It is a theory of knowledge justification, not a statistical method."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 7, 'What is G.E. Moore''s "open question argument" against ethical naturalism?',
  '[{"text": "For any natural property N, it is always meaningful to ask ''Is N good?'' — showing that ''good'' cannot be defined as any natural property", "correct": true}, {"text": "An argument about opening hours of shops"}, {"text": "A debate technique in political campaigns"}, {"text": "A theory about questionnaire design"}]',
  'Moore argued in "Principia Ethica" (1903) that if "good" meant "pleasurable" (or any natural property), then asking "Is pleasure good?" would be trivially true — but it''s a substantive question, proving "good" is indefinable.',
  '{"1": "The ''open question'' is a logical test about the nature of moral concepts.", "2": "It is a meta-ethical argument, not a political technique.", "3": "It concerns moral philosophy, not survey methodology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 7, 'What is Carl Schmitt''s concept of "the political" and how does it challenge liberal theory?',
  '[{"text": "The political is defined by the friend-enemy distinction, which liberalism cannot eliminate through procedural neutrality or rational deliberation", "correct": true}, {"text": "Schmitt was a liberal democrat"}, {"text": "The political means polite conversation"}, {"text": "Schmitt argued that conflict is impossible"}]',
  'Schmitt argued that the essence of politics is the existential distinction between friend and enemy. Liberalism''s attempt to replace politics with economics, law, or ethics ultimately fails because it cannot eliminate this fundamental antagonism.',
  '{"1": "Schmitt was a critic of liberalism and parliamentary democracy.", "2": "Schmitt defined the political by conflict, not politeness.", "3": "Schmitt argued that political conflict is ineliminable."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 7, 'What is Arthur Danto''s thesis about the "end of art"?',
  '[{"text": "That after Warhol, art became self-conscious philosophy — any object can be art, so art as a progressive historical narrative has reached its conclusion", "correct": true}, {"text": "That no more art will ever be created"}, {"text": "That only painting counts as art"}, {"text": "That art museums should close"}]',
  'Danto argued that Warhol''s Brillo Boxes showed that visual appearance cannot distinguish art from non-art. Art became a philosophical question about its own nature, ending the historical narrative of stylistic progress.',
  '{"1": "Danto meant the end of art''s historical narrative, not the cessation of art-making.", "2": "Danto''s point is that any medium or object can be art.", "3": "Danto championed art museums and institutions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 7, 'What is the "non-identity problem" in ethics?',
  '[{"text": "Future people cannot be harmed by current policies because those policies determine which specific individuals will exist", "correct": true}, {"text": "A problem with identity theft"}, {"text": "The difficulty of remembering names"}, {"text": "A psychological disorder"}]',
  'Derek Parfit showed that if we choose a policy that causes a different set of people to be born, those people cannot claim they were harmed — since the alternative policy would mean they never existed. This challenges intergenerational justice arguments.',
  '{"1": "It is about the metaphysics of identity and future persons, not identity theft.", "2": "It is a philosophical problem, not about memory.", "3": "It is a problem in ethics and metaphysics, not psychology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 7, 'What was the significance of the Leibniz-Clarke correspondence?',
  '[{"text": "It debated whether space and time are absolute (Newton/Clarke) or relational (Leibniz), shaping the foundations of physics and metaphysics", "correct": true}, {"text": "It was about postal reform"}, {"text": "It settled a property dispute"}, {"text": "It was about religious conversion"}]',
  'Samuel Clarke defended Newton''s view that space and time are absolute containers; Leibniz argued they are merely relations between objects. This debate anticipated Einstein''s relativity and remains foundational in philosophy of physics.',
  '{"1": "The correspondence was purely philosophical and scientific.", "2": "It concerned the nature of space and time, not property.", "3": "While theological arguments appeared, the core debate was about physics and metaphysics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 7, 'What is the "calculation problem" that Mises posed against socialism?',
  '[{"text": "Without market prices for capital goods, a socialist economy cannot rationally calculate which production methods are most efficient", "correct": true}, {"text": "A problem with calculator batteries"}, {"text": "The difficulty of counting population"}, {"text": "A challenge in teaching arithmetic"}]',
  'Ludwig von Mises argued in 1920 that socialism cannot perform economic calculation because state ownership of means of production eliminates the market prices needed to compare the value of different uses of capital.',
  '{"1": "The calculation problem is about economic planning, not physical calculators.", "2": "It concerns resource allocation, not population counting.", "3": "It is an economic theory, not a pedagogical problem."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 7, 'What is Lon Fuller''s "inner morality of law" and how does it challenge legal positivism?',
  '[{"text": "Law must satisfy eight formal requirements (generality, promulgation, non-retroactivity, clarity, consistency, possibility, stability, congruence) to function as law at all", "correct": true}, {"text": "Judges must be moral people"}, {"text": "Only religious law is valid"}, {"text": "Law has no connection to any principles"}]',
  'Fuller argued that law has an inherent morality in its very form — a system failing these eight criteria is not merely bad law but fails to be law altogether. This bridges legal positivism and natural law theory.',
  '{"1": "Fuller''s argument is about the formal structure of legal systems, not the character of individual judges.", "2": "Fuller was a secular legal philosopher, not arguing for religious law.", "3": "Fuller''s entire project was to show law''s connection to principles of legality."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 7, 'What is Alasdair MacIntyre''s argument in "After Virtue" about the crisis of modern morality?',
  '[{"text": "Modern moral discourse is incoherent because we use fragments of past ethical traditions stripped of the teleological frameworks that made them intelligible", "correct": true}, {"text": "Modern morality is perfect"}, {"text": "Virtue ethics was never important"}, {"text": "Only ancient Greeks had moral problems"}]',
  'MacIntyre argued that Enlightenment attempts to justify morality without Aristotelian teleology produced rival, irreconcilable moral claims. Only recovering the tradition of virtue ethics within practices and communities can restore moral coherence.',
  '{"1": "MacIntyre''s entire thesis is that modern morality is in crisis.", "2": "MacIntyre argued for the recovery of virtue ethics as essential.", "3": "MacIntyre''s argument spans all of Western moral history, not just ancient Greece."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 8, 'What is the difference between type identity theory and functionalism in philosophy of mind?',
  '[{"text": "Type identity says mental states ARE brain states; functionalism says mental states are defined by their functional role regardless of physical substrate", "correct": true}, {"text": "They are the same theory"}, {"text": "Functionalism denies the existence of minds"}, {"text": "Type identity is about typography"}]',
  'Type identity (Place, Smart) claims pain IS C-fiber firing. Functionalism (Putnam, early) says pain is whatever plays the causal role of pain — it could be neurons, silicon, or anything with the right functional organization.',
  '{"1": "They are competing theories with fundamentally different implications for AI and multiple realizability.", "2": "Functionalism accepts the existence of mental states; it just defines them functionally.", "3": "Type identity is about the mind-brain relationship, not printing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 8, 'What is the significance of Kripke''s argument for a posteriori necessities?',
  '[{"text": "Some necessary truths (like water = H2O) can only be known through empirical investigation, challenging the traditional equation of necessary with a priori", "correct": true}, {"text": "All knowledge is innate"}, {"text": "Nothing is necessary"}, {"text": "Empirical science is impossible"}]',
  'Kripke showed in "Naming and Necessity" (1972) that "Water is H2O" is necessarily true (in all possible worlds) yet known empirically. This shattered the Kantian assumption that necessity implies a priori knowability.',
  '{"1": "Kripke argued some knowledge is empirical, not that all is innate.", "2": "Kripke affirmed the existence of necessary truths; he just showed they can be empirically discovered.", "3": "Kripke''s work supports the power of empirical science."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 8, 'What is Christine Korsgaard''s "constructivism" in moral philosophy?',
  '[{"text": "Moral truths are not discovered but constructed by rational agents through the process of reflective endorsement of their own practical identities", "correct": true}, {"text": "Morality is about building physical structures"}, {"text": "Only construction workers have moral status"}, {"text": "Moral truths are written in scripture"}]',
  'Korsgaard argues that moral obligation arises when rational agents reflect on their motives and endorse them as expressive of their practical identity. Morality is created through rational self-legislation, following Kant.',
  '{"1": "''Constructivism'' here means moral values are constructed through reason, not physical building.", "2": "Moral status applies to all rational agents in Korsgaard''s theory.", "3": "Korsgaard''s approach is secular and Kantian, not scriptural."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 8, 'What is Philip Pettit''s concept of "freedom as non-domination"?',
  '[{"text": "Freedom requires not merely the absence of interference but the absence of the capacity for arbitrary interference by others", "correct": true}, {"text": "Freedom means doing whatever you want"}, {"text": "Non-domination is a type of board game"}, {"text": "Pettit rejected all concepts of freedom"}]',
  'Pettit distinguishes his republican concept from Berlin''s negative liberty. A slave with a kind master lacks freedom even without actual interference — because the master has the power to interfere arbitrarily. The structural capacity for domination is the problem.',
  '{"1": "Pettit''s concept is more demanding than mere absence of interference.", "2": "Non-domination is a political philosophy concept, not a game.", "3": "Pettit is a champion of a specific kind of freedom, not a rejecter of freedom."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 8, 'What was the significance of the Methodenstreit in economics and philosophy?',
  '[{"text": "A debate between the Austrian School (Menger) and the German Historical School (Schmoller) over whether economics should use abstract deductive theory or historical-empirical methods", "correct": true}, {"text": "A cooking competition"}, {"text": "A war between Austria and Germany"}, {"text": "A debate about teaching methods in primary schools"}]',
  'The Methodenstreit (1880s) shaped the foundations of social science methodology. Menger argued for universal economic laws derived from individual action; Schmoller insisted that economic truths are historically contingent.',
  '{"1": "It was an intellectual debate about methodology, not a competition.", "2": "It was an academic dispute, not a military conflict.", "3": "It concerned the methodology of economics as a science."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 8, 'What is Nelson Goodman''s "grue" problem and how does it relate to aesthetics?',
  '[{"text": "It shows that any set of observations is compatible with infinite hypotheses, challenging the idea that artistic style can be objectively identified from examples alone", "correct": true}, {"text": "A problem about glue manufacturing"}, {"text": "A color theory for painters"}, {"text": "A cooking problem about gruel"}]',
  'Goodman''s "grue" (green until 2050, then blue) shows that induction is underdetermined. Applied to aesthetics, this means that identifying an artist''s style or a genre''s characteristics from examples is never logically conclusive.',
  '{"1": "''Grue'' is a philosophical neologism, not related to adhesives.", "2": "It is about the logic of classification, not practical color theory.", "3": "''Grue'' is not ''gruel'' — it is a thought experiment about induction."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 8, 'What is the difference between Philippa Foot''s "natural goodness" approach and neo-Aristotelian virtue ethics?',
  '[{"text": "Foot grounds virtue in the natural teleology of living organisms — goodness for humans is like goodness for any species: fulfilling the life-form''s characteristic patterns", "correct": true}, {"text": "Foot rejected virtue ethics"}, {"text": "Foot was a utilitarian"}, {"text": "There is no difference"}]',
  'In "Natural Goodness" (2001), Foot argued that human virtues are grounded in our nature as a species — just as deep roots are good for an oak. This naturalizes Aristotelian teleology without requiring cosmic purpose.',
  '{"1": "Foot was one of the most important revivalists of virtue ethics.", "2": "Foot explicitly opposed utilitarianism and argued for virtue-based ethics.", "3": "Foot''s approach is distinctive within neo-Aristotelian virtue ethics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 8, 'What is the Coase theorem and what are its philosophical implications for property rights?',
  '[{"text": "If transaction costs are zero, initial allocation of property rights does not affect economic efficiency, because parties will bargain to the optimal outcome regardless", "correct": true}, {"text": "A theorem about coastal erosion"}, {"text": "A law about coat ownership"}, {"text": "A mathematical proof about prime numbers"}]',
  'Ronald Coase showed that externalities can be resolved through private bargaining if property rights are clear and transaction costs are low. The philosophical implication: the problem is not externalities per se but transaction costs and unclear rights.',
  '{"1": "Coase is an economist, not a geologist.", "2": "It concerns property rights generally, not clothing.", "3": "It is an economic theorem, not a number theory proof."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 8, 'What is the difference between Hart''s "rule of recognition" and Kelsen''s "Grundnorm"?',
  '[{"text": "Hart''s rule is a social fact about official practice; Kelsen''s Grundnorm is a presupposed logical condition for the validity of all other legal norms", "correct": true}, {"text": "They are identical concepts"}, {"text": "Hart was German; Kelsen was English"}, {"text": "Neither contributed to jurisprudence"}]',
  'Hart''s rule of recognition is an empirical social practice — officials actually accept certain criteria for identifying valid law. Kelsen''s Grundnorm is a transcendental presupposition, a logical hypothesis that grounds the entire legal system.',
  '{"1": "They are structurally similar but philosophically distinct.", "2": "Hart was British; Kelsen was Austrian.", "3": "Both are among the most influential legal theorists of the 20th century."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 9, 'What is David Lewis''s modal realism?',
  '[{"text": "The thesis that all possible worlds are equally real, concrete universes — ours is merely actual to us, not metaphysically privileged", "correct": true}, {"text": "A theory about fashion trends"}, {"text": "The idea that only our world exists"}, {"text": "A theory about video game design"}]',
  'Lewis argued in "On the Plurality of Worlds" (1986) that every way the world could have been is a real, concrete world. A "possible world" where unicorns exist literally exists — we just don''t happen to be there.',
  '{"1": "Modal realism concerns possible worlds in philosophy, not fashion.", "2": "Lewis''s thesis is precisely that other possible worlds exist as concretely as ours.", "3": "Modal realism is metaphysics, not game design."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 9, 'What is Timothy Williamson''s "knowledge-first" epistemology?',
  '[{"text": "Knowledge is a primitive, unanalyzable mental state — not reducible to justified true belief plus conditions — and is the most general factive mental state", "correct": true}, {"text": "That the first thing you learn is the most important"}, {"text": "That knowledge only comes from textbooks"}, {"text": "That memorization is superior to understanding"}]',
  'Williamson reverses the traditional project: instead of analyzing knowledge into components (belief, truth, justification), he treats knowledge as basic and explains other concepts (belief, evidence, assertion) in terms of it.',
  '{"1": "''Knowledge-first'' refers to the theoretical priority of knowledge, not temporal priority.", "2": "Williamson''s theory is about the nature of knowledge itself, not its sources.", "3": "Williamson distinguishes knowledge from mere belief or memorization."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 9, 'What is Derek Parfit''s "triple theory" in "On What Matters"?',
  '[{"text": "That Kantian deontology, consequentialism, and contractualism converge on the same fundamental moral principles when properly understood", "correct": true}, {"text": "That there are three types of food"}, {"text": "That morality has three levels: easy, medium, hard"}, {"text": "That only three philosophers matter"}]',
  'Parfit spent decades arguing that the three major moral traditions are not genuinely opposed — they are "climbing the same mountain on different sides." His convergence thesis aims to end the impasse between competing ethical theories.',
  '{"1": "The triple theory is about moral philosophy, not nutrition.", "2": "It concerns the structure of moral theories, not difficulty levels.", "3": "Parfit engaged with hundreds of philosophers across all traditions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 9, 'What is the difference between Habermas''s "discourse ethics" and Rawls''s "political liberalism"?',
  '[{"text": "Habermas derives moral norms from the conditions of rational discourse itself; Rawls seeks overlapping consensus among reasonable comprehensive doctrines without grounding in any one", "correct": true}, {"text": "They are the same theory"}, {"text": "Habermas rejected democracy"}, {"text": "Rawls was a Marxist"}]',
  'Habermas argues that valid moral norms are those that all affected parties would accept in an ideal speech situation. Rawls seeks principles that diverse worldviews can endorse from an "overlapping consensus" without sharing foundations.',
  '{"1": "They share liberal democratic commitments but differ fundamentally in justificatory strategy.", "2": "Habermas is a champion of deliberative democracy.", "3": "Rawls was a liberal egalitarian, not a Marxist."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 9, 'What was the significance of the Vienna Circle for 20th century philosophy?',
  '[{"text": "They developed logical positivism, arguing that only empirically verifiable or logically tautological statements are meaningful, influencing analytic philosophy profoundly", "correct": true}, {"text": "They were a music ensemble"}, {"text": "They studied Viennese pastry techniques"}, {"text": "They were a political party"}]',
  'The Vienna Circle (Schlick, Carnap, Neurath, Gödel) formulated the verification principle, developed formal logic, and sought to unify science. Though logical positivism was later abandoned, it shaped the entire trajectory of analytic philosophy.',
  '{"1": "The Vienna Circle was a philosophical movement, not a musical group.", "2": "They studied logic and science, not culinary arts.", "3": "They were an intellectual circle, not a political party."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 9, 'What is Theodor Adorno''s concept of "negative dialectics" as applied to art?',
  '[{"text": "Art''s truth content lies in its resistance to synthesis and reconciliation — authentic art preserves contradiction and refuses to harmonize antagonisms that are real", "correct": true}, {"text": "Art should always be cheerful"}, {"text": "Dialectics has no relation to art"}, {"text": "All art is negative"}]',
  'Adorno rejected Hegel''s positive dialectic (thesis-antithesis-synthesis) in favor of a dialectic that refuses resolution. Great art embodies social contradictions without resolving them, maintaining critical tension.',
  '{"1": "Adorno valued art that confronts suffering, not that conceals it with cheerfulness.", "2": "Adorno spent his career connecting dialectical philosophy to aesthetic theory.", "3": "Not all art is negative; Adorno identified specific works whose form embodies genuine critical content."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 9, 'What is Julia Annas''s argument for virtue as a skill in "Intelligent Virtue"?',
  '[{"text": "Virtue is a practical skill requiring intelligent responsiveness to particulars, developed through practice and reflection, analogous to becoming an expert musician or craftsman", "correct": true}, {"text": "Virtue is an innate talent that cannot be learned"}, {"text": "Virtue is following rules mechanically"}, {"text": "Annas rejected virtue ethics"}]',
  'Annas argues that virtuous action requires the same kind of practical intelligence as skilled performance — it is not mere habit or rule-following but responsive, creative engagement that improves through deliberate practice.',
  '{"1": "Annas explicitly argues that virtue is learned through practice, not innate.", "2": "Annas distinguishes virtue from mechanical rule-following as requiring intelligent judgment.", "3": "Annas is a leading contemporary virtue ethicist."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 9, 'What is the "impossibility theorem" of Kenneth Arrow?',
  '[{"text": "No voting system can simultaneously satisfy all of a set of reasonable fairness conditions when there are three or more alternatives", "correct": true}, {"text": "A theorem proving flight is impossible"}, {"text": "A proof that markets cannot exist"}, {"text": "A demonstration that mathematics is inconsistent"}]',
  'Arrow proved in 1951 that no rank-order voting system can convert individual preferences into a community-wide preference while satisfying unanimity, non-dictatorship, and independence of irrelevant alternatives simultaneously.',
  '{"1": "Arrow''s theorem is about social choice and voting, not aerodynamics.", "2": "Arrow''s theorem is about collective decision-making, not market existence.", "3": "Arrow''s theorem is consistent mathematics proving a limitation on voting systems."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 9, 'What is Joseph Raz''s "service conception" of authority?',
  '[{"text": "Authority is legitimate when subjects would better conform to reasons that already apply to them by following the authority''s directives than by acting on their own judgment", "correct": true}, {"text": "Authority means having the most servants"}, {"text": "Only religious authorities are legitimate"}, {"text": "Authority is always illegitimate"}]',
  'Raz''s "normal justification thesis" holds that authority is justified when it mediates between people and the reasons that apply to them — the authority serves them by helping them do what they already have reason to do, better.',
  '{"1": "''Service'' refers to the authority serving the governed, not having servants.", "2": "Raz''s theory is secular and applies to political, legal, and other forms of authority.", "3": "Raz provides conditions under which authority IS legitimate."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 10, 'What is the relationship between Heidegger''s "ontological difference" and the "question of Being"?',
  '[{"text": "The ontological difference distinguishes Being (Sein) from beings (Seiendes); the question of Being asks about the meaning of Being itself, which Western philosophy has ''forgotten'' by focusing only on beings", "correct": true}, {"text": "They are unrelated concepts"}, {"text": "Heidegger rejected ontology"}, {"text": "The ontological difference is a mathematical concept"}]',
  'Heidegger''s central project in "Being and Time" was to reawaken the question of the meaning of Being — not what exists, but what it means to be at all. Western metaphysics, he argued, confused Being with the highest being (God, substance, subject).',
  '{"1": "The ontological difference is the foundation of Heidegger''s entire philosophical project.", "2": "Heidegger sought to transform ontology, not reject it.", "3": "The ontological difference is a philosophical distinction, not mathematical."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 10, 'What is the significance of Gödel''s incompleteness theorems for epistemology and philosophy of mathematics?',
  '[{"text": "Any consistent formal system capable of expressing arithmetic contains true statements that cannot be proven within it, showing the limits of formal proof as a path to mathematical truth", "correct": true}, {"text": "Mathematics is entirely wrong"}, {"text": "Computers can solve all mathematical problems"}, {"text": "Logic is unnecessary"}]',
  'Gödel proved in 1931 that Hilbert''s program of formalizing all mathematics was impossible. There will always be true mathematical statements unprovable within any consistent system — mathematical truth transcends formal provability.',
  '{"1": "Gödel showed limits to formal systems, not that mathematics itself is wrong.", "2": "Gödel''s theorem implies there are limits to what any computational system can prove.", "3": "Gödel was a logician who demonstrated the power AND limits of logic."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 10, 'What is the structure of Kant''s argument in the Groundwork for the second formulation of the categorical imperative?',
  '[{"text": "Rational beings have absolute worth as ends in themselves because rationality is the condition for all other value; thus we must never treat humanity merely as a means", "correct": true}, {"text": "People are valuable because they are productive workers"}, {"text": "Only the wealthy have moral worth"}, {"text": "The categorical imperative has only one formulation"}]',
  'Kant argued that rational nature is the source of all value — without a valuer, nothing has value. Therefore rational beings have dignity (unconditional worth), not mere price. This grounds the prohibition on treating people merely as instruments.',
  '{"1": "Kant''s argument is about rationality as the source of value, not economic productivity.", "2": "Kant explicitly argued that all rational beings have equal, unconditional worth regardless of wealth.", "3": "Kant presented multiple formulations of the categorical imperative, including the humanity formula."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 10, 'How does Hannah Arendt''s concept of "the banality of evil" revise traditional moral philosophy?',
  '[{"text": "Evil can result not from monstrous intentions but from thoughtlessness — the failure to think, to examine one''s actions from the perspective of others, making ordinary bureaucrats complicit in atrocity", "correct": true}, {"text": "Evil does not exist"}, {"text": "Only bankers are evil"}, {"text": "Arendt defended totalitarianism"}]',
  'Arendt observed Eichmann and concluded that his evil was not demonic but banal — he simply failed to think about what he was doing. This challenged the assumption that great evil requires great malice, pointing instead to the moral danger of thoughtlessness.',
  '{"1": "Arendt affirmed the reality of evil; she redefined its typical character.", "2": "Arendt''s analysis applies to bureaucratic complicity generally, not to any specific profession.", "3": "Arendt was one of the 20th century''s most powerful critics of totalitarianism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 10, 'What is the philosophical significance of the Averroist thesis of "double truth"?',
  '[{"text": "The controversial claim attributed to Latin Averroists that something can be true in philosophy but false in theology, raising fundamental questions about the unity of truth", "correct": true}, {"text": "That every statement is both true and false"}, {"text": "A theory about twin siblings"}, {"text": "A bookkeeping method"}]',
  'The double truth doctrine (condemned in 1277) suggested philosophy and theology could reach contradictory conclusions, both valid in their domains. This crisis forced Aquinas to demonstrate their compatibility and shaped the entire trajectory of Western thought.',
  '{"1": "Double truth is about the relationship between faith and reason, not about logical contradiction.", "2": "It has nothing to do with siblings.", "3": "It is a medieval philosophical thesis, not an accounting method."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 10, 'What is the difference between Michael Slote''s "agent-based" virtue ethics and Rosalind Hursthouse''s "agent-focused" approach?',
  '[{"text": "Slote evaluates actions entirely by the inner states of the agent (motives, character); Hursthouse evaluates actions by what a virtuous person would characteristically do in the circumstances", "correct": true}, {"text": "They are the same theory"}, {"text": "Slote rejected virtue ethics; Hursthouse accepted it"}, {"text": "Neither is a virtue ethicist"}]',
  'Slote''s agent-based theory makes the moral quality of actions derivative of the agent''s character states. Hursthouse''s agent-focused theory uses the virtuous agent as a reference point but grounds virtues in human flourishing, maintaining an action-guidance dimension.',
  '{"1": "They are distinct approaches within the broader virtue ethics tradition.", "2": "Both are virtue ethicists; they differ on the relationship between character and right action.", "3": "Both are leading contemporary virtue ethicists."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 10, 'What is the philosophical significance of the "socialist calculation debate" between Mises/Hayek and Lange/Lerner?',
  '[{"text": "It revealed that the core issue is not mathematical but epistemological — whether dispersed tacit knowledge can be centrally aggregated, which Hayek argued it fundamentally cannot", "correct": true}, {"text": "It was about calculating restaurant tips"}, {"text": "Both sides agreed completely"}, {"text": "It concerned calculator manufacturing"}]',
  'Lange and Lerner proposed "market socialism" using trial-and-error pricing. Hayek responded that the real problem is not computation but discovery — market prices transmit information that no central authority can replicate because much knowledge is tacit and local.',
  '{"1": "The debate concerned the feasibility of economic planning, not gratuities.", "2": "The two sides fundamentally disagreed about whether central planning could work.", "3": "The debate was about economic methodology, not electronics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 10, 'What is the significance of the Hart-Fuller debate about Nazi law for legal philosophy?',
  '[{"text": "Hart argued Nazi statutes were valid law (however immoral); Fuller argued they failed to be law at all because they violated the inner morality of law — revealing the deepest divide between positivism and natural law", "correct": true}, {"text": "They debated traffic laws"}, {"text": "Both defended Nazi law"}, {"text": "The debate was about patent law"}]',
  'The 1958 Hart-Fuller debate in the Harvard Law Review crystallized the central question of jurisprudence: can an unjust system qualify as "law"? Hart said yes (separating law from morality); Fuller said no (law requires minimum moral content in its form).',
  '{"1": "The debate concerned the nature of law itself, not any specific regulatory domain.", "2": "Neither defended Nazi law; they debated whether it counted as law in a philosophical sense.", "3": "The debate was about jurisprudential foundations, not intellectual property."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 1, 'What does the word "philosophy" literally mean?',
  '[{"text": "Love of wisdom", "correct": true}, {"text": "Study of numbers"}, {"text": "Fear of the unknown"}, {"text": "Art of persuasion"}]',
  'The word "philosophy" comes from the Greek "philos" (love) and "sophia" (wisdom). Pythagoras is said to have coined the term, calling himself a "lover of wisdom" rather than claiming to possess it.',
  '{"1": "Study of numbers is mathematics.", "2": "Fear of the unknown is not a philosophical term.", "3": "Art of persuasion is rhetoric."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 1, 'What is the difference between knowledge and belief?',
  '[{"text": "Knowledge requires justification and truth; belief can be held without either", "correct": true}, {"text": "They are the same thing"}, {"text": "Knowledge is always wrong"}, {"text": "Belief is always right"}]',
  'Since Plato, knowledge has been understood as requiring more than mere belief — it must be true and justified. You can believe anything, but to know something, it must actually be the case and you must have good reasons.',
  '{"1": "Philosophers have distinguished them since antiquity.", "2": "Knowledge by definition must be true.", "3": "Beliefs can be false."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 1, 'What is the Golden Rule found in many ethical traditions?',
  '[{"text": "Treat others as you would want to be treated", "correct": true}, {"text": "The person with the gold makes the rules"}, {"text": "Always seek gold"}, {"text": "Gold is the highest value"}]',
  'The Golden Rule appears in Christianity, Confucianism, Judaism, Islam, Hinduism, and many other traditions. It is one of the most universal ethical principles across human cultures.',
  '{"1": "That is a cynical joke, not the Golden Rule.", "2": "The Golden Rule is about ethics, not wealth.", "3": "The Golden Rule is about human relationships, not material values."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 1, 'What is democracy?',
  '[{"text": "A system of government where power is held by the people through voting", "correct": true}, {"text": "Rule by a single king"}, {"text": "Rule by the military"}, {"text": "Rule by the wealthiest citizens"}]',
  'Democracy comes from Greek "demos" (people) and "kratos" (rule). It originated in Athens around the 5th century BC and is now the most common form of government worldwide.',
  '{"1": "Rule by a king is monarchy.", "2": "Rule by the military is a military junta.", "3": "Rule by the wealthy is plutocracy or oligarchy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 1, 'What is the Mona Lisa famous for in art philosophy?',
  '[{"text": "Its enigmatic expression raises questions about the nature of beauty and interpretation", "correct": true}, {"text": "It is the largest painting ever made"}, {"text": "It was painted yesterday"}, {"text": "It depicts a landscape only"}]',
  'Leonardo da Vinci''s Mona Lisa (c. 1503-1519) exemplifies how a work of art can mean different things to different viewers. Her ambiguous smile has generated centuries of aesthetic debate about beauty, intention, and perception.',
  '{"1": "The Mona Lisa is relatively small (77cm x 53cm).", "2": "It was painted over 500 years ago.", "3": "It prominently depicts a woman, not just a landscape."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 1, 'Who is considered the first Western philosopher?',
  '[{"text": "Thales of Miletus", "correct": true}, {"text": "Albert Einstein"}, {"text": "William Shakespeare"}, {"text": "Napoleon Bonaparte"}]',
  'Thales of Miletus (c. 624-546 BC) is traditionally regarded as the first Western philosopher. He proposed that water is the fundamental substance of all things — the first recorded attempt to explain nature without mythology.',
  '{"1": "Einstein was a physicist, not a philosopher, and lived in the 20th century.", "2": "Shakespeare was a playwright, not a philosopher.", "3": "Napoleon was a military and political leader, not a philosopher."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 1, 'What is courage as a virtue?',
  '[{"text": "The ability to act rightly despite fear or danger", "correct": true}, {"text": "The absence of all fear"}, {"text": "Physical strength"}, {"text": "Ignoring all risks"}]',
  'Aristotle defined courage as the mean between cowardice and recklessness. A courageous person feels fear but acts rightly despite it. It is not fearlessness but mastery of fear in service of what is right.',
  '{"1": "Courage involves feeling fear but acting rightly anyway, not having no fear.", "2": "Physical strength is a physical attribute, not the virtue of courage.", "3": "Ignoring all risks is recklessness, which Aristotle considered a vice."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 1, 'What is capitalism?',
  '[{"text": "An economic system based on private ownership and voluntary exchange in free markets", "correct": true}, {"text": "A system where the government owns everything"}, {"text": "A system where there is no money"}, {"text": "A system where only one company exists"}]',
  'Capitalism is characterized by private property, voluntary trade, competition, and the profit motive. Adam Smith described its foundations in "The Wealth of Nations" (1776).',
  '{"1": "Government ownership of everything is socialism or communism.", "2": "Capitalism relies on money and prices as signals.", "3": "Capitalism involves competition among many firms."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 1, 'What is justice?',
  '[{"text": "Giving each person what they are due according to fair principles", "correct": true}, {"text": "Whatever the strongest person decides"}, {"text": "Always agreeing with the majority"}, {"text": "Treating everyone identically regardless of circumstances"}]',
  'Justice has been defined since Plato as rendering each person their due. It involves fairness, impartiality, and the protection of rights — it is the foundational concept of legal and political philosophy.',
  '{"1": "Might makes right is the position Plato''s Thrasymachus argues, which Socrates refutes.", "2": "Majority rule without rights protection can produce injustice (tyranny of the majority).", "3": "Justice may require treating different cases differently (equity)."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 1, 'Who composed the famous "Für Elise" piano piece?',
  '[{"text": "Ludwig van Beethoven", "correct": true}, {"text": "Johann Sebastian Bach"}, {"text": "Frederic Chopin"}, {"text": "Claude Debussy"}]',
  'Beethoven composed "Für Elise" (Bagatelle No. 25 in A minor) around 1810. The identity of "Elise" remains debated — she may have been Therese Malfatti or Elisabeth Röckel.',
  '{"1": "Bach composed in the Baroque period, a century before Für Elise.", "2": "Chopin composed piano pieces but not this one.", "3": "Debussy was an Impressionist composer of a later era."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 1, 'What genre of film typically explores questions about the meaning of life and human existence?',
  '[{"text": "Drama", "correct": true}, {"text": "Slapstick comedy"}, {"text": "Sports documentary"}, {"text": "Cooking shows"}]',
  'While any genre can raise philosophical questions, dramatic films most consistently explore themes of mortality, meaning, identity, love, loss, and ethical dilemmas.',
  '{"1": "Slapstick focuses on physical humor, not existential themes.", "2": "Sports documentaries focus on athletic achievement.", "3": "Cooking shows focus on culinary skills."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 1, 'Who said: "Give me liberty, or give me death!"?',
  '[{"text": "Patrick Henry", "correct": true}, {"text": "George Washington"}, {"text": "Benjamin Franklin"}, {"text": "Thomas Jefferson"}]',
  'Patrick Henry spoke these words in 1775 at the Second Virginia Convention, urging the colonies toward revolution against British rule. It became one of the most famous declarations of the value of liberty.',
  '{"1": "Washington led the Continental Army but did not say this.", "2": "Franklin is known for other famous quotes but not this one.", "3": "Jefferson authored the Declaration of Independence but did not speak this line."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 1, 'What is bioethics?',
  '[{"text": "The study of ethical issues arising from advances in biology and medicine", "correct": true}, {"text": "The study of animal behavior"}, {"text": "A type of organic farming"}, {"text": "A brand of vitamins"}]',
  'Bioethics examines moral questions about genetic engineering, cloning, euthanasia, organ donation, clinical trials, and other issues at the intersection of biology, medicine, and ethics.',
  '{"1": "Animal behavior is ethology, not bioethics.", "2": "Organic farming is agriculture, not bioethics.", "3": "Bioethics is a philosophical field, not a commercial product."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 1, 'What is the Bill of Rights?',
  '[{"text": "The first ten amendments to the U.S. Constitution, protecting individual freedoms", "correct": true}, {"text": "A list of taxes"}, {"text": "The name of a famous ship"}, {"text": "A British law from 1066"}]',
  'Ratified in 1791, the Bill of Rights guarantees freedoms like speech, religion, press, assembly, and the right to bear arms. It reflects the founders'' philosophical commitment to natural rights and limited government.',
  '{"1": "The Bill of Rights protects freedoms, not imposes taxes.", "2": "It is a constitutional document, not a ship.", "3": "It is an American document from 1791."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 2, 'What is determinism?',
  '[{"text": "The view that every event is necessitated by prior causes, leaving no room for free will", "correct": true}, {"text": "The belief that you should be determined in your goals"}, {"text": "A mathematical formula"}, {"text": "A type of government"}]',
  'Determinism holds that the state of the universe at any time, together with the laws of nature, completely determines the future. This raises profound questions about moral responsibility and human freedom.',
  '{"1": "Philosophical determinism is about causation, not personal motivation.", "2": "Determinism is a metaphysical thesis, not a mathematical formula.", "3": "Determinism is a metaphysical position, not a form of governance."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 2, 'What is skepticism in philosophy?',
  '[{"text": "The view that knowledge is uncertain or impossible to achieve", "correct": true}, {"text": "Being negative about everything"}, {"text": "A disease"}, {"text": "A type of religion"}]',
  'Philosophical skepticism questions whether we can have genuine knowledge about the world. Pyrrho, Sextus Empiricus, Descartes, and Hume all employed skeptical arguments to test the foundations of belief.',
  '{"1": "Skepticism is a methodological stance, not mere negativity.", "2": "Skepticism is a philosophical position, not a medical condition.", "3": "Skepticism is a philosophical tradition, not a religion."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 2, 'What is a moral dilemma?',
  '[{"text": "A situation where every available choice involves violating a moral principle", "correct": true}, {"text": "Any difficult decision"}, {"text": "A math problem about morality"}, {"text": "A type of court case"}]',
  'A true moral dilemma occurs when two or more moral obligations conflict and cannot all be satisfied. Classic examples include the trolley problem and cases of lying to protect an innocent life.',
  '{"1": "Not every difficult decision is a moral dilemma; it requires conflicting moral obligations.", "2": "It is a philosophical concept, not a mathematical problem.", "3": "While dilemmas appear in courts, the concept is broader than legal cases."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 2, 'What is tyranny?',
  '[{"text": "Cruel and oppressive government rule by a single person or small group", "correct": true}, {"text": "A large dinosaur"}, {"text": "A type of democracy"}, {"text": "A musical instrument"}]',
  'The ancient Greeks identified tyranny as the corruption of monarchy — rule by one for their own benefit rather than the common good. Protection against tyranny was a central concern of the American founders.',
  '{"1": "That is a Tyrannosaurus Rex, a dinosaur.", "2": "Tyranny is the opposite of democracy.", "3": "Tyranny is a political concept, not an instrument."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 2, 'What is the difference between objective and subjective theories of beauty?',
  '[{"text": "Objective: beauty is a real property of things; Subjective: beauty is in the eye of the beholder", "correct": true}, {"text": "They are the same"}, {"text": "Objective beauty is expensive; subjective is cheap"}, {"text": "Only paintings can be objectively beautiful"}]',
  'This is one of the oldest debates in aesthetics. Plato argued beauty is an objective Form; Hume argued it depends on the observer''s taste and sentiment. The debate continues in contemporary philosophy.',
  '{"1": "They are opposing positions in aesthetic theory.", "2": "Price has nothing to do with this philosophical distinction.", "3": "Both theories apply to all forms of beauty, not just paintings."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 2, 'What was Plato''s Academy?',
  '[{"text": "The first institution of higher learning in the Western world, founded in Athens around 387 BC", "correct": true}, {"text": "A modern university in New York"}, {"text": "An awards ceremony for movies"}, {"text": "A military training camp"}]',
  'Plato founded the Academy in a grove sacred to Athena near Athens. It operated for nearly 900 years until 529 AD, making it the longest-running educational institution in Western history.',
  '{"1": "The Academy was ancient, not modern.", "2": "The Academy Awards are named after a different concept.", "3": "The Academy was devoted to philosophy and mathematics, not military training."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 2, 'What is temperance?',
  '[{"text": "The virtue of moderation and self-control in desires and pleasures", "correct": true}, {"text": "The temperature of a room"}, {"text": "A type of metal"}, {"text": "A musical key"}]',
  'Temperance is one of the four cardinal virtues. It involves rational control over appetites and desires — not eliminating pleasure but governing it through reason.',
  '{"1": "Temperance is a moral virtue, not related to temperature.", "2": "Temperance is a character trait, not a material.", "3": "Temperance is an ethical concept, not a musical term."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 2, 'What is inflation?',
  '[{"text": "A general increase in prices and decrease in the purchasing power of money", "correct": true}, {"text": "Blowing up a balloon"}, {"text": "A type of exercise"}, {"text": "A musical technique"}]',
  'Inflation occurs when the money supply grows faster than the supply of goods and services. Milton Friedman famously said, "Inflation is always and everywhere a monetary phenomenon."',
  '{"1": "Economic inflation is about prices, not balloons.", "2": "Inflation is an economic concept, not a fitness activity.", "3": "Inflation is about purchasing power, not music."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 2, 'What are individual rights?',
  '[{"text": "Moral and legal entitlements that protect individuals from interference by others and by government", "correct": true}, {"text": "The right hand of each person"}, {"text": "Things only rich people have"}, {"text": "Privileges granted by a king that can be revoked"}]',
  'Individual rights — life, liberty, property, speech, religion — are the foundation of constitutional democracies. They are protections against both private and public coercion.',
  '{"1": "Individual rights are legal and moral concepts, not about physical hands.", "2": "Rights apply to all individuals, regardless of wealth.", "3": "Natural rights theory holds that rights are inherent, not granted by any authority."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 2, 'What is a symphony?',
  '[{"text": "A large-scale musical composition for orchestra, typically in multiple movements", "correct": true}, {"text": "A type of telephone"}, {"text": "A single musical note"}, {"text": "A type of dance"}]',
  'The symphony is one of the most important forms in Western classical music. From Haydn and Mozart through Beethoven, Brahms, and Mahler, the symphony has been a vehicle for profound musical and philosophical expression.',
  '{"1": "A symphony is a musical form, not a communication device.", "2": "A symphony is a complex multi-movement work, not a single note.", "3": "A symphony is composed music for orchestra, not a dance form."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 2, 'Who directed "Schindler''s List," which explores the moral complexity of the Holocaust?',
  '[{"text": "Steven Spielberg", "correct": true}, {"text": "Martin Scorsese"}, {"text": "Christopher Nolan"}, {"text": "Quentin Tarantino"}]',
  'Spielberg''s "Schindler''s List" (1993) explores how one man''s moral awakening led him to save over 1,100 Jews. It raises questions about moral responsibility, the capacity for good amid evil, and the limits of indifference.',
  '{"1": "Scorsese directed ''Goodfellas'' and ''The Irishman'' but not this film.", "2": "Nolan directed ''Inception'' and ''The Dark Knight'' but not this film.", "3": "Tarantino made ''Inglourious Basterds'' about WWII but not ''Schindler''s List.''"}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 2, 'Who said: "To be, or not to be, that is the question"?',
  '[{"text": "Hamlet, in Shakespeare''s play", "correct": true}, {"text": "Socrates at his trial"}, {"text": "Abraham Lincoln in a speech"}, {"text": "Albert Einstein in a lecture"}]',
  'This famous soliloquy from "Hamlet" (c. 1600) is one of the most profound philosophical moments in literature — Hamlet contemplates existence, death, and whether enduring life''s suffering is preferable to the uncertainty of death.',
  '{"1": "Socrates addressed different themes at his trial, as recorded in Plato''s Apology.", "2": "Lincoln is known for the Gettysburg Address, not this quote.", "3": "Einstein made many famous statements, but this is Shakespeare."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 2, 'What is environmental ethics?',
  '[{"text": "The study of moral questions about the relationship between humans and the natural world", "correct": true}, {"text": "Rules for keeping an office clean"}, {"text": "A type of cleaning product"}, {"text": "Environmental science laboratory procedures"}]',
  'Environmental ethics asks whether nature has intrinsic value, what obligations we have to future generations, and how to balance human needs with ecological preservation.',
  '{"1": "Environmental ethics is a philosophical field, not an office policy.", "2": "It is a branch of philosophy, not a product.", "3": "It is a normative field about values, not laboratory procedures."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 2, 'What is the concept of "unalienable rights"?',
  '[{"text": "Rights that cannot be taken away or surrendered, inherent to all human beings", "correct": true}, {"text": "Rights that aliens have"}, {"text": "Rights that can be bought and sold"}, {"text": "Rights only for citizens"}]',
  'The Declaration of Independence asserts that rights to life, liberty, and the pursuit of happiness are "unalienable" — meaning no government, majority, or authority can legitimately revoke them. They belong to individuals by nature.',
  '{"1": "''Unalienable'' means they cannot be alienated (separated from a person), not related to extraterrestrials.", "2": "Unalienable means they cannot be transferred or sold.", "3": "The Declaration asserts these rights belong to all people, not just citizens."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 3, 'What is nihilism?',
  '[{"text": "The view that life has no inherent meaning, purpose, or value", "correct": true}, {"text": "A type of meditation"}, {"text": "An art movement about bright colors"}, {"text": "A political party in France"}]',
  'Nihilism, from Latin "nihil" (nothing), denies objective meaning, moral truths, or inherent purpose. Nietzsche warned that nihilism would follow the "death of God" and sought to overcome it through the will to power.',
  '{"1": "Nihilism is a philosophical position, not a meditation technique.", "2": "Nihilism tends toward bleakness, not bright colors (though Dadaism, which is related, did use art provocatively).", "3": "Nihilism is a philosophical stance, not a political party."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 3, 'What is the difference between a priori and a posteriori knowledge?',
  '[{"text": "A priori knowledge is independent of experience; a posteriori requires experience", "correct": true}, {"text": "A priori is more important than a posteriori"}, {"text": "They are Latin names for different schools"}, {"text": "A priori is guessing; a posteriori is knowing"}]',
  'A priori knowledge (mathematics, logic) can be known through reason alone. A posteriori knowledge (science, history) requires empirical observation. Kant argued some knowledge is synthetic a priori — both informative and independent of experience.',
  '{"1": "Neither is inherently more important; they are different sources of knowledge.", "2": "They are types of knowledge, not schools of philosophy.", "3": "A priori is genuine knowledge through reason, not guessing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 3, 'What is Aristotle''s concept of "phronesis"?',
  '[{"text": "Practical wisdom — the ability to discern the right action in particular circumstances", "correct": true}, {"text": "A Greek dessert"}, {"text": "A type of Greek architecture"}, {"text": "A mathematical theorem"}]',
  'Phronesis (practical wisdom) is the intellectual virtue that guides moral action. Unlike theoretical wisdom (sophia), phronesis involves knowing how to act well in specific, concrete situations. It cannot be reduced to rules.',
  '{"1": "Phronesis is a philosophical concept, not a food.", "2": "It is a virtue of character and intellect, not an architectural style.", "3": "It is an ethical concept, not a mathematical one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 3, 'What is anarchism?',
  '[{"text": "The political philosophy that rejects all forms of involuntary government authority", "correct": true}, {"text": "A love of chaos and violence"}, {"text": "A type of music"}, {"text": "A cooking style"}]',
  'Philosophical anarchism (Proudhon, Bakunin, Kropotkin) argues that the state is inherently illegitimate because it relies on coercion. It ranges from collectivist anarchism to anarcho-capitalism (Rothbard).',
  '{"1": "Anarchism is a political philosophy about voluntary association, not chaos for its own sake.", "2": "While punk music adopted anarchist imagery, anarchism is a political philosophy.", "3": "Anarchism is about political organization, not cuisine."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 3, 'What is mimesis in art theory?',
  '[{"text": "The concept that art imitates or represents reality", "correct": true}, {"text": "A type of mime performance"}, {"text": "A disease"}, {"text": "A cooking technique"}]',
  'Mimesis was central to Greek aesthetic theory. Plato criticized art as a copy of a copy (imitation of the physical world, which is itself an imitation of the Forms). Aristotle saw mimesis more positively as revealing universal truths through representation.',
  '{"1": "While mime involves imitation, mimesis is a broader philosophical concept about art and representation.", "2": "Mimesis is an aesthetic theory, not a medical condition.", "3": "It is about art theory, not cooking."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 3, 'What was the Renaissance and how did it change philosophy?',
  '[{"text": "A 14th-17th century rebirth of classical learning that shifted focus from God to humanity, laying groundwork for modern philosophy", "correct": true}, {"text": "A music festival"}, {"text": "A type of painting technique"}, {"text": "A military campaign"}]',
  'The Renaissance recovered Greek and Roman texts, sparking humanism — the celebration of human reason, creativity, and individual achievement. Thinkers like Machiavelli, Erasmus, and Montaigne challenged medieval assumptions.',
  '{"1": "The Renaissance was a broad cultural and intellectual movement, not just a festival.", "2": "While it produced great art, the Renaissance was a comprehensive cultural transformation.", "3": "The Renaissance was intellectual and cultural, not military."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 3, 'What is the ethical debate around artificial intelligence?',
  '[{"text": "Whether AI systems can be moral agents, who is responsible for AI decisions, and how to prevent AI from amplifying human biases", "correct": true}, {"text": "Whether robots should pay taxes"}, {"text": "Which programming language is best"}, {"text": "How to make AI more profitable"}]',
  'AI ethics examines questions of autonomy, accountability, transparency, fairness, and the potential for AI to either enhance or undermine human dignity and freedom.',
  '{"1": "AI taxation is a policy question, not the core ethical debate.", "2": "Programming language choice is technical, not ethical.", "3": "Profitability is a business concern; AI ethics focuses on human welfare and rights."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 3, 'What is integrity as a virtue?',
  '[{"text": "Consistency between one''s values, words, and actions — being the same person in private as in public", "correct": true}, {"text": "Being good at math"}, {"text": "Physical wholeness"}, {"text": "A type of building material"}]',
  'Integrity comes from Latin "integer" (whole). A person of integrity has unified their character — their actions align with their stated principles, even when no one is watching or when it costs them.',
  '{"1": "Mathematical integrity exists as a concept, but the virtue of integrity is about character.", "2": "While ''integrity'' can mean physical wholeness, the virtue refers to moral wholeness.", "3": "Structural integrity exists in engineering, but this is about moral character."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 3, 'What is the "tragedy of the commons"?',
  '[{"text": "When individuals acting in self-interest deplete a shared resource, harming everyone — because no one owns the resource", "correct": true}, {"text": "A Shakespeare play"}, {"text": "A sad story about ordinary people"}, {"text": "A failure of the stock market"}]',
  'Garrett Hardin described how shared resources (fisheries, pastures, atmosphere) are overused when no one has property rights over them. Each person benefits from taking more, but the collective result is ruin.',
  '{"1": "It is an economic concept, not a literary work (though it sounds like one).", "2": "''Commons'' refers to shared resources, not common people.", "3": "It applies to shared resources, not specifically to financial markets."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 3, 'What is the presumption of innocence?',
  '[{"text": "The legal principle that a person is considered innocent until proven guilty beyond reasonable doubt", "correct": true}, {"text": "The belief that everyone is innocent"}, {"text": "A rule about children"}, {"text": "A type of insurance"}]',
  'The presumption of innocence is a fundamental right in criminal law. It places the burden of proof on the prosecution and protects individuals from arbitrary punishment — a cornerstone of justice since Roman law.',
  '{"1": "It is a legal standard for criminal proceedings, not a general belief.", "2": "It applies to all accused persons, not specifically children.", "3": "It is a legal principle, not an insurance product."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 3, 'What role did music play in Plato''s ideal state?',
  '[{"text": "Plato believed certain musical modes could shape character and should be regulated by the state to promote virtue", "correct": true}, {"text": "Plato banned all music"}, {"text": "Plato invented the piano"}, {"text": "Plato was a famous musician"}]',
  'In "The Republic," Plato argued that certain harmonies (Dorian, Phrygian) build courage and temperance, while others encourage laziness or excess. He proposed censoring harmful music — one of the first theories of music''s moral power.',
  '{"1": "Plato did not ban all music; he wanted to regulate which modes were used.", "2": "The piano was invented millennia after Plato.", "3": "Plato was a philosopher, not a musician."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 3, 'What philosophical themes does Christopher Nolan''s "Memento" explore?',
  '[{"text": "The reliability of memory, personal identity, and whether we can know the truth about our own past", "correct": true}, {"text": "The history of the Roman Empire"}, {"text": "How to build a house"}, {"text": "The stock market"}]',
  '"Memento" (2000) follows a man with short-term memory loss investigating his wife''s murder. Its reverse chronology forces viewers to experience his epistemological crisis — can we trust our own memories to construct a coherent identity?',
  '{"1": "The film is set in the present day, not ancient Rome.", "2": "It is about memory and identity, not construction.", "3": "It is a psychological thriller, not a financial film."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 3, 'Who wrote: "No man is an island, entire of itself"?',
  '[{"text": "John Donne", "correct": true}, {"text": "William Shakespeare"}, {"text": "John Milton"}, {"text": "Geoffrey Chaucer"}]',
  'John Donne wrote this in "Meditation XVII" (1624), arguing that every person is connected to all of humanity. "Any man''s death diminishes me, because I am involved in mankind; therefore never send to know for whom the bell tolls; it tolls for thee."',
  '{"1": "Shakespeare was a contemporary but this is from Donne''s Devotions.", "2": "Milton wrote ''Paradise Lost'' but not this meditation.", "3": "Chaucer wrote ''The Canterbury Tales'' centuries before Donne."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 3, 'What is the philosophical significance of the Federalist Papers?',
  '[{"text": "They apply Enlightenment philosophy to the practical design of a republican government, explaining how to protect liberty through constitutional structure", "correct": true}, {"text": "They are a collection of poems"}, {"text": "They describe military strategies"}, {"text": "They are a cookbook from the colonial era"}]',
  'Written by Hamilton, Madison, and Jay (1787-1788), the Federalist Papers argue that a well-designed constitution can channel human ambition to protect liberty — applying Montesquieu, Locke, and Hume to practical governance.',
  '{"1": "The Federalist Papers are political essays, not poetry.", "2": "They discuss political structure, not military tactics.", "3": "They are about constitutional philosophy, not cooking."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 4, 'What is the "hard problem of consciousness"?',
  '[{"text": "Explaining why and how physical brain processes give rise to subjective experience (qualia)", "correct": true}, {"text": "A difficult math equation"}, {"text": "The problem of staying awake during lectures"}, {"text": "A hardware issue with computers"}]',
  'David Chalmers coined this term to distinguish explaining subjective experience from explaining cognitive functions. We can explain how the brain processes color, but WHY does seeing red FEEL like anything at all?',
  '{"1": "The ''hard problem'' is philosophical, not mathematical.", "2": "It concerns the nature of consciousness itself, not attentiveness.", "3": "It is about biological consciousness, not computer hardware."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 4, 'What is Thomas Kuhn''s concept of "paradigm shifts"?',
  '[{"text": "Revolutionary changes in the fundamental assumptions and methods of a scientific field, not gradual accumulation of knowledge", "correct": true}, {"text": "Changing gears in a car"}, {"text": "A type of dance move"}, {"text": "A method of cooking"}]',
  'Kuhn argued in "The Structure of Scientific Revolutions" (1962) that science does not progress linearly. Normal science operates within a paradigm until anomalies accumulate and trigger a revolution — a fundamental shift in worldview.',
  '{"1": "A paradigm shift is about intellectual revolution, not mechanical gears.", "2": "It is a concept in philosophy of science, not a dance.", "3": "It concerns scientific methodology, not cooking."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 4, 'What is the problem of moral luck?',
  '[{"text": "That moral judgments often depend on factors beyond a person''s control, challenging the assumption that morality requires voluntary action", "correct": true}, {"text": "A gambling theory"}, {"text": "The luck of finding moral people"}, {"text": "A lottery for ethical prizes"}]',
  'Bernard Williams and Thomas Nagel showed that we judge a drunk driver more harshly if a child happens to run into the road — even though the driver''s recklessness is identical whether or not a child appears. Luck affects moral judgment.',
  '{"1": "Moral luck is about the role of chance in moral evaluation, not gambling.", "2": "It is about how we judge actions, not about finding moral people.", "3": "It is a philosophical problem, not a competition."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 4, 'What is Tocqueville''s concept of "tyranny of the majority"?',
  '[{"text": "The danger that democratic majorities will oppress minorities, imposing conformity of thought and suppressing dissent", "correct": true}, {"text": "A board game"}, {"text": "A military formation"}, {"text": "A type of election fraud"}]',
  'In "Democracy in America" (1835), Tocqueville warned that democracy''s greatest danger is not political tyranny but social conformity — the majority''s power to silence dissenting voices through social pressure.',
  '{"1": "It is a political philosophy concept, not a game.", "2": "It concerns political power dynamics, not military tactics.", "3": "It is about legitimate majority power being misused, not fraud."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 4, 'What is the difference between a virtue and a skill?',
  '[{"text": "Virtues involve consistent moral character and motivation; skills are technical abilities that can be used for good or ill", "correct": true}, {"text": "They are the same thing"}, {"text": "Skills are more important than virtues"}, {"text": "Virtues are physical; skills are mental"}]',
  'A skilled surgeon could use their abilities to heal or to harm. Virtue ensures the skill is directed toward good ends. Aristotle noted that virtues require the right motivation, not just the right action.',
  '{"1": "Philosophers distinguish them precisely because they have different moral significance.", "2": "Importance depends on context; philosophers argue virtues are necessary to direct skills properly.", "3": "Both virtues and skills have mental and behavioral components."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 4, 'What is "creative destruction" in economics?',
  '[{"text": "The process where innovation destroys old industries and creates new ones, driving economic progress", "correct": true}, {"text": "Destroying art to make new art"}, {"text": "A military strategy"}, {"text": "A construction technique"}]',
  'Joseph Schumpeter described creative destruction as the essential fact of capitalism — entrepreneurs innovate, replacing old products and methods. The horse-and-buggy industry was destroyed by automobiles, creating vastly more wealth.',
  '{"1": "It is about economic transformation, not artistic destruction.", "2": "It is an economic concept, not a military one.", "3": "It is about market dynamics, not building methods."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 4, 'What is the difference between "positive rights" and "negative rights"?',
  '[{"text": "Negative rights require others to refrain from interfering; positive rights require others to provide something", "correct": true}, {"text": "Negative rights are bad; positive rights are good"}, {"text": "They are identical"}, {"text": "Only one type exists in law"}]',
  'Freedom of speech (negative right) means the government cannot silence you. Right to education (positive right) means someone must provide schooling. The distinction has enormous implications for the proper role of government.',
  '{"1": "Neither is inherently good or bad; they represent different claims.", "2": "They are fundamentally different types of moral and legal claims.", "3": "Both types appear in constitutions and international law."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 4, 'What philosophical question does the concept of "absolute music" raise?',
  '[{"text": "Whether music can express meaning, truth, or emotion on its own, without words, narrative, or visual representation", "correct": true}, {"text": "Whether music should be extremely loud"}, {"text": "Whether only one type of music exists"}, {"text": "Whether music should be free of charge"}]',
  'The debate between absolute music (pure instrumental) and program music (with narrative) mirrors broader aesthetic questions: can abstract form convey truth? Hanslick argued music''s beauty is purely formal; Schopenhauer saw it as expressing the will itself.',
  '{"1": "Volume is not the philosophical issue.", "2": "Absolute music is one approach, not a claim that only one type exists.", "3": "It concerns the nature of musical meaning, not pricing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 4, 'What is the philosophical significance of the documentary form?',
  '[{"text": "It raises questions about whether objective truth can be captured on film, and about the ethics of representing real people and events", "correct": true}, {"text": "Documentaries are always completely objective"}, {"text": "Documentaries are fictional"}, {"text": "Documentaries have no philosophical significance"}]',
  'Every documentary involves framing, editing, and perspective — raising epistemological questions about representation. Errol Morris''s "The Thin Blue Line" showed how documentary filmmaking can both reveal and construct truth.',
  '{"1": "All documentaries involve selection and interpretation; pure objectivity is debatable.", "2": "Documentaries aim to represent reality, though they involve editorial choices.", "3": "Documentary ethics and epistemology are rich philosophical topics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 4, 'What is the "veil of ignorance" approach to fairness in policy?',
  '[{"text": "Designing policies as if you don''t know your own position in society — your race, wealth, gender, or abilities", "correct": true}, {"text": "Wearing a blindfold while voting"}, {"text": "Ignoring all facts when making decisions"}, {"text": "A fashion trend"}]',
  'Rawls''s thought experiment asks: what policies would you choose if you didn''t know whether you''d be rich or poor, healthy or sick, born into a majority or minority? This tests whether a policy is truly fair.',
  '{"1": "It is a mental exercise, not a literal blindfold.", "2": "It involves reasoning about fairness, not ignoring facts.", "3": "It is a philosophical concept, not a fashion choice."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 4, 'How does the concept of "E Pluribus Unum" reflect a philosophical achievement?',
  '[{"text": "It resolves the tension between individual diversity and national unity through voluntary association under shared principles rather than ethnic or religious identity", "correct": true}, {"text": "It is a spell from Harry Potter"}, {"text": "It means everyone must be identical"}, {"text": "It is an economic formula"}]',
  '"Out of many, one" captures the founders'' vision of a nation united by ideas (liberty, equality, rule of law) rather than by blood, soil, or religion. This was philosophically revolutionary — a nation defined by principles, not ethnicity.',
  '{"1": "It is a Latin motto of the United States, not fiction.", "2": "It celebrates diversity within unity, not uniformity.", "3": "It is a political philosophy concept, not an economics formula."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 4, 'Who wrote: "The unforgivable crime is soft hitting. Do not hit at all if it can be avoided; but never hit softly"?',
  '[{"text": "Theodore Roosevelt", "correct": true}, {"text": "Winston Churchill"}, {"text": "Napoleon Bonaparte"}, {"text": "Sun Tzu"}]',
  'Roosevelt embodied the philosophy of vigorous, decisive action. This quote reflects his belief that half-measures are worse than inaction — a principle he applied in politics, conservation, and personal life.',
  '{"1": "Churchill had similar spirit but this specific quote is Roosevelt''s.", "2": "Napoleon was known for decisive action but this is not his quote.", "3": "Sun Tzu wrote about strategy in ''The Art of War'' but this is Roosevelt."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 5, 'What is the difference between substance dualism and property dualism?',
  '[{"text": "Substance dualism says mind and body are different substances; property dualism says mental properties are non-physical properties of a physical brain", "correct": true}, {"text": "They are identical"}, {"text": "Substance dualism is about chemicals"}, {"text": "Property dualism is about real estate"}]',
  'Substance dualism (Descartes) posits two kinds of stuff: mind and matter. Property dualism accepts only physical substance but argues it has irreducible mental properties — consciousness emerges from but is not identical to brain states.',
  '{"1": "They offer fundamentally different accounts of the mind-body relationship.", "2": "Substance here means metaphysical substance, not chemicals.", "3": "Property here means metaphysical properties, not real estate."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 5, 'What is the "regress problem" in epistemology?',
  '[{"text": "Every justified belief requires another justified belief as its basis, leading to an infinite chain unless stopped by foundational beliefs, coherence, or pragmatic considerations", "correct": true}, {"text": "A problem with going backwards in time"}, {"text": "A fitness problem about regression exercises"}, {"text": "A decline in educational standards"}]',
  'The regress problem asks: what ultimately justifies our beliefs? Foundationalists say basic beliefs need no further justification. Coherentists say beliefs justify each other in a web. Infinitists accept the infinite chain.',
  '{"1": "Regress here means an infinite chain of justification, not time travel.", "2": "It is an epistemological problem, not a fitness concept.", "3": "It is about the structure of knowledge, not educational decline."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 5, 'What is virtue signaling and why is it philosophically problematic?',
  '[{"text": "Publicly expressing moral values primarily to enhance one''s social status rather than from genuine conviction — it separates the appearance of virtue from its substance", "correct": true}, {"text": "A type of traffic signal"}, {"text": "A fitness exercise"}, {"text": "A radio frequency"}]',
  'Virtue signaling is philosophically problematic because it inverts the purpose of moral expression. Aristotle would recognize it as a failure of integrity — the appearance of virtue without the internal disposition that gives it moral worth.',
  '{"1": "Virtue signaling is about moral behavior, not traffic.", "2": "It is a social phenomenon, not physical exercise.", "3": "It is about moral expression, not telecommunications."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 5, 'What is the concept of "spontaneous order" and how does it challenge central planning?',
  '[{"text": "Complex social order emerges from individual actions without central direction — markets, language, and law evolve through human action but not human design", "correct": true}, {"text": "Randomly placing items on a desk"}, {"text": "A type of military drill"}, {"text": "A restaurant seating policy"}]',
  'Hayek, building on Adam Ferguson''s insight that institutions are "the result of human action but not of human design," argued that the most complex and beneficial social orders emerge spontaneously from free interaction, not from planning.',
  '{"1": "Spontaneous order is a sophisticated philosophical concept about social institutions, not random arrangement.", "2": "It is about social organization, not military discipline.", "3": "It concerns the emergence of social institutions, not restaurant management."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 5, 'What is the "intentional fallacy" in literary criticism?',
  '[{"text": "The error of judging a work of art by the author''s stated intentions rather than by what the work itself achieves", "correct": true}, {"text": "Intentionally making artistic mistakes"}, {"text": "A logical error about intentions in ethics"}, {"text": "A type of painting technique"}]',
  'Wimsatt and Beardsley argued that a poem belongs to the public once published — the author''s biography or stated aims are irrelevant to its meaning. The work must be judged on its own terms.',
  '{"1": "The ''fallacy'' is a critical error, not deliberate artistic mistakes.", "2": "While intentions matter in ethics, the intentional fallacy is a concept in aesthetics.", "3": "It is a principle of literary criticism, not a painting method."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 5, 'What is the difference between moral virtue and intellectual virtue in Aristotle?',
  '[{"text": "Moral virtues (courage, temperance) are habits of character formed through practice; intellectual virtues (wisdom, understanding) are developed through teaching and reflection", "correct": true}, {"text": "Moral virtues are more important"}, {"text": "Intellectual virtues are only for academics"}, {"text": "Aristotle rejected intellectual virtues"}]',
  'Aristotle distinguished two kinds of excellence: moral virtues develop through habituation (doing courageous acts makes you courageous) while intellectual virtues develop through instruction and contemplation.',
  '{"1": "Aristotle valued both; phronesis (practical wisdom) bridges them.", "2": "Aristotle believed all people should develop intellectual virtues, not just scholars.", "3": "Aristotle devoted significant attention to intellectual virtues in the Nicomachean Ethics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 5, 'What is "moral hazard" and why is it philosophically significant?',
  '[{"text": "When protection from risk encourages riskier behavior — insurance, bailouts, or safety nets change incentives and can increase the very harms they aim to prevent", "correct": true}, {"text": "A dangerous chemical"}, {"text": "A type of extreme sport"}, {"text": "A road hazard"}]',
  'Moral hazard reveals that consequences shape behavior. When banks know they will be bailed out, they take greater risks. The philosophical significance: good intentions (protecting people) can create perverse incentives.',
  '{"1": "Moral hazard is an economic concept, not a chemical.", "2": "It is about incentive structures, not sports.", "3": "It is about behavioral incentives, not road conditions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 5, 'What is the concept of "substantive due process"?',
  '[{"text": "The principle that certain fundamental rights are protected from government interference regardless of the procedures used — the substance of law, not just its process, must be fair", "correct": true}, {"text": "A cooking technique"}, {"text": "A type of building foundation"}, {"text": "A chemical process"}]',
  'Substantive due process extends the Fourteenth Amendment beyond procedural fairness to protect fundamental liberties (privacy, bodily autonomy, family relationships) from government intrusion, even through properly enacted laws.',
  '{"1": "Due process is a legal concept, not a culinary one.", "2": "It is about legal foundations, not physical ones.", "3": "It concerns constitutional law, not chemistry."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 5, 'What was the significance of the Stoic concept of cosmopolitanism for later philosophy?',
  '[{"text": "The Stoic idea that all humans are citizens of the world, regardless of local origin, laid the groundwork for universal human rights and international law", "correct": true}, {"text": "It was about cosmetics"}, {"text": "It only applied to Greeks"}, {"text": "It was quickly forgotten"}]',
  'Marcus Aurelius wrote: "My city and country, so far as I am Antoninus, is Rome, but so far as I am a man, it is the world." This Stoic universalism influenced natural law theory, Kant''s cosmopolitan right, and the UN Declaration of Human Rights.',
  '{"1": "Cosmopolitanism is about world citizenship, not cosmetics.", "2": "The entire point of Stoic cosmopolitanism was to transcend local and ethnic boundaries.", "3": "It profoundly influenced Western political philosophy for millennia."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 5, 'What is the relationship between Schopenhauer''s philosophy and Wagner''s music?',
  '[{"text": "Schopenhauer argued music directly expresses the will (ultimate reality), which deeply influenced Wagner''s vision of music-drama as the supreme art form", "correct": true}, {"text": "They were enemies"}, {"text": "Schopenhauer hated music"}, {"text": "Wagner never read philosophy"}]',
  'Wagner discovered Schopenhauer in 1854 and it transformed his art. Schopenhauer''s claim that music bypasses representation to express the metaphysical will directly gave Wagner a philosophical foundation for opera as Gesamtkunstwerk.',
  '{"1": "Wagner was profoundly influenced by Schopenhauer; he read ''The World as Will and Representation'' repeatedly.", "2": "Schopenhauer gave music the highest place among the arts.", "3": "Wagner was deeply engaged with philosophy, especially Schopenhauer and later Nietzsche."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 5, 'What philosophical questions does the "Ship of Theseus" (2012 film by Anand Gandhi) explore?',
  '[{"text": "Personal identity and continuity through organ transplantation — when parts of you are replaced, are you still you?", "correct": true}, {"text": "Ancient Greek naval warfare"}, {"text": "Modern shipping logistics"}, {"text": "How to repair wooden boats"}]',
  'This film uses three stories of organ recipients to explore the ancient metaphysical puzzle in a contemporary medical context: a blind photographer who regains sight, a monk who needs an animal organ, and a stockbroker with a transplanted kidney.',
  '{"1": "The film applies the ancient thought experiment to modern medicine, not ancient warfare.", "2": "It concerns personal identity, not commercial shipping.", "3": "It uses the ship metaphor for human identity, not literal boat repair."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 5, 'What is the "right to be forgotten" and what philosophical tensions does it create?',
  '[{"text": "The claim that individuals should be able to have personal information removed from the internet, creating tension between privacy and freedom of information", "correct": true}, {"text": "A memory loss treatment"}, {"text": "A game where you try to be invisible"}, {"text": "A type of amnesia"}]',
  'The right to be forgotten (EU GDPR Article 17) creates a direct conflict between two values: the individual''s right to control their digital identity and the public''s right to access information. Neither can fully prevail without harming the other.',
  '{"1": "It is a legal and philosophical concept about data privacy, not a medical treatment.", "2": "It is about digital privacy rights, not a game.", "3": "It concerns voluntary data deletion, not involuntary memory loss."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 5, 'Who wrote: "Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither Liberty nor Safety"?',
  '[{"text": "Benjamin Franklin", "correct": true}, {"text": "Thomas Jefferson"}, {"text": "John Adams"}, {"text": "Alexander Hamilton"}]',
  'Franklin wrote this in 1755 on behalf of the Pennsylvania Assembly. It captures the philosophical principle that liberty and security are not truly opposed — sacrificing liberty for security ultimately destroys both.',
  '{"1": "Jefferson expressed similar sentiments but this specific quote is Franklin''s.", "2": "Adams was concerned with balancing liberty and order but did not write this.", "3": "Hamilton favored stronger government but this quote is attributed to Franklin."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 7, 'What is mereological nihilism?',
  '[{"text": "The view that composite objects do not exist — only fundamental simples arranged in certain ways exist", "correct": true}, {"text": "A form of political nihilism about government agencies"}, {"text": "The denial that parts exist"}, {"text": "A theory about nothing at all existing"}]',
  'Peter van Inwagen and others argue that there are no tables or chairs — only particles arranged ''tablewise'' or ''chairwise.'' This radical position avoids problems about when parts compose a whole but challenges common sense.',
  '{"1": "It is a metaphysical thesis about composition, not politics.", "2": "It denies composites, not parts themselves — simples (fundamental particles) still exist.", "3": "It is not general nihilism; it specifically concerns composite objects."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 7, 'What is the difference between evidentialist and pragmatist theories of epistemic justification?',
  '[{"text": "Evidentialism holds that belief should be proportioned to evidence alone; pragmatism allows practical consequences to play a role in justification", "correct": true}, {"text": "They are identical"}, {"text": "Evidentialism is about court evidence only"}, {"text": "Pragmatism rejects all evidence"}]',
  'W.K. Clifford''s evidentialism says it is always wrong to believe anything without sufficient evidence. William James''s pragmatism responds that when evidence is inconclusive, practical consequences of belief can legitimately tip the balance.',
  '{"1": "They represent fundamentally different approaches to the ethics of belief.", "2": "Evidentialism is a general epistemological position, not limited to courts.", "3": "Pragmatism accepts evidence but also weighs practical consequences."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 7, 'What is the Doctrine of Double Effect?',
  '[{"text": "It is permissible to cause harm as a foreseen but unintended side effect of a good action, but not to cause that same harm as a means to the good end", "correct": true}, {"text": "A theory about twin siblings"}, {"text": "A military strategy about double attacks"}, {"text": "A photography technique"}]',
  'Attributed to Aquinas, this doctrine distinguishes between a surgeon who foresees a patient''s death as a side effect of risky surgery (permissible) and one who kills the patient to harvest organs for five others (impermissible).',
  '{"1": "''Double'' refers to the two effects (intended good and foreseen harm), not twins.", "2": "It is an ethical principle, not a military concept.", "3": "It is moral philosophy, not photography."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 7, 'What is the difference between Oakeshott''s conservatism and Burke''s?',
  '[{"text": "Burke grounds conservatism in the accumulated wisdom of tradition against abstract rationalism; Oakeshott grounds it in a disposition to enjoy the present rather than pursue ideological transformation", "correct": true}, {"text": "They are the same"}, {"text": "Oakeshott was a radical progressive"}, {"text": "Burke rejected all tradition"}]',
  'Burke argues that inherited institutions embody more wisdom than any individual rationalist can design. Oakeshott goes further — conservatism is not a doctrine but a temperamental preference for the familiar, the tried, the intimate.',
  '{"1": "They share conservative sensibilities but differ in philosophical foundations.", "2": "Oakeshott was one of the 20th century''s most important conservative thinkers.", "3": "Burke is the founding figure of philosophical conservatism, deeply committed to tradition."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 7, 'What is the relationship between Kant''s "free beauty" and "dependent beauty"?',
  '[{"text": "Free beauty is appreciated without any concept of what the object should be; dependent beauty requires judging the object against a concept of its purpose or type", "correct": true}, {"text": "Free beauty costs nothing; dependent beauty is expensive"}, {"text": "They are the same concept"}, {"text": "Kant rejected the idea of beauty"}]',
  'A flower exhibits free beauty — we appreciate it without needing to know what a ''perfect'' flower is. A building exhibits dependent beauty — we judge it partly by how well it serves its function. This distinction maps onto pure vs. applied aesthetics.',
  '{"1": "''Free'' and ''dependent'' refer to the role of concepts in judgment, not to cost.", "2": "They are distinct categories within Kant''s aesthetic theory.", "3": "Kant devoted his ''Critique of Judgment'' to analyzing beauty."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 7, 'What is the "situationist challenge" to virtue ethics?',
  '[{"text": "Empirical psychology suggests character traits are less consistent than virtue ethicists assume — people''s behavior varies dramatically with situational factors rather than stable character", "correct": true}, {"text": "A challenge to perform virtuous acts in difficult situations"}, {"text": "A reality TV show about ethics"}, {"text": "A military scenario training exercise"}]',
  'John Doris and Gilbert Harman cited experiments (Milgram, Zimbardo, Good Samaritan) showing that situational pressures predict behavior better than character traits. If stable character traits are rare, virtue ethics rests on an empirical mistake.',
  '{"1": "The challenge is empirical/philosophical, not a practical exercise.", "2": "It is a serious academic debate, not entertainment.", "3": "It concerns moral psychology, not military training."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 7, 'What is the Hayekian "knowledge problem" and how does it differ from the Misesian "calculation problem"?',
  '[{"text": "Mises argued socialism cannot calculate without market prices; Hayek deepened this to argue that much economic knowledge is tacit and dispersed, impossible to centralize even with computers", "correct": true}, {"text": "They are the same argument"}, {"text": "Hayek supported central planning"}, {"text": "Mises was a socialist"}]',
  'Mises (1920) showed that without prices for capital goods, rational economic calculation is impossible. Hayek (1945) went further: even if a planner had all explicit data, the tacit, local, ever-changing knowledge that market participants use cannot be centralized.',
  '{"1": "Hayek built on Mises but added a distinct epistemological dimension.", "2": "Hayek was the foremost critic of central planning.", "3": "Mises was the foremost defender of free-market capitalism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 7, 'What is the difference between "originalism" and "living constitutionalism"?',
  '[{"text": "Originalism interprets the constitution by its original public meaning; living constitutionalism sees it as evolving with changing societal values", "correct": true}, {"text": "They are the same approach"}, {"text": "Originalism is progressive; living constitutionalism is conservative"}, {"text": "Neither applies to actual courts"}]',
  'Scalia championed originalism — the Constitution means what its ratifiers understood. Breyer and others argue the Constitution''s broad principles must be applied to circumstances the founders could not have foreseen.',
  '{"1": "They are fundamentally different approaches to constitutional interpretation.", "2": "Originalism is generally associated with judicial conservatism; living constitutionalism with progressivism.", "3": "Both are actively used by judges at all levels."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 7, 'What was the "quarrel of the ancients and moderns" and why does it matter?',
  '[{"text": "A 17th-century debate about whether modern thinkers had surpassed the ancients, establishing the idea of intellectual progress that defines modernity", "correct": true}, {"text": "A war between Greece and France"}, {"text": "A family dispute"}, {"text": "A sports rivalry"}]',
  'This debate (Perrault vs. Boileau, Swift''s "Battle of the Books") asked whether contemporary culture had exceeded classical achievement. The moderns'' victory established the Enlightenment idea of progress that shaped all subsequent Western thought.',
  '{"1": "It was an intellectual debate, not a military conflict.", "2": "It was a cultural debate among intellectuals, not a family matter.", "3": "It concerned intellectual and cultural progress, not athletics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 7, 'What is Pythagoras''s contribution to both music theory and philosophy?',
  '[{"text": "He discovered that musical harmony corresponds to mathematical ratios, leading to the idea that reality itself has a mathematical structure", "correct": true}, {"text": "He invented the guitar"}, {"text": "He wrote symphonies"}, {"text": "He rejected music as meaningless"}]',
  'Pythagoras found that harmonious intervals correspond to simple numerical ratios (octave = 2:1, fifth = 3:2). This led to his revolutionary insight that the cosmos itself might be structured by mathematical relationships — "all is number."',
  '{"1": "Pythagoras studied string vibrations, not guitars (which came much later).", "2": "Symphonies were a much later form; Pythagoras studied the mathematics of sound.", "3": "Pythagoras saw music as the key to understanding cosmic order."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 7, 'What is the philosophical significance of the "Kuleshov Effect" in cinema?',
  '[{"text": "It demonstrates that meaning in film is created by the juxtaposition of images, not inherent in individual shots — viewers project emotion and narrative onto neutral footage based on context", "correct": true}, {"text": "A camera manufacturing defect"}, {"text": "A type of film coloring"}, {"text": "A Russian dance move"}]',
  'Lev Kuleshov showed that the same shot of an expressionless face, when intercut with a bowl of soup, a dead child, or a woman, was read as hunger, grief, or desire. This proved that montage — not content — creates cinematic meaning.',
  '{"1": "The Kuleshov Effect is about perception and meaning, not equipment.", "2": "It is about editing and cognitive interpretation, not visual coloring.", "3": "It is a concept in film theory, not a dance."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 7, 'What is the "experience machine" thought experiment and what does it show?',
  '[{"text": "Nozick asks: would you plug into a machine that provides perfect simulated happiness? Most say no, suggesting we value authentic experience and real achievement, not just pleasant feelings", "correct": true}, {"text": "A washing machine that learns your preferences"}, {"text": "A theory about gaining work experience"}, {"text": "An amusement park ride"}]',
  'Robert Nozick''s thought experiment challenges hedonistic utilitarianism. If happiness were all that mattered, we should plug in. That most people refuse shows we value reality, authenticity, and actual accomplishment — not just subjective satisfaction.',
  '{"1": "It is a philosophical thought experiment, not an appliance.", "2": "It concerns the nature of well-being, not career development.", "3": "It is a mental exercise, not a physical ride."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 9, 'What is the "truthmaker principle" and why is it controversial?',
  '[{"text": "Every truth must be made true by some entity or state of affairs in the world — controversial because negative truths and modal truths seem to lack obvious truthmakers", "correct": true}, {"text": "A principle about lie detectors"}, {"text": "A rule for journalists"}, {"text": "A manufacturing quality standard"}]',
  'The truthmaker principle demands ontological accountability: if ''there are no unicorns'' is true, what in reality makes it true? The absence of unicorns? A negative state of affairs? This pushes metaphysics into difficult territory.',
  '{"1": "Truthmaking is a metaphysical concept, not about detecting lies.", "2": "It is about the relationship between truth and reality, not journalism.", "3": "It is a philosophical principle, not a manufacturing standard."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 9, 'What is the "swamping problem" for reliabilism?',
  '[{"text": "If a reliable process produces a true belief, the reliability adds no value beyond the truth itself — like good coffee tastes the same whether from a reliable or unreliable machine", "correct": true}, {"text": "A problem with swampy terrain"}, {"text": "A plumbing issue"}, {"text": "A flooding emergency protocol"}]',
  'The swamping problem (Zagzebski, Kvanvig) challenges process reliabilism by asking: what value does reliability add to a belief that is already true? If knowledge is more valuable than mere true belief, reliability alone cannot explain why.',
  '{"1": "''Swamping'' here means the truth value overwhelms the reliability value, not actual swamps.", "2": "It is an epistemological problem, not a plumbing issue.", "3": "It concerns the value of knowledge, not emergency management."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 9, 'What is the "separateness of persons" objection to utilitarianism?',
  '[{"text": "Utilitarianism treats society as a single super-organism whose total welfare is to be maximized, ignoring the moral significance of boundaries between individuals", "correct": true}, {"text": "That people should live separately"}, {"text": "An argument for social distancing"}, {"text": "A theory about personality differences"}]',
  'Rawls and Nozick argue that utilitarianism''s aggregation of welfare across persons is illegitimate. Just as it is rational for me to sacrifice present pleasure for future benefit, utilitarianism assumes it is rational to sacrifice one person for others — but persons are not interchangeable.',
  '{"1": "It is about the moral unit of analysis, not living arrangements.", "2": "It is a deep moral philosophy objection, not a public health measure.", "3": "It concerns moral theory, not psychology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 9, 'What is Chantal Mouffe''s concept of "agonistic pluralism"?',
  '[{"text": "Democratic politics should transform enemies into adversaries who share a commitment to democratic institutions while contesting their interpretation — conflict is constitutive of democracy, not a failure of it", "correct": true}, {"text": "A theory about athletic competition"}, {"text": "A medical condition"}, {"text": "A type of gardening"}]',
  'Mouffe argues against Habermas''s deliberative consensus. Genuine political passions and conflicts cannot be eliminated through rational deliberation. Healthy democracy channels antagonism into agonism — passionate but rules-bound contestation.',
  '{"1": "''Agonistic'' comes from ''agon'' (contest), applied to politics, not sports specifically.", "2": "It is a political theory, not a medical condition.", "3": "It concerns democratic conflict, not horticulture."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 9, 'What was the philosophical significance of the condemnation of 1277?',
  '[{"text": "The Bishop of Paris condemned 219 philosophical propositions, inadvertently liberating natural philosophy from Aristotelian constraints and preparing the ground for modern science", "correct": true}, {"text": "A criminal trial"}, {"text": "A building code violation"}, {"text": "A literary review"}]',
  'By condemning Aristotelian necessitarianism, the 1277 condemnation made it legitimate to hypothesize that God could have created nature differently — opening the door to empirical investigation of contingent natural laws, a precondition for modern science.',
  '{"1": "It was a theological-philosophical condemnation, not a criminal case.", "2": "It concerned intellectual propositions, not buildings.", "3": "It was an ecclesiastical act, not literary criticism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 9, 'What is Adorno''s concept of the "truth content" (Wahrheitsgehalt) of artworks?',
  '[{"text": "Artworks have objective truth content that is sedimented social experience — they register historical suffering and contradiction in their form, not their explicit content or the artist''s intentions", "correct": true}, {"text": "The factual accuracy of art"}, {"text": "The resale value of art"}, {"text": "Whether art is made from genuine materials"}]',
  'For Adorno, Beethoven''s late quartets are ''true'' not because they state truths but because their fractured form embodies the contradictions of their historical moment. Truth content is deciphered through immanent critique of the work''s structure.',
  '{"1": "Truth content is about historical and social truth embedded in aesthetic form, not factual accuracy.", "2": "It concerns philosophical meaning, not market value.", "3": "It is about artistic truth, not material authenticity."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 9, 'What is the Mundell-Fleming "impossible trinity" and what philosophical choice does it force?',
  '[{"text": "A country cannot simultaneously have free capital movement, a fixed exchange rate, and independent monetary policy — it must sacrifice one, revealing inescapable tradeoffs in political economy", "correct": true}, {"text": "A religious doctrine"}, {"text": "A three-body problem in physics"}, {"text": "A triathlon training program"}]',
  'The impossible trinity shows that economic policy involves irreducible tradeoffs. Like Arrow''s impossibility theorem in social choice, it demonstrates that certain combinations of desirable properties are logically incompatible.',
  '{"1": "The ''trinity'' refers to three policy goals, not religious doctrine.", "2": "While analogous to the physics problem in structure, it concerns macroeconomics.", "3": "It is an economic constraint, not an athletic program."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 9, 'What is the "unity of the virtues" thesis and why do contemporary virtue ethicists debate it?',
  '[{"text": "The ancient claim that possessing any virtue fully requires possessing all virtues — you cannot be truly courageous without also being just, temperate, and wise", "correct": true}, {"text": "That all virtues are the same virtue"}, {"text": "That only one virtue matters"}, {"text": "That virtues should be united under one government"}]',
  'Socrates and the Stoics held that the virtues are unified. A common objection: people seem to have some virtues but not others. Defenders argue that apparent courage without justice is mere recklessness — genuine virtue requires practical wisdom that connects all virtues.',
  '{"1": "Unity means interconnection, not identity — each virtue is distinct but requires the others.", "2": "The thesis claims all virtues are required, not that only one matters.", "3": "It is an ethical thesis about character, not a political one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 9, 'What is the philosophical problem of "hard cases" in law?',
  '[{"text": "Cases where existing legal rules do not clearly determine the outcome, forcing judges to exercise discretion — raising the question of whether they discover or create law", "correct": true}, {"text": "Cases involving very heavy evidence"}, {"text": "Physically difficult courtroom conditions"}, {"text": "Cases that take a long time"}]',
  'Dworkin argued that judges in hard cases discover the right answer by interpreting law as integrity. Hart argued that law has an "open texture" and judges inevitably exercise discretion. This debate defines modern jurisprudence.',
  '{"1": "''Hard'' refers to legal difficulty, not physical weight.", "2": "It concerns legal reasoning, not courtroom conditions.", "3": "It is about legal indeterminacy, not case duration."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 9, 'Who wrote: "The owl of Minerva spreads its wings only with the falling of the dusk"?',
  '[{"text": "G.W.F. Hegel", "correct": true}, {"text": "Immanuel Kant"}, {"text": "Arthur Schopenhauer"}, {"text": "Friedrich Schelling"}]',
  'Hegel wrote this in the preface to "Philosophy of Right" (1820), meaning that philosophy understands an era only after it has ended. Wisdom arrives too late to change events — it can only comprehend what has already unfolded.',
  '{"1": "Kant emphasized the role of reason in shaping the future, not retrospective understanding.", "2": "Schopenhauer had a pessimistic worldview but this specific metaphor is Hegel''s.", "3": "Schelling was Hegel''s early collaborator but this quote is from Hegel''s mature work."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 1, 'What is the difference between mind and body?',
  '[{"text": "The mind thinks and experiences; the body is physical matter — how they relate is one of philosophy''s oldest questions", "correct": true}, {"text": "There is no difference"}, {"text": "The body does not exist"}, {"text": "The mind does not exist"}]',
  'The mind-body problem asks how mental phenomena (thoughts, feelings) relate to physical phenomena (brain activity, behavior). This has been debated from Descartes through contemporary neuroscience.',
  '{"1": "Most philosophers acknowledge some distinction between mental and physical phenomena.", "2": "Idealism denies physical reality, but this is a minority position.", "3": "Eliminative materialism denies mental states, but this too is controversial."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 1, 'What is truth?',
  '[{"text": "A statement or belief that corresponds to the facts of reality", "correct": true}, {"text": "Whatever most people believe"}, {"text": "Whatever makes you feel good"}, {"text": "Whatever the government says"}]',
  'The correspondence theory of truth — that truth is agreement between thought and reality — is the most intuitive and widely held theory. Aristotle said: "To say of what is that it is, and of what is not that it is not, is true."',
  '{"1": "Truth is about reality, not popularity — the majority can be wrong.", "2": "Feelings are not a test of truth; comfortable beliefs can be false.", "3": "Government proclamations can be false; truth is independent of authority."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 1, 'What is right and wrong?',
  '[{"text": "Right actions promote human well-being and respect others; wrong actions cause unnecessary harm or violate rights", "correct": true}, {"text": "Whatever you feel like doing is right"}, {"text": "Right and wrong do not exist"}, {"text": "Only religious texts can determine right and wrong"}]',
  'While philosophers disagree on the foundations of morality (virtue, duty, consequences, rights), most agree that moral distinctions are real and that reason plays a central role in moral judgment.',
  '{"1": "Feelings can mislead; moral judgment requires reason.", "2": "Moral nihilism is a philosophical position, but most philosophers reject it.", "3": "Secular philosophical traditions have robust theories of right and wrong."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 1, 'What is freedom?',
  '[{"text": "The condition of being able to act according to your own judgment without coercion by others", "correct": true}, {"text": "Having no responsibilities"}, {"text": "Doing whatever you want regardless of consequences"}, {"text": "Being alone"}]',
  'Political freedom means the absence of coercion — no one forces you to act against your judgment. It does not mean freedom from natural constraints, responsibilities, or the consequences of your choices.',
  '{"1": "Freedom includes the responsibility that comes with self-governance.", "2": "Freedom within a society requires respecting others'' freedom too.", "3": "Freedom is about self-determination, not isolation."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 1, 'Who is Confucius?',
  '[{"text": "An ancient Chinese philosopher who taught ethics, proper social relationships, and the importance of education and virtue", "correct": true}, {"text": "A Roman emperor"}, {"text": "A Greek mathematician"}, {"text": "A medieval knight"}]',
  'Confucius (551-479 BC) is the most influential philosopher in East Asian history. His teachings on ren (benevolence), li (ritual propriety), and filial piety shaped Chinese civilization for over 2,500 years.',
  '{"1": "Confucius was Chinese, not Roman.", "2": "Confucius was a moral philosopher, not a mathematician.", "3": "Confucius lived in ancient China, not medieval Europe."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 1, 'What is honesty?',
  '[{"text": "The virtue of being truthful and transparent, not deceiving others or oneself", "correct": true}, {"text": "Saying whatever people want to hear"}, {"text": "Being rude to everyone"}, {"text": "Keeping secrets from everyone"}]',
  'Honesty is valued across virtually all philosophical traditions. It involves telling the truth, keeping promises, and not manipulating others through deception.',
  '{"1": "Telling people what they want to hear is flattery, not honesty.", "2": "Honesty can be delivered with tact; rudeness is not required.", "3": "Some confidentiality is compatible with honesty; dishonesty involves active deception."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 1, 'What is trade?',
  '[{"text": "The voluntary exchange of goods or services between people for mutual benefit", "correct": true}, {"text": "Taking things from others by force"}, {"text": "Giving everything away for free"}, {"text": "A type of weather pattern"}]',
  'Trade is the foundation of economic cooperation. When two people trade voluntarily, both benefit — otherwise they would not agree to the exchange. This insight is central to free-market economics.',
  '{"1": "Taking by force is theft or robbery, the opposite of trade.", "2": "Giving for free is charity; trade involves mutual exchange.", "3": "Trade is an economic concept, not meteorological."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 1, 'What is a constitution?',
  '[{"text": "The fundamental law of a nation that establishes the structure of government and protects individual rights", "correct": true}, {"text": "A person''s physical health"}, {"text": "A recipe book"}, {"text": "A type of exercise"}]',
  'A constitution is the supreme law that constrains government power. The U.S. Constitution (1787) was the first modern written constitution and has been a model for nations worldwide.',
  '{"1": "While ''constitution'' can refer to health, in political context it means fundamental law.", "2": "A constitution is a legal document, not a cookbook.", "3": "Constitutional in law means foundational, not related to exercise."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 1, 'What is a melody?',
  '[{"text": "A sequence of musical notes that forms a recognizable, memorable pattern", "correct": true}, {"text": "A type of fruit"}, {"text": "A form of government"}, {"text": "A mathematical formula"}]',
  'Melody is one of the most fundamental elements of music. From simple folk tunes to complex symphonic themes, melody gives music its identity and emotional power.',
  '{"1": "Melody is a musical concept, not botanical.", "2": "Melody is an element of music, not politics.", "3": "While music has mathematical properties, melody is a musical concept."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 1, 'What is a director''s role in filmmaking?',
  '[{"text": "The director guides the creative vision of a film — making decisions about acting, cinematography, editing, and storytelling", "correct": true}, {"text": "The director only handles finances"}, {"text": "The director writes the screenplay"}, {"text": "The director operates the camera"}]',
  'The director is the primary creative force behind a film. While producers handle finances and screenwriters create the script, the director shapes how the story is told visually and dramatically.',
  '{"1": "Financial management is the producer''s role.", "2": "The screenwriter writes the script; the director interprets it.", "3": "The cinematographer operates the camera; the director guides their work."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 1, 'Who said: "In the middle of difficulty lies opportunity"?',
  '[{"text": "Albert Einstein", "correct": true}, {"text": "Isaac Newton"}, {"text": "Charles Darwin"}, {"text": "Stephen Hawking"}]',
  'Einstein, though primarily a physicist, offered many philosophical insights. This quote reflects a stoic-like recognition that challenges often contain the seeds of growth and innovation.',
  '{"1": "Newton was known for scientific laws, not this particular quote.", "2": "Darwin focused on evolution, not motivational philosophy.", "3": "Hawking made cosmological insights but this quote is Einstein''s."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 1, 'What is a thought experiment?',
  '[{"text": "An imaginary scenario used to test a philosophical or scientific idea without actually performing it", "correct": true}, {"text": "An experiment conducted in a laboratory"}, {"text": "A type of meditation"}, {"text": "A psychological test"}]',
  'Thought experiments have been essential to philosophy since Plato''s Cave and are still used today (trolley problem, Chinese room, experience machine). They test intuitions and reveal hidden assumptions.',
  '{"1": "Thought experiments are mental exercises, not laboratory procedures.", "2": "They are intellectual tools, not meditative practices.", "3": "They are philosophical methods, not standardized psychological assessments."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 1, 'What makes America philosophically unique among nations?',
  '[{"text": "It was the first nation founded on explicit philosophical principles — individual rights, limited government, and the consent of the governed", "correct": true}, {"text": "It has the largest military"}, {"text": "It has the oldest civilization"}, {"text": "It has the most natural resources"}]',
  'Unlike nations formed by tribal, ethnic, or religious identity, America was founded on Enlightenment ideas about the nature of man and the proper role of government. The Declaration of Independence IS a philosophical document.',
  '{"1": "Military power is a consequence, not the philosophical foundation.", "2": "Many civilizations are far older; America''s uniqueness is philosophical, not temporal.", "3": "Resources do not define a nation''s philosophical character."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 2, 'What is free will?',
  '[{"text": "The ability to make genuine choices that are not fully determined by prior causes", "correct": true}, {"text": "The freedom to do anything without consequences"}, {"text": "A legal document"}, {"text": "A type of inheritance"}]',
  'The free will debate asks whether humans genuinely choose their actions or whether everything is determined by prior causes (genes, environment, brain chemistry). This has enormous implications for moral responsibility.',
  '{"1": "Free will means the ability to choose, not freedom from consequences.", "2": "A ''last will'' is a legal document; free will is a philosophical concept.", "3": "A ''will'' in inheritance law is different from philosophical free will."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 2, 'What is logic?',
  '[{"text": "The study of valid reasoning — the rules for distinguishing correct from incorrect arguments", "correct": true}, {"text": "A type of board game"}, {"text": "Advanced mathematics only"}, {"text": "A computer programming language"}]',
  'Logic, founded by Aristotle, provides the rules for valid inference. If the premises are true and the argument is valid, the conclusion must be true. It is the foundation of all rational inquiry.',
  '{"1": "Logic is a branch of philosophy and mathematics, not a game.", "2": "Logic is used in mathematics but is a broader field encompassing all reasoning.", "3": "While programming uses logic, logic as a discipline predates computers by 2,400 years."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 2, 'What is the difference between morality and legality?',
  '[{"text": "Morality concerns what is right and wrong; legality concerns what is permitted and prohibited by law — they often overlap but are not identical", "correct": true}, {"text": "They are exactly the same"}, {"text": "Morality is more important than legality always"}, {"text": "Legality is more important than morality always"}]',
  'Slavery was legal but immoral. Helping an escaped slave was illegal but moral. The distinction between moral and legal is essential — unjust laws can and should be challenged on moral grounds.',
  '{"1": "Legal and moral codes often diverge; what is legal is not always moral and vice versa.", "2": "While moral principles should inform law, there can be moral obligations to break unjust laws.", "3": "Legality without morality can produce tyranny."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 2, 'What is a republic?',
  '[{"text": "A form of government where power is held by elected representatives who are bound by a constitution protecting individual rights", "correct": true}, {"text": "Another word for democracy"}, {"text": "Rule by a king"}, {"text": "A country with no government"}]',
  'A republic differs from a pure democracy in that individual rights are constitutionally protected even from majority rule. The American founders deliberately created a republic, not a direct democracy.',
  '{"1": "A republic has constitutional limits on majority rule that a pure democracy may lack.", "2": "A republic has elected officials, not a hereditary monarch.", "3": "A republic has a government — one that is constitutionally limited."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 2, 'Why do humans create art?',
  '[{"text": "To express, explore, and communicate ideas about the human experience — art fulfills a deep psychological need for meaning and beauty", "correct": true}, {"text": "Only for money"}, {"text": "Only because they are bored"}, {"text": "Art serves no purpose"}]',
  'Art appears in every human culture throughout history. Philosophers from Aristotle to Rand have argued that art serves fundamental cognitive and psychological needs — it makes abstract ideas concrete and experienceable.',
  '{"1": "Art predates money and exists in cultures without commerce.", "2": "Art expresses the deepest human concerns, not mere boredom.", "3": "Art serves profound cognitive, emotional, and social functions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 2, 'Who was Aristotle?',
  '[{"text": "A Greek philosopher who studied logic, ethics, politics, biology, and metaphysics — often called the father of Western science", "correct": true}, {"text": "A Roman gladiator"}, {"text": "An Egyptian pharaoh"}, {"text": "A medieval alchemist"}]',
  'Aristotle (384-322 BC) studied under Plato, tutored Alexander the Great, and wrote on virtually every subject. His works on logic, ethics, politics, and natural philosophy dominated Western thought for two millennia.',
  '{"1": "Aristotle was a philosopher and teacher, not a warrior.", "2": "Aristotle was Greek, not Egyptian.", "3": "Aristotle lived in ancient Greece, over a thousand years before the medieval period."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 2, 'What is justice according to classical philosophy?',
  '[{"text": "Giving each person what they deserve based on objective standards of merit and rights", "correct": true}, {"text": "Treating everyone exactly the same regardless of actions"}, {"text": "Revenge against wrongdoers"}, {"text": "Whatever the judge feels like"}]',
  'Aristotle distinguished distributive justice (fair allocation based on merit) from corrective justice (rectifying wrongs). Both require objective standards, not arbitrary feelings or mechanical equality.',
  '{"1": "Justice may require treating different cases differently based on relevant factors.", "2": "Justice is about fair treatment, not revenge.", "3": "Justice requires objectivity, not judicial whim."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 2, 'What is profit?',
  '[{"text": "The gain earned by producing value for others — the reward for successfully meeting people''s needs through voluntary exchange", "correct": true}, {"text": "Money stolen from workers"}, {"text": "A guaranteed right"}, {"text": "Only available to large corporations"}]',
  'Profit signals that a producer is creating more value than they consume. In a free market, profit comes from serving customers better than competitors. Loss signals failure to create value.',
  '{"1": "Profit in a free market comes from voluntary exchange, not exploitation.", "2": "Profit must be earned; it is never guaranteed.", "3": "Any business of any size can earn profit."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 2, 'What is due process?',
  '[{"text": "The legal requirement that the government must respect all rights owed to a person according to established procedures before depriving them of life, liberty, or property", "correct": true}, {"text": "A cooking process"}, {"text": "A manufacturing method"}, {"text": "A banking procedure"}]',
  'Due process is a constitutional guarantee that prevents arbitrary government action. It requires notice, a hearing, and an impartial tribunal before the government can take away a person''s rights.',
  '{"1": "Due process is a legal protection, not culinary.", "2": "It is a constitutional right, not an industrial method.", "3": "It is a fundamental right in criminal and civil law, not banking."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 2, 'What is harmony in music?',
  '[{"text": "The combination of simultaneously sounded musical notes to produce chords and progressions that create emotional depth", "correct": true}, {"text": "When everyone agrees"}, {"text": "A brand of shampoo"}, {"text": "A mathematical equation"}]',
  'Musical harmony — the vertical dimension of music — creates tension and resolution, consonance and dissonance. It gives music much of its emotional power and philosophical expressiveness.',
  '{"1": "While social harmony involves agreement, musical harmony is about simultaneous pitches.", "2": "Harmony is a fundamental musical concept, not a commercial product.", "3": "While harmony has mathematical properties, it is a musical concept."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 2, 'What is a narrative in film?',
  '[{"text": "The story being told — including characters, plot, conflict, and resolution — through which philosophical themes can be explored", "correct": true}, {"text": "The credits at the end"}, {"text": "The film''s budget"}, {"text": "The cinema building itself"}]',
  'Film narrative is the vehicle through which philosophical ideas are dramatized. Great films explore questions about identity, morality, freedom, death, and meaning through compelling stories.',
  '{"1": "Credits list the production team, not the narrative.", "2": "Budget is a production concern, not the story.", "3": "The cinema is the venue; narrative is the content."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 2, 'Who said: "Know thyself"?',
  '[{"text": "Inscription at the Temple of Apollo at Delphi, embraced by Socrates", "correct": true}, {"text": "Shakespeare"}, {"text": "Confucius"}, {"text": "Buddha"}]',
  'This ancient Greek maxim was inscribed at the Temple of Apollo at Delphi and became central to Socratic philosophy. Socrates made self-examination the foundation of the philosophical life.',
  '{"1": "Shakespeare quoted many ancient ideas but this precedes him by 2,000 years.", "2": "Confucius had similar ideas about self-cultivation but this specific phrase is Greek.", "3": "Buddhism emphasizes self-knowledge differently; this is the Greek formulation."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 2, 'What is an ethical dilemma in technology?',
  '[{"text": "A situation where technological capability creates a conflict between competing moral values — like privacy vs. security in surveillance", "correct": true}, {"text": "A broken computer"}, {"text": "A software bug"}, {"text": "Running out of battery"}]',
  'Technology creates new ethical dilemmas: Should self-driving cars prioritize passengers or pedestrians? Should governments monitor communications to prevent terrorism? These require philosophical reasoning, not just technical solutions.',
  '{"1": "Ethical dilemmas are about values, not hardware failures.", "2": "Software bugs are technical problems; ethical dilemmas are moral problems.", "3": "Power supply is a practical issue, not an ethical one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 2, 'Why did the founders separate church and state?',
  '[{"text": "To protect both religious freedom and political liberty — preventing any religion from using government force and preventing government from dictating belief", "correct": true}, {"text": "Because they were all atheists"}, {"text": "To punish churches"}, {"text": "It was an accident"}]',
  'The Establishment Clause and Free Exercise Clause of the First Amendment reflect the philosophical insight that freedom of conscience requires keeping government out of religion and religion out of government.',
  '{"1": "Many founders were religious; they separated church and state to protect religion FROM government.", "2": "The separation protects churches by keeping government out of religious affairs.", "3": "It was a deliberate philosophical choice based on centuries of religious persecution in Europe."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 3, 'What is materialism in philosophy?',
  '[{"text": "The view that everything that exists is physical matter and its interactions — there is no separate mental or spiritual substance", "correct": true}, {"text": "The love of material possessions"}, {"text": "A theory about building materials"}, {"text": "A fashion philosophy"}]',
  'Philosophical materialism (or physicalism) holds that all phenomena, including consciousness, are ultimately reducible to physical processes. This contrasts with dualism (mind and body are separate) and idealism (only mind exists).',
  '{"1": "Philosophical materialism is about the nature of reality, not consumerism.", "2": "It concerns the fundamental nature of existence, not construction.", "3": "It is a metaphysical position, not related to fashion."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 3, 'What is Occam''s Razor?',
  '[{"text": "The principle that the simplest explanation consistent with the evidence should be preferred over more complex ones", "correct": true}, {"text": "A type of shaving tool"}, {"text": "A surgical instrument"}, {"text": "A criticism of bearded philosophers"}]',
  'Named after William of Ockham (14th century), this principle guides both philosophical and scientific reasoning: do not multiply entities beyond necessity. If two theories explain the same evidence, prefer the simpler one.',
  '{"1": "It is a principle of reasoning, not a grooming tool.", "2": "It is a philosophical principle, not a medical instrument.", "3": "It has nothing to do with facial hair."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 3, 'What is moral relativism?',
  '[{"text": "The view that moral judgments are not universally valid but vary by culture, time period, or individual — there are no objective moral truths", "correct": true}, {"text": "The study of morality among relatives"}, {"text": "Einstein''s theory applied to ethics"}, {"text": "A type of moral absolutism"}]',
  'Moral relativism challenges the idea of universal right and wrong. Critics argue it leads to contradictions: if all moralities are equally valid, one cannot condemn slavery, genocide, or any practice sanctioned by a culture.',
  '{"1": "It concerns moral standards, not family relationships.", "2": "Einstein''s relativity is physics; moral relativism is ethics — they are unrelated.", "3": "Moral relativism is the opposite of moral absolutism."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 3, 'What is the difference between a right and a privilege?',
  '[{"text": "Rights are inherent and cannot be legitimately taken away; privileges are granted by authority and can be revoked", "correct": true}, {"text": "They are the same thing"}, {"text": "Privileges are more important"}, {"text": "Rights only exist in democracies"}]',
  'A right to free speech cannot be legitimately revoked. A privilege to drive on public roads can be revoked for cause. Confusing rights with privileges allows governments to treat fundamental freedoms as revocable permissions.',
  '{"1": "Rights and privileges have fundamentally different philosophical bases.", "2": "Rights are foundational; privileges are conditional.", "3": "Natural rights theory holds that rights exist regardless of political system."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 3, 'What is the difference between realism and abstraction in art?',
  '[{"text": "Realism depicts the world as recognizably real; abstraction uses form, color, and line without representing recognizable objects", "correct": true}, {"text": "Realism is old; abstraction is new"}, {"text": "Realism is better than abstraction"}, {"text": "They are the same"}]',
  'These represent fundamentally different artistic philosophies. Realism (Courbet, Vermeer) aims to show the world as it appears. Abstraction (Kandinsky, Mondrian) seeks meaning through pure form. Both can achieve philosophical depth.',
  '{"1": "Both traditions span centuries; ancient art included abstract elements.", "2": "Quality depends on the individual work, not the approach.", "3": "They represent genuinely different artistic strategies."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 3, 'What was the significance of Gutenberg''s printing press for philosophy?',
  '[{"text": "It democratized knowledge by making books affordable, enabling the Reformation, the Scientific Revolution, and the Enlightenment", "correct": true}, {"text": "It had no effect on philosophy"}, {"text": "It was only used for religious texts"}, {"text": "It was invented in China and Gutenberg stole it"}]',
  'The printing press (c. 1440) broke the monopoly on knowledge held by the Church and universities. Ideas could spread rapidly, enabling Luther''s Reformation, Galileo''s science, and the entire Enlightenment project.',
  '{"1": "The printing press was one of the most transformative technologies in intellectual history.", "2": "It was used for all types of texts, rapidly spreading secular philosophy.", "3": "While Chinese printing existed earlier, Gutenberg independently developed movable type for European languages."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 3, 'What is prudence?',
  '[{"text": "The virtue of practical wisdom — the ability to discern the right course of action in specific circumstances through careful judgment", "correct": true}, {"text": "Being overly cautious about everything"}, {"text": "A type of insurance"}, {"text": "Being prudish"}]',
  'Prudence (phronesis in Greek, prudentia in Latin) is the intellectual virtue that guides moral action. It involves deliberation, good judgment about particulars, and the ability to act well in complex situations.',
  '{"1": "Prudence is about wise action, not timidity or excessive caution.", "2": "Prudential relates to wisdom in practical affairs, not insurance products.", "3": "Prudence and prudishness are different concepts entirely."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 3, 'What are property rights and why do they matter philosophically?',
  '[{"text": "The right to acquire, use, and dispose of property — they are the foundation of economic freedom and a precondition for individual liberty", "correct": true}, {"text": "The right to own only land"}, {"text": "A modern invention with no philosophical basis"}, {"text": "Only relevant to wealthy people"}]',
  'Locke argued that property rights arise from mixing one''s labor with nature. Without property rights, individuals cannot sustain their lives, plan for the future, or be free from dependence on others or the state.',
  '{"1": "Property rights encompass all forms of property — intellectual, physical, financial.", "2": "Property rights have been discussed since Aristotle and are central to political philosophy.", "3": "Property rights protect all individuals, regardless of wealth."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 3, 'What is the difference between criminal law and civil law?',
  '[{"text": "Criminal law punishes offenses against society (murder, theft); civil law resolves disputes between private parties (contracts, property)", "correct": true}, {"text": "Criminal law is more important"}, {"text": "Civil law only exists in France"}, {"text": "They are the same thing"}]',
  'Criminal law protects society from harmful acts through punishment. Civil law provides mechanisms for resolving private disputes and compensating wrongs. Both are essential to a functioning legal system.',
  '{"1": "Both are equally important aspects of the legal system.", "2": "Civil law exists in all legal systems; ''civil law system'' (as opposed to common law) is a separate concept.", "3": "They serve different but complementary functions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 3, 'Why did Nietzsche call music ''the most metaphysical of arts''?',
  '[{"text": "Because music expresses the deepest emotional and existential truths directly, without the mediation of concepts, words, or visual images", "correct": true}, {"text": "Because musicians are philosophers"}, {"text": "Because music is physically impossible"}, {"text": "Because Nietzsche was a professional musician"}]',
  'Following Schopenhauer, Nietzsche believed music bypasses rational thought to express the primal forces of existence — the Dionysian energy of life itself. His first book, "The Birth of Tragedy," was centrally about music.',
  '{"1": "Not all musicians are philosophers, but music as an art form engages deep truths.", "2": "Music is physically real — it is sound waves that evoke profound responses.", "3": "Nietzsche was an amateur pianist and composer, but primarily a philosopher."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 3, 'What philosophical themes does "The Shawshank Redemption" explore?',
  '[{"text": "Hope, freedom, institutional corruption, the resilience of the human spirit, and whether people can be rehabilitated", "correct": true}, {"text": "Space exploration"}, {"text": "Cooking competitions"}, {"text": "Athletic training"}]',
  'The film explores whether hope is rational in hopeless situations, whether institutions dehumanize people, and whether freedom is an internal state or an external condition — themes central to existentialism and political philosophy.',
  '{"1": "The film is set in a prison, not space.", "2": "It explores human freedom and dignity, not culinary arts.", "3": "While perseverance is a theme, it is not about athletics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 3, 'Who said: "Injustice anywhere is a threat to justice everywhere"?',
  '[{"text": "Martin Luther King Jr.", "correct": true}, {"text": "Nelson Mandela"}, {"text": "Mahatma Gandhi"}, {"text": "Abraham Lincoln"}]',
  'King wrote this in his "Letter from Birmingham Jail" (1963), arguing that justice is indivisible. He drew on natural law philosophy to argue that unjust laws are not truly laws and that civil disobedience against them is morally obligatory.',
  '{"1": "Mandela fought injustice but this specific quote is King''s.", "2": "Gandhi inspired King but this line is from the Birmingham Jail letter.", "3": "Lincoln preceded the civil rights movement by a century."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 3, 'What is the philosophical debate about capital punishment?',
  '[{"text": "Whether the state has the moral right to take a life as punishment — balancing justice, deterrence, and the possibility of executing innocent people", "correct": true}, {"text": "Whether capital cities should be punished"}, {"text": "A debate about capitalism"}, {"text": "A financial penalty"}]',
  'Retributivists argue some crimes deserve death. Abolitionists argue the state should never kill. The risk of executing innocent people, racial bias in sentencing, and whether punishment deters crime are central to the debate.',
  '{"1": "Capital punishment concerns the death penalty, not capital cities.", "2": "Capital punishment is about criminal justice, not economic systems.", "3": "Capital punishment is execution, not a fine."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 3, 'What is the philosophical meaning of "pursuit of happiness" in the Declaration?',
  '[{"text": "The right to pursue one''s own conception of a good life through productive effort — not a guarantee of happiness but the freedom to seek it", "correct": true}, {"text": "The government must make everyone happy"}, {"text": "Happiness means pleasure only"}, {"text": "It was a mistake in the text"}]',
  'Jefferson replaced Locke''s "property" with "pursuit of happiness," broadening the concept. It means the right to live according to your own judgment — to choose your work, values, relationships, and life''s direction.',
  '{"1": "The right is to PURSUE happiness, not to have it delivered by government.", "2": "Happiness in this context means human flourishing, not mere pleasure.", "3": "It was a deliberate philosophical choice that broadened Locke''s formulation."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 5, 'What is emergence and why does it challenge reductionism?',
  '[{"text": "Emergence is when complex systems exhibit properties not present in their individual parts — consciousness from neurons, life from chemistry — suggesting reality has irreducible layers", "correct": true}, {"text": "Emergence is a medical emergency"}, {"text": "It means something appearing from water"}, {"text": "A type of tree growth"}]',
  'The emergence debate asks: are higher-level properties (consciousness, life, social order) fully explained by lower-level components, or are they genuinely novel? This has implications for free will, consciousness, and the unity of science.',
  '{"1": "Emergence is a philosophical concept, not a medical term.", "2": "Philosophical emergence concerns the arising of novel properties from complex systems.", "3": "It is about the structure of reality, not botany."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 5, 'What is the difference between foundationalism and coherentism?',
  '[{"text": "Foundationalism says knowledge rests on basic self-evident beliefs; coherentism says beliefs are justified by their coherence with other beliefs in a web", "correct": true}, {"text": "Foundationalism is about building foundations; coherentism is about being coherent"}, {"text": "They are the same theory"}, {"text": "Neither is a serious philosophical position"}]',
  'Foundationalism (Descartes, empiricists) seeks bedrock certainty. Coherentism (Quine, Davidson) rejects foundations in favor of a holistic web where beliefs support each other. The debate shapes how we understand the structure of knowledge.',
  '{"1": "These are metaphorical names for philosophical positions about the structure of justification.", "2": "They represent fundamentally different answers to the regress problem.", "3": "Both are major positions defended by serious philosophers."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 5, 'What is the "fact-value distinction" and why do some philosophers reject it?',
  '[{"text": "The claim that factual statements and value statements are fundamentally different in kind — rejected by those who argue that values can be objective and grounded in facts about human nature", "correct": true}, {"text": "The difference between facts and opinions"}, {"text": "A legal distinction"}, {"text": "A scientific method"}]',
  'Hume argued you cannot derive "ought" from "is." But philosophers like Philippa Foot, Ayn Rand, and contemporary natural law theorists argue that facts about human nature ground objective values — life, health, and flourishing are objectively good.',
  '{"1": "The fact-value distinction is deeper than the everyday facts/opinions distinction.", "2": "It is a philosophical distinction, not a legal one specifically.", "3": "It concerns the foundations of ethics, not scientific procedure."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 5, 'What is the difference between constitutionalism and majoritarianism?',
  '[{"text": "Constitutionalism limits government power through fundamental law that even majorities cannot override; majoritarianism holds that the majority will should prevail without constraint", "correct": true}, {"text": "They are the same"}, {"text": "Constitutionalism is outdated"}, {"text": "Majoritarianism protects minorities better"}]',
  'The American founders chose constitutionalism precisely because they feared majoritarian tyranny. The Bill of Rights explicitly protects individual freedoms FROM democratic majorities.',
  '{"1": "They represent fundamentally different theories of political legitimacy.", "2": "Constitutionalism remains the basis of every liberal democracy.", "3": "Unconstrained majoritarianism can oppress minorities; constitutionalism exists to prevent this."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 5, 'What was the philosophical significance of Darwin''s theory of evolution?',
  '[{"text": "It provided a naturalistic explanation for biological complexity without design, challenging teleological arguments and forcing philosophy to reconsider the place of humans in nature", "correct": true}, {"text": "It had no philosophical implications"}, {"text": "It proved that God does not exist"}, {"text": "It only affected biology"}]',
  'Darwin''s theory challenged the argument from design, raised questions about human nature and moral status, influenced social philosophy (for better and worse), and forced a rethinking of teleology, purpose, and meaning.',
  '{"1": "Evolution had enormous philosophical implications across ethics, metaphysics, and epistemology.", "2": "Evolution does not logically prove or disprove God; it explains biological diversity naturalistically.", "3": "Its implications extended far beyond biology into ethics, politics, and philosophy of mind."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 5, 'What is the relationship between virtue and habit in Aristotle?',
  '[{"text": "Virtue is formed through habit (repeated action) but transcends mere habit because it requires practical wisdom — knowing why and when to act, not just performing actions mechanically", "correct": true}, {"text": "Virtue and habit are identical"}, {"text": "Aristotle rejected the role of habit in virtue"}, {"text": "Habit undermines virtue"}]',
  'Aristotle said we become virtuous by doing virtuous acts, just as we become skilled by practicing. But the virtuous person acts from knowledge and choice, not mere repetition — habit forms the disposition, but wisdom guides its application.',
  '{"1": "Habit is necessary but not sufficient; practical wisdom (phronesis) elevates habit to virtue.", "2": "Aristotle explicitly argued that habit is essential to virtue formation.", "3": "Good habits support virtue; Aristotle saw them as the training ground for character."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 5, 'What is the subjective theory of value?',
  '[{"text": "The value of a good is determined by individual preferences and marginal utility, not by the labor required to produce it", "correct": true}, {"text": "That all values are relative and nothing has real worth"}, {"text": "A psychological theory about self-esteem"}, {"text": "A theory about art valuation"}]',
  'The marginal revolution (Menger, Jevons, Walras) showed that value is determined by how much satisfaction the next unit provides to a specific person in specific circumstances — not by intrinsic properties or labor costs.',
  '{"1": "Subjective value theory does not deny that goods have real worth; it explains how that worth is determined.", "2": "It is an economic theory about prices and exchange, not psychology.", "3": "It applies to all goods and services, not just art."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 5, 'What is stare decisis and why is it philosophically important?',
  '[{"text": "The principle that courts should follow precedent — it provides predictability and consistency but can perpetuate past errors", "correct": true}, {"text": "A Latin greeting"}, {"text": "A courtroom seating arrangement"}, {"text": "A type of legal document"}]',
  'Stare decisis ("to stand by things decided") creates a tension: consistency and predictability vs. the ability to correct past mistakes. How much should precedent constrain future judges? This is a deep question about the nature of law.',
  '{"1": "It is a legal principle, not a greeting.", "2": "It concerns how courts use past decisions, not physical arrangements.", "3": "It is a principle about legal reasoning, not a document type."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 5, 'What is the philosophical significance of jazz improvisation?',
  '[{"text": "Jazz improvisation embodies spontaneous creative freedom within a structured framework — paralleling philosophical concepts of freedom within order and the nature of authentic self-expression", "correct": true}, {"text": "Jazz has no philosophical significance"}, {"text": "Improvisation means playing random notes"}, {"text": "Jazz is only entertainment"}]',
  'Jazz improvisation requires deep knowledge of harmony, rhythm, and tradition — then the freedom to create something new in the moment. It mirrors philosophical questions about creativity, authenticity, freedom, and the relationship between structure and spontaneity.',
  '{"1": "Jazz has been analyzed by philosophers including Adorno, Cornel West, and many others.", "2": "Improvisation is structured creativity, not randomness — it requires mastery of the form.", "3": "Jazz raises profound questions about individual expression, cultural identity, and artistic freedom."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 5, 'What is the philosophical significance of the "unreliable narrator" device in film?',
  '[{"text": "It forces viewers to question how we construct truth from partial, biased perspectives — raising epistemological questions about the nature of narrative and knowledge", "correct": true}, {"text": "It means the film is poorly made"}, {"text": "It only applies to horror films"}, {"text": "The narrator has a speech impediment"}]',
  'Films like "Rashomon," "Memento," "Fight Club," and "Gone Girl" use unreliable narration to demonstrate that our understanding of events is always mediated by perspective, memory, and bias — a cinematic exploration of epistemological uncertainty.',
  '{"1": "Unreliable narration is a deliberate artistic and philosophical technique.", "2": "It is used across all genres — drama, thriller, comedy, science fiction.", "3": "Unreliability refers to the truthfulness of the narration, not speech quality."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 7, 'What is the "Chinese Room" argument and what does it challenge?',
  '[{"text": "John Searle argued that a program manipulating symbols according to rules cannot understand Chinese — challenging the claim that computation equals consciousness", "correct": true}, {"text": "An argument about Chinese architecture"}, {"text": "A diplomatic negotiation technique"}, {"text": "A type of escape room puzzle"}]',
  'Searle imagined himself in a room following English instructions to manipulate Chinese characters. He produces correct Chinese responses without understanding Chinese — proving that syntax (computation) is not sufficient for semantics (understanding).',
  '{"1": "The Chinese Room is a thought experiment about AI and consciousness, not architecture.", "2": "It concerns philosophy of mind, not diplomacy.", "3": "It is a philosophical argument, not an entertainment concept."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 7, 'What is the paradox of the preface?',
  '[{"text": "An author who justifiably believes each statement in their book is true, yet also reasonably believes the book contains some errors — showing that justified beliefs can be collectively inconsistent", "correct": true}, {"text": "A paradox about book introductions"}, {"text": "A problem with publishing contracts"}, {"text": "A difficulty in writing forewords"}]',
  'David Makinson''s paradox shows that rationality does not require logical consistency across all beliefs. You can justifiably believe each claim while also justifiably believing you''ve made at least one mistake somewhere.',
  '{"1": "The ''preface'' refers to an author''s acknowledgment of fallibility, not the physical preface section.", "2": "It is a philosophical paradox, not a legal issue.", "3": "It concerns the logic of belief, not writing craft."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('ethics', 8, 'What is the "trolley problem" variant known as the "fat man" case and why does it produce different intuitions?',
  '[{"text": "Pushing a fat man off a bridge to stop a trolley feels more wrong than pulling a lever, even though both save five lives — revealing that we distinguish between using someone as a means and redirecting a threat", "correct": true}, {"text": "A problem about obesity"}, {"text": "A weight-lifting challenge"}, {"text": "A dietary recommendation"}]',
  'Judith Jarvis Thomson and others noted that people who pull the lever (redirecting harm) often refuse to push the man (using someone as a tool). This asymmetry supports Kantian ethics over pure consequentialism — we intuitively treat persons as ends.',
  '{"1": "The ''fat man'' label refers to the thought experiment''s setup, not a commentary on weight.", "2": "It is a philosophical thought experiment, not a physical challenge.", "3": "It concerns moral intuitions, not health advice."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 8, 'What is the "paradox of tolerance" identified by Karl Popper?',
  '[{"text": "If a society is tolerant without limit, its ability to be tolerant will eventually be destroyed by the intolerant — therefore, tolerance must not extend to those who seek to destroy tolerance itself", "correct": true}, {"text": "That tolerant people are always paradoxical"}, {"text": "That tolerance is always wrong"}, {"text": "That intolerance is always justified"}]',
  'Popper argued in "The Open Society and Its Enemies" that unlimited tolerance leads to the disappearance of tolerance. A tolerant society must be intolerant of intolerance to survive — but this creates a difficult boundary problem.',
  '{"1": "The paradox is about the limits of tolerance, not about tolerant individuals being paradoxical.", "2": "Popper defended tolerance; he identified a specific logical problem with unlimited tolerance.", "3": "Popper did not justify general intolerance; he argued for a specific exception."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 8, 'What is the relationship between form and content in the philosophy of art?',
  '[{"text": "Form (how something is expressed — structure, style, technique) and content (what is expressed — ideas, emotions, themes) are inseparable — the same content in different form becomes different art", "correct": true}, {"text": "Form is always more important than content"}, {"text": "Content is always more important than form"}, {"text": "Form and content are unrelated"}]',
  'The form-content relationship is central to aesthetics. Hegel argued they are dialectically unified. A sonnet about love and a novel about love express different truths because the form shapes what can be said. You cannot extract the ''meaning'' from its artistic form.',
  '{"1": "Most philosophers argue neither is simply more important; they are interdependent.", "2": "Form and content need each other; pure content without form is not art.", "3": "They are deeply intertwined — changing the form changes the content."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 8, 'What is the difference between Aristotelian magnanimity and Christian humility?',
  '[{"text": "Aristotle''s magnanimous man knows his own worth and claims the honor he deserves; Christian humility demands self-effacement before God — they represent fundamentally opposed views of proper self-regard", "correct": true}, {"text": "They are the same virtue"}, {"text": "Aristotle valued humility"}, {"text": "Christianity values self-assertion"}]',
  'This contrast reveals a deep tension in Western ethics. Aristotle saw proper pride as a crown virtue. Christianity saw humility as essential. Nietzsche used this contrast to critique Christian morality as life-denying.',
  '{"1": "They represent fundamentally different and competing moral ideals.", "2": "Aristotle listed humility-like behavior as a deficiency, not a virtue.", "3": "Mainstream Christian ethics considers pride a deadly sin."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 8, 'What is the difference between Say''s Law and Keynesian economics?',
  '[{"text": "Say''s Law holds that production creates its own demand (supply creates demand); Keynes argued demand can be deficient, causing recessions that require government intervention", "correct": true}, {"text": "They agree on everything"}, {"text": "Say was a Keynesian"}, {"text": "Keynes supported laissez-faire"}]',
  'This debate is foundational to macroeconomics. Say''s Law implies markets self-correct; Keynes argued that aggregate demand can fall short, trapping economies in recession. The philosophical question: can voluntary exchange alone produce prosperity?',
  '{"1": "They represent opposing views on the self-correcting nature of markets.", "2": "Say preceded Keynes by over a century; Keynes specifically criticized Say''s Law.", "3": "Keynes advocated government intervention, the opposite of laissez-faire."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 8, 'What is Ronald Dworkin''s concept of "law as integrity"?',
  '[{"text": "Judges should interpret law as if it were written by a single author pursuing a coherent vision of justice — fitting new decisions into the best moral reading of the legal tradition as a whole", "correct": true}, {"text": "Law should be integrated with other subjects"}, {"text": "Only honest people can be judges"}, {"text": "Law should never change"}]',
  'Dworkin''s "law as integrity" demands that judges treat the legal system as expressing a coherent set of principles. In hard cases, they must find the interpretation that best fits existing law AND presents it in its best moral light.',
  '{"1": "''Integrity'' here means coherent moral vision, not interdisciplinary integration.", "2": "It is about interpretive methodology, not judicial character.", "3": "Law as integrity allows law to develop; it requires consistency, not stasis."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 4, 'What is the philosophical argument for animal rights?',
  '[{"text": "That the capacity to suffer, not species membership, is the morally relevant criterion for moral consideration", "correct": true}, {"text": "Animals should vote"}, {"text": "Animals are more intelligent than humans"}, {"text": "Only pets have rights"}]',
  'Peter Singer''s utilitarianism and Tom Regan''s rights-based approach both argue that species alone cannot determine moral status. If suffering matters morally, then animal suffering matters — a challenge to human-centered ethics.',
  '{"1": "Animal rights concerns moral consideration, not political participation.", "2": "The argument is about suffering, not comparative intelligence.", "3": "The argument applies to all sentient animals, not just domesticated ones."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 5, 'What is the "effective altruism" movement and what philosophy underlies it?',
  '[{"text": "Using evidence and reason to determine the most effective ways to help others — grounded in utilitarian consequentialism and impartial concern for all sentient beings", "correct": true}, {"text": "A type of charity auction"}, {"text": "Volunteering without thinking"}, {"text": "Donating only to local causes"}]',
  'Effective altruism (Singer, MacAskill) applies cost-benefit analysis to charitable giving. It asks: where does a dollar save the most lives or prevent the most suffering? This has philosophical implications about impartiality and moral obligation.',
  '{"1": "It is a philosophical movement, not an event format.", "2": "It emphasizes careful reasoning, not spontaneous action.", "3": "It often prioritizes global causes where impact per dollar is highest."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 6, 'What is the "paradox of tolerance" as applied to free speech policy?',
  '[{"text": "Unlimited free speech may allow the enemies of free speech to destroy it — but restricting speech to protect it risks the very authoritarianism it aims to prevent", "correct": true}, {"text": "That tolerant people cannot speak freely"}, {"text": "That speech has no consequences"}, {"text": "That only intolerant speech is effective"}]',
  'This applied ethics problem has no clean solution. Mill argued truth emerges from open debate. Popper argued intolerance of intolerance is necessary. The tension between these principles shapes every free speech debate.',
  '{"1": "The paradox is about institutional design, not individual behavior.", "2": "Speech has real consequences, which is precisely why the debate exists.", "3": "The paradox concerns all speech, not just intolerant speech."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 6, 'What is the philosophical case for and against genetic enhancement?',
  '[{"text": "Proponents argue it extends human autonomy and well-being; opponents argue it threatens equality, human dignity, and could create a genetic underclass", "correct": true}, {"text": "Everyone agrees it is good"}, {"text": "Everyone agrees it is bad"}, {"text": "It has no ethical implications"}]',
  'Michael Sandel warns about "the ethics of enhancement" — that engineering children undermines the unconditional acceptance that grounds parental love. Transhumanists counter that refusing to prevent suffering when we can is itself immoral.',
  '{"1": "The debate is deeply contested among philosophers.", "2": "Many philosophers and scientists support it under certain conditions.", "3": "Genetic enhancement raises some of the most profound ethical questions of our era."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 7, 'What is the "veil of ignorance" applied to immigration policy?',
  '[{"text": "If you did not know which country you would be born in, you would likely favor more open borders — challenging the moral justification for restricting movement based on birth location", "correct": true}, {"text": "Immigrants should wear veils"}, {"text": "Immigration policy should be random"}, {"text": "The veil of ignorance only applies to domestic policy"}]',
  'Joseph Carens used Rawlsian reasoning to argue that citizenship restrictions are the modern equivalent of feudal privilege — morally arbitrary barriers that ration opportunity based on the accident of birth.',
  '{"1": "The veil is a thought experiment, not a dress code.", "2": "The argument is about moral justification, not randomness.", "3": "Rawlsian reasoning can be applied to any policy domain, including international justice."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 8, 'What is the "mere addition paradox" in population ethics?',
  '[{"text": "Adding people with lives barely worth living seems permissible, but iterating this leads to a vast population with minimal well-being — which seems worse than the original smaller, happier population", "correct": true}, {"text": "A problem with arithmetic"}, {"text": "Adding too many ingredients to a recipe"}, {"text": "A database management issue"}]',
  'Parfit showed that intuitive principles about population lead to contradictions. Each step seems reasonable, but the endpoint is repugnant. No existing moral theory resolves this cleanly — it remains one of philosophy''s hardest problems.',
  '{"1": "It is a philosophical problem about value, not mathematics.", "2": "It concerns population ethics, not cooking.", "3": "It is about moral theory, not information technology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 8, 'What is the philosophical debate about cognitive enhancement drugs?',
  '[{"text": "Whether using drugs to improve focus, memory, or intelligence is a form of cheating that undermines authentic achievement, or a legitimate tool like caffeine or education", "correct": true}, {"text": "Whether drugs should be more expensive"}, {"text": "A debate about drug legalization only"}, {"text": "Whether pharmacists need more training"}]',
  'If we accept caffeine, education, and good nutrition as cognitive enhancers, what makes modafinil or nootropics different? The debate touches on authenticity, fairness, human nature, and what counts as genuine accomplishment.',
  '{"1": "The debate is about ethics and authenticity, not pricing.", "2": "It specifically concerns enhancement, not recreational use or general legalization.", "3": "It concerns philosophy of mind and ethics, not pharmaceutical training."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 9, 'What is the "longtermism" thesis in applied ethics?',
  '[{"text": "That the long-term future of humanity matters enormously, and we should prioritize reducing existential risks even over addressing present suffering, because the potential number of future people dwarfs the current population", "correct": true}, {"text": "That long-term investments are always better"}, {"text": "That planning ahead is good"}, {"text": "That history matters more than the future"}]',
  'William MacAskill and Toby Ord argue that if humanity could survive millions of years, the expected number of future people is astronomically large. Preventing human extinction may therefore be the most important moral priority.',
  '{"1": "Longtermism is a moral thesis about priorities, not an investment strategy.", "2": "It goes far beyond ordinary planning — it argues for radical prioritization of existential risk.", "3": "Longtermism is specifically about the future, not the past."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 9, 'What is the "alignment problem" in AI safety?',
  '[{"text": "The challenge of ensuring that superintelligent AI systems pursue goals that are aligned with human values — a philosophical problem because human values are complex, contradictory, and difficult to formalize", "correct": true}, {"text": "A problem with wheel alignment"}, {"text": "Aligning text in documents"}, {"text": "A military formation problem"}]',
  'Stuart Russell and Nick Bostrom argue that a sufficiently intelligent AI pursuing even slightly misspecified goals could be catastrophic. The alignment problem is fundamentally philosophical: we must articulate human values precisely enough for a machine to follow them.',
  '{"1": "It concerns AI goal structures, not automotive mechanics.", "2": "It is about value alignment between humans and AI, not typography.", "3": "It is about AI safety, not military tactics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 10, 'What is the "experience machine" objection to hedonism and what are its limitations?',
  '[{"text": "Nozick argued our refusal to plug in shows we value reality over pleasure — but critics note this may reflect status quo bias, fear of the unknown, or irrational attachment to ''authenticity'' rather than a genuine insight about value", "correct": true}, {"text": "That experience machines are too expensive"}, {"text": "That the machines do not work"}, {"text": "That pleasure is impossible"}]',
  'Felipe De Brigard''s experiments show that when the question is reversed (would you unplug from a machine you''re already in?), people prefer to stay in — suggesting the intuition may be about familiarity, not philosophical insight about value.',
  '{"1": "The objection is philosophical, not economic.", "2": "The machine is hypothetical and works perfectly by stipulation.", "3": "The thought experiment assumes pleasure is achievable; it questions whether pleasure is sufficient for a good life."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('applied', 10, 'What is the philosophical problem of "moral uncertainty"?',
  '[{"text": "When we are uncertain which moral theory is correct, how should we act? Should we maximize expected moral value across theories, follow the most demanding theory, or default to conventional morality?", "correct": true}, {"text": "Being unsure if you are a good person"}, {"text": "Not knowing the law"}, {"text": "Uncertainty about weather"}]',
  'Will MacAskill''s "Moral Uncertainty" argues that just as we manage empirical uncertainty with probability, we should manage moral uncertainty by weighing our credences in different ethical theories when making decisions.',
  '{"1": "Moral uncertainty is about which theory to follow, not personal moral assessment.", "2": "It concerns ethical theory, not legal knowledge.", "3": "It is about moral reasoning under uncertainty, not empirical uncertainty."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 4, 'What philosophical questions does the concept of "musical genius" raise?',
  '[{"text": "Whether exceptional creativity is innate or developed, whether genius transcends cultural context, and whether we can objectively identify greatness in art", "correct": true}, {"text": "Whether geniuses play louder"}, {"text": "Whether genius is measured by album sales"}, {"text": "Whether only classical musicians can be geniuses"}]',
  'The concept of genius (Kant, Schopenhauer, Nietzsche) raises questions about creativity, originality, and aesthetic judgment. Is Mozart''s genius an objective fact or a cultural construction? Can genius emerge in any genre?',
  '{"1": "Volume has nothing to do with philosophical genius.", "2": "Commercial success does not determine artistic greatness.", "3": "Genius can manifest in any musical tradition — jazz, folk, electronic, etc."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 5, 'What is the philosophical relationship between silence and music?',
  '[{"text": "Silence is not the absence of music but its necessary condition — musical meaning arises from the contrast between sound and silence, tension and resolution", "correct": true}, {"text": "Silence and music are completely unrelated"}, {"text": "Music should never include silence"}, {"text": "Silence is always better than music"}]',
  'Cage''s 4''33" demonstrated that silence is never truly silent — ambient sounds become the music. Heidegger''s concept of clearing (Lichtung) parallels this: meaning emerges from the space between things, not from the things themselves.',
  '{"1": "Silence is integral to musical structure — rests, pauses, and space are essential.", "2": "Great compositions use silence strategically for dramatic and emotional effect.", "3": "The relative value of silence and music is a philosophical question, not a settled fact."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 6, 'How does the concept of "authenticity" in folk and blues music connect to existentialist philosophy?',
  '[{"text": "Both value honest expression rooted in lived experience over polished artifice — the raw, personal voice is valued precisely because it represents genuine being rather than performance", "correct": true}, {"text": "Folk musicians read Sartre"}, {"text": "Existentialism is a type of music"}, {"text": "Blues has no philosophical content"}]',
  'The folk and blues traditions prize what Heidegger called "authenticity" (Eigentlichkeit) — being true to one''s own experience rather than conforming to external expectations. Robert Johnson''s crossroads myth parallels Kierkegaard''s leap of faith.',
  '{"1": "The connection is thematic, not about direct intellectual influence.", "2": "Existentialism is a philosophy that resonates with certain musical traditions.", "3": "Blues is among the most philosophically rich musical traditions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 7, 'What is the philosophical significance of polyrhythm in African musical traditions?',
  '[{"text": "Polyrhythm embodies a worldview where multiple simultaneous truths coexist without contradiction — contrasting with Western music''s tendency toward a single dominant rhythm and resolution", "correct": true}, {"text": "Polyrhythm is random noise"}, {"text": "Only Western music has philosophical significance"}, {"text": "Polyrhythm is a mistake in timing"}]',
  'African polyrhythm reflects a metaphysics of multiplicity — the simultaneous coexistence of different temporal frameworks. This challenges Western binary thinking and has influenced jazz, minimalism, and contemporary philosophy of music.',
  '{"1": "Polyrhythm is highly structured and intentional, not random.", "2": "Every musical tradition carries philosophical implications.", "3": "Polyrhythm requires extraordinary precision in timing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 8, 'What is Susanne Langer''s theory of music as "virtual time"?',
  '[{"text": "Music creates an experience of time that is different from clock time — a virtual temporal order that gives form to human feeling and inner life", "correct": true}, {"text": "Music travels through time"}, {"text": "Musicians are time travelers"}, {"text": "Music should be precisely timed"}]',
  'In "Feeling and Form," Langer argued that music presents a symbol of "the forms of human feeling" — not by representing emotions but by creating temporal structures (tension, release, flow) that mirror the dynamic patterns of our inner life.',
  '{"1": "''Virtual time'' means music creates its own temporal experience, not that it physically moves through time.", "2": "This is a philosophical theory about perception, not literal time travel.", "3": "It concerns the experiential quality of musical time, not metronomic accuracy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 8, 'What is the philosophical debate between "formalism" and "expressionism" in music aesthetics?',
  '[{"text": "Formalism (Hanslick) says music''s beauty lies in its sonic patterns alone; expressionism says music''s value lies in expressing or evoking emotions and ideas beyond pure sound", "correct": true}, {"text": "Formalism means wearing formal attire; expressionism means being expressive"}, {"text": "They agree completely"}, {"text": "Neither is a real position"}]',
  'Eduard Hanslick argued that music is "tonally moving forms" — beautiful in itself, not as a vehicle for emotion. Romantics countered that music''s power lies precisely in its ability to express what words cannot. This debate remains unresolved.',
  '{"1": "These are aesthetic theories, not about dress codes or personality.", "2": "They are fundamentally opposed positions in philosophy of music.", "3": "Both are major positions defended by serious aestheticians."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 9, 'How does Adorno''s analysis of the twelve-tone technique relate to his social philosophy?',
  '[{"text": "Schoenberg''s atonality resists the commodity form by refusing easy consumption — it embodies the negative dialectic by rejecting false reconciliation in art, mirroring the unresolved contradictions of society", "correct": true}, {"text": "Adorno liked twelve-tone music because it sounds nice"}, {"text": "Twelve-tone technique has no social meaning"}, {"text": "Adorno rejected all modern music"}]',
  'For Adorno, Schoenberg''s music is ''true'' because it refuses to provide the false comfort of tonal resolution. In a world of irreconciled suffering, art that sounds harmonious lies. Only music that embodies dissonance tells the truth.',
  '{"1": "Adorno explicitly argued twelve-tone music is difficult and demanding, not conventionally pleasant.", "2": "Adorno saw all art as having social meaning and political implications.", "3": "Adorno championed Schoenberg''s modernism as the most advanced music of its time."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 10, 'What is the philosophical significance of the concept of "Musica Universalis" (Music of the Spheres)?',
  '[{"text": "The ancient idea that the movements of celestial bodies produce a form of music reflecting mathematical harmony — connecting aesthetics, mathematics, and cosmology in a unified vision of reality", "correct": true}, {"text": "A concert series"}, {"text": "A streaming service"}, {"text": "Background music for planetariums"}]',
  'From Pythagoras through Kepler to modern string theory, the idea that reality has a fundamentally musical-mathematical structure has persisted. It represents the deepest aspiration of philosophy: to find unity beneath apparent diversity.',
  '{"1": "Musica Universalis is an ancient philosophical concept, not a modern event.", "2": "It predates all technology by millennia.", "3": "It is a cosmological thesis, not ambient sound design."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 4, 'What philosophical themes does "Blade Runner" explore?',
  '[{"text": "What it means to be human, whether artificial beings can have consciousness and rights, and whether memories define personal identity", "correct": true}, {"text": "How to build robots"}, {"text": "The history of running shoes"}, {"text": "Police procedures"}]',
  'Ridley Scott''s film (1982) directly engages with the problem of other minds, the Turing test, and personal identity through memory. The replicants'' desire for more life raises the question: if they suffer, think, and remember, are they persons?',
  '{"1": "The film uses robots as a vehicle for philosophical questions, not as a technical manual.", "2": "''Blade Runner'' refers to the protagonist''s job, not athletics.", "3": "While it includes detective elements, its core is philosophical."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 5, 'How does "Eternal Sunshine of the Spotless Mind" engage with philosophy of memory?',
  '[{"text": "It asks whether erasing painful memories destroys part of our identity, and whether suffering is a necessary component of love and personal growth", "correct": true}, {"text": "It is about sunshine and weather"}, {"text": "It is a documentary about skincare"}, {"text": "It promotes amnesia as therapy"}]',
  'The film explores Locke''s memory theory of identity: if Joel erases his memories of Clementine, is he still the same person? And the Nietzschean question: should we affirm all of life, including suffering, as necessary for meaning?',
  '{"1": "The title is metaphorical, from Alexander Pope''s poetry.", "2": "It is a philosophical drama, not a beauty product film.", "3": "The film ultimately questions whether erasing memories is desirable."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 6, 'What is the philosophical significance of Hitchcock''s "Rear Window"?',
  '[{"text": "It explores voyeurism, the ethics of surveillance, and how we construct narratives about others from limited observation — a cinematic epistemology experiment", "correct": true}, {"text": "It is about window installation"}, {"text": "It teaches photography"}, {"text": "It is a real estate film"}]',
  'Hitchcock turns the viewer into a voyeur alongside Jeff, raising questions about the ethics of watching, the reliability of perception, and how we project meaning onto the fragments of others'' lives we observe.',
  '{"1": "The ''window'' is a metaphor for cinema itself and the act of watching.", "2": "While photography features in the plot, the film''s themes are epistemological.", "3": "The setting is a vehicle for philosophical themes, not a real estate showcase."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 6, 'How does "Groundhog Day" function as a philosophical allegory?',
  '[{"text": "Phil''s time loop mirrors Nietzsche''s eternal recurrence — he must learn to affirm life and find meaning through self-improvement and genuine connection rather than hedonism or nihilism", "correct": true}, {"text": "It is about weather forecasting"}, {"text": "It is a documentary about groundhogs"}, {"text": "It has no deeper meaning"}]',
  'The film traces Phil from hedonism (exploiting the loop for pleasure) through nihilism (suicide attempts) to genuine virtue (using each day to become better and help others). It dramatizes Kierkegaard''s stages of existence.',
  '{"1": "Weather forecasting is the surface plot; the philosophical journey is the substance.", "2": "The groundhog is a plot device, not the subject.", "3": "It has been analyzed by philosophers, theologians, and Buddhist scholars as a profound allegory."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 7, 'What is the philosophical significance of "slow cinema" (Tarkovsky, Béla Tarr, Tsai Ming-liang)?',
  '[{"text": "By forcing viewers to experience duration and boredom, slow cinema challenges consumerist attention spans and creates space for contemplation about time, existence, and meaning", "correct": true}, {"text": "The directors forgot to edit"}, {"text": "The cameras were broken"}, {"text": "Slow cinema is just bad filmmaking"}]',
  'Slow cinema resists the capitalist demand for constant stimulation. Like Heidegger''s concept of Gelassenheit (releasement), it asks viewers to let go of the desire for action and sit with the experience of being in time.',
  '{"1": "Long takes are deliberate artistic and philosophical choices.", "2": "The pacing is intentional and requires sophisticated cinematography.", "3": "Slow cinema is a respected international movement with serious philosophical foundations."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 8, 'What is the "male gaze" theory in feminist film philosophy?',
  '[{"text": "Laura Mulvey argued that mainstream cinema positions the viewer as a heterosexual male subject, objectifying women through camera work, narrative structure, and visual pleasure", "correct": true}, {"text": "That men watch more movies"}, {"text": "A theory about eye health"}, {"text": "That only men can be cinematographers"}]',
  'Mulvey''s "Visual Pleasure and Narrative Cinema" (1975) used psychoanalytic theory to show how cinema''s visual structures encode patriarchal power relations. This influenced decades of feminist film theory and practice.',
  '{"1": "The theory concerns how cinema constructs the viewing subject, not viewing frequency.", "2": "It is about the politics of representation, not ophthalmology.", "3": "It critiques institutional structures, not individual capabilities."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 9, 'What is Gilles Deleuze''s distinction between the "movement-image" and the "time-image"?',
  '[{"text": "Classical cinema uses movement-images (action-driven, causal narrative); postwar cinema introduced time-images (direct presentations of time through contemplative, non-linear structures)", "correct": true}, {"text": "Moving pictures vs. still photographs"}, {"text": "Fast films vs. slow films"}, {"text": "Color films vs. black and white"}]',
  'In "Cinema 1" and "Cinema 2," Deleuze argued that WWII shattered the action-oriented worldview of classical cinema. Italian neorealism and the French New Wave responded with images that present time directly, rather than subordinating it to action.',
  '{"1": "Both are types of cinematic image, not the difference between motion and stillness.", "2": "The distinction is conceptual, not about pacing alone.", "3": "It concerns the structure of cinematic thought, not technical format."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 10, 'What is the philosophical relationship between cinema and dreaming?',
  '[{"text": "Both involve immersive visual narratives experienced passively in darkness; cinema functions as a collective dream that reveals unconscious desires, fears, and cultural mythologies", "correct": true}, {"text": "Watching films causes sleepiness"}, {"text": "Dreams are always about films"}, {"text": "Cinema replaced dreaming"}]',
  'From Münsterberg through Metz to Žižek, philosophers have analyzed cinema as a dream-machine. Projection in darkness, passive reception, identification with characters, and the suspension of disbelief mirror the structure of dreaming.',
  '{"1": "The comparison is structural and psychological, not about drowsiness.", "2": "Dreams have their own independent content; the comparison is about experiential structure.", "3": "Cinema and dreaming coexist; one did not replace the other."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 4, 'Who said: "The mind is everything. What you think you become"?',
  '[{"text": "Buddha", "correct": true}, {"text": "Socrates"}, {"text": "Confucius"}, {"text": "Lao Tzu"}]',
  'This teaching from the Dhammapada reflects Buddhism''s emphasis on the mind as the source of all experience. It parallels the Stoic insight that our judgments, not external events, determine our well-being.',
  '{"1": "Socrates valued self-examination but this specific teaching is Buddhist.", "2": "Confucius focused on social relations and ritual, not this psychological insight.", "3": "Lao Tzu emphasized naturalness and non-action, a different emphasis from this quote."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 5, 'Who wrote: "The measure of a man is what he does with power"?',
  '[{"text": "Plato", "correct": true}, {"text": "Aristotle"}, {"text": "Thucydides"}, {"text": "Pericles"}]',
  'Plato explored this theme throughout "The Republic" and the "Allegory of the Ring of Gyges" — would a just man remain just if he could act with impunity? Power reveals character because it removes external constraints.',
  '{"1": "Aristotle discussed virtue but this formulation about power is attributed to Plato.", "2": "Thucydides was a historian who recorded similar insights but this is Plato''s.", "3": "Pericles was a statesman; this philosophical observation comes from Plato."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 6, 'Who wrote: "In the depth of winter, I finally learned that within me there lay an invincible summer"?',
  '[{"text": "Albert Camus", "correct": true}, {"text": "Jean-Paul Sartre"}, {"text": "Simone de Beauvoir"}, {"text": "André Gide"}]',
  'Camus wrote this in "Return to Tipasa" (1954). It captures his philosophy of absurdist affirmation — even in the face of a meaningless universe, the human spirit contains an unconquerable capacity for joy and meaning-creation.',
  '{"1": "Sartre''s existentialism was more austere; Camus''s absurdism retained this lyrical affirmation.", "2": "Beauvoir wrote about freedom and oppression but this quote is Camus''s.", "3": "Gide influenced Camus but this specific passage is from Camus''s essay."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 7, 'Who wrote: "Whereof one cannot speak, thereof one must be silent"?',
  '[{"text": "Ludwig Wittgenstein", "correct": true}, {"text": "Bertrand Russell"}, {"text": "G.E. Moore"}, {"text": "Karl Popper"}]',
  'The final proposition of Wittgenstein''s "Tractatus Logico-Philosophicus" (1921). It draws the boundary of meaningful language at the limits of what can be logically pictured, consigning ethics, aesthetics, and metaphysics to silence.',
  '{"1": "Russell was Wittgenstein''s teacher but this line is Wittgenstein''s.", "2": "Moore influenced early analytic philosophy but did not write this.", "3": "Popper was a philosopher of science with different concerns."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 7, 'Who wrote: "The absurd is born of the confrontation between the human need for meaning and the unreasonable silence of the world"?',
  '[{"text": "Albert Camus", "correct": true}, {"text": "Franz Kafka"}, {"text": "Samuel Beckett"}, {"text": "Søren Kierkegaard"}]',
  'Camus defined the absurd in "The Myth of Sisyphus" (1942) as the gap between our desire for meaning and the universe''s refusal to provide it. His response: revolt, freedom, and passion — not suicide or religious hope.',
  '{"1": "Kafka depicted absurdity in fiction but Camus formulated this philosophical definition.", "2": "Beckett dramatized meaninglessness but did not articulate this specific formulation.", "3": "Kierkegaard dealt with absurdity through the ''leap of faith''; Camus rejected that solution."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 8, 'Who wrote: "The most thought-provoking thing in our thought-provoking time is that we are still not thinking"?',
  '[{"text": "Martin Heidegger", "correct": true}, {"text": "Edmund Husserl"}, {"text": "Hannah Arendt"}, {"text": "Hans-Georg Gadamer"}]',
  'Heidegger opened "What Is Called Thinking?" (1951-52) with this provocation. He meant that modern technological society calculates and computes but does not truly think — does not question the meaning of Being.',
  '{"1": "Husserl was Heidegger''s teacher but this quote is from Heidegger''s later work.", "2": "Arendt studied under Heidegger and valued thinking, but this specific formulation is his.", "3": "Gadamer developed hermeneutics but this quote is Heidegger''s."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 8, 'Who wrote: "Freedom is what we do with what is done to us"?',
  '[{"text": "Jean-Paul Sartre", "correct": true}, {"text": "Albert Camus"}, {"text": "Viktor Frankl"}, {"text": "Simone Weil"}]',
  'Sartre''s existentialism insists that even in the most constrained circumstances, we remain free to choose our attitude and response. This echoes Stoic philosophy and anticipates Frankl''s similar insight from the concentration camps.',
  '{"1": "Camus explored freedom through absurdity but this specific formulation is Sartre''s.", "2": "Frankl''s ''Man''s Search for Meaning'' expresses a similar idea but this quote is Sartre''s.", "3": "Weil wrote about affliction and grace but this phrasing is Sartre''s."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 9, 'Who wrote: "Not how the world is, is the mystical, but that it is"?',
  '[{"text": "Ludwig Wittgenstein", "correct": true}, {"text": "Martin Heidegger"}, {"text": "Rudolf Carnap"}, {"text": "Alfred North Whitehead"}]',
  'From the "Tractatus" (proposition 6.44). Wittgenstein distinguishes scientific questions (how the world works) from the mystical (that there is a world at all). This resonates with Heidegger''s fundamental question: "Why is there something rather than nothing?"',
  '{"1": "Heidegger asked a similar question but this specific proposition is Wittgenstein''s.", "2": "Carnap rejected mysticism; Wittgenstein preserved a space for it.", "3": "Whitehead developed process philosophy but this quote is from the Tractatus."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('quotes', 10, 'Who wrote: "What is rational is actual; what is actual is rational"?',
  '[{"text": "G.W.F. Hegel", "correct": true}, {"text": "Immanuel Kant"}, {"text": "Friedrich Schelling"}, {"text": "Johann Fichte"}]',
  'Hegel wrote this in the preface to "Philosophy of Right" (1820). It does not mean everything that exists is good — it means that reason is at work in the actual development of history, and that the rational will ultimately manifest in reality.',
  '{"1": "Kant separated the rational from the actual more sharply; this synthesis is distinctly Hegelian.", "2": "Schelling moved toward nature-philosophy rather than this rational-actual identity.", "3": "Fichte emphasized the ego''s activity rather than the rationality of actuality."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 4, 'What is the philosophical significance of the Emancipation Proclamation?',
  '[{"text": "It applied the Declaration''s principle that all men are created equal to its logical conclusion — extending natural rights to enslaved people and forcing the nation to confront its own founding philosophy", "correct": true}, {"text": "It was only about economics"}, {"text": "It had no philosophical basis"}, {"text": "It was universally popular"}]',
  'Lincoln''s Emancipation Proclamation (1863) was not just a war measure — it was a philosophical act that forced America to either abandon or fulfill its founding ideals. It made the Civil War explicitly about human freedom.',
  '{"1": "While it had economic implications, its philosophical basis was natural rights.", "2": "It drew directly from the philosophical principles of the Declaration of Independence.", "3": "It was deeply controversial and opposed by many, even in the North."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 5, 'How does the concept of "American pragmatism" differ from European philosophy?',
  '[{"text": "Pragmatism (Peirce, James, Dewey) judges ideas by their practical consequences rather than abstract truth — reflecting America''s practical, experimental culture", "correct": true}, {"text": "Americans don''t have philosophy"}, {"text": "Pragmatism means being practical about money"}, {"text": "European and American philosophy are identical"}]',
  'American pragmatism was the first major philosophical movement to originate in the United States. It rejected European rationalism''s quest for absolute certainty in favor of fallibilism, experimentalism, and democratic inquiry.',
  '{"1": "America produced one of the most influential philosophical movements of the modern era.", "2": "Pragmatism is about the practical consequences of IDEAS, not financial practicality.", "3": "They have distinct traditions, methods, and concerns."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 6, 'How does the Second Amendment reflect philosophical debates about the relationship between citizens and the state?',
  '[{"text": "It embodies the Lockean principle that citizens retain the natural right to self-defense, including against government tyranny — the state does not have a monopoly on legitimate force", "correct": true}, {"text": "It has no philosophical basis"}, {"text": "It was about hunting"}, {"text": "It only applies to the military"}]',
  'The founders, having just fought a revolution against a government that tried to disarm them, enshrined the right to bear arms as a philosophical check on state power. It reflects the social contract theory that government serves the people, not the reverse.',
  '{"1": "It is grounded in Enlightenment political philosophy about natural rights.", "2": "While hunting was common, the philosophical purpose was protection against tyranny.", "3": "The Supreme Court has affirmed it as an individual right, not solely a collective military one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 7, 'What is the philosophical tension between Hamilton''s and Jefferson''s visions of America?',
  '[{"text": "Hamilton favored a strong central government, national bank, and industrial economy; Jefferson favored agrarian democracy, states'' rights, and minimal government — a tension between order and liberty that defines American politics", "correct": true}, {"text": "They agreed on everything"}, {"text": "Only Hamilton had a philosophy"}, {"text": "The disagreement was personal, not philosophical"}]',
  'This founding tension reflects deeper philosophical questions: Is concentrated power necessary for national strength (Hamilton), or is dispersed power necessary for individual freedom (Jefferson)? America has oscillated between these poles ever since.',
  '{"1": "Their disagreements were among the most consequential in American history.", "2": "Both were profound political thinkers with distinct philosophical frameworks.", "3": "Their personal rivalry was driven by genuinely different philosophical visions."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 8, 'How does Tocqueville''s analysis of "self-interest rightly understood" relate to American civil society?',
  '[{"text": "Americans solve the tension between self-interest and community by understanding that helping others ultimately serves their own long-term interests — creating voluntary associations that maintain social order without government coercion", "correct": true}, {"text": "Americans are purely selfish"}, {"text": "Tocqueville criticized all self-interest"}, {"text": "Civil society has no philosophical basis"}]',
  'Tocqueville observed that Americans'' practical genius was recognizing that cooperation serves individual interests. This "self-interest rightly understood" produces voluntary associations (churches, clubs, charities) that maintain social bonds without state direction.',
  '{"1": "Tocqueville observed Americans balancing self-interest with voluntary community engagement.", "2": "Tocqueville distinguished enlightened self-interest from narrow selfishness.", "3": "Civil society theory is a rich philosophical tradition from Ferguson through Tocqueville to Putnam."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 9, 'What is the philosophical significance of Martin Luther King Jr.''s concept of "creative tension"?',
  '[{"text": "Nonviolent direct action creates a crisis that forces a community to confront its contradictions — applying Hegelian dialectics to the struggle for justice by making hidden injustice visible and unavoidable", "correct": true}, {"text": "King wanted to create conflict for its own sake"}, {"text": "Creative tension is an art technique"}, {"text": "King rejected all philosophical frameworks"}]',
  'In "Letter from Birmingham Jail," King explicitly invoked Socrates''s gadfly role and the theological concept of creative tension. He argued that just as Socrates provoked Athenians to think, nonviolent protest provokes communities to act justly.',
  '{"1": "King''s nonviolence was strategic and philosophical, aimed at justice, not conflict for its own sake.", "2": "It is a philosophical-political concept, not an artistic one.", "3": "King was deeply versed in philosophy — Hegel, Thoreau, Gandhi, Tillich, Niebuhr."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 10, 'How does the American constitutional concept of "enumerated powers" embody a specific philosophical anthropology?',
  '[{"text": "It assumes that human nature tends toward the abuse of power, so government authority must be explicitly limited to only those powers specifically granted — all other powers remain with the people", "correct": true}, {"text": "It means the government can do anything"}, {"text": "It is a mathematical concept"}, {"text": "It only applies to counting votes"}]',
  'The Tenth Amendment reserves all non-enumerated powers to the states or the people. This reflects the founders'' Calvinist-influenced skepticism about human nature and their Lockean commitment to government by consent within strict limits.',
  '{"1": "Enumerated powers LIMIT government to specific grants of authority.", "2": "It is a constitutional principle, not a mathematical one.", "3": "''Enumerated'' means listed/specified, referring to governmental powers, not vote counting."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 4, 'What is kitsch in aesthetic theory?',
  '[{"text": "Art that exploits easy emotions and avoids genuine confrontation with reality — sentimentality masquerading as depth", "correct": true}, {"text": "A type of kitchen"}, {"text": "Expensive art"}, {"text": "Art made by children"}]',
  'Milan Kundera defined kitsch as "the absolute denial of shit" — the refusal to acknowledge the ugly, difficult, or ambiguous aspects of existence. Kitsch provides false comfort through predetermined emotional responses.',
  '{"1": "Kitsch is an aesthetic concept, not a room type.", "2": "Kitsch is often cheap and mass-produced, not expensive.", "3": "Children''s art is often more honest than kitsch."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 6, 'What is the "death of the author" thesis?',
  '[{"text": "Roland Barthes argued that a text''s meaning is created by the reader, not the author — the author''s intentions and biography are irrelevant to interpretation", "correct": true}, {"text": "That authors die young"}, {"text": "A murder mystery genre"}, {"text": "That books should be anonymous"}]',
  'Barthes''s 1967 essay challenged the Romantic idea of the author as the source of textual meaning. Instead, meaning arises from the reader''s engagement with the text — each reading creates a new work.',
  '{"1": "It is about interpretive authority, not literal death.", "2": "It is a literary theory, not a genre.", "3": "It concerns interpretation, not authorial identity."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 8, 'What is Hegel''s thesis about the "end of art"?',
  '[{"text": "Art was the highest expression of Spirit in ancient Greece, but philosophy has superseded it — art can no longer be the primary vehicle for truth in the modern world", "correct": true}, {"text": "That art stopped being made after Hegel"}, {"text": "That Hegel disliked art"}, {"text": "That only philosophy should exist"}]',
  'Hegel saw art, religion, and philosophy as three stages of Spirit''s self-understanding. Greek sculpture perfectly embodied Spirit, but modern consciousness has become too complex and reflective for art alone — philosophy is now the highest form of truth.',
  '{"1": "Art continues; Hegel meant its role as the highest truth-vehicle has ended.", "2": "Hegel deeply valued art and wrote extensive aesthetic lectures.", "3": "Hegel saw all three — art, religion, philosophy — as necessary; philosophy is simply the culmination."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 9, 'What is Jacques Rancière''s concept of the "distribution of the sensible"?',
  '[{"text": "The system that determines what is visible, sayable, and thinkable in a society — art is political because it can redistribute what can be perceived and who counts as a political subject", "correct": true}, {"text": "A theory about distributing art supplies"}, {"text": "How museums arrange exhibits"}, {"text": "A sensory deprivation technique"}]',
  'Rancière argues that aesthetics and politics share a common root: both concern who gets to be seen and heard. Art disrupts existing perceptual orders, making visible what was invisible — the excluded, the silenced, the unthinkable.',
  '{"1": "It concerns the political structure of perception, not physical art materials.", "2": "It is about social visibility, not gallery curation.", "3": "It concerns what can be perceived, not the removal of sensory input."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 10, 'What is Adorno''s famous claim that "to write poetry after Auschwitz is barbaric"?',
  '[{"text": "Not a literal ban on poetry, but a challenge: after the Holocaust, art must confront the question of whether aesthetic beauty can coexist with the reality of absolute horror without becoming complicit in its concealment", "correct": true}, {"text": "That Adorno banned all poetry"}, {"text": "That poetry caused the Holocaust"}, {"text": "That only prose is acceptable after 1945"}]',
  'Adorno later nuanced this claim, acknowledging that art may be the only adequate response to suffering. But his provocation remains: art that beautifies or harmonizes after Auschwitz risks making horror bearable — and therefore repeatable.',
  '{"1": "Adorno revised and deepened this claim throughout his career.", "2": "The claim is about art''s moral responsibility, not causal blame.", "3": "Adorno valued poetry; he meant that all art must now reckon with historical catastrophe."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 4, 'What was the philosophical impact of World War I?',
  '[{"text": "It shattered Enlightenment optimism about human progress and reason, giving rise to existentialism, absurdism, and the crisis of meaning that defined 20th-century philosophy", "correct": true}, {"text": "It had no philosophical impact"}, {"text": "It proved that progress is inevitable"}, {"text": "It only affected military strategy"}]',
  'The unprecedented destruction of WWI demolished the 19th century''s faith in progress, reason, and civilization. Heidegger, Wittgenstein, and the Vienna Circle all emerged from this crisis; existentialism was born from it.',
  '{"1": "WWI was one of the most philosophically consequential events in modern history.", "2": "It proved the opposite — that ''progress'' could lead to catastrophe.", "3": "Its impact extended far beyond military affairs into every domain of thought."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 6, 'What was the philosophical significance of the Scientific Revolution?',
  '[{"text": "It established empirical observation and mathematical modeling as the primary paths to knowledge, displacing Aristotelian authority and theological dogma", "correct": true}, {"text": "It only affected chemistry"}, {"text": "It had no philosophical consequences"}, {"text": "It proved that religion is wrong"}]',
  'Galileo, Newton, and others demonstrated that nature follows mathematical laws discoverable through experiment. This transformed epistemology (how we know), metaphysics (what reality is), and the relationship between faith and reason.',
  '{"1": "The Scientific Revolution affected all sciences and reshaped philosophy entirely.", "2": "It transformed epistemology, metaphysics, ethics, and political philosophy.", "3": "It challenged certain religious claims but did not ''disprove'' religion as such."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 8, 'What was the significance of the Davos debate between Cassirer and Heidegger (1929)?',
  '[{"text": "It dramatized the conflict between Enlightenment rationalism (Cassirer) and existential-ontological philosophy (Heidegger) — symbolizing the philosophical crisis that preceded the rise of fascism", "correct": true}, {"text": "A debate about skiing"}, {"text": "An economics conference"}, {"text": "A cooking competition"}]',
  'Cassirer defended the Enlightenment legacy of reason, culture, and human freedom. Heidegger challenged the foundations of this tradition, arguing that human finitude and anxiety are more fundamental than reason. The philosophical world split.',
  '{"1": "Davos is a Swiss town, but this was a philosophical confrontation, not a sporting event.", "2": "The Davos debate was philosophical, not economic (the World Economic Forum came later).", "3": "It was one of the most significant philosophical events of the 20th century."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 9, 'What was the philosophical significance of the Port-Royal Logic (1662)?',
  '[{"text": "It was the first modern logic textbook, combining Cartesian epistemology with Aristotelian logic and establishing formal reasoning as essential to clear thinking across all domains", "correct": true}, {"text": "A history of French ports"}, {"text": "A naval training manual"}, {"text": "A guide to wine production"}]',
  'Antoine Arnauld and Pierre Nicole''s "Logic, or the Art of Thinking" shaped education for two centuries. It introduced the distinction between comprehension and extension of terms, anticipating modern predicate logic.',
  '{"1": "Port-Royal was a monastery, not a port; the Logic was a philosophical work.", "2": "It concerned reasoning, not navigation.", "3": "Port-Royal was a center of Jansenist theology and philosophy, not viticulture."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('history', 10, 'What is the philosophical significance of the Axial Age?',
  '[{"text": "Between 800-200 BC, major civilizations independently developed philosophical and religious systems — Socrates, Buddha, Confucius, the Hebrew prophets — suggesting universal features of human moral and intellectual development", "correct": true}, {"text": "A period when axles were invented"}, {"text": "A geological era"}, {"text": "A theory about the Earth''s tilt"}]',
  'Karl Jaspers coined "Axial Age" to describe this extraordinary period when humans across disconnected civilizations began asking the same fundamental questions about morality, meaning, death, and the good life.',
  '{"1": "''Axial'' refers to a pivot point in human consciousness, not mechanical axes.", "2": "It is a concept in philosophy of history, not geology.", "3": "It concerns intellectual history, not astronomy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 4, 'What is the difference between socialism and communism?',
  '[{"text": "Socialism advocates collective or state ownership of the means of production; communism envisions a classless, stateless society where property is communally owned — communism is the ''final stage'' in Marxist theory", "correct": true}, {"text": "They are exactly the same"}, {"text": "Socialism is capitalist"}, {"text": "Communism supports free markets"}]',
  'Marx saw socialism as a transitional phase where the state controls the economy, leading eventually to communism where the state ''withers away.'' In practice, socialist states never reached the communist stage.',
  '{"1": "They share roots but differ in degree and ultimate vision.", "2": "Socialism opposes private ownership of means of production; it is not capitalist.", "3": "Communism envisions the abolition of private property, not free markets."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 6, 'What is "rent-seeking" and why is it philosophically significant?',
  '[{"text": "Using political influence to gain wealth without creating value — lobbying for subsidies, tariffs, or regulations that benefit you at others'' expense", "correct": true}, {"text": "Seeking apartments to rent"}, {"text": "A theory about landlords"}, {"text": "A real estate strategy"}]',
  'Rent-seeking reveals how government power distorts markets. When it''s more profitable to lobby for privileges than to innovate, resources flow from production to political manipulation — corrupting both the economy and the political system.',
  '{"1": "Economic ''rent-seeking'' concerns political privilege, not housing.", "2": "It applies to all forms of political favor-seeking, not just property.", "3": "It is a concept in political economy, not real estate."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 8, 'What is the "Lucas critique" and why does it matter for economic policy?',
  '[{"text": "Robert Lucas argued that economic relationships observed under one policy regime will change when policy changes — because rational agents adjust their behavior to new rules, invalidating predictions based on past data", "correct": true}, {"text": "A film criticism method"}, {"text": "A critique of George Lucas''s films"}, {"text": "A manufacturing quality standard"}]',
  'The Lucas critique (1976) undermined Keynesian macroeconomic models that assumed stable relationships between variables. It showed that policy evaluation requires modeling how people respond to policy changes — transforming macroeconomics.',
  '{"1": "Robert Lucas is an economist, not a film critic.", "2": "Lucas here is economist Robert Lucas, not filmmaker George Lucas.", "3": "It concerns economic methodology, not manufacturing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 9, 'What is the "Mundell-Tobin effect" and how does it relate to monetary neutrality?',
  '[{"text": "Anticipated inflation causes people to shift from money to capital, lowering the real interest rate and increasing investment — showing that money is not neutral even when inflation is expected", "correct": true}, {"text": "A medical condition"}, {"text": "A photography technique"}, {"text": "A weather phenomenon"}]',
  'This effect challenges the classical dichotomy between real and nominal variables. Even fully anticipated inflation changes real behavior — people hold less cash and more capital, affecting the real economy. Money is never truly neutral.',
  '{"1": "It is an economic theory, not a medical condition.", "2": "It concerns monetary economics, not photography.", "3": "It is about inflation, not meteorology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 10, 'What is the "Cambridge capital controversy" and why does it threaten neoclassical economics?',
  '[{"text": "Joan Robinson and Piero Sraffa showed that ''capital'' cannot be measured independently of the rate of profit it is supposed to determine — creating a logical circularity at the foundation of neoclassical distribution theory", "correct": true}, {"text": "A dispute about Cambridge University buildings"}, {"text": "A debate about education policy"}, {"text": "A controversy about British vs. American English"}]',
  'The Cambridge UK economists demonstrated that aggregate capital cannot be coherently defined without already knowing the distribution of income — which is what capital theory was supposed to explain. This exposed a fatal circularity.',
  '{"1": "The controversy concerned the foundations of economic theory, not university property.", "2": "It was about the logical structure of economics, not educational policy.", "3": "''Cambridge'' refers to the universities (Cambridge UK vs. MIT) whose economists debated, not to language."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 4, 'What is the concept of "separation of powers"?',
  '[{"text": "Dividing government into legislative, executive, and judicial branches so that no single branch can accumulate unchecked power", "correct": true}, {"text": "Separating electricity from water"}, {"text": "Dividing a company into departments"}, {"text": "Keeping church and state separate"}]',
  'Montesquieu articulated this principle in "The Spirit of the Laws" (1748). Madison implemented it in the U.S. Constitution, adding checks and balances so each branch can restrain the others.',
  '{"1": "Separation of powers is a constitutional principle, not an engineering one.", "2": "While businesses have divisions, separation of powers is about government structure.", "3": "Church-state separation is a related but distinct principle."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 6, 'What is the philosophical tension between security and liberty?',
  '[{"text": "More security often requires limiting freedoms (surveillance, detention, censorship), while more liberty may increase vulnerability — finding the right balance is a central challenge of political philosophy", "correct": true}, {"text": "There is no tension; security and liberty are identical"}, {"text": "Security always trumps liberty"}, {"text": "Liberty always trumps security"}]',
  'Benjamin Franklin warned against trading liberty for safety. Hobbes argued security is the primary purpose of government. The tension is real and irreducible — every society must negotiate this balance based on its values.',
  '{"1": "They often conflict, requiring difficult trade-offs.", "2": "Neither automatically overrides the other; context matters.", "3": "Both are essential values; the question is how to balance them."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 8, 'What is the "counter-majoritarian difficulty" in constitutional law?',
  '[{"text": "The problem of justifying judicial review — unelected judges overriding the decisions of elected majorities — in a system committed to democratic self-governance", "correct": true}, {"text": "A problem with counting votes"}, {"text": "When the majority is always wrong"}, {"text": "A mathematical paradox"}]',
  'Alexander Bickel named this problem: how can we justify giving unelected judges the power to strike down laws passed by democratic legislatures? Defenders argue rights need protection from majorities; critics call it judicial oligarchy.',
  '{"1": "It concerns the legitimacy of judicial power, not vote counting.", "2": "It does not claim the majority is always wrong, just that they can be constrained.", "3": "It is a constitutional theory problem, not a mathematical one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 9, 'What is the philosophical debate about "originalism vs. living constitutionalism" in its deepest form?',
  '[{"text": "It is ultimately a debate about the nature of legal meaning itself — whether texts have fixed meanings determined at enactment or whether meaning evolves with changing social understandings", "correct": true}, {"text": "A debate about which constitution is older"}, {"text": "Whether to use original or photocopied documents"}, {"text": "A debate about handwriting styles"}]',
  'The originalism debate is really a hermeneutic problem: do texts have objective meanings fixed by authorial intent and original public meaning, or are meanings constituted in the act of interpretation? This is Gadamer vs. Hirsch applied to law.',
  '{"1": "It is about interpretive theory, not the age of documents.", "2": "It concerns how to read legal texts, not physical copies.", "3": "It is about textual meaning, not calligraphy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 10, 'What is the philosophical significance of the Nuremberg Trials for jurisprudence?',
  '[{"text": "They established that ''following orders'' is not a legal defense, that individuals bear moral responsibility for crimes against humanity, and that some laws are so unjust they are not truly law — reviving natural law theory", "correct": true}, {"text": "They only concerned military tactics"}, {"text": "They had no legal significance"}, {"text": "They established that governments can do whatever they want"}]',
  'Nuremberg forced a reckoning between legal positivism (Nazi laws were valid law) and natural law (some acts are crimes regardless of what positive law says). The trials'' legacy shaped international criminal law and human rights doctrine.',
  '{"1": "The trials addressed crimes against humanity, not just military conduct.", "2": "They fundamentally shaped international law and jurisprudence.", "3": "They established the opposite — that government power has moral limits."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 4, 'What is the relationship between virtue and happiness in Greek philosophy?',
  '[{"text": "The Greeks generally held that virtue is necessary for happiness (eudaimonia) — you cannot truly flourish while living viciously, regardless of wealth or pleasure", "correct": true}, {"text": "The Greeks thought virtue and happiness are unrelated"}, {"text": "Only wealth produces happiness"}, {"text": "The Greeks rejected the concept of happiness"}]',
  'Socrates argued that a just person is always happier than an unjust one. Aristotle held that virtue is necessary but not sufficient for happiness — external goods also matter. The Stoics went further: virtue alone guarantees happiness.',
  '{"1": "The connection between virtue and happiness was central to Greek ethics.", "2": "Greek philosophy generally subordinated wealth to virtue as a source of happiness.", "3": "Eudaimonia (flourishing/happiness) was the central concept of Greek ethics."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 6, 'What is the concept of "moral luck" as it applies to virtue?',
  '[{"text": "Whether you can be truly virtuous depends partly on circumstances beyond your control — someone never tested by adversity may have untested virtue that could fail under pressure", "correct": true}, {"text": "That lucky people are more virtuous"}, {"text": "That virtue is random"}, {"text": "A gambling strategy"}]',
  'This challenges virtue ethics: if character is partly shaped by luck (upbringing, circumstances, genetic temperament), can we take full credit for our virtues or blame others for their vices? Aristotle acknowledged fortune''s role in flourishing.',
  '{"1": "Moral luck concerns the role of circumstance in character, not that lucky people are better.", "2": "Virtue is developed through choice and practice, but circumstances affect the opportunities for development.", "3": "It is a philosophical concept, not a strategy."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 8, 'What is the "thick-thin" distinction in virtue concepts?',
  '[{"text": "Thick concepts (courageous, cruel, generous) combine description and evaluation; thin concepts (good, bad, right, wrong) are purely evaluative — this distinction shapes debates about moral objectivity", "correct": true}, {"text": "A theory about body types"}, {"text": "A cooking terminology"}, {"text": "A paper quality measurement"}]',
  'Bernard Williams argued that thick concepts like ''cruel'' or ''brave'' are both descriptive and evaluative — they describe behavior AND judge it. This challenges the fact-value distinction because thick concepts seem to be both factual and moral.',
  '{"1": "It is a meta-ethical distinction, not about physical characteristics.", "2": "It concerns moral language, not culinary arts.", "3": "It is about the nature of evaluative concepts, not materials."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 4, 'What is personal identity? What makes you the same person over time?',
  '[{"text": "Philosophers debate whether identity depends on the soul, the body, psychological continuity (memory and personality), or whether there is no enduring self at all", "correct": true}, {"text": "Your name makes you the same person"}, {"text": "Your fingerprints"}, {"text": "Your social security number"}]',
  'Locke argued memory makes identity. Hume denied a permanent self. Parfit argued personal identity is not what matters — what matters is psychological continuity, which comes in degrees. Buddhism similarly denies a fixed self.',
  '{"1": "Names can change; the philosophical question is deeper.", "2": "Fingerprints identify a body, but personal identity is about the person, not just the body.", "3": "Administrative identifiers are not the philosophical concept of personal identity."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 6, 'What is the "zombie argument" in philosophy of mind?',
  '[{"text": "If we can conceive of a being physically identical to us but lacking consciousness, then consciousness is not reducible to physical properties — challenging physicalism", "correct": true}, {"text": "An argument about horror movies"}, {"text": "A theory about sleep deprivation"}, {"text": "A debate about the undead in folklore"}]',
  'David Chalmers argues that philosophical zombies (p-zombies) are conceivable: beings that behave exactly like us but have no inner experience. If conceivable, consciousness is not logically necessitated by physics — an extra fact is needed.',
  '{"1": "Philosophical zombies are thought experiments, not horror creatures.", "2": "P-zombies are fully functional; the issue is about consciousness, not exhaustion.", "3": "The argument uses ''zombie'' as a technical philosophical term, not the folklore concept."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 8, 'What is the "problem of the many" in metaphysics?',
  '[{"text": "For any ordinary object like a cloud, there are many slightly different collections of particles that equally qualify as ''the cloud'' — so either there are many clouds where we see one, or our concept of individuation is flawed", "correct": true}, {"text": "A problem with overpopulation"}, {"text": "A mathematical counting problem"}, {"text": "A crowd management issue"}]',
  'Peter Unger and others showed that vagueness in object boundaries creates a puzzle: which precise collection of water droplets IS the cloud? Every candidate collection has equal claim. This challenges our basic concept of ''a thing.''',
  '{"1": "It concerns the metaphysics of objects, not population.", "2": "It is a philosophical problem about identity, not arithmetic.", "3": "It concerns the boundaries of objects, not managing people."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('metaphysics', 10, 'What is the "grounding" relation in contemporary metaphysics?',
  '[{"text": "A non-causal explanatory relation where one fact holds IN VIRTUE OF another — moral facts might be grounded in natural facts, mental facts in physical facts, without being reducible to them", "correct": true}, {"text": "Electrical grounding"}, {"text": "Grounding an airplane"}, {"text": "Being punished by parents"}]',
  'Grounding (Fine, Rosen, Schaffer) is the relation that holds when one fact metaphysically depends on another. It offers a middle path between reduction and brute emergence — facts can be explained by more fundamental facts without being identical to them.',
  '{"1": "Philosophical grounding is about explanatory dependence, not electricity.", "2": "It is about metaphysical structure, not aviation.", "3": "It is a technical philosophical concept, not about discipline."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 4, 'What is confirmation bias?',
  '[{"text": "The tendency to seek, interpret, and remember information that confirms pre-existing beliefs while ignoring contradictory evidence", "correct": true}, {"text": "Confirming a hotel reservation"}, {"text": "A bias in confirmation hearings"}, {"text": "A type of religious ceremony"}]',
  'Confirmation bias is one of the most pervasive cognitive biases. Francis Bacon identified it in 1620: "The human understanding, when it has once adopted an opinion, draws all things else to support and agree with it."',
  '{"1": "It is a cognitive bias, not a hospitality procedure.", "2": "It is about reasoning, not political processes.", "3": "It is a psychological phenomenon, not a religious one."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 6, 'What is the "Duhem-Quine thesis"?',
  '[{"text": "Scientific hypotheses cannot be tested in isolation — any test involves background assumptions, so a failed prediction can always be blamed on auxiliary hypotheses rather than the theory itself", "correct": true}, {"text": "A theory about French-American relations"}, {"text": "A cooking method"}, {"text": "A dental procedure"}]',
  'This thesis shows that theory testing is never conclusive. When an experiment fails, we can always save the theory by adjusting assumptions. This underdetermination of theory by evidence has profound implications for scientific methodology.',
  '{"1": "Duhem and Quine are philosophers of science, not diplomats.", "2": "It concerns scientific methodology, not cuisine.", "3": "It is about the logic of testing, not dentistry."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 8, 'What is "epistemic injustice" as defined by Miranda Fricker?',
  '[{"text": "Wronging someone in their capacity as a knower — through testimonial injustice (discounting their testimony due to prejudice) or hermeneutical injustice (lacking concepts to understand their experience)", "correct": true}, {"text": "An unjust grading system"}, {"text": "A courtroom procedural error"}, {"text": "Being wrong about something"}]',
  'Fricker showed that social power structures affect who gets believed and whose experiences get named. A woman reporting harassment in an era without the concept ''sexual harassment'' suffers hermeneutical injustice — she cannot articulate her experience.',
  '{"1": "It concerns social dimensions of knowledge, not academic grading.", "2": "It is broader than legal procedures — it concerns all testimony and understanding.", "3": "It is about being wronged as a knower, not simply being mistaken."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('epistemology', 10, 'What is the "new evil demon problem" for reliabilism?',
  '[{"text": "A subject in a demon world with unreliable perceptual processes can have the same justification as their counterpart in the actual world — challenging reliabilism''s claim that justification requires actually reliable processes", "correct": true}, {"text": "A new horror movie"}, {"text": "A computer virus"}, {"text": "A theory about demonic possession"}]',
  'Cohen and Lehrer showed that if a Cartesian demon deceives your counterpart, their beliefs are equally well justified as yours — they reason identically. But their processes are unreliable. So reliability cannot be what constitutes justification.',
  '{"1": "It is a philosophical thought experiment, not entertainment.", "2": "''Demon'' is used metaphorically, as in Descartes; it has nothing to do with computers.", "3": "It is epistemology, not theology or demonology."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 4, 'What is civil disobedience?',
  '[{"text": "Deliberately breaking an unjust law openly and accepting the legal consequences, to appeal to the conscience of the community and change the law", "correct": true}, {"text": "Any form of protest"}, {"text": "Violent revolution"}, {"text": "Ignoring laws you dislike"}]',
  'Thoreau, Gandhi, and King developed the philosophy of civil disobedience. It requires: (1) targeting an unjust law, (2) acting openly, (3) accepting punishment, and (4) appealing to higher moral principles.',
  '{"1": "Civil disobedience is a specific form of protest with particular philosophical requirements.", "2": "Civil disobedience is nonviolent by definition.", "3": "It requires publicly accepting consequences, not secretly ignoring laws."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 6, 'What is the philosophical concept of "legitimacy" in government?',
  '[{"text": "The moral right to rule — a government is legitimate when it governs with the genuine consent of the governed and respects their fundamental rights", "correct": true}, {"text": "Having a lot of money"}, {"text": "Winning elections by any means"}, {"text": "Being the oldest institution"}]',
  'Locke argued that government derives legitimacy from consent. Weber identified three types: traditional (custom), charismatic (personal authority), and rational-legal (rule of law). Without legitimacy, government is merely organized coercion.',
  '{"1": "Wealth does not confer political legitimacy.", "2": "Fraudulent elections undermine rather than establish legitimacy.", "3": "Age alone does not confer legitimacy; tyrannies can be ancient."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 8, 'What is the "democratic peace thesis" and what are its philosophical implications?',
  '[{"text": "The observation that democracies rarely go to war with each other — suggesting that political institutions shape international behavior and that spreading democracy could reduce conflict", "correct": true}, {"text": "That peace is democratic"}, {"text": "That all democracies are peaceful"}, {"text": "That war is always wrong"}]',
  'Kant predicted in "Perpetual Peace" (1795) that republican governments would avoid war because citizens bear war''s costs. Empirical evidence largely supports this between democracies, though democracies do fight non-democracies.',
  '{"1": "The thesis is about a statistical pattern, not a tautology.", "2": "Democracies do fight wars — just not against each other.", "3": "The thesis does not make a blanket moral claim about all war."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 9, 'What is Jürgen Habermas''s concept of the "public sphere"?',
  '[{"text": "A social space where private individuals come together as a public to discuss matters of common concern, forming public opinion that can hold state power accountable", "correct": true}, {"text": "A public park"}, {"text": "A government building"}, {"text": "A sphere-shaped public monument"}]',
  'Habermas traced the emergence of the bourgeois public sphere in 18th-century coffeehouses and newspapers, where rational-critical debate among citizens created a counterweight to state authority. Its decline through commercialization concerns him.',
  '{"1": "The public sphere is a social concept, not a physical space.", "2": "It is about civil society, not government institutions.", "3": "''Sphere'' is metaphorical, referring to a domain of discourse."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('politics', 10, 'What is Giorgio Agamben''s concept of "bare life" and the "state of exception"?',
  '[{"text": "Sovereign power creates ''bare life'' — human beings stripped of political rights who can be killed without legal consequence — and the ''state of exception'' (emergency powers) tends to become the norm in modern politics", "correct": true}, {"text": "A minimalist lifestyle"}, {"text": "A bare-bones budget"}, {"text": "An exceptional state in geography"}]',
  'Agamben argues that the concentration camp, not the city, is the paradigm of modern politics — a space where law is suspended and human beings are reduced to biological existence without political protection. He traces this logic from Roman law through Guantánamo.',
  '{"1": "''Bare life'' is a political-philosophical concept about the reduction of personhood, not lifestyle.", "2": "It concerns political sovereignty, not finances.", "3": "''State of exception'' refers to emergency powers, not a geographical location."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 5, 'What is the philosophical significance of the Gettysburg Address?',
  '[{"text": "Lincoln redefined America as a nation dedicated to the proposition of equality — transforming the Constitution from a legal compact into a moral commitment", "correct": true}, {"text": "It was about the geography of Gettysburg"}, {"text": "It declared war"}, {"text": "It was a military tactical report"}]',
  'In 272 words, Lincoln transformed the meaning of the Civil War from preserving the Union to fulfilling the Declaration''s promise of equality. He performed a philosophical act: reinterpreting the founding for a new era.',
  '{"1": "The address transcended geography to make a universal philosophical claim.", "2": "War had already been declared years earlier.", "3": "It was a philosophical speech, not a military briefing."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 6, 'What is the concept of "federalism" and what philosophical problem does it solve?',
  '[{"text": "Dividing sovereignty between national and state governments — it solves the problem of governing a large, diverse nation while preserving local self-governance and individual liberty", "correct": true}, {"text": "A type of hat"}, {"text": "Loyalty to the federal government only"}, {"text": "A European concept with no American application"}]',
  'Madison argued that federalism creates multiple centers of power that check each other. Local government handles local affairs; national government handles national ones. Neither can dominate completely.',
  '{"1": "Federalism is a constitutional structure, not an accessory.", "2": "Federalism divides sovereignty; it does not concentrate it in the federal government.", "3": "Federalism is a distinctly American innovation in its constitutional form."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 7, 'How does the American concept of "natural aristocracy" (Jefferson/Adams) differ from hereditary aristocracy?',
  '[{"text": "Natural aristocracy is based on virtue and talent, emerging through merit; hereditary aristocracy is based on birth and blood — America was designed to elevate the former and prevent the latter", "correct": true}, {"text": "They are the same"}, {"text": "America has no concept of aristocracy"}, {"text": "Natural aristocracy means ruling by force of nature"}]',
  'Jefferson and Adams corresponded about whether society naturally produces an elite — and whether that elite should be based on merit (Jefferson) or include wealth and birth (Adams). America''s answer was meritocracy.',
  '{"1": "They represent fundamentally different principles of social organization.", "2": "The founders explicitly discussed and designed institutions around the concept of natural aristocracy.", "3": "It means leadership by the most virtuous and talented, not physical strength."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('american_exceptionalism', 8, 'What is the philosophical basis of judicial review as established in Marbury v. Madison?',
  '[{"text": "Marshall argued that the Constitution is supreme law; any statute that contradicts it is void; and it is the judiciary''s role to say what the law is — grounding judicial review in constitutional supremacy", "correct": true}, {"text": "That judges are always right"}, {"text": "That the president controls the courts"}, {"text": "That Congress cannot pass laws"}]',
  'Judicial review was not explicitly stated in the Constitution. Marshall derived it from the logic of a written constitution as supreme law. If the Constitution limits government, someone must enforce those limits — and that someone is the judiciary.',
  '{"1": "Judicial review means the judiciary interprets the Constitution, not that judges are infallible.", "2": "Judicial review makes the courts independent from the executive.", "3": "Congress can pass laws; judicial review checks whether they are constitutional."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 4, 'What is the philosophical debate about whether photography is art?',
  '[{"text": "Critics argued photography merely copies reality mechanically; defenders argue the photographer''s choices (framing, timing, light) make it a creative act as interpretive as painting", "correct": true}, {"text": "Everyone agrees photography is art"}, {"text": "Photography is always better than painting"}, {"text": "Photography has no aesthetic qualities"}]',
  'Baudelaire dismissed photography as art''s enemy. Benjamin saw it as transforming art''s nature. Sontag analyzed how photography changes our relationship with reality. The debate continues with AI-generated images.',
  '{"1": "The debate has been ongoing since photography''s invention in the 1830s.", "2": "Different media have different aesthetic strengths; neither is simply ''better.''", "3": "Photography raises profound aesthetic questions about reproduction, reality, and authorship."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('aesthetics', 7, 'What is the philosophical distinction between "art" and "craft"?',
  '[{"text": "Traditionally, art expresses ideas and emotions through creative vision; craft produces functional objects through skilled technique — but this boundary has been increasingly challenged", "correct": true}, {"text": "Craft is always inferior to art"}, {"text": "Art requires no skill"}, {"text": "They are completely identical"}]',
  'Collingwood distinguished art (expression) from craft (technique applied to a predetermined end). But movements like Arts and Crafts (Morris), Bauhaus, and contemporary design philosophy challenge this hierarchy.',
  '{"1": "Quality in both art and craft depends on execution and vision.", "2": "Art requires enormous skill; the distinction is about purpose, not ability.", "3": "While they overlap, the traditional distinction reflects real differences in aims."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 6, 'What is the philosophical significance of music notation?',
  '[{"text": "Notation allows music to exist independently of any particular performance, raising questions about the ontology of music — is the ''work'' the score, the performance, or the experience?", "correct": true}, {"text": "Notation makes music louder"}, {"text": "Notation was invented by computers"}, {"text": "Notation is unnecessary for all music"}]',
  'Nelson Goodman analyzed music as an ''allographic'' art (like literature) where the work is defined by a notation system, unlike ''autographic'' arts (painting) where the original object matters. This has implications for authenticity and identity.',
  '{"1": "Notation preserves and transmits music; it does not affect volume.", "2": "Musical notation dates to ancient Greece and medieval Europe, long before computers.", "3": "While oral traditions exist, notation is essential for the Western classical tradition."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('music', 9, 'What is the philosophical debate about whether music can be "true" or "false"?',
  '[{"text": "Formalists deny music can be true or false (it has no propositional content); expressivists argue music can be ''true to'' human experience in ways that propositions cannot capture", "correct": true}, {"text": "Music is always true"}, {"text": "Music is always false"}, {"text": "Truth does not apply to any art"}]',
  'This debate connects music to broader questions about non-propositional truth. Can a Mahler symphony be ''true'' about grief? Heidegger, Adorno, and Langer all argue that art reveals truths inaccessible to language.',
  '{"1": "The question is precisely whether truth-talk applies to music.", "2": "Music neither states truths nor states falsehoods in the ordinary sense.", "3": "Many philosophers argue that truth applies to art in an extended but genuine sense."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 8, 'What is Slavoj Žižek''s approach to cinema as philosophy?',
  '[{"text": "Žižek uses popular films to illustrate Lacanian psychoanalysis and Hegelian dialectics — treating cinema not as mere entertainment but as a site where ideological fantasies become visible and analyzable", "correct": true}, {"text": "Žižek only watches documentaries"}, {"text": "Žižek rejects cinema"}, {"text": "Žižek is a film director"}]',
  'In "The Pervert''s Guide to Cinema" and numerous writings, Žižek demonstrates how films like "The Matrix," "Psycho," and "Aliens" reveal the hidden structures of desire, ideology, and subjectivity that organize everyday life.',
  '{"1": "Žižek analyzes blockbusters, comedies, thrillers — popular cinema, not just documentaries.", "2": "Žižek considers cinema one of the most important philosophical mediums of our time.", "3": "Žižek is a philosopher who analyzes cinema, not a filmmaker."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('cinema', 10, 'What is the philosophical concept of "suture" in film theory?',
  '[{"text": "The process by which cinema ''stitches'' the viewer into the film''s symbolic order — through shot/reverse-shot and point-of-view editing, the viewer unconsciously takes up a subject position within the narrative", "correct": true}, {"text": "A medical procedure shown in films"}, {"text": "Joining film reels together"}, {"text": "A type of special effect"}]',
  'Jean-Pierre Oudart and Daniel Dayan, drawing on Lacan, argued that classical editing techniques create an ideological effect: the viewer is sutured into a position of apparent mastery over the image, concealing the apparatus that constructs that position.',
  '{"1": "Suture in film theory is about the construction of viewing subjectivity, not medical procedures.", "2": "It concerns the psychological effect of editing, not the physical joining of film strips.", "3": "It is a theoretical concept about how cinema positions the viewer, not a visual effect."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 6, 'What is the philosophical concept of "spontaneous order" in economics?',
  '[{"text": "Complex economic coordination emerges from individual choices guided by prices, without any central planner — markets are self-organizing systems that produce order no single mind designed", "correct": true}, {"text": "People spontaneously decide to be orderly"}, {"text": "An economic system without rules"}, {"text": "Random economic activity"}]',
  'Hayek''s central insight: the market order is not designed by anyone, yet it coordinates billions of decisions more effectively than any plan could. Prices transmit information that no central authority could collect or process.',
  '{"1": "Spontaneous order describes an emergent phenomenon, not individual decisions to be orderly.", "2": "Spontaneous order operates within rules (property rights, contracts); it is not lawless.", "3": "It produces order, not randomness — that is precisely the insight."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('economics', 7, 'What is the "Nirvana fallacy" in policy analysis?',
  '[{"text": "Comparing real-world markets (with their imperfections) against an idealized, perfect alternative rather than against realistic alternative institutional arrangements", "correct": true}, {"text": "A Buddhist economic theory"}, {"text": "An investment strategy"}, {"text": "A retirement planning mistake"}]',
  'Harold Demsetz coined this term: critics who point to ''market failure'' often compare real markets against a perfect theoretical alternative, rather than against the realistic alternatives (government intervention, which also has failures).',
  '{"1": "The ''Nirvana'' refers to an unattainable ideal used as an unfair benchmark, not to Buddhism.", "2": "It is about policy reasoning, not financial investing.", "3": "It concerns economic methodology, not retirement."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 6, 'What is "restorative justice" and how does it differ from retributive justice?',
  '[{"text": "Restorative justice focuses on repairing harm through dialogue between victims, offenders, and communities; retributive justice focuses on punishing the offender proportionally to the crime", "correct": true}, {"text": "Restoring old buildings"}, {"text": "A justice system for restaurants"}, {"text": "They are the same approach"}]',
  'Restorative justice draws on indigenous traditions and communitarian philosophy. It asks: what harm was done, and how can it be repaired? Rather than asking: what rule was broken, and what punishment fits?',
  '{"1": "''Restorative'' refers to repairing relationships and harm, not physical restoration.", "2": "It applies to the criminal justice system, not hospitality.", "3": "They represent fundamentally different philosophies of justice."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('law', 7, 'What is the philosophical problem of "victimless crimes"?',
  '[{"text": "Whether the state is justified in punishing behavior that harms no one but the consenting actor — challenging Mill''s harm principle against paternalism and moral legislation", "correct": true}, {"text": "Crimes where the victim cannot be found"}, {"text": "Minor traffic violations"}, {"text": "White-collar crime"}]',
  'Mill argued that society may only restrict liberty to prevent harm to others. Drug use, gambling, and prostitution between consenting adults challenge this: if no one is harmed (or the actor harms only themselves), what justifies criminalization?',
  '{"1": "''Victimless'' means no non-consenting party is harmed, not that the victim is missing.", "2": "Traffic violations have potential victims (other drivers); victimless crimes involve only consenting participants.", "3": "White-collar crime has victims (defrauded parties); victimless crimes by definition do not."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 4, 'What is the vice of cowardice according to Aristotle?',
  '[{"text": "Excessive fear that prevents one from doing what is right — the deficiency opposite of the virtue of courage, which is the mean between cowardice and recklessness", "correct": true}, {"text": "Being physically weak"}, {"text": "Running in a race"}, {"text": "Being quiet"}]',
  'For Aristotle, cowardice is not simply feeling fear (which is natural) but being controlled by fear to the point of failing to act rightly. The coward avoids danger even when honor, duty, or justice demands facing it.',
  '{"1": "Cowardice is a moral failing, not a physical one.", "2": "Running from danger can be prudent; cowardice is fleeing from what you ought to face.", "3": "Quietness is not cowardice; one can be silent and courageous."}');

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES ('virtues', 9, 'What is the "moral psychology" debate about whether virtues are emotions, dispositions, or skills?',
  '[{"text": "Some argue virtues are stable character traits (dispositions), others that they are well-calibrated emotional responses, and others that they are practical skills requiring intelligent responsiveness — each has different implications for moral education", "correct": true}, {"text": "A debate about psychology degrees"}, {"text": "Whether psychologists are virtuous"}, {"text": "A therapy technique"}]',
  'If virtues are dispositions, moral education is about habituation. If emotions, it is about emotional attunement. If skills, it is about practice and feedback. The answer shapes how we think about moral development, blame, and praise.',
  '{"1": "It concerns the nature of virtue, not academic credentials.", "2": "It is about what virtues ARE, not whether specific people have them.", "3": "It is a philosophical debate, not a clinical method."}');

-- Total: 363 questions
