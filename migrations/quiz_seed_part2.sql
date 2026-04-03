-- ============================================================
-- PHILOSIFY QUIZ - Question Seed Data (Part 2)
-- Additional 100+ questions for variety
-- ============================================================

-- ============================================================
-- MORE QUOTES - Famous philosophical statements
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, correct_answer, explanation, wrong_explanations) VALUES

('quotes', 1, 'Who said: "That government is best which governs least"?',
  '[{"id": "a", "text": "Henry David Thoreau"}, {"id": "b", "text": "Thomas Jefferson"}, {"id": "c", "text": "John Adams"}, {"id": "d", "text": "Abraham Lincoln"}]',
  'a',
  'Henry David Thoreau wrote this in "Civil Disobedience" (1849), advocating for minimal government interference in individual lives. He extended the principle further: "That government is best which governs not at all."',
  '{"b": "Jefferson held similar views but didn''t write this specific quote.", "c": "Adams was more in favor of strong federal government.", "d": "Lincoln expanded federal power during the Civil War."}'),

('quotes', 2, 'Who wrote: "The unexamined life is not worth living"?',
  '[{"id": "a", "text": "Plato"}, {"id": "b", "text": "Aristotle"}, {"id": "c", "text": "Socrates"}, {"id": "d", "text": "Epicurus"}]',
  'c',
  'Socrates said this at his trial, as recorded in Plato''s "Apology." He argued that questioning, reasoning, and self-examination are essential to a meaningful human life. He chose death over abandoning philosophy.',
  '{"a": "Plato recorded it, but Socrates spoke these words.", "b": "Aristotle was Plato''s student, coming after Socrates.", "d": "Epicurus focused on pleasure and avoiding pain."}'),

('quotes', 3, 'Who said: "Power tends to corrupt, and absolute power corrupts absolutely"?',
  '[{"id": "a", "text": "Thomas Jefferson"}, {"id": "b", "text": "Lord Acton"}, {"id": "c", "text": "Edmund Burke"}, {"id": "d", "text": "John Stuart Mill"}]',
  'b',
  'Lord Acton wrote this in an 1887 letter to Bishop Mandell Creighton. It warns that concentrated power leads to moral corruption—a key argument for limited government and separation of powers.',
  '{"a": "Jefferson warned about power but didn''t coin this phrase.", "c": "Burke was concerned with tradition and order.", "d": "Mill focused on liberty and utilitarianism."}'),

('quotes', 3, 'Who wrote: "The love of money is the root of all evil"?',
  '[{"id": "a", "text": "Karl Marx"}, {"id": "b", "text": "The Bible (1 Timothy)"}, {"id": "c", "text": "Adam Smith"}, {"id": "d", "text": "Aristotle"}]',
  'b',
  'This is from the Bible (1 Timothy 6:10). Note it says "love of money" not "money itself." The distinction matters: money is a tool; obsession with it to the exclusion of values is the problem. Ayn Rand reinterpreted this as "the love of money is the root of all good" when money represents productive achievement.',
  '{"a": "Marx critiqued capitalism but this quote predates him by millennia.", "c": "Smith analyzed money''s role in economics positively.", "d": "Aristotle wrote about money but not this specific phrase."}'),

('quotes', 4, 'Who said: "Workers of the world, unite! You have nothing to lose but your chains"?',
  '[{"id": "a", "text": "Vladimir Lenin"}, {"id": "b", "text": "Friedrich Engels"}, {"id": "c", "text": "Karl Marx"}, {"id": "d", "text": "Leon Trotsky"}]',
  'c',
  'Marx and Engels wrote this in "The Communist Manifesto" (1848). The call to revolution led to regimes that put workers in actual chains—the USSR, China, Cambodia—killing over 100 million people in the 20th century.',
  '{"a": "Lenin implemented Marx''s ideas but didn''t write the Manifesto.", "b": "Engels co-wrote it but Marx is primarily credited.", "d": "Trotsky came later, during the Russian Revolution."}'),

('quotes', 4, 'Who wrote: "Man is condemned to be free"?',
  '[{"id": "a", "text": "Albert Camus"}, {"id": "b", "text": "Jean-Paul Sartre"}, {"id": "c", "text": "Simone de Beauvoir"}, {"id": "d", "text": "Martin Heidegger"}]',
  'b',
  'Sartre wrote this in "Existentialism Is a Humanism" (1946). While he correctly identified that humans have free will and must choose, calling freedom "condemnation" reveals his view of existence as burden rather than opportunity.',
  '{"a": "Camus was an existentialist but focused on absurdity.", "c": "De Beauvoir was Sartre''s partner and fellow existentialist.", "d": "Heidegger influenced existentialism but didn''t use this phrase."}'),

('quotes', 5, 'Who wrote: "God is dead"?',
  '[{"id": "a", "text": "Charles Darwin"}, {"id": "b", "text": "Friedrich Nietzsche"}, {"id": "c", "text": "Sigmund Freud"}, {"id": "d", "text": "Richard Dawkins"}]',
  'b',
  'Nietzsche wrote this in "The Gay Science" (1882). He wasn''t celebrating but warning: the death of religious belief left a void that could be filled by dangerous ideologies. The 20th century proved him right with communism and fascism.',
  '{"a": "Darwin''s evolution challenged creation accounts but he didn''t make this philosophical declaration.", "c": "Freud analyzed religion psychologically but didn''t use this phrase.", "d": "Dawkins is a modern atheist who came much later."}'),

