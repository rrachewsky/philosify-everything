-- ============================================================
-- PHILOSIFY QUIZ - Question Seed Data
-- ============================================================
-- 75+ questions covering:
-- - Philosopher quotes ("Who said this?")
-- - Philosophical concepts and their originators
-- - Historical facts with philosophical implications
-- - Music and cinema philosophical analysis
-- - Core principles: reason, individual rights, virtues, capitalism
-- ============================================================

-- ============================================================
-- QUOTES - "Who said this?" (Category: quotes)
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, correct_answer, explanation, wrong_explanations) VALUES

-- Difficulty 1-2: Famous, well-known quotes
('quotes', 1, 'Who said: "I think, therefore I am"?',
  '[{"id": "a", "text": "René Descartes"}, {"id": "b", "text": "Immanuel Kant"}, {"id": "c", "text": "John Locke"}, {"id": "d", "text": "Plato"}]',
  'a',
  'René Descartes wrote "Cogito, ergo sum" (I think, therefore I am) in his 1637 work "Discourse on the Method." This became the foundational element of Western rationalist philosophy, establishing that the very act of doubting one''s existence proves that one exists as a thinking being.',
  '{"b": "Kant built upon Descartes'' rationalism but is known for the categorical imperative, not this quote.", "c": "Locke was an empiricist who believed knowledge comes from sensory experience, not innate reason.", "d": "Plato lived nearly 2000 years before Descartes and focused on the theory of Forms."}'),

('quotes', 1, 'Who said: "The only thing we have to fear is fear itself"?',
  '[{"id": "a", "text": "Winston Churchill"}, {"id": "b", "text": "Franklin D. Roosevelt"}, {"id": "c", "text": "Theodore Roosevelt"}, {"id": "d", "text": "John F. Kennedy"}]',
  'b',
  'Franklin D. Roosevelt spoke these words in his 1933 inaugural address during the Great Depression. The full quote emphasizes that irrational fear paralyzes action, while courage enables progress.',
  '{"a": "Churchill is famous for ''We shall fight on the beaches'' and ''Blood, toil, tears and sweat''.", "c": "Theodore Roosevelt is known for ''Speak softly and carry a big stick''.", "d": "JFK is remembered for ''Ask not what your country can do for you''"}'),

('quotes', 2, 'Who wrote: "Man is born free, and everywhere he is in chains"?',
  '[{"id": "a", "text": "John Locke"}, {"id": "b", "text": "Thomas Hobbes"}, {"id": "c", "text": "Jean-Jacques Rousseau"}, {"id": "d", "text": "Voltaire"}]',
  'c',
  'Jean-Jacques Rousseau opened "The Social Contract" (1762) with this famous line. While Rousseau identified the problem of lost freedom, his collectivist solution of the "general will" paradoxically justified more chains through democratic tyranny.',
  '{"a": "Locke advocated natural rights and limited government, but this quote is Rousseau''s.", "b": "Hobbes believed man in nature was in a ''war of all against all'' - quite the opposite sentiment.", "d": "Voltaire championed individual liberty and reason but didn''t write this specific line."}'),

('quotes', 2, 'Who said: "A is A"?',
  '[{"id": "a", "text": "Ayn Rand"}, {"id": "b", "text": "Aristotle"}, {"id": "c", "text": "Ludwig Wittgenstein"}, {"id": "d", "text": "Bertrand Russell"}]',
  'b',
  'Aristotle formulated the Law of Identity (A is A) as the foundation of logic. Ayn Rand later made this principle central to Objectivism, emphasizing that existence exists and things are what they are, independent of consciousness.',
  '{"a": "Rand popularized ''A is A'' in modern philosophy but credited Aristotle as its originator.", "c": "Wittgenstein focused on language and meaning, not classical logic.", "d": "Russell worked on mathematical logic but the Law of Identity predates him by millennia."}'),

('quotes', 3, 'Who wrote: "The mind is not a vessel to be filled, but a fire to be kindled"?',
  '[{"id": "a", "text": "Socrates"}, {"id": "b", "text": "Plutarch"}, {"id": "c", "text": "Aristotle"}, {"id": "d", "text": "Seneca"}]',
  'b',
  'Plutarch wrote this in "On Listening to Lectures." It emphasizes that true education isn''t about passively receiving information but actively engaging the mind through reason and curiosity.',
  '{"a": "Socrates used the Socratic method but this quote is from Plutarch.", "c": "Aristotle founded the Lyceum but didn''t write this specific metaphor.", "d": "Seneca was a Stoic philosopher with different educational metaphors."}'),

('quotes', 3, 'Who said: "Give me liberty, or give me death!"?',
  '[{"id": "a", "text": "Thomas Jefferson"}, {"id": "b", "text": "Benjamin Franklin"}, {"id": "c", "text": "Patrick Henry"}, {"id": "d", "text": "George Washington"}]',
  'c',
  'Patrick Henry delivered this famous declaration in 1775, urging Virginia to join the American Revolution. It exemplifies the principle that liberty is so essential to human life that death is preferable to enslavement.',
  '{"a": "Jefferson wrote the Declaration of Independence but didn''t say this.", "b": "Franklin said ''Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither.''", "d": "Washington led the Continental Army but Patrick Henry made this speech."}'),

('quotes', 4, 'Who wrote: "The smallest minority on earth is the individual"?',
  '[{"id": "a", "text": "Friedrich Hayek"}, {"id": "b", "text": "Milton Friedman"}, {"id": "c", "text": "Ayn Rand"}, {"id": "d", "text": "Ludwig von Mises"}]',
  'c',
  'Ayn Rand wrote this to emphasize that individual rights are the foundation of all rights. If you claim to defend minorities but violate individual rights, you contradict yourself at the most fundamental level.',
  '{"a": "Hayek defended individual liberty but this specific quote is Rand''s.", "b": "Friedman advocated free markets but didn''t coin this phrase.", "d": "Mises focused on economic individualism but this is Rand''s formulation."}'),

('quotes', 4, 'Who said: "I disapprove of what you say, but I will defend to the death your right to say it"?',
  '[{"id": "a", "text": "Voltaire"}, {"id": "b", "text": "John Stuart Mill"}, {"id": "c", "text": "Evelyn Beatrice Hall"}, {"id": "d", "text": "Thomas Paine"}]',
  'c',
  'Evelyn Beatrice Hall wrote this in her 1906 biography of Voltaire to summarize his beliefs. It''s often misattributed to Voltaire himself. The principle captures the essence of free speech: defending others'' right to speak even when you disagree.',
  '{"a": "Voltaire championed free speech, but Hall wrote this summary of his views.", "b": "Mill wrote ''On Liberty'' defending free expression but not this exact quote.", "d": "Paine defended liberty in ''Common Sense'' but didn''t write this line."}'),

('quotes', 5, 'Who wrote: "There are two novels that can change a bookish fourteen-year old''s life: The Lord of the Rings and Atlas Shrugged"?',
  '[{"id": "a", "text": "Ayn Rand"}, {"id": "b", "text": "Paul Krugman"}, {"id": "c", "text": "Christopher Hitchens"}, {"id": "d", "text": "William F. Buckley"}]',
  'b',
  'Paul Krugman wrote this, continuing: "One is a childish fantasy that often engenders a lifelong obsession with its unbelievable heroes... The other involves orcs." Despite his hostility, Krugman inadvertently acknowledged Atlas Shrugged''s profound impact on readers.',
  '{"a": "Rand wrote Atlas Shrugged but not this quote about it.", "c": "Hitchens was a contrarian intellectual but didn''t write this.", "d": "Buckley was a conservative commentator who had debates with Rand."}'),

-- Difficulty 5-7: More challenging philosophical quotes
('quotes', 5, 'Who wrote: "He who fights with monsters should look to it that he himself does not become a monster"?',
  '[{"id": "a", "text": "Carl Jung"}, {"id": "b", "text": "Friedrich Nietzsche"}, {"id": "c", "text": "Sigmund Freud"}, {"id": "d", "text": "Arthur Schopenhauer"}]',
  'b',
  'Nietzsche wrote this in "Beyond Good and Evil" (1886). The full quote continues: "And if you gaze long into an abyss, the abyss also gazes into you." It warns that combating evil requires maintaining one''s own moral integrity.',
  '{"a": "Jung studied the shadow self but this quote is Nietzsche''s.", "c": "Freud focused on the unconscious but didn''t write this.", "d": "Schopenhauer influenced Nietzsche but this is from Beyond Good and Evil."}'),

('quotes', 6, 'Who said: "The government that governs best, governs least"?',
  '[{"id": "a", "text": "Thomas Jefferson"}, {"id": "b", "text": "Henry David Thoreau"}, {"id": "c", "text": "John O''Sullivan"}, {"id": "d", "text": "Thomas Paine"}]',
  'c',
  'John O''Sullivan wrote this in 1837 in the United States Magazine and Democratic Review. Thoreau famously quoted and extended it in "Civil Disobedience" (1849). The principle captures the classical liberal view that government power should be minimized.',
  '{"a": "Jefferson held similar views but didn''t coin this phrase.", "b": "Thoreau quoted this but attributed it to ''that government is best which governs least''.", "d": "Paine critiqued government but this specific phrase is O''Sullivan''s."}'),

('quotes', 7, 'Who wrote: "The road to hell is paved with good intentions"?',
  '[{"id": "a", "text": "Saint Bernard of Clairvaux"}, {"id": "b", "text": "Samuel Johnson"}, {"id": "c", "text": "Karl Marx"}, {"id": "d", "text": "John Milton"}]',
  'a',
  'Saint Bernard of Clairvaux (12th century) is credited with the original Latin phrase. It emphasizes that intentions alone are worthless—what matters is the actual consequences of one''s actions. Good intentions combined with bad ideas lead to disaster.',
  '{"b": "Johnson said ''Hell is paved with good intentions'' but Bernard originated the concept.", "c": "Marx had many bad intentions AND bad results.", "d": "Milton wrote Paradise Lost but not this proverb."}'),

-- ============================================================
-- METAPHYSICS - Reality, existence, identity (Category: metaphysics)
-- ============================================================

('metaphysics', 1, 'What does the Law of Identity (A is A) establish?',
  '[{"id": "a", "text": "Things are what they are, regardless of what anyone thinks"}, {"id": "b", "text": "Everything is relative to the observer"}, {"id": "c", "text": "Reality is created by consciousness"}, {"id": "d", "text": "Truth depends on cultural context"}]',
  'a',
  'The Law of Identity establishes that existence exists and that things have a specific nature independent of anyone''s wishes, feelings, or beliefs. A thing is itself (A is A). This is the foundation of objective reality and rational thought.',
  '{"b": "Relativism contradicts the Law of Identity by denying objective reality.", "c": "The primacy of consciousness is the opposite error—reality exists independent of awareness.", "d": "Cultural relativism is a form of subjectivism that denies objective truth."}'),

('metaphysics', 2, 'What is the "primacy of existence" in philosophy?',
  '[{"id": "a", "text": "Consciousness creates reality"}, {"id": "b", "text": "Reality exists independent of consciousness"}, {"id": "c", "text": "Existence and consciousness are equal"}, {"id": "d", "text": "Nothing can be known about reality"}]',
  'b',
  'The primacy of existence holds that reality exists independent of any consciousness. Consciousness does not create reality; it perceives and identifies reality. This is the foundation of objectivity—facts are facts regardless of anyone''s awareness or wishes.',
  '{"a": "This is the ''primacy of consciousness'' fallacy—the idea that wishing makes it so.", "c": "Existence is primary; consciousness is dependent on existence to have something to be conscious OF.", "d": "This is skepticism, which contradicts itself (claiming to know that nothing can be known)."}'),

('metaphysics', 3, 'According to Aristotle, what is the relationship between a thing and its nature?',
  '[{"id": "a", "text": "A thing can act against its nature through willpower"}, {"id": "b", "text": "A thing can only act according to its nature"}, {"id": "c", "text": "Nature is an illusion created by language"}, {"id": "d", "text": "Things have no fixed nature"}]',
  'b',
  'Aristotle established that every entity has a specific identity and can only act according to its nature. A rock cannot decide to fly; water cannot choose to flow uphill. This principle of causality follows from the Law of Identity: things are what they are and act accordingly.',
  '{"a": "Actions against one''s nature are impossible—you can only act within the possibilities your nature allows.", "c": "This is a postmodernist view that Aristotle would reject as self-refuting.", "d": "Denying fixed natures denies identity itself, which is self-contradictory."}'),

('metaphysics', 4, 'What is the philosophical error in saying "reality is whatever you believe it to be"?',
  '[{"id": "a", "text": "It''s not an error—belief shapes reality"}, {"id": "b", "text": "It reverses the relationship between consciousness and existence"}, {"id": "c", "text": "It''s only true for some people"}, {"id": "d", "text": "It''s true but impractical"}]',
  'b',
  'This reverses causality: consciousness does not create existence; it identifies existence. If reality were whatever you believe, contradictory beliefs would create contradictory realities, which is impossible. The fact that you can be wrong proves reality is independent of belief.',
  '{"a": "If belief shaped reality, you could believe yourself into flying. Reality''s independence is proven by the existence of error.", "c": "Truth isn''t selective—the laws of reality apply to everyone equally.", "d": "It''s not impractical—it''s impossible. Contradictions cannot exist."}'),

('metaphysics', 5, 'What does "existence exists" mean as an axiom?',
  '[{"id": "a", "text": "Something had to create existence"}, {"id": "b", "text": "Existence is self-evident and requires no proof"}, {"id": "c", "text": "Existence is an illusion"}, {"id": "d", "text": "We cannot know if existence exists"}]',
  'b',
  'The axiom "existence exists" is self-evident and undeniable. Any attempt to deny it uses existence to make the denial. It requires no proof because all proofs presuppose it. Axioms are the starting points of knowledge, not conclusions derived from prior premises.',
  '{"a": "Asking ''what created existence?'' commits the fallacy of asking for a cause of causality itself.", "c": "Calling existence an illusion presupposes existence to have the illusion.", "d": "Claiming we cannot know IF existence exists is self-refuting—you exist to make the claim."}'),

-- ============================================================
-- EPISTEMOLOGY - Knowledge, reason, truth (Category: epistemology)
-- ============================================================

('epistemology', 1, 'What is the only valid means of gaining knowledge according to rational philosophy?',
  '[{"id": "a", "text": "Faith and revelation"}, {"id": "b", "text": "Reason applied to sensory evidence"}, {"id": "c", "text": "Intuition and emotion"}, {"id": "d", "text": "Authority and tradition"}]',
  'b',
  'Reason—the faculty that identifies and integrates sensory data into concepts—is the only valid means of knowledge. Faith accepts claims without evidence; intuition is unreliable; authority can be wrong. Only reason can validate claims and detect errors.',
  '{"a": "Faith is belief without evidence, which provides no means to distinguish true claims from false ones.", "c": "Intuition and emotion are not tools of cognition—they''re responses to one''s thinking, not substitutes for it.", "d": "Authorities can be wrong. Appeal to authority is a logical fallacy."}'),

('epistemology', 2, 'What is a concept in epistemology?',
  '[{"id": "a", "text": "A feeling about something"}, {"id": "b", "text": "A mental integration of similar things"}, {"id": "c", "text": "An innate idea present from birth"}, {"id": "d", "text": "A social construct with no basis in reality"}]',
  'b',
  'A concept is a mental integration of two or more similar concretes (specific things) into a single mental unit by abstracting their essential characteristics. For example, "chair" integrates all chairs by their essential function: something to sit on.',
  '{"a": "Feelings are emotional responses, not cognitive tools for understanding reality.", "c": "Concepts are not innate—they are formed through a process of abstraction from sensory experience.", "d": "Valid concepts are grounded in reality, not arbitrary social agreements."}'),

('epistemology', 3, 'What is the fallacy of "appeal to authority"?',
  '[{"id": "a", "text": "Accepting a claim because an authority figure said it"}, {"id": "b", "text": "Questioning expert opinions"}, {"id": "c", "text": "Using logic to evaluate claims"}, {"id": "d", "text": "Trusting your own judgment"}]',
  'a',
  'Appeal to authority accepts a claim as true simply because someone important or credentialed said it, rather than evaluating the evidence and logic. Experts can be wrong, biased, or dishonest. The truth of a claim depends on evidence and logic, not on who says it.',
  '{"b": "Questioning experts is actually the antidote to this fallacy—think for yourself.", "c": "Using logic is the proper method, the opposite of this fallacy.", "d": "Trusting your reasoned judgment is proper—it''s blindly trusting others that''s the fallacy."}'),