('quotes', 5, 'Who said: "The only good is knowledge and the only evil is ignorance"?',
  '[{"id": "a", "text": "Plato"}, {"id": "b", "text": "Socrates"}, {"id": "c", "text": "Aristotle"}, {"id": "d", "text": "Confucius"}]',
  'b',
  'Socrates held that knowledge is the key to virtue—that people do wrong out of ignorance, not malice. While this view is incomplete (willful evasion exists), it emphasizes reason''s central role in ethics.',
  '{"a": "Plato developed the theory of Forms but this is Socratic.", "c": "Aristotle balanced intellectual and moral virtues differently.", "d": "Confucius focused on social harmony and ritual."}'),

('quotes', 6, 'Who wrote: "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner"?',
  '[{"id": "a", "text": "David Ricardo"}, {"id": "b", "text": "Adam Smith"}, {"id": "c", "text": "John Locke"}, {"id": "d", "text": "Thomas Malthus"}]',
  'b',
  'Adam Smith wrote this in "The Wealth of Nations" (1776), explaining that self-interest, channeled through free exchange, serves everyone. The butcher serves you not from charity but because you pay him—and both benefit.',
  '{"a": "Ricardo developed comparative advantage but this is Smith.", "c": "Locke focused on natural rights and property.", "d": "Malthus wrote about population, not market exchange."}'),

('quotes', 6, 'Who said: "The philosophers have only interpreted the world; the point is to change it"?',
  '[{"id": "a", "text": "Georg Hegel"}, {"id": "b", "text": "Karl Marx"}, {"id": "c", "text": "Friedrich Engels"}, {"id": "d", "text": "Vladimir Lenin"}]',
  'b',
  'Marx wrote this in his "Theses on Feuerbach" (1845). While action matters, Marx''s dismissal of careful interpretation led to changes that killed millions. Understanding the world correctly BEFORE acting is essential.',
  '{"a": "Hegel was Marx''s philosophical influence but didn''t write this.", "c": "Engels was Marx''s collaborator but this is from Marx''s solo work.", "d": "Lenin applied Marx''s ideas later."}'),

('quotes', 7, 'Who wrote: "To be is to be perceived"?',
  '[{"id": "a", "text": "John Locke"}, {"id": "b", "text": "George Berkeley"}, {"id": "c", "text": "David Hume"}, {"id": "d", "text": "Immanuel Kant"}]',
  'b',
  'Berkeley''s "esse est percipi" denies objective reality—claiming things only exist when perceived. This idealism contradicts the primacy of existence: reality exists independent of perception. When you close your eyes, the world doesn''t vanish.',
  '{"a": "Locke was an empiricist who believed in external reality.", "c": "Hume was a skeptic but didn''t deny external existence this extremely.", "d": "Kant posited things-in-themselves existing beyond perception."}'),

-- ============================================================
-- MORE ETHICS QUESTIONS
-- ============================================================

('ethics', 1, 'What is the opposite of "altruism" in ethics?',
  '[{"id": "a", "text": "Cruelty"}, {"id": "b", "text": "Rational self-interest"}, {"id": "c", "text": "Indifference"}, {"id": "d", "text": "Hedonism"}]',
  'b',
  'Altruism holds that self-sacrifice for others is moral. The opposite is rational self-interest (egoism): pursuing your own life and happiness as your highest purpose. This is NOT cruelty—it includes respecting others'' rights.',
  '{"a": "Cruelty is harming others for its own sake—neither altruistic nor properly selfish.", "c": "Indifference isn''t a moral position—it''s absence of valuation.", "d": "Hedonism seeks pleasure regardless of consequences—not rational self-interest."}'),

('ethics', 2, 'Why is "duty" an invalid moral concept when divorced from values?',
  '[{"id": "a", "text": "Duty is always valid"}, {"id": "b", "text": "Duty without connection to your values is obedience to arbitrary commands"}, {"id": "c", "text": "Duty is the highest virtue"}, {"id": "d", "text": "All duty is religious"}]',
  'b',
  'Kantian "duty" demands action regardless of your values or happiness—obedience for obedience''s sake. But valid morality guides you toward YOUR life and happiness. "Duty" divorced from values is arbitrary commandment without rational basis.',
  '{"a": "Duty needs a purpose—serving your life. Purposeless duty is blind obedience.", "c": "Acting from duty alone ignores why you should act. Purpose comes first.", "d": "Secular duty ethics exist (Kant) but share the same problem."}'),

('ethics', 3, 'What is "moral relativism" and why is it self-refuting?',
  '[{"id": "a", "text": "The view that morality is absolute"}, {"id": "b", "text": "The claim that morality varies by culture, which is itself a universal moral claim"}, {"id": "c", "text": "Relativism is completely valid"}, {"id": "d", "text": "The view that some things are wrong"}]',
  'b',
  'Moral relativism claims there are no universal moral truths—morality is relative to cultures. But this IS a universal claim about morality. If true, it applies to everyone, contradicting itself. It also cannot condemn obvious evils like genocide.',
  '{"a": "That''s moral objectivism, the opposite of relativism.", "c": "Relativism contradicts itself by making an absolute claim about the nature of morality.", "d": "Recognizing that some things are wrong is moral objectivism."}'),