('epistemology', 4, 'What is the difference between a priori and a posteriori knowledge?',
  '[{"id": "a", "text": "A priori is gained by reason alone; a posteriori requires experience"}, {"id": "b", "text": "They are the same thing"}, {"id": "c", "text": "A priori is emotional; a posteriori is logical"}, {"id": "d", "text": "A priori is uncertain; a posteriori is certain"}]',
  'a',
  'A priori knowledge is gained through reason alone (like mathematics: 2+2=4). A posteriori knowledge requires sensory experience (like knowing fire is hot). Both are valid when properly derived. The distinction is methodological, not about certainty.',
  '{"b": "They describe different methods of gaining knowledge—reason alone vs. experience.", "c": "Neither is emotional—both are cognitive methods. A priori is purely rational.", "d": "Both can be certain when properly validated. Mathematical truths are a priori and certain."}'),

('epistemology', 5, 'What makes a definition "valid" in logic?',
  '[{"id": "a", "text": "It''s agreed upon by most people"}, {"id": "b", "text": "It identifies the essential characteristics that distinguish a concept"}, {"id": "c", "text": "It''s approved by authorities"}, {"id": "d", "text": "It sounds sophisticated"}]',
  'b',
  'A valid definition identifies the genus (broader category) and differentia (essential distinguishing characteristics) of a concept. For example: "Man is a rational animal"—genus: animal; differentia: rational. This ties the concept to reality.',
  '{"a": "Popularity doesn''t determine validity. Most people once believed the earth was flat.", "c": "Authority doesn''t determine truth. Definitions must correspond to reality.", "d": "Sophistication is irrelevant. Clarity and accuracy matter."}'),

-- ============================================================
-- ETHICS - Morality, values, virtues (Category: ethics)
-- ============================================================

('ethics', 1, 'What is the proper standard of moral value according to rational ethics?',
  '[{"id": "a", "text": "What society approves of"}, {"id": "b", "text": "Human life and happiness"}, {"id": "c", "text": "Self-sacrifice for others"}, {"id": "d", "text": "Obedience to authority"}]',
  'b',
  'Human life—one''s own life—is the standard of moral value. Values are that which one acts to gain and keep; life is the fundamental value that makes all other values possible. Morality exists because humans need guidance for living successfully.',
  '{"a": "Society has often approved of slavery, human sacrifice, and genocide. Social approval cannot be the standard.", "c": "Self-sacrifice as a standard is a contradiction: it makes death (the sacrifice of values) the goal of life.", "d": "Obedience to authority requires a standard to judge whether the authority is right or wrong."}'),

('ethics', 2, 'What is the difference between a "hero" and a "martyr" in moral terms?',
  '[{"id": "a", "text": "Heroes succeed; martyrs fail"}, {"id": "b", "text": "Heroes act from reason and self-interest; martyrs sacrifice themselves for faith"}, {"id": "c", "text": "There is no difference"}, {"id": "d", "text": "Martyrs are more moral than heroes"}]',
  'b',
  'A hero risks or gives his life for his highest values—for what makes his life worth living. A martyr sacrifices his values for the sake of sacrifice itself, usually motivated by faith rather than reason. The hero''s action is life-affirming; the martyr''s is life-negating.',
  '{"a": "Success vs. failure misses the essential distinction about motivation and values.", "c": "The distinction is fundamental to understanding morality vs. self-destruction.", "d": "Martyrdom as an ideal glorifies death over life—the opposite of proper morality."}'),

('ethics', 3, 'What is "sacrifice" in proper ethical terms?',
  '[{"id": "a", "text": "Any trade-off between values"}, {"id": "b", "text": "Giving up a greater value for a lesser value"}, {"id": "c", "text": "Helping others"}, {"id": "d", "text": "Working hard for goals"}]',
  'b',
  'Sacrifice means surrendering a greater value for a lesser one (or non-value). Trading a lesser value for a greater one is not sacrifice—it''s a gain. Helping someone you value is not sacrifice. Working hard for your goals is investment, not sacrifice.',
  '{"a": "Not all trade-offs are sacrifices. Trading $5 for food worth more to you than $5 is a gain.", "c": "Helping people you value is not sacrifice—you gain from their wellbeing.", "d": "Working hard for YOUR goals is self-investment, the opposite of sacrifice."}'),

('ethics', 4, 'What is the "trader principle" in ethics?',
  '[{"id": "a", "text": "Always seek to profit at others'' expense"}, {"id": "b", "text": "Exchange value for value with mutual benefit"}, {"id": "c", "text": "Give without expecting anything in return"}, {"id": "d", "text": "Take whatever you can get"}]',
  'b',
  'The trader principle holds that moral people deal with others by voluntary exchange to mutual benefit. Both parties gain value. This applies to all relationships: trade, friendship, love. It rejects both exploitation (taking without giving) and self-sacrifice (giving without receiving).',
  '{"a": "Profit at others'' expense is parasitism, not trading. True profit creates value for both parties.", "c": "Giving without receiving is self-sacrifice, which treats yourself as worthless.", "d": "Taking whatever you can get is theft or mooching—the opposite of honest trade."}'),

('ethics', 5, 'Why is honesty a selfish virtue (in the proper sense)?',
  '[{"id": "a", "text": "Because lying helps you get ahead"}, {"id": "b", "text": "Because reality cannot be faked, and your life depends on dealing with reality"}, {"id": "c", "text": "Because honesty makes others like you"}, {"id": "d", "text": "Because God commands honesty"}]',
  'b',
  'Honesty is selfish because your life depends on understanding and dealing with reality as it is. Faking reality in your own mind makes you unable to navigate existence. The liar must remember his lies while reality remains unchanged—a doomed strategy for living.',
  '{"a": "Lying creates a false reality in your mind while real reality continues unchanged—this is self-destructive.", "c": "While honesty does earn trust, its primary value is epistemic: keeping your mind clear.", "d": "Divine command ethics cannot explain WHY honesty is good—only that someone orders it."}'),

-- ============================================================
-- VIRTUES - The 7 objective virtues (Category: virtues)
-- ============================================================

('virtues', 2, 'What are the seven objective virtues according to Objectivist ethics?',
  '[{"id": "a", "text": "Faith, Hope, Charity, Prudence, Justice, Fortitude, Temperance"}, {"id": "b", "text": "Rationality, Independence, Integrity, Honesty, Justice, Productiveness, Pride"}, {"id": "c", "text": "Courage, Wisdom, Temperance, Justice"}, {"id": "d", "text": "Humility, Obedience, Chastity, Poverty"}]',
  'b',
  'The seven Objectivist virtues are: Rationality (thinking), Independence (self-reliance in thought and action), Integrity (loyalty to rational principles), Honesty (never faking reality), Justice (judging people objectively), Productiveness (creating values), and Pride (moral ambitiousness).',
  '{"a": "These are Christian theological virtues, mixing faith-based and rational elements.", "c": "These are the four cardinal virtues from Plato—important but incomplete.", "d": "These are monastic ''virtues'' that actually negate human life and happiness."}'),

('virtues', 3, 'What is the virtue of "Independence" in ethics?',
  '[{"id": "a", "text": "Never cooperating with others"}, {"id": "b", "text": "Relying on your own judgment and effort as primary"}, {"id": "c", "text": "Rejecting all help from others"}, {"id": "d", "text": "Being physically isolated"}]',
  'b',
  'Independence means accepting responsibility for your own thinking and for forming your own judgments. It doesn''t mean isolation—you can learn from others and cooperate. But YOUR mind must be the final judge of truth, and YOUR effort must be the primary source of your values.',
  '{"a": "Cooperation based on mutual benefit is rational—independence refers to judgment, not isolation.", "c": "Accepting help voluntarily offered is fine; dependence is relying on others as your PRIMARY means.", "d": "Physical isolation is not the point—mental independence in a social context is."}'),

('virtues', 4, 'What is the virtue of "Integrity"?',
  '[{"id": "a", "text": "Following rules without question"}, {"id": "b", "text": "Loyalty to your rational convictions in action"}, {"id": "c", "text": "Agreeing with the majority"}, {"id": "d", "text": "Keeping secrets"}]',
  'b',
  'Integrity is the refusal to permit a breach between what you know and what you do. It means practicing what you preach, living by your rational principles even when it''s difficult. A person with integrity doesn''t betray their values for short-term gains.',
  '{"a": "Following rules without question is obedience, not integrity—you must understand WHY the rules are right.", "c": "Agreeing with the majority is conformity. Integrity often requires standing against the crowd.", "d": "Keeping secrets may or may not be relevant to integrity—it depends on the context."}'),