('ethics', 4, 'What is the difference between "intrinsic" and "objective" value?',
  '[{"id": "a", "text": "They are the same"}, {"id": "b", "text": "Intrinsic value exists regardless of any valuer; objective value exists in relation to a valuer''s life"}, {"id": "c", "text": "Intrinsic is subjective"}, {"id": "d", "text": "Objective is arbitrary"}]',
  'b',
  'Intrinsic value claims things are valuable in themselves, regardless of anyone. Objective value recognizes that value exists IN RELATION to a valuer and standard (life). Food is objectively valuable to living beings—but not "intrinsically" valuable in a void.',
  '{"a": "The distinction is crucial. Intrinsic value has no rational basis; objective value does.", "c": "Intrinsic value is supposed to be objective-without-a-subject, which is incoherent.", "d": "Objective value is grounded in the requirements of life—not arbitrary."}'),

('ethics', 5, 'What is "moral luck" and why does it challenge common moral intuitions?',
  '[{"id": "a", "text": "Luck determines morality"}, {"id": "b", "text": "Outcomes we don''t control affect moral judgments of identical actions"}, {"id": "c", "text": "Morality is random"}, {"id": "d", "text": "Lucky people are more moral"}]',
  'b',
  'Moral luck: two drunk drivers, one hits a child, one doesn''t. Same recklessness, different outcomes by luck—yet we judge them differently. This reveals that our moral judgments often include factors beyond the agent''s control, which may be inconsistent.',
  '{"a": "Luck doesn''t determine morality, but it affects our judgments—that''s the puzzle.", "c": "Morality isn''t random, but the outcomes we judge ARE affected by randomness.", "d": "The point isn''t about lucky people being moral but about judging actions vs. outcomes."}'),

('ethics', 6, 'What is the "naturalistic fallacy" according to G.E. Moore?',
  '[{"id": "a", "text": "Believing nature exists"}, {"id": "b", "text": "Defining ''good'' in terms of natural properties like pleasure or survival"}, {"id": "c", "text": "Using logic in ethics"}, {"id": "d", "text": "Studying ethics scientifically"}]',
  'b',
  'Moore argued you can''t define "good" as any natural property (pleasure, survival, etc.) because you can always ask "but is THAT good?" However, this critique doesn''t refute that life is the standard—it questions whether goodness is indefinable.',
  '{"a": "Believing in nature is metaphysics, not ethics.", "c": "Logic is essential to ethics—not a fallacy.", "d": "Scientific study of ethics is metaethics, not a fallacy."}'),

-- ============================================================
-- MORE METAPHYSICS QUESTIONS
-- ============================================================

('metaphysics', 2, 'What is "determinism" in philosophy?',
  '[{"id": "a", "text": "The view that humans have free will"}, {"id": "b", "text": "The view that all events are necessitated by prior causes"}, {"id": "c", "text": "The view that nothing can be known"}, {"id": "d", "text": "The view that reality is subjective"}]',
  'b',
  'Determinism holds that all events, including human choices, are completely determined by prior causes—making free will an illusion. This contradicts the evident fact that humans choose and can be held responsible for choices.',
  '{"a": "That''s libertarian free will, the opposite of determinism.", "c": "That''s skepticism, an epistemological position.", "d": "That''s subjectivism, a different metaphysical error."}'),

('metaphysics', 3, 'What is "dualism" regarding mind and body?',
  '[{"id": "a", "text": "Mind and body are the same thing"}, {"id": "b", "text": "Mind and body are two separate substances"}, {"id": "c", "text": "Only the body exists"}, {"id": "d", "text": "Only the mind exists"}]',
  'b',
  'Cartesian dualism holds that mind (mental substance) and body (physical substance) are distinct. This creates the "interaction problem": how can non-physical mind affect physical body? A better view: consciousness is an activity of the brain, not a separate substance.',
  '{"a": "That would be monism or identity theory.", "c": "That''s eliminative materialism—denying mental states exist.", "d": "That''s idealism—Berkeley''s view."}'),

('metaphysics', 4, 'What is the "problem of universals"?',
  '[{"id": "a", "text": "Whether language is universal"}, {"id": "b", "text": "What makes multiple things the same kind (e.g., what makes all chairs ''chairs'')"}, {"id": "c", "text": "Whether truth is universal"}, {"id": "d", "text": "Whether morality is universal"}]',
  'b',
  'The problem: what makes multiple particular things instances of the same type? What do all chairs share that makes them chairs? Realists say universals exist; nominalists say only particulars exist. Objectivism holds that concepts are valid mental integrations of real similarities.',
  '{"a": "Language universality is a different question.", "c": "Universal truth is epistemology, not this specific problem.", "d": "Moral universality is ethics."}'),

('metaphysics', 5, 'What is "emergence" in philosophy of mind?',
  '[{"id": "a", "text": "Minds emerge from nothing"}, {"id": "b", "text": "Complex properties arise from simpler components in ways not predictable from them"}, {"id": "c", "text": "Consciousness is an illusion"}, {"id": "d", "text": "The mind controls the brain"}]',
  'b',
  'Emergence holds that complex systems exhibit properties not present in their parts—water''s wetness isn''t in hydrogen or oxygen alone. Consciousness may emerge from neural complexity. This explains mind without dualism while respecting its reality.',
  '{"a": "Emergence requires a substrate from which properties emerge.", "c": "Emergence treats consciousness as real, not illusory.", "d": "That would be dualist interactionism."}'),

-- ============================================================
-- MORE POLITICS QUESTIONS
-- ============================================================

('politics', 2, 'What is the difference between "liberty" and "license"?',
  '[{"id": "a", "text": "They are the same"}, {"id": "b", "text": "Liberty is freedom within rights; license is freedom to violate others'' rights"}, {"id": "c", "text": "License is more freedom"}, {"id": "d", "text": "Liberty is government permission"}]',
  'b',
  'Liberty is freedom to act within the bounds of respecting others'' rights. License is doing whatever you want regardless of others'' rights—including robbery, assault, fraud. True liberty is bounded by the non-aggression principle.',
  '{"a": "The distinction is fundamental to understanding proper freedom.", "c": "License is not more freedom—it destroys freedom by allowing violations.", "d": "Liberty precedes government; it''s not a permission."}'),

('politics', 3, 'What is "separation of powers" and why does it matter?',
  '[{"id": "a", "text": "Dividing government among states"}, {"id": "b", "text": "Dividing government into branches so no one holds all power"}, {"id": "c", "text": "Separating church and state"}, {"id": "d", "text": "Dividing the economy from government"}]',
  'b',
  'Separation of powers divides government into legislative, executive, and judicial branches with checks and balances. Each branch limits the others, preventing concentration of power that leads to tyranny. This institutional design protects liberty.',
  '{"a": "That''s federalism—distribution between federal and state governments.", "c": "Church-state separation is a specific application of limited government.", "d": "That''s laissez-faire economics, not separation of powers."}'),

('politics', 4, 'What is "judicial review"?',
  '[{"id": "a", "text": "Judges reviewing their own decisions"}, {"id": "b", "text": "Courts'' power to strike down laws that violate the Constitution"}, {"id": "c", "text": "Congress reviewing judicial appointments"}, {"id": "d", "text": "The President overriding court decisions"}]',
  'b',
  'Judicial review, established in Marbury v. Madison (1803), allows courts to declare laws unconstitutional. This protects individual rights by preventing legislative majorities from violating constitutional limits. It''s a crucial check on democratic excess.',
  '{"a": "That''s appeals process, not judicial review.", "c": "That''s Senate confirmation, not judicial review.", "d": "The executive cannot override courts in a system of separated powers."}'),

('politics', 5, 'Why is "democracy" not the same as "freedom"?',
  '[{"id": "a", "text": "Democracy guarantees freedom"}, {"id": "b", "text": "Democracy is majority rule; freedom requires limits on what majorities can do"}, {"id": "c", "text": "They are identical concepts"}, {"id": "d", "text": "Democracy is more important than freedom"}]',
  'b',
  'Democracy is a method of selecting leaders (majority vote). Freedom is protection of individual rights from violation—including by majorities. A democracy can vote to enslave a minority. Constitutional limits protecting rights make democracy compatible with freedom.',
  '{"a": "Unlimited democracy can vote away rights. Constitutional limits are needed.", "c": "A majority can vote to oppress minorities. Freedom requires limits on majority power.", "d": "Freedom is the value; democracy is a means that must be limited."}'),

('politics', 6, 'What did the Federalist Papers argue?',
  '[{"id": "a", "text": "Against the Constitution"}, {"id": "b", "text": "For ratifying the Constitution with its checks and balances"}, {"id": "c", "text": "For monarchy"}, {"id": "d", "text": "For pure democracy"}]',
  'b',
  'The Federalist Papers (Hamilton, Madison, Jay) argued for ratifying the Constitution, explaining how its structure—separation of powers, federalism, enumerated powers—would protect liberty while enabling effective government.',
  '{"a": "The Anti-Federalists opposed the Constitution; Federalists supported it.", "c": "The Founders had just rejected monarchy in the Revolution.", "d": "The Founders rejected pure democracy as majority tyranny."}'),

-- ============================================================
-- MORE ECONOMICS QUESTIONS
-- ============================================================

('economics', 1, 'What is "supply and demand"?',
  '[{"id": "a", "text": "Government setting prices"}, {"id": "b", "text": "The interaction determining market prices through buyers and sellers"}, {"id": "c", "text": "A company''s internal operations"}, {"id": "d", "text": "The amount of money in circulation"}]',
  'b',
  'Supply and demand describes how prices emerge from the interaction of sellers (supply) and buyers (demand). High demand and low supply raise prices; low demand and high supply lower them. No central authority sets prices—they emerge from individual choices.',
  '{"a": "Government price-setting distorts markets. Prices emerge from supply and demand.", "c": "Internal operations don''t determine market prices.", "d": "Money supply affects inflation, but supply and demand determines relative prices."}'),