('virtues', 5, 'What is the virtue of "Pride" in its proper moral sense?',
  '[{"id": "a", "text": "Arrogance and boasting"}, {"id": "b", "text": "Moral ambitiousness—commitment to achieving your highest potential"}, {"id": "c", "text": "Thinking you''re better than others"}, {"id": "d", "text": "Refusing to admit mistakes"}]',
  'b',
  'Pride is moral ambitiousness: the commitment to achieve your highest potential in character and life. It''s earned self-esteem based on real achievements and virtuous action. Pride motivates you to be worthy of your own respect.',
  '{"a": "Arrogance is unearned self-importance. Proper pride is earned through achievement.", "c": "Pride is about YOUR standards for yourself, not comparison to others.", "d": "Refusing to admit mistakes is denial, not pride. Real pride requires honesty about errors to correct them."}'),

('virtues', 6, 'Why is "Productiveness" a moral virtue, not just an economic activity?',
  '[{"id": "a", "text": "Because making money is the highest goal"}, {"id": "b", "text": "Because creating values sustains your life and gives it meaning"}, {"id": "c", "text": "Because society needs workers"}, {"id": "d", "text": "Because idleness is sinful"}]',
  'b',
  'Productiveness is the act of creating the values your life requires. It sustains your physical existence and gives your life purpose and meaning. Productive work is the central purpose around which you organize your life—it''s how humans survive and flourish.',
  '{"a": "Money is a tool, not the goal. The goal is creating real values—products, services, art.", "c": "Society''s needs don''t determine YOUR virtue. You produce for YOUR life and values.", "d": "''Sin'' is a religious concept. Productiveness is good because it serves YOUR life."}'),

-- ============================================================
-- POLITICS - Rights, government, liberty (Category: politics)
-- ============================================================

('politics', 1, 'What is the only proper function of government?',
  '[{"id": "a", "text": "To redistribute wealth"}, {"id": "b", "text": "To protect individual rights"}, {"id": "c", "text": "To promote the common good"}, {"id": "d", "text": "To guide the economy"}]',
  'b',
  'Government exists solely to protect individual rights from violation by force or fraud. This means police (to protect from criminals), military (to protect from foreign threats), and courts (to settle disputes). Any other function exceeds proper government authority.',
  '{"a": "Redistribution violates property rights—taking from some to give to others by force.", "c": "''The common good'' has no definition that doesn''t sacrifice individuals to the collective.", "d": "Government economic guidance is central planning, which violates property rights and fails economically."}'),

('politics', 2, 'What is an "individual right"?',
  '[{"id": "a", "text": "A permission granted by government"}, {"id": "b", "text": "A moral principle defining freedom of action in a social context"}, {"id": "c", "text": "A guarantee of material goods"}, {"id": "d", "text": "What the majority decides"}]',
  'b',
  'Rights are moral principles sanctioning individual freedom of action in a social context. They are not granted by government—they are inherent in human nature (the requirements of human survival). Government''s job is to recognize and protect pre-existing rights.',
  '{"a": "If government grants rights, it can revoke them—making ''rights'' mere permissions. True rights precede government.", "c": "Rights are to freedom of ACTION, not guaranteed outcomes. No one owes you goods.", "d": "Rights protect individuals FROM the majority. Democracy cannot vote away your rights."}'),

('politics', 3, 'What is the "non-initiation of force" principle?',
  '[{"id": "a", "text": "Never use force under any circumstances"}, {"id": "b", "text": "Never initiate force; use it only in retaliation against those who initiate it"}, {"id": "c", "text": "Let the government handle all force"}, {"id": "d", "text": "Force is always justified if you need something"}]',
  'b',
  'The principle holds that initiating physical force against others is evil. However, retaliatory force against those who initiate force is morally proper—it''s self-defense. The distinction is crucial: initiating force violates rights; retaliating protects them.',
  '{"a": "Pacifism is self-destructive. Self-defense against aggressors is moral and necessary.", "c": "Government should have a monopoly on retaliatory force, but the principle applies to everyone.", "d": "Need does not justify force. Needing something doesn''t give you the right to take it by force."}'),

('politics', 4, 'Why is capitalism the only moral economic system?',
  '[{"id": "a", "text": "Because it makes the rich richer"}, {"id": "b", "text": "Because it''s based on voluntary trade and individual rights"}, {"id": "c", "text": "Because government controls the economy wisely"}, {"id": "d", "text": "Because it prioritizes the collective good"}]',
  'b',
  'Capitalism is the only system where all human relationships are voluntary, based on trade to mutual benefit. It bans the initiation of force, protecting individual rights including property rights. Every other system involves forcing some people to serve others.',
  '{"a": "Capitalism benefits everyone through production and trade—it''s not zero-sum.", "c": "Government control is the opposite of capitalism—that''s socialism or fascism.", "d": "Capitalism prioritizes the INDIVIDUAL. The ''collective good'' is a justification for sacrifice."}'),

('politics', 5, 'What is the difference between "positive rights" and "negative rights"?',
  '[{"id": "a", "text": "Positive rights are good; negative rights are bad"}, {"id": "b", "text": "Positive rights require others to provide; negative rights require others to refrain"}, {"id": "c", "text": "They are the same thing"}, {"id": "d", "text": "Positive rights are constitutional; negative rights are not"}]',
  'b',
  'Negative rights (the only true rights) require others to REFRAIN from acting against you—like the right to life (don''t kill me). "Positive rights" claim entitlement to goods others must provide (education, healthcare), which violates the providers'' rights.',
  '{"a": "Negative rights are the only genuine rights. ''Positive rights'' are actually claims on others'' labor.", "c": "They are opposites: one demands action FROM others; one demands non-interference.", "d": "The Constitution originally protected negative rights; positive ''rights'' were added later through misinterpretation."}'),

-- ============================================================
-- ECONOMICS - Free markets, capitalism (Category: economics)
-- ============================================================

('economics', 2, 'What is the "invisible hand" in economics?',
  '[{"id": "a", "text": "Government secretly controlling markets"}, {"id": "b", "text": "The unintended social benefits from individuals pursuing self-interest"}, {"id": "c", "text": "Corporate manipulation of consumers"}, {"id": "d", "text": "Divine intervention in commerce"}]',
  'b',
  'Adam Smith''s "invisible hand" describes how individuals pursuing their own self-interest in free markets unintentionally benefit society. By seeking profit, entrepreneurs create products people want, employ workers, and allocate resources efficiently—without central planning.',
  '{"a": "The invisible hand is the ABSENCE of government control, not secret control.", "c": "In free markets, consumers control producers through their choices—not vice versa.", "d": "It''s a metaphor for emergent order from voluntary exchange, not supernatural intervention."}'),

('economics', 3, 'What is a "win-win" transaction?',
  '[{"id": "a", "text": "When one party tricks the other into thinking they won"}, {"id": "b", "text": "When both parties gain value through voluntary exchange"}, {"id": "c", "text": "When the government ensures fairness"}, {"id": "d", "text": "When profits are shared equally"}]',
  'b',
  'In voluntary exchange, both parties gain value or they wouldn''t trade. If you buy a book for $20, you value the book more than $20; the seller values $20 more than the book. Both win. This is the nature of trade in free markets—mutual benefit.',
  '{"a": "Deception is fraud, not trade. True trade is honest and mutually beneficial.", "c": "Government intervention often creates losers by forcing non-voluntary exchanges.", "d": "Equal division is irrelevant. Both parties gain according to their OWN values."}'),

('economics', 4, 'Why do price controls (like rent control) fail?',
  '[{"id": "a", "text": "They don''t fail—they help the poor"}, {"id": "b", "text": "They create shortages by eliminating profit incentive to supply"}, {"id": "c", "text": "They only fail when set too low"}, {"id": "d", "text": "They fail because greedy landlords evade them"}]',
  'b',
  'Price controls below market rates eliminate the profit motive to produce or supply. With rent control, landlords stop maintaining properties or building new ones. Result: housing shortages, deteriorating quality. The ''cure'' is worse than the disease.',
  '{"a": "Rent control hurts the very people it claims to help by reducing housing supply.", "c": "ANY price below market equilibrium causes shortage; ANY price above causes surplus.", "d": "Landlords respond rationally to incentives. Blaming ''greed'' ignores economic laws."}'),