('economics', 2, 'What is "comparative advantage"?',
  '[{"id": "a", "text": "Being better at everything"}, {"id": "b", "text": "Specializing in what you do relatively more efficiently, even if not absolutely"}, {"id": "c", "text": "Having more resources"}, {"id": "d", "text": "Government subsidies"}]',
  'b',
  'Even if country A is better at producing EVERYTHING than country B, both benefit from trade if each specializes in what they do RELATIVELY best. This is why trade isn''t zero-sum—specialization increases total production.',
  '{"a": "That''s absolute advantage. Comparative advantage applies even without being best at anything.", "c": "Resources matter, but comparative advantage is about relative efficiency.", "d": "Subsidies distort comparative advantage."}'),

('economics', 3, 'What is "opportunity cost"?',
  '[{"id": "a", "text": "The price you pay for something"}, {"id": "b", "text": "The value of the next-best alternative you gave up"}, {"id": "c", "text": "The cost of missed opportunities in the past"}, {"id": "d", "text": "The cost of lost business"}]',
  'b',
  'Opportunity cost is what you sacrifice by choosing one option over another. If you spend an hour playing games instead of working, the opportunity cost is what you could have earned. Every choice has an opportunity cost.',
  '{"a": "That''s monetary cost. Opportunity cost includes non-monetary alternatives.", "c": "It''s about current choices, not regret over past decisions.", "d": "Lost business is one type, but opportunity cost applies to all decisions."}'),

('economics', 4, 'Why do monopolies tend to form only with government help?',
  '[{"id": "a", "text": "Free markets naturally create monopolies"}, {"id": "b", "text": "Without government barriers, competition and innovation challenge dominant firms"}, {"id": "c", "text": "Monopolies are always good"}, {"id": "d", "text": "Monopolies can''t exist"}]',
  'b',
  'In free markets, dominant firms face constant pressure from competitors and innovators. Government creates durable monopolies through licensing requirements, regulations that favor big companies, patents, and other barriers to entry.',
  '{"a": "Historical examples of long-lasting monopolies nearly all involve government protection.", "c": "Monopolies are problematic when they use government force; natural dominance is challenged by competition.", "d": "Short-term dominance can exist, but persistent monopolies need government barriers."}'),

('economics', 5, 'What is "moral hazard" in economics?',
  '[{"id": "a", "text": "Immoral business practices"}, {"id": "b", "text": "When insurance or bailouts encourage risky behavior by removing consequences"}, {"id": "c", "text": "The danger of too much morality"}, {"id": "d", "text": "Unethical workers"}]',
  'b',
  'Moral hazard: when people are protected from consequences of risk, they take more risks. Bank bailouts encourage reckless lending; unemployment insurance can reduce job-seeking urgency. Protection from consequences changes behavior.',
  '{"a": "It''s not about immorality but about incentive structures.", "c": "It''s not about too much morality but about removing consequences.", "d": "It applies to anyone whose risks are covered by others, not just workers."}'),

('economics', 6, 'What is "Say''s Law"?',
  '[{"id": "a", "text": "Demand creates its own supply"}, {"id": "b", "text": "Production (supply) creates the means to purchase (demand)"}, {"id": "c", "text": "Prices should be fixed by law"}, {"id": "d", "text": "Savings hurt the economy"}]',
  'b',
  'Say''s Law: "Products are paid for with products." Production creates income which creates demand. You can''t have demand without first producing something to trade. This refutes the fallacy that consumption drives the economy—production comes first.',
  '{"a": "That''s the Keynesian reversal of Say''s Law.", "c": "Say advocated free markets, not price controls.", "d": "Savings are deferred consumption that fund investment—they help the economy."}'),

-- ============================================================
-- MORE HISTORY QUESTIONS
-- ============================================================

('history', 3, 'What was the Enlightenment''s core principle?',
  '[{"id": "a", "text": "Faith over reason"}, {"id": "b", "text": "Reason as the primary means of knowledge and progress"}, {"id": "c", "text": "Return to ancient traditions"}, {"id": "d", "text": "Emotional expression"}]',
  'b',
  'The Enlightenment (17th-18th centuries) championed reason, science, individual rights, and progress against tradition, authority, and superstition. It produced the American Revolution, scientific advances, and the philosophical foundations of liberty.',
  '{"a": "The Enlightenment challenged faith-based authority with reason.", "c": "It broke from ancient traditions through rational inquiry.", "d": "Romanticism later emphasized emotion; Enlightenment prioritized reason."}'),

('history', 4, 'Why did Soviet collectivization cause the Ukrainian famine (Holodomor)?',
  '[{"id": "a", "text": "Natural drought"}, {"id": "b", "text": "Seizing grain from productive farmers destroyed agricultural output"}, {"id": "c", "text": "Ukrainians refused to work"}, {"id": "d", "text": "Overpopulation"}]',
  'b',
  'Stalin''s collectivization seized grain and livestock, eliminated productive kulaks, and destroyed incentives to produce. The 1932-33 famine killed 3-7 million Ukrainians. It was a man-made disaster caused by socialist central planning.',
  '{"a": "Weather was not the cause—Soviet policies created the famine.", "c": "Farmers lost incentive to produce because their output was seized.", "d": "Ukraine was the breadbasket of Europe—the problem was policy, not population."}'),

('history', 5, 'What was the "Great Leap Forward" and its consequences?',
  '[{"id": "a", "text": "A successful modernization program"}, {"id": "b", "text": "Mao''s forced industrialization that caused 15-55 million deaths"}, {"id": "c", "text": "China''s economic reforms of the 1980s"}, {"id": "d", "text": "A space program"}]',
  'b',
  'Mao''s Great Leap Forward (1958-1962) forced peasants into communes and steel production, destroying agriculture. The resulting famine killed an estimated 15-55 million people—the deadliest famine in human history, caused by central planning.',
  '{"a": "It was a catastrophic failure that killed tens of millions.", "c": "Deng Xiaoping''s reforms came later and introduced market elements.", "d": "China''s space program came much later."}'),

('history', 6, 'What was the philosophical significance of the Magna Carta (1215)?',
  '[{"id": "a", "text": "It established democracy"}, {"id": "b", "text": "It limited the king''s power and established rule of law principles"}, {"id": "c", "text": "It abolished monarchy"}, {"id": "d", "text": "It established religious freedom"}]',
  'b',
  'The Magna Carta established that even the king is bound by law—a revolutionary principle. It guaranteed due process and property rights. While limited in scope initially, it laid foundations for constitutional government and individual rights.',
  '{"a": "It didn''t establish democracy but limited monarchical power.", "c": "England remained a monarchy; the Magna Carta limited royal power.", "d": "Religious freedom came later; this focused on baronial rights and due process."}'),

('history', 7, 'Why is the printing press philosophically significant?',
  '[{"id": "a", "text": "It made books cheaper"}, {"id": "b", "text": "It enabled widespread distribution of ideas, breaking authority''s control of knowledge"}, {"id": "c", "text": "It employed many workers"}, {"id": "d", "text": "It was invented in America"}]',
  'b',
  'Gutenberg''s printing press (c. 1440) democratized knowledge. Before, authorities controlled information through scarce handwritten texts. Mass-printed books enabled the Reformation, Scientific Revolution, and Enlightenment by spreading ideas beyond institutional control.',
  '{"a": "Cost reduction was the means; challenging authority was the significance.", "c": "Employment is an economic, not philosophical, impact.", "d": "It was invented in Germany, not America."}'),

-- ============================================================
-- MORE APPLIED PHILOSOPHY
-- ============================================================

('applied', 2, 'Why does socialism fail economically?',
  '[{"id": "a", "text": "It hasn''t been tried properly"}, {"id": "b", "text": "Without market prices, planners cannot rationally allocate resources"}, {"id": "c", "text": "It only fails due to foreign intervention"}, {"id": "d", "text": "Socialism succeeds economically"}]',
  'b',
  'Without private property and market prices, central planners cannot know what to produce, how much, or by what methods. Prices signal scarcity and value; socialism destroys these signals. This "calculation problem" (Mises) explains socialist failure.',
  '{"a": "The USSR, China, Cuba, Venezuela, North Korea have all tried it—it always fails.", "c": "Internal economic failure preceded any foreign pressure in most cases.", "d": "Every socialist economy has produced poverty compared to free alternatives."}'),

('applied', 3, 'What is "creative destruction" in economics?',
  '[{"id": "a", "text": "Vandalism of property"}, {"id": "b", "text": "Innovation replacing old industries with new, better ones"}, {"id": "c", "text": "Government destroying competition"}, {"id": "d", "text": "War stimulating the economy"}]',
  'b',
  'Schumpeter''s "creative destruction": new innovations displace old industries. Cars replaced horses; computers replaced typewriters. This process, though painful for displaced workers, drives progress. Blocking it through protection freezes economies in the past.',
  '{"a": "It''s metaphorical—old businesses ''destroyed'' by being outcompeted.", "c": "Government protection prevents creative destruction, harming progress.", "d": "War destroys capital; creative destruction reallocates it to better uses."}'),

('applied', 4, 'Why do high taxes reduce economic growth?',
  '[{"id": "a", "text": "They don''t—taxes help the economy"}, {"id": "b", "text": "They reduce incentives to produce, invest, and take risks"}, {"id": "c", "text": "Only taxes on the poor matter"}, {"id": "d", "text": "Taxes are always too low"}]',
  'b',
  'High taxes reduce the reward for productive activity. If you keep only 40% of additional earnings, your incentive to earn more diminishes. Capital flees to lower-tax jurisdictions; entrepreneurs take fewer risks. Production falls.',
  '{"a": "Economic evidence consistently shows high taxes reduce growth.", "c": "Taxes on anyone reduce incentives for that person to produce.", "d": "The question is what level optimizes liberty and prosperity—not whether taxes are ''enough.''"}'),

('applied', 5, 'What is the "Laffer Curve"?',
  '[{"id": "a", "text": "A funny economic joke"}, {"id": "b", "text": "The relationship showing tax revenue rises then falls as tax rates increase"}, {"id": "c", "text": "A curve showing inflation"}, {"id": "d", "text": "A stock market indicator"}]',
  'b',
  'The Laffer Curve shows that at 0% tax rates, revenue is zero; at 100%, revenue is also zero (no one works). Between these extremes, there''s a rate that maximizes revenue. Beyond it, higher rates reduce revenue as people work less or evade taxes.',
  '{"a": "It''s a serious economic principle, named for economist Arthur Laffer.", "c": "It relates to tax rates and revenue, not inflation.", "d": "It''s about government revenue, not stock markets."}'),