('economics', 5, 'What is the "broken window fallacy"?',
  '[{"id": "a", "text": "That windows should never be broken"}, {"id": "b", "text": "That destruction creates economic benefit by creating work"}, {"id": "c", "text": "That crime statistics are misleading"}, {"id": "d", "text": "That appearances matter more than substance"}]',
  'b',
  'Frédéric Bastiat exposed this fallacy: people see the glazier employed to fix the broken window (visible), but not what the shopkeeper would have bought instead (invisible). Destruction doesn''t create wealth—it destroys it. The seen benefits hide the unseen losses.',
  '{"a": "The fallacy isn''t about whether to break windows—it''s about the false claim that destruction helps the economy.", "c": "While true, that''s unrelated to Bastiat''s economic fallacy.", "d": "The fallacy is specifically about economic reasoning, not general appearances."}'),

-- ============================================================
-- HISTORY - Historical events with philosophical implications (Category: history)
-- ============================================================

('history', 2, 'Why was the American Revolution philosophically significant?',
  '[{"id": "a", "text": "It was the first revolution"}, {"id": "b", "text": "It established a nation based on individual rights, not group or divine right"}, {"id": "c", "text": "It created a democracy"}, {"id": "d", "text": "It overthrew monarchy for socialism"}]',
  'b',
  'The American Revolution was history''s first nation founded on the principle of individual rights. The Declaration of Independence proclaimed that individuals have unalienable rights to life, liberty, and the pursuit of happiness—and that government exists to protect these rights.',
  '{"a": "Many revolutions preceded it. Its uniqueness was the philosophical basis.", "c": "America is a constitutional republic that protects rights FROM democracy (majority rule).", "d": "The Founders championed limited government and property rights—the opposite of socialism."}'),

('history', 3, 'What philosophical error led to the French Revolution''s Reign of Terror?',
  '[{"id": "a", "text": "Too much individual liberty"}, {"id": "b", "text": "Rousseau''s ''general will'' sacrificing individuals to the collective"}, {"id": "c", "text": "Excessive protection of property rights"}, {"id": "d", "text": "Following the American model too closely"}]',
  'b',
  'Rousseau''s concept of the "general will" held that the collective''s will supersedes individual rights. This justified murdering individuals who opposed the Revolution. Unlike America (individual rights), France (collective rights) descended into tyranny and mass murder.',
  '{"a": "Individual liberty was precisely what was LACKING. The Terror sacrificed individuals to the ''nation.''", "c": "Property was confiscated wholesale. Protection of property rights might have prevented the Terror.", "d": "The French explicitly REJECTED the American model of individual rights."}'),

('history', 4, 'Why did the atomic bombing of Japan actually save lives?',
  '[{"id": "a", "text": "It didn''t—it was purely destructive"}, {"id": "b", "text": "The alternative invasion would have killed millions of Americans and Japanese"}, {"id": "c", "text": "Japan was about to surrender anyway"}, {"id": "d", "text": "It prevented a Soviet invasion"}]',
  'b',
  'Operation Downfall (planned invasion) was projected to cost 500,000-1,000,000 American casualties and millions of Japanese. Japan''s military planned to arm civilians with bamboo spears. The atomic bombs, while devastating, ended the war immediately and saved far more lives than they took.',
  '{"a": "War is destructive, but the alternative was MORE destruction through prolonged invasion.", "c": "Japan''s military rejected surrender even AFTER the first bomb. They planned to fight to the last.", "d": "While a factor, the primary calculation was American and Japanese lives saved vs. invasion."}'),

('history', 5, 'What was the philosophical cause of the 20th century''s unprecedented mass murders?',
  '[{"id": "a", "text": "Technology—better weapons enabled more killing"}, {"id": "b", "text": "Collectivism—ideologies that sacrificed individuals to groups"}, {"id": "c", "text": "Capitalism''s excesses"}, {"id": "d", "text": "Religious extremism"}]',
  'b',
  'The 20th century''s ~100 million murders by governments (USSR, China, Nazi Germany, Cambodia) all stemmed from collectivist ideologies: communism, fascism, and socialism. Each sacrificed individuals to the "collective good"—the state, the race, or the class.',
  '{"a": "Technology was the means, not the cause. The same technology didn''t cause mass murder in free countries.", "c": "The worst atrocities occurred in anti-capitalist regimes (USSR, China, Cambodia).", "d": "While some religious violence occurred, the mega-deaths were from secular collectivist ideologies."}'),

('history', 6, 'What did the fall of the Soviet Union in 1991 demonstrate?',
  '[{"id": "a", "text": "That socialism can work if properly implemented"}, {"id": "b", "text": "That collectivism and central planning cannot sustain an economy or society"}, {"id": "c", "text": "That military defeat ended communism"}, {"id": "d", "text": "That communism was only bad because of Stalin"}]',
  'b',
  'The USSR collapsed because socialism cannot work. Without private property and market prices, central planners cannot allocate resources rationally. The Soviet economy was an economic and humanitarian disaster. Ideas have consequences—bad ideas have bad consequences.',
  '{"a": "The ''not real socialism'' argument ignores that socialism''s failures are inherent, not accidental.", "c": "The USSR wasn''t militarily defeated—it collapsed internally from economic failure.", "d": "Soviet problems persisted through all leaders. The system itself was the problem."}'),

-- ============================================================
-- AMERICAN EXCEPTIONALISM (Category: american_exceptionalism)
-- ============================================================

('american_exceptionalism', 3, 'What makes America philosophically unique among nations?',
  '[{"id": "a", "text": "Its military power"}, {"id": "b", "text": "It was founded on the principle that individuals have rights that government cannot violate"}, {"id": "c", "text": "Its size and natural resources"}, {"id": "d", "text": "Its cultural diversity"}]',
  'b',
  'America was the first nation founded on a philosophical idea: that individuals possess inherent rights to life, liberty, and the pursuit of happiness, and that government exists to protect—not grant—these rights. No other nation was founded on this explicit principle.',
  '{"a": "Military power is a consequence of American productivity, not its philosophical foundation.", "c": "Many nations have resources. Ideas made America able to use them productively.", "d": "Diversity exists elsewhere. The unifying IDEA of individual rights is unique."}'),

('american_exceptionalism', 4, 'What does "unalienable rights" mean in the Declaration of Independence?',
  '[{"id": "a", "text": "Rights that can be taken away by law"}, {"id": "b", "text": "Rights inherent in human nature that cannot be legitimately removed"}, {"id": "c", "text": "Rights given by the government"}, {"id": "d", "text": "Rights for citizens only"}]',
  'b',
  '"Unalienable" means these rights cannot be legitimately taken, transferred, or surrendered. They are inherent in human nature—not granted by government or society. Even if government violates them, they remain morally yours. This limits government power absolutely.',
  '{"a": "If rights could be taken by law, they wouldn''t be ''unalienable''—they''d be privileges.", "c": "Government doesn''t create rights—it can only recognize or violate pre-existing rights.", "d": "Natural rights apply to all humans by virtue of their humanity, not citizenship."}'),

('american_exceptionalism', 5, 'Why did the Founders create a republic rather than a pure democracy?',
  '[{"id": "a", "text": "They didn''t trust the common people"}, {"id": "b", "text": "To protect individual rights from majority tyranny"}, {"id": "c", "text": "Democracy wasn''t invented yet"}, {"id": "d", "text": "To benefit the wealthy"}]',
  'b',
  'The Founders understood that pure democracy—unlimited majority rule—could vote away minority rights. A republic limits government power through a constitution that protects individual rights regardless of majority opinion. Rights are not subject to vote.',
  '{"a": "The issue wasn''t distrust of people but protection FROM any group—majority or minority—violating rights.", "c": "Democracy dates to ancient Athens. The Founders deliberately rejected it.", "d": "Constitutional limits protect everyone''s rights, not just the wealthy''s."}'),

-- ============================================================
-- LAW - Objective law, rule of law (Category: law)
-- ============================================================

('law', 3, 'What is "objective law"?',
  '[{"id": "a", "text": "Law that judges can interpret flexibly"}, {"id": "b", "text": "Law that is clearly defined, knowable in advance, and applies equally to all"}, {"id": "c", "text": "Law based on the ruler''s will"}, {"id": "d", "text": "Law that changes with social conditions"}]',
  'b',
  'Objective law is clearly defined so citizens can know in advance what is prohibited, predictable in application, and applies equally to all—including government officials. Men can live and plan because they know the rules. Subjective law is tyranny by uncertainty.',
  '{"a": "Flexible interpretation makes law subjective—you can''t know if you''re complying.", "c": "Rule by the ruler''s will is the opposite: arbitrary power, not objective standards.", "d": "Law that constantly changes cannot be known in advance—making compliance impossible."}'),