('applied', 6, 'Why is "public choice theory" important?',
  '[{"id": "a", "text": "It proves government is always good"}, {"id": "b", "text": "It analyzes government actors as self-interested like everyone else"}, {"id": "c", "text": "It proves markets always fail"}, {"id": "d", "text": "It''s about voting technology"}]',
  'b',
  'Public choice (Buchanan, Tullock) applies economic reasoning to politics. Politicians, bureaucrats, and voters act on self-interest, not just public good. This explains why government programs serve special interests and persist despite failure.',
  '{"a": "It shows government failure is systematic, not accidental.", "c": "It demonstrates government failure alongside market analysis.", "d": "It''s about incentives in political decisions, not voting machines."}'),

-- ============================================================
-- MORE AMERICAN EXCEPTIONALISM
-- ============================================================

('american_exceptionalism', 2, 'What does "E Pluribus Unum" mean?',
  '[{"id": "a", "text": "In God we trust"}, {"id": "b", "text": "Out of many, one"}, {"id": "c", "text": "Liberty and justice"}, {"id": "d", "text": "Don''t tread on me"}]',
  'b',
  '"E Pluribus Unum" (Out of many, one) was the original U.S. motto. It referred to unity from many states—and later, many peoples united by shared principles of liberty. Unity based on IDEAS, not ethnicity or religion.',
  '{"a": "''In God We Trust'' became the official motto in 1956.", "c": "''Liberty and justice for all'' is from the Pledge of Allegiance.", "d": "''Don''t Tread on Me'' is from the Gadsden Flag."}'),

('american_exceptionalism', 4, 'What is the significance of the Bill of Rights?',
  '[{"id": "a", "text": "It grants rights to citizens"}, {"id": "b", "text": "It explicitly limits government power to protect pre-existing natural rights"}, {"id": "c", "text": "It establishes democracy"}, {"id": "d", "text": "It creates the three branches"}]',
  'b',
  'The Bill of Rights doesn''t grant rights—it forbids government from violating rights that already exist. "Congress shall make no law..." The rights precede government; the amendments limit government power to protect them.',
  '{"a": "Rights aren''t granted by documents—they''re inherent in human nature.", "c": "The main Constitution established the government structure.", "d": "The Constitution''s body creates the branches; the Bill of Rights limits their power."}'),

('american_exceptionalism', 5, 'Why did de Tocqueville admire American civil society?',
  '[{"id": "a", "text": "Strong central government"}, {"id": "b", "text": "Voluntary associations solving problems without government"}, {"id": "c", "text": "Aristocratic traditions"}, {"id": "d", "text": "Religious uniformity"}]',
  'b',
  'In "Democracy in America" (1835), de Tocqueville marveled at how Americans formed voluntary associations to solve problems—schools, hospitals, charities—without waiting for government. This civil society embodied self-governance and individual initiative.',
  '{"a": "He noted America''s decentralized, limited government as a strength.", "c": "America rejected aristocracy in favor of equality before the law.", "d": "America had religious diversity but shared political principles."}'),

-- ============================================================
-- MORE AESTHETICS QUESTIONS
-- ============================================================

('aesthetics', 3, 'What is the difference between "naturalism" and "romanticism" in art?',
  '[{"id": "a", "text": "They are the same"}, {"id": "b", "text": "Naturalism copies reality as-is; romanticism depicts reality as it could and should be"}, {"id": "c", "text": "Naturalism is better"}, {"id": "d", "text": "Romanticism ignores reality"}]',
  'b',
  'Naturalism aims to reproduce reality exactly as observed, including ugliness and meaninglessness. Romanticism selects and integrates elements to present ideals—reality as it could be according to one''s values. Romantic Realism combines both.',
  '{"a": "They represent different approaches to art''s purpose.", "c": "Each has value, but romanticism adds meaning and values to observation.", "d": "Romanticism is selective about reality, not disconnected from it."}'),

('aesthetics', 4, 'Why did Ayn Rand consider Victor Hugo the greatest novelist?',
  '[{"id": "a", "text": "His political views"}, {"id": "b", "text": "His ability to create larger-than-life heroes embodying values"}, {"id": "c", "text": "His complex sentences"}, {"id": "d", "text": "His French nationality"}]',
  'b',
  'Rand admired Hugo''s Romantic method: creating heroic characters like Jean Valjean who embody values and face dramatic moral choices. Hugo projected a benevolent universe where goodness can triumph—art as fuel for living.',
  '{"a": "Rand disagreed with Hugo''s socialism but admired his artistic method.", "c": "Style matters, but Rand emphasized his thematic content and heroic vision.", "d": "Nationality is irrelevant to artistic merit."}'),