('law', 4, 'What is the "rule of law" as opposed to "rule of men"?',
  '[{"id": "a", "text": "More laws are better than fewer"}, {"id": "b", "text": "Even rulers are bound by law; no one is above it"}, {"id": "c", "text": "Law enforcement should be strict"}, {"id": "d", "text": "Lawyers should run the government"}]',
  'b',
  'Rule of law means that objective legal principles—not the arbitrary will of rulers—govern society. Everyone, including the king, president, or majority, is bound by the same laws. Rule of men means someone''s whim determines outcomes—which is arbitrary power.',
  '{"a": "The number of laws is irrelevant. What matters is their objectivity and limits on power.", "c": "Strict enforcement of arbitrary laws is still tyranny.", "d": "Rule of law is a principle, not about who holds office."}'),

('law', 5, 'Why must law be based on protecting individual rights rather than promoting "social good"?',
  '[{"id": "a", "text": "Individual rights are selfish"}, {"id": "b", "text": "''Social good'' is undefined and can justify any violation of rights"}, {"id": "c", "text": "There is no such thing as society"}, {"id": "d", "text": "Social good is more important than rights"}]',
  'b',
  'The "social good" has no objective definition—it means whatever those in power say it means. It has justified slavery, genocide, and totalitarianism. Individual rights provide an objective, principled limit on what government (or majorities) may do to individuals.',
  '{"a": "Individual rights are the precondition for any genuine ''good''—for individuals or society.", "c": "Society exists as a collection of individuals—but it has no rights apart from individual rights.", "d": "Sacrificing individuals to ''social good'' IS the defining crime of collectivism."}'),

-- ============================================================
-- AESTHETICS - Art, beauty, values (Category: aesthetics)
-- ============================================================

('aesthetics', 2, 'What is the purpose of art according to rational aesthetics?',
  '[{"id": "a", "text": "To confuse and challenge viewers"}, {"id": "b", "text": "To concretize abstract values and make them perceptible"}, {"id": "c", "text": "To reflect society''s flaws"}, {"id": "d", "text": "To express random emotions"}]',
  'b',
  'Art concretizes abstractions—it gives perceptible form to abstract values and ideas. A heroic sculpture shows what courage looks like; a beautiful painting shows an ideal. Art makes philosophy visible, providing emotional fuel for living.',
  '{"a": "Confusion is not a value. Art should illuminate, not obscure.", "c": "Art CAN critique, but its highest purpose is presenting ideals—what SHOULD be.", "d": "Random emotions produce random results. Great art embodies coherent values."}'),

('aesthetics', 3, 'What makes music "beautiful" in objective terms?',
  '[{"id": "a", "text": "Whatever people like is beautiful"}, {"id": "b", "text": "Harmonic structure, melodic coherence, and integration of elements"}, {"id": "c", "text": "Novelty and breaking rules"}, {"id": "d", "text": "Commercial success"}]',
  'b',
  'Musical beauty involves objective elements: harmonic relationships, melodic development, rhythmic coherence, and integration into a unified whole. While response has a subjective component, the criteria for evaluating music are objective and learnable.',
  '{"a": "Popularity doesn''t equal quality. Many people like junk food but it''s not nutritious.", "c": "Breaking rules can be innovative OR just noise. Innovation must still create value.", "d": "Commercial success measures popularity, not aesthetic merit."}'),

('aesthetics', 4, 'What is "Romantic Realism" in art?',
  '[{"id": "a", "text": "Art about romantic relationships"}, {"id": "b", "text": "Art depicting the world as it could and should be, according to one''s values"}, {"id": "c", "text": "Fantasy art without rules"}, {"id": "d", "text": "Strictly copying nature"}]',
  'b',
  'Romantic Realism portrays the world as it could and should be—showing human potential and ideals while grounded in the real. It combines Realism''s commitment to depicting reality with Romanticism''s focus on values and human achievement.',
  '{"a": "The ''Romantic'' refers to the artistic movement emphasizing values, not romance novels.", "c": "Romantic Realism is grounded in reality and rationality, not arbitrary fantasy.", "d": "Mere copying (Naturalism) omits the selective, value-laden element essential to art."}'),

-- ============================================================
-- MUSIC - Philosophical content in songs (Category: music)
-- ============================================================

('music', 3, 'Why does "My Way" by Frank Sinatra embody individualist ethics?',
  '[{"id": "a", "text": "Because it''s a popular song"}, {"id": "b", "text": "It celebrates living by one''s own judgment and taking responsibility for choices"}, {"id": "c", "text": "It promotes isolation from others"}, {"id": "d", "text": "It rejects all authority"}]',
  'b',
  '"My Way" is an anthem of individualism: "I did it my way" celebrates living authentically by one''s own values and judgment, accepting both triumphs and regrets as one''s own. It''s about self-authorship of life, not isolation or rebellion.',
  '{"a": "Popularity doesn''t determine philosophical content.", "c": "The song doesn''t advocate isolation—it advocates authenticity in how you live.", "d": "It''s not about rejecting authority but about taking ownership of your life choices."}'),

('music', 4, 'What philosophical error does "Imagine" by John Lennon promote?',
  '[{"id": "a", "text": "None—it''s a perfect philosophy"}, {"id": "b", "text": "Collectivism and the elimination of private property"}, {"id": "c", "text": "Religious extremism"}, {"id": "d", "text": "Excessive individualism"}]',
  'b',
  '"Imagine no possessions" promotes the elimination of private property—a communist ideal that leads to poverty and tyranny. "No countries" eliminates the political entities that protect rights. While the melody is beautiful, the ideas are destructive.',
  '{"a": "The song promotes ideas that have caused mass suffering when implemented.", "c": "The song explicitly imagines ''no religion''—it''s anti-religious, not religiously extreme.", "d": "The song promotes the opposite: dissolving individual identity into a collective ''brotherhood.''"}'),

('music', 5, 'Why do many "protest songs" against capitalism philosophically self-refute?',
  '[{"id": "a", "text": "They don''t—they make valid points"}, {"id": "b", "text": "Artists profit from selling music in the capitalist system they condemn"}, {"id": "c", "text": "Protest songs are always artistic failures"}, {"id": "d", "text": "The music industry censors anti-capitalist messages"}]',
  'b',
  'Artists who write anti-capitalist songs, then sell them for profit, enjoy copyright protection, and become wealthy, are living contradictions. They condemn the system that enables their success. Their actions (trading value for value) contradict their stated beliefs.',
  '{"a": "The philosophical contradiction exists regardless of any other points made.", "c": "Some protest songs are artistically excellent—the issue is philosophical inconsistency.", "d": "The opposite is true—''anti-establishment'' sells well, proving capitalism serves even its critics."}'),

-- ============================================================
-- CINEMA - Philosophical content in films (Category: cinema)
-- ============================================================

('cinema', 3, 'Why is "The Fountainhead" (1949) philosophically significant?',
  '[{"id": "a", "text": "It was a box office hit"}, {"id": "b", "text": "It dramatizes the conflict between individualism and collectivism"}, {"id": "c", "text": "It has impressive special effects"}, {"id": "d", "text": "It criticizes capitalism"}]',
  'b',
  '"The Fountainhead" dramatizes Ayn Rand''s philosophy through architect Howard Roark: integrity vs. conformity, creation vs. parasitism, the individual vs. the collective. Roark refuses to compromise his vision for approval, embodying the heroic independent man.',
  '{"a": "Box office success doesn''t determine philosophical significance.", "c": "It''s a character-driven drama, not a special effects film.", "d": "The film DEFENDS individualism and implicitly capitalism—it doesn''t criticize them."}'),

('cinema', 4, 'What does the film "Gattaca" (1997) argue about human nature and determinism?',
  '[{"id": "a", "text": "Genetics completely determines destiny"}, {"id": "b", "text": "Human will and spirit can overcome genetic limitations"}, {"id": "c", "text": "Genetic engineering is entirely beneficial"}, {"id": "d", "text": "Nature is more important than nurture"}]',
  'b',
  '"Gattaca" shows Vincent, genetically "inferior," achieving his dreams through will, effort, and determination—while his genetically "superior" brother fails. The film affirms human agency and spirit over genetic determinism. Your choices matter more than your genes.',
  '{"a": "The entire plot refutes genetic determinism—Vincent succeeds despite ''inferior'' genes.", "c": "The film critiques a society that over-relies on genetic engineering.", "d": "The film argues the opposite: nurture (will, choices) transcends nature (genetics)."}'),