('aesthetics', 5, 'What is "kitsch" in aesthetic terms?',
  '[{"id": "a", "text": "High-quality traditional art"}, {"id": "b", "text": "Art that manipulates emotions through clichés without genuine meaning"}, {"id": "c", "text": "Modern abstract art"}, {"id": "d", "text": "Any decorative object"}]',
  'b',
  'Kitsch uses sentimental clichés to trigger easy emotions without genuine artistic content—cute puppies, sunsets, inspirational slogans. It provides emotional gratification without the cognitive content of real art. It''s art as emotional junk food.',
  '{"a": "Traditional art can be excellent or kitsch depending on execution.", "c": "Abstract art may or may not be kitsch—it depends on content.", "d": "Decoration can have genuine aesthetic value or be kitsch."}'),

-- ============================================================
-- MORE CINEMA QUESTIONS
-- ============================================================

('cinema', 2, 'What does "12 Angry Men" (1957) demonstrate about reason and persuasion?',
  '[{"id": "a", "text": "Majority rule is always right"}, {"id": "b", "text": "One rational person can persuade others through evidence and logic"}, {"id": "c", "text": "Emotion is more powerful than reason"}, {"id": "d", "text": "Juries should be eliminated"}]',
  'b',
  'Juror #8 (Henry Fonda) stands alone against 11 others, systematically presenting evidence and raising reasonable doubts. Through rational argument, he persuades the others one by one. It celebrates reason''s power against conformity and prejudice.',
  '{"a": "The film shows the majority was initially wrong due to prejudice and haste.", "c": "Reason ultimately overcomes the emotional reactions of several jurors.", "d": "It celebrates jury deliberation when done properly."}'),

('cinema', 4, 'What does "Wall-E" (2008) philosophically critique?',
  '[{"id": "a", "text": "Environmentalism"}, {"id": "b", "text": "Consumerism leading to passivity and loss of human agency"}, {"id": "c", "text": "Technology in general"}, {"id": "d", "text": "Space exploration"}]',
  'b',
  'Wall-E depicts humans as passive consumers who''ve lost the ability to walk, think, or act independently. While environmentalist themes exist, the deeper critique is of losing human agency to comfort and consumption—becoming less than human.',
  '{"a": "Environmental themes exist but aren''t the deeper message.", "c": "Wall-E himself is a positive portrayal of curiosity and purpose.", "d": "Space is the setting, not the target of critique."}'),

('cinema', 5, 'Why is "The Shawshank Redemption" philosophically powerful?',
  '[{"id": "a", "text": "Its prison setting"}, {"id": "b", "text": "It shows that hope and the human spirit can overcome seemingly impossible circumstances"}, {"id": "c", "text": "Its twist ending"}, {"id": "d", "text": "Its violence"}]',
  'b',
  'Andy Dufresne maintains hope, purpose, and dignity despite unjust imprisonment. He plans methodically, helps others, and ultimately achieves freedom through sustained effort. "Get busy living, or get busy dying" captures the choice between agency and surrender.',
  '{"a": "Prison is the setting; the theme is human agency and hope.", "c": "The ending reinforces the theme; it''s not mere surprise.", "d": "Violence is minimal; the film is about transcending circumstance."}'),

-- ============================================================
-- MORE MUSIC QUESTIONS
-- ============================================================

('music', 2, 'What philosophical value does "Eye of the Tiger" by Survivor celebrate?',
  '[{"id": "a", "text": "Aggression and dominance"}, {"id": "b", "text": "Perseverance, self-discipline, and the will to achieve"}, {"id": "c", "text": "Violence in sports"}, {"id": "d", "text": "Fame and fortune"}]',
  'b',
  'The song celebrates the discipline and determination required to overcome challenges. "Rising up to the challenge of our rival"—it''s about focused effort, training, and will. The tiger is a symbol of controlled power and purpose.',
  '{"a": "It''s about disciplined competition, not aggression.", "c": "Boxing is the context; the theme is broader achievement.", "d": "The goal is victory through effort, not fame."}'),

('music', 4, 'What makes "Bohemian Rhapsody" philosophically interesting?',
  '[{"id": "a", "text": "Its length"}, {"id": "b", "text": "It explores guilt, consequence, and the impossibility of escaping one''s actions"}, {"id": "c", "text": "Its opera section"}, {"id": "d", "text": "Its commercial success"}]',
  'b',
  'The song narrates a man who has committed murder facing the consequences. "Mama, just killed a man... too late, my time has come." It explores guilt, regret, and how actions have inescapable consequences—you cannot undo what you''ve done.',
  '{"a": "Length is structural; the content is philosophically rich.", "c": "The opera section expresses the internal conflict dramatically.", "d": "Success reflects resonance, but the meaning is what makes it significant."}'),

('music', 5, 'Why does "Working Class Hero" by John Lennon contain philosophical contradictions?',
  '[{"id": "a", "text": "It doesn''t—it''s perfectly coherent"}, {"id": "b", "text": "It critiques ''the system'' while Lennon profited enormously from capitalism"}, {"id": "c", "text": "The music contradicts the lyrics"}, {"id": "d", "text": "It''s too short"}]',
  'b',
  'Lennon critiques capitalism and class while being a millionaire rock star. The song decries being "doped with religion and sex and TV" while Lennon used his celebrity to sell records and spread his message through... TV. Action contradicts message.',
  '{"a": "The contradiction between stated views and lived life is notable.", "c": "Musically it''s coherent; the contradiction is ideological.", "d": "Length is irrelevant to ideological consistency."}');