('cinema', 5, 'Why does "Atlas Shrugged" (the films) struggle to capture the novel''s ideas?',
  '[{"id": "a", "text": "The ideas are wrong"}, {"id": "b", "text": "Philosophy requires extensive dialogue and introspection difficult to film"}, {"id": "c", "text": "Hollywood deliberately sabotaged them"}, {"id": "d", "text": "The novel isn''t interesting"}]',
  'b',
  'Rand''s philosophical novels work through extensive internal monologue, lengthy speeches (Galt''s speech is 60 pages), and gradual development of complex ideas. Film is a visual medium suited to action, not extended philosophical exposition. The medium doesn''t fit the content.',
  '{"a": "Whether the ideas are right or wrong doesn''t explain the adaptation difficulty.", "c": "The films were independently produced by supporters of the novel.", "d": "The novel has millions of passionate readers—clearly it''s interesting to many."}'),

-- ============================================================
-- APPLIED PHILOSOPHY - Real-world applications (Category: applied)
-- ============================================================

('applied', 3, 'How does the "tragedy of the commons" illustrate the importance of property rights?',
  '[{"id": "a", "text": "Commons always work well"}, {"id": "b", "text": "Without private ownership, shared resources are overused and destroyed"}, {"id": "c", "text": "Private property causes tragedies"}, {"id": "d", "text": "Government should own all resources"}]',
  'b',
  'When no one owns a resource (common grazing land, fisheries), everyone has incentive to take as much as possible before others do—depleting the resource. Private ownership creates incentive to preserve and improve resources for long-term benefit.',
  '{"a": "Commons systematically fail because individual incentives misalign with collective sustainability.", "c": "Private property SOLVES the tragedy by aligning individual and resource interests.", "d": "Government ownership is just another form of commons, with the same perverse incentives."}'),

('applied', 4, 'Why do rent control policies fail to help those they intend to help?',
  '[{"id": "a", "text": "They don''t fail—they provide affordable housing"}, {"id": "b", "text": "They reduce housing supply by eliminating incentive to build or maintain"}, {"id": "c", "text": "Landlords are too greedy to comply"}, {"id": "d", "text": "The controls aren''t strict enough"}]',
  'b',
  'Rent control caps prices below market rates, eliminating profit incentive to build new housing or maintain existing units. Result: housing shortages, deteriorating buildings, and a black market. The policy harms renters by reducing available housing.',
  '{"a": "Every major study shows rent control reduces housing supply and quality.", "c": "Landlords respond rationally to incentives—if you remove profit, they stop investing.", "d": "Stricter controls worsen the problem by further eliminating incentives."}'),

('applied', 5, 'What is "cronyism" and why does it differ from capitalism?',
  '[{"id": "a", "text": "Cronyism is just another word for capitalism"}, {"id": "b", "text": "Cronyism is business using government force; capitalism forbids initiating force"}, {"id": "c", "text": "Cronyism helps small businesses"}, {"id": "d", "text": "Capitalism always leads to cronyism"}]',
  'b',
  'Cronyism (crony capitalism) is businesses using government to gain unfair advantages—subsidies, regulations that harm competitors, bailouts. True capitalism forbids government favoritism: all companies compete on merit in free markets. Cronyism is anti-capitalist.',
  '{"a": "Cronyism requires government intervention; capitalism requires government NON-intervention.", "c": "Cronyism helps connected businesses at the expense of smaller competitors.", "d": "Capitalism with strictly limited government prevents cronyism by removing government favors to sell."}'),

('applied', 6, 'Why is inflation a hidden tax?',
  '[{"id": "a", "text": "It''s not—inflation is natural"}, {"id": "b", "text": "Government printing money reduces purchasing power, transferring wealth to government"}, {"id": "c", "text": "Inflation helps savers"}, {"id": "d", "text": "Only deflation is harmful"}]',
  'b',
  'When government prints money, each dollar becomes worth less. Your savings buy less; your wages buy less. The government spends the new money at full value while you bear the cost. It''s taxation without legislation—and it hurts the poorest most.',
  '{"a": "Inflation is caused by government increasing money supply—it''s a policy choice, not nature.", "c": "Inflation destroys savers by reducing the value of their savings.", "d": "Both inflation and deflation can be harmful, but inflation is the more common government-caused problem."}'),

('applied', 7, 'What does "there''s no such thing as a free lunch" mean philosophically?',
  '[{"id": "a", "text": "Restaurants should charge for everything"}, {"id": "b", "text": "Every benefit has a cost—someone always pays"}, {"id": "c", "text": "Generosity is wrong"}, {"id": "d", "text": "Poor people don''t deserve help"}]',
  'b',
  'This principle recognizes that resources are scarce and every use has an opportunity cost. "Free" government programs are paid by taxes. "Free" benefits to one group are costs to another. Understanding this prevents the fantasy thinking behind bad policies.',
  '{"a": "It''s a metaphor about economics and policy, not literal restaurant advice.", "c": "Voluntary generosity is fine—the point is that SOMEONE pays, even for gifts.", "d": "The principle says nothing about who deserves what—only that costs exist."}');

-- ============================================================
-- ADDITIONAL DIFFICULTY 8-10 QUESTIONS (Expert level)
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, correct_answer, explanation, wrong_explanations) VALUES

('epistemology', 8, 'What is the "stolen concept" fallacy?',
  '[{"id": "a", "text": "Using words without defining them"}, {"id": "b", "text": "Using a concept while denying the concepts on which it depends"}, {"id": "c", "text": "Copying someone else''s ideas"}, {"id": "d", "text": "Using technical jargon to confuse"}]',
  'b',
  'The stolen concept fallacy uses a concept while denying its foundations. Example: "There is no truth" steals "truth" while denying it. "Rights don''t exist" uses "rights" in making the claim. The denial presupposes what it denies.',
  '{"a": "Vagueness is a different problem. Stolen concept is more specific.", "c": "That would be plagiarism, not a logical fallacy.", "d": "Obfuscation is a rhetorical tactic, not this specific fallacy."}'),

('metaphysics', 8, 'What is the "fallacy of reification" (or hypostatization)?',
  '[{"id": "a", "text": "Treating concrete things as abstract"}, {"id": "b", "text": "Treating an abstraction as if it were a concrete entity with causal powers"}, {"id": "c", "text": "Using too many abstract concepts"}, {"id": "d", "text": "Failing to abstract from concretes"}]',
  'b',
  'Reification treats abstractions as if they were concrete things that can act. "Society demands" or "History shows" treat society and history as agents. But only individuals act. Abstractions are mental tools, not entities with causal power.',
  '{"a": "That would be the opposite error.", "c": "Using abstractions is proper; treating them as concrete entities is the error.", "d": "Failure to abstract is an epistemological weakness, not this specific fallacy."}'),

('ethics', 8, 'What is "psychological egoism" and why is it false?',
  '[{"id": "a", "text": "The view that people should be selfish"}, {"id": "b", "text": "The claim that people always act selfishly, which is unfalsifiable"}, {"id": "c", "text": "A correct description of human nature"}, {"id": "d", "text": "The opposite of ethical egoism"}]',
  'b',
  'Psychological egoism claims people ALWAYS act selfishly—even apparent altruism is "really" selfish. This is unfalsifiable: any counter-example is re-interpreted as secret selfishness. It empties "selfish" of meaning. Ethical egoism (people SHOULD pursue self-interest) is different.',
  '{"a": "That''s ethical egoism (a normative claim), not psychological egoism (a descriptive claim).", "c": "Being unfalsifiable means it''s not a testable scientific claim.", "d": "They''re related but different: one describes, one prescribes."}'),

('politics', 8, 'What is the "fatal conceit" according to F.A. Hayek?',
  '[{"id": "a", "text": "Believing in individual rights"}, {"id": "b", "text": "Assuming central planners can possess the dispersed knowledge needed to run an economy"}, {"id": "c", "text": "Supporting free markets"}, {"id": "d", "text": "Trusting democratic processes"}]',
  'b',
  'Hayek''s "fatal conceit" is the belief that a central authority can possess the knowledge dispersed among millions of individuals and coordinate economic activity better than markets. This knowledge is local, tacit, and constantly changing—no planner can access it.',
  '{"a": "Hayek defended individual rights—that''s not the conceit.", "c": "Hayek championed free markets against the fatal conceit of planning.", "d": "Democracy is separate from economic planning."}'),

('history', 8, 'What philosophical error did the Weimar Republic''s constitution make that enabled Hitler?',
  '[{"id": "a", "text": "Too much protection of individual rights"}, {"id": "b", "text": "Article 48 allowed emergency suspension of rights, enabling dictatorship"}, {"id": "c", "text": "Not enough democratic participation"}, {"id": "d", "text": "Too much capitalism"}]',
  'b',
  'Article 48 allowed the president to suspend civil liberties in emergencies. Hitler used this "emergency power" to legally abolish rights after the Reichstag fire. Constitutional rights that can be suspended aren''t rights—they''re permissions.',
  '{"a": "The problem was that rights COULD be suspended, not that they were too protected.", "c": "Germany had extensive democracy—the problem was inadequate constitutional limits.", "d": "Weimar Germany had extensive government intervention, not laissez-faire capitalism."}'),

('economics', 8, 'What is "regulatory capture"?',
  '[{"id": "a", "text": "When regulations become too strict"}, {"id": "b", "text": "When regulated industries control the agencies meant to regulate them"}, {"id": "c", "text": "When government captures private businesses"}, {"id": "d", "text": "When regulations are properly enforced"}]',
  'b',
  'Regulatory capture occurs when regulatory agencies come to serve the interests of the industries they regulate rather than the public. Industries influence regulations to harm competitors and benefit themselves—turning regulation into a tool of cronyism.',
  '{"a": "Strictness isn''t the issue—it''s WHO benefits from the regulations.", "c": "Capture is subtler: the industry controls the regulator without formal ownership.", "d": "Captured regulations are enforced to benefit the industry, not the public."}'),

('quotes', 8, 'Who wrote: "In the long run we are all dead"?',
  '[{"id": "a", "text": "Adam Smith"}, {"id": "b", "text": "John Maynard Keynes"}, {"id": "c", "text": "Milton Friedman"}, {"id": "d", "text": "Karl Marx"}]',
  'b',
  'Keynes wrote this dismissing concerns about long-term consequences of his policies. This captures the short-term thinking of Keynesian economics—spend now, worry later. The quip reveals a philosophy that discounts future consequences, enabling destructive policies.',
  '{"a": "Smith was concerned with long-term wealth creation, not dismissing the future.", "c": "Friedman criticized this attitude and Keynesian economics generally.", "d": "Marx focused on historical inevitability, not dismissing the long run."}'),

('applied', 8, 'Why do minimum wage laws cause unemployment among the least skilled?',
  '[{"id": "a", "text": "They don''t—minimum wage only helps workers"}, {"id": "b", "text": "If a worker produces less value than the minimum wage, hiring them is a loss"}, {"id": "c", "text": "Employers are too greedy to pay fair wages"}, {"id": "d", "text": "The minimum wage is always set too high"}]',
  'b',
  'If minimum wage is $15/hour but a worker''s productivity is worth $10/hour, hiring them means losing $5/hour. Employers won''t take that loss—so that worker remains unemployed. Minimum wage laws don''t raise wages; they outlaw employment below a certain productivity.',
  '{"a": "Basic economics and empirical studies show minimum wage increases unemployment among low-skilled workers.", "c": "''Greed'' doesn''t explain economics. Businesses can''t sustainably pay more than workers produce.", "d": "ANY minimum wage above market equilibrium causes some unemployment—it''s the principle."}'),

('virtues', 8, 'Why is "justice" a selfish virtue?',
  '[{"id": "a", "text": "Justice means getting more than others"}, {"id": "b", "text": "Judging others objectively protects you from frauds and helps you find value"}, {"id": "c", "text": "Justice is about punishing enemies"}, {"id": "d", "text": "Justice is actually selfless, not selfish"}]',
  'b',
  'Justice—objectively judging character and granting to each what they deserve—serves your self-interest. It helps you identify honest traders (to your benefit) and frauds (avoiding harm). Refusing to judge leaves you vulnerable to exploitation.',
  '{"a": "Justice is about accurate evaluation, not gaining advantage through judgment.", "c": "Justice includes rewarding the good, not just punishing the bad.", "d": "All genuine virtues are selfish in the proper sense—they serve your life."}'),

('metaphysics', 9, 'What is the "is-ought problem" and how is it resolved?',
  '[{"id": "a", "text": "You can never derive ought from is"}, {"id": "b", "text": "Recognizing that ''ought'' depends on ''is''—specifically, on what human life requires"}, {"id": "c", "text": "Facts and values are completely separate"}, {"id": "d", "text": "The problem has no solution"}]',
  'b',
  'Hume noted you can''t derive "ought" from "is" without a value premise. The solution: the value premise is LIFE. Given that life requires certain actions, and humans choose to live, facts about what sustains life generate binding "oughts." Values are objective.',
  '{"a": "You CAN derive ought from is once you identify life as the standard of value.", "c": "Facts about life requirements determine values—they''re not separate.", "d": "Identifying life as the standard resolves the problem."}'),

('epistemology', 9, 'What is the "Münchhausen trilemma" and how does Objectivism address it?',
  '[{"id": "a", "text": "It proves knowledge is impossible"}, {"id": "b", "text": "It shows that foundations of knowledge must be axiomatic, not derived"}, {"id": "c", "text": "It supports infinite regress of justification"}, {"id": "d", "text": "It proves circular reasoning is valid"}]',
  'b',
  'The trilemma: justifying knowledge leads to infinite regress, circular reasoning, or stopping at axioms. Objectivism embraces axioms—self-evident truths (existence, identity, consciousness) that cannot be denied without using them. They''re the proper foundation.',
  '{"a": "The trilemma doesn''t prove impossibility—it identifies the need for axioms.", "c": "Infinite regress is one horn of the trilemma, not a solution.", "d": "Circular reasoning is another horn—also not a solution. Axioms are the answer."}'),

('politics', 9, 'What is "anarcho-capitalism" and why do Objectivists reject it?',
  '[{"id": "a", "text": "It''s the same as Objectivism"}, {"id": "b", "text": "It proposes competing private defense agencies, but this enables force initiation without objective resolution"}, {"id": "c", "text": "It has too much government"}, {"id": "d", "text": "Objectivists support anarcho-capitalism"}]',
  'b',
  'Anarcho-capitalism proposes private competing defense agencies with no government. Objectivists reject this: without a single authority on retaliatory force, conflicts between agencies have no objective resolution—leading to gang warfare, not rights protection.',
  '{"a": "Objectivism supports limited government, not no government.", "c": "Anarcho-capitalism has NO government—that''s the issue.", "d": "Rand explicitly criticized anarchism as ''naive'' and ''floating abstraction.''"}'),

('history', 9, 'Why did the American Founders include the Second Amendment?',
  '[{"id": "a", "text": "For hunting rights"}, {"id": "b", "text": "To ensure the people could resist tyrannical government"}, {"id": "c", "text": "For sport shooting"}, {"id": "d", "text": "To support the military"}]',
  'b',
  'The Second Amendment exists to preserve the people''s ability to resist tyranny—whether from their own government or foreign invasion. An armed citizenry is the final check on government power. The Founders had just fought a war against tyranny and wanted to ensure it could be done again if necessary.',
  '{"a": "Hunting rights were so obvious they needed no amendment. The purpose was political.", "c": "Sport shooting wasn''t the Founders'' concern in creating constitutional protections.", "d": "The militia clause refers to citizen soldiers, not professional military."}'),

('aesthetics', 9, 'What is the difference between "sense of life" and explicit philosophy in art?',
  '[{"id": "a", "text": "They are the same thing"}, {"id": "b", "text": "Sense of life is an emotional sum of subconscious value-responses; philosophy is explicit conceptual beliefs"}, {"id": "c", "text": "Sense of life is more important"}, {"id": "d", "text": "Explicit philosophy is irrelevant to art"}]',
  'b',
  'Sense of life is a pre-conceptual, emotional sum reflecting one''s implicit view of existence—optimistic or pessimistic, benevolent or malevolent. It shapes artistic preferences before explicit philosophy. Art can project a sense of life that contradicts an artist''s stated views.',
  '{"a": "They often align but can conflict—someone may profess pessimism yet respond to heroic art.", "c": "Both matter: sense of life shapes response; philosophy enables evaluation.", "d": "Explicit philosophy is essential for evaluating art, even if sense of life shapes initial response."}');
